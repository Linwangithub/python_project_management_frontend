export const ROOT_PATH_VALUE = '__root__'
export const STEP_COLS = 4

export const PORT_MIN = 1024
export const PORT_MAX = 49151
export const DB_PORT_MIN = 1
export const DB_PORT_MAX = 65535

export const DEFAULT_DB_PORT = '3306'
export const DEFAULT_DB_USER = 'root'
export const DEFAULT_DB_PASSWORD = '123456'

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

export const settingText = {
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

