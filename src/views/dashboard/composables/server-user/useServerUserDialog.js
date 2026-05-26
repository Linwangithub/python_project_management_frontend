import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addServerUserDialogFieldsConfig,
  deleteServerUserDialogFieldsConfig,
} from '@/config/dialog/dialog.fields.config'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import { SERVER_USER_WORKFLOW_TEXT, serverUserWorkflowFactory } from '@/config/server/server.user.workflow.config'

/**
 * Server user workflow.
 * This module owns adding server users, deleting server users, and deleting server records.
 * The selectable delete-user list always excludes root.
 */
export const useServerUserDialog = (options) => {
  const { projectStore, activeSessionAlias, appendTerminal } = options

  const serverActionTarget = ref(null)
  const serverAddUserDialogVisible = ref(false)
  const serverDeleteUserDialogVisible = ref(false)
  const serverAddUserForm = reactive({ username: '' })
  const serverDeleteUserForm = reactive({ username: '' })

  const serverAddUserDialogFieldsForView = computed(() => addServerUserDialogFieldsConfig)
  const getServerAssignableUsers = (serverRow) => {
    const users = String(serverRow?.users || '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x && x !== 'root')
    return users
  }

  const serverDeleteUserDialogFieldsForView = computed(() => {
    const users = getServerAssignableUsers(serverActionTarget.value)
    return deleteServerUserDialogFieldsConfig.map((field) => {
      if (field.key !== 'username') return field
      return {
        ...field,
        options: users.map((u) => ({ label: u, value: u })),
      }
    })
  })

  const serverUserDialogWidth = ref('500px')
  const serverDeleteDangerText = ref(SERVER_USER_WORKFLOW_TEXT.deleteDangerText)


  const openServerAddUserDialog = (serverRow) => {
    serverActionTarget.value = serverRow
    serverAddUserForm.username = ''
    serverAddUserDialogVisible.value = true
  }

  const openServerDeleteUserDialog = (serverRow) => {
    ;(async () => {
      serverDeleteUserForm.username = ''
      try {
        await projectStore.loadBundle()
      } catch {
        // 刷新失败时继续使用当前行数据
      }

      const latest = projectStore.servers.find((x) => Number(x.id) === Number(serverRow.id)) || serverRow
      const users = getServerAssignableUsers(latest)
      if (!users.length) {
        ElMessage.warning(SERVER_USER_WORKFLOW_TEXT.noDeletableUser)
        return
      }

      serverActionTarget.value = latest
      serverDeleteUserDialogVisible.value = true
    })()
  }

  const confirmAddServerUser = async () => {
    const server = serverActionTarget.value
    if (!server) return

    const username = String(serverAddUserForm.username || '').trim()
    if (!username) {
      ElMessage.warning(SERVER_USER_WORKFLOW_TEXT.usernameRequired)
      return
    }

    try {
      await projectApi.addServerUser({
        server_id: Number(server.id),
        username,
      })
      serverAddUserDialogVisible.value = false
      ElMessage.success(SERVER_USER_WORKFLOW_TEXT.addUserSuccess)
      appendTerminal(serverUserWorkflowFactory.addUserTerminal(activeSessionAlias.value, server.ip, username))
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, SERVER_USER_WORKFLOW_TEXT.addUserFailed))
    }
  }

  const confirmDeleteServerUser = async () => {
    const server = serverActionTarget.value
    if (!server) return

    const username = String(serverDeleteUserForm.username || '').trim()
    if (!username) {
      ElMessage.warning(SERVER_USER_WORKFLOW_TEXT.chooseUserRequired)
      return
    }

    try {
      await ElMessageBox.confirm(
        SERVER_USER_WORKFLOW_TEXT.deleteDangerText,
        SERVER_USER_WORKFLOW_TEXT.deleteUserConfirmTitle,
        {
          type: 'warning',
          confirmButtonText: SERVER_USER_WORKFLOW_TEXT.confirm,
          cancelButtonText: SERVER_USER_WORKFLOW_TEXT.cancel,
        },
      )
    } catch {
      return
    }

    try {
      await projectApi.deleteServerUser({
        server_id: Number(server.id),
        username,
      })
      serverDeleteUserDialogVisible.value = false
      ElMessage.success(SERVER_USER_WORKFLOW_TEXT.deleteUserSuccess)
      appendTerminal(serverUserWorkflowFactory.deleteUserTerminal(activeSessionAlias.value, server.ip, username))
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, SERVER_USER_WORKFLOW_TEXT.deleteUserFailed))
    }
  }

  const confirmDeleteServer = async (server) => {
    try {
      await ElMessageBox.confirm(
        serverUserWorkflowFactory.deleteServerConfirmContent(server.ip),
        SERVER_USER_WORKFLOW_TEXT.deleteServerConfirmTitle,
        {
          type: 'warning',
          confirmButtonText: SERVER_USER_WORKFLOW_TEXT.confirm,
          cancelButtonText: SERVER_USER_WORKFLOW_TEXT.cancel,
        },
      )
    } catch {
      return
    }

    try {
      await projectApi.deleteServer([server.id])
      projectStore.removeServer(server.id)
      ElMessage.success(SERVER_USER_WORKFLOW_TEXT.deleteServerRecordSuccess)
      appendTerminal(serverUserWorkflowFactory.deleteServerTerminal(activeSessionAlias.value, server.ip))
    } catch (error) {
      ElMessage.error(getErrorMessage(error, SERVER_USER_WORKFLOW_TEXT.deleteServerRecordFailed))
    }
  }

  const handleServerAction = (actionCode, serverRow) => {
    if (actionCode === 'add_user') {
      openServerAddUserDialog(serverRow)
      return
    }
    if (actionCode === 'delete_server') {
      confirmDeleteServer(serverRow)
      return
    }
    if (actionCode === 'delete_user') {
      openServerDeleteUserDialog(serverRow)
    }
  }


  return {
    serverAddUserDialogVisible,
    serverDeleteUserDialogVisible,
    serverAddUserForm,
    serverDeleteUserForm,
    serverAddUserDialogFieldsForView,
    serverDeleteUserDialogFieldsForView,
    serverUserDialogWidth,
    serverDeleteDangerText,
    handleServerAction,
    confirmAddServerUser,
    confirmDeleteServerUser,
  }
}
