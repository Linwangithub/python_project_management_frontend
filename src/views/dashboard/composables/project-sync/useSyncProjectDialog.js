import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import { ROOT_ROLE_KEY, USER_ROLE_KEY } from '@/config/auth/auth.config'
import {
  DB_PORT_MAX,
  DB_PORT_MIN,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  PROJECT_SYNCING_TEXT,
} from '../dialogConstants'
import {
  ROOT_SYNC_BASE_PATH,
  USER_SYNC_BASE_PATH_TEMPLATE,
  formatUserPath,
} from '@/config/project/project.paths.config'
import {
  projectDialogCommonText,
  syncProjectDialogText,
  syncProjectMessageFactory,
  syncProjectMessages,
  syncProjectPlaceholders,
} from '@/config/project/project.dialog.messages.config'

const normalizeJoinPath = (base, rel) => {
  const left = String(base || '').trim().replace(/\/+$/, '')
  const right = String(rel || '').trim().replace(/^\/+/, '')
  if (!left) return right
  return right ? `${left}/${right}` : left
}

const hasWildcard = (value) => /[*?\[]/.test(String(value || ''))

const isNginxModulesPath = (value) => {
  const path = String(value || '').trim().replace(/\\/g, '/')
  return path === '/usr/share/nginx/modules' || path.startsWith('/usr/share/nginx/modules/')
}

/**
 * 同步已有项目弹框组合函数。
 *
 * 作用：
 * - 管理服务器、项目目录、入口文件、Conda、Nginx、数据库等同步项的加载和校验。
 * - 只负责前端弹框状态与接口编排，真实同步由后端接口执行。
 */
export const useSyncProjectDialog = (options) => {
  const {
    syncProjectForm,
    syncProjectDialogVisible,
    projectStore,
  } = options

  const serverIpOptions = computed(() => {
    return (projectStore.servers || []).map((x) => x.ip).filter(Boolean)
  })

  const getRootBasePath = () => {
    const role = String(projectStore.currentRole?.value ?? projectStore.currentRole ?? USER_ROLE_KEY).trim()
    if (role === ROOT_ROLE_KEY) {
      return ROOT_SYNC_BASE_PATH
    }
    const username = String(projectStore.currentUsername?.value ?? projectStore.currentUsername ?? USER_ROLE_KEY).trim() || USER_ROLE_KEY
    return formatUserPath(USER_SYNC_BASE_PATH_TEMPLATE, username)
  }

  const nginxExistingConfOptions = computed(() => {
    const list = Array.isArray(syncProjectForm.nginxConfOptions) ? syncProjectForm.nginxConfOptions : []
    return list.map((item) => {
      const path = typeof item === 'string' ? item : (item.value || item.path || '')
      const status = typeof item === 'string' ? 'available' : (item.status || 'available')
      const selectable = typeof item === 'string' ? true : item.selectable !== false
      return {
        label: path,
        value: path,
        disabled: status === 'disabled' || !selectable,
      }
    }).filter((item) => {
      const value = String(item.value || '').trim()
      return !!value && !hasWildcard(value) && !isNginxModulesPath(value)
    })
  })

  const syncProjectFieldsForView = computed(() => {
    const serverSelected = !!String(syncProjectForm.serverIp || '').trim()
    const projectPathReady = !!syncProjectForm.projectPathReady
    const projectPathLoading = !!syncProjectForm.projectPathLoading
    const nginxConfSelected = !!String(syncProjectForm.nginxConfPath || '').trim()
    const nginxPortDisabled = !syncProjectForm.enableNginx || !syncProjectForm.nginxChecked || !nginxConfSelected
    const databaseConnected = !!syncProjectForm.dbChecked
    return [
      {
        key: 'serverIp',
        label: projectDialogCommonText.serverIp,
        component: 'select',
        placeholder: syncProjectPlaceholders.chooseServerIp,
        options: serverIpOptions.value,
        span: 12,
      },
      {
        key: 'basePath',
        label: syncProjectDialogText.projectDirPrefix,
        component: 'input',
        disabled: true,
        span: 12,
      },
      {
        key: 'projectPath',
        label: syncProjectDialogText.selectProjectDir,
        component: 'projectPathCascader',
        placeholder: serverSelected
          ? (projectPathLoading ? syncProjectPlaceholders.projectDirLoading : (projectPathReady ? syncProjectPlaceholders.chooseExistingProjectDir : syncProjectPlaceholders.projectDirLoadFailedOrNotLoaded))
          : syncProjectPlaceholders.chooseServerFirst,
        options: syncProjectForm.projectPathOptions,
        disabled: !serverSelected || projectPathLoading || !projectPathReady,
        span: 12,
      },
      {
        key: 'entryPath',
        label: syncProjectDialogText.selectEntryFile,
        component: 'entryPathCascader',
        placeholder: syncProjectForm.backendPath ? syncProjectPlaceholders.chooseEntryFile : syncProjectPlaceholders.chooseProjectDirFirst,
        options: syncProjectForm.entryPathOptions,
        disabled: !serverSelected || !String(syncProjectForm.backendPath || '').trim(),
        span: 12,
      },
      {
        key: 'backendPath',
        label: syncProjectDialogText.selectedProjectDir,
        component: 'input',
        disabled: true,
        span: 24,
      },
      {
        key: 'entryFilePath',
        label: syncProjectDialogText.selectedEntryFile,
        component: 'input',
        disabled: true,
        span: 24,
      },
      {
        key: 'name',
        label: projectDialogCommonText.projectName,
        component: 'input',
        placeholder: '',
        disabled: !serverSelected,
        span: 12,
      },
      {
        key: 'description',
        label: projectDialogCommonText.projectDescription,
        component: 'textarea',
        placeholder: syncProjectPlaceholders.projectDescription,
        rows: 1,
        disabled: !serverSelected,
        span: 12,
      },
      {
        key: 'condaEnvName',
        label: projectDialogCommonText.condaEnv,
        component: 'select',
        placeholder: syncProjectPlaceholders.chooseExistingCondaEnv,
        options: syncProjectForm.condaEnvOptions,
        disabled: !serverSelected || syncProjectForm.condaLoading,
        span: 12,
      },
      {
        key: 'condaCheck',
        label: syncProjectDialogText.condaPythonCheck,
        component: 'button',
        buttonText: syncProjectForm.condaChecked ? syncProjectDialogText.condaPythonChecked : syncProjectDialogText.condaPythonCheckButton,
        buttonType: syncProjectForm.condaChecked ? 'success' : 'primary',
        loading: !!syncProjectForm.condaChecking,
        disabled: !serverSelected || !String(syncProjectForm.condaEnvName || '').trim(),
        span: 12,
      },
      {
        key: 'pythonVersion',
        label: projectDialogCommonText.pythonVersion,
        component: 'input',
        placeholder: '',
        disabled: true,
        span: 12,
      },
      {
        key: 'enableNginx',
        label: projectDialogCommonText.nginxConfig,
        component: 'switch',
        activeText: projectDialogCommonText.enable,
        inactiveText: projectDialogCommonText.disable,
        disabled: !serverSelected,
        span: 24,
      },
      {
        key: 'nginxServerIp',
        label: projectDialogCommonText.nginxServerIp,
        component: 'select',
        placeholder: syncProjectPlaceholders.chooseNginxServerIp,
        options: serverIpOptions.value,
        disabled: !syncProjectForm.enableNginx,
        span: 12,
        visible: syncProjectForm.enableNginx,
      },
      {
        key: 'nginxCheck',
        label: projectDialogCommonText.nginxServiceCheck,
        component: 'button',
        buttonText: syncProjectForm.nginxChecked ? projectDialogCommonText.checkPassed : projectDialogCommonText.nginxCheckButton,
        buttonType: syncProjectForm.nginxChecked ? 'success' : 'primary',
        loading: !!syncProjectForm.nginxChecking,
        disabled: !syncProjectForm.enableNginx || !String(syncProjectForm.nginxServerIp || '').trim(),
        span: 12,
        visible: syncProjectForm.enableNginx,
      },
      {
        key: 'nginxConfPath',
        label: projectDialogCommonText.nginxConfPath,
        component: 'nginxConfChooser',
        options: nginxExistingConfOptions.value,
        loading: !!syncProjectForm.nginxChecking,
        disabled: !syncProjectForm.enableNginx || !syncProjectForm.nginxChecked,
        span: 24,
        visible: syncProjectForm.enableNginx,
      },
      {
        key: 'nginxFrontendPort',
        label: projectDialogCommonText.nginxFrontendPort,
        component: 'select',
        placeholder: nginxConfSelected ? syncProjectPlaceholders.chooseExistingListenPort : syncProjectPlaceholders.chooseNginxConfFirst,
        options: (syncProjectForm.nginxServerPortOptions || []).map((item) => ({
          label: String(item.frontend_port || ''),
          selectedLabel: String(item.frontend_port || ''),
          optionLabel: syncProjectMessageFactory.nginxPortOption(item.frontend_port, item.backend_deploy_port),
          value: String(item.frontend_port || ''),
        })),
        disabled: nginxPortDisabled || !(syncProjectForm.nginxServerPortOptions || []).length,
        span: 12,
        visible: syncProjectForm.enableNginx,
      },
      {
        key: 'nginxBackendPort',
        label: projectDialogCommonText.backendDeployPort,
        component: 'input',
        placeholder: syncProjectPlaceholders.backendPortAutoFill,
        disabled: true,
        span: 12,
        visible: syncProjectForm.enableNginx,
      },
      {
        key: 'enableDatabase',
        label: projectDialogCommonText.databaseConfig,
        component: 'switch',
        activeText: projectDialogCommonText.enable,
        inactiveText: projectDialogCommonText.disable,
        disabled: !serverSelected,
        span: 24,
      },
      {
        key: 'databaseHost',
        label: projectDialogCommonText.databaseIp,
        component: 'selectCreate',
        placeholder: syncProjectPlaceholders.databaseIp,
        options: serverIpOptions.value,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase,
      },
      {
        key: 'databasePort',
        label: projectDialogCommonText.databasePort,
        component: 'input',
        placeholder: syncProjectPlaceholders.databasePort,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase,
      },
      {
        key: 'databaseUser',
        label: projectDialogCommonText.databaseUser,
        component: 'input',
        placeholder: syncProjectPlaceholders.databaseUser,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase,
      },
      {
        key: 'databasePassword',
        label: projectDialogCommonText.databasePassword,
        component: 'password',
        placeholder: syncProjectPlaceholders.databasePassword,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase,
      },
      {
        key: 'databaseCheck',
        label: projectDialogCommonText.databaseConnectionTest,
        component: 'button',
        buttonText: syncProjectForm.dbChecked ? projectDialogCommonText.databaseConnected : projectDialogCommonText.check,
        buttonType: syncProjectForm.dbChecked ? 'success' : 'primary',
        loading: !!syncProjectForm.dbChecking,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase,
      },
      {
        key: 'databaseName',
        label: projectDialogCommonText.databaseName,
        component: 'select',
        placeholder: syncProjectPlaceholders.chooseExistingDatabase,
        options: syncProjectForm.databaseOptions,
        disabled: !syncProjectForm.enableDatabase,
        span: 12,
        visible: syncProjectForm.enableDatabase && databaseConnected,
      },
    ]
  })

  const resetNginxState = (clearIp = false) => {
    syncProjectForm.nginxChecked = false
    syncProjectForm.nginxChecking = false
    syncProjectForm.nginxConfOptions = []
    syncProjectForm.nginxExistingConfPath = ''
    syncProjectForm.nginxConfPath = ''
    syncProjectForm.nginxServerPortOptions = []
    syncProjectForm.nginxSelectedServerBlock = ''
    syncProjectForm.nginxFrontendPortChecked = false
    syncProjectForm.nginxBackendPortChecked = false
    if (clearIp) syncProjectForm.nginxServerIp = ''
  }

  const resetSyncProjectForm = () => {
    syncProjectForm.serverIp = ''
    syncProjectForm.basePath = getRootBasePath()
    syncProjectForm.projectPathOptions = []
    syncProjectForm.projectPathCascaderValue = []
    syncProjectForm.projectPathReady = false
    syncProjectForm.projectPathLoading = false
    syncProjectForm.projectRelPath = ''
    syncProjectForm.backendPath = ''
    syncProjectForm.entryPathOptions = []
    syncProjectForm.entryPathCascaderValue = []
    syncProjectForm.entryRelPath = ''
    syncProjectForm.entryFilePath = ''
    syncProjectForm.name = ''
    syncProjectForm.description = ''
    syncProjectForm.condaEnvName = ''
    syncProjectForm.condaEnvOptions = []
    syncProjectForm.condaEnvPath = ''
    syncProjectForm.pythonVersion = ''
    syncProjectForm.condaChecked = false
    syncProjectForm.condaChecking = false
    syncProjectForm.condaLoading = false
    syncProjectForm.enableDatabase = false
    syncProjectForm.databaseName = ''
    syncProjectForm.databaseOptions = []
    syncProjectForm.databaseHost = ''
    syncProjectForm.databasePort = DEFAULT_DB_PORT
    syncProjectForm.databaseUser = DEFAULT_DB_USER
    syncProjectForm.databasePassword = DEFAULT_DB_PASSWORD
    syncProjectForm.dbChecked = false
    syncProjectForm.dbChecking = false
    syncProjectForm.dbMessage = ''
    syncProjectForm.enableNginx = false
    syncProjectForm.nginxServerPortOptions = []
    syncProjectForm.nginxSelectedServerBlock = ''
    syncProjectForm.nginxFrontendPort = ''
    syncProjectForm.nginxBackendPort = ''
    syncProjectForm.syncing = false
    resetNginxState(true)
  }

  const openSyncProjectDialog = () => {
    resetSyncProjectForm()
    syncProjectDialogVisible.value = true
  }

  const loadRootProjectDirs = async () => {
    if (!String(syncProjectForm.serverIp || '').trim()) return
    syncProjectForm.basePath = getRootBasePath()
    syncProjectForm.projectPathLoading = true
    syncProjectForm.projectPathReady = false
    try {
      const resp = await projectApi.listSyncProjectPathChildren({
        server_ip: syncProjectForm.serverIp,
        rel_path: '',
      })
      const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
      syncProjectForm.projectPathOptions = rows.map((item) => ({
        label: item.label,
        value: item.value,
        leaf: false,
      }))
      syncProjectForm.projectPathReady = true
      ElMessage.success(syncProjectMessages.serverProjectDirsLoaded)
    } catch (error) {
      syncProjectForm.projectPathOptions = []
      syncProjectForm.projectPathReady = false
      ElMessage.error(getErrorMessage(error, syncProjectMessages.serverProjectDirsLoadFailed))
    } finally {
      syncProjectForm.projectPathLoading = false
    }
  }

  const onSyncProjectServerChange = async () => {
    syncProjectForm.basePath = getRootBasePath()
    syncProjectForm.projectPathCascaderValue = []
    syncProjectForm.projectPathReady = false
    syncProjectForm.projectPathLoading = false
    syncProjectForm.projectRelPath = ''
    syncProjectForm.backendPath = ''
    syncProjectForm.entryPathOptions = []
    syncProjectForm.entryPathCascaderValue = []
    syncProjectForm.entryRelPath = ''
    syncProjectForm.entryFilePath = ''
    syncProjectForm.condaEnvName = ''
    syncProjectForm.condaEnvOptions = []
    syncProjectForm.condaEnvPath = ''
    syncProjectForm.pythonVersion = ''
    syncProjectForm.condaChecked = false
    syncProjectForm.databaseHost = String(syncProjectForm.serverIp || '').trim()
    syncProjectForm.databaseName = ''
    syncProjectForm.databaseOptions = []
    syncProjectForm.dbChecked = false
    syncProjectForm.dbMessage = ''
    resetNginxState(true)
    syncProjectForm.nginxServerIp = String(syncProjectForm.serverIp || '').trim()
    await loadRootProjectDirs()
    await loadSyncCondaEnvOptions()
  }

  const onSyncProjectPathChange = async (payload = {}) => {
    if (payload.resolve) {
      if (!String(syncProjectForm.serverIp || '').trim()) {
        payload.resolve([])
        return
      }
      const node = payload.node
      const relPath = node && node.level > 0 ? String(node.value || '') : ''
      try {
        const resp = await projectApi.listSyncProjectPathChildren({
          server_ip: syncProjectForm.serverIp,
          rel_path: relPath,
        })
        const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
        payload.resolve(rows.map((item) => ({
          label: item.label,
          value: item.value,
          leaf: false,
        })))
      } catch (error) {
        ElMessage.error(getErrorMessage(error, syncProjectMessages.loadDirectoryFailed))
        payload.resolve([])
      }
    }
    if (payload.selected) {
      syncProjectForm.entryPathOptions = []
      syncProjectForm.entryPathCascaderValue = []
      syncProjectForm.entryRelPath = ''
      syncProjectForm.entryFilePath = ''
      await loadRootEntryFiles()
    }
  }

  const loadRootEntryFiles = async () => {
    if (!String(syncProjectForm.serverIp || '').trim() || !String(syncProjectForm.backendPath || '').trim()) return
    try {
      const resp = await projectApi.listSyncEntryPathChildren({
        server_ip: syncProjectForm.serverIp,
        backend_path: syncProjectForm.backendPath,
        rel_path: '',
      })
      const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
      syncProjectForm.entryPathOptions = rows.map((item) => ({
        label: item.label,
        value: item.value,
        leaf: !!item.leaf,
      }))
    } catch (error) {
      syncProjectForm.entryPathOptions = []
      ElMessage.error(getErrorMessage(error, syncProjectMessages.loadEntryFilesFailed))
    }
  }

  const onSyncProjectEntryPathChange = async (payload = {}) => {
    if (!payload.resolve) return
    if (!String(syncProjectForm.serverIp || '').trim() || !String(syncProjectForm.backendPath || '').trim()) {
      payload.resolve([])
      return
    }
    const node = payload.node
    const relPath = node && node.level > 0 ? String(node.value || '') : ''
    try {
      const resp = await projectApi.listSyncEntryPathChildren({
        server_ip: syncProjectForm.serverIp,
        backend_path: syncProjectForm.backendPath,
        rel_path: relPath,
      })
      const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
      payload.resolve(rows.map((item) => ({
        label: item.label,
        value: item.value,
        leaf: !!item.leaf,
      })))
    } catch (error) {
      ElMessage.error(getErrorMessage(error, syncProjectMessages.loadEntryFilesFailed))
      payload.resolve([])
    }
  }

  const loadSyncCondaEnvOptions = async () => {
    if (!String(syncProjectForm.serverIp || '').trim()) return
    try {
      syncProjectForm.condaLoading = true
      const resp = await projectApi.listSyncCondaEnvs({ server_ip: syncProjectForm.serverIp })
      const data = resp.data?.data || {}
      syncProjectForm.condaEnvOptions = Array.isArray(data.envs) ? data.envs.map((x) => String(x || '').trim()).filter(Boolean) : []
    } catch (error) {
      syncProjectForm.condaEnvOptions = []
      ElMessage.warning(getErrorMessage(error, syncProjectMessages.condaEnvQueryFailed))
    } finally {
      syncProjectForm.condaLoading = false
    }
  }

  const onSyncProjectCondaCheck = async () => {
    const serverIp = String(syncProjectForm.serverIp || '').trim()
    const envName = String(syncProjectForm.condaEnvName || '').trim()
    if (!serverIp || !envName) {
      ElMessage.warning(syncProjectMessages.serverAndCondaRequired)
      return false
    }
    try {
      syncProjectForm.condaChecking = true
      const resp = await projectApi.checkSyncConda({
        server_ip: serverIp,
        conda_env_name: envName,
      })
      const data = resp.data?.data || {}
      syncProjectForm.condaEnvPath = data.env_path || ''
      syncProjectForm.pythonVersion = data.python_version || ''
      syncProjectForm.condaChecked = true
      ElMessage.success(syncProjectMessages.condaEnvAvailable)
      return true
    } catch (error) {
      syncProjectForm.condaChecked = false
      ElMessage.error(getErrorMessage(error, syncProjectMessages.condaEnvUnavailable))
      return false
    } finally {
      syncProjectForm.condaChecking = false
    }
  }

  const onSyncProjectDatabaseCheck = async () => {
    if (!syncProjectForm.enableDatabase) return true
    const host = String(syncProjectForm.databaseHost || '').trim()
    const port = Number(syncProjectForm.databasePort || 0)
    const username = String(syncProjectForm.databaseUser || '').trim()
    const password = String(syncProjectForm.databasePassword || '')
    if (!host || !username) {
      ElMessage.warning(syncProjectMessages.databaseHostAndUserRequired)
      return false
    }
    if (!port || port < DB_PORT_MIN || port > DB_PORT_MAX) {
      ElMessage.warning(syncProjectMessageFactory.databasePortInvalid(DB_PORT_MIN, DB_PORT_MAX))
      return false
    }
    try {
      syncProjectForm.dbChecking = true
      const resp = await projectApi.checkSyncDatabase({
        host,
        port,
        username,
        password,
        database_name: '',
      })
      const data = resp.data?.data || {}
      const message = data.message || syncProjectMessages.databaseConnectSuccessChooseDatabase
      syncProjectForm.databaseOptions = Array.isArray(data.databases) ? data.databases : []
      syncProjectForm.databaseName = ''
      syncProjectForm.dbChecked = true
      syncProjectForm.dbMessage = syncProjectForm.databaseOptions.length
        ? syncProjectMessageFactory.databaseOptionsLoaded(message, syncProjectForm.databaseOptions.length)
        : syncProjectMessages.databaseConnectSuccessNoDatabase
      ElMessage.success(message)
      return true
    } catch (error) {
      syncProjectForm.dbChecked = false
      syncProjectForm.databaseOptions = []
      syncProjectForm.databaseName = ''
      syncProjectForm.dbMessage = getErrorMessage(error, syncProjectMessages.databaseConnectFailed)
      ElMessage.warning(syncProjectForm.dbMessage)
      return false
    } finally {
      syncProjectForm.dbChecking = false
    }
  }

  const onSyncProjectNginxCheck = async () => {
    if (!syncProjectForm.enableNginx) return true
    const serverIp = String(syncProjectForm.serverIp || '').trim()
    const nginxServerIp = String(syncProjectForm.nginxServerIp || '').trim()
    if (!serverIp || !nginxServerIp) {
      ElMessage.warning(syncProjectMessages.serverAndNginxRequired)
      return false
    }
    try {
      resetNginxState(false)
      syncProjectForm.nginxChecking = true
      const resp = await projectApi.checkProjectNginx({
        server_ip: serverIp,
        nginx_server_ip: nginxServerIp,
      })
      const data = resp.data?.data || {}
      const confPath = String(data.conf_path || '')
      const confFiles = Array.isArray(data.conf_files) ? data.conf_files : []
      syncProjectForm.nginxConfOptions = confFiles.length ? confFiles : (confPath ? [{ path: confPath, source: 'main' }] : [])
      syncProjectForm.nginxChecked = true
      ElMessage.success(syncProjectMessages.nginxServiceAvailable)
      return true
    } catch (error) {
      resetNginxState(false)
      ElMessage.error(getErrorMessage(error, syncProjectMessages.nginxServiceUnavailable))
      return false
    } finally {
      syncProjectForm.nginxChecking = false
    }
  }

  const loadSyncNginxServerPortOptions = async () => {
    if (!syncProjectForm.enableNginx) return true
    const serverIp = String(syncProjectForm.serverIp || '').trim()
    const nginxServerIp = String(syncProjectForm.nginxServerIp || '').trim()
    const nginxConfPath = String(syncProjectForm.nginxConfPath || '').trim()
    syncProjectForm.nginxServerPortOptions = []
    syncProjectForm.nginxSelectedServerBlock = ''
    syncProjectForm.nginxFrontendPort = ''
    syncProjectForm.nginxBackendPort = ''
    syncProjectForm.nginxFrontendPortChecked = false
    syncProjectForm.nginxBackendPortChecked = false
    if (!serverIp || !nginxServerIp || !nginxConfPath) return false
    try {
      const resp = await projectApi.listSyncNginxServerPortOptions({
        server_ip: serverIp,
        nginx_server_ip: nginxServerIp,
        nginx_conf_path: nginxConfPath,
      })
      const rows = Array.isArray(resp.data?.data?.options) ? resp.data.data.options : []
      syncProjectForm.nginxServerPortOptions = rows.map((item) => ({
        label: syncProjectMessageFactory.nginxPortOption(item.frontend_port, item.backend_deploy_port),
        frontend_port: String(item.frontend_port || ''),
        backend_deploy_port: String(item.backend_deploy_port || ''),
        server_name: item.server_name || '',
        nginx_config_text: item.nginx_config_text || '',
      })).filter((item) => item.frontend_port && item.backend_deploy_port)
      if (!syncProjectForm.nginxServerPortOptions.length) {
        ElMessage.warning(syncProjectMessages.nginxNoPortOptions)
        return false
      }
      ElMessage.success(syncProjectMessages.nginxPortOptionsLoaded)
      return true
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, syncProjectMessages.nginxPortOptionsLoadFailed))
      return false
    }
  }

  const onSyncProjectNginxFrontendPortChange = async () => {
    const frontend = String(syncProjectForm.nginxFrontendPort || '').trim()
    const options = Array.isArray(syncProjectForm.nginxServerPortOptions) ? syncProjectForm.nginxServerPortOptions : []
    const matched = options.find((item) => String(item.frontend_port || '') === frontend)
    if (!frontend || !matched) {
      syncProjectForm.nginxBackendPort = ''
      syncProjectForm.nginxSelectedServerBlock = ''
      syncProjectForm.nginxFrontendPortChecked = false
      syncProjectForm.nginxBackendPortChecked = false
      return false
    }
    syncProjectForm.nginxBackendPort = String(matched.backend_deploy_port || '')
    syncProjectForm.nginxSelectedServerBlock = matched.nginx_config_text || ''
    syncProjectForm.nginxFrontendPortChecked = true
    syncProjectForm.nginxBackendPortChecked = !!syncProjectForm.nginxBackendPort
    if (!validateNginxPortPair()) return false
    return await checkSyncNginxServerBlockIfReady()
  }

  const validateNginxPortPair = () => {
    const serverIp = String(syncProjectForm.serverIp || '').trim()
    const nginxIp = String(syncProjectForm.nginxServerIp || '').trim()
    const frontend = String(syncProjectForm.nginxFrontendPort || '').trim()
    const backend = String(syncProjectForm.nginxBackendPort || '').trim()
    if (serverIp && nginxIp && serverIp === nginxIp && frontend && backend && frontend === backend) {
      syncProjectForm.nginxFrontendPortChecked = false
      syncProjectForm.nginxBackendPortChecked = false
      ElMessage.warning(syncProjectMessages.nginxSameServerPortConflict)
      return false
    }
    return true
  }

  const onSyncProjectNginxPortBlur = async () => {
    // 同步已有项目不创建新端口，不做“端口可用”检测。
    // 前端端口只能从已解析出的 listen 下拉框选择，后端部署端口由同一个 server 块的 proxy_pass 自动回显。
    return await onSyncProjectNginxFrontendPortChange()
  }

  async function checkSyncNginxServerBlockIfReady() {
    if (!syncProjectForm.enableNginx) return true
    const frontend = String(syncProjectForm.nginxFrontendPort || '').trim()
    const backend = String(syncProjectForm.nginxBackendPort || '').trim()
    if (!frontend || !backend) return true
    if (!syncProjectForm.nginxFrontendPortChecked || !syncProjectForm.nginxBackendPortChecked) return false
    try {
      const resp = await projectApi.checkSyncNginxServerBlock({
        server_ip: String(syncProjectForm.serverIp || '').trim(),
        nginx_server_ip: String(syncProjectForm.nginxServerIp || '').trim(),
        nginx_conf_path: String(syncProjectForm.nginxConfPath || '').trim(),
        frontend_port: frontend,
        backend_deploy_port: backend,
      })
      const data = resp.data?.data || {}
      ElMessage.success(data.message || syncProjectMessages.nginxMatched)
      return true
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, syncProjectMessages.nginxNotMatched))
      return false
    }
  }

  const ensureSyncProjectReady = async () => {
    if (!String(syncProjectForm.serverIp || '').trim()) {
      ElMessage.warning(syncProjectMessages.serverIpRequired)
      return false
    }
    if (!String(syncProjectForm.backendPath || '').trim()) {
      ElMessage.warning(syncProjectMessages.projectDirRequired)
      return false
    }
    if (!String(syncProjectForm.entryFilePath || '').trim()) {
      ElMessage.warning(syncProjectMessages.entryFileRequired)
      return false
    }
    if (!String(syncProjectForm.name || '').trim()) {
      ElMessage.warning(syncProjectMessages.projectNameRequired)
      return false
    }
    if (!syncProjectForm.condaChecked) {
      const ok = await onSyncProjectCondaCheck()
      if (!ok) return false
    }
    if (syncProjectForm.enableNginx) {
      if (!syncProjectForm.nginxChecked) {
        ElMessage.warning(syncProjectMessages.nginxCheckRequired)
        return false
      }
      if (!String(syncProjectForm.nginxConfPath || '').trim()) {
        ElMessage.warning(syncProjectMessages.nginxConfRequired)
        return false
      }
      if (!(syncProjectForm.nginxServerPortOptions || []).length) {
        const loaded = await loadSyncNginxServerPortOptions()
        if (!loaded) return false
      }
      if (!String(syncProjectForm.nginxFrontendPort || '').trim()) {
        ElMessage.warning(syncProjectMessages.nginxFrontendPortRequired)
        return false
      }
      if (!String(syncProjectForm.nginxBackendPort || '').trim()) {
        ElMessage.warning(syncProjectMessages.nginxBackendPortNotFound)
        return false
      }
      if (!syncProjectForm.nginxFrontendPortChecked || !syncProjectForm.nginxBackendPortChecked) {
        const ok = await onSyncProjectNginxFrontendPortChange()
        if (!ok) return false
      }
      const nginxBlockOk = await checkSyncNginxServerBlockIfReady()
      if (!nginxBlockOk) return false
    }
    if (syncProjectForm.enableDatabase && !syncProjectForm.dbChecked) {
      const ok = await onSyncProjectDatabaseCheck()
      if (!ok) return false
    }
    if (syncProjectForm.enableDatabase && !String(syncProjectForm.databaseName || '').trim()) {
      ElMessage.warning(syncProjectMessages.databaseNameRequired)
      return false
    }
    return true
  }

  const confirmSyncProject = async () => {
    if (!(await ensureSyncProjectReady())) return
    const projectName = String(syncProjectForm.name || '').trim()
    const serverIp = String(syncProjectForm.serverIp || '').trim()
    const enableDatabase = !!syncProjectForm.enableDatabase
    const enableNginx = !!syncProjectForm.enableNginx
    const tempProject = {
      id: 0,
      owner: projectStore.currentUsername?.value ?? projectStore.currentUsername ?? '',
      name: projectName,
      description: String(syncProjectForm.description || '').trim(),
      serverIp,
      backendPath: String(syncProjectForm.backendPath || '').trim(),
      entryFilePath: String(syncProjectForm.entryFilePath || '').trim(),
      condaEnvName: String(syncProjectForm.condaEnvName || '').trim(),
      pythonVersion: String(syncProjectForm.pythonVersion || '').trim(),
      databaseName: enableDatabase ? String(syncProjectForm.databaseName || '').trim() : '',
      databaseHost: enableDatabase ? String(syncProjectForm.databaseHost || '').trim() : '',
      databasePort: enableDatabase ? String(syncProjectForm.databasePort || '').trim() : '',
      databaseUser: enableDatabase ? String(syncProjectForm.databaseUser || '').trim() : '',
      databasePassword: enableDatabase ? String(syncProjectForm.databasePassword || '') : '',
      nginxPath: enableNginx ? String(syncProjectForm.nginxConfPath || '').trim() : '',
      nginxServerIp: enableNginx ? String(syncProjectForm.nginxServerIp || '').trim() : '',
      frontendPort: enableNginx ? String(syncProjectForm.nginxFrontendPort || '').trim() : '',
      backendDeployPort: enableNginx ? String(syncProjectForm.nginxBackendPort || '').trim() : '',
      nginxConfigText: enableNginx ? String(syncProjectForm.nginxSelectedServerBlock || '') : '',
      status: PROJECT_SYNCING_TEXT,
      serviceStatus: PROJECT_SYNCING_TEXT,
    }
    const existsLocal = projectStore.projects.some((item) => item.name === projectName)
    if (existsLocal) {
      projectStore.updateProjectByName(projectName, tempProject)
    } else {
      projectStore.prependProject(tempProject)
    }
    syncProjectDialogVisible.value = false
    try {
      syncProjectForm.syncing = true
      const resp = await projectApi.syncExistingProject({
        server_ip: serverIp,
        name: projectName,
        description: String(syncProjectForm.description || '').trim(),
        backend_path: String(syncProjectForm.backendPath || '').trim(),
        entry_file_path: String(syncProjectForm.entryFilePath || '').trim(),
        conda_env_name: String(syncProjectForm.condaEnvName || '').trim(),
        python_version: String(syncProjectForm.pythonVersion || '').trim(),
        use_database: !!syncProjectForm.enableDatabase,
        database_name: String(syncProjectForm.databaseName || '').trim(),
        database_host: String(syncProjectForm.databaseHost || '').trim(),
        database_port: syncProjectForm.enableDatabase ? Number(syncProjectForm.databasePort || 0) : null,
        database_user: String(syncProjectForm.databaseUser || '').trim(),
        database_password: String(syncProjectForm.databasePassword || ''),
        use_nginx: !!syncProjectForm.enableNginx,
        nginx_server_ip: String(syncProjectForm.nginxServerIp || '').trim(),
        nginx_conf_path: String(syncProjectForm.nginxConfPath || '').trim(),
        frontend_port: String(syncProjectForm.nginxFrontendPort || '').trim(),
        backend_deploy_port: String(syncProjectForm.nginxBackendPort || '').trim(),
        nginx_config_text: String(syncProjectForm.nginxSelectedServerBlock || ''),
      })
      ElMessage.success(resp.data?.message || syncProjectMessages.syncSuccess)
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, syncProjectMessages.syncFailed))
      await projectStore.loadBundle()
    } finally {
      syncProjectForm.syncing = false
    }
  }

  watch(
    () => syncProjectForm.condaEnvName,
    () => {
      syncProjectForm.condaChecked = false
      syncProjectForm.condaEnvPath = ''
      syncProjectForm.pythonVersion = ''
    },
  )

  watch(
    () => [syncProjectForm.databaseHost, syncProjectForm.databasePort, syncProjectForm.databaseUser, syncProjectForm.databasePassword],
    () => {
      syncProjectForm.dbChecked = false
      syncProjectForm.databaseName = ''
      syncProjectForm.databaseOptions = []
      syncProjectForm.dbMessage = ''
    },
  )

  watch(
    () => syncProjectForm.enableDatabase,
    (enabled) => {
      syncProjectForm.dbChecked = false
      syncProjectForm.dbMessage = ''
      syncProjectForm.databaseName = ''
      syncProjectForm.databaseOptions = []
      if (enabled) {
        if (!syncProjectForm.databaseHost) syncProjectForm.databaseHost = syncProjectForm.serverIp
        if (!syncProjectForm.databasePort) syncProjectForm.databasePort = DEFAULT_DB_PORT
        if (!syncProjectForm.databaseUser) syncProjectForm.databaseUser = DEFAULT_DB_USER
        if (!syncProjectForm.databasePassword) syncProjectForm.databasePassword = DEFAULT_DB_PASSWORD
      }
    },
  )

  watch(
    () => syncProjectForm.enableNginx,
    (enabled) => {
      if (enabled) {
        if (!syncProjectForm.nginxServerIp) syncProjectForm.nginxServerIp = syncProjectForm.serverIp
      } else {
        resetNginxState(true)
        syncProjectForm.nginxFrontendPort = ''
        syncProjectForm.nginxBackendPort = ''
      }
    },
  )

  watch(
    () => syncProjectForm.nginxServerIp,
    (value, oldValue) => {
      const next = String(value || '').trim()
      const prev = String(oldValue || '').trim()
      if (next === prev) return
      resetNginxState(false)
      syncProjectForm.nginxServerIp = next
    },
  )

  watch(
    () => syncProjectForm.nginxConfPath,
    async (value, oldValue) => {
      const next = String(value || '').trim()
      const prev = String(oldValue || '').trim()
      if (next === prev) return
      syncProjectForm.nginxServerPortOptions = []
      syncProjectForm.nginxSelectedServerBlock = ''
      syncProjectForm.nginxFrontendPort = ''
      syncProjectForm.nginxBackendPort = ''
      syncProjectForm.nginxFrontendPortChecked = false
      syncProjectForm.nginxBackendPortChecked = false
      if (next && syncProjectForm.enableNginx && syncProjectForm.nginxChecked) {
        await loadSyncNginxServerPortOptions()
      }
    },
  )

  watch(
    () => syncProjectDialogVisible.value,
    (visible) => {
      if (!visible) return
      syncProjectForm.basePath = getRootBasePath()
    },
  )

  return {
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
  }
}
