/**
 * 项目管理展示文案配置。
 *
 * 作用：
 * - 集中维护项目列表、项目状态、端口摘要等 UI（用户界面）展示文本。
 * - store（状态仓库）只负责数据转换，不直接散落固定中文文案。
 */

/** 字段未配置时的统一占位文本。 */
export const PROJECT_TEXT_NOT_CONFIGURED = '未配置'

/** 成员筛选器中展示全部成员的选项文本。 */
export const PROJECT_TEXT_ALL_MEMBERS = '全部成员'

/** Nginx 摘要中前端端口的标签。 */
export const PROJECT_TEXT_FRONTEND_PORT = '前端'

/** Nginx 摘要中后端代理端口的标签。 */
export const PROJECT_TEXT_BACKEND_PORT = '后端'

/** 数据库摘要中数据库名称的标签。 */
export const PROJECT_TEXT_DATABASE_NAME = '库'

/** 项目信息片段之间的分隔符。 */
export const PROJECT_INFO_SEPARATOR = ' / '

/** 项目服务运行状态文案。 */
export const PROJECT_SERVICE_STATUS_TEXT = {
  STOPPED: '已停止',
  RUNNING: '运行中',
}

/** 项目健康检测状态文案。 */
export const PROJECT_HEALTH_STATUS_TEXT = {
  NORMAL: '正常',
  UNCHECKED: '未检测',
}

/** 项目流程状态文案。 */
export const PROJECT_WORKFLOW_STATUS_TEXT = {
  CREATING: '创建中',
}

/** 项目 store 的错误提示文案。 */
export const PROJECT_STORE_MESSAGES = {
  LOAD_BUNDLE_FAILED: '加载数据失败',
}
