/**
 * 终端区域提示文案配置。
 *
 * 作用：
 * - 统一维护终端连接、会话、上传下载、命令执行等用户可见提示。
 * - 文案修改只需要改本文件，业务组合函数不再直接写中文提示。
 */

/** 静态终端提示文案。 */
export const terminalMessages = {
  tokenMissing: '登录令牌为空，无法创建终端连接',
  connectTimeout: '终端连接超时',
  connectionRecovered: '[系统] 终端连接已恢复',
  commandSent: '启动命令已发送',
  connectionError: '终端连接异常',
  sessionClosed: '终端会话已关闭',
  connectFailed: '终端连接失败',
  connectionClosed: '终端连接已关闭',
  sessionNotFound: '终端会话不存在',
  websocketDisconnected: '终端 WebSocket 未连接',
  serverIpRequired: '服务器IP不能为空',
  serverBusy: '当前服务器终端会话任务执行中，请稍后再试',
  createSessionFailed: '创建会话失败',
  sessionLocked: '该会话任务执行中，暂不可关闭',
  foregroundStopRequired: '前台服务未停止，暂不关闭会话',
  remoteCloseFailed: '关闭远程会话失败，已关闭本地会话',
  chooseServerIp: '请选择服务器IP',
  aliasRequired: '会话别名不能为空',
  serverUnavailableForUser: '该服务器不在当前用户可用范围内',
  createSessionSuccess: '会话创建成功',
  createTerminalSessionFirst: '请创建一个终端会话',
  sessionNotReady: '当前终端会话尚未连接完成',
  uploadSuccess: '上传完成',
  uploadFailed: '上传失败',
  downloadListLoadFailed: '加载下载列表失败',
  downloadableEmpty: '当前目录暂无可下载文件或目录',
  downloadTicketFailed: '下载凭证生成失败',
  downloadStartedTip: '已开始下载，请在浏览器下载栏查看进度',
  downloadFailed: '下载失败',
  commandRequired: '命令不能为空',
  startCommandMissing: '暂无配置启动命令',
  createSessionFirst: '请先创建会话',
  commandBlockedByTask: '当前会话任务执行中，暂不可输入命令',
  commandSendFailed: '命令发送失败',
  taskRunningDefault: '任务执行中',
  sessionServerLabel: '服务器IP',
  sessionServerPlaceholder: '请选择可用服务器',
  sessionAliasLabel: '会话别名',
  sessionAliasPlaceholder: '如：srv',
}

/** 需要拼接动态值的终端提示文案。 */
export const terminalMessageFactory = {
  welcome(serverIp) {
    return `正在连接：${serverIp}`
  },
  foregroundStarted(pid, port) {
    return `前台服务已启动：PID=${pid || ''}${port ? ` 端口=${port}` : ''}`
  },
  sessionCreatedOnServer(serverIp, alias) {
    return `已在服务器 ${serverIp} 创建新会话：${alias}`
  },
  sessionClosedWithAlias(alias) {
    return `已关闭会话：${alias}`
  },
  uploaded(fileName) {
    return `已上传：${fileName}`
  },
  downloadStarted(path) {
    return `开始下载：${path}`
  },
  serverOptionLabel(alias, ip) {
    return alias ? `${alias} (${ip})` : ip
  },
}

/**
 * 终端面板静态文案。
 *
 * 作用：
 * - TerminalPanel.vue 只负责展示终端 UI（用户界面）。
 * - 按钮、占位符、Tab 提示等固定文案统一由本配置提供。
 */
export const terminalPanelText = {
  closeSessionSymbol: '×',
  closeSession: '关闭会话',
  sessionEmpty: '暂无会话，请先创建',
  title: '终端',
  createSession: '创建会话',
  upload: '上传',
  download: '下载',
  commandPlaceholder: '输入命令...',
  execute: '执行',
}


/** Terminal download dialog text. */
export const terminalDownloadDialogText = {
  title: '下载文件或目录',
  currentSession: '当前会话',
  downloadPath: '下载路径',
  pathPlaceholder: '请选择要下载的文件或目录',
  cancel: '取消',
  download: '下载',
}
