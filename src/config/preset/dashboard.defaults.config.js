/**
 * Dashboard 预设兜底配置。
 *
 * 作用：
 * - 统一维护 Dashboard 组合函数中使用的默认标题、提示、弹框宽度、删除文案和工具按钮。
 * - `view.presets.config.js` 可以覆盖这些默认值；未覆盖时统一回落到本文件。
 */

/** Dashboard 中心区域默认标题。 */
export const DASHBOARD_DEFAULT_CENTER_TITLE = '项目管理'

/** Dashboard 中心区域默认说明。 */
export const DASHBOARD_DEFAULT_CENTER_HINT = '统一管理项目、端口、命令和状态，支持启动、停止、部署、复制、导出等操作。'

/** Dashboard 弹框默认宽度配置。 */
export const DASHBOARD_DEFAULT_DIALOG_WIDTHS = {
  PROJECT_CREATE: '760px',
  USER_CREATE: '460px',
  ENV_CREATE: '520px',
  SERVER_CREATE: '520px',
  SETTING: '860px',
  COPY: '560px',
  EXPORT: '560px',
  SESSION: '560px',
  SERVER_USER: '500px',
  TOOL: '620px',
  DETAIL_DRAWER: '430px',
}

/** 项目详情抽屉默认标题。 */
export const DASHBOARD_DEFAULT_PROJECT_DETAIL_TITLE = '项目详情'

/** 服务器用户删除风险提示。 */
export const DASHBOARD_DEFAULT_SERVER_DELETE_DANGER_TEXT = '该操作不可逆，会清空该用户所有数据'

/** 项目工具弹框默认标题。 */
export const DASHBOARD_DEFAULT_TOOL_DIALOG_TITLE = '项目工具'

/** 项目工具弹框默认按钮。 */
export const DASHBOARD_DEFAULT_TOOL_BUTTONS = [
  '数据库导出数据',
  '导出日志文件',
  '上传文件到项目',
  '下载项目文件',
]

/** 项目删除默认确认文案。 */
export const DASHBOARD_DEFAULT_PROJECT_DELETE_TEXTS = {
  TITLE: '删除项目',
  CONFIRM: '确定删除项目 {name} 吗？此操作不可逆。',
  SUCCESS: '项目删除成功',
}

/** 用户删除默认确认文案。 */
export const DASHBOARD_DEFAULT_USER_DELETE_TEXTS = {
  TITLE: '删除用户确认',
  CONFIRM: '确定要删除用户 {name} 吗？',
  SUCCESS: '用户 {name} 删除成功',
}

/** 表格操作列默认配置。 */
export const DASHBOARD_DEFAULT_ACTION_COLUMN = {
  LABEL: '操作',
  PROJECT_MIN_WIDTH: 720,
  USER_MIN_WIDTH: 90,
  ENV_MIN_WIDTH: 140,
  SERVER_MIN_WIDTH: 180,
}
