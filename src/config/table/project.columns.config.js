/** Project management table column configuration. */
export const projectColumnsConfig = [
  { key: 'owner', label: '人员', width: 76 },
  { key: 'name', label: '项目名称', minWidth: 132 },
  { key: 'serverIp', label: '项目Ip', width: 108 },
  { key: 'nginxInfo', label: 'NginxIp和前后端口', minWidth: 158 },
  { key: 'databaseInfo', label: '数据库Ip和数据库名', minWidth: 148 },
  { key: 'runningPort', label: '正在运行端口', width: 96 },
  { key: 'serviceStatus', label: '服务状态', width: 84 },
  { key: 'projectStatus', label: '项目检测', width: 90 },
]

/** Project table display text and status values. */
export const projectTableText = {
  emptyDash: '-',
  notFilled: '未填写',
  notConfigured: '未配置',
  clickToCheckProjectStatus: '点击检测当前项目状态',
  checking: '检测中...',
  stopped: '已停止',
  running: '运行中',
  unchecked: '未检测',
  checkStatus: '检测状态',
  normal: '正常',
  abnormal: '异常',
}

/** Project table compound field labels. */
export const projectTableInfoLabels = {
  ip: 'IP',
  frontend: '前端',
  backend: '后端',
  database: '库',
}

/** Shared base table text. */
export const baseTableText = {
  actionsLabel: '操作',
}
