/**
 * Dashboard 表格动作转发组合函数。
 *
 * 参数：
 * - options.dialogs：弹框与业务动作处理器集合。
 *
 * 返回：
 * - 表格组件可直接绑定的动作回调。
 */
export const useDashboardActions = (options) => {
  const { dialogs } = options

  const onProjectTableActionFromTable = (code, row) => {
    dialogs.handleProjectAction(code, row)
  }

  const onUserTableActionFromTable = (code, row) => {
    dialogs.handleUserAction(code, row)
  }

  const onEnvTableActionFromTable = (code) => {
    dialogs.handleEnvAction(code)
  }

  const onServerTableActionFromTable = (code, row) => {
    dialogs.handleServerAction(code, row)
  }

  const onDeleteUserMigrateChange = (value) => {
    dialogs.deleteUserMigrate.value = value
  }

  return {
    onProjectTableActionFromTable,
    onUserTableActionFromTable,
    onEnvTableActionFromTable,
    onServerTableActionFromTable,
    onDeleteUserMigrateChange,
  }
}
