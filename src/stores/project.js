import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import {
  PROJECT_HEALTH_STATUS_TEXT,
  PROJECT_INFO_SEPARATOR,
  PROJECT_SERVICE_STATUS_TEXT,
  PROJECT_STORE_MESSAGES,
  PROJECT_TEXT_ALL_MEMBERS,
  PROJECT_TEXT_BACKEND_PORT,
  PROJECT_TEXT_DATABASE_NAME,
  PROJECT_TEXT_FRONTEND_PORT,
  PROJECT_TEXT_NOT_CONFIGURED,
  PROJECT_WORKFLOW_STATUS_TEXT,
} from '@/config/project/project.display.config'

/**
 * 项目管理 store。
 *
 * 作用：
 * - 管理项目、用户、环境、服务器等首页聚合数据。
 * - 将后端 snake_case（下划线命名）字段转换为前端 camelCase（驼峰命名）模型。
 * - 维护项目忙碌状态、服务检测状态、健康检测状态等页面运行态。
 */

/**
 * 拼接信息片段。
 *
 * 参数：
 * - parts：多个待展示片段。
 * - emptyText：所有片段为空时的兜底文本。
 *
 * 返回：
 * - 使用斜杠连接后的展示文本。
 */
const joinParts = (parts, emptyText = PROJECT_TEXT_NOT_CONFIGURED) => {
  const values = parts.map((item) => String(item || '').trim()).filter(Boolean)
  return values.length ? values.join(PROJECT_INFO_SEPARATOR) : emptyText
}

/**
 * 构建项目表格中的 Nginx 摘要。
 *
 * 参数：
 * - item：后端返回的项目原始数据。
 *
 * 返回：
 * - Nginx IP、前端端口、后端代理端口组合后的展示文本。
 */
const buildNginxInfo = (item) => {
  const nginxIp = item.nginx_server_ip || ''
  const frontendPort = item.frontend_port ? `${PROJECT_TEXT_FRONTEND_PORT}:${item.frontend_port}` : ''
  const backendPort = item.backend_deploy_port ? `${PROJECT_TEXT_BACKEND_PORT}:${item.backend_deploy_port}` : ''
  return joinParts([nginxIp, frontendPort, backendPort])
}

/**
 * 构建项目表格中的数据库摘要。
 *
 * 参数：
 * - item：后端返回的项目原始数据。
 *
 * 返回：
 * - 数据库 IP、数据库名组合后的展示文本。
 */
const buildDatabaseInfo = (item) => {
  const host = item.database_host || ''
  const name = item.database_name ? `${PROJECT_TEXT_DATABASE_NAME}:${item.database_name}` : ''
  return joinParts([host, name])
}

/**
 * 将后端项目数据映射为前端项目表格模型。
 *
 * 参数：
 * - item：项目接口返回的单条原始数据。
 *
 * 返回：
 * - 前端统一使用的 camelCase 项目对象。
 */
const mapProject = (item) => ({
  id: item.id,
  ownerId: item.owner_id,
  owner: item.owner,
  name: item.name,
  description: item.description || '',
  serverId: item.server_id,
  serverIp: item.server_ip || '',
  backendPath: item.backend_path || '',
  frontendPath: item.frontend_path || '',
  nginxPath: item.nginx_conf_path || '',
  nginxServerIp: item.nginx_server_ip || '',
  nginxConfigText: item.nginx_config_text || '',
  frontendPort: item.frontend_port || '',
  backendDevPort: item.backend_dev_port || '',
  backendDeployPort: item.backend_deploy_port || '',
  databaseName: item.database_name || '',
  databaseHost: item.database_host || '',
  databasePort: item.database_port || '',
  databaseUser: item.database_user || '',
  databasePassword: item.database_password || '',
  condaEnvName: item.conda_env_name || '',
  pythonVersion: item.python_version || '',
  devCommand: item.dev_start_command || '',
  deployCommand: item.deploy_start_command || '',
  entryFilePath: item.entry_file_path || '',
  status: item.status || item.service_status || PROJECT_SERVICE_STATUS_TEXT.STOPPED,
  runningPort: item.running_port || '',
  serviceStatus: item.service_status || item.status || PROJECT_SERVICE_STATUS_TEXT.STOPPED,
  projectStatus: item.project_status || PROJECT_HEALTH_STATUS_TEXT.NORMAL,
  projectStatusDetail: item.project_status_detail || '',
  nginxInfo: item.nginx_info || buildNginxInfo(item),
  databaseInfo: item.database_info || buildDatabaseInfo(item),
  createdAt: item.created_at || '',
  updatedAt: item.updated_at || '',
})

/** 将后端用户数据映射为前端用户表格模型。 */
const mapUser = (item) => ({
  id: item.id,
  userid: item.userid,
  username: item.username,
  password: item.password,
  role: item.role,
  operator: item.operator,
  createdAt: item.created_at || '',
})

/** 将后端环境数据映射为前端环境表格模型。 */
const mapEnv = (item) => ({
  id: item.id,
  envName: item.env_name,
  projectName: item.project_name || '',
  pythonVersion: item.python_version || '',
  mainPackages: item.main_packages || '',
  createdAt: item.created_at || '',
})

/** 将后端服务器数据映射为前端服务器表格模型。 */
const mapServer = (item) => ({
  id: item.id,
  alias: item.alias || '',
  ip: item.ip,
  rootPassword: item.root_password || '',
  users: item.users || 'root',
  remark: item.remark || '',
})

export const useProjectStore = defineStore('project', () => {
  const projects = ref([])
  const users = ref([])
  const envs = ref([])
  const servers = ref([])
  const currentUsername = ref('user')
  const currentRole = ref('user')
  const currentProjectBasePath = ref('')
  const projectRootBasePath = ref('')
  const projectUserBasePathTemplate = ref('')
  const busyProjectIds = ref([])
  const healthCheckingProjectIds = ref([])
  const serviceCheckingProjectIds = ref([])

  const loading = ref(false)
  const loaded = ref(false)

  /**
   * 加载项目管理首页需要的聚合数据。
   *
   * 返回：
   * - `{ ok: true }` 表示加载成功。
   * - `{ ok: false, message }` 表示加载失败和错误提示。
   */
  const loadBundle = async () => {
    if (loading.value) return { ok: true }
    loading.value = true
    try {
      const [projectResp, userResp, envResp, serverResp] = await Promise.all([
        projectApi.listProjects({ page: 1, page_size: 200 }),
        projectApi.listUsers({ page: 1, page_size: 200 }),
        projectApi.listEnvs({ page: 1, page_size: 200 }),
        projectApi.listServers({ page: 1, page_size: 200 }),
      ])

      projects.value = (projectResp.data?.data?.data || []).map(mapProject)
      users.value = (userResp.data?.data?.data || []).map(mapUser)
      envs.value = (envResp.data?.data?.data || []).map(mapEnv)
      servers.value = (serverResp.data?.data?.data || []).map(mapServer)
      loaded.value = true
      return { ok: true }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error, PROJECT_STORE_MESSAGES.LOAD_BUNDLE_FAILED) }
    } finally {
      loading.value = false
    }
  }

  const canDeleteProject = computed(() => projects.value.length > 0)
  const memberFilterOptions = computed(() => {
    const names = Array.from(new Set(users.value.map((x) => x.username)))
    return [{ label: PROJECT_TEXT_ALL_MEMBERS, value: 'all' }, ...names.map((x) => ({ label: x, value: x }))]
  })

  /** 更新项目普通状态文本。 */
  const setProjectStatus = (projectId, status) => {
    const target = projects.value.find((item) => item.id === projectId)
    if (!target) return
    target.status = status
  }

  /**
   * 根据设置弹框保存结果更新本地项目配置。
   *
   * 参数：
   * - projectId：项目 ID。
   * - payload：后端返回或前端组装的配置字段。
   */
  const updateProjectSetting = (projectId, payload) => {
    const target = projects.value.find((item) => item.id === projectId)
    if (!target) return
    target.description = payload.description ?? target.description
    target.condaEnvName = payload.condaEnvName ?? target.condaEnvName
    target.pythonVersion = payload.pythonVersion ?? target.pythonVersion
    target.backendDevPort = payload.backendDevPort
    target.backendDeployPort = payload.backendDeployPort
    target.frontendPort = payload.frontendPort
    target.nginxPath = payload.nginxPath ?? target.nginxPath
    target.nginxServerIp = payload.nginxServerIp ?? target.nginxServerIp
    target.nginxConfigText = payload.nginxConfigText ?? target.nginxConfigText
    target.devCommand = payload.devCommand
    target.deployCommand = payload.deployCommand
    target.entryFilePath = payload.entryFilePath
    target.databaseName = payload.databaseName ?? target.databaseName
    target.databaseHost = payload.databaseHost ?? target.databaseHost
    target.databasePort = payload.databasePort ?? target.databasePort
    target.databaseUser = payload.databaseUser ?? target.databaseUser
    target.databasePassword = payload.databasePassword ?? target.databasePassword
  }

  /** 按项目名称合并更新本地项目数据。 */
  const updateProjectByName = (name, payload = {}) => {
    const target = projects.value.find((item) => item.name === name)
    if (!target) return false
    Object.assign(target, payload)
    return true
  }

  /** 设置项目是否处于创建、设置、同步等忙碌状态。 */
  const setProjectBusy = (projectId, busy = true) => {
    const id = Number(projectId)
    if (!id) return
    const set = new Set(busyProjectIds.value.map((item) => Number(item)))
    if (busy) {
      set.add(id)
    } else {
      set.delete(id)
    }
    busyProjectIds.value = Array.from(set)
  }

  /** 判断项目是否处于忙碌状态。 */
  const isProjectBusy = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return busyProjectIds.value.map((item) => Number(item)).includes(id)
  }

  /** 设置项目检测状态按钮是否正在请求中。 */
  const setProjectHealthChecking = (projectId, checking = true) => {
    const id = Number(projectId)
    if (!id) return
    const set = new Set(healthCheckingProjectIds.value.map((item) => Number(item)))
    if (checking) {
      set.add(id)
    } else {
      set.delete(id)
    }
    healthCheckingProjectIds.value = Array.from(set)
  }

  /** 判断项目检测状态按钮是否正在请求中。 */
  const isProjectHealthChecking = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return healthCheckingProjectIds.value.map((item) => Number(item)).includes(id)
  }

  /** 设置服务状态检测按钮是否正在请求中。 */
  const setProjectServiceChecking = (projectId, checking = true) => {
    const id = Number(projectId)
    if (!id) return
    const set = new Set(serviceCheckingProjectIds.value.map((item) => Number(item)))
    if (checking) {
      set.add(id)
    } else {
      set.delete(id)
    }
    serviceCheckingProjectIds.value = Array.from(set)
  }

  /** 判断服务状态检测按钮是否正在请求中。 */
  const isProjectServiceChecking = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return serviceCheckingProjectIds.value.map((item) => Number(item)).includes(id)
  }

  /** 规范服务状态和运行端口，保证“运行中”必须同时有端口。 */
  const normalizeServiceRuntime = (status, port) => {
    const normalizedStatus = String(status || PROJECT_SERVICE_STATUS_TEXT.STOPPED).trim()
    const normalizedPort = String(port || '').trim()
    if (normalizedStatus === PROJECT_SERVICE_STATUS_TEXT.RUNNING && normalizedPort) {
      return { status: PROJECT_SERVICE_STATUS_TEXT.RUNNING, port: normalizedPort }
    }
    return { status: PROJECT_SERVICE_STATUS_TEXT.STOPPED, port: '' }
  }

  /** 根据服务检测接口结果更新服务状态和运行端口。 */
  const updateProjectServiceStatus = (projectId, payload = {}) => {
    const target = projects.value.find((item) => Number(item.id) === Number(projectId))
    if (!target) return
    const rawStatus = payload.service_status || payload.serviceStatus || payload.status || target.serviceStatus || target.status || PROJECT_SERVICE_STATUS_TEXT.STOPPED
    const rawPort = payload.running_port ?? payload.runningPort ?? ''
    const runtime = normalizeServiceRuntime(rawStatus, rawPort)
    target.serviceStatus = runtime.status
    target.status = runtime.status
    target.runningPort = runtime.port
  }

  /** 根据项目检测接口结果更新项目健康状态。 */
  const updateProjectHealth = (projectId, payload = {}) => {
    const target = projects.value.find((item) => Number(item.id) === Number(projectId))
    if (!target) return
    const rawStatus = payload.service_status || payload.serviceStatus || target.serviceStatus || target.status || PROJECT_SERVICE_STATUS_TEXT.STOPPED
    const rawPort = payload.running_port ?? payload.runningPort ?? ''
    const runtime = normalizeServiceRuntime(rawStatus, rawPort)
    target.runningPort = runtime.port
    target.serviceStatus = runtime.status
    target.projectStatus = payload.project_status || payload.projectStatus || PROJECT_HEALTH_STATUS_TEXT.UNCHECKED
    target.projectStatusDetail = payload.project_status_detail || payload.projectStatusDetail || ''
    target.status = payload.status && payload.status !== PROJECT_SERVICE_STATUS_TEXT.RUNNING ? payload.status : runtime.status
  }

  /** 在项目列表顶部插入一条本地临时项目记录。 */
  const prependProject = (payload) => {
    projects.value.unshift({
      id: payload.id || 0,
      ownerId: payload.ownerId || 0,
      owner: payload.owner || currentUsername.value || '',
      name: payload.name || '',
      description: payload.description || '',
      serverId: payload.serverId || null,
      serverIp: payload.serverIp || '',
      backendPath: payload.backendPath || '',
      frontendPath: payload.frontendPath || '',
      nginxPath: payload.nginxPath || '',
      nginxServerIp: payload.nginxServerIp || '',
      frontendPort: payload.frontendPort || '',
      backendDevPort: payload.backendDevPort || '',
      backendDeployPort: payload.backendDeployPort || '',
      databaseName: payload.databaseName || '',
      databaseHost: payload.databaseHost || '',
      databasePort: payload.databasePort || '',
      databaseUser: payload.databaseUser || '',
      databasePassword: payload.databasePassword || '',
      condaEnvName: payload.condaEnvName || '',
      pythonVersion: payload.pythonVersion || '',
      devCommand: payload.devCommand || '',
      deployCommand: payload.deployCommand || '',
      entryFilePath: payload.entryFilePath || '',
      status: payload.status || PROJECT_WORKFLOW_STATUS_TEXT.CREATING,
      runningPort: payload.runningPort || '',
      serviceStatus: payload.serviceStatus || payload.status || PROJECT_SERVICE_STATUS_TEXT.STOPPED,
      projectStatus: payload.projectStatus || PROJECT_HEALTH_STATUS_TEXT.NORMAL,
      projectStatusDetail: payload.projectStatusDetail || '',
      nginxInfo: payload.nginxInfo || '',
      databaseInfo: payload.databaseInfo || '',
      createdAt: payload.createdAt || new Date().toISOString(),
    })
  }

  /** 从本地项目列表移除指定项目。 */
  const removeProject = (projectId) => {
    projects.value = projects.value.filter((item) => item.id !== projectId)
  }

  /** 从本地用户列表移除指定用户。 */
  const removeUser = (userId) => {
    users.value = users.value.filter((item) => item.id !== userId)
  }

  /** 从本地服务器列表移除指定服务器。 */
  const removeServer = (serverId) => {
    servers.value = servers.value.filter((item) => item.id !== serverId)
  }

  /** 在本地用户列表顶部插入新用户。 */
  const createUserLocal = (payload) => {
    users.value.unshift(mapUser(payload))
  }

  /** 重置项目管理 store 的全部运行态数据。 */
  const reset = () => {
    projects.value = []
    users.value = []
    envs.value = []
    servers.value = []
    currentProjectBasePath.value = ''
    projectRootBasePath.value = ''
    projectUserBasePathTemplate.value = ''
    busyProjectIds.value = []
    healthCheckingProjectIds.value = []
    serviceCheckingProjectIds.value = []
    loaded.value = false
  }

  return {
    loading,
    loaded,
    projects,
    users,
    envs,
    servers,
    currentUsername,
    currentRole,
    currentProjectBasePath,
    projectRootBasePath,
    projectUserBasePathTemplate,
    busyProjectIds,
    healthCheckingProjectIds,
    serviceCheckingProjectIds,
    canDeleteProject,
    memberFilterOptions,
    loadBundle,
    setProjectStatus,
    updateProjectSetting,
    updateProjectByName,
    setProjectBusy,
    isProjectBusy,
    setProjectHealthChecking,
    setProjectServiceChecking,
    isProjectHealthChecking,
    isProjectServiceChecking,
    updateProjectHealth,
    updateProjectServiceStatus,
    prependProject,
    removeProject,
    removeUser,
    removeServer,
    createUserLocal,
    reset,
  }
})
