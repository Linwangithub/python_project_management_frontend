/**
 * 项目路径配置。
 *
 * 作用：
 * - 集中维护项目目录、前端打包目录、终端默认目录等固定路径。
 * - 避免创建、同步、设置、终端等模块各自硬编码路径。
 * - 后续路径策略变化时，只需要修改本文件。
 */

/** root 用户默认项目目录前缀。 */
export const ROOT_PROJECT_BASE_PATH = '/root/project'

/** root 用户同步已有项目时的默认起始目录。 */
export const ROOT_SYNC_BASE_PATH = '/root'

/** 终端会话默认工作目录。 */
export const TERMINAL_DEFAULT_HOME_DIR = '/root'

/** 普通用户项目目录模板，{username} 会被替换成实际用户名。 */
export const USER_PROJECT_BASE_PATH_TEMPLATE = '/home/{username}/project'

/** 普通用户同步已有项目时的默认起始目录模板。 */
export const USER_SYNC_BASE_PATH_TEMPLATE = '/home/{username}'

/** Nginx 静态资源 root 使用的前端打包目录前缀。 */
export const FRONTEND_DIST_BASE_PATH = '/data/frontend_dist'

/**
 * 使用用户名填充路径模板。
 *
 * @param {string} template - 包含 {username} 的路径模板。
 * @param {string} username - 当前服务器用户名。
 * @returns {string} 替换后的路径。
 */
export const formatUserPath = (template, username) => {
  return String(template || '').replace('{username}', String(username || 'user').trim() || 'user')
}
