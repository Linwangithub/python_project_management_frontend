import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addServerUserDialogFieldsConfig,
  deleteServerUserDialogFieldsConfig,
} from '@/config/dialog/dialog.fields.config'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'

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
  const serverDeleteDangerText = ref('该操作不可逆，会清空该用户所有数据')


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
        ElMessage.warning('暂无可删除用户')
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
      ElMessage.warning('请输入用户名')
      return
    }

    try {
      await projectApi.addServerUser({
        server_id: Number(server.id),
        username,
      })
      serverAddUserDialogVisible.value = false
      ElMessage.success('增加用户成功')
      appendTerminal(`[会话:${activeSessionAlias.value}] 服务器 ${server.ip} 新增用户 ${username}`)
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '增加用户失败'))
    }
  }

  const confirmDeleteServerUser = async () => {
    const server = serverActionTarget.value
    if (!server) return

    const username = String(serverDeleteUserForm.username || '').trim()
    if (!username) {
      ElMessage.warning('请选择用户')
      return
    }

    try {
      await ElMessageBox.confirm(
        '该操作不可逆，会清空该用户所有数据',
        '删除用户确认',
        {
          type: 'warning',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
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
      ElMessage.success('删除用户成功')
      appendTerminal('[会话:' + activeSessionAlias.value + '] 服务器 ' + server.ip + ' 删除用户 ' + username + '（含 /home/' + username + '）')
      await projectStore.loadBundle()
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '删除用户失败'))
    }
  }

  const confirmDeleteServer = async (server) => {
    try {
      await ElMessageBox.confirm(
        `确定删除服务器记录 ${server.ip} 吗？仅删除平台记录，不会操作真实服务器。`,
        '删除服务器确认',
        {
          type: 'warning',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
        },
      )
    } catch {
      return
    }

    try {
      await projectApi.deleteServer([server.id])
      projectStore.removeServer(server.id)
      ElMessage.success('删除服务器记录成功')
      appendTerminal('[会话:' + activeSessionAlias.value + '] 删除服务器记录 ' + server.ip)
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '删除服务器记录失败'))
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
