import { request } from '@/utils/request'

export const projectApi = {
  listProjects(params = {}) {
    return request.get('/pspm/projects', { params })
  },
  listUsers(params = {}) {
    return request.get('/pspm/users', { params })
  },
  listEnvs(params = {}) {
    return request.get('/pspm/envs', { params })
  },
  listServers(params = {}) {
    return request.get('/pspm/servers', { params })
  },
  getProjectDetail(projectId) {
    return request.get('/pspm/projects/detail', { params: { project_id: projectId } })
  },
  listProjectLogs(projectId) {
    return request.get('/pspm/projects/logs', { params: { project_id: projectId } })
  },
  checkProjectHealth(projectId) {
    return request.get('/pspm/projects/health', { params: { project_id: projectId } })
  },
  createServer(payload) {
    return request.post('/pspm/servers/create', {
      alias: payload.alias || null,
      ip: payload.ip,
      root_password: payload.root_password || null,
      remark: payload.remark || null,
    })
  },
  deleteServer(ids) {
    return request.delete('/pspm/servers/delete', {
      params: { id: ids },
      paramsSerializer: { indexes: null },
    })
  },
  addServerUser(payload) {
    return request.post('/pspm/servers/users/create', {
      server_id: payload.server_id,
      username: payload.username,
    })
  },
  deleteServerUser(payload) {
    return request.post('/pspm/servers/users/delete', {
      server_id: payload.server_id,
      username: payload.username,
    })
  },
  createUser(payload) {
    return request.post('/pspm/users/create', payload)
  },
  checkProjectName(params) {
    return request.get('/pspm/projects/check-name', { params })
  },
  createProjectReal(payload) {
    return request.post('/pspm/projects/create-real', {
      ...payload,
      use_database: !!payload.use_database,
      database_name: payload.use_database ? (payload.database_name || '') : '',
      database_host: payload.use_database ? (payload.database_host || '') : '',
      database_port: payload.use_database ? payload.database_port : null,
      database_user: payload.use_database ? (payload.database_user || '') : '',
      database_password: payload.use_database ? (payload.database_password || '') : '',
      use_nginx: !!payload.use_nginx,
      nginx_server_ip: payload.use_nginx ? (payload.nginx_server_ip || '') : '',
      nginx_conf_path: payload.use_nginx ? (payload.nginx_conf_path || '') : '',
      frontend_port: payload.use_nginx ? (payload.frontend_port || '') : '',
      backend_deploy_port: payload.use_nginx ? (payload.backend_deploy_port || '') : '',
      nginx_config_text: payload.use_nginx ? (payload.nginx_config_text || '') : '',
    }, { timeout: 0 })
  },
  checkProjectDatabase(payload) {
    return request.post('/pspm/projects/check-database', {
      host: payload.host,
      port: Number(payload.port),
      username: payload.username,
      password: payload.password || '',
      database_name: payload.database_name || '',
    })
  },
  checkProjectNginx(payload) {
    return request.post('/pspm/projects/check-nginx', {
      server_ip: payload.server_ip,
      nginx_server_ip: payload.nginx_server_ip || payload.server_ip,
    })
  },
  checkProjectPort(payload) {
    return request.post('/pspm/projects/check-port', {
      project_id: Number(payload.project_id),
      port: Number(payload.port),
      check_nginx_conf: !!payload.check_nginx_conf,
      nginx_server_ip: payload.nginx_server_ip || '',
    })
  },
  listSyncProjectPathChildren(payload) {
    return request.post('/pspm/projects/sync/path-children', {
      server_ip: payload.server_ip || '',
      rel_path: payload.rel_path || '',
    })
  },
  listSyncEntryPathChildren(payload) {
    return request.post('/pspm/projects/sync/entry-path-children', {
      server_ip: payload.server_ip || '',
      backend_path: payload.backend_path || '',
      rel_path: payload.rel_path || '',
    })
  },
  listSyncCondaEnvs(payload) {
    return request.post('/pspm/projects/sync/conda-envs', {
      server_ip: payload.server_ip || '',
    })
  },
  checkSyncConda(payload) {
    return request.post('/pspm/projects/sync/check-conda', {
      server_ip: payload.server_ip || '',
      conda_env_name: payload.conda_env_name || '',
    })
  },
  checkSyncDatabase(payload) {
    return request.post('/pspm/projects/sync/check-database', {
      host: payload.host,
      port: Number(payload.port),
      username: payload.username,
      password: payload.password || '',
      database_name: payload.database_name || '',
    })
  },
  checkSyncNginxServerBlock(payload) {
    return request.post('/pspm/projects/sync/check-nginx-server-block', {
      server_ip: payload.server_ip || '',
      nginx_server_ip: payload.nginx_server_ip || '',
      nginx_conf_path: payload.nginx_conf_path || '',
      frontend_port: payload.frontend_port || '',
      backend_deploy_port: payload.backend_deploy_port || '',
    })
  },
  syncExistingProject(payload) {
    return request.post('/pspm/projects/sync', {
      ...payload,
      use_database: !!payload.use_database,
      database_name: payload.use_database ? (payload.database_name || '') : '',
      database_host: payload.use_database ? (payload.database_host || '') : '',
      database_port: payload.use_database ? payload.database_port : null,
      database_user: payload.use_database ? (payload.database_user || '') : '',
      database_password: payload.use_database ? (payload.database_password || '') : '',
      use_nginx: !!payload.use_nginx,
      nginx_server_ip: payload.use_nginx ? (payload.nginx_server_ip || '') : '',
      nginx_conf_path: payload.use_nginx ? (payload.nginx_conf_path || '') : '',
      frontend_port: payload.use_nginx ? (payload.frontend_port || '') : '',
      backend_deploy_port: payload.use_nginx ? (payload.backend_deploy_port || '') : '',
      nginx_config_text: payload.use_nginx ? (payload.nginx_config_text || '') : '',
    }, { timeout: 0 })
  },
  deleteUser(ids, transferProjects = true) {
    return request.delete('/pspm/users/delete', {
      params: { id: ids, transfer_projects: transferProjects },
      paramsSerializer: { indexes: null },
    })
  },
  updateProjectSetting(projectId, payload) {
    return request.put('/pspm/projects/setting', payload, {
      params: { project_id: projectId },
      timeout: 0,
    })
  },
  deleteOriginalProjectDatabase(projectId) {
    return request.delete('/pspm/projects/database/original', {
      params: { project_id: projectId },
    })
  },
  listProjectEntryPathChildren(projectId, relPath = '') {
    return request.get('/pspm/projects/entry-path-children', {
      params: {
        project_id: projectId,
        rel_path: relPath,
      },
    })
  },
  listProjectCondaEnvs(projectId) {
    return request.get('/pspm/projects/conda-envs', {
      params: { project_id: projectId },
    })
  },
  startForeground(projectId) {
    return request.put('/pspm/projects/start-foreground', null, { params: { project_id: projectId } })
  },
  startBackground(projectId) {
    return request.put('/pspm/projects/start-background', null, { params: { project_id: projectId } })
  },
  deployStart(projectId) {
    return request.put('/pspm/projects/deploy-start', null, { params: { project_id: projectId } })
  },
  stopProject(projectId) {
    return request.put('/pspm/projects/stop', null, { params: { project_id: projectId } })
  },
  copyProject(projectId, payload) {
    return request.post('/pspm/projects/copy', payload, { params: { project_id: projectId } })
  },
  exportProject(projectId, payload) {
    return request.post('/pspm/projects/export', payload, { params: { project_id: projectId } })
  },
  deleteProject(ids, deleteScope = 'project_only') {
    return request.delete('/pspm/projects/delete', {
      params: { id: ids, delete_scope: deleteScope },
      paramsSerializer: { indexes: null },
    })
  },
}
