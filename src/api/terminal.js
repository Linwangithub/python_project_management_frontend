import { API_BASE_URL, TOKEN_STORAGE_KEY, request } from '@/utils/request'

/**
 * 终端 WebSocket 子协议名称。
 *
 * 作用：
 * - 创建终端 WebSocket 连接时作为浏览器和后端约定的协议标识。
 * - 后端通过该标识区分普通 WebSocket 与 PSPM 终端会话。
 */
export const TERMINAL_WS_PROTOCOL = 'pspm-terminal'

/**
 * 读取终端 WebSocket 鉴权令牌。
 *
 * 来源：
 * - 登录成功后保存到 localStorage 中的 token。
 *
 * 返回：
 * - token 字符串；未登录或本地没有 token 时返回空字符串。
 */
export const getTerminalWsToken = () => window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''

/**
 * 根据 HTTP API base URL 推导 WebSocket base URL。
 *
 * 作用：
 * - API 使用 http/https 时，终端 WebSocket 自动切换为 ws/wss。
 * - API 使用相对路径时，自动复用当前页面的 protocol 和 host。
 *
 * 返回：
 * - 可拼接终端 WebSocket 路径的 base URL。
 */
const buildWsBaseUrl = () => {
  const base = API_BASE_URL || ''

  if (base.startsWith('https://')) return base.replace(/^https:\/\//, 'wss://')
  if (base.startsWith('http://')) return base.replace(/^http:\/\//, 'ws://')

  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${base}`
}

/**
 * 构建终端 WebSocket 完整连接地址。
 *
 * 参数：
 * - token：登录令牌，默认从 localStorage 读取。
 *
 * 返回：
 * - `/pspm/terminal/ws` 的 WebSocket URL；有 token 时追加 query 参数。
 */
export const buildTerminalWsUrl = (token = getTerminalWsToken()) => {
  const baseUrl = `${buildWsBaseUrl().replace(/\/$/, '')}/pspm/terminal/ws`
  const safeToken = String(token || '').trim()

  if (!safeToken) return baseUrl

  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}token=${encodeURIComponent(safeToken)}`
}

/**
 * 构建浏览器原生下载地址。
 *
 * 参数：
 * - ticket：后端生成的一次性下载凭证。
 *
 * 返回：
 * - 可直接赋值给隐藏 a 标签的下载 URL。
 */
export const buildTerminalDirectDownloadUrl = (ticket) => {
  const baseUrl = `${API_BASE_URL.replace(/\/$/, '')}/pspm/terminal/download-direct`
  return `${baseUrl}?ticket=${encodeURIComponent(String(ticket || ''))}`
}

/**
 * 终端相关 HTTP API。
 *
 * 说明：
 * - WebSocket 负责实时终端输入输出。
 * - HTTP 接口负责会话创建、文件上传下载、路径浏览、旧版执行兼容等请求。
 */
export const terminalApi = {
  /** 查询当前用户可连接的服务器列表。 */
  listServers() {
    return request.get('/pspm/terminal/servers')
  },

  /** 创建一个后端终端会话记录。 */
  createSession(payload) {
    return request.post('/pspm/terminal/sessions/create', payload)
  },

  /**
   * 兼容旧版命令执行接口。
   *
   * 新终端交互优先走 WebSocket；该接口保留给历史调用链路兜底。
   */
  execute(payload) {
    return request.post('/pspm/terminal/execute', payload)
  },

  /**
   * 兼容旧版 Tab 补全接口。
   *
   * 当前 Tab 补全优先使用 WebSocket complete 消息；该接口保留给历史调用链路兜底。
   */
  complete(payload) {
    return request.post('/pspm/terminal/complete', payload)
  },

  /** 关闭指定终端会话。 */
  closeSession(payload) {
    return request.post('/pspm/terminal/sessions/close', payload)
  },

  /** 上传文件到当前终端会话所在服务器。 */
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

  /**
   * 兼容旧版 Blob 下载接口。
   *
   * 当前目录下载优先走 direct download，避免等待完整响应后才触发浏览器下载。
   */
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

  /** 创建一次性下载凭证，供浏览器原生下载使用。 */
  createDownloadTicket(payload) {
    return request.post('/pspm/terminal/download-ticket', null, {
      params: {
        session_id: payload.session_id || '',
        path: payload.path || '',
      },
    })
  },

  /** 浏览当前终端会话下的远程文件或目录。 */
  listPath(payload) {
    return request.get('/pspm/terminal/list-path', {
      params: {
        session_id: payload.session_id || '',
        path: payload.path || '',
      },
    })
  },
}
