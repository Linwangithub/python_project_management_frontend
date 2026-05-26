/** Project operation log dialog configuration. */
export const projectLogDialogText = {
  title: '项目操作日志',
  projectName: '项目名称',
  emptyProjectName: '-',
  emptyDescription: '暂无操作日志',
  operatorPrefix: '操作人：',
  configChangedTitle: '配置变更',
  nginxDetailCollapseTitle: '点击查看Nginx详细配置',
  beforeTitle: '修改前',
  afterTitle: '修改后',
  actionsTitle: 'Actions 动作',
  snapshotTitle: '当前版本完整配置',
  emptyValue: '空',
  recordCount(count) {
    return `共 ${count} 条记录`
  },
}

/** Project operation log field labels. */
export const projectLogFieldLabels = {
  id: '项目ID',
  name: '项目名称',
  description: '项目描述',
  owner: '所属人员',
  server_ip: '项目服务器IP',
  backend_path: '后端代码位置',
  frontend_path: '前端代码位置',
  entry_file_path: '项目入口文件位置',
  conda_env_name: 'Conda环境',
  conda_env_path: 'Conda环境位置',
  python_version: 'Python版本',
  database_name: '数据库名称',
  database_host: '数据库IP',
  database_port: '数据库端口',
  database_user: '数据库账号',
  database_password: '数据库密码',
  nginx_server_ip: 'Nginx服务器IP',
  nginx_conf_path: 'Nginx配置文件路径',
  frontend_port: 'Nginx前端端口',
  backend_dev_port: '后端开发端口',
  backend_deploy_port: '后端部署端口',
  nginx_config_text: 'Nginx详细配置',
  dev_start_command: '开发启动命令',
  deploy_start_command: '部署启动命令',
  status: '项目状态',
  auto_start: '是否开机自启',
  remark: '备注',
  created_at: '创建时间',
  updated_at: '更新时间',
  target_dir: '目标目录',
  target_server_ip: '目标服务器IP',
  message: '执行结果',
  execution_logs: '执行日志',
}

/** Hidden raw log keys that should not be rendered as snapshot rows. */
export const projectLogHiddenKeys = ['owner_id', 'server_id', 'updated_fields', 'actions', 'execution_logs']
