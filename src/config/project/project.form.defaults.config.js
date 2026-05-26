/**
 * 项目表单默认值与校验范围配置。
 *
 * 作用：
 * - 集中维护创建、同步、设置流程共用的端口范围和数据库默认值。
 * - 避免多个弹框或 composable 重复定义同一组魔法值。
 */

/** 数据库默认端口。 */
export const DEFAULT_DB_PORT = '3306'

/** 数据库默认账号。 */
export const DEFAULT_DB_USER = 'root'

/** 数据库默认密码。 */
export const DEFAULT_DB_PASSWORD = '123456'

/** 数据库端口允许的最小端口。 */
export const DB_PORT_MIN = 1

/** 数据库端口允许的最大端口。 */
export const DB_PORT_MAX = 65535

/** 项目服务端口允许的最小端口。 */
export const PORT_MIN = 1024

/** 项目服务端口允许的最大端口。 */
export const PORT_MAX = 49151


/** 默认新建环境名称，用于环境菜单原型表单。 */
export const DEFAULT_ENV_NAME = 'demo_api'

/** 默认新建环境 Python 版本，用于环境菜单原型表单。 */
export const DEFAULT_ENV_PYTHON_VERSION = '3.11'

/** 默认新建环境描述，用于环境菜单原型表单。 */
export const DEFAULT_ENV_DESCRIPTION = '用于快速创建，来源于历史项目'

/** 默认服务器备注，用于服务器创建表单。 */
export const DEFAULT_SERVER_REMARK = '新服务器'

/** 默认设置备注，用于设置表单保存时传递给后端审计日志。 */
export const DEFAULT_SETTING_REMARK = '配置后会覆盖 Nginx 端口信息'
