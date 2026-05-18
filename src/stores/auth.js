import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { TOKEN_STORAGE_KEY, getErrorMessage } from '@/utils/request'

const USER_STORAGE_KEY = 'pspm_user'
const PERMISSION_STORAGE_KEY = 'pspm_permissions'

const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

const normalizeRole = (roles = []) => (Array.isArray(roles) && roles.includes('root') ? 'root' : 'user')

const createPermissionMap = (snapshot) => {
  const map = {}
  Object.keys(snapshot?.permissions || {}).forEach((menuKey) => {
    map[menuKey] = new Set(snapshot.permissions[menuKey] || [])
  })
  return map
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(window.localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const user = ref(parseJson(window.localStorage.getItem(USER_STORAGE_KEY), null))
  const permissionSnapshot = ref(parseJson(window.localStorage.getItem(PERMISSION_STORAGE_KEY), null))
  const permissionMap = ref(createPermissionMap(permissionSnapshot.value))

  const role = computed(() => user.value?.role || 'user')
  const menuPermissions = computed(() => new Set(permissionSnapshot.value?.menus || []))

  const hasMenu = (menuKey) => menuPermissions.value.has(menuKey)

  const hasAction = (menuKey, actionKey) => {
    if (!actionKey) return hasMenu(menuKey)
    const set = permissionMap.value[menuKey]
    return !!set && set.has(actionKey)
  }

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

  const login = async (payload) => {
    try {
      const resp = await authApi.login(payload)
      const nextToken = resp.data?.data?.access_token || ''
      if (!nextToken) {
        return { ok: false, message: '登录失败：未获取到访问令牌' }
      }

      token.value = nextToken
      saveLocal()

      try {
        await loadProfile()
        return { ok: true }
      } catch (error) {
        logout()
        return { ok: false, message: getErrorMessage(error, '登录失败，无法获取权限信息') }
      }
    } catch (error) {
      logout()
      return { ok: false, message: getErrorMessage(error, '登录失败') }
    }
  }

  const register = async (payload) => {
    try {
      const resp = await authApi.register(payload)
      return { ok: true, message: resp.data?.message || '注册成功，请登录' }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error, '注册失败') }
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    permissionSnapshot.value = null
    permissionMap.value = {}
    saveLocal()
  }

  const restore = async () => {
    if (!token.value) return
    const result = await loadProfile().then(
      () => ({ ok: true }),
      (error) => ({ ok: false, message: getErrorMessage(error, '登录状态已失效') }),
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
