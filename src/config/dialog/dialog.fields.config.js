export const createProjectDialogFieldsConfig = [
  { key: 'serverIp', label: '服务器IP', component: 'select', placeholder: '请选择服务器IP', options: [], span: 24 },
  { key: 'name', label: '项目名称', component: 'input', placeholder: '请输入项目名称', span: 12 },
  { key: 'pythonVersion', label: 'Python版本', component: 'input', placeholder: '如3.10', span: 12 },
  { key: 'description', label: '项目描述', component: 'textarea', placeholder: '请输入项目描述', rows: 2, span: 24 },
  { key: 'path', label: '项目位置', component: 'input', placeholder: '根据项目名称自动生成', disabled: true, span: 12 },
  { key: 'condaName', label: 'Conda环境', component: 'input', disabled: true, placeholder: '与项目名称一致', span: 12 },
  { key: 'enableDatabase', label: '数据库配置', component: 'switch', activeText: '启用', inactiveText: '不启用', span: 24 },
  { key: 'databaseName', label: '数据库名(与项目同名)', component: 'input', disabled: true, placeholder: '与项目名称一致', span: 12 },
  { key: 'databaseHost', label: '数据库IP', component: 'selectCreate', placeholder: '可选择或手动输入数据库IP', options: [], span: 12 },
  { key: 'databasePort', label: '数据库端口', component: 'input', placeholder: '默认3306', span: 12 },
  { key: 'databaseUser', label: '数据库账号', component: 'input', placeholder: '默认root', span: 12 },
  { key: 'databasePassword', label: '数据库密码', component: 'password', placeholder: '请输入数据库密码', span: 12 },
  { key: 'databaseCheck', label: '连接测试', component: 'button', buttonText: 'Check', span: 12 },
  { key: 'enableNginx', label: 'Nginx配置', component: 'switch', activeText: '启用', inactiveText: '不启用', span: 24 },
  { key: 'nginxServerIp', label: 'Nginx服务器IP', component: 'selectCreate', placeholder: '请选择或输入Nginx服务器IP', options: [], span: 12 },
  { key: 'nginxCheck', label: 'Nginx可用性', component: 'button', buttonText: '检测Nginx', span: 12 },
  { key: 'nginxConfPath', label: 'Nginx配置文件路径', component: 'selectOrCreateNginxConf', placeholder: '请选择已有配置文件，或输入新配置文件路径', options: [], span: 24 },
]

export const createUserDialogFieldsConfig = [
  { key: 'username', label: '账号', component: 'input', placeholder: '如zhangsan', span: 24 },
  { key: 'password', label: '密码', component: 'input', placeholder: '如123456', span: 24 },
]

export const createEnvDialogFieldsConfig = [
  { key: 'name', label: '环境名称', component: 'input', span: 12 },
  { key: 'pythonVersion', label: 'Python版本', component: 'select', options: ['3.11', '3.10'], span: 12 },
  { key: 'description', label: '描述', component: 'textarea', rows: 2, span: 24 },
]

export const createServerDialogFieldsConfig = [
  { key: 'ip', label: '服务器IP', component: 'input', span: 12 },
  { key: 'rootPassword', label: 'root密码', component: 'input', span: 12 },
  { key: 'remark', label: '备注', component: 'textarea', rows: 2, span: 24 },
]

export const settingDialogFieldsConfig = [
  { key: 'projectName', label: '项目', component: 'input', disabled: true, gridClass: 'full' },
  { key: 'entryFilePath', label: '项目入口文件位置', component: 'entryPathCascader', placeholder: '请选择入口文件', gridClass: 'full' },
  { key: 'backendDevPort', label: '后端开发端口', component: 'input', gridClass: 'short' },
  { key: 'devCommand', label: '开发启动命令', component: 'textarea', rows: 3, gridClass: 'long' },
  { key: 'backendDeployPort', label: '后端部署端口', component: 'input', gridClass: 'short' },
  { key: 'deployCommand', label: '部署启动命令', component: 'textarea', rows: 3, gridClass: 'long' },
  { key: 'frontendPort', label: 'Nginx前端端口', component: 'input', gridClass: 'short' },
  { key: 'remark', label: '备注', component: 'input', gridClass: 'full' },
]

export const copyDialogFieldsConfig = [
  { key: 'projectName', label: '项目', component: 'input', disabled: true },
  { key: 'targetServerIp', label: '目标服务器IP', component: 'input' },
  { key: 'targetDir', label: '目标目录', component: 'input' },
]

export const exportDialogFieldsConfig = [
  { key: 'projectName', label: '项目', component: 'input', disabled: true },
  { key: 'targetDir', label: '导出到本机目录', component: 'input' },
]

export const createSessionDialogFieldsConfig = [
  { key: 'serverIp', label: '服务器IP', component: 'select', placeholder: '请选择服务器IP' },
  { key: 'alias', label: '会话别名', component: 'input', placeholder: '如srv' },
]

export const addServerUserDialogFieldsConfig = [
  { key: 'username', label: '用户名', component: 'input', placeholder: '如alice', span: 24 },
]

export const deleteServerUserDialogFieldsConfig = [
  { key: 'username', label: '用户名', component: 'select', placeholder: '请选择要删除的用户', span: 24, options: [] },
]
