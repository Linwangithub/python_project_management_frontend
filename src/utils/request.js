import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'pspm_token'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.31.187:8888/api'

export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

const firstMessage = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return firstMessage(value[0])
  if (typeof value === 'object') return value.message || value.msg || value.detail || ''
  return ''
}

export const getErrorMessage = (error, fallback = '请求失败') => {
  const data = error?.response?.data
  const message = firstMessage(data?.message)
  if (message) return message

  const detail = firstMessage(data?.detail)
  if (detail) return detail

  const dataMessage = firstMessage(data?.data)
  if (dataMessage) return dataMessage

  return error?.message || fallback
}
