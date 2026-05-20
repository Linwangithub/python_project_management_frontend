export const PROJECT_CREATING_TEXT = '创建中'
export const PROJECT_SETTING_TEXT = '设置中'
export const PROJECT_SYNCING_TEXT = '同步中'
export const PROJECT_CREATED_TEXT = '创建成功'
export const PROJECT_CREATE_FAILED_TEXT = '创建失败'
export const PROJECT_RUNNING_TEXT = '运行中'
export const PROJECT_STOPPED_TEXT = '已停止'

export const PROJECT_DELETE_SCOPE_OPTIONS = [
  { key: '1', value: 'project_only', label: '只删除该项目' },
  { key: '2', value: 'project_and_conda', label: '删除该项目和对应Conda环境' },
  { key: '3', value: 'project_conda_and_db', label: '删除该项目，Conda环境，数据库' },
  { key: '4', value: 'project_conda_nginx', label: '删除该项目，Conda环境，Nginx配置' },
  { key: '5', value: 'project_conda_db_nginx', label: '删除该项目，Conda环境，数据库，Nginx配置' },
]

export const DEFAULT_DB_PORT = '3306'
export const DEFAULT_DB_USER = 'root'
export const DEFAULT_DB_PASSWORD = '123456'
export const DB_PORT_MIN = 1
export const DB_PORT_MAX = 65535
export const PORT_MIN = 1024
export const PORT_MAX = 49151
