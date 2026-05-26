import axios from 'axios'
import { API_BASE_URL } from '@/config/runtime/network.config'
import {
  AUTHORIZATION_HEADER,
  BEARER_TOKEN_PREFIX,
  DEFAULT_REQUEST_ERROR_MESSAGE,
  REQUEST_TIMEOUT_MS,
  TOKEN_STORAGE_KEY,
} from '@/config/request/request.config'

export { TOKEN_STORAGE_KEY }

/**
 * 重新导出 API base URL。
 *
 * 来源：
 * - `src/config/runtime/network.config.js`
 *
 * 作用：
 * - 旧调用方仍可以从 request 模块读取 API_BASE_URL。
 */
export { API_BASE_URL }

/**
 * Axios 请求实例。
 *
 * 作用：
 * - 统一 baseURL、超时时间和鉴权请求头。
 * - 所有业务 API 模块都应该复用该实例，避免重复配置。
 */
export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

/**
 * 请求拦截器：自动注入 Bearer Token。
 *
 * 参数：
 * - config：Axios 请求配置。
 *
 * 返回：
 * - 已追加 Authorization 请求头的配置对象。
 */
request.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers[AUTHORIZATION_HEADER] = `${BEARER_TOKEN_PREFIX} ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

/**
 * 从任意错误响应片段中提取第一条可读消息。
 *
 * 参数：
 * - value：可能是字符串、数组、对象或空值。
 *
 * 返回：
 * - 可展示给用户的错误消息；无法提取时返回空字符串。
 */
const firstMessage = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return firstMessage(value[0])
  if (typeof value === 'object') return value.message || value.msg || value.detail || ''
  return ''
}

/**
 * 统一提取接口错误提示。
 *
 * 参数：
 * - error：Axios 错误对象。
 * - fallback：无法解析后端错误时使用的兜底提示。
 *
 * 返回：
 * - 优先级：message -> detail -> data -> error.message -> fallback。
 */
export const getErrorMessage = (error, fallback = DEFAULT_REQUEST_ERROR_MESSAGE) => {
  const data = error?.response?.data
  const message = firstMessage(data?.message)
  if (message) return message

  const detail = firstMessage(data?.detail)
  if (detail) return detail

  const dataMessage = firstMessage(data?.data)
  if (dataMessage) return dataMessage

  return error?.message || fallback
}
