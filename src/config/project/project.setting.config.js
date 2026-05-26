/**
 * 项目设置弹框常量。
 *
 * 作用：
 * - 集中维护步骤标题、端口范围、数据库默认值和固定文案。
 * - 避免设置弹框模板中散落硬编码字符串。
 */

/** 级联选择器中代表根目录的内部值。 */
export const ROOT_PATH_VALUE = '__root__'

/** 设置步骤条每行展示列数。 */
export const STEP_COLS = 4

/**
 * 重新导出项目表单默认值。
 *
 * 来源：
 * - `src/config/project/project.form.defaults.config.js`
 *
 * 作用：
 * - 保持旧调用方 import 路径兼容，同时避免本文件重复维护默认端口和数据库默认值。
 */
export {
  DB_PORT_MAX,
  DB_PORT_MIN,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  PORT_MAX,
  PORT_MIN,
} from '@/config/project/project.form.defaults.config'

/** 设置流程步骤定义，顺序必须与后端差异执行顺序保持一致。 */
export const settingSteps = [
  { key: 'description', title: '项目描述' },
  { key: 'conda', title: 'Conda环境' },
  { key: 'entry', title: '入口文件' },
  { key: 'devCommand', title: '开发命令' },
  { key: 'deployCommand', title: '部署命令' },
  { key: 'nginx', title: 'Nginx配置' },
  { key: 'database', title: '数据库' },
  { key: 'summary', title: '确认设置' },
]

/** 设置弹框中复用的中文文案。 */

export const settingText = {
  dialogTitle: '项目设置',
  workflowAriaLabel: '设置流程',
  projectName: '项目名称',
  projectDescription: '项目描述',
  modifyDescription: '是否修改项目描述',
  inputProjectDescription: '请输入项目描述',
  condaEnv: 'Conda环境',
  modifyCondaEnv: '是否修改Conda环境',
  chooseOrInputCondaEnv: '请选择或输入Conda环境名称',
  entryFilePath: '项目入口文件位置',
  modifyEntryFile: '是否修改项目入口文件',
  chooseEntryFile: '请选择项目入口文件',
  devCommand: '开发启动命令',
  modifyDevCommand: '是否修改开发启动命令',
  devCommandPlaceholder: '例如：python main.py 或 python manage.py runserver 0.0.0.0:8000',
  deployCommand: '部署启动命令',
  modifyDeployCommand: '是否修改部署启动命令',
  deployCommandPlaceholder: '例如：gunicorn main:app --bind 0.0.0.0:{{port}}',
  enableDatabaseConfig: '是否启用数据库配置',
  modifyDatabaseInfo: '是否修改数据库信息',
  databaseConfig: '数据库配置',
  databaseName: '数据库名称',
  databaseNamePlaceholder: '例如 my_project',
  databaseIp: '数据库IP',
  databaseIpPlaceholder: '可选择或手动输入数据库IP',
  databasePort: '数据库端口',
  databasePortPlaceholder: '例如 3306',
  databaseUser: '数据库账号',
  databaseUserPlaceholder: '例如 root',
  databasePassword: '数据库密码',
  databasePasswordPlaceholder: '请输入数据库密码',
  databaseConnectionTest: '连接测试',
  databaseAddress: '数据库地址',
  nginxConfig: 'Nginx配置',
  usedNginxIp: '使用的Nginx IP地址',
  usedNginxConfPath: '使用的Nginx配置文件地址',
  usedNginxFrontendPort: '使用Nginx前端端口',
  nginxDetailPreview: 'Nginx详细配置预览',
  nginxDetailConfigInfo: '配置详细配置信息',
  nginxFrontendPortLabel: 'Nginx前端端口',
  backendDevPort: '后端开发端口',
  pythonVersionPlaceholder: '例如 3.10',
  newConfEmptyTip: '右侧用于创建新的 .conf 配置文件；与左侧已有配置文件二选一。',
  newConfDirRequiredTip: '请先选择配置目录。',
  newConfInvalidFileTip: '文件名必须以 .conf 结尾，且不能包含 / 或 \。',
  notSet: '未设置',
  notConfigured: '未配置',
  notFetched: '未获取',
  notFilled: '未填写',
  configured: '已配置',
  check: 'Check',
  stepPrefix: '步骤',
  reset: '重新设置',
  prevStep: '上一步',
  nextStep: '下一步',
  projectDirFallback: '项目目录/',
  enableNginxConfig: '是否启用Nginx配置',
  enabled: '启用',
  disabled: '不启用',
  modifyNginxConfig: '是否修改Nginx配置信息',
  modify: '修改',
  onlyView: '不修改',
  nginxServerIp: 'Nginx服务器IP',
  chooseNginxServerIp: '请选择Nginx服务器IP',
  checkNginxService: '检测Nginx服务',
  checkNginx: '检测',
  passed: '已通过',
  nginxConfPath: 'Nginx配置文件路径',
  loadingNginxConf: '正在加载Nginx配置文件...',
  useExistingConf: '使用已有配置文件',
  chooseExistingConf: '请选择已有Nginx配置文件',
  chooseExistingTip: '请选择一个已有配置文件路径',
  existingDisabledTip: '右侧已填写内容，当前区域已置灰并清空不可继续编辑',
  createNewConf: '新建配置文件',
  chooseNginxDir: '请选择Nginx配置目录',
  selected: '已选择：',
  inputConfFileName: '请输入配置文件名，例如 pspm-project.conf',
  nginxFrontendPort: '使用Nginx前端端口',
  backendDeployPort: '后端部署端口',
  port8080: '例如 8080',
  port8000: '例如 8000',
  previewDetailConfig: '预览详细配置',
  previewConfirmed: '已确认详细配置',
  nginxDetailConfig: 'Nginx详细配置',
  confirmOrAdjustNginxConfig: '请确认或调整Nginx配置',
  cancel: '取消',
  confirm: '确认',
  nginxCheckedHint: 'Nginx服务检测已通过，可以继续配置端口和配置文件',
  nginxUncheckedHint: '请先检测Nginx服务',
}

