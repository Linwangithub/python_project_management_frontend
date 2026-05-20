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
