import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { TERMINAL_WS_PROTOCOL, buildTerminalDirectDownloadUrl, buildTerminalWsUrl, getTerminalWsToken, terminalApi } from '@/api/terminal'
import { getErrorMessage } from '@/utils/request'

const parseJson = (text, fallback) => {
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

const getUserIdentity = (auth) => {
  const user = auth?.user || parseJson(window.localStorage.getItem('pspm_user'), null)
  return String(user?.id || user?.userid || user?.username || 'guest')
}

const splitOutput = (text) => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized) return []
  const lines = normalized.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines
}



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
    if (auth.role === 'root') return Array.isArray(projectStore?.servers) ? projectStore.servers : []
    const username = String(auth.user?.username || '')
    const serverList = Array.isArray(projectStore?.servers) ? projectStore.servers : []
    if (!username) return serverList
    return serverList.filter((server) => {
      const users = String(server.users || '')
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
      return users.includes(username)
    })
  })

  const sessionOptions = computed(() =>
    availableServers.value.map((server) => ({
      label: server.alias ? `${server.alias} (${server.ip})` : server.ip,
      value: server.ip,
      title: server.ip,
    })),
  )

  const terminalLines = computed(() => {
    const active = terminalStore.getSession(terminalStore.activeSessionId)
    return active ? active.lines : []
  })

  const activeSession = computed(() => terminalStore.getSession(terminalStore.activeSessionId))

  const activeSessionAlias = computed(() => activeSession.value?.alias || 'default')
  const activeSessionIp = computed(() => activeSession.value?.serverIp || '')
  const activeSessionLocked = computed(() => !!activeSession.value?.locked)
  const activeSessionLockReason = computed(() => String(activeSession.value?.lockReason || ''))

  const sessionDialogWidth = '560px'
  const sessionDialogFieldsForView = computed(() => [
    {
      key: 'serverIp',
      label: '服务器IP',
      component: 'select',
      options: sessionOptions.value,
      placeholder: '请选择可用服务器',
    },
    {
      key: 'alias',
      label: '会话别名',
      component: 'input',
      placeholder: '如：srv',
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

  const lockSession = (sessionId, reason = '任务执行中') => {
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
    const candidatesKey = candidates.join('\u0001')

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
        && now - lastTabState.value.at < 3000
      if (sameTap) {
        terminalStore.appendLine(sessionId, candidates.join('  '))
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
      reject(new Error('\u767b\u5f55\u4ee4\u724c\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u521b\u5efa\u7ec8\u7aef\u8fde\u63a5'))
      return
    }
    const socket = new WebSocket(buildTerminalWsUrl(token), TERMINAL_WS_PROTOCOL)
    let settled = false
    const failTimer = window.setTimeout(() => {
      if (settled) return
      settled = true
      try { socket.close() } catch {}
      reject(new Error('\u7ec8\u7aef\u8fde\u63a5\u8d85\u65f6'))
    }, 10000)

    const sendOpen = () => {
      socket.send(JSON.stringify({ type: 'open', server_ip: serverIp, alias, session_id: remoteSessionId || '' }))
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
      if (type === 'ready') {
        window.clearTimeout(failTimer)
        settled = true
        terminalStore.setSessionRemoteId(localSessionId, data.session_id || '')
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.setSessionSocket(localSessionId, socket)
        if (reconnect && data.reconnected) {
          terminalStore.appendLine(localSessionId, '')
          terminalStore.appendLine(localSessionId, '[\u7cfb\u7edf] \u7ec8\u7aef\u8fde\u63a5\u5df2\u6062\u590d')
          terminalStore.appendLine(localSessionId, '')
        }
        resolve(socket)
        return
      }
      if (type === 'output') {
        appendSessionChunk(localSessionId, data.text || '')
        return
      }
      if (type === 'foreground_started') {
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.appendLine(localSessionId, '')
        terminalStore.appendLine(localSessionId, `\u524d\u53f0\u670d\u52a1\u5df2\u542f\u52a8\uff1aPID=${data.pid || ''}${data.port ? ` \u7aef\u53e3=${data.port}` : ''}`)
        terminalStore.appendLine(localSessionId, '')
        projectStore.updateProjectServiceStatus(data.project_id, {
          service_status: '\u8fd0\u884c\u4e2d',
          running_port: data.port || '',
        })
        return
      }
      if (type === 'foreground_pending') {
        if (data.cwd) terminalStore.setSessionCwd(localSessionId, data.cwd)
        if (data.conda_env_name) terminalStore.setSessionCondaEnv(localSessionId, data.conda_env_name)
        terminalStore.appendLine(localSessionId, '')
        terminalStore.appendLine(localSessionId, data.message || '\u542f\u52a8\u547d\u4ee4\u5df2\u53d1\u9001')
        terminalStore.appendLine(localSessionId, '')
        return
      }
      if (type === 'complete_result') {
        applyTabCompletionResult(localSessionId, data)
        tabCompletionBusy.value = false
        return
      }
      if (type === 'error') {
        terminalStore.appendLine(localSessionId, data.message || '\u7ec8\u7aef\u8fde\u63a5\u5f02\u5e38')
        tabCompletionBusy.value = false
        if (!settled) {
          window.clearTimeout(failTimer)
          settled = true
          reject(new Error(data.message || '\u7ec8\u7aef\u8fde\u63a5\u5f02\u5e38'))
        }
        return
      }
      if (type === 'closed') {
        terminalStore.appendLine(localSessionId, data.message || '\u7ec8\u7aef\u4f1a\u8bdd\u5df2\u5173\u95ed')
        if (data.project_id) {
          projectStore.updateProjectServiceStatus(data.project_id, {
            service_status: '\u5df2\u505c\u6b62',
            running_port: '',
          })
        }
      }
    }
    socket.onerror = () => {
      if (!settled) {
        window.clearTimeout(failTimer)
        settled = true
        reject(new Error('\u7ec8\u7aef\u8fde\u63a5\u5931\u8d25'))
      } else {
        terminalStore.appendLine(localSessionId, '\u7ec8\u7aef\u8fde\u63a5\u5f02\u5e38')
      }
    }
    socket.onclose = () => {
      window.clearTimeout(failTimer)
      terminalStore.removeSessionSocket(localSessionId)
      if (!settled) {
        settled = true
        reject(new Error('\u7ec8\u7aef\u8fde\u63a5\u5df2\u5173\u95ed'))
      }
    }
  })

  const ensureSocketConnected = async (sessionId) => {
    const session = terminalStore.getSession(sessionId)
    if (!session) throw new Error('\u7ec8\u7aef\u4f1a\u8bdd\u4e0d\u5b58\u5728')

    const socket = terminalStore.getSessionSocket(session.id)
    if (socket && socket.readyState === WebSocket.OPEN) return socket

    if (!session.serverIp || !session.remoteSessionId) {
      throw new Error('\u7ec8\u7aef WebSocket \u672a\u8fde\u63a5')
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
      hostLabel: hostLabel || 'wcp',
      remoteSessionId: '',
      cwd: '/root',
      welcomeMessage: `\u6b63\u5728\u8fde\u63a5\uff1a${serverIp}`,
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
      throw new Error('服务器IP不能为空')
    }
    const lastPart = String(serverIp).split('.').pop() || 'server'
    const baseAlias = `${lastPart}_create_project`
    const server = availableServers.value.find((item) => item.ip === serverIp)
    const hostLabel = server?.alias || 'wcp'
    const created = await createSessionByServer(serverIp, baseAlias, hostLabel)
    terminalStore.setActiveSession(created.localSessionId)
    scrollToBottom()
    return created
  }

  const ensureProjectTaskSession = async (serverIp, suffix = 'task', options = {}) => {
    if (!serverIp) {
      throw new Error('\u670d\u52a1\u5668IP\u4e0d\u80fd\u4e3a\u7a7a')
    }

    const shouldReuseSession = options.reuse !== false
    if (shouldReuseSession) {
      const sessions = typeof terminalStore.getSessions === 'function' ? terminalStore.getSessions() : []
      const sameServerSessions = sessions.filter((item) => String(item?.serverIp || '') === String(serverIp))
      const reusableSession = sameServerSessions.find((item) => !item.locked)
      if (reusableSession) {
        terminalStore.setActiveSession(reusableSession.id)
        await ensureSocketConnected(reusableSession.id)
        scrollToBottom()
        return {
          localSessionId: reusableSession.id,
          finalAlias: reusableSession.alias,
          remoteSessionId: reusableSession.remoteSessionId || '',
        }
      }
      if (sameServerSessions.length) {
        throw new Error('\u5f53\u524d\u670d\u52a1\u5668\u7ec8\u7aef\u4f1a\u8bdd\u4efb\u52a1\u6267\u884c\u4e2d\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5')
      }
    }

    const lastPart = String(serverIp).split('.').pop() || 'server'
    const safeSuffix = String(suffix || 'task').replace(/^_+/, '')
    const baseAlias = `${lastPart}_${safeSuffix}`
    const server = availableServers.value.find((item) => item.ip === serverIp)
    const hostLabel = server?.alias || 'wcp'
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
      ElMessage.success(`已在服务器 ${baseSession.serverIp} 创建新会话：${result.finalAlias}`)
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '创建会话失败'))
    }
  }

  const closeSession = async (sessionId) => {
    const closing = terminalStore.getSession(sessionId)
    if (!closing) return

    if (closing.locked) {
      ElMessage.warning(closing.lockReason || '\u8be5\u4f1a\u8bdd\u4efb\u52a1\u6267\u884c\u4e2d\uff0c\u6682\u4e0d\u53ef\u5173\u95ed')
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
        ElMessage.warning('前台服务未停止，暂不关闭会话')
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
      ElMessage.warning(getErrorMessage(error, '\u5173\u95ed\u8fdc\u7a0b\u4f1a\u8bdd\u5931\u8d25\uff0c\u5df2\u5173\u95ed\u672c\u5730\u4f1a\u8bdd'))
    }

    const ok = terminalStore.closeSession(sessionId, { skipRemoteClose: remoteClosed })
    if (!ok) return

    ElMessage.success(`\u5df2\u5173\u95ed\u4f1a\u8bdd\uff1a${closing.alias}`)
    scrollToBottom()
  }

  const openSessionDialog = () => {
    createSessionForm.serverIp = ''
    createSessionForm.alias = ''
    sessionDialogVisible.value = true
  }

  const confirmCreateSession = async () => {
    if (!createSessionForm.serverIp) {
      ElMessage.warning('请选择服务器IP')
      return
    }
    if (!createSessionForm.alias.trim()) {
      ElMessage.warning('会话别名不能为空')
      return
    }

    const server = availableServers.value.find((item) => item.ip === createSessionForm.serverIp)
    if (!server) {
      ElMessage.warning('该服务器不在当前用户可用范围内')
      return
    }

    try {
      const result = await createSessionByServer(
        server.ip,
        createSessionForm.alias.trim(),
        server.alias || 'wcp',
      )

      sessionDialogVisible.value = false
      terminalStore.setActiveSession(result.localSessionId)
      ElMessage.success('会话创建成功')
      keepHistoryView.value = false
      scrollToBottom()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '会话创建失败'))
    }
  }

  const startNativeDownload = (url) => {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const ensureActiveTransferSession = () => {
    const session = activeSession.value
    if (!session) {
      ElMessage.warning('请创建一个终端会话')
      return null
    }
    if (!session.remoteSessionId) {
      ElMessage.warning('当前终端会话尚未连接完成')
      return null
    }
    return session
  }

  const pickUploadEntries = () => new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.style.display = 'none'
    input.onchange = () => {
      const files = Array.from(input.files || [])
      document.body.removeChild(input)
      resolve(files)
    }
    document.body.appendChild(input)
    input.click()
  })

  const uploadFile = async () => {
    const session = ensureActiveTransferSession()
    if (!session) return

    const files = await pickUploadEntries()
    if (!files.length) return

    try {
      for (const file of files) {
        const relativePath = String(file.webkitRelativePath || '')
        await terminalApi.upload({
          session_id: session.remoteSessionId,
          target_path: '',
          relative_path: relativePath,
          file,
        })
        terminalStore.appendLine(session.id, `已上传：${relativePath || file.name}`)
      }
      ElMessage.success('上传完成')
    } catch (error) {
      const msg = getErrorMessage(error, '上传失败')
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
      const children = options.map((item) => ({
        label: item.name || item.path,
        value: item.path,
        leaf: item.type !== 'dir',
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
      }))
      if (targetNode) {
        targetNode.children = children
      } else {
        downloadPathOptions.value = children
        downloadPathCascaderValue.value = []
        downloadSelectedPath.value = ''
      }
      return true
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '加载下载列表失败'))
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
      ElMessage.warning('当前目录暂无可下载文件或目录')
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
      const children = options.map((item) => ({
        label: item.name || item.path,
        value: item.path,
        leaf: item.type !== 'dir',
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
      }))
      resolve(children)
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '加载下载列表失败'))
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
      if (!ticket) throw new Error('下载凭证生成失败')
      startNativeDownload(buildTerminalDirectDownloadUrl(ticket))
      terminalStore.appendLine(session.id, `开始下载：${path}`)
      ElMessage.success('已开始下载，请在浏览器下载栏查看进度')
    } catch (error) {
      const msg = getErrorMessage(error, '下载失败')
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
    commandHistory.value = list.slice(-100)
    historyCursor.value = commandHistory.value.length
  }

  function resetHistoryCursor() {
    historyCursor.value = commandHistory.value.length
  }

  const executeSessionCommand = async (sessionId, rawCommand, options = {}) => {
    const session = terminalStore.getSession(sessionId)
    if (!session) throw new Error('\u7ec8\u7aef\u4f1a\u8bdd\u4e0d\u5b58\u5728')
    const command = String(rawCommand || '').trim()
    if (!command) throw new Error('\u547d\u4ee4\u4e0d\u80fd\u4e3a\u7a7a')
    await sendSocketMessage(session.id, { type: 'input', text: `${command}\n` })
    return { stdout: '', stderr: '', exit_code: 0 }
  }

  const runProjectForegroundInSession = async (sessionId, prepare = {}) => {
    const command = String(prepare.command || '').trim()
    if (!command) throw new Error('\u6682\u65e0\u914d\u7f6e\u542f\u52a8\u547d\u4ee4')
    await sendSocketMessage(sessionId, {
      type: 'run_foreground',
      project_id: prepare.project_id,
      work_dir: prepare.work_dir || '',
      conda_env_name: prepare.conda_env_name || '',
      command,
      port: prepare.port || '',
    })
  }

  const executeCommand = async (rawCommand = commandInput.value) => {
    const session = activeSession.value
    if (!session) {
      ElMessage.warning('\u8bf7\u5148\u521b\u5efa\u4f1a\u8bdd')
      return
    }

    if (session.locked) {
      ElMessage.warning(session.lockReason || '\u5f53\u524d\u4f1a\u8bdd\u4efb\u52a1\u6267\u884c\u4e2d\uff0c\u6682\u4e0d\u53ef\u8f93\u5165\u547d\u4ee4')
      return
    }

    const raw = String(rawCommand ?? '')
    const command = raw.trim()
    if (!command) {
      try {
        await sendSocketMessage(session.id, { type: 'input', text: '\n' })
        commandInput.value = ''
        resetHistoryCursor()
        if (!keepHistoryView.value) {
          scrollToBottom()
        }
      } catch (error) {
        const msg = getErrorMessage(error, '\u547d\u4ee4\u53d1\u9001\u5931\u8d25')
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

    if (command.toLowerCase() === 'clear') {
      terminalStore.clearSession(session.id, '')
      commandInput.value = ''
      resetHistoryCursor()
      keepHistoryView.value = false
      scrollToBottom()
      return
    }

    try {
      await sendSocketMessage(session.id, { type: 'input', text: `${command}\n` })
      commandInput.value = ''
      resetHistoryCursor()
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    } catch (error) {
      const msg = getErrorMessage(error, '\u547d\u4ee4\u53d1\u9001\u5931\u8d25')
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
      && now - cached.at < 3000) {
      terminalStore.appendLine(session.id, cached.candidatesKey.split('\u0001').join('  '))
      lastTabState.value = { ...cached, at: 0 }
      if (!keepHistoryView.value) scrollToBottom()
      return
    }

    tabCompletionBusy.value = true
    try {
      await sendSocketMessage(session.id, {
        type: 'complete',
        command: rawCommand,
      })
    } catch (error) {
      tabCompletionBusy.value = false
      ElMessage.warning(getErrorMessage(error, '\u547d\u4ee4\u53d1\u9001\u5931\u8d25'))
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
      sendSocketMessage(session.id, { type: 'input', text: '\u0003' }).catch(() => {
        terminalStore.appendLine(session.id, '^C')
      })
      if (typeof onCtrlC === 'function') {
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

