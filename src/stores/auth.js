import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { TOKEN_STORAGE_KEY, getErrorMessage } from '@/utils/request'
import {
  AUTH_MESSAGES,
  PERMISSION_STORAGE_KEY,
  ROOT_ROLE_KEY,
  USER_ROLE_KEY,
  USER_STORAGE_KEY,
} from '@/config/auth/auth.config'

/**
 * 安全解析 JSON。
 *
 * 参数：
 * - text：localStorage 中保存的原始字符串。
 * - fallback：解析失败时返回的兜底值。
 *
 * 返回：
 * - 解析结果或 fallback。
 */
const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/**
 * 将后端角色数组规整成当前前端使用的单角色 key。
 *
 * 参数：
 * - roles：后端权限快照中的角色 key 数组。
 *
 * 返回：
 * - root 或 user。
 */
const normalizeRole = (roles = []) => (Array.isArray(roles) && roles.includes(ROOT_ROLE_KEY) ? ROOT_ROLE_KEY : USER_ROLE_KEY)

/**
 * 将权限快照转换为 menuKey -> actionSet 的映射。
 *
 * 参数：
 * - snapshot：后端 /my-permissions 返回的权限快照。
 *
 * 返回：
 * - 便于 hasAction 快速判断的权限映射对象。
 */
const createPermissionMap = (snapshot) => {
  const map = {}
  Object.keys(snapshot?.permissions || {}).forEach((menuKey) => {
    map[menuKey] = new Set(snapshot.permissions[menuKey] || [])
  })
  return map
}

/**
 * 认证状态 Store。
 *
 * 作用：
 * - 维护登录 token、当前用户、角色和权限快照。
 * - 提供菜单权限、动作权限、登录、注册、登出、登录态恢复等能力。
 */
export const useAuthStore = defineStore('auth', () => {
  /** 当前访问令牌。 */
  const token = ref(window.localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  /** 当前登录用户信息。 */
  const user = ref(parseJson(window.localStorage.getItem(USER_STORAGE_KEY), null))
  /** 当前用户权限快照。 */
  const permissionSnapshot = ref(parseJson(window.localStorage.getItem(PERMISSION_STORAGE_KEY), null))
  /** 当前用户动作权限映射。 */
  const permissionMap = ref(createPermissionMap(permissionSnapshot.value))

  /** 当前角色，未登录时默认为普通用户。 */
  const role = computed(() => user.value?.role || USER_ROLE_KEY)
  /** 当前可见菜单集合。 */
  const menuPermissions = computed(() => new Set(permissionSnapshot.value?.menus || []))

  /** 判断指定菜单是否可见。 */
  const hasMenu = (menuKey) => menuPermissions.value.has(menuKey)

  /** 判断指定菜单动作是否可用。 */
  const hasAction = (menuKey, actionKey) => {
    if (!actionKey) return hasMenu(menuKey)
    const set = permissionMap.value[menuKey]
    return !!set && set.has(actionKey)
  }

  /** 将 token、用户信息和权限快照保存到 localStorage。 */
  const saveLocal = () => {
    if (token.value) window.localStorage.setItem(TOKEN_STORAGE_KEY, token.value)
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY)

    if (user.value) window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value))
    else window.localStorage.removeItem(USER_STORAGE_KEY)

    if (permissionSnapshot.value) {
      window.localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(permissionSnapshot.value))
    } else {
      window.localStorage.removeItem(PERMISSION_STORAGE_KEY)
    }
  }

  /** 拉取当前用户资料和权限快照，并刷新本地状态。 */
  const loadProfile = async () => {
    const [meResp, permResp] = await Promise.all([authApi.me(), authApi.myPermissions()])
    const me = meResp.data?.data
    const perms = permResp.data?.data

    user.value = {
      id: me.id,
      userid: me.userid,
      username: me.username,
      role: normalizeRole(perms?.roles || []),
      projectBasePath: me.project_base_path || '',
      projectRootBasePath: me.project_root_base_path || '',
      projectUserBasePathTemplate: me.project_user_base_path_template || '',
    }
    permissionSnapshot.value = perms
    permissionMap.value = createPermissionMap(perms)
    saveLocal()
  }

  /**
   * 登录并加载用户资料。
   *
   * 参数：
   * - payload：登录表单数据。
   *
   * 返回：
   * - { ok, message? } 登录结果。
   */
  const login = async (payload) => {
    try {
      const resp = await authApi.login(payload)
      const nextToken = resp.data?.data?.access_token || ''
      if (!nextToken) {
        return { ok: false, message: AUTH_MESSAGES.TOKEN_MISSING }
      }

      token.value = nextToken
      saveLocal()

      try {
        await loadProfile()
        return { ok: true }
      } catch (error) {
        logout()
        return { ok: false, message: getErrorMessage(error, AUTH_MESSAGES.PROFILE_LOAD_FAILED) }
      }
    } catch (error) {
      logout()
      return { ok: false, message: getErrorMessage(error, AUTH_MESSAGES.LOGIN_FAILED) }
    }
  }

  /** 注册新账号。 */
  const register = async (payload) => {
    try {
      const resp = await authApi.register(payload)
      return { ok: true, message: resp.data?.message || AUTH_MESSAGES.REGISTER_SUCCESS }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error, AUTH_MESSAGES.REGISTER_FAILED) }
    }
  }

  /** 清空登录态并同步清理本地存储。 */
  const logout = () => {
    token.value = ''
    user.value = null
    permissionSnapshot.value = null
    permissionMap.value = {}
    saveLocal()
  }

  /** 页面刷新后尝试恢复登录态。 */
  const restore = async () => {
    if (!token.value) return
    const result = await loadProfile().then(
      () => ({ ok: true }),
      (error) => ({ ok: false, message: getErrorMessage(error, AUTH_MESSAGES.SESSION_EXPIRED) }),
    )
    if (!result.ok) logout()
  }

  return {
    token,
    user,
    role,
    permissionSnapshot,
    hasMenu,
    hasAction,
    login,
    register,
    logout,
    restore,
  }
})
