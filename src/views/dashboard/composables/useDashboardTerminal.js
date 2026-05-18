import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { terminalApi } from '@/api/terminal'
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

const isSessionMissingError = (error) => {
  const status = Number(error?.response?.status || 0)
  const message = getErrorMessage(error, '')
  if (message.includes('会话不存在')) return true
  return status === 404
}

const buildPromptFromSession = (session) => {
  const cwd = String(session?.cwd || '/root')
  const host = String(session?.hostLabel || session?.alias || 'wcp')
  const display = cwd === '/root' ? '~' : (cwd.startsWith('/root/') ? `~${cwd.slice('/root'.length)}` : cwd)
  return `(base) [root@${host} ${display}]#`
}

export const useDashboardTerminal = (options) => {
  const { terminalStore, projectStore } = options
  const auth = useAuthStore()

  const consoleRef = ref()
  const commandInput = ref('')
  const sessionDialogVisible = ref(false)
  const tabCompletionBusy = ref(false)
  const keepHistoryView = ref(false)
  const lastTabState = ref({
    sessionId: '',
    rawCommand: '',
    candidatesKey: '',
    at: 0,
  })

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

  watch(
    currentUserIdentity,
    () => {
      refreshSessions()
      commandInput.value = ''
    },
    { immediate: true },
  )

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

  const createSessionByServer = async (serverIp, baseAlias, hostLabel) => {
    const finalAlias = terminalStore.buildNextAlias(serverIp, baseAlias)

    const resp = await terminalApi.createSession({
      server_ip: serverIp,
      alias: finalAlias,
    })

    const data = resp.data?.data || {}
    const localSessionId = terminalStore.createSessionLocal({
      serverIp,
      alias: finalAlias,
      baseAlias,
      hostLabel: hostLabel || 'wcp',
      remoteSessionId: data.session_id || '',
      cwd: data.cwd || '/root',
      welcomeMessage: data.welcome_message || '连接成功！',
      prompt: data.prompt || '',
    })

    return {
      localSessionId,
      finalAlias,
      remoteSessionId: data.session_id || '',
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

  const ensureProjectTaskSession = async (serverIp, suffix = 'task') => {
    if (!serverIp) {
      throw new Error('\u670d\u52a1\u5668IP\u4e0d\u80fd\u4e3a\u7a7a')
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
      ElMessage.warning(closing.lockReason || '该会话任务执行中，暂不可关闭')
      return
    }

    try {
      if (closing.remoteSessionId) {
        await terminalApi.closeSession({ session_id: closing.remoteSessionId })
      }
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, '关闭远程会话失败，已关闭本地会话'))
    }

    const ok = terminalStore.closeSession(sessionId)
    if (!ok) return

    ElMessage.success(`已关闭会话：${closing.alias}`)
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

  const uploadFile = () => {
    if (!activeSession.value) return
    appendTerminal(`[上传] ${activeSessionAlias.value}：请选择具体文件`)
  }

  const downloadFile = () => {
    if (!activeSession.value) return
    appendTerminal(`[下载] ${activeSessionAlias.value}：请选择具体文件`)
  }

  const executeCommand = async (rawCommand = commandInput.value) => {
    const session = activeSession.value
    if (!session) {
      ElMessage.warning('请先创建会话')
      return
    }

    if (session.locked) {
      ElMessage.warning(session.lockReason || '当前会话任务执行中，暂不可输入命令')
      return
    }

    const command = String(rawCommand || '').trim()
    if (!command) {
      ElMessage.warning('请输入命令')
      return
    }

    if (command.toLowerCase() === 'clear') {
      const prompt = buildPromptFromSession(session)
      terminalStore.clearSession(session.id, prompt)
      commandInput.value = ''
      keepHistoryView.value = false
      scrollToBottom()
      return
    }

    const recreateRemoteSession = async (targetSession) => {
      const serverIp = String(targetSession?.serverIp || '').trim()
      const alias = String(targetSession?.alias || targetSession?.baseAlias || 'session').trim()
      if (!serverIp) {
        throw new Error('当前会话缺少服务器IP，无法自动重连')
      }
      if (!alias) {
        throw new Error('当前会话缺少别名，无法自动重连')
      }

      const reconnectResp = await terminalApi.createSession({
        server_ip: serverIp,
        alias,
      })
      const reconnectData = reconnectResp.data?.data || {}
      const remoteSessionId = String(reconnectData.session_id || '').trim()
      if (!remoteSessionId) {
        throw new Error('自动重连失败：后端未返回会话ID')
      }

      terminalStore.setSessionRemoteId(targetSession.id, remoteSessionId)
      if (reconnectData.cwd) {
        terminalStore.setSessionCwd(targetSession.id, reconnectData.cwd)
      }
      return remoteSessionId
    }

    const applyExecuteResult = (sessionId, result) => {
      const stdoutLines = splitOutput(result.stdout)
      const stderrLines = splitOutput(result.stderr)

      if (stdoutLines.length) terminalStore.appendLines(sessionId, stdoutLines)
      if (stderrLines.length) terminalStore.appendLines(sessionId, stderrLines)

      if (result.cwd) terminalStore.setSessionCwd(sessionId, result.cwd)

      const nextPrompt = result.prompt_after || buildPromptFromSession(terminalStore.getSession(sessionId))
      terminalStore.appendLine(sessionId, nextPrompt)
    }

    let remoteSessionId = String(session.remoteSessionId || '').trim()
    if (!remoteSessionId) {
      try {
        terminalStore.appendLine(session.id, '[系统] 检测到会话未绑定远程ID，正在自动重连...')
        remoteSessionId = await recreateRemoteSession(session)
        terminalStore.appendLine(session.id, `[系统] 会话已自动重连：${session.alias} (${session.serverIp})`)
      } catch (error) {
        ElMessage.error(getErrorMessage(error, '自动重连失败，请重新创建会话'))
        if (!keepHistoryView.value) {
          scrollToBottom()
        }
        return
      }
    }

    const promptBefore = buildPromptFromSession(session)
    terminalStore.appendLine(session.id, `${promptBefore} ${command}`)

    try {
      const resp = await terminalApi.execute({
        session_id: remoteSessionId,
        command,
      })
      const result = resp.data?.data || {}
      applyExecuteResult(session.id, result)

      commandInput.value = ''
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    } catch (error) {
      if (isSessionMissingError(error)) {
        try {
          terminalStore.appendLine(session.id, '[系统] 检测到远程会话已失效，正在自动重连...')
          remoteSessionId = await recreateRemoteSession(session)
          terminalStore.appendLine(session.id, `[系统] 会话已自动重连：${session.alias} (${session.serverIp})`)

          const retryResp = await terminalApi.execute({
            session_id: remoteSessionId,
            command,
          })
          const retryResult = retryResp.data?.data || {}
          applyExecuteResult(session.id, retryResult)
          commandInput.value = ''
          if (!keepHistoryView.value) {
            scrollToBottom()
          }
          return
        } catch (retryError) {
          const retryMsg = getErrorMessage(retryError, '自动重连后重试失败')
          terminalStore.appendLine(session.id, retryMsg)
          terminalStore.appendLine(session.id, buildPromptFromSession(terminalStore.getSession(session.id)))
          ElMessage.error(retryMsg)
          commandInput.value = ''
          if (!keepHistoryView.value) {
            scrollToBottom()
          }
          return
        }
      }

      const msg = getErrorMessage(error, '命令执行失败')
      terminalStore.appendLine(session.id, msg)
      terminalStore.appendLine(session.id, buildPromptFromSession(terminalStore.getSession(session.id)))
      ElMessage.error(msg)
      commandInput.value = ''
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

    tabCompletionBusy.value = true
    try {
      const resp = await terminalApi.complete({
        session_id: session.remoteSessionId,
        command: rawCommand,
      })
      const data = resp.data?.data || {}
      const completedCommand = String(data.completed_command || rawCommand)
      const candidates = Array.isArray(data.candidates) ? data.candidates : []
      const now = Date.now()
      const candidatesKey = candidates.join('\u0001')

      if (completedCommand !== rawCommand) {
        commandInput.value = completedCommand
        lastTabState.value = {
          sessionId: session.id,
          rawCommand: completedCommand,
          candidatesKey: '',
          at: now,
        }
      } else if (candidates.length > 1) {
        const shouldShowCandidates =
          lastTabState.value.sessionId === session.id
          && lastTabState.value.rawCommand === rawCommand
          && lastTabState.value.candidatesKey === candidatesKey
          && now - Number(lastTabState.value.at || 0) <= 1500

        if (shouldShowCandidates) {
          terminalStore.appendLine(session.id, `候选项（${candidates.length}）：${candidates.join('    ')}`)
          terminalStore.appendLine(session.id, terminalStore.buildPrompt(terminalStore.getSession(session.id)))
          lastTabState.value = {
            sessionId: session.id,
            rawCommand,
            candidatesKey: '',
            at: now,
          }
        } else {
          lastTabState.value = {
            sessionId: session.id,
            rawCommand,
            candidatesKey,
            at: now,
          }
        }
      } else {
        lastTabState.value = {
          sessionId: session.id,
          rawCommand,
          candidatesKey: '',
          at: now,
        }
      }
      if (!keepHistoryView.value) {
        scrollToBottom()
      }
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, '自动补全失败'))
    } finally {
      tabCompletionBusy.value = false
    }
  }

  const handleConsoleShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
      event.preventDefault()
      const session = activeSession.value
      if (!session || session.locked) return
      const prompt = buildPromptFromSession(session)
      terminalStore.clearSession(session.id, prompt)
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
    ensureCreateProjectSession,
    ensureProjectTaskSession,
    uploadFile,
    downloadFile,
    commandInput,
    executeCommand,
    handleCommandTabComplete,
    handleConsoleShortcut,
    refreshSessions,
    onConsoleScroll,
  }
}
