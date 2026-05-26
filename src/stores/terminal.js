import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TERMINAL_DEFAULT_HOME_DIR } from '@/config/project/project.paths.config'
import {
  TERMINAL_DEFAULT_CONDA_ENV,
  TERMINAL_DEFAULT_HOST_LABEL,
  TERMINAL_DEFAULT_SESSION_ALIAS,
  TERMINAL_DEFAULT_USER_ID,
  TERMINAL_OUTPUT_LINE_LIMIT,
  TERMINAL_PROMPT_USER,
  TERMINAL_STORE_STORAGE_PREFIX,
  TERMINAL_WS_MESSAGE_TYPES,
} from '@/config/terminal/terminal.session.config'
import {
  ANSI_ESCAPE_PATTERN,
  CONTROL_CHAR_PATTERN,
  OSC_ESCAPE_PATTERN,
  REPLACEMENT_CHARACTER,
  RESIDUAL_TERMINAL_CONTROL_PATTERN,
} from '@/config/terminal/terminal.sanitize.config'
import { terminalMessages } from '@/config/terminal/terminal.messages.config'

/** 终端会话默认工作目录，来自项目路径配置。 */
const HOME_DIR = TERMINAL_DEFAULT_HOME_DIR

/** ANSI escape 序列清洗正则，移除颜色、光标移动和 bracketed paste 等控制序列。 */
const ANSI_ESCAPE_RE = new RegExp(ANSI_ESCAPE_PATTERN, 'g')

/** OSC escape 序列清洗正则，移除远程 shell 写入的窗口标题控制序列。 */
const OSC_ESCAPE_RE = new RegExp(OSC_ESCAPE_PATTERN, 'g')

/** 不可见控制字符清洗正则，保留换行但移除 ESC、BEL、退格等不可见字符。 */
const CONTROL_CHAR_RE = new RegExp(CONTROL_CHAR_PATTERN, 'g')

/** 残留控制文本清洗正则，用于处理已被浏览器隐藏 ESC 后剩下的可见控制文本。 */
const RESIDUAL_TERMINAL_CONTROL_RE = new RegExp(RESIDUAL_TERMINAL_CONTROL_PATTERN, 'g')

/**
 * 清洗终端输出文本。
 *
 * 参数：
 * - value：PTY/WebSocket 推送的原始输出片段，或从 localStorage 恢复的历史行。
 *
 * 返回：
 * - 移除 ANSI、OSC、不可见控制字符和替换字符后的可展示文本。
 */
const sanitizeTerminalText = (value) => {
  return String(value ?? '')
    .replace(OSC_ESCAPE_RE, '')
    .replace(RESIDUAL_TERMINAL_CONTROL_RE, '')
    .replace(ANSI_ESCAPE_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .replaceAll(REPLACEMENT_CHARACTER, '')
}

/**
 * 清洗历史行数组。
 *
 * 参数：
 * - lines：会话恢复或批量写入时传入的终端行数组。
 *
 * 返回：
 * - 已过滤纯控制序列行的终端行数组。
 */
const sanitizeTerminalLines = (lines) => {
  if (!Array.isArray(lines)) return []
  return lines
    .map((line) => {
      const raw = String(line ?? '')
      const clean = sanitizeTerminalText(raw)
      return { raw, clean }
    })
    .filter((item) => item.clean.length > 0 || item.raw.length === 0)
    .map((item) => item.clean)
}

/**
 * 安全解析 JSON 字符串。
 *
 * 参数：
 * - text：localStorage 中读取的原始文本。
 * - fallback：解析失败或文本为空时返回的兜底值。
 *
 * 返回：
 * - 解析后的对象，或 fallback。
 */
const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/** 判断当前代码是否运行在浏览器环境。 */
const isClient = () => typeof window !== 'undefined'

/**
 * 获取当前登录用户的本地标识。
 *
 * 作用：
 * - 不同用户的终端会话需要写入不同 localStorage key。
 *
 * 返回：
 * - 用户 id、userid、username 或默认 guest 标识。
 */
const getCurrentUserIdentity = () => {
  if (!isClient()) return TERMINAL_DEFAULT_USER_ID
  const user = parseJson(window.localStorage.getItem('pspm_user'), null)
  return String(user?.id || user?.userid || user?.username || TERMINAL_DEFAULT_USER_ID)
}

/** 根据用户标识生成终端会话 localStorage key。 */
const storageKeyFor = (identity) => `${TERMINAL_STORE_STORAGE_PREFIX}:${identity || TERMINAL_DEFAULT_USER_ID}`

/**
 * 将绝对路径转换为提示符中的简短路径。
 *
 * 参数：
 * - path：远程终端当前工作目录。
 *
 * 返回：
 * - `~`、`~/xxx` 或原始绝对路径。
 */
const formatPromptPath = (path) => {
  const current = String(path || HOME_DIR)
  if (current === HOME_DIR) return '~'
  if (current.startsWith(`${HOME_DIR}/`)) return `~${current.slice(HOME_DIR.length)}`
  return current
}

/**
 * 根据会话状态构造终端提示符。
 *
 * 参数：
 * - session：终端会话记录。
 *
 * 返回：
 * - 类似 `(base) [root@host ~/project]#` 的提示符文本。
 */
const buildPrompt = (session) => {
  const host = session.hostLabel || session.alias || TERMINAL_DEFAULT_HOST_LABEL
  const cwd = formatPromptPath(session.cwd || HOME_DIR)
  const envName = session.condaEnvName || TERMINAL_DEFAULT_CONDA_ENV
  return `(${envName}) [${TERMINAL_PROMPT_USER}@${host} ${cwd}]#`
}

/**
 * 创建标准化终端会话记录。
 *
 * 参数：
 * - id：前端本地会话 ID。
 * - remoteSessionId：后端 WebSocket 会话 ID。
 * - serverIp：会话连接的服务器 IP。
 * - alias：会话展示别名。
 * - baseAlias：用于派生兄弟会话的基础别名。
 * - hostLabel：提示符中展示的主机名。
 * - cwd：当前工作目录。
 * - locked：当前会话是否被任务锁定。
 * - lockReason：锁定原因。
 * - condaEnvName：当前 Conda 环境名。
 * - foregroundRunning：是否绑定前台运行服务。
 * - foregroundProjectId：前台服务所属项目 ID。
 * - foregroundProjectName：前台服务所属项目名。
 *
 * 返回：
 * - 前端统一使用的会话对象。
 */
const createSessionRecord = ({
  id,
  remoteSessionId = '',
  serverIp = '',
  alias = '',
  baseAlias = '',
  hostLabel = '',
  cwd = HOME_DIR,
  locked = false,
  lockReason = '',
  condaEnvName = TERMINAL_DEFAULT_CONDA_ENV,
  foregroundRunning = false,
  foregroundProjectId = 0,
  foregroundProjectName = '',
}) => ({
  id: String(id),
  remoteSessionId: String(remoteSessionId || ''),
  serverIp: String(serverIp || ''),
  alias: String(alias || ''),
  baseAlias: String(baseAlias || alias || ''),
  hostLabel: String(hostLabel || alias || serverIp || TERMINAL_DEFAULT_HOST_LABEL),
  cwd: String(cwd || HOME_DIR),
  locked: !!locked,
  lockReason: String(lockReason || ''),
  condaEnvName: String(condaEnvName || TERMINAL_DEFAULT_CONDA_ENV),
  foregroundRunning: !!foregroundRunning,
  foregroundProjectId: Number(foregroundProjectId || 0),
  foregroundProjectName: String(foregroundProjectName || ''),
  lines: [],
})

/**
 * 归一化从 localStorage 恢复出的会话对象。
 *
 * 参数：
 * - session：可能来自旧版本缓存的会话对象。
 *
 * 返回：
 * - 字段完整、类型稳定的会话对象。
 */
const normalizeSession = (session) => {
  const safe = session || {}
  const normalized = createSessionRecord({
    id: safe.id,
    remoteSessionId: safe.remoteSessionId,
    serverIp: safe.serverIp,
    alias: safe.alias,
    baseAlias: safe.baseAlias,
    hostLabel: safe.hostLabel,
    cwd: safe.cwd || HOME_DIR,
    locked: !!safe.locked,
    lockReason: safe.lockReason || '',
    condaEnvName: safe.condaEnvName || TERMINAL_DEFAULT_CONDA_ENV,
    foregroundRunning: !!safe.foregroundRunning,
    foregroundProjectId: Number(safe.foregroundProjectId || 0),
    foregroundProjectName: safe.foregroundProjectName || '',
  })
  normalized.lines = sanitizeTerminalLines(safe.lines)
  return normalized
}

/**
 * 终端会话 Store。
 *
 * 作用：
 * - 管理右侧终端会话列表、当前会话、输出内容和会话锁定状态。
 * - 将会话基础信息按用户维度持久化到 localStorage。
 */
export const useTerminalStore = defineStore('terminal', () => {
  /** 当前用户的终端会话列表。 */
  const sessions = ref([])
  /** 当前激活的本地会话 ID。 */
  const activeSessionId = ref('')
  /** 本轮页面生命周期内的 WebSocket 连接映射，不写入 localStorage。 */
  const sockets = new Map()
  /** 当前用户对应的 localStorage key。 */
  const storageKey = ref(storageKeyFor(getCurrentUserIdentity()))

  /** 将会话基础状态持久化到 localStorage。 */
  const persist = () => {
    if (!isClient()) return

    if (!sessions.value.length) {
      window.localStorage.removeItem(storageKey.value)
      return
    }

    window.localStorage.setItem(
      storageKey.value,
      JSON.stringify({
        activeSessionId: activeSessionId.value,
        sessions: sessions.value,
      }),
    )
  }

  /** 关闭当前页面持有的所有 WebSocket 连接。 */
  const closeAllSockets = () => {
    sockets.forEach((socket) => {
      try {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: TERMINAL_WS_MESSAGE_TYPES.CLOSE }))
        socket.close()
      } catch {}
    })
    sockets.clear()
  }

  /**
   * 从 localStorage 恢复指定用户的终端会话。
   *
   * 参数：
   * - identity：当前用户本地身份标识。
   * - options.closeAll：切换用户时是否先关闭旧 WebSocket 连接。
   */
  const hydrate = (identity, options = {}) => {
    storageKey.value = storageKeyFor(identity || getCurrentUserIdentity())
    if (!isClient()) return

    if (options.closeAll === true) closeAllSockets()
    const raw = window.localStorage.getItem(storageKey.value)
    if (!raw) {
      sessions.value = []
      activeSessionId.value = ''
      return
    }

    const parsed = parseJson(raw, null)
    const restored = Array.isArray(parsed?.sessions) ? parsed.sessions.map(normalizeSession) : []
    sessions.value = restored

    const desiredActive = String(parsed?.activeSessionId || '')
    activeSessionId.value = desiredActive && restored.some((item) => item.id === desiredActive)
      ? desiredActive
      : (restored[0]?.id || '')
    persist()
  }

  /** 对外暴露的按用户加载会话方法。 */
  const loadForUser = (identity, options = {}) => {
    hydrate(identity, options)
  }

  /** 根据本地会话 ID 查找会话。 */
  const findSession = (id) => sessions.value.find((item) => item.id === String(id))
  /** 获取指定本地会话。 */
  const getSession = (id) => findSession(id)
  /** 获取当前激活会话。 */
  const getActiveSession = () => findSession(activeSessionId.value)
  /** 返回会话列表副本，避免外部直接替换数组。 */
  const getSessions = () => sessions.value.slice()

  /** 生成下一个前端本地会话 ID。 */
  const nextId = () => {
    const ids = sessions.value
      .map((item) => Number(item.id))
      .filter((value) => !Number.isNaN(value))
    return String((Math.max(0, ...ids) || 0) + 1)
  }

  /** 统计指定服务器已有多少本地会话。 */
  const countByIp = (serverIp) => sessions.value.filter((item) => item.serverIp === String(serverIp || '')).length

  /** 根据服务器 IP 和基础别名生成不会冲突的展示别名。 */
  const buildNextAlias = (serverIp, baseAlias) => {
    const aliasBase = String(baseAlias || serverIp || TERMINAL_DEFAULT_SESSION_ALIAS)
    const sameCount = countByIp(serverIp)
    return sameCount > 0 ? `${aliasBase}__${sameCount}` : aliasBase
  }

  /** 激活指定终端会话。 */
  const setActiveSession = (id) => {
    const session = findSession(id)
    if (!session) return false
    activeSessionId.value = session.id
    persist()
    return true
  }

  /** 向指定会话追加一整行输出。 */
  const appendLine = (sessionId, line) => {
    const session = findSession(sessionId)
    if (!session) return
    const raw = String(line ?? '')
    const clean = sanitizeTerminalText(raw)
    if (raw.length > 0 && clean.length === 0) return
    session.lines.push(clean)
    if (session.lines.length > TERMINAL_OUTPUT_LINE_LIMIT) {
      session.lines = session.lines.slice(-TERMINAL_OUTPUT_LINE_LIMIT)
    }
    persist()
  }

  /** 向指定会话追加流式输出片段。 */
  const appendChunk = (sessionId, chunk) => {
    const session = findSession(sessionId)
    if (!session) return
    const text = sanitizeTerminalText(chunk).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    if (!text) return
    const parts = text.split('\n')
    if (!session.lines.length) session.lines.push('')
    session.lines[session.lines.length - 1] = `${session.lines[session.lines.length - 1] || ''}${parts[0] || ''}`
    for (let i = 1; i < parts.length; i += 1) {
      session.lines.push(parts[i] || '')
    }
    if (session.lines.length > TERMINAL_OUTPUT_LINE_LIMIT) {
      session.lines = session.lines.slice(-TERMINAL_OUTPUT_LINE_LIMIT)
    }
    persist()
  }

  /** 向指定会话批量追加多行输出。 */
  const appendLines = (sessionId, lines) => {
    const session = findSession(sessionId)
    if (!session) return
    if (!Array.isArray(lines) || !lines.length) return
    const cleanLines = sanitizeTerminalLines(lines)
    if (!cleanLines.length) return
    session.lines.push(...cleanLines)
    if (session.lines.length > TERMINAL_OUTPUT_LINE_LIMIT) {
      session.lines = session.lines.slice(-TERMINAL_OUTPUT_LINE_LIMIT)
    }
    persist()
  }

  /** 用新输出完整替换指定会话的输出内容。 */
  const replaceLines = (sessionId, lines) => {
    const session = findSession(sessionId)
    if (!session) return
    session.lines = sanitizeTerminalLines(lines)
    persist()
  }

  /** 向当前激活会话追加一行输出。 */
  const appendCurrentLog = (line) => {
    if (!activeSessionId.value) return
    appendLine(activeSessionId.value, line)
  }

  /** 更新指定会话当前工作目录。 */
  const setSessionCwd = (sessionId, cwd) => {
    const session = findSession(sessionId)
    if (!session) return
    session.cwd = String(cwd || HOME_DIR)
    persist()
  }

  /** 更新指定会话当前 Conda 环境名。 */
  const setSessionCondaEnv = (sessionId, condaEnvName = TERMINAL_DEFAULT_CONDA_ENV) => {
    const session = findSession(sessionId)
    if (!session) return
    session.condaEnvName = String(condaEnvName || TERMINAL_DEFAULT_CONDA_ENV)
    persist()
  }

  /** 记录指定本地会话对应的后端 WebSocket 会话 ID。 */
  const setSessionRemoteId = (sessionId, remoteSessionId) => {
    const session = findSession(sessionId)
    if (!session) return
    session.remoteSessionId = String(remoteSessionId || '')
    persist()
  }

  /** 绑定指定本地会话的 WebSocket 实例。 */
  const setSessionSocket = (sessionId, socket) => {
    const key = String(sessionId || '')
    if (!key) return
    sockets.set(key, socket)
  }

  /** 获取指定本地会话的 WebSocket 实例。 */
  const getSessionSocket = (sessionId) => sockets.get(String(sessionId || '')) || null

  /** 移除并返回指定本地会话的 WebSocket 实例。 */
  const removeSessionSocket = (sessionId) => {
    const key = String(sessionId || '')
    const socket = sockets.get(key)
    sockets.delete(key)
    return socket || null
  }

  /** 清空指定会话的输出，并写入新的提示符。 */
  const clearSession = (sessionId, promptText = '') => {
    const session = findSession(sessionId)
    if (!session) return
    const nextPrompt = String(promptText || buildPrompt(session))
    session.lines = [nextPrompt]
    persist()
  }

  /** 设置会话任务锁定状态。 */
  const setSessionLocked = (sessionId, locked, reason = '') => {
    const session = findSession(sessionId)
    if (!session) return
    session.locked = !!locked
    session.lockReason = String(reason || '')
    persist()
  }

  /** 标记会话已经绑定前台运行项目。 */
  const setSessionForeground = (sessionId, payload = {}) => {
    const session = findSession(sessionId)
    if (!session) return
    session.foregroundRunning = !!payload.running
    session.foregroundProjectId = Number(payload.projectId || payload.project_id || 0)
    session.foregroundProjectName = String(payload.projectName || payload.project_name || '')
    persist()
  }

  /** 清除会话前台运行项目标记。 */
  const clearSessionForeground = (sessionId) => {
    const session = findSession(sessionId)
    if (!session) return
    session.foregroundRunning = false
    session.foregroundProjectId = 0
    session.foregroundProjectName = ''
    persist()
  }

  /** 根据项目 ID 查找正在承载该项目前台服务的会话。 */
  const findForegroundSessionByProject = (projectId) => {
    const id = Number(projectId || 0)
    if (!id) return null
    return sessions.value.find((item) => !!item.foregroundRunning && Number(item.foregroundProjectId || 0) === id) || null
  }

  /**
   * 创建本地终端会话记录。
   *
   * 参数：
   * - serverIp：目标服务器 IP。
   * - alias/baseAlias/hostLabel：会话展示信息。
   * - remoteSessionId：后端会话 ID。
   * - cwd：初始工作目录。
   * - welcomeMessage：第一行欢迎提示。
   * - prompt：初始提示符。
   *
   * 返回：
   * - 新建本地会话 ID。
   */
  const createSessionLocal = ({
    serverIp,
    alias,
    baseAlias,
    hostLabel,
    remoteSessionId = '',
    cwd = HOME_DIR,
    welcomeMessage = terminalMessages.createSessionSuccess,
    prompt = '',
  }) => {
    const id = nextId()

    const finalAlias = String(alias || buildNextAlias(serverIp, baseAlias || alias || serverIp))
    const finalBaseAlias = String(baseAlias || finalAlias.replace(/__\d+$/, ''))

    const session = createSessionRecord({
      id,
      remoteSessionId,
      serverIp,
      alias: finalAlias,
      baseAlias: finalBaseAlias,
      hostLabel: hostLabel || finalAlias,
      cwd,
    condaEnvName: TERMINAL_DEFAULT_CONDA_ENV,
    })

    const lines = []
    if (welcomeMessage) lines.push(String(welcomeMessage))
    lines.push(String(prompt || buildPrompt(session)))
    session.lines = lines

    sessions.value.push(session)
    activeSessionId.value = session.id
    persist()
    return session.id
  }

  /** 基于已有会话创建同服务器兄弟会话。 */
  const createSiblingSessionLocal = (baseSessionId, payload = {}) => {
    const baseSession = findSession(baseSessionId)
    if (!baseSession) return ''

    return createSessionLocal({
      serverIp: baseSession.serverIp,
      alias: payload.alias,
      baseAlias: payload.baseAlias || baseSession.baseAlias || baseSession.alias,
      hostLabel: payload.hostLabel || baseSession.hostLabel,
      remoteSessionId: payload.remoteSessionId,
      cwd: payload.cwd || HOME_DIR,
      welcomeMessage: payload.welcomeMessage,
      prompt: payload.prompt,
    })
  }

  /** 关闭指定本地会话，并按需通知后端关闭远程会话。 */
  const closeSession = (id, options = {}) => {
    const targetId = String(id)
    const index = sessions.value.findIndex((item) => item.id === targetId)
    if (index === -1) return false

    const socket = removeSessionSocket(targetId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (options.skipRemoteClose !== true) {
        socket.send(JSON.stringify({ type: TERMINAL_WS_MESSAGE_TYPES.CLOSE }))
      }
      socket.close()
    }

    sessions.value.splice(index, 1)

    if (activeSessionId.value === targetId) {
      const fallback = sessions.value[index] || sessions.value[index - 1] || sessions.value[0]
      activeSessionId.value = fallback ? fallback.id : ''
    }

    persist()
    return true
  }

  /** 清空所有终端会话并关闭页面持有的连接。 */
  const reset = () => {
    closeAllSockets()
    sessions.value = []
    activeSessionId.value = ''
    persist()
  }

  return {
    sessions,
    activeSessionId,
    loadForUser,
    getSession,
    getActiveSession,
    getSessions,
    setActiveSession,
    appendLine,
    appendChunk,
    appendLines,
    replaceLines,
    appendCurrentLog,
    setSessionCwd,
    setSessionCondaEnv,
    setSessionRemoteId,
    setSessionSocket,
    getSessionSocket,
    removeSessionSocket,
    clearSession,
    createSessionLocal,
    createSiblingSessionLocal,
    setSessionLocked,
    setSessionForeground,
    clearSessionForeground,
    findForegroundSessionByProject,
    closeSession,
    buildNextAlias,
    buildPrompt,
    reset,
  }
})
