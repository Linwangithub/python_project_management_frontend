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

export const buildTerminalDirectDownloadUrl = (ticket) => {
  const baseUrl = `${API_BASE_URL.replace(/\/$/, '')}/pspm/terminal/download-direct`
  return `${baseUrl}?ticket=${encodeURIComponent(String(ticket || ''))}`
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
    // ?????????????? Tab ????? WebSocket complete ???
    return request.post('/pspm/terminal/complete', payload)
  },

  closeSession(payload) {
    return request.post('/pspm/terminal/sessions/close', payload)
  },

  upload(payload) {
    const formData = new FormData()
    formData.append('session_id', payload.session_id || '')
    formData.append('target_path', payload.target_path || '')
    formData.append('relative_path', payload.relative_path || '')
    formData.append('file', payload.file)
    return request.post('/pspm/terminal/upload', formData, {
      timeout: 0,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  download(payload) {
    return request.get('/pspm/terminal/download', {
      params: {
        session_id: payload.session_id || '',
        path: payload.path || '',
      },
      responseType: 'blob',
      timeout: 0,
    })
  },

  createDownloadTicket(payload) {
    return request.post('/pspm/terminal/download-ticket', null, {
      params: {
        session_id: payload.session_id || '',
        path: payload.path || '',
      },
    })
  },

  listPath(payload) {
    return request.get('/pspm/terminal/list-path', {
      params: {
        session_id: payload.session_id || '',
        path: payload.path || '',
      },
    })
  },
}
