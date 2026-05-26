import { request } from '@/utils/request'

/**
 * 认证与当前用户 API 适配器。
 *
 * 作用：
 * - 集中维护登录、注册、个人信息、权限快照接口。
 * - 页面和 Pinia store 只依赖本适配器，不直接拼接认证接口路径。
 */
export const authApi = {
  /** 登录并获取 access token。 */
  login(payload) {
    return request.post('/login', payload)
  },

  /** 注册普通用户账号。 */
  register(payload) {
    return request.post('/register', payload)
  },

  /** 查询当前登录用户资料。 */
  me() {
    return request.get('/user/me')
  },

  /** 查询当前登录用户的菜单和动作权限快照。 */
  myPermissions() {
    return request.get('/rbac/permissions/me')
  },
}
