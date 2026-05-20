import {
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
} from '../dialogConstants'
import { buildCascaderPathValues } from '../dialogUtils'

/**
 * Fill project setting form from one project row.
 * It normalizes camelCase fields used by frontend and snake_case fields returned by backend.
 */
export const fillProjectSettingForm = ({ settingForm, project, projectStore }) => {
  const serverIpOptions = (projectStore.servers || []).map((x) => String(x.ip || '').trim()).filter((x) => !!x)

  settingForm.projectId = project.id
  settingForm.projectName = project.name
  settingForm.description = String(project.description || '').trim()
  settingForm.descriptionModifyEnabled = false
  settingForm.condaEnvName = String(project.condaEnvName || project.conda_env_name || '').trim()
  settingForm.condaModifyEnabled = false
  settingForm.pythonVersion = String(project.pythonVersion || project.python_version || '').trim()
  settingForm.createCondaEnv = false
  settingForm.dropOriginalCondaEnv = false
  settingForm.backendPath = project.backendPath || ''
  settingForm.entryFilePath = String(project.entryFilePath || project.entry_file_path || '').trim()
  settingForm.entryFilePathModifyEnabled = false
  settingForm.entryFilePathCascaderValue = buildCascaderPathValues(settingForm.entryFilePath)
  settingForm.backendDevPort = project.backendDevPort
  settingForm.backendDeployPort = project.backendDeployPort || ''
  settingForm.frontendPort = project.frontendPort || ''
  settingForm.nginxEnabled = !!String(project.nginxPath || '').trim()
  settingForm.nginxModifyEnabled = false
  settingForm.dropOriginalNginxConfig = false
  settingForm.nginxServerIp = String(project.nginxServerIp || project.nginx_server_ip || project.serverIp || '').trim()
  settingForm.nginxConfPath = String(project.nginxPath || '').trim()
  settingForm.nginxConfigText = String(project.nginxConfigText || project.nginx_config_text || '').trim()
  settingForm.nginxConfOptions = settingForm.nginxConfPath ? [{ path: settingForm.nginxConfPath, source: 'existing' }] : []
  settingForm.nginxNewConfDirs = []
  settingForm.nginxExistingConfPath = settingForm.nginxConfPath
  settingForm.nginxNewConfBaseDir = ''
  settingForm.nginxNewConfDirPath = ''
  settingForm.nginxNewConfDirCascaderValue = []
  settingForm.nginxNewConfFileName = ''
  settingForm.nginxChecked = !!settingForm.nginxConfPath
  settingForm.nginxChecking = false
  settingForm.nginxFrontendPortChecked = !!String(settingForm.frontendPort || '').trim()
  settingForm.nginxBackendPortChecked = !!String(settingForm.backendDeployPort || '').trim()
  settingForm.nginxPreviewVisible = false
  settingForm.nginxPreviewText = settingForm.nginxConfigText
  settingForm.nginxPreviewDraft = settingForm.nginxConfigText
  settingForm.nginxPreviewConfirmed = !!settingForm.nginxConfigText
  settingForm.frontendPath = String(project.frontendPath || project.frontend_path || '').trim()
  settingForm.currentUsername = String(projectStore.currentUsername?.value ?? projectStore.currentUsername ?? 'root').trim()
  settingForm.currentRole = String(projectStore.currentRole?.value ?? projectStore.currentRole ?? 'user').trim()
  settingForm.devCommand = String(project.devCommand || project.dev_start_command || '')
  settingForm.devCommandModifyEnabled = false
  settingForm.deployCommand = String(project.deployCommand || project.deploy_start_command || '')
  settingForm.deployCommandModifyEnabled = false
  settingForm.serverIp = String(project.serverIp || '').trim()
  settingForm.serverIpOptions = serverIpOptions
  settingForm.databaseName = String(project.databaseName || '').trim()
  settingForm.databaseModifyEnabled = false
  settingForm.dropOriginalDatabase = false
  settingForm.databaseHost = String(project.databaseHost || '').trim() || settingForm.serverIp || serverIpOptions[0] || ''
  settingForm.databasePort = String(project.databasePort || '').trim() || DEFAULT_DB_PORT
  settingForm.databaseUser = String(project.databaseUser || '').trim() || DEFAULT_DB_USER
  settingForm.databasePassword = String(project.databasePassword || '') || DEFAULT_DB_PASSWORD
}

/**
 * Build backend payload for saving project settings.
 */
export const buildProjectSettingPayload = (settingForm) => {
  const databaseName = String(settingForm.databaseName || '').trim()
  return {
    description: String(settingForm.description || ''),
    conda_env_name: String(settingForm.condaEnvName || ''),
    python_version: String(settingForm.pythonVersion || ''),
    create_conda_env: !!settingForm.createCondaEnv,
    drop_original_conda_env: !!settingForm.dropOriginalCondaEnv,
    entry_file_path: String(settingForm.entryFilePath || ''),
    backend_dev_port: String(settingForm.backendDevPort),
    backend_deploy_port: String(settingForm.backendDeployPort),
    frontend_port: String(settingForm.frontendPort),
    dev_start_command: String(settingForm.devCommand),
    deploy_start_command: String(settingForm.deployCommand),
    nginx_enabled: !!settingForm.nginxEnabled,
    nginx_server_ip: String(settingForm.nginxServerIp || ''),
    nginx_conf_path: String(settingForm.nginxConfPath || ''),
    nginx_config_text: settingForm.nginxEnabled ? String(settingForm.nginxConfigText || '') : '',
    drop_original_nginx_config: !!settingForm.dropOriginalNginxConfig,
    database_name: databaseName,
    database_host: databaseName ? String(settingForm.databaseHost || '') : '',
    database_port: databaseName ? String(settingForm.databasePort || '') : '',
    database_user: databaseName ? String(settingForm.databaseUser || '') : '',
    database_password: databaseName ? String(settingForm.databasePassword || '') : '',
    drop_original_database: !!settingForm.dropOriginalDatabase,
  }
}

/**
 * Build local store patch after project settings are saved.
 */
export const buildProjectSettingStorePatch = (settingForm) => {
  const databaseName = String(settingForm.databaseName || '').trim()
  return {
    description: String(settingForm.description || ''),
    condaEnvName: String(settingForm.condaEnvName || ''),
    pythonVersion: String(settingForm.pythonVersion || ''),
    entryFilePath: String(settingForm.entryFilePath || ''),
    backendDevPort: String(settingForm.backendDevPort),
    backendDeployPort: String(settingForm.backendDeployPort),
    frontendPort: String(settingForm.frontendPort),
    nginxPath: String(settingForm.nginxConfPath || ''),
    nginxServerIp: String(settingForm.nginxServerIp || ''),
    nginxConfigText: settingForm.nginxEnabled ? String(settingForm.nginxConfigText || '') : '',
    devCommand: String(settingForm.devCommand),
    deployCommand: String(settingForm.deployCommand),
    databaseName,
    databaseHost: databaseName ? String(settingForm.databaseHost || '') : '',
    databasePort: databaseName ? String(settingForm.databasePort || '') : '',
    databaseUser: databaseName ? String(settingForm.databaseUser || '') : '',
    databasePassword: databaseName ? String(settingForm.databasePassword || '') : '',
  }
}
