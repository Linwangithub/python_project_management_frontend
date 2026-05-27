import { request } from '@/utils/request'

/**
 * 项目管理 API 适配器。
 *
 * 作用：
 * - 集中维护项目、用户、服务器、环境、同步、设置、运行、删除等 HTTP 接口。
 * - 负责把前端 camelCase/表单字段整理成后端需要的 snake_case 字段。
 * - 业务组件只调用语义化方法，不直接拼接接口地址。
 */
export const projectApi = {
  /** 查询项目列表。 */
  listProjects(params = {}) {
    return request.get('/pspm/projects', { params })
  },
  /** 查询项目管理页可选择的用户列表。 */
  listUsers(params = {}) {
    return request.get('/pspm/users', { params })
  },
  /** 查询项目管理页可选择的 Conda 环境列表。 */
  listEnvs(params = {}) {
    return request.get('/pspm/envs', { params })
  },
  /** 查询当前用户可管理或可使用的服务器列表。 */
  listServers(params = {}) {
    return request.get('/pspm/servers', { params })
  },
  /** 查询项目详情侧边栏数据。 */
  getProjectDetail(projectId) {
    return request.get('/pspm/projects/detail', { params: { project_id: projectId } })
  },
  /** 查询项目操作日志时间线。 */
  listProjectLogs(projectId) {
    return request.get('/pspm/projects/logs', { params: { project_id: projectId } })
  },
  /** 主动检测项目健康状态。 */
  checkProjectHealth(projectId) {
    return request.get('/pspm/projects/health', { params: { project_id: projectId } })
  },
  /** 轻量检测项目服务运行状态，只检查进程和监听端口。 */
  checkProjectServiceStatus(projectId) {
    return request.get('/pspm/projects/service-status', { params: { project_id: projectId } })
  },
  /** 创建服务器记录。 */
  createServer(payload) {
    return request.post('/pspm/servers/create', {
      alias: payload.alias || null,
      ip: payload.ip,
      root_password: payload.root_password || null,
      remark: payload.remark || null,
    })
  },
  /** 删除服务器记录。 */
  deleteServer(ids) {
    return request.delete('/pspm/servers/delete', {
      params: { id: ids },
      paramsSerializer: { indexes: null },
    })
  },
  /** 给服务器绑定可使用的普通用户。 */
  addServerUser(payload) {
    return request.post('/pspm/servers/users/create', {
      server_id: payload.server_id,
      username: payload.username,
    })
  },
  /** 删除服务器与用户的绑定关系。 */
  deleteServerUser(payload) {
    return request.post('/pspm/servers/users/delete', {
      server_id: payload.server_id,
      username: payload.username,
    })
  },
  /** 创建用户。 */
  createUser(payload) {
    return request.post('/pspm/users/create', payload)
  },
  /** 新建项目前检查项目名称是否可用。 */
  checkProjectName(params) {
    return request.get('/pspm/projects/check-name', { params })
  },
  /** 执行真实新建项目流程。 */
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
  /** 创建项目时检测数据库连接和数据库名可用性。 */
  checkProjectDatabase(payload) {
    return request.post('/pspm/projects/check-database', {
      host: payload.host,
      port: Number(payload.port),
      username: payload.username,
      password: payload.password || '',
      database_name: payload.database_name || '',
    })
  },
  /** 检测 Nginx 服务并读取配置清单。 */
  checkProjectNginx(payload) {
    return request.post('/pspm/projects/check-nginx', {
      server_ip: payload.server_ip,
      nginx_server_ip: payload.nginx_server_ip || payload.server_ip,
    })
  },
  /** 创建或设置阶段检测端口占用情况。 */
  checkProjectPort(payload) {
    return request.post('/pspm/projects/check-port', {
      project_id: Number(payload.project_id),
      port: Number(payload.port),
      check_nginx_conf: !!payload.check_nginx_conf,
      nginx_server_ip: payload.nginx_server_ip || '',
    })
  },
  /** 同步已有项目时浏览项目目录。 */
  listSyncProjectPathChildren(payload) {
    return request.post('/pspm/projects/sync/path-children', {
      server_ip: payload.server_ip || '',
      rel_path: payload.rel_path || '',
    })
  },
  /** 同步已有项目时浏览入口文件目录。 */
  listSyncEntryPathChildren(payload) {
    return request.post('/pspm/projects/sync/entry-path-children', {
      server_ip: payload.server_ip || '',
      backend_path: payload.backend_path || '',
      rel_path: payload.rel_path || '',
    })
  },
  /** 同步已有项目时查询服务器 Conda 环境列表。 */
  listSyncCondaEnvs(payload) {
    return request.post('/pspm/projects/sync/conda-envs', {
      server_ip: payload.server_ip || '',
    })
  },
  /** 同步已有项目时检测所选 Conda 环境的 Python 版本。 */
  checkSyncConda(payload) {
    return request.post('/pspm/projects/sync/check-conda', {
      server_ip: payload.server_ip || '',
      conda_env_name: payload.conda_env_name || '',
    })
  },
  /** 同步已有项目时检测数据库连接并列出数据库。 */
  checkSyncDatabase(payload) {
    return request.post('/pspm/projects/sync/check-database', {
      host: payload.host,
      port: Number(payload.port),
      username: payload.username,
      password: payload.password || '',
      database_name: payload.database_name || '',
    })
  },
  /** 同步已有项目时检测 Nginx server block 是否匹配。 */
  checkSyncNginxServerBlock(payload) {
    return request.post('/pspm/projects/sync/check-nginx-server-block', {
      server_ip: payload.server_ip || '',
      nginx_server_ip: payload.nginx_server_ip || '',
      nginx_conf_path: payload.nginx_conf_path || '',
      frontend_port: payload.frontend_port || '',
      backend_deploy_port: payload.backend_deploy_port || '',
    })
  },
  /** 同步已有项目时读取 Nginx listen 端口和 proxy_pass 端口选项。 */
  listSyncNginxServerPortOptions(payload) {
    return request.post('/pspm/projects/sync/nginx-server-port-options', {
      server_ip: payload.server_ip || '',
      nginx_server_ip: payload.nginx_server_ip || '',
      nginx_conf_path: payload.nginx_conf_path || '',
    })
  },
  /** 执行同步已有项目流程。 */
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
  /** 删除用户，可选择是否迁移该用户项目。 */
  deleteUser(ids, transferProjects = true) {
    return request.delete('/pspm/users/delete', {
      params: { id: ids, transfer_projects: transferProjects },
      paramsSerializer: { indexes: null },
    })
  },
  /** 保存项目设置，后端会按配置差异执行实际变更。 */
  updateProjectSetting(projectId, payload) {
    return request.put('/pspm/projects/setting', payload, {
      params: { project_id: projectId },
      timeout: 0,
    })
  },
  /** 删除项目原数据库。 */
  deleteOriginalProjectDatabase(projectId) {
    return request.delete('/pspm/projects/database/original', {
      params: { project_id: projectId },
    })
  },
  /** 设置项目入口文件时浏览项目目录。 */
  listProjectEntryPathChildren(projectId, relPath = '') {
    return request.get('/pspm/projects/entry-path-children', {
      params: {
        project_id: projectId,
        rel_path: relPath,
      },
    })
  },
  /** 设置项目时查询当前服务器 Conda 环境列表。 */
  listProjectCondaEnvs(projectId) {
    return request.get('/pspm/projects/conda-envs', {
      params: { project_id: projectId },
    })
  },
  /** 前台启动前准备终端执行命令所需信息。 */
  prepareStartForeground(projectId) {
    return request.get('/pspm/projects/start-foreground/prepare', { params: { project_id: projectId } })
  },
  /** 前台启动完成后写回运行态。 */
  finalizeStartForeground(payload) {
    return request.put('/pspm/projects/start-foreground/finalize', payload)
  },
  /** 旧版前台启动接口，当前优先走 WebSocket 终端流程。 */
  startForeground(projectId) {
    return request.put('/pspm/projects/start-foreground', null, { params: { project_id: projectId } })
  },
  /** 后台启动项目服务。 */
  startBackground(projectId) {
    return request.put('/pspm/projects/start-background', null, { params: { project_id: projectId } })
  },
  /** 使用部署启动命令启动项目服务。 */
  deployStart(projectId) {
    return request.put('/pspm/projects/deploy-start', null, { params: { project_id: projectId } })
  },
  /** 停止项目服务。 */
  stopProject(projectId) {
    return request.put('/pspm/projects/stop', null, { params: { project_id: projectId } })
  },
  /** 复制项目配置。 */
  copyProject(projectId, payload) {
    return request.post('/pspm/projects/copy', payload, { params: { project_id: projectId } })
  },
  /** 导出项目配置。 */
  exportProject(projectId, payload) {
    return request.post('/pspm/projects/export', payload, { params: { project_id: projectId } })
  },
  /** 删除项目及所选关联资源。 */
  deleteProject(ids, deleteScope = 'project_only') {
    return request.delete('/pspm/projects/delete', {
      params: { id: ids, delete_scope: deleteScope },
      paramsSerializer: { indexes: null },
    })
  },
}
