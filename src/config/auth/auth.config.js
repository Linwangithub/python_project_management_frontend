/**
 * 认证状态配置。
 *
 * 作用：
 * - 集中维护认证 store 使用的本地存储 key、默认角色和提示文案。
 * - 认证 store 只负责状态流转，不直接维护固定字符串。
 */

/** 当前用户信息在 localStorage 中的 key。 */
export const USER_STORAGE_KEY = 'pspm_user'

/** 当前用户权限快照在 localStorage 中的 key。 */
export const PERMISSION_STORAGE_KEY = 'pspm_permissions'

/** 系统超级管理员角色 key。 */
export const ROOT_ROLE_KEY = 'root'

/** 普通用户角色 key。 */
export const USER_ROLE_KEY = 'user'

/** 认证流程提示文案。 */
export const AUTH_MESSAGES = {
  TOKEN_MISSING: '登录失败：未获取到访问令牌',
  PROFILE_LOAD_FAILED: '登录失败，无法获取权限信息',
  LOGIN_FAILED: '登录失败',
  REGISTER_SUCCESS: '注册成功，请登录',
  REGISTER_FAILED: '注册失败',
  USERNAME_REQUIRED: '请输入账号',
  PASSWORD_REQUIRED: '请输入密码',
  LOGIN_SUCCESS: '登录成功',
  ACCOUNT_NOT_EXISTS: '该账号不存在',
  SESSION_EXPIRED: '登录状态已失效',
}


/** Login/register view text. */
export const AUTH_VIEW_TEXT = {
  loginTab: '账号登录',
  registerTab: '注册账号',
  usernameLabel: '账号',
  passwordLabel: '密码',
  usernamePlaceholder: '请输入账号',
  newUsernamePlaceholder: '请输入新账号',
  passwordPlaceholder: '请输入密码',
  loginButton: '登录',
  registerButton: '注册',
}
