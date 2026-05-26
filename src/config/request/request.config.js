/**
 * HTTP 请求配置。
 *
 * 作用：
 * - 集中维护 token 存储 key、请求超时、鉴权头名称和默认错误文案。
 * - API 请求工具只负责执行请求和解析错误，不维护固定配置。
 */

/** 登录成功后保存 access token 的 localStorage key。 */
export const TOKEN_STORAGE_KEY = 'pspm_token'

/** Axios（HTTP 请求库）默认超时时间，单位毫秒。 */
export const REQUEST_TIMEOUT_MS = 15000

/** HTTP 鉴权请求头名称。 */
export const AUTHORIZATION_HEADER = 'Authorization'

/** Bearer token 前缀。 */
export const BEARER_TOKEN_PREFIX = 'Bearer'

/** 后端没有返回可读错误时使用的兜底提示。 */
export const DEFAULT_REQUEST_ERROR_MESSAGE = '请求失败'
