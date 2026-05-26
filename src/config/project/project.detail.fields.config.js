/** Project detail drawer field configuration. */
export const projectDetailFieldsConfig = [
  { key: 'name', label: '项目名称' },
  { key: 'owner', label: '负责人' },
  { key: 'serverIp', label: '服务器' },
  { key: 'backendDevPort', label: '后端开发端口' },
  { key: 'backendDeployPort', label: '后端部署端口' },
  { key: 'frontendPort', label: 'Nginx前端端口' },
  { key: 'path', label: '项目路径' },
  { key: 'nginxPath', label: 'Nginx配置' },
  { key: 'databaseName', label: '数据库名' },
  { key: 'status', label: '状态' },
  { key: 'devCommand', label: '开发命令' },
  { key: 'deployCommand', label: '部署命令' },
]

/** Project detail drawer static copy. */
export const projectDetailDrawerText = {
  title: '项目详情',
  currentProject: '当前项目',
  running: '运行中',
  showSecret: '查看',
  hideSecret: '隐藏',
  emptyDescription: '暂无项目详情',
  baseInfoTitle: '基础信息',
  secretMask: '?'.repeat(8),
  emptyValue: '-',
}

/** Project detail path normalization copy. */
export const projectDetailPathText = {
  sectionTitle: '路径信息',
  backendEntryLabel: '后端入口文件位置',
  frontendDistLabel: '前端打包文件位置',
}

/** Project detail Conda normalization copy. */
export const projectDetailCondaText = {
  sectionTitle: 'Conda环境',
  actualPythonVersionLabel: '实际Python版本',
}

export const SECRET_MASK_TEXT = '••••••••'
