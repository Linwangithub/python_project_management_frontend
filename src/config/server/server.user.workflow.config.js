/** Server user and server-record operation text. */
export const SERVER_USER_WORKFLOW_TEXT = {
  deleteDangerText: '该操作不可逆，会清空该用户所有数据',
  noDeletableUser: '暂无可删除用户',
  usernameRequired: '请输入用户名',
  chooseUserRequired: '请选择用户',
  addUserSuccess: '增加用户成功',
  addUserFailed: '增加用户失败',
  deleteUserConfirmTitle: '删除用户确认',
  deleteUserSuccess: '删除用户成功',
  deleteUserFailed: '删除用户失败',
  deleteServerConfirmTitle: '删除服务器确认',
  deleteServerRecordSuccess: '删除服务器记录成功',
  deleteServerRecordFailed: '删除服务器记录失败',
  confirm: '确认',
  cancel: '取消',
}

/** Server user workflow dynamic text. */
export const serverUserWorkflowFactory = {
  addUserTerminal(alias, serverIp, username) {
    return `[会话:${alias}] 服务器 ${serverIp} 新增用户 ${username}`
  },
  deleteUserTerminal(alias, serverIp, username) {
    return `[会话:${alias}] 服务器 ${serverIp} 删除用户 ${username}（含 /home/${username}）`
  },
  deleteServerConfirmContent(serverIp) {
    return `确定删除服务器记录 ${serverIp} 吗？仅删除平台记录，不会操作真实服务器。`
  },
  deleteServerTerminal(alias, serverIp) {
    return `[会话:${alias}] 删除服务器记录 ${serverIp}`
  },
}
