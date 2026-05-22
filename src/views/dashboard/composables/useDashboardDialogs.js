import { reactive, ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { appConfig } from '@/config/app/app.config'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import {
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  PROJECT_CREATING_TEXT,
  PROJECT_SETTING_TEXT,
  PROJECT_SYNCING_TEXT,
  PROJECT_RUNNING_TEXT,
  PROJECT_STOPPED_TEXT,
} from './dialogConstants'
import {
  fillDeleteText,
} from './dialogUtils'
import { useCreateProjectDialog } from './project-create/useCreateProjectDialog'
import { useSyncProjectDialog } from './project-sync/useSyncProjectDialog'
import { useServerUserDialog } from './server-user/useServerUserDialog'
import { useProjectDeleteDialog } from './project-delete/useProjectDeleteDialog'
import {
  buildProjectSettingPayload,
  buildProjectSettingStorePatch,
  fillProjectSettingForm,
} from './project-setting/projectSettingMapper'

export const useDashboardDialogs = (options) => {
  const {
    layout,
    projectStore,
    activeSessionAlias,
    activeSessionIp,
    appendTerminal,
    ensureCreateProjectSession,
    ensureProjectTaskSession,
    appendSessionLine,
    appendSessionLines,
    runProjectForegroundInSession,
    lockSession,
    unlockSession,
    canAction,
    projectDeleteSuccessTextTemplate,
    userDeleteConfirmTextTemplate,
    userDeleteSuccessTextTemplate,
  } = options

  const selectedProject = ref(null)
  const selectedProjectDetail = ref(null)
  const projectDetailLoading = ref(false)
  const projectDrawerVisible = ref(false)
  const projectLogDialogVisible = ref(false)
  const projectLogLoading = ref(false)
  const projectLogData = ref({ project_id: 0, project_name: '', total: 0, data: [] })
  const foregroundProjectBySessionId = reactive({})

  const projectDialogVisible = ref(false)
  const syncProjectDialogVisible = ref(false)
  const userDialogVisible = ref(false)
  const envDialogVisible = ref(false)
  const serverDialogVisible = ref(false)
  const settingDialogVisible = ref(false)
  const copyDialogVisible = ref(false)
  const exportDialogVisible = ref(false)
  const toolDialogVisible = ref(false)

  const projectCreateForm = reactive({
    name: '',
    description: '',
    path: '',
    condaName: '',
    enableDatabase: false,
    databaseName: '',
    databaseHost: '',
    databasePort: '',
    databaseUser: '',
    databasePassword: '',
    dbChecked: false,
    enableNginx: false,
    nginxChecked: false,
    nginxChecking: false,
    nginxServerIp: '',
    nginxConfPath: '',
    nginxConfigText: '',
    nginxConfOptions: [],
    nginxNewConfDirs: [],
    nginxExistingConfPath: '',
    nginxNewConfBaseDir: '',
    nginxNewConfDirPath: '',
    nginxNewConfDirCascaderValue: [],
    nginxNewConfFileName: '',
    nginxFrontendPort: '',
    nginxBackendPort: '',
    nginxFrontendPortChecked: false,
    nginxBackendPortChecked: false,
    nginxPreviewVisible: false,
    nginxPreviewText: '',
    nginxPreviewDraft: '',
    nginxPreviewConfirmed: false,
    pythonVersion: '',
    serverIp: '',
  })

  const syncProjectForm = reactive({
    serverIp: '',
    basePath: '',
    projectPathOptions: [],
    projectPathCascaderValue: [],
    projectPathReady: false,
    projectPathLoading: false,
    projectRelPath: '',
    backendPath: '',
    entryPathOptions: [],
    entryPathCascaderValue: [],
    entryRelPath: '',
    entryFilePath: '',
    name: '',
    description: '',
    condaEnvName: '',
    condaEnvOptions: [],
    condaEnvPath: '',
    pythonVersion: '',
    condaChecked: false,
    condaChecking: false,
    condaLoading: false,
    enableDatabase: false,
    databaseName: '',
    databaseOptions: [],
    databaseHost: '',
    databasePort: DEFAULT_DB_PORT,
    databaseUser: DEFAULT_DB_USER,
    databasePassword: DEFAULT_DB_PASSWORD,
    dbChecked: false,
    dbChecking: false,
    dbMessage: '',
    enableNginx: false,
    nginxServerIp: '',
    nginxChecked: false,
    nginxChecking: false,
    nginxConfOptions: [],
    nginxExistingConfPath: '',
    nginxConfPath: '',
    nginxServerPortOptions: [],
    nginxSelectedServerBlock: '',
    nginxFrontendPort: '',
    nginxBackendPort: '',
    nginxFrontendPortChecked: false,
    nginxBackendPortChecked: false,
    syncing: false,
  })

  const createUserForm = reactive({
    username: '',
    password: '',
  })

  const envCreateForm = reactive({
    name: 'demo_api',
    pythonVersion: '3.11',
    description: '用于快速创建，来源于历史项目',
  })

  const serverCreateForm = reactive({
    ip: '',
    rootPassword: '',
    remark: '新服务器',
  })

  const settingForm = reactive({
    projectId: 0,
    projectName: '',
    description: '',
    descriptionModifyEnabled: false,
    condaEnvName: '',
    condaModifyEnabled: false,
    pythonVersion: '',
    createCondaEnv: false,
    dropOriginalCondaEnv: false,
    backendPath: '',
    entryFilePath: '',
    entryFilePathModifyEnabled: false,
    entryFilePathCascaderValue: [],
    backendDevPort: '',
    backendDeployPort: '',
    frontendPort: '',
    nginxEnabled: false,
    nginxModifyEnabled: false,
    nginxServerIp: '',
    nginxConfPath: '',
    nginxConfigText: '',
    nginxConfOptions: [],
    nginxNewConfDirs: [],
    nginxExistingConfPath: '',
    nginxNewConfBaseDir: '',
    nginxNewConfDirPath: '',
    nginxNewConfDirCascaderValue: [],
    nginxNewConfFileName: '',
    nginxChecked: false,
    nginxChecking: false,
    nginxFrontendPortChecked: false,
    nginxBackendPortChecked: false,
    nginxPreviewVisible: false,
    nginxPreviewText: '',
    nginxPreviewDraft: '',
    nginxPreviewConfirmed: false,
    frontendPath: '',
    currentUsername: '',
    currentRole: '',
    devCommand: '',
    devCommandModifyEnabled: false,
    deployCommand: '',
    deployCommandModifyEnabled: false,
    serverIp: '',
    serverIpOptions: [],
    databaseName: '',
    databaseModifyEnabled: false,
    databaseHost: '',
    databasePort: DEFAULT_DB_PORT,
    databaseUser: DEFAULT_DB_USER,
    databasePassword: DEFAULT_DB_PASSWORD,
    remark: '配置后会覆盖 Nginx 端口信息',
  })

  const copyForm = reactive({
    projectName: '',
    targetServerIp: '',
    targetDir: appConfig.defaultCopyDir,
  })

  const exportForm = reactive({
    projectName: '',
    targetDir: appConfig.defaultExportDir,
  })

  const toolForm = reactive({
    projectId: 0,
    projectName: '',
  })

  const deleteUserDialogVisible = ref(false)
  const deleteUserTarget = ref(null)
  const deleteUserMigrate = ref('yes')

  const {
    serverAddUserDialogVisible,
    serverDeleteUserDialogVisible,
    serverAddUserForm,
    serverDeleteUserForm,
    serverAddUserDialogFieldsForView,
    serverDeleteUserDialogFieldsForView,
    serverUserDialogWidth,
    serverDeleteDangerText,
    handleServerAction,
    confirmAddServerUser,
    confirmDeleteServerUser,
  } = useServerUserDialog({
    projectStore,
    activeSessionAlias,
    appendTerminal,
  })


  const {
    projectCreateDialogFieldsForView,
    openCreateProjectDialog,
    checkProjectNameOnBlur,
    confirmCreateProjectReal,
    onCreateProjectDatabaseCheck,
    onCreateProjectNginxCheck,
    onCreateProjectNginxPortBlur,
  } = useCreateProjectDialog({
    projectCreateForm,
    projectStore,
    projectDialogVisible,
    ensureCreateProjectSession,
    ensureProjectTaskSession,
    appendSessionLine,
    appendSessionLines,
    lockSession,
    unlockSession,
  })

  const {
    syncProjectFieldsForView,
    openSyncProjectDialog,
    confirmSyncProject,
    onSyncProjectServerChange,
    onSyncProjectPathChange,
    onSyncProjectEntryPathChange,
    onSyncProjectCondaCheck,
    onSyncProjectDatabaseCheck,
    onSyncProjectNginxCheck,
    onSyncProjectNginxPortBlur,
    onSyncProjectNginxFrontendPortChange,
  } = useSyncProjectDialog({
    syncProjectForm,
    syncProjectDialogVisible,
    projectStore,
  })

  const syncProjectDialogWidth = computed(() => '920px')

  const userDeleteConfirmText = computed(() => {
    return fillDeleteText(userDeleteConfirmTextTemplate.value, deleteUserTarget.value ? deleteUserTarget.value.username : '')
  })

  const notify = (msg) => {
    ElMessage.success(msg)
  }

  const openCreateDialog = () => {
    if (layout.activeMenu === 'projects') {
      openCreateProjectDialog()
      return
    }
    if (layout.activeMenu === 'users') {
      createUserForm.username = ''
      createUserForm.password = ''
      userDialogVisible.value = true
      return
    }
    if (layout.activeMenu === 'envs') {
      envDialogVisible.value = true
      return
    }
    serverDialogVisible.value = true
  }

  const confirmCreate = async (entity) => {
    if (entity === 'project') {
      await confirmCreateProjectReal()
      return
    }
    projectDialogVisible.value = false
    envDialogVisible.value = false
    const entityLabel = entity === 'env' ? '环境' : String(entity || '')
    ElMessage.success(`${entityLabel}创建成功（原型）`)
  }

  const confirmCreateServer = async () => {
    const ip = String(serverCreateForm.ip || '').trim()
    const rootPassword = String(serverCreateForm.rootPassword || '').trim()
    const remark = String(serverCreateForm.remark || '').trim()

    if (!ip) {
      ElMessage.warning('服务器IP不能为空')
      return
    }

    try {
      await projectApi.createServer({
        ip,
        root_password: rootPassword,
        remark,
      })
      serverDialogVisible.value = false
      ElMessage.success('创建服务器成功')
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '创建服务器失败'))
    }
  }

  const confirmCreateUser = async () => {
    const username = createUserForm.username.trim()
    const password = createUserForm.password.trim()
    if (!username) {
      ElMessage.warning('请输入账号')
      return
    }
    if (!password) {
      ElMessage.warning('请输入密码')
      return
    }

    try {
      await projectApi.createUser({ username, password, role: 'user' })
      userDialogVisible.value = false
      ElMessage.success('创建成功')
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '创建失败'))
    }
  }

  const openProjectDetail = async (project) => {
    selectedProject.value = project
    selectedProjectDetail.value = null
    projectDrawerVisible.value = true
    projectDetailLoading.value = true
    try {
      const resp = await projectApi.getProjectDetail(project.id)
      selectedProjectDetail.value = resp.data?.data || null
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '加载项目详情失败'))
    } finally {
      projectDetailLoading.value = false
    }
  }

  const openProjectLogDialog = async (project) => {
    selectedProject.value = project
    projectLogData.value = { project_id: project.id, project_name: project.name, total: 0, data: [] }
    projectLogDialogVisible.value = true
    projectLogLoading.value = true
    try {
      const resp = await projectApi.listProjectLogs(project.id)
      projectLogData.value = resp.data?.data || projectLogData.value
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '加载项目日志失败'))
    } finally {
      projectLogLoading.value = false
    }
  }

  const mergeLatestProjectForSetting = (project) => {
    const source = project || {}
    const latest = (projectStore.projects || []).find((item) => Number(item.id) === Number(source.id)) || {}
    const merged = { ...source, ...latest }
    const keys = new Set([...Object.keys(source), ...Object.keys(latest)])
    keys.forEach((key) => {
      const latestValue = latest[key]
      const sourceValue = source[key]
      const latestHasValue = latestValue !== undefined && latestValue !== null && String(latestValue).trim() !== ''
      const sourceHasValue = sourceValue !== undefined && sourceValue !== null && String(sourceValue).trim() !== ''
      if (!latestHasValue && sourceHasValue) {
        merged[key] = sourceValue
      }
    })
    return merged
  }

  const openSettingDialog = async (project) => {
    fillProjectSettingForm({ settingForm, project: mergeLatestProjectForSetting(project), projectStore })
    await nextTick()
    settingDialogVisible.value = true
  }

  const terminalValue = (value) => {
    const text = String(value ?? '').trim()
    return text || '空字符'
  }

  const settingModifyText = (enabled) => (enabled ? '已开启修改' : '未修改')

  const buildSettingTerminalPlan = (payload) => {
    const steps = []
    steps.push(`步骤1 项目描述：${terminalValue(payload.description)}（${settingModifyText(settingForm.descriptionModifyEnabled)}）`)
    steps.push(`步骤2 Conda环境：${terminalValue(payload.conda_env_name)}（${settingModifyText(settingForm.condaModifyEnabled)}）`)
    steps.push(`      Python版本：${terminalValue(payload.python_version)}`)
    if (payload.create_conda_env) {
      steps.push('      Conda处理：创建新环境')
    } else if (payload.drop_original_conda_env) {
      steps.push('      Conda处理：删除原环境')
    } else {
      steps.push('      Conda处理：无额外操作')
    }
    steps.push(`步骤3 项目入口文件：${terminalValue(payload.entry_file_path)}（${settingModifyText(settingForm.entryFilePathModifyEnabled)}）`)
    steps.push(`步骤4 开发启动命令：${terminalValue(payload.dev_start_command)}（${settingModifyText(settingForm.devCommandModifyEnabled)}）`)
    steps.push(`步骤5 部署启动命令：${terminalValue(payload.deploy_start_command)}（${settingModifyText(settingForm.deployCommandModifyEnabled)}）`)
    if (payload.nginx_enabled) {
      steps.push(`步骤6 Nginx配置：启用（${settingForm.nginxModifyEnabled ? '已开启修改' : '未修改或仅启用'}）`)
      steps.push(`      Nginx服务器IP：${terminalValue(payload.nginx_server_ip)}`)
      steps.push(`      Nginx配置文件：${terminalValue(payload.nginx_conf_path)}`)
      steps.push(`      Nginx前端端口：${terminalValue(payload.frontend_port)}`)
      steps.push(`      后端部署端口：${terminalValue(payload.backend_deploy_port)}`)
      steps.push(`      原Nginx配置：${payload.drop_original_nginx_config ? '删除原配置' : '保留或无原配置'}`)
    } else {
      steps.push('步骤6 Nginx配置：不启用')
    }
    if (String(payload.database_name || '').trim()) {
      steps.push(`步骤7 数据库配置：启用（${settingForm.databaseModifyEnabled ? '已开启修改' : '未修改或仅启用'}）`)
      steps.push(`      数据库名称：${terminalValue(payload.database_name)}`)
      steps.push(`      数据库地址：${terminalValue(payload.database_host)}:${terminalValue(payload.database_port)}`)
      steps.push(`      数据库账号：${terminalValue(payload.database_user)}`)
      steps.push(`      原数据库：${payload.drop_original_database ? '删除原数据库' : '保留或无原数据库'}`)
    } else {
      steps.push('步骤7 数据库配置：不启用')
    }
    return steps
  }

  const extractSettingActualActions = (resp) => {
    const data = resp?.data?.data || {}
    const list = Array.isArray(data.actions) ? data.actions : []
    return list.map((item) => String(item || '').trim()).filter(Boolean)
  }

  const appendSettingStep = async (sessionId, line, delay = 100) => {
    if (!sessionId) return
    appendSessionLine(sessionId, line)
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay))
    }
  }

  const saveProjectSetting = async () => {
    if (!settingForm.projectId) return
    if (!String(settingForm.entryFilePath || '').trim()) {
      ElMessage.warning('请先选择项目入口文件位置')
      return
    }

    const projectId = Number(settingForm.projectId)
    const payload = buildProjectSettingPayload(settingForm)
    const serverIp = String(settingForm.serverIp || activeSessionIp.value || '').trim()
    let sessionInfo = null

    projectStore.setProjectBusy(projectId, true)
    settingDialogVisible.value = false

    try {
      if (typeof ensureProjectTaskSession === 'function' && serverIp) {
        sessionInfo = await ensureProjectTaskSession(serverIp, 'setting')
        lockSession(sessionInfo.localSessionId, `保存项目设置 ${settingForm.projectName} 中，请稍候`)
        await appendSettingStep(sessionInfo.localSessionId, `1.连接目标服务器：${serverIp}   ---> 已完成`)
        await appendSettingStep(sessionInfo.localSessionId, '')
        await appendSettingStep(sessionInfo.localSessionId, `2.开始保存项目设置：${settingForm.projectName} ---> 进行中`)
        const plan = buildSettingTerminalPlan(payload)
        if (typeof appendSessionLines === 'function') {
          appendSessionLines(sessionInfo.localSessionId, plan.map((item) => `  ${item}`))
        } else {
          for (const item of plan) {
            await appendSettingStep(sessionInfo.localSessionId, `  ${item}`, 0)
          }
        }
        await appendSettingStep(sessionInfo.localSessionId, '  后端正在按配置差异执行实际变更，请稍候...', 0)
      }

      const resp = await projectApi.updateProjectSetting(projectId, payload)
      projectStore.updateProjectSetting(
        projectId,
        buildProjectSettingStorePatch(settingForm),
      )
      const msg = String(resp.data?.message || '设置保存成功')
      if (sessionInfo?.localSessionId) {
        const actualActions = extractSettingActualActions(resp)
        await appendSettingStep(sessionInfo.localSessionId, '  后端实际执行差异：', 0)
        if (actualActions.length) {
          for (const item of actualActions) {
            await appendSettingStep(sessionInfo.localSessionId, `    - ${item}`, 0)
          }
        } else {
          await appendSettingStep(sessionInfo.localSessionId, '    - 无实际变更', 0)
        }
        await appendSettingStep(sessionInfo.localSessionId, `2.开始保存项目设置：${settingForm.projectName} ---> 已完成`)
      }
      ElMessage.success(msg)
      await projectStore.loadBundle()
      if (sessionInfo?.localSessionId) {
        await appendSettingStep(sessionInfo.localSessionId, '')
        await appendSettingStep(sessionInfo.localSessionId, '3.项目设置保存成功', 0)
      }
    } catch (error) {
      const msg = getErrorMessage(error, '设置保存失败')
      if (sessionInfo?.localSessionId) {
        appendSessionLine(sessionInfo.localSessionId, `设置失败：${msg}`)
      } else {
        appendTerminal(`[会话:${activeSessionAlias.value}] ${settingForm.projectName} 设置失败：${msg}`)
      }
      ElMessage.error(msg)
      await projectStore.loadBundle()
    } finally {
      projectStore.setProjectBusy(projectId, false)
      if (sessionInfo?.localSessionId) {
        unlockSession(sessionInfo.localSessionId)
      }
    }
  }

  const openCopyDialog = (project) => {
    copyForm.projectName = project.name
    copyForm.targetServerIp = activeSessionIp.value || project.serverIp
    copyForm.targetDir = appConfig.defaultCopyDir
    copyDialogVisible.value = true
  }

  const confirmCopyProject = async () => {
    const project = projectStore.projects.find((x) => x.name === copyForm.projectName)
    if (!project) return
    try {
      await projectApi.copyProject(project.id, {
        target_server_ip: copyForm.targetServerIp,
        target_dir: copyForm.targetDir,
      })
      copyDialogVisible.value = false
      ElMessage.success('复制项目成功')
      appendTerminal(
        `[会话:${activeSessionAlias.value}] 复制 ${copyForm.projectName} 到 ${copyForm.targetServerIp}:${copyForm.targetDir}`,
      )
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '复制失败'))
    }
  }

  const openExportDialog = (project) => {
    exportForm.projectName = project.name
    exportForm.targetDir = appConfig.defaultExportDir
    exportDialogVisible.value = true
  }

  const confirmExportProject = async () => {
    const project = projectStore.projects.find((x) => x.name === exportForm.projectName)
    if (!project) return
    try {
      await projectApi.exportProject(project.id, {
        target_dir: exportForm.targetDir,
      })
      exportDialogVisible.value = false
      ElMessage.success('导出项目成功')
      appendTerminal(
        `[会话:${activeSessionAlias.value}] 导出 ${exportForm.projectName} 到本机目录 ${exportForm.targetDir}`,
      )
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '导出失败'))
    }
  }

  const findToolProject = () => {
    const list = projectStore.projects || []
    return list.find((item) => Number(item.id) === Number(toolForm.projectId)) || list.find((item) => item.name === toolForm.projectName)
  }

  const openToolDialog = (project) => {
    toolForm.projectId = project.id
    toolForm.projectName = project.name
    toolDialogVisible.value = true
  }

  const handleProjectToolClick = (button) => {
    const label = typeof button === 'string' ? button : button?.label
    const project = findToolProject()
    if (!project) {
      ElMessage.warning('未找到当前项目')
      return
    }
    if (label === '复制项目') {
      toolDialogVisible.value = false
      openCopyDialog(project)
      return
    }
    if (label === '导出项目') {
      toolDialogVisible.value = false
      openExportDialog(project)
      return
    }
    ElMessage.info('该工具暂未开发')
  }

  const openDeleteUserDialog = (userRow) => {
    deleteUserTarget.value = userRow
    deleteUserMigrate.value = 'yes'
    deleteUserDialogVisible.value = true
  }

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget.value) return
    const username = deleteUserTarget.value.username
    try {
      await projectApi.deleteUser([deleteUserTarget.value.id], deleteUserMigrate.value === 'yes')
      projectStore.removeUser(deleteUserTarget.value.id)
      deleteUserDialogVisible.value = false
      if (deleteUserMigrate.value === 'yes') {
        ElMessage.success(`已删除 ${username}，项目已迁移`)
        appendTerminal(`[会话:${activeSessionAlias.value}] 删除 ${username}，项目已迁移到 root 目录`)
      } else {
        ElMessage.success(fillDeleteText(userDeleteSuccessTextTemplate.value, username))
        appendTerminal(`[会话:${activeSessionAlias.value}] 删除 ${username}，未迁移项目`)
      }
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '删除用户失败'))
    }
  }

  const handleUserAction = (actionCode, userRow) => {
    if (actionCode === 'delete') {
      openDeleteUserDialog(userRow)
    }
  }

  const handleEnvAction = (actionCode) => {
    if (actionCode === 'view') {
      notify('查看环境主包与版本')
      return
    }
    notify('环境操作已触发')
  }

  const { deleteProject } = useProjectDeleteDialog({
    projectStore,
    selectedProject,
    selectedProjectDetail,
    projectDetailLoading,
    projectDrawerVisible,
    projectLogDialogVisible,
    projectLogLoading,
    projectLogData,
    activeSessionAlias,
    appendTerminal,
    projectDeleteSuccessTextTemplate,
  })

  const checkProjectHealth = async (project) => {
    if (!project?.id) return
    if (projectStore.isProjectHealthChecking(project.id)) return
    projectStore.setProjectHealthChecking(project.id, true)
    try {
      const resp = await projectApi.checkProjectHealth(project.id)
      const data = resp.data?.data || {}
      projectStore.updateProjectHealth(project.id, data)
      const statusText = data.project_status || data.projectStatus || '检测完成'
      ElMessage.success(`项目状态检测完成：${statusText}`)
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '项目状态检测失败'))
    } finally {
      projectStore.setProjectHealthChecking(project.id, false)
    }
  }


  const checkProjectService = async (project) => {
    if (!project?.id) return
    if (projectStore.isProjectServiceChecking(project.id)) return
    projectStore.setProjectServiceChecking(project.id, true)
    try {
      const resp = await projectApi.checkProjectHealth(project.id)
      const data = resp.data?.data || {}
      projectStore.updateProjectServiceStatus(project.id, data)
      const statusText = data.service_status || data.serviceStatus || data.status || '已停止'
      const runningPort = data.running_port || data.runningPort || ''
      if (String(statusText).trim() === '运行中' && runningPort) {
        ElMessage.success(`服务状态检测完成：运行中，端口 ${runningPort}`)
      } else {
        ElMessage.success(`服务状态检测完成：${statusText}`)
      }
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '服务状态检测失败'))
    } finally {
      projectStore.setProjectServiceChecking(project.id, false)
    }
  }

  const RUNTIME_TEXT = {
    noSteps: '暂无执行步骤',
    taskRunningSuffix: '中，请稍候',
    connectTarget: '连接目标服务器',
    session: '会话',
    alreadyRunning: '项目已在运行中',
    startForeground: '前台启动',
    startBackground: '后台启动',
    deployStart: '部署启动',
    stopService: '停止服务',
    startForegroundOk: '前台启动成功',
    startBackgroundOk: '后台启动成功',
    deployStartOk: '部署启动成功',
    stopServiceOk: '停止服务成功',
    startForegroundFail: '前台启动失败',
    startBackgroundFail: '后台启动失败',
    deployStartFail: '部署启动失败',
    stopServiceFail: '停止服务失败',
    stoppedAlready: '项目已停止',
  }

  const appendRuntimeTerminalSteps = async (sessionId, project, data, title) => {
    if (!sessionId) return
    const steps = Array.isArray(data?.terminal_steps) ? data.terminal_steps : []
    appendSessionLine(sessionId, `${title}：${project.name}`)
    if (!steps.length) {
      appendSessionLine(sessionId, String(data?.message || RUNTIME_TEXT.noSteps))
      return
    }
    for (const item of steps) {
      const type = String(item?.type || '').trim()
      const content = String(item?.text || '').trim()
      if (!content) continue
      if (type === 'command') {
        appendSessionLine(sessionId, `$ ${content}`)
      } else {
        String(content).split(/\r?\n/).forEach((line) => appendSessionLine(sessionId, line))
      }
    }
    if (data?.message) appendSessionLine(sessionId, String(data.message))
  }

  const runProjectRuntimeAction = async ({ project, request, title, successFallback, runningStatus }) => {
    const serverIp = String(project?.serverIp || '').trim()
    let sessionInfo = null
    if (typeof ensureProjectTaskSession === 'function' && serverIp) {
      sessionInfo = await ensureProjectTaskSession(serverIp, 'runtime')
      lockSession(sessionInfo.localSessionId, `${title} ${project.name} ${RUNTIME_TEXT.taskRunningSuffix}`)
      appendSessionLine(sessionInfo.localSessionId, `${RUNTIME_TEXT.connectTarget}：${serverIp}`)
    }
    try {
      const resp = await request()
      const data = resp.data?.data || {}
      const msg = String(resp.data?.message || data.message || successFallback)
      if (runningStatus) projectStore.setProjectStatus(project.id, runningStatus)
      if (sessionInfo?.localSessionId) {
        await appendRuntimeTerminalSteps(sessionInfo.localSessionId, project, data, title)
        if (data?.run_in_background === false && runningStatus === PROJECT_RUNNING_TEXT) {
          foregroundProjectBySessionId[String(sessionInfo.localSessionId)] = { id: project.id, name: project.name }
        }
      } else {
        appendTerminal(`[${RUNTIME_TEXT.session}:${activeSessionAlias.value}] ${project.name} ${msg}`)
      }
      ElMessage.success(msg)
      await projectStore.loadBundle()
    } finally {
      if (sessionInfo?.localSessionId) unlockSession(sessionInfo.localSessionId)
    }
  }

  const runProjectForegroundAction = async (project) => {
    const serverIp = String(project?.serverIp || '').trim()
    let sessionInfo = null
    if (typeof ensureProjectTaskSession === 'function' && serverIp) {
      sessionInfo = await ensureProjectTaskSession(serverIp, 'foreground')
    }
    if (!sessionInfo?.localSessionId) throw new Error('\u65e0\u6cd5\u521b\u5efa\u524d\u53f0\u542f\u52a8\u7ec8\u7aef\u4f1a\u8bdd')

    try {
      const prepareResp = await projectApi.prepareStartForeground(project.id)
      const prepare = prepareResp.data?.data || {}
      if (!prepare.command) throw new Error('\u6682\u65e0\u914d\u7f6e\u542f\u52a8\u547d\u4ee4')
      if (typeof runProjectForegroundInSession !== 'function') throw new Error('\u7ec8\u7aef\u524d\u53f0\u542f\u52a8\u80fd\u529b\u672a\u521d\u59cb\u5316')
      await runProjectForegroundInSession(sessionInfo.localSessionId, prepare)
      foregroundProjectBySessionId[String(sessionInfo.localSessionId)] = { id: project.id, name: project.name }
      ElMessage.success('\u524d\u53f0\u542f\u52a8\u547d\u4ee4\u5df2\u53d1\u9001\uff0c\u5b9e\u9645\u8f93\u51fa\u8bf7\u67e5\u770b\u53f3\u4fa7\u7ec8\u7aef')
    } catch (error) {
      const msg = getErrorMessage(error, RUNTIME_TEXT.startForegroundFail)
      appendSessionLine(sessionInfo.localSessionId, msg)
      ElMessage.error(msg)
    }
  }
  const handleProjectAction = async (actionCode, project) => {
    if (!canAction('projects', actionCode)) return
    const projectStatus = String(project?.status || '').trim()
    if (projectStore.isProjectBusy(project?.id) || [PROJECT_CREATING_TEXT, PROJECT_SETTING_TEXT, PROJECT_SYNCING_TEXT].includes(projectStatus)) {
      ElMessage.warning('项目任务正在执行中，请等待后端实际返回后再操作')
      return
    }


    if (actionCode === 'start_fg') {
      if (project.status === PROJECT_RUNNING_TEXT) {
        ElMessage.warning(RUNTIME_TEXT.alreadyRunning)
        return
      }
      try {
        await runProjectForegroundAction(project)
      } catch (error) {
        ElMessage.error(getErrorMessage(error, RUNTIME_TEXT.startForegroundFail))
      }
      return
    }

    if (actionCode === 'start_bg') {
      if (project.status === PROJECT_RUNNING_TEXT) {
        ElMessage.warning(RUNTIME_TEXT.alreadyRunning)
        return
      }
      try {
        await runProjectRuntimeAction({
          project,
          request: () => projectApi.startBackground(project.id),
          title: RUNTIME_TEXT.startBackground,
          successFallback: RUNTIME_TEXT.startBackgroundOk,
          runningStatus: PROJECT_RUNNING_TEXT,
        })
      } catch (error) {
        ElMessage.error(getErrorMessage(error, RUNTIME_TEXT.startBackgroundFail))
      }
      return
    }

    if (actionCode === 'deploy_start') {
      try {
        await runProjectRuntimeAction({
          project,
          request: () => projectApi.deployStart(project.id),
          title: RUNTIME_TEXT.deployStart,
          successFallback: RUNTIME_TEXT.deployStartOk,
          runningStatus: PROJECT_RUNNING_TEXT,
        })
      } catch (error) {
        ElMessage.error(getErrorMessage(error, RUNTIME_TEXT.deployStartFail))
      }
      return
    }

    if (actionCode === 'stop') {
      if (project.status === PROJECT_STOPPED_TEXT) {
        ElMessage.warning(RUNTIME_TEXT.stoppedAlready)
        return
      }
      try {
        await runProjectRuntimeAction({
          project,
          request: () => projectApi.stopProject(project.id),
          title: RUNTIME_TEXT.stopService,
          successFallback: RUNTIME_TEXT.stopServiceOk,
          runningStatus: PROJECT_STOPPED_TEXT,
        })
      } catch (error) {
        ElMessage.error(getErrorMessage(error, RUNTIME_TEXT.stopServiceFail))
      }
      return
    }

    if (actionCode === 'setting') {
      await openSettingDialog(project)
      return
    }

    if (actionCode === 'detail') {
      openProjectDetail(project)
      return
    }

    if (actionCode === 'log') {
      await openProjectLogDialog(project)
      return
    }

    if (actionCode === 'copy') {
      openCopyDialog(project)
      return
    }

    if (actionCode === 'export') {
      openExportDialog(project)
      return
    }

    if (actionCode === 'tools') {
      openToolDialog(project)
      return
    }

    if (actionCode === 'delete') {
      await deleteProject(project)
    }
  }

  const handleTerminalCtrlC = async ({ session, appendLine } = {}) => {
    const sessionId = String(session?.id || '')
    const target = foregroundProjectBySessionId[sessionId]
    if (!target?.id) {
      if (typeof appendLine === 'function') appendLine('当前会话没有可停止的前台服务')
      return
    }
    try {
      if (typeof appendLine === 'function') appendLine(`正在停止 ${target.name}...`)
      const resp = await projectApi.stopProject(target.id)
      const data = resp.data?.data || {}
      const msg = String(resp.data?.message || data.message || RUNTIME_TEXT.stopServiceOk)
      if (typeof appendLine === 'function') appendLine(msg)
      delete foregroundProjectBySessionId[sessionId]
      projectStore.setProjectStatus(target.id, PROJECT_STOPPED_TEXT)
      await projectStore.loadBundle()
    } catch (error) {
      const msg = getErrorMessage(error, RUNTIME_TEXT.stopServiceFail)
      if (typeof appendLine === 'function') appendLine(msg)
      ElMessage.error(msg)
    }
  }

  return {
    selectedProject,
    selectedProjectDetail,
    projectDetailLoading,
    projectDrawerVisible,
    projectLogDialogVisible,
    projectLogLoading,
    projectLogData,
    projectDialogVisible,
    syncProjectDialogVisible,
    userDialogVisible,
    envDialogVisible,
    serverDialogVisible,
    settingDialogVisible,
    copyDialogVisible,
    exportDialogVisible,
    toolDialogVisible,
    projectCreateForm,
    syncProjectForm,
    createUserForm,
    envCreateForm,
    serverCreateForm,
    settingForm,
    copyForm,
    exportForm,
    toolForm,
    deleteUserDialogVisible,
    deleteUserTarget,
    deleteUserMigrate,
    userDeleteConfirmText,
    openCreateDialog,
    openSyncProjectDialog,
    confirmCreate,
    confirmSyncProject,
    onSyncProjectServerChange,
    onSyncProjectPathChange,
    onSyncProjectEntryPathChange,
    onSyncProjectCondaCheck,
    onSyncProjectDatabaseCheck,
    onSyncProjectNginxCheck,
    onSyncProjectNginxPortBlur,
    onSyncProjectNginxFrontendPortChange,
    onCreateProjectDatabaseCheck,
    onCreateProjectNginxCheck,
    onCreateProjectNginxPortBlur,
    checkProjectNameOnBlur,
    confirmCreateServer,
    confirmCreateUser,
    saveProjectSetting,
    confirmCopyProject,
    confirmExportProject,
    handleProjectToolClick,
    confirmDeleteUser,
    handleUserAction,
    handleEnvAction,
    handleServerAction,
    handleProjectAction,
    checkProjectHealth,
    checkProjectService,
    handleTerminalCtrlC,
    serverAddUserDialogVisible,
    serverDeleteUserDialogVisible,
    serverAddUserForm,
    serverDeleteUserForm,
    projectCreateDialogFieldsForView,
    syncProjectFieldsForView,
    syncProjectDialogWidth,
    serverAddUserDialogFieldsForView,
    serverDeleteUserDialogFieldsForView,
    serverUserDialogWidth,
    serverDeleteDangerText,
    confirmAddServerUser,
    confirmDeleteServerUser,
  }
}



