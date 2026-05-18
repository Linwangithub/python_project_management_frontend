import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'

const joinParts = (parts, emptyText = '未配置') => {
  const values = parts.map((item) => String(item || '').trim()).filter(Boolean)
  return values.length ? values.join(' / ') : emptyText
}

const buildNginxInfo = (item) => {
  const nginxIp = item.nginx_server_ip || ''
  const frontendPort = item.frontend_port ? `前端:${item.frontend_port}` : ''
  const backendPort = item.backend_deploy_port ? `后端:${item.backend_deploy_port}` : ''
  return joinParts([nginxIp, frontendPort, backendPort])
}

const buildDatabaseInfo = (item) => {
  const host = item.database_host || ''
  const name = item.database_name ? `库:${item.database_name}` : ''
  return joinParts([host, name])
}

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
  status: item.status || item.service_status || '已停止',
  runningPort: item.running_port || '',
  serviceStatus: item.service_status || item.status || '已停止',
  projectStatus: item.project_status || '正常',
  projectStatusDetail: item.project_status_detail || '',
  nginxInfo: item.nginx_info || buildNginxInfo(item),
  databaseInfo: item.database_info || buildDatabaseInfo(item),
  createdAt: item.created_at || '',
  updatedAt: item.updated_at || '',
})

const mapUser = (item) => ({
  id: item.id,
  userid: item.userid,
  username: item.username,
  password: item.password,
  role: item.role,
  operator: item.operator,
  createdAt: item.created_at || '',
})

const mapEnv = (item) => ({
  id: item.id,
  envName: item.env_name,
  projectName: item.project_name || '',
  pythonVersion: item.python_version || '',
  mainPackages: item.main_packages || '',
  createdAt: item.created_at || '',
})

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
      return { ok: false, message: getErrorMessage(error, '加载数据失败') }
    } finally {
      loading.value = false
    }
  }

  const canDeleteProject = computed(() => projects.value.length > 0)
  const memberFilterOptions = computed(() => {
    const names = Array.from(new Set(users.value.map((x) => x.username)))
    return [{ label: '全部成员', value: 'all' }, ...names.map((x) => ({ label: x, value: x }))]
  })

  const setProjectStatus = (projectId, status) => {
    const target = projects.value.find((item) => item.id === projectId)
    if (!target) return
    target.status = status
  }

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

  const updateProjectByName = (name, payload = {}) => {
    const target = projects.value.find((item) => item.name === name)
    if (!target) return false
    Object.assign(target, payload)
    return true
  }

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

  const isProjectBusy = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return busyProjectIds.value.map((item) => Number(item)).includes(id)
  }

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

  const isProjectHealthChecking = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return healthCheckingProjectIds.value.map((item) => Number(item)).includes(id)
  }


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

  const isProjectServiceChecking = (projectId) => {
    const id = Number(projectId)
    if (!id) return false
    return serviceCheckingProjectIds.value.map((item) => Number(item)).includes(id)
  }

  const updateProjectServiceStatus = (projectId, payload = {}) => {
    const target = projects.value.find((item) => Number(item.id) === Number(projectId))
    if (!target) return
    const nextStatus = payload.service_status || payload.serviceStatus || payload.status || target.serviceStatus || target.status || '已停止'
    const nextPort = payload.running_port ?? payload.runningPort ?? ''
    target.serviceStatus = nextStatus
    target.status = nextStatus
    target.runningPort = String(nextStatus).trim() === '运行中' ? String(nextPort || '') : ''
  }

  const updateProjectHealth = (projectId, payload = {}) => {
    const target = projects.value.find((item) => Number(item.id) === Number(projectId))
    if (!target) return
    target.runningPort = payload.running_port || payload.runningPort || ''
    target.serviceStatus = payload.service_status || payload.serviceStatus || target.serviceStatus || target.status || '已停止'
    target.projectStatus = payload.project_status || payload.projectStatus || '未检测'
    target.projectStatusDetail = payload.project_status_detail || payload.projectStatusDetail || ''
    target.status = payload.status || target.serviceStatus || target.status
  }

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
      status: payload.status || '创建中',
      runningPort: payload.runningPort || '',
      serviceStatus: payload.serviceStatus || payload.status || '已停止',
      projectStatus: payload.projectStatus || '正常',
      projectStatusDetail: payload.projectStatusDetail || '',
      nginxInfo: payload.nginxInfo || '',
      databaseInfo: payload.databaseInfo || '',
      createdAt: payload.createdAt || new Date().toISOString(),
    })
  }

  const removeProject = (projectId) => {
    projects.value = projects.value.filter((item) => item.id !== projectId)
  }

  const removeUser = (userId) => {
    users.value = users.value.filter((item) => item.id !== userId)
  }

  const removeServer = (serverId) => {
    servers.value = servers.value.filter((item) => item.id !== serverId)
  }

  const createUserLocal = (payload) => {
    users.value.unshift(mapUser(payload))
  }

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
