import { reactive, ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { appConfig } from '@/config/app/app.config'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import {
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  DEFAULT_ENV_DESCRIPTION,
  DEFAULT_ENV_NAME,
  DEFAULT_ENV_PYTHON_VERSION,
  DEFAULT_SERVER_REMARK,
  DEFAULT_SETTING_REMARK,
  DASHBOARD_OPERATION_TEXT,
  PROJECT_BUSY_STATUS_TEXTS,
  PROJECT_RUNTIME_TEXT,
  PROJECT_RUNNING_TEXT,
  PROJECT_SETTING_DATABASE_TERMINAL_FIELDS,
  PROJECT_SETTING_NGINX_TERMINAL_FIELDS,
  PROJECT_SETTING_TERMINAL_FIELDS,
  PROJECT_SETTING_TERMINAL_FACTORY,
  PROJECT_SETTING_TERMINAL_TEXT,
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

/**
 * Dashboard 弹框与项目操作组合函数。
 *
 * 作用：
 * - 统一管理新建、同步、设置、详情、日志、删除等弹框状态。
 * - 连接项目 Store、终端 Store、接口请求和页面提示。
 */
export const useDashboardDialogs = (options) => {
  const {
    layout,
    projectStore,
    terminalStore,
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
    name: DEFAULT_ENV_NAME,
    pythonVersion: DEFAULT_ENV_PYTHON_VERSION,
    description: DEFAULT_ENV_DESCRIPTION,
  })

  const serverCreateForm = reactive({
    ip: '',
    rootPassword: '',
    remark: DEFAULT_SERVER_REMARK,
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
    remark: DEFAULT_SETTING_REMARK,
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
    const entityLabel = entity === 'env' ? DASHBOARD_OPERATION_TEXT.envLabel : String(entity || '')
    ElMessage.success(`${entityLabel}${DASHBOARD_OPERATION_TEXT.prototypeCreatedSuffix}`)
  }

  const confirmCreateServer = async () => {
    const ip = String(serverCreateForm.ip || '').trim()
    const rootPassword = String(serverCreateForm.rootPassword || '').trim()
    const remark = String(serverCreateForm.remark || '').trim()

    if (!ip) {
      ElMessage.warning(DASHBOARD_OPERATION_TEXT.serverIpRequired)
      return
    }

    try {
      await projectApi.createServer({
        ip,
        root_password: rootPassword,
        remark,
      })
      serverDialogVisible.value = false
      ElMessage.success(DASHBOARD_OPERATION_TEXT.createServerSuccess)
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.createServerFailed))
    }
  }

  const confirmCreateUser = async () => {
    const username = createUserForm.username.trim()
    const password = createUserForm.password.trim()
    if (!username) {
      ElMessage.warning(DASHBOARD_OPERATION_TEXT.usernameRequired)
      return
    }
    if (!password) {
      ElMessage.warning(DASHBOARD_OPERATION_TEXT.passwordRequired)
      return
    }

    try {
      await projectApi.createUser({ username, password, role: 'user' })
      userDialogVisible.value = false
      ElMessage.success(DASHBOARD_OPERATION_TEXT.createSuccess)
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.createFailed))
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
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.loadProjectDetailFailed))
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
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.loadProjectLogFailed))
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
    return text || PROJECT_SETTING_TERMINAL_TEXT.emptyValue
  }

  const settingModifyText = (enabled) => (
    enabled
      ? PROJECT_SETTING_TERMINAL_TEXT.modifyEnabled
      : PROJECT_SETTING_TERMINAL_TEXT.modifyDisabled
  )

  const payloadFieldValue = (payload, field) => {
    if (Array.isArray(field.payloadKeys)) {
      return field.payloadKeys.map((key) => terminalValue(payload[key])).join(field.separator || '')
    }
    return terminalValue(payload[field.payloadKey])
  }

  const buildSettingTerminalPlan = (payload) => {
    const steps = []
    PROJECT_SETTING_TERMINAL_FIELDS.forEach((field) => {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.fieldLine(
        field,
        payloadFieldValue(payload, field),
        settingModifyText(settingForm[field.modifyKey]),
      ))
      if (field.step === 2) {
        steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
          PROJECT_SETTING_TERMINAL_TEXT.pythonVersionLabel,
          terminalValue(payload.python_version),
        ))
      }
    })
    if (payload.create_conda_env) {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
        PROJECT_SETTING_TERMINAL_TEXT.condaHandleLabel,
        PROJECT_SETTING_TERMINAL_TEXT.condaCreate,
      ))
    } else if (payload.drop_original_conda_env) {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
        PROJECT_SETTING_TERMINAL_TEXT.condaHandleLabel,
        PROJECT_SETTING_TERMINAL_TEXT.condaDropOriginal,
      ))
    } else {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
        PROJECT_SETTING_TERMINAL_TEXT.condaHandleLabel,
        PROJECT_SETTING_TERMINAL_TEXT.condaNoExtraAction,
      ))
    }
    if (payload.nginx_enabled) {
      const nginxModifyText = settingForm.nginxModifyEnabled
        ? PROJECT_SETTING_TERMINAL_TEXT.modifyEnabled
        : PROJECT_SETTING_TERMINAL_TEXT.modifyDisabledOrOnlyEnable
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.statusLine(
        6,
        PROJECT_SETTING_TERMINAL_TEXT.step6NginxTitle,
        PROJECT_SETTING_TERMINAL_TEXT.enabled,
        nginxModifyText,
      ))
      PROJECT_SETTING_NGINX_TERMINAL_FIELDS.forEach((field) => {
        steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(field.label, payloadFieldValue(payload, field)))
      })
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
        PROJECT_SETTING_TERMINAL_TEXT.originalNginxLabel,
        payload.drop_original_nginx_config
          ? PROJECT_SETTING_TERMINAL_TEXT.dropOriginalNginx
          : PROJECT_SETTING_TERMINAL_TEXT.keepOrNoOriginalNginx,
      ))
    } else {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.statusLine(
        6,
        PROJECT_SETTING_TERMINAL_TEXT.step6NginxTitle,
        PROJECT_SETTING_TERMINAL_TEXT.disabled,
      ))
    }
    if (String(payload.database_name || '').trim()) {
      const databaseModifyText = settingForm.databaseModifyEnabled
        ? PROJECT_SETTING_TERMINAL_TEXT.modifyEnabled
        : PROJECT_SETTING_TERMINAL_TEXT.modifyDisabledOrOnlyEnable
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.statusLine(
        7,
        PROJECT_SETTING_TERMINAL_TEXT.step7DatabaseTitle,
        PROJECT_SETTING_TERMINAL_TEXT.enabled,
        databaseModifyText,
      ))
      PROJECT_SETTING_DATABASE_TERMINAL_FIELDS.forEach((field) => {
        steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(field.label, payloadFieldValue(payload, field)))
      })
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.subFieldLine(
        PROJECT_SETTING_TERMINAL_TEXT.originalDatabaseLabel,
        payload.drop_original_database
          ? PROJECT_SETTING_TERMINAL_TEXT.dropOriginalDatabase
          : PROJECT_SETTING_TERMINAL_TEXT.keepOrNoOriginalDatabase,
      ))
    } else {
      steps.push(PROJECT_SETTING_TERMINAL_FACTORY.statusLine(
        7,
        PROJECT_SETTING_TERMINAL_TEXT.step7DatabaseTitle,
        PROJECT_SETTING_TERMINAL_TEXT.disabled,
      ))
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
      ElMessage.warning(PROJECT_SETTING_TERMINAL_TEXT.entryPathRequired)
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
        sessionInfo = await ensureProjectTaskSession(serverIp, 'setting', { reuse: false })
        lockSession(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.lockProjectSetting(settingForm.projectName))
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.connectStep(serverIp))
        await appendSettingStep(sessionInfo.localSessionId, '')
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.saveStep(settingForm.projectName, PROJECT_SETTING_TERMINAL_TEXT.runningSuffix))
        const plan = buildSettingTerminalPlan(payload)
        if (typeof appendSessionLines === 'function') {
          appendSessionLines(sessionInfo.localSessionId, plan.map((item) => PROJECT_SETTING_TERMINAL_FACTORY.indent(item)))
        } else {
          for (const item of plan) {
            await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.indent(item), 0)
          }
        }
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.indent(PROJECT_SETTING_TERMINAL_TEXT.executingDiff), 0)
      }

      const resp = await projectApi.updateProjectSetting(projectId, payload)
      projectStore.updateProjectSetting(
        projectId,
        buildProjectSettingStorePatch(settingForm),
      )
      const msg = String(resp.data?.message || PROJECT_SETTING_TERMINAL_TEXT.saveSuccess)
      if (sessionInfo?.localSessionId) {
        const actualActions = extractSettingActualActions(resp)
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.indent(PROJECT_SETTING_TERMINAL_TEXT.actualDiffTitle), 0)
        if (actualActions.length) {
          for (const item of actualActions) {
            await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.appendHyphen(item), 0)
          }
        } else {
          await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.appendHyphen(PROJECT_SETTING_TERMINAL_TEXT.noActualDiff), 0)
        }
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.saveStep(settingForm.projectName, PROJECT_SETTING_TERMINAL_TEXT.connectDoneSuffix))
      }
      ElMessage.success(msg)
      await projectStore.loadBundle()
      if (sessionInfo?.localSessionId) {
        await appendSettingStep(sessionInfo.localSessionId, '')
        await appendSettingStep(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.finalStep(), 0)
      }
    } catch (error) {
      const msg = getErrorMessage(error, PROJECT_SETTING_TERMINAL_TEXT.saveFailed)
      if (sessionInfo?.localSessionId) {
        appendSessionLine(sessionInfo.localSessionId, PROJECT_SETTING_TERMINAL_FACTORY.failed(msg))
      } else {
        appendTerminal(PROJECT_SETTING_TERMINAL_FACTORY.failed(`${settingForm.projectName} ${msg}`))
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
      ElMessage.success(DASHBOARD_OPERATION_TEXT.copyProjectSuccess)
      appendTerminal(
        DASHBOARD_OPERATION_TEXT.copyTerminal(activeSessionAlias.value, copyForm.projectName, copyForm.targetServerIp, copyForm.targetDir),
      )
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.copyFailed))
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
      ElMessage.success(DASHBOARD_OPERATION_TEXT.exportProjectSuccess)
      appendTerminal(
        DASHBOARD_OPERATION_TEXT.exportTerminal(activeSessionAlias.value, exportForm.projectName, exportForm.targetDir),
      )
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.exportFailed))
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
      ElMessage.warning(DASHBOARD_OPERATION_TEXT.projectNotFound)
      return
    }
    if (label === DASHBOARD_OPERATION_TEXT.copyProject) {
      toolDialogVisible.value = false
      openCopyDialog(project)
      return
    }
    if (label === DASHBOARD_OPERATION_TEXT.exportProject) {
      toolDialogVisible.value = false
      openExportDialog(project)
      return
    }
    ElMessage.info(DASHBOARD_OPERATION_TEXT.toolTodo)
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
        ElMessage.success(PROJECT_RUNTIME_TEXT.userDeleteSuccess(username, PROJECT_RUNTIME_TEXT.userProjectsMigratedSuffix))
        appendTerminal(PROJECT_RUNTIME_TEXT.userDeleteTerminal(activeSessionAlias.value, username, PROJECT_RUNTIME_TEXT.userProjectsMigratedToRootSuffix))
      } else {
        ElMessage.success(fillDeleteText(userDeleteSuccessTextTemplate.value, username))
        appendTerminal(PROJECT_RUNTIME_TEXT.userDeleteTerminal(activeSessionAlias.value, username, PROJECT_RUNTIME_TEXT.userProjectsNotMigratedSuffix))
      }
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.deleteUserFailed))
    }
  }

  const handleUserAction = (actionCode, userRow) => {
    if (actionCode === 'delete') {
      openDeleteUserDialog(userRow)
    }
  }

  const handleEnvAction = (actionCode) => {
    if (actionCode === 'view') {
      notify(DASHBOARD_OPERATION_TEXT.envViewPackages)
      return
    }
    notify(DASHBOARD_OPERATION_TEXT.envActionTriggered)
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
      const statusText = data.project_status || data.projectStatus || DASHBOARD_OPERATION_TEXT.projectHealthDefault
      ElMessage.success(DASHBOARD_OPERATION_TEXT.projectHealthSuccess(statusText))
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.projectHealthCheckFailed))
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
      const statusText = data.service_status || data.serviceStatus || data.status || PROJECT_STOPPED_TEXT
      const runningPort = data.running_port || data.runningPort || ''
      if (String(statusText).trim() === PROJECT_RUNNING_TEXT && runningPort) {
        ElMessage.success(DASHBOARD_OPERATION_TEXT.serviceHealthRunning(runningPort))
      } else {
        ElMessage.success(DASHBOARD_OPERATION_TEXT.serviceHealthSuccess(statusText))
      }
    } catch (error) {
      ElMessage.error(getErrorMessage(error, DASHBOARD_OPERATION_TEXT.serviceHealthCheckFailed))
    } finally {
      projectStore.setProjectServiceChecking(project.id, false)
    }
  }

  const RUNTIME_TEXT = PROJECT_RUNTIME_TEXT

  const appendRuntimeTerminalSteps = async (sessionId, project, data, title) => {
    if (!sessionId) return
    const steps = Array.isArray(data?.terminal_steps) ? data.terminal_steps : []
    const visibleLines = []
    const appendVisibleLine = (line) => {
      const value = String(line || '').trim()
      if (!value) return
      if (/^PSPM_[A-Z0-9_]+=/.test(value)) return
      if (visibleLines[visibleLines.length - 1] === value) return
      visibleLines.push(value)
      appendSessionLine(sessionId, value)
    }

    appendSessionLine(sessionId, PROJECT_SETTING_TERMINAL_FACTORY.runtimeTitle(project.name, title))
    if (!steps.length) {
      appendVisibleLine(data?.message || RUNTIME_TEXT.noSteps)
      return
    }
    for (const item of steps) {
      const type = String(item?.type || '').trim()
      const content = String(item?.text || '').trim()
      if (!content) continue
      if (type === 'command') {
        appendVisibleLine(`$ ${content}`)
      } else {
        String(content).split(/\r?\n/).forEach((line) => appendVisibleLine(line))
      }
    }
    if (data?.message) appendVisibleLine(data.message)
  }

  const runProjectRuntimeAction = async ({ project, request, title, successFallback, runningStatus }) => {
    const serverIp = String(project?.serverIp || '').trim()
    let sessionInfo = null
    if (typeof ensureProjectTaskSession === 'function' && serverIp) {
      sessionInfo = await ensureProjectTaskSession(serverIp, 'runtime')
      lockSession(sessionInfo.localSessionId, `${title} ${project.name} ${RUNTIME_TEXT.taskRunningSuffix}`)
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
    if (!sessionInfo?.localSessionId) throw new Error(RUNTIME_TEXT.createForegroundSessionFailed)

    try {
      const prepareResp = await projectApi.prepareStartForeground(project.id)
      const prepare = prepareResp.data?.data || {}
      if (!prepare.command) throw new Error(RUNTIME_TEXT.startCommandMissing)
      if (typeof runProjectForegroundInSession !== 'function') throw new Error(RUNTIME_TEXT.foregroundRunnerMissing)
      await runProjectForegroundInSession(sessionInfo.localSessionId, prepare)
      foregroundProjectBySessionId[String(sessionInfo.localSessionId)] = { id: project.id, name: project.name }
      ElMessage.success(RUNTIME_TEXT.foregroundCommandSent)
    } catch (error) {
      const msg = getErrorMessage(error, RUNTIME_TEXT.startForegroundFail)
      appendSessionLine(sessionInfo.localSessionId, msg)
      ElMessage.error(msg)
    }
  }
  const handleProjectAction = async (actionCode, project) => {
    if (!canAction('projects', actionCode)) return
    const projectStatus = String(project?.status || '').trim()
    if (projectStore.isProjectBusy(project?.id) || PROJECT_BUSY_STATUS_TEXTS.includes(projectStatus)) {
      ElMessage.warning(RUNTIME_TEXT.projectBusy)
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
        const foregroundSession = typeof terminalStore?.findForegroundSessionByProject === 'function'
          ? terminalStore.findForegroundSessionByProject(project.id)
          : null
        if (foregroundSession?.id) {
          await handleTerminalCtrlC({
            session: foregroundSession,
            appendLine: (line) => appendSessionLine(foregroundSession.id, line),
            onStopped: () => {
              if (typeof terminalStore?.clearSessionForeground === 'function') {
                terminalStore.clearSessionForeground(foregroundSession.id)
              }
            },
          })
          return
        }
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

  /**
   * 按终端会话 ID 获取前台启动项目绑定关系。
   *
   * 作用：
   * - 当前页面未刷新时，优先读取 foregroundProjectBySessionId 内存映射。
   * - 页面刷新后，内存映射会丢失，此时从 terminalStore 持久化会话字段中恢复。
   *
   * 参数：
   * - sessionId：前端本地终端会话 ID。
   *
   * 返回：
   * - { id, name }：前台启动项目；没有绑定时返回 null。
   */
  const getForegroundProjectBySessionId = (sessionId) => {
    const key = String(sessionId || '')
    const mapped = foregroundProjectBySessionId[key]
    if (mapped?.id) return mapped

    const session = typeof terminalStore?.getSession === 'function'
      ? terminalStore.getSession(key)
      : null
    const projectId = Number(session?.foregroundProjectId || 0)
    if (!projectId) return null

    const projectName = String(session?.foregroundProjectName || '')
    const restored = { id: projectId, name: projectName }
    foregroundProjectBySessionId[key] = restored
    return restored
  }

  const handleTerminalCtrlC = async ({ session, appendLine, onStopped } = {}) => {
    const sessionId = String(session?.id || '')
    const target = getForegroundProjectBySessionId(sessionId)
    if (!target?.id) {
      if (typeof appendLine === 'function') appendLine(RUNTIME_TEXT.noForegroundServiceForSession)
      return
    }
    try {
      if (typeof appendLine === 'function') appendLine(PROJECT_RUNTIME_TEXT.stoppingForeground(target.name))
      const resp = await projectApi.stopProject(target.id)
      const data = resp.data?.data || {}
      const msg = String(resp.data?.message || data.message || RUNTIME_TEXT.stopServiceOk)
      if (typeof appendLine === 'function') appendLine(msg)
      delete foregroundProjectBySessionId[sessionId]
      if (typeof terminalStore?.clearSessionForeground === 'function') {
        terminalStore.clearSessionForeground(sessionId)
      }
      if (typeof onStopped === 'function') onStopped(target)
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
    getForegroundProjectBySessionId,
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



