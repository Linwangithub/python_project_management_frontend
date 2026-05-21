import { API_BASE_URL, TOKEN_STORAGE_KEY, request } from '@/utils/request'

export const TERMINAL_WS_PROTOCOL = 'pspm-terminal'

export const getTerminalWsToken = () => window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''

const buildWsBaseUrl = () => {
  const base = API_BASE_URL || ''
  if (base.startsWith('https://')) return base.replace(/^https:\/\//, 'wss://')
  if (base.startsWith('http://')) return base.replace(/^http:\/\//, 'ws://')
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${base}`
}

export const buildTerminalWsUrl = (token = getTerminalWsToken()) => {
  const baseUrl = `${buildWsBaseUrl().replace(/\/$/, '')}/pspm/terminal/ws`
  const safeToken = String(token || '').trim()
  if (!safeToken) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}token=${encodeURIComponent(safeToken)}`
}

export const terminalApi = {
  listServers() {
    return request.get('/pspm/terminal/servers')
  },

  createSession(payload) {
    return request.post('/pspm/terminal/sessions/create', payload)
  },

  execute(payload) {
    return request.post('/pspm/terminal/execute', payload)
  },

  complete(payload) {
    return request.post('/pspm/terminal/complete', payload)
  },

  closeSession(payload) {
    return request.post('/pspm/terminal/sessions/close', payload)
  },
}
