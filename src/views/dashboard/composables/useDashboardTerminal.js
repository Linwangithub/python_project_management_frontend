import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { TERMINAL_WS_PROTOCOL, buildTerminalDirectDownloadUrl, buildTerminalWsUrl, getTerminalWsToken, terminalApi } from '@/api/terminal'
import { getErrorMessage } from '@/utils/request'
import { ROOT_ROLE_KEY, USER_STORAGE_KEY } from '@/config/auth/auth.config'
import { TERMINAL_DEFAULT_HOME_DIR } from '@/config/project/project.paths.config'
import {
  TERMINAL_BLANK_LINE,
  TERMINAL_CANDIDATE_DISPLAY_SEPARATOR,
  TERMINAL_CANDIDATE_SEPARATOR,
  TERMINAL_CTRL_C_DISPLAY_TEXT,
  TERMINAL_CTRL_C_INPUT,
  TERMINAL_NEWLINE_INPUT,
} from '@/config/terminal/terminal.control.config'
import {
  PROJECT_SERVICE_STATUS,
  TERMINAL_CLEAR_COMMAND,
  TERMINAL_COMMAND_HISTORY_LIMIT,
  TERMINAL_CONNECT_TIMEOUT_MS,
  TERMINAL_CREATE_PROJECT_SUFFIX,
  TERMINAL_DEFAULT_ALIAS,
  TERMINAL_DEFAULT_HOST_LABEL,
  TERMINAL_DEFAULT_USER_ID,
  TERMINAL_FILE_NODE_TYPES,
  TERMINAL_NATIVE_DOWNLOAD_LINK_CONFIG,
  TERMINAL_SERVER_IP_ALIAS_FALLBACK,
  TERMINAL_SERVER_USERS_SEPARATOR_PATTERN,
  TERMINAL_SESSION_DIALOG_WIDTH,
  TERMINAL_SESSION_FIELD_KEYS,
  TERMINAL_TAB_REPEAT_MS,
  TERMINAL_TASK_SUFFIX,
  TERMINAL_UPLOAD_TARGET_PATH,
  TERMINAL_WS_MESSAGE_TYPES,
} from '@/config/terminal/terminal.session.config'
import { terminalMessageFactory, terminalMessages } from '@/config/terminal/terminal.messages.config'

const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/** 获取当前终端状态隔离使用的用户标识。 */
const getUserIdentity = (auth) => {
  const user = auth?.user || parseJson(window.localStorage.getItem(USER_STORAGE_KEY), null)
  return String(user?.id || user?.userid || user?.username || TERMINAL_DEFAULT_USER_ID)
}

/** 将终端原始输出按行拆分。 */
const splitOutput = (text) => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized) return []
  const lines = normalized.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** 将后端文件列表项转换为 Cascader（级联选择器）节点。 */
const createDownloadNode = (item) => ({
  label: item.name || item.path,
  value: item.path,
  leaf: item.type !== TERMINAL_FILE_NODE_TYPES.DIRECTORY,
  path: item.path,
  type: item.type === TERMINAL_FILE_NODE_TYPES.DIRECTORY ? TERMINAL_FILE_NODE_TYPES.DIRECTORY : TERMINAL_FILE_NODE_TYPES.FILE,
})
/**
 * Dashboard 终端组合函数。
 *
 * 作用：
 * - 管理终端 WebSocket 连接、会话创建、命令发送、Tab 补全、上传下载等交互。
 * - 为项目启动/停止/设置流程复用同一个终端会话能力。
 */
export const useDashboardTerminal = (options) => {
  const { terminalStore, projectStore, onCtrlC, getForegroundProjectBySessionId } = options
  const auth = useAuthStore()

  const consoleRef = ref()
  const commandInput = ref('')
  const sessionDialogVisible = ref(false)
  const downloadDialogVisible = ref(false)
  const downloadDialogLoading = ref(false)
  const downloadPathOptions = ref([])
  const downloadSelectedPath = ref('')
  const downloadPathCascaderValue = ref([])
  const downloadCurrentPath = ref('')
  const downloadRootPath = ref('')
  const downloadParentPath = ref('')
  const downloadCanGoParent = ref(false)
  const tabCompletionBusy = ref(false)
  const keepHistoryView = ref(false)
  const lastTabState = ref({
    sessionId: '',
    rawCommand: '',
    candidatesKey: '',
    at: 0,
  })
  const commandHistory = ref([])
  const historyCursor = ref(-1)

  const currentUserIdentity = computed(() => getUserIdentity(auth))

  const availableServers = computed(() => {
    if (auth.role === ROOT_ROLE_KEY) return Array.isArray(projectStore?.servers) ? projectStore.servers : []
    const username = String(auth.user?.username || '')
    const serverList = Array.isArray(projectStore?.servers) ? projectStore.servers : []
    if (!username) return serverList
    return serverList.filter((server) => {
      const users = String(server.users || '')
        .split(TERMINAL_SERVER_USERS_SEPARATOR_PATTERN)
        .map((item) => item.trim())
        .filter(Boolean)
      return users.includes(username)
    })
  })

  const sessionOptions = computed(() =>
    availableServers.value.map((server) => ({
      label: terminalMessageFactory.serverOptionLabel(server.alias, server.ip),
      value: server.ip,
      title: server.ip,
    })),
  )

  const terminalLines = computed(() => {
    const active = terminalStore.getSession(terminalStore.activeSessionId)
    return active ? active.lines : []
  })

  const activeSession = computed(() => terminalStore.getSession(terminalStore.activeSessionId))

  const activeSessionAlias = computed(() => activeSession.value?.alias || TERMINAL_DEFAULT_ALIAS)
  const activeSessionIp = computed(() => activeSession.value?.serverIp || '')
  const activeSessionLocked = computed(() => !!activeSession.value?.locked)
  const activeSessionLockReason = computed(() => String(activeSession.value?.lockReason || ''))

  const sessionDialogWidth = TERMINAL_SESSION_DIALOG_WIDTH
  const sessionDialogFieldsForView = computed(() => [
    {
      key: TERMINAL_SESSION_FIELD_KEYS.SERVER_IP,
      label: terminalMessages.sessionServerLabel,
      component: 'select',
      options: sessionOptions.value,
      placeholder: terminalMessages.sessionServerPlaceholder,
    },
    {
      key: TERMINAL_SESSION_FIELD_KEYS.ALIAS,
      label: terminalMessages.sessionAliasLabel,
      component: 'input',
      placeholder: terminalMessages.sessionAliasPlaceholder,
    },
  ])

  const createSessionForm = reactive({
    serverIp: '',
    alias: '',
  })

  const refreshSessions = () => {
    terminalStore.loadForUser(currentUserIdentity.value)
  }

  const reconnectStoredSessions = async () => {
    const sessions = typeof terminalStore.getSessions === 'function' ? terminalStore.getSessions() : []
    for (const session of sessions) {
      if (!session?.serverIp || !session?.remoteSessionId) continue
      const socket = terminalStore.getSessionSocket(session.id)
      if (socket && socket.readyState === WebSocket.OPEN) continue
      try {
        await openTerminalSocket({
          localSessionId: session.id,
          serverIp: session.serverIp,
          alias: session.alias,
          remoteSessionId: session.remoteSessionId,
          reconnect: true,
        })
      } catch {
        // reconnect silently; next command will retry when needed
      }
    }
  }

  const scrollToBottom = () => {
    nextTick(() => {
      if (!consoleRef.value) return
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    })
  }

  const isNearBottom = (el, threshold = 24) => {
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }

  const onConsoleScroll = () => {
    if (!consoleRef.value) return
    keepHistoryView.value = !isNearBottom(consoleRef.value)
  }

  watch(
    terminalLines,
    () => {
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    },
    { deep: true },
  )

  const appendTerminal = (content) => {
    if (!activeSession.value) return
    terminalStore.appendCurrentLog(content)
    if (!keepHistoryView.value) {
      scrollToBottom()
    }
  }

  const appendSessionLine = (sessionId, content) => {
    if (!sessionId) return
    terminalStore.appendLine(String(sessionId), content)
    if (!keepHistoryView.value) {
      scrollToBottom()
    }
  }

  const appendSessionChunk = (sessionId, chunk = '') => {
    if (!sessionId || !chunk) return
    terminalStore.appendChunk(String(sessionId), chunk)
    if (!keepHistoryView.value) {
      scrollToBottom()
    }
  }

  const appendSessionLines = (sessionId, lines = []) => {
    if (!sessionId || !Array.isArray(lines) || !lines.length) return
    terminalStore.appendLines(String(sessionId), lines)
    if (!keepHistoryView.value) {
      scrollToBottom()
    }
  }

  const lockSession = (sessionId, reason = terminalMessages.taskRunningDefault) => {
    if (!sessionId) return
    terminalStore.setSessionLocked(String(sessionId), true, reason)
  }

  const unlockSession = (sessionId) => {
    if (!sessionId) return
    terminalStore.setSessionLocked(String(sessionId), false, '')
  }

  const switchSession = (sessionId) => {
    terminalStore.setActiveSession(sessionId)
    keepHistoryView.value = false
    scrollToBottom()
  }

  const applyTabCompletionResult = (sessionId, data = {}) => {
    const session = terminalStore.getSession(sessionId)
    if (!session) return

    const requestedCommand = String(data.requested_command ?? data.original_command ?? commandInput.value ?? '')
    const currentCommand = String(commandInput.value || '')
    if (requestedCommand && currentCommand !== requestedCommand) {
      return
    }

    const completedCommand = String(data.completed_command || requestedCommand)
    const candidates = Array.isArray(data.candidates) ? data.candidates : []
    const now = Date.now()
    const candidatesKey = candidates.join(TERMINAL_CANDIDATE_SEPARATOR)

    if (completedCommand !== requestedCommand) {
      commandInput.value = completedCommand
      lastTabState.value = {
        sessionId,
        rawCommand: completedCommand,
        candidatesKey,
        at: now,
      }
    } else if (candidates.length) {
      const sameTap = lastTabState.value.sessionId === sessionId
        && lastTabState.value.rawCommand === requestedCommand
        && lastTabState.value.candidatesKey === candidatesKey
      && now - lastTabState.value.at < TERMINAL_TAB_REPEAT_MS
      if (sameTap) {
        terminalStore.appendLine(sessionId, candidates.join(TERMINAL_CANDIDATE_DISPLAY_SEPARATOR))
        lastTabState.value = { sessionId, rawCommand: requestedCommand, candidatesKey, at: 0 }
      } else {
        lastTabState.value = { sessionId, rawCommand: requestedCommand, candidatesKey, at: now }
      }
    } else {
      lastTabState.value = { sessionId, rawCommand: requestedCommand, candidatesKey: '', at: now }
    }

    if (!keepHistoryView.value) scrollToBottom()
  }

  const openTerminalSocket = ({ localSessionId, serverIp, alias, remoteSessionId = '', reconnect = false }) => new Promise((resolve, reject) => {
    const token = getTerminalWsToken()
    if (!token) {
      reject(new Error(terminalMessages.tokenMissing))
      return
    }
    const socket = new WebSocket(buildTerminalWsUrl(token), TERMINAL_WS_PROTOCOL)
    let settled = false
    const failTimer = window.setTimeout(() => {
      if (settled) return
      settled = true
      try { socket.close() } catch {}
      reject(new Error(terminalMessages.connectTimeout))
    }, TERMINAL_CONNECT_TIMEOUT_MS)

    const sendOpen = () => {
      socket.send(JSON.stringify({ type: TERMINAL_WS_MESSAGE_TYPES.OPEN, server_ip: serverIp, alias, session_id: remoteSessionId || '' }))
    }

    socket.onopen = sendOpen
    socket.onmessage = (event) => {
      let payload = null
      try {
        payload = JSON.parse(event.data)
      } catch {
        appendSessionChunk(localSessionId, String(event.data || ''))
        return
      }
      const type = String(payload?.type || '')
      const data = payload?.data || {}
      if (type === TERMINAL_WS_MESSAGE_TYPES.READY) {
        window.clearTimeout(failTimer)
        settled = true
        terminalStore.setSessionRemoteId(localSessionId, data.session_id || '')
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.setSessionSocket(localSessionId, socket)
        if (reconnect && data.reconnected) {
          terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
          terminalStore.appendLine(localSessionId, terminalMessages.connectionRecovered)
          terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
        }
        resolve(socket)
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.OUTPUT) {
        appendSessionChunk(localSessionId, data.text || '')
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.FOREGROUND_STARTED) {
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
        terminalStore.appendLine(localSessionId, terminalMessageFactory.foregroundStarted(data.pid, data.port))
        terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
        projectStore.updateProjectServiceStatus(data.project_id, {
          service_status: PROJECT_SERVICE_STATUS.RUNNING,
          running_port: data.port || '',
        })
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.FOREGROUND_PENDING) {
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
        terminalStore.appendLine(localSessionId, data.message || terminalMessages.commandSent)
        terminalStore.appendLine(localSessionId, TERMINAL_BLANK_LINE)
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.COMPLETE_RESULT) {
        applyTabCompletionResult(localSessionId, data)
        tabCompletionBusy.value = false
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.ERROR) {
        terminalStore.appendLine(localSessionId, data.message || terminalMessages.connectionError)
        tabCompletionBusy.value = false
        if (!settled) {
          window.clearTimeout(failTimer)
          settled = true
          reject(new Error(data.message || terminalMessages.connectionError))
        }
        return
      }
      if (type === TERMINAL_WS_MESSAGE_TYPES.CLOSED) {
        terminalStore.appendLine(localSessionId, data.message || terminalMessages.sessionClosed)
        if (typeof terminalStore.clearSessionForeground === 'function') {
          terminalStore.clearSessionForeground(localSessionId)
        }
        if (data.project_id) {
          projectStore.updateProjectServiceStatus(data.project_id, {
            service_status: PROJECT_SERVICE_STATUS.STOPPED,
            running_port: '',
          })
        }
      }
    }
    socket.onerror = () => {
      if (!settled) {
        window.clearTimeout(failTimer)
        settled = true
        reject(new Error(terminalMessages.connectFailed))
      } else {
        terminalStore.appendLine(localSessionId, terminalMessages.connectionError)
      }
    }
    socket.onclose = () => {
      window.clearTimeout(failTimer)
      terminalStore.removeSessionSocket(localSessionId)
      if (!settled) {
        settled = true
        reject(new Error(terminalMessages.connectionClosed))
      }
    }
  })

  const ensureSocketConnected = async (sessionId) => {
    const session = terminalStore.getSession(sessionId)
    if (!session) throw new Error(terminalMessages.sessionNotFound)

    const socket = terminalStore.getSessionSocket(session.id)
    if (socket && socket.readyState === WebSocket.OPEN) return socket

    if (!session.serverIp) {
      throw new Error(terminalMessages.websocketDisconnected)
    }

    return openTerminalSocket({
      localSessionId: session.id,
      serverIp: session.serverIp,
      alias: session.alias,
      remoteSessionId: session.remoteSessionId,
      reconnect: true,
    })
  }

  const sendSocketMessage = async (sessionId, payload) => {
    const socket = await ensureSocketConnected(sessionId)
    socket.send(JSON.stringify(payload))
  }

  watch(
    currentUserIdentity,
    async (_next, previous) => {
      terminalStore.loadForUser(currentUserIdentity.value, { closeAll: !!previous && previous !== currentUserIdentity.value })
      commandInput.value = ''
      resetHistoryCursor()
      await reconnectStoredSessions()
    },
    { immediate: true },
  )

  const createSessionByServer = async (serverIp, baseAlias, hostLabel) => {
    const finalAlias = terminalStore.buildNextAlias(serverIp, baseAlias)
    const localSessionId = terminalStore.createSessionLocal({
      serverIp,
      alias: finalAlias,
      baseAlias,
      hostLabel: hostLabel || TERMINAL_DEFAULT_HOST_LABEL,
      remoteSessionId: '',
      cwd: TERMINAL_DEFAULT_HOME_DIR,
      welcomeMessage: terminalMessageFactory.welcome(serverIp),
      prompt: '',
    })
    await openTerminalSocket({ localSessionId, serverIp, alias: finalAlias })
    return {
      localSessionId,
      finalAlias,
      remoteSessionId: terminalStore.getSession(localSessionId)?.remoteSessionId || '',
    }
  }

  const ensureCreateProjectSession = async (serverIp) => {
    if (!serverIp) {
      throw new Error(terminalMessages.serverIpRequired)
    }
    const lastPart = String(serverIp).split('.').pop() || TERMINAL_SERVER_IP_ALIAS_FALLBACK
    const baseAlias = `${lastPart}_${TERMINAL_CREATE_PROJECT_SUFFIX}`
    const server = availableServers.value.find((item) => item.ip === serverIp)
    const hostLabel = server?.alias || TERMINAL_DEFAULT_HOST_LABEL
    const created = await createSessionByServer(serverIp, baseAlias, hostLabel)
    terminalStore.setActiveSession(created.localSessionId)
    scrollToBottom()
    return created
  }

  const ensureProjectTaskSession = async (serverIp, suffix = TERMINAL_TASK_SUFFIX, options = {}) => {
    if (!serverIp) {
      throw new Error(terminalMessages.serverIpRequired)
    }

    const shouldReuseSession = options.reuse !== false
    if (shouldReuseSession) {
      const sessions = typeof terminalStore.getSessions === 'function' ? terminalStore.getSessions() : []
      const sameServerSessions = sessions.filter((item) => String(item?.serverIp || '') === String(serverIp))
      const reusableSessions = sameServerSessions.filter((item) => !item.locked && !item.foregroundRunning)
      for (const reusableSession of reusableSessions) {
        try {
          terminalStore.setActiveSession(reusableSession.id)
          await ensureSocketConnected(reusableSession.id)
          scrollToBottom()
          return {
            localSessionId: reusableSession.id,
            finalAlias: reusableSession.alias,
            remoteSessionId: terminalStore.getSession(reusableSession.id)?.remoteSessionId || '',
          }
        } catch {
          // 本地残留的坏会话不应该阻断操作，继续尝试其它会话或新建会话。
        }
      }
      // 同一台服务器可以同时承载多个项目的前台服务。
      // 如果已有同服务器会话都在执行任务或绑定了前台服务，则不再按 serverIp 锁死整台服务器，
      // 而是继续向下创建一个新的独立终端会话，避免项目 A 前台启动后阻塞项目 B 启动。
    }

    const lastPart = String(serverIp).split('.').pop() || TERMINAL_TASK_SUFFIX
    const safeSuffix = String(suffix || TERMINAL_TASK_SUFFIX).replace(/^_+/, '')
    const baseAlias = `${lastPart}_${safeSuffix}`
    const server = availableServers.value.find((item) => item.ip === serverIp)
    const hostLabel = server?.alias || TERMINAL_DEFAULT_HOST_LABEL
    const created = await createSessionByServer(serverIp, baseAlias, hostLabel)
    terminalStore.setActiveSession(created.localSessionId)
    scrollToBottom()
    return created
  }

  const addSiblingSession = async (sessionId) => {
    const baseSession = terminalStore.getSession(sessionId)
    if (!baseSession) return

    try {
      const result = await createSessionByServer(
        baseSession.serverIp,
        baseSession.baseAlias || baseSession.alias,
        baseSession.hostLabel,
      )

      terminalStore.setActiveSession(result.localSessionId)
      keepHistoryView.value = false
      scrollToBottom()
      ElMessage.success(terminalMessageFactory.sessionCreatedOnServer(baseSession.serverIp, result.finalAlias))
    } catch (error) {
      ElMessage.error(getErrorMessage(error, terminalMessages.createSessionFailed))
    }
  }

  const closeSession = async (sessionId) => {
    const closing = terminalStore.getSession(sessionId)
    if (!closing) return

    if (closing.locked) {
      ElMessage.warning(closing.lockReason || terminalMessages.sessionLocked)
      return
    }

    const foregroundProject = typeof getForegroundProjectBySessionId === 'function'
      ? getForegroundProjectBySessionId(String(sessionId))
      : null
    if (foregroundProject?.id && typeof onCtrlC === 'function') {
      let stopped = false
      await onCtrlC({
        session: closing,
        appendLine: (line) => terminalStore.appendLine(closing.id, line),
        skipBackendStop: false,
        onStopped: () => { stopped = true },
      })
      if (!stopped) {
        ElMessage.warning(terminalMessages.foregroundStopRequired)
        return
      }
    }

    let remoteClosed = false
    try {
      if (closing.remoteSessionId) {
        await terminalApi.closeSession({ session_id: closing.remoteSessionId })
        remoteClosed = true
      }
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, terminalMessages.remoteCloseFailed))
    }

    const ok = terminalStore.closeSession(sessionId, { skipRemoteClose: remoteClosed })
    if (!ok) return

    ElMessage.success(terminalMessageFactory.sessionClosedWithAlias(closing.alias))
    scrollToBottom()
  }

  const openSessionDialog = () => {
    createSessionForm.serverIp = ''
    createSessionForm.alias = ''
    sessionDialogVisible.value = true
  }

  const confirmCreateSession = async () => {
    if (!createSessionForm.serverIp) {
      ElMessage.warning(terminalMessages.chooseServerIp)
      return
    }
    if (!createSessionForm.alias.trim()) {
      ElMessage.warning(terminalMessages.aliasRequired)
      return
    }

    const server = availableServers.value.find((item) => item.ip === createSessionForm.serverIp)
    if (!server) {
      ElMessage.warning(terminalMessages.serverUnavailableForUser)
      return
    }

    try {
      const result = await createSessionByServer(
        server.ip,
        createSessionForm.alias.trim(),
        server.alias || TERMINAL_DEFAULT_HOST_LABEL,
      )

      sessionDialogVisible.value = false
      terminalStore.setActiveSession(result.localSessionId)
      ElMessage.success(terminalMessages.createSessionSuccess)
      keepHistoryView.value = false
      scrollToBottom()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, terminalMessages.createSessionFailed))
    }
  }

  const startNativeDownload = (url) => {
    const link = document.createElement('a')
    link.href = url
    link.target = TERMINAL_NATIVE_DOWNLOAD_LINK_CONFIG.target
    link.rel = TERMINAL_NATIVE_DOWNLOAD_LINK_CONFIG.rel
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const ensureActiveTransferSession = () => {
    const session = activeSession.value
    if (!session) {
      ElMessage.warning(terminalMessages.createTerminalSessionFirst)
      return null
    }
    if (!session.remoteSessionId) {
      ElMessage.warning(terminalMessages.sessionNotReady)
      return null
    }
    return session
  }

  const uploadFile = async (selectedFiles = []) => {
    const session = ensureActiveTransferSession()
    if (!session) return

    const files = Array.isArray(selectedFiles) ? selectedFiles : []
    if (!files.length) return

    try {
      for (const file of files) {
        const relativePath = String(file.webkitRelativePath || '')
        await terminalApi.upload({
          session_id: session.remoteSessionId,
          target_path: TERMINAL_UPLOAD_TARGET_PATH,
          relative_path: relativePath,
          file,
        })
        terminalStore.appendLine(session.id, terminalMessageFactory.uploaded(relativePath || file.name))
      }
      ElMessage.success(terminalMessages.uploadSuccess)
    } catch (error) {
      const msg = getErrorMessage(error, terminalMessages.uploadFailed)
      terminalStore.appendLine(session.id, msg)
      ElMessage.error(msg)
    }
  }

  const loadDownloadOptions = async (path = '', targetNode = null) => {
    const session = ensureActiveTransferSession()
    if (!session) return false
    downloadDialogLoading.value = true
    try {
      const resp = await terminalApi.listPath({
        session_id: session.remoteSessionId,
        path,
      })
      const data = resp.data?.data || {}
      const options = Array.isArray(data.items) ? data.items : []
      downloadCurrentPath.value = String(data.cwd || '')
      downloadRootPath.value = String(data.root || '')
      downloadParentPath.value = String(data.parent || '')
      downloadCanGoParent.value = !!data.can_go_parent
      const children = options.map(createDownloadNode)
      if (targetNode) {
        targetNode.children = children
      } else {
        downloadPathOptions.value = children
        downloadPathCascaderValue.value = []
        downloadSelectedPath.value = ''
      }
      return true
    } catch (error) {
      ElMessage.error(getErrorMessage(error, terminalMessages.downloadListLoadFailed))
      return false
    } finally {
      downloadDialogLoading.value = false
    }
  }

  const openDownloadDialog = async () => {
    const session = ensureActiveTransferSession()
    if (!session) return
    downloadSelectedPath.value = ''
    downloadPathCascaderValue.value = []
    downloadPathOptions.value = []
    downloadCurrentPath.value = ''
    downloadRootPath.value = ''
    downloadParentPath.value = ''
    downloadCanGoParent.value = false
    downloadDialogVisible.value = true
    const ok = await loadDownloadOptions('')
    if (ok && !downloadPathOptions.value.length) {
      ElMessage.warning(terminalMessages.downloadableEmpty)
    }
  }

  const loadDownloadCascaderChildren = async (node, resolve) => {
    const nodeData = node?.data || {}
    const path = String(nodeData.path || nodeData.value || '')
    if (!path) {
      resolve(downloadPathOptions.value)
      return
    }
    const session = ensureActiveTransferSession()
    if (!session) {
      resolve([])
      return
    }
    try {
      const resp = await terminalApi.listPath({
        session_id: session.remoteSessionId,
        path,
      })
      const data = resp.data?.data || {}
      const options = Array.isArray(data.items) ? data.items : []
      const children = options.map(createDownloadNode)
      resolve(children)
    } catch (error) {
      ElMessage.error(getErrorMessage(error, terminalMessages.downloadListLoadFailed))
      resolve([])
    }
  }

  const onDownloadPathChange = (value) => {
    const list = Array.isArray(value) ? value : []
    downloadPathCascaderValue.value = list
    downloadSelectedPath.value = list.length ? String(list[list.length - 1] || '') : ''
  }

  const clearDownloadPath = () => {
    downloadPathCascaderValue.value = []
    downloadSelectedPath.value = ''
  }

  const enterDownloadDirectory = async (path) => {
    const value = String(path || '').trim()
    if (!value) return
    await loadDownloadOptions(value)
  }

  const goDownloadParent = async () => {
    if (!downloadCanGoParent.value || !downloadParentPath.value) return
    await loadDownloadOptions(downloadParentPath.value)
  }

  const selectDownloadPath = (item) => {
    if (!item?.path) return
    downloadSelectedPath.value = item.path
    downloadPathCascaderValue.value = [item.path]
  }

  const confirmDownloadFile = async () => {
    const session = ensureActiveTransferSession()
    if (!session) return
    const path = downloadSelectedPath.value
    if (!path) return
    downloadDialogVisible.value = false
    try {
      const resp = await terminalApi.createDownloadTicket({ session_id: session.remoteSessionId, path })
      const ticket = resp.data?.data?.ticket || ''
      if (!ticket) throw new Error(terminalMessages.downloadTicketFailed)
      startNativeDownload(buildTerminalDirectDownloadUrl(ticket))
      terminalStore.appendLine(session.id, terminalMessageFactory.downloadStarted(path))
      ElMessage.success(terminalMessages.downloadStartedTip)
    } catch (error) {
      const msg = getErrorMessage(error, terminalMessages.downloadFailed)
      terminalStore.appendLine(session.id, msg)
      ElMessage.error(msg)
    }
  }

  const downloadFile = openDownloadDialog

  const pushCommandHistory = (command) => {
    const value = String(command || '').trim()
    if (!value) return
    const list = commandHistory.value.slice()
    const last = list[list.length - 1]
    if (last !== value) list.push(value)
    commandHistory.value = list.slice(-TERMINAL_COMMAND_HISTORY_LIMIT)
    historyCursor.value = commandHistory.value.length
  }

  function resetHistoryCursor() {
    historyCursor.value = commandHistory.value.length
  }

  const executeSessionCommand = async (sessionId, rawCommand, options = {}) => {
    const session = terminalStore.getSession(sessionId)
    if (!session) throw new Error(terminalMessages.sessionNotFound)
    const command = String(rawCommand || '').trim()
    if (!command) throw new Error(terminalMessages.commandRequired)
    await sendSocketMessage(session.id, { type: TERMINAL_WS_MESSAGE_TYPES.INPUT, text: `${command}${TERMINAL_NEWLINE_INPUT}` })
    return { stdout: '', stderr: '', exit_code: 0 }
  }

  const runProjectForegroundInSession = async (sessionId, prepare = {}) => {
    const command = String(prepare.command || '').trim()
    if (!command) throw new Error(terminalMessages.startCommandMissing)
    if (typeof terminalStore.setSessionForeground === 'function') {
      terminalStore.setSessionForeground(sessionId, {
        running: true,
        projectId: prepare.project_id,
        projectName: prepare.project_name || '',
      })
    }
    try {
      await sendSocketMessage(sessionId, {
        type: TERMINAL_WS_MESSAGE_TYPES.RUN_FOREGROUND,
        project_id: prepare.project_id,
        work_dir: prepare.work_dir || '',
        conda_env_name: prepare.conda_env_name || '',
        command,
        port: prepare.port || '',
      })
    } catch (error) {
      if (typeof terminalStore.clearSessionForeground === 'function') {
        terminalStore.clearSessionForeground(sessionId)
      }
      throw error
    }
  }

  const executeCommand = async (rawCommand = commandInput.value) => {
    const session = activeSession.value
    if (!session) {
      ElMessage.warning(terminalMessages.createSessionFirst)
      return
    }

    if (session.locked) {
      ElMessage.warning(session.lockReason || terminalMessages.commandBlockedByTask)
      return
    }

    const raw = String(rawCommand ?? '')
    const command = raw.trim()
    if (!command) {
      try {
        await sendSocketMessage(session.id, { type: TERMINAL_WS_MESSAGE_TYPES.INPUT, text: TERMINAL_NEWLINE_INPUT })
        commandInput.value = ''
        resetHistoryCursor()
        if (!keepHistoryView.value) {
          scrollToBottom()
        }
      } catch (error) {
        const msg = getErrorMessage(error, terminalMessages.commandSendFailed)
        terminalStore.appendLine(session.id, msg)
        ElMessage.error(msg)
        commandInput.value = ''
        resetHistoryCursor()
        if (!keepHistoryView.value) {
          scrollToBottom()
        }
      }
      return
    }

    pushCommandHistory(command)

    if (command.toLowerCase() === TERMINAL_CLEAR_COMMAND) {
      terminalStore.clearSession(session.id, '')
      commandInput.value = ''
      resetHistoryCursor()
      keepHistoryView.value = false
      scrollToBottom()
      return
    }

    try {
      await sendSocketMessage(session.id, { type: TERMINAL_WS_MESSAGE_TYPES.INPUT, text: `${command}${TERMINAL_NEWLINE_INPUT}` })
      commandInput.value = ''
      resetHistoryCursor()
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    } catch (error) {
      const msg = getErrorMessage(error, terminalMessages.commandSendFailed)
      terminalStore.appendLine(session.id, msg)
      ElMessage.error(msg)
      commandInput.value = ''
      resetHistoryCursor()
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    }
  }

  const handleCommandTabComplete = async () => {
    const session = activeSession.value
    if (!session || session.locked || tabCompletionBusy.value) return

    const rawCommand = String(commandInput.value || '')
    if (!rawCommand) return
    if (!session.remoteSessionId) return

    const now = Date.now()
    const cached = lastTabState.value
    if (cached.sessionId === session.id
      && cached.rawCommand === rawCommand
      && cached.candidatesKey
      && now - cached.at < TERMINAL_TAB_REPEAT_MS) {
      terminalStore.appendLine(session.id, cached.candidatesKey.split(TERMINAL_CANDIDATE_SEPARATOR).join(TERMINAL_CANDIDATE_DISPLAY_SEPARATOR))
      lastTabState.value = { ...cached, at: 0 }
      if (!keepHistoryView.value) scrollToBottom()
      return
    }

    tabCompletionBusy.value = true
    try {
      await sendSocketMessage(session.id, {
        type: TERMINAL_WS_MESSAGE_TYPES.COMPLETE,
        command: rawCommand,
      })
    } catch (error) {
      tabCompletionBusy.value = false
      ElMessage.warning(getErrorMessage(error, terminalMessages.commandSendFailed))
    }
  }

  const handleConsoleShortcut = (event) => {
    if (event.key === 'ArrowUp') {
      const session = activeSession.value
      if (!session || session.locked || !commandHistory.value.length) return
      event.preventDefault()
      const nextCursor = historyCursor.value <= 0 ? 0 : historyCursor.value - 1
      historyCursor.value = nextCursor
      commandInput.value = commandHistory.value[nextCursor] || ''
      return
    }

    if (event.key === 'ArrowDown') {
      const session = activeSession.value
      if (!session || session.locked || !commandHistory.value.length) return
      event.preventDefault()
      const nextCursor = historyCursor.value + 1
      if (nextCursor >= commandHistory.value.length) {
        historyCursor.value = commandHistory.value.length
        commandInput.value = ''
      } else {
        historyCursor.value = nextCursor
        commandInput.value = commandHistory.value[nextCursor] || ''
      }
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      const session = activeSession.value
      if (!session || session.locked) return
      sendSocketMessage(session.id, { type: TERMINAL_WS_MESSAGE_TYPES.INPUT, text: TERMINAL_CTRL_C_INPUT }).catch(() => {
        terminalStore.appendLine(session.id, TERMINAL_CTRL_C_DISPLAY_TEXT)
      })
      const foregroundProject = typeof getForegroundProjectBySessionId === 'function'
        ? getForegroundProjectBySessionId(String(session.id))
        : null
      if (foregroundProject?.id && typeof onCtrlC === 'function') {
        onCtrlC({ session, appendLine: (line) => terminalStore.appendLine(session.id, line), skipBackendStop: true })
      }
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
      event.preventDefault()
      const session = activeSession.value
      if (!session || session.locked) return
      terminalStore.clearSession(session.id, '')
      keepHistoryView.value = false
      scrollToBottom()
    }
  }

  return {
    consoleRef,
    terminalLines,
    scrollToBottom,
    activeSessionAlias,
    activeSessionIp,
    activeSessionLocked,
    activeSessionLockReason,
    appendTerminal,
    appendSessionLine,
    appendSessionChunk,
    appendSessionLines,
    lockSession,
    unlockSession,
    switchSession,
    addSiblingSession,
    closeSession,
    sessionDialogVisible,
    sessionDialogWidth,
    sessionDialogFieldsForView,
    createSessionForm,
    openSessionDialog,
    confirmCreateSession,
    downloadDialogVisible,
    downloadDialogLoading,
    downloadPathOptions,
    downloadSelectedPath,
    downloadPathCascaderValue,
    downloadCurrentPath,
    downloadRootPath,
    downloadParentPath,
    downloadCanGoParent,
    loadDownloadOptions,
    enterDownloadDirectory,
    goDownloadParent,
    selectDownloadPath,
    loadDownloadCascaderChildren,
    onDownloadPathChange,
    clearDownloadPath,
    confirmDownloadFile,
    ensureCreateProjectSession,
    ensureProjectTaskSession,
    uploadFile,
    downloadFile,
    commandInput,
    executeCommand,
    executeSessionCommand,
    runProjectForegroundInSession,
    handleCommandTabComplete,
    handleConsoleShortcut,
    refreshSessions,
    onConsoleScroll,
  }
}

