/**
 * 项目弹框文案配置。
 *
 * 作用：
 * - 集中维护创建项目、同步项目、设置项目弹框中的字段名、占位符和提示文案。
 * - 组合函数只负责流程编排和接口调用，不直接散落固定中文字符串。
 */

/** 创建、同步、设置流程共用字段文案。 */
export const projectDialogCommonText = {
  serverIp: '服务器IP',
  projectName: '项目名称',
  projectDescription: '项目描述',
  condaEnv: 'Conda环境',
  pythonVersion: 'Python版本',
  nginxConfig: 'Nginx配置',
  nginxServerIp: 'Nginx服务器IP',
  nginxServiceCheck: '检测Nginx服务',
  nginxConfPath: 'Nginx配置文件路径',
  nginxFrontendPort: 'Nginx前端端口',
  backendDeployPort: '后端部署端口',
  databaseConfig: '数据库配置',
  databaseIp: '数据库IP',
  databasePort: '数据库端口',
  databaseUser: '数据库账号',
  databasePassword: '数据库密码',
  databaseConnectionTest: '连接测试',
  databaseName: '数据库名称',
  enable: '启用',
  disable: '不启用',
  check: 'Check',
  checkPassed: '已通过',
  nginxCheckButton: '检测Nginx',
  databaseConnected: '连接已通过',
  previewDetail: '预览详细配置',
  hint: '提示',
}

/** 创建项目弹框字段文案。 */
export const createProjectDialogText = {
  projectLocation: '项目位置',
  databaseNameSameAsProject: '数据库名称(与项目同名)',
  nginxPreviewConfirmed: '已确认详细配置',
}

/** 创建项目弹框占位符文案。 */
export const createProjectPlaceholders = {
  chooseServerIp: '请选择服务器IP',
  projectName: '请输入项目名称',
  pythonVersion: '例如3.10',
  projectDescription: '请输入项目描述',
  sameAsProjectName: '默认与项目名称一致',
  chooseNginxServerIp: '请选择Nginx服务器IP',
  nginxFrontendPort: '例如 8080',
  backendDeployPort: '例如 8000',
  databaseIp: '可选择或手动输入数据库IP',
  databasePort: '例如 3306',
  databaseUser: '例如 root',
  databasePassword: '请输入数据库密码',
}

/** 创建项目弹框提示文案。 */
export const createProjectMessages = {
  projectNameExists: '项目名称已存在，请更换名称',
  projectNameCheckFailed: '项目名称检查失败',
  requiredSuffix: '不能为空',
  nginxServerIpRequired: 'Nginx服务器IP不能为空',
  nginxCheckRequired: '请先检测Nginx服务',
  nginxConfRequired: '请选择已有Nginx配置文件，或新建一个 .conf 配置文件',
  nginxSameServerPortConflict: '服务器IP和Nginx服务器IP相同时，Nginx前端端口和后端部署端口不能相同',
  nginxPortCheckRequired: '请先完成Nginx前端端口和后端部署端口校验',
  nginxPreviewConfirmRequired: '请先确认Nginx详细配置',
  nginxExistingAndNewConflict: '已有配置文件和新建配置文件只能二选一',
  nginxConfPathMustAbsolute: 'Nginx配置文件路径必须是绝对路径',
  nginxBaseDirRequired: '请选择Nginx固定目录前缀',
  nginxDirRequired: '请选择Nginx配置目录',
  nginxFileNameRequired: '请输入Nginx配置文件名',
  nginxFileNameInvalid: 'Nginx配置文件名必须以 .conf 结尾，且不能包含路径分隔符',
  databaseHostRequired: '数据库IP不能为空',
  databasePortInvalid: '数据库端口不合法',
  databaseUserRequired: '数据库账号不能为空',
  databaseConnectSuccessCanCreate: '连接成功，该数据库不存在，可以创建使用',
  databaseExistsChangeProjectName: '连接成功，但该数据库已经存在，不可创建，请更改项目名称',
  databaseConnectFailed: '连接失败',
  serverIpChooseFirst: '请先选择服务器IP',
  nginxServerIpChoose: '请选择Nginx服务器IP',
  nginxConfMissing: '未获取到Nginx配置文件',
  nginxServiceAvailable: 'Nginx服务可用',
  nginxServiceUnavailable: 'Nginx服务不可用',
  nginxConfChooseFirst: '请先选择Nginx配置文件',
  createSessionFailed: '创建会话失败',
  refreshProjectListFailed: '创建项目后刷新项目列表失败',
  projectCreateSuccess: '项目创建成功',
  projectCreateFailed: '项目创建失败',
  createFailedPrefix: '创建失败',
  nginxAvailabilityCheckFailed: 'nginx可用性检查未通过',
  databaseConnectionCheckFailed: '数据库连接检查未通过',
  duplicateCheckFailed: '项目重名检查失败',
  unknownError: 'unknown',
  nginxConfigRequired: 'Nginx详细配置不能为空',
}

/** 创建项目弹框静态提示块文案。 */
export const createProjectHintText = {
  nginxChecked: '已检测到Nginx服务，请选择已有 .conf 文件，或在允许目录中新建 .conf 配置文件',
  nginxUnchecked: '启用Nginx配置后，请先选择Nginx服务器IP并完成检测',
}

/** 创建项目必填字段配置。 */
export const CREATE_PROJECT_REQUIRED_FIELDS = [
  { key: 'serverIp', labelKey: 'serverIp' },
  { key: 'name', labelKey: 'projectName' },
  { key: 'pythonVersion', labelKey: 'pythonVersion' },
  { key: 'description', labelKey: 'projectDescription' },
  { key: 'path', labelText: '项目位置' },
  { key: 'condaName', labelKey: 'condaEnv' },
]

/** 构造带动态数据的创建项目文案。 */
export const createProjectMessageFactory = {
  portRange(label, min, max) {
    return `${label}需在 ${min}-${max} 范围内`
  },
  portAvailable(label) {
    return `${label}可用`
  },
  portCheckFailed(label) {
    return `${label}校验失败`
  },
  required(label) {
    return `${label}${createProjectMessages.requiredSuffix}`
  },
  nginxListenRequired(port) {
    return `Nginx详细配置必须包含 listen ${port}`
  },
  nginxProxyPassRequired(port) {
    return `Nginx详细配置必须包含 proxy_pass 后端端口 ${port}`
  },
  newConfSelectedDir(dir) {
    return `${createProjectDialogComponentText.newConfSelectedDirPrefix}：${dir}`
  },
  newConfFinalPath(path) {
    return `${createProjectDialogComponentText.newConfFinalPathPrefix}：${path}`
  },
}

/** 创建项目弹框组件模板文案。 */
export const createProjectDialogComponentText = {
  title: '新建项目',
  nginxLoading: '正在加载Nginx配置文件...',
  useExistingConfTitle: '使用已有配置文件',
  chooseExistingConfPlaceholder: '请选择已有Nginx配置文件',
  existingConfTip: '请选择一个已有配置文件路径',
  existingDisabledByNewTip: '右侧已填写内容，当前区域已置灰并清空不可继续编辑',
  createNewConfTitle: '新建配置文件',
  chooseNginxDirPlaceholder: '请选择Nginx配置目录',
  selectedLabel: '已选择：',
  confFileNamePlaceholder: '请输入配置文件名，例如 pspm-project.conf',
  switchActiveDefault: '开',
  switchInactiveDefault: '关',
  buttonDefault: '按钮',
  previewDetail: '预览详细配置',
  nginxPreviewTitle: 'Nginx详细配置',
  nginxPreviewPlaceholder: '请确认或调整Nginx server配置',
  cancel: '取消',
  confirm: '确认',
  confirmCreate: '确认创建',
  newConfEmptyTip: '右侧用于创建新的 .conf 配置文件；与左侧已有配置文件二选一。',
  newConfDirRequiredTip: '请先选择配置目录。',
  newConfSelectedDirPrefix: '已选择目录',
  newConfInvalidFileTip: '文件名必须以 .conf 结尾，且不能包含 / 或 \\。',
  newConfFinalPathPrefix: '最终路径',
}

/** 创建项目 Nginx 配置来源标签。 */
export const createProjectNginxOptionText = {
  main: '主配置',
  top: '顶层include',
  http: 'http include',
  include: 'include',
  includeRuleSuffix: '规则',
}

/** 创建项目右侧终端步骤文案。 */
export const createProjectTerminalText = {
  taskRunningSuffix: '中，请稍候',
  connectTargetServer: '连接目标服务器',
  done: '已完成',
  running: '进行中',
  startCreateProjectDir: '开始创建项目目录',
  executeCommand: '执行命令',
  createCondaEnv: '创建Conda环境',
  checkCondaEnv: '检查Conda环境',
  createDatabase: '创建数据库',
  writeNginxConfig: '写入Nginx配置',
  nginxServerIp: 'Nginx服务器IP',
  useNginxFrontendPort: '使用Nginx前端端口',
  useBackendDeployPort: '使用后端部署端口',
}

/** 构造创建项目终端动态文案。 */
export const createProjectTerminalFactory = {
  lock(projectName) {
    return `创建项目 ${projectName} ${createProjectTerminalText.taskRunningSuffix}`
  },
  stepConnect(serverIp) {
    return `1.${createProjectTerminalText.connectTargetServer}：${serverIp}   ---> ${createProjectTerminalText.done}`
  },
  stepStartCreateDir(targetDir) {
    return `2.${createProjectTerminalText.startCreateProjectDir}：${targetDir}`
  },
  commandDone(command) {
    return `  ${createProjectTerminalText.executeCommand}：${command} ---> ${createProjectTerminalText.done}`
  },
  commandRunning(command) {
    return `  ${createProjectTerminalText.executeCommand}：${command} ---> ${createProjectTerminalText.running}`
  },
  createConda(condaName, pythonVersion) {
    return `3.${createProjectTerminalText.createCondaEnv}：${condaName} (python=${pythonVersion}) ---> ${createProjectTerminalText.running}`
  },
  checkConda(stepNo) {
    return `${stepNo}.${createProjectTerminalText.checkCondaEnv}：`
  },
  createDatabase(stepNo, databaseName) {
    return `${stepNo}.${createProjectTerminalText.createDatabase}：${databaseName} ---> ${createProjectTerminalText.running}`
  },
  createDatabaseDone(databaseName) {
    return `  ${createProjectTerminalText.createDatabase} ${databaseName} ---> ${createProjectTerminalText.done}`
  },
  writeNginx(stepNo, nginxConfPath) {
    return `${stepNo}.${createProjectTerminalText.writeNginxConfig}：${nginxConfPath} ---> ${createProjectTerminalText.running}`
  },
  nginxServerIp(nginxServerIp) {
    return `  ${createProjectTerminalText.nginxServerIp}：${nginxServerIp}`
  },
  nginxFrontendPort(frontendPort) {
    return `  ${createProjectTerminalText.useNginxFrontendPort}：${frontendPort}`
  },
  backendDeployPort(backendPort) {
    return `  ${createProjectTerminalText.useBackendDeployPort}：${backendPort}`
  },
  writeNginxDone() {
    return `  ${createProjectTerminalText.writeNginxConfig} ---> ${createProjectTerminalText.done}`
  },
  createProjectSuccess(stepNo) {
    return `${stepNo}.${createProjectMessages.projectCreateSuccess}`
  },
  createFailed(reason) {
    return `${createProjectMessages.createFailedPrefix}：${reason}`
  },
  createFailedDirectoryExists(targetDir) {
    return `${createProjectMessages.createFailedPrefix}：目录 ${targetDir} 已存在`
  },
  createFailedDuplicateCheck(message) {
    return `${createProjectMessages.createFailedPrefix}：${createProjectMessages.duplicateCheckFailed} - ${message}`
  },
}

/** 同步项目弹框字段文案。 */
export const syncProjectDialogText = {
  projectDirPrefix: '项目目录前缀',
  selectProjectDir: '选择项目目录',
  selectEntryFile: '选择具体入口文件位置',
  selectedProjectDir: '已选择项目目录',
  selectedEntryFile: '已选择入口文件位置',
  condaPythonCheck: '检测该Conda环境中的Python版本',
  condaPythonChecked: '已检测',
  condaPythonCheckButton: '检测Python版本',
}

/** 同步已有项目弹框组件模板文案。 */
export const syncProjectDialogComponentText = {
  title: '同步已有项目',
  nginxLoading: '正在加载Nginx配置文件...',
  chooseExistingConfPlaceholder: '请选择已有Nginx配置文件',
  existingConfOnlyTip: '同步已有项目只选择已存在的Nginx配置文件，不新建配置文件。',
  switchActiveDefault: '启用',
  switchInactiveDefault: '不启用',
  buttonDefault: '检测',
  cancel: '取消',
  confirmSync: '确认同步',
  selectedConf(confPath) {
    return `已选择：${confPath}`
  },
}

/** 同步项目弹框占位符文案。 */
export const syncProjectPlaceholders = {
  chooseServerIp: '请选择服务器IP',
  projectDirLoading: '项目目录加载中...',
  chooseExistingProjectDir: '请选择已存在项目目录',
  projectDirLoadFailedOrNotLoaded: '服务器项目目录加载失败或未加载',
  chooseServerFirst: '请先选择服务器IP',
  chooseEntryFile: '请选择入口文件',
  chooseProjectDirFirst: '请先选择项目目录',
  projectDescription: '请输入项目描述',
  chooseExistingCondaEnv: '请选择已有Conda环境',
  chooseNginxServerIp: '请选择Nginx服务器IP',
  chooseExistingListenPort: '请选择已有listen端口',
  chooseNginxConfFirst: '请先选择Nginx配置文件',
  backendPortAutoFill: '选择前端端口后自动回显',
  databaseIp: '可选择或手动输入数据库IP',
  databasePort: '例如 3306',
  databaseUser: '例如 root',
  databasePassword: '请输入数据库密码',
  chooseExistingDatabase: '请选择已存在数据库',
}

/** 同步项目弹框提示文案。 */
export const syncProjectMessages = {
  serverProjectDirsLoaded: '服务器连接正常，已加载项目目录',
  serverProjectDirsLoadFailed: '服务器不可用或项目目录读取失败',
  loadDirectoryFailed: '加载目录失败',
  loadEntryFilesFailed: '加载入口文件失败',
  condaEnvQueryFailed: '查询Conda环境失败',
  serverAndCondaRequired: '请选择服务器IP和Conda环境',
  condaEnvAvailable: 'Conda环境可用',
  condaEnvUnavailable: 'Conda环境不可用',
  databaseHostAndUserRequired: '请填写数据库IP和账号',
  databaseConnectSuccessChooseDatabase: '连接成功，请选择要同步的数据库',
  databaseConnectSuccessNoDatabase: '连接成功，但当前账号没有可选择的业务数据库',
  databaseConnectFailed: '连接失败',
  serverAndNginxRequired: '请选择服务器IP和Nginx服务器IP',
  nginxServiceAvailable: 'Nginx服务可用',
  nginxServiceUnavailable: 'Nginx服务不可用',
  nginxNoPortOptions: '所选Nginx配置文件中没有可同步的端口配置',
  nginxPortOptionsLoaded: '已加载已有Nginx端口配置',
  nginxPortOptionsLoadFailed: '加载Nginx端口配置失败',
  nginxSameServerPortConflict: '服务器IP和Nginx服务器IP相同时，Nginx前端端口和后端部署端口不能相同',
  nginxMatched: '已找到匹配的Nginx配置',
  nginxNotMatched: '未找到匹配的Nginx配置',
  serverIpRequired: '请选择服务器IP',
  projectDirRequired: '请选择项目目录',
  entryFileRequired: '请选择具体入口文件位置',
  projectNameRequired: '请填写项目名称',
  nginxCheckRequired: '请先检测Nginx服务',
  nginxConfRequired: '请选择Nginx配置文件',
  nginxFrontendPortRequired: '请选择已有Nginx前端端口',
  nginxBackendPortNotFound: '未找到该前端端口对应的后端部署端口',
  databaseNameRequired: '请选择数据库名称',
  syncSuccess: '同步成功',
  syncFailed: '同步项目失败',
}

/** 构造带动态数据的同步项目文案。 */
export const syncProjectMessageFactory = {
  databasePortInvalid(min, max) {
    return `数据库端口不合法（${min}-${max}）`
  },
  databaseOptionsLoaded(message, count) {
    return `${message}，共 ${count} 个可选数据库`
  },
  nginxPortOption(frontendPort, backendPort) {
    return `${frontendPort || ''} → ${backendPort || ''}`
  },
}


/**
 * 创建项目执行日志过滤规则。
 *
 * 作用：
 * - 从后端返回的执行日志中筛选数据库与 Nginx 相关摘要。
 * - 过滤规则集中维护，避免创建流程中散落中文正则。
 */
export const createProjectLogFilters = {
  databaseInclude: /MySQL|数据库|CREATE DATABASE|utf8mb4|SCHEMA|可用性|已存在/,
  nginxInclude: /Nginx|nginx|配置|server块|重载|reload|listen|proxy_pass/i,
  nginxExclude: /unknown directive|创建失败/i,
}
