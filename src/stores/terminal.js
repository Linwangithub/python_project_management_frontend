import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_PREFIX = 'pspm_terminal_state'
const DEFAULT_USER_KEY = 'guest'
const HOME_DIR = '/root'

const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

const isClient = () => typeof window !== 'undefined'

const getCurrentUserIdentity = () => {
  if (!isClient()) return DEFAULT_USER_KEY
  const user = parseJson(window.localStorage.getItem('pspm_user'), null)
  return String(user?.id || user?.userid || user?.username || DEFAULT_USER_KEY)
}

const storageKeyFor = (identity) => `${STORAGE_PREFIX}:${identity || DEFAULT_USER_KEY}`

const formatPromptPath = (path) => {
  const current = String(path || HOME_DIR)
  if (current === HOME_DIR) return '~'
  if (current.startsWith(`${HOME_DIR}/`)) return `~${current.slice(HOME_DIR.length)}`
  return current
}

const buildPrompt = (session) => {
  const host = session.hostLabel || session.alias || 'wcp'
  const cwd = formatPromptPath(session.cwd || HOME_DIR)
  const envName = session.condaEnvName || 'base'
  return `(${envName}) [root@${host} ${cwd}]#`
}

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
  condaEnvName = 'base',
}) => ({
  id: String(id),
  remoteSessionId: String(remoteSessionId || ''),
  serverIp: String(serverIp || ''),
  alias: String(alias || ''),
  baseAlias: String(baseAlias || alias || ''),
  hostLabel: String(hostLabel || alias || serverIp || 'wcp'),
  cwd: String(cwd || HOME_DIR),
  locked: !!locked,
  lockReason: String(lockReason || ''),
  condaEnvName: String(condaEnvName || 'base'),
  lines: [],
})

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
    condaEnvName: safe.condaEnvName || 'base',
  })
  normalized.lines = Array.isArray(safe.lines) ? safe.lines.map((line) => String(line)) : []
  return normalized
}

export const useTerminalStore = defineStore('terminal', () => {
  const sessions = ref([])
  const activeSessionId = ref('')
  const sockets = new Map()
  const storageKey = ref(storageKeyFor(getCurrentUserIdentity()))

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

  const closeAllSockets = () => {
    sockets.forEach((socket) => {
      try {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'close' }))
        socket.close()
      } catch {}
    })
    sockets.clear()
  }

  const hydrate = (identity) => {
    storageKey.value = storageKeyFor(identity || getCurrentUserIdentity())
    if (!isClient()) return

    closeAllSockets()
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
  }

  const loadForUser = (identity) => {
    hydrate(identity)
  }

  const findSession = (id) => sessions.value.find((item) => item.id === String(id))
  const getSession = (id) => findSession(id)
  const getActiveSession = () => findSession(activeSessionId.value)

  const nextId = () => {
    const ids = sessions.value
      .map((item) => Number(item.id))
      .filter((value) => !Number.isNaN(value))
    return String((Math.max(0, ...ids) || 0) + 1)
  }

  const countByIp = (serverIp) => sessions.value.filter((item) => item.serverIp === String(serverIp || '')).length

  const buildNextAlias = (serverIp, baseAlias) => {
    const aliasBase = String(baseAlias || serverIp || 'session')
    const sameCount = countByIp(serverIp)
    return sameCount > 0 ? `${aliasBase}__${sameCount}` : aliasBase
  }

  const setActiveSession = (id) => {
    const session = findSession(id)
    if (!session) return false
    activeSessionId.value = session.id
    persist()
    return true
  }

  const appendLine = (sessionId, line) => {
    const session = findSession(sessionId)
    if (!session) return
    session.lines.push(String(line))
    persist()
  }

  const appendChunk = (sessionId, chunk) => {
    const session = findSession(sessionId)
    if (!session) return
    const text = String(chunk || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    if (!text) return
    const parts = text.split('\n')
    if (!session.lines.length) session.lines.push('')
    session.lines[session.lines.length - 1] = `${session.lines[session.lines.length - 1] || ''}${parts[0] || ''}`
    for (let i = 1; i < parts.length; i += 1) {
      session.lines.push(parts[i] || '')
    }
    if (session.lines.length > 2000) {
      session.lines = session.lines.slice(-2000)
    }
    persist()
  }

  const appendLines = (sessionId, lines) => {
    const session = findSession(sessionId)
    if (!session) return
    if (!Array.isArray(lines) || !lines.length) return
    session.lines.push(...lines.map((line) => String(line)))
    persist()
  }

  const replaceLines = (sessionId, lines) => {
    const session = findSession(sessionId)
    if (!session) return
    session.lines = Array.isArray(lines) ? lines.map((line) => String(line)) : []
    persist()
  }

  const appendCurrentLog = (line) => {
    if (!activeSessionId.value) return
    appendLine(activeSessionId.value, line)
  }

  const setSessionCwd = (sessionId, cwd) => {
    const session = findSession(sessionId)
    if (!session) return
    session.cwd = String(cwd || HOME_DIR)
    persist()
  }

  const setSessionCondaEnv = (sessionId, condaEnvName = 'base') => {
    const session = findSession(sessionId)
    if (!session) return
    session.condaEnvName = String(condaEnvName || 'base')
    persist()
  }

  const setSessionRemoteId = (sessionId, remoteSessionId) => {
    const session = findSession(sessionId)
    if (!session) return
    session.remoteSessionId = String(remoteSessionId || '')
    persist()
  }

  const setSessionSocket = (sessionId, socket) => {
    const key = String(sessionId || '')
    if (!key) return
    sockets.set(key, socket)
  }

  const getSessionSocket = (sessionId) => sockets.get(String(sessionId || '')) || null

  const removeSessionSocket = (sessionId) => {
    const key = String(sessionId || '')
    const socket = sockets.get(key)
    sockets.delete(key)
    return socket || null
  }

  const clearSession = (sessionId, promptText = '') => {
    const session = findSession(sessionId)
    if (!session) return
    const nextPrompt = String(promptText || buildPrompt(session))
    session.lines = [nextPrompt]
    persist()
  }

  const setSessionLocked = (sessionId, locked, reason = '') => {
    const session = findSession(sessionId)
    if (!session) return
    session.locked = !!locked
    session.lockReason = String(reason || '')
    persist()
  }

  const createSessionLocal = ({
    serverIp,
    alias,
    baseAlias,
    hostLabel,
    remoteSessionId = '',
    cwd = HOME_DIR,
    welcomeMessage = '连接成功！',
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
      condaEnvName: 'base',
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

  const closeSession = (id) => {
    const targetId = String(id)
    const index = sessions.value.findIndex((item) => item.id === targetId)
    if (index === -1) return false

    const socket = removeSessionSocket(targetId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'close' }))
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
    closeSession,
    buildNextAlias,
    buildPrompt,
    reset,
  }
})
