/**
 * 终端会话行为配置。
 *
 * 作用：
 * - 集中维护终端会话默认值、WebSocket 消息类型、任务状态和交互时间窗口。
 * - 避免终端组合函数里散落协议字符串、默认别名、超时时间等硬编码。
 */

/** 未命名终端会话在页面上展示的默认别名。 */
export const TERMINAL_DEFAULT_ALIAS = 'default'

/** 远程主机别名缺失时的前端兜底展示名。 */
export const TERMINAL_DEFAULT_HOST_LABEL = 'wcp'

/** 未登录或本地用户信息缺失时用于隔离 localStorage 的默认用户标识。 */
export const TERMINAL_DEFAULT_USER_ID = 'guest'

/** 终端会话默认 Conda 环境名。 */
export const TERMINAL_DEFAULT_CONDA_ENV = 'base'

/** 终端会话状态写入 localStorage 时使用的 key 前缀。 */
export const TERMINAL_STORE_STORAGE_PREFIX = 'pspm_terminal_state'

/** 单个终端会话最多保留的输出行数，避免 localStorage 持续膨胀。 */
export const TERMINAL_OUTPUT_LINE_LIMIT = 2000

/** 终端提示符中的默认 Linux 用户名。 */
export const TERMINAL_PROMPT_USER = 'root'

/** 终端会话自动别名缺失时的兜底别名。 */
export const TERMINAL_DEFAULT_SESSION_ALIAS = 'session'

/** 根据服务器 IP 生成会话别名时，IP 不可用时使用的兜底片段。 */
export const TERMINAL_SERVER_IP_ALIAS_FALLBACK = 'server'

/** 创建项目流程使用的终端会话别名后缀。 */
export const TERMINAL_CREATE_PROJECT_SUFFIX = 'create_project'

/** 普通项目任务使用的终端会话别名后缀。 */
export const TERMINAL_TASK_SUFFIX = 'task'

/** WebSocket 建连超时时间，单位毫秒。 */
export const TERMINAL_CONNECT_TIMEOUT_MS = 10000

/** Tab 二次点击展示候选项的时间窗口，单位毫秒。 */
export const TERMINAL_TAB_REPEAT_MS = 3000

/** 终端输入历史最大保留条数。 */
export const TERMINAL_COMMAND_HISTORY_LIMIT = 100

/** 前端识别清屏命令时使用的小写命令文本。 */
export const TERMINAL_CLEAR_COMMAND = 'clear'

/** 终端 WebSocket 前后端通信消息类型。 */
export const TERMINAL_WS_MESSAGE_TYPES = {
  OPEN: 'open',
  READY: 'ready',
  OUTPUT: 'output',
  FOREGROUND_STARTED: 'foreground_started',
  FOREGROUND_PENDING: 'foreground_pending',
  COMPLETE_RESULT: 'complete_result',
  ERROR: 'error',
  CLOSED: 'closed',
  INPUT: 'input',
  RUN_FOREGROUND: 'run_foreground',
  COMPLETE: 'complete',
}

/** 项目服务状态展示文本，与项目列表服务状态列保持一致。 */
export const PROJECT_SERVICE_STATUS = {
  RUNNING: '运行中',
  STOPPED: '已停止',
}

/** 终端文件浏览器节点类型。 */
export const TERMINAL_FILE_NODE_TYPES = {
  DIRECTORY: 'dir',
  FILE: 'file',
}

/** 新建终端会话弹框字段 key。 */
export const TERMINAL_SESSION_FIELD_KEYS = {
  SERVER_IP: 'serverIp',
  ALIAS: 'alias',
}

/** 新建终端会话弹框宽度。 */
export const TERMINAL_SESSION_DIALOG_WIDTH = '560px'

/** 服务器绑定用户字段的分隔正则。 */
export const TERMINAL_SERVER_USERS_SEPARATOR_PATTERN = /[,\s]+/

/** 终端上传文件时提交给后端的默认目标路径，空字符串表示当前会话目录。 */
export const TERMINAL_UPLOAD_TARGET_PATH = ''

/** 原生文件选择框配置。 */
export const TERMINAL_UPLOAD_INPUT_CONFIG = {
  type: 'file',
  multiple: true,
  hiddenDisplay: 'none',
}

/** 原生下载链接配置。 */
export const TERMINAL_NATIVE_DOWNLOAD_LINK_CONFIG = {
  target: '_blank',
  rel: 'noopener',
}
