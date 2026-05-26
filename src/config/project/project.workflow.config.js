/**
 * 项目流程配置。
 *
 * 作用：
 * - 集中维护创建、设置、同步、运行、删除范围等流程相关常量。
 * - Dashboard composable（组合函数）只引用流程语义，不直接维护固定文案和后端枚举值。
 */

/** 项目正在创建时的状态文案。 */
export const PROJECT_CREATING_TEXT = '创建中'

/** 项目正在设置时的状态文案。 */
export const PROJECT_SETTING_TEXT = '设置中'

/** 项目正在同步时的状态文案。 */
export const PROJECT_SYNCING_TEXT = '同步中'

/**
 * 项目异步任务执行中的状态集合。
 *
 * 作用：
 * - 列表操作按钮根据这些状态统一置灰。
 * - 新增“创建中 / 设置中 / 同步中”等流程状态时，只需要维护这里。
 */
export const PROJECT_BUSY_STATUS_TEXTS = [
  PROJECT_CREATING_TEXT,
  PROJECT_SETTING_TEXT,
  PROJECT_SYNCING_TEXT,
]

/**
 * 设置保存终端展示文案。
 *
 * 作用：
 * - 统一描述“设置弹框第 1-8 步”在右侧终端中的展示内容。
 * - useDashboardDialogs.js 只负责组装 payload（请求参数），不直接维护中文步骤文案。
 */
export const PROJECT_SETTING_TERMINAL_TEXT = {
  emptyValue: '空字符',
  modifyEnabled: '已开启修改',
  modifyDisabled: '未修改',
  modifyDisabledOrOnlyEnable: '未修改或仅启用',
  enabled: '启用',
  disabled: '不启用',
  condaCreate: '创建新环境',
  condaDropOriginal: '删除原环境',
  condaNoExtraAction: '无额外操作',
  dropOriginalNginx: '删除原配置',
  keepOrNoOriginalNginx: '保留或无原配置',
  dropOriginalDatabase: '删除原数据库',
  keepOrNoOriginalDatabase: '保留或无原数据库',
  entryPathRequired: '请先选择项目入口文件位置',
  saveSuccess: '设置保存成功',
  saveFailed: '设置保存失败',
  settingFailedPrefix: '设置失败',
  actualDiffTitle: '后端实际执行差异：',
  noActualDiff: '无实际变更',
  executingDiff: '后端正在按配置差异执行实际变更，请稍候...',
  finalSuccessStep: '项目设置保存成功',
  connectDoneSuffix: '已完成',
  runningSuffix: '进行中',
  stepPrefix: '步骤',
  pythonVersionLabel: 'Python版本',
  condaHandleLabel: 'Conda处理',
  originalNginxLabel: '原Nginx配置',
  originalDatabaseLabel: '原数据库',
  step6NginxTitle: 'Nginx配置',
  step7DatabaseTitle: '数据库配置',
}


/**
 * 设置保存终端动态文案工厂。
 *
 * 作用：
 * - 统一维护保存设置时包含动态字段的终端行。
 * - 让 Dashboard 组合函数只决定调用时机，不直接拼接中文标点和步骤文案。
 */
export const PROJECT_SETTING_TERMINAL_FACTORY = {
  lockProjectSetting(projectName) {
    return `保存项目设置 ${projectName} ${PROJECT_RUNTIME_TEXT.taskRunningSuffix}`
  },
  fieldLine(field, value, modifyText) {
    return `${PROJECT_SETTING_TERMINAL_TEXT.stepPrefix}${field.step} ${field.label}：${value}（${modifyText}）`
  },
  subFieldLine(label, value) {
    return `      ${label}：${value}`
  },
  statusLine(step, title, statusText, modifyText = '') {
    return modifyText
      ? `${PROJECT_SETTING_TERMINAL_TEXT.stepPrefix}${step} ${title}：${statusText}（${modifyText}）`
      : `${PROJECT_SETTING_TERMINAL_TEXT.stepPrefix}${step} ${title}：${statusText}`
  },
  connectStep(serverIp) {
    return `1.${PROJECT_RUNTIME_TEXT.connectTarget}：${serverIp}   ---> ${PROJECT_SETTING_TERMINAL_TEXT.connectDoneSuffix}`
  },
  saveStep(projectName, suffix) {
    return `2.开始保存项目设置：${projectName} ---> ${suffix}`
  },
  failed(message) {
    return `${PROJECT_SETTING_TERMINAL_TEXT.settingFailedPrefix}：${message}`
  },
  finalStep() {
    return `3.${PROJECT_SETTING_TERMINAL_TEXT.finalSuccessStep}`
  },
  runtimeTitle(projectName, title) {
    return `${title}?${projectName}`
  },
  appendHyphen(value) {
    return `    - ${value}`
  },
  indent(value) {
    return `  ${value}`
  },
}

/**
 * 设置保存终端展示字段定义。
 *
 * 字段说明：
 * - step：设置弹框步骤编号。
 * - label：终端展示字段名。
 * - payloadKey：从设置保存 payload 中读取的字段。
 * - modifyKey：从 settingForm 中读取“是否修改”的字段。
 */
export const PROJECT_SETTING_TERMINAL_FIELDS = [
  { step: 1, label: '项目描述', payloadKey: 'description', modifyKey: 'descriptionModifyEnabled' },
  { step: 2, label: 'Conda环境', payloadKey: 'conda_env_name', modifyKey: 'condaModifyEnabled' },
  { step: 3, label: '项目入口文件', payloadKey: 'entry_file_path', modifyKey: 'entryFilePathModifyEnabled' },
  { step: 4, label: '开发启动命令', payloadKey: 'dev_start_command', modifyKey: 'devCommandModifyEnabled' },
  { step: 5, label: '部署启动命令', payloadKey: 'deploy_start_command', modifyKey: 'deployCommandModifyEnabled' },
]

/**
 * Nginx 设置保存终端展示字段定义。
 *
 * 作用：
 * - 统一维护 Nginx 配置展开时每一行展示哪个 payload 字段。
 */
export const PROJECT_SETTING_NGINX_TERMINAL_FIELDS = [
  { label: 'Nginx服务器IP', payloadKey: 'nginx_server_ip' },
  { label: 'Nginx配置文件', payloadKey: 'nginx_conf_path' },
  { label: 'Nginx前端端口', payloadKey: 'frontend_port' },
  { label: '后端部署端口', payloadKey: 'backend_deploy_port' },
]

/**
 * 数据库设置保存终端展示字段定义。
 *
 * 作用：
 * - 统一维护数据库配置展开时每一行展示哪个 payload 字段。
 */
export const PROJECT_SETTING_DATABASE_TERMINAL_FIELDS = [
  { label: '数据库名称', payloadKey: 'database_name' },
  { label: '数据库地址', payloadKeys: ['database_host', 'database_port'], separator: ':' },
  { label: '数据库账号', payloadKey: 'database_user' },
]

/**
 * 项目运行操作终端与提示文案。
 *
 * 作用：
 * - 集中维护前台启动、后台启动、部署启动、停止服务等运行操作文案。
 * - Dashboard 组合函数只根据 action code（动作编码）选择操作，不直接写固定中文。
 */
export const PROJECT_RUNTIME_TEXT = {
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
  createForegroundSessionFailed: '无法创建前台启动终端会话',
  startCommandMissing: '暂无配置启动命令',
  foregroundRunnerMissing: '终端前台启动能力未初始化',
  foregroundCommandSent: '前台启动命令已发送，实际输出请查看右侧终端',
  projectBusy: '项目任务正在执行中，请等待后端实际返回后再操作',
  noForegroundServiceForSession: '当前会话没有绑定前台启动服务',
  deleteAction: '删除',
  deletedPrefix: '已',
  userProjectsMigratedSuffix: '，项目已迁移',
  userProjectsMigratedToRootSuffix: '，项目已迁移到 root 目录',
  userProjectsNotMigratedSuffix: '，未迁移项目',
  stoppingForeground(projectName) {
    return `正在停止 ${projectName}...`
  },
  userDeleteTerminal(alias, username, suffix) {
    return `[${this.session}:${alias}] ${this.deleteAction} ${username}${suffix}`
  },
  userDeleteSuccess(username, suffix) {
    return `${this.deletedPrefix}${this.deleteAction} ${username}${suffix}`
  },
}

/**
 * Dashboard 通用操作提示文案。
 *
 * 作用：
 * - 承接尚未拆到独立模块的用户、服务器、工具、健康检测等提示文案。
 * - 避免 Dashboard 组合函数继续散落固定中文字符串。
 */
export const DASHBOARD_OPERATION_TEXT = {
  prototypeCreatedSuffix: '创建成功（原型）',
  envLabel: '环境',
  serverIpRequired: '服务器IP不能为空',
  createServerSuccess: '创建服务器成功',
  createServerFailed: '创建服务器失败',
  usernameRequired: '请输入账号',
  passwordRequired: '请输入密码',
  createSuccess: '创建成功',
  createFailed: '创建失败',
  loadProjectDetailFailed: '加载项目详情失败',
  loadProjectLogFailed: '加载项目日志失败',
  copyProject: '复制项目',
  copyProjectSuccess: '复制项目成功',
  copyFailed: '复制失败',
  exportProject: '导出项目',
  exportProjectSuccess: '导出项目成功',
  exportFailed: '导出失败',
  projectNotFound: '未找到当前项目',
  toolTodo: '该工具暂未开发',
  deleteUserFailed: '删除用户失败',
  envViewPackages: '查看环境主包与版本',
  envActionTriggered: '环境操作已触发',
  projectHealthDefault: '检测完成',
  projectHealthCheckSuccessPrefix: '项目状态检测完成',
  projectHealthCheckFailed: '项目状态检测失败',
  serviceHealthCheckSuccessPrefix: '服务状态检测完成',
  serviceHealthCheckFailed: '服务状态检测失败',
  portLabel: '端口',
  copyTerminal(alias, projectName, targetServerIp, targetDir) {
    return `[${PROJECT_RUNTIME_TEXT.session}:${alias}] ${this.copyProject} ${projectName} 到 ${targetServerIp}:${targetDir}`
  },
  exportTerminal(alias, projectName, targetDir) {
    return `[${PROJECT_RUNTIME_TEXT.session}:${alias}] ${this.exportProject} ${projectName} 到本机目录 ${targetDir}`
  },
  projectHealthSuccess(statusText) {
    return `${this.projectHealthCheckSuccessPrefix}：${statusText}`
  },
  serviceHealthSuccess(statusText) {
    return `${this.serviceHealthCheckSuccessPrefix}：${statusText}`
  },
  serviceHealthRunning(port) {
    return `${this.serviceHealthCheckSuccessPrefix}：${PROJECT_RUNNING_TEXT}，${this.portLabel} ${port}`
  },
}

/** 项目创建成功时的状态文案。 */
export const PROJECT_CREATED_TEXT = '创建成功'

/** 项目创建失败时的状态文案。 */
export const PROJECT_CREATE_FAILED_TEXT = '创建失败'

/** 项目服务运行中的状态文案。 */
export const PROJECT_RUNNING_TEXT = '运行中'

/** 项目服务已停止的状态文案。 */
export const PROJECT_STOPPED_TEXT = '已停止'

/**
 * 删除项目弹框范围选项。
 *
 * 说明：
 * - 选项是否展示由项目当前是否配置数据库、Nginx 等资源决定。
 * - 后端会根据 value 执行对应删除范围。
 */
export const PROJECT_DELETE_SCOPE_OPTIONS = [
  { key: '1', value: 'project_only', label: '只删除该项目' },
  { key: '2', value: 'project_and_conda', label: '删除该项目和对应Conda环境' },
  { key: '3', value: 'project_conda_and_db', label: '删除该项目，Conda环境，数据库' },
  { key: '4', value: 'project_conda_nginx', label: '删除该项目，Conda环境，Nginx配置' },
  { key: '5', value: 'project_conda_db_nginx', label: '删除该项目，Conda环境，数据库，Nginx配置' },
]


/** Project delete dialog text. */
export const PROJECT_DELETE_DIALOG_TEXT = {
  riskContent: '该操作会不可逆，谨慎操作。',
  riskTitle: '删除风险提示',
  scopeTitle: '删除范围选择',
  chooseScope: '请选择删除范围',
  scopeHelp: '不同选项会影响项目目录、Conda环境和数据库。',
  confirm: '确认',
  cancel: '取消',
  deleteProjectFailed: '删除项目失败',
  terminalPrefix: '[会话:',
  terminalDeleteProject: '删除项目',
  terminalScopeLabel: '范围',
  terminalDeleteDone(alias, projectName, scopeLabel) {
    return `[${this.terminalPrefix}${alias}] ${this.terminalDeleteProject} ${projectName}（${this.terminalScopeLabel}：${scopeLabel}）`
  },
}
