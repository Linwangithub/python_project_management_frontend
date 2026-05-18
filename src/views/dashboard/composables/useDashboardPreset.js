import { computed, ref, watch } from 'vue'
import { menuConfig } from '@/config/menu/menu.config'
import { projectColumnsConfig } from '@/config/table/project.columns.config'
import { userColumnsConfig } from '@/config/table/user.columns.config'
import { envColumnsConfig } from '@/config/table/env.columns.config'
import { serverColumnsConfig } from '@/config/table/server.columns.config'
import { projectActionsConfig } from '@/config/action/project.actions.config'
import { userActionsConfig } from '@/config/action/user.actions.config'
import { envActionsConfig } from '@/config/action/env.actions.config'
import { serverActionsConfig } from '@/config/action/server.actions.config'
import { toolbarSectionsConfig } from '@/config/toolbar/toolbar.config'
import { projectDetailFieldsConfig } from '@/config/project/project.detail.fields.config'
import {
  copyDialogFieldsConfig,
  createEnvDialogFieldsConfig,
  createProjectDialogFieldsConfig,
  createSessionDialogFieldsConfig,
  createServerDialogFieldsConfig,
  createUserDialogFieldsConfig,
  addServerUserDialogFieldsConfig,
  deleteServerUserDialogFieldsConfig,
  exportDialogFieldsConfig,
  settingDialogFieldsConfig,
} from '@/config/dialog/dialog.fields.config'
import { menuPermissionKeyMap, actionPermissionKeyMap } from '@/config/permission/permission.map'

export const useDashboardPreset = (options) => {
  const { auth, layout, ui, projectStore } = options

  const currentRole = computed(() => auth.role || 'user')
  const permissionMenuKey = (menuKey) => menuPermissionKeyMap[menuKey] || menuKey

  const visibleMenuMap = computed(() =>
    Object.fromEntries(
      menuConfig
        .filter((item) => auth.hasMenu(permissionMenuKey(item.key)))
        .map((item) => [item.key, true]),
    ),
  )

  const canAction = (menuKey, actionCode) => {
    const mappedAction = actionPermissionKeyMap[menuKey]?.[actionCode]
    const menuPerm = permissionMenuKey(menuKey)

    if (mappedAction === undefined || mappedAction === null) {
      return auth.hasMenu(menuPerm)
    }
    return auth.hasAction(menuPerm, mappedAction)
  }

  const currentMenu = computed(() => menuConfig.find((m) => m.key === layout.activeMenu))

  const centerTitle = computed(() => {
    return ui.currentPresetConfig.menus[layout.activeMenu]?.menuLabel || currentMenu.value?.label || '项目管理'
  })
  const centerHint = computed(() => {
    return (
      ui.currentPresetConfig.menus[layout.activeMenu]?.menuHint ||
      '统一管理项目、端口、命令和状态，支持启动、停止、部署、复制、导出等操作。'
    )
  })

  const activeToolbarSections = computed(() => {
    return [...toolbarSectionsConfig]
      .filter((item) => item.menus.includes(layout.activeMenu))
      .filter((item) => ui.currentPresetConfig.toolbarSections.includes(item.type))
      .sort((a, b) => a.order - b.order)
  })

  const onPresetChange = (preset) => {
    ui.setPreset(preset)
  }

  const statusFilter = ref('')
  const toggleStatusFilter = (status) => {
    statusFilter.value = statusFilter.value === status ? '' : status
  }

  watch(
    () => layout.activeMenu,
    (menu) => {
      if (menu !== 'projects') {
        statusFilter.value = ''
      }
    },
  )

  const filteredProjects = computed(() => {
    const member = layout.currentMemberFilter
    let rows = projectStore.projects
    if (member !== 'all') {
      rows = rows.filter((row) => row.owner === member)
    }
    if (statusFilter.value) {
      rows = rows.filter((row) => row.status === statusFilter.value)
    }
    return rows
  })

  const filteredUsers = computed(() => {
    const member = layout.currentMemberFilter
    if (member === 'all') return projectStore.users
    return projectStore.users.filter((row) => row.username === member)
  })

  const memberFilterOptions = computed(() => projectStore.memberFilterOptions)

  const pickFields = (source, keys) => {
    if (!keys || !keys.length) return source
    return source.filter((item) => keys.includes(item.key))
  }

  const projectColumnsForView = computed(() => pickFields(projectColumnsConfig, ui.currentPresetConfig.menus.projects?.showColumns))
  const userColumnsForView = computed(() => pickFields(userColumnsConfig, ui.currentPresetConfig.menus.users?.showColumns))
  const envColumnsForView = computed(() => pickFields(envColumnsConfig, ui.currentPresetConfig.menus.envs?.showColumns))
  const serverColumnsForView = computed(() => pickFields(serverColumnsConfig, ui.currentPresetConfig.menus.servers?.showColumns))

  const createProjectDialogFieldsForView = computed(() => pickFields(createProjectDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.createFields))
  const createUserDialogFieldsForView = computed(() => pickFields(createUserDialogFieldsConfig, ui.currentPresetConfig.menus.users?.createFields))
  const createEnvDialogFieldsForView = computed(() => pickFields(createEnvDialogFieldsConfig, ui.currentPresetConfig.menus.envs?.createFields))
  const createServerDialogFieldsForView = computed(() => pickFields(createServerDialogFieldsConfig, ui.currentPresetConfig.menus.servers?.createFields))

  const projectCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.createDialogWidth || '760px')
  const userCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.users?.createDialogWidth || '460px')
  const envCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.envs?.createDialogWidth || '520px')
  const serverCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.servers?.createDialogWidth || '520px')

  const projectDetailFieldsForView = computed(() => pickFields(projectDetailFieldsConfig, ui.currentPresetConfig.menus.projects?.detailFields))
  const projectDetailDrawerTitle = computed(() => ui.currentPresetConfig.menus.projects?.detailDrawerTitle || '项目详情')
  const projectDetailDrawerSize = computed(() => ui.currentPresetConfig.menus.projects?.detailDrawerSize || '430px')

  const settingDialogFieldsForView = computed(() => pickFields(settingDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.settingFields))
  const settingDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.settingDialogWidth || '860px')

  const copyDialogFieldsForView = computed(() => pickFields(copyDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.copyFields))
  const copyDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.copyDialogWidth || '560px')

  const exportDialogFieldsForView = computed(() => pickFields(exportDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.exportFields))
  const exportDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.exportDialogWidth || '560px')

  const sessionDialogFieldsForView = computed(() => pickFields(createSessionDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.sessionFields))
  const sessionDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.sessionDialogWidth || '560px')

  const serverAddUserDialogFieldsForView = computed(() => addServerUserDialogFieldsConfig)
  const serverDeleteUserDialogFieldsForView = computed(() => deleteServerUserDialogFieldsConfig)
  const serverUserDialogWidth = computed(() => '500px')
  const serverDeleteDangerText = computed(() => '该操作不可逆，会清空该用户所有数据')

  const toolDialogTitle = computed(() => ui.currentPresetConfig.menus.projects?.toolDialogTitle || '项目工具')
  const toolDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.toolDialogWidth || '620px')
  const toolButtonsForView = computed(() => {
    return ui.currentPresetConfig.menus.projects?.toolButtons || ['数据库导出数据', '导出日志文件', '上传文件到项目', '下载项目文件']
  })

  const projectDeleteConfirmTitle = computed(() => ui.currentPresetConfig.menus.projects?.deleteConfirmTitle || '删除项目')
  const projectDeleteConfirmTextTemplate = computed(() => ui.currentPresetConfig.menus.projects?.deleteConfirmText || '确定删除项目 {name} 吗？此操作不可逆。')
  const projectDeleteSuccessTextTemplate = computed(() => ui.currentPresetConfig.menus.projects?.deleteSuccessText || '项目删除成功')
  const userDeleteConfirmTitle = computed(() => ui.currentPresetConfig.menus.users?.deleteConfirmTitle || '删除用户确认')
  const userDeleteConfirmTextTemplate = computed(() => ui.currentPresetConfig.menus.users?.deleteConfirmText || '确定要删除用户 {name} 吗？')
  const userDeleteSuccessTextTemplate = computed(() => ui.currentPresetConfig.menus.users?.deleteSuccessText || '用户 {name} 删除成功')

  const projectActions = computed(() => {
    const actionCodes = ui.currentPresetConfig.menus.projects?.showProjectActions
    return projectActionsConfig
      .filter((item) => !actionCodes || !actionCodes.length || actionCodes.includes(item.code))
      .filter((item) => canAction('projects', item.code))
  })

  const projectActionsMinWidth = computed(() => ui.currentPresetConfig.menus.projects?.actionsMinWidth || 720)
  const projectActionsLabel = computed(() => ui.currentPresetConfig.menus.projects?.actionsLabel || '操作')
  const userActionsMinWidth = computed(() => ui.currentPresetConfig.menus.users?.actionsMinWidth || 90)
  const userActionsLabel = computed(() => ui.currentPresetConfig.menus.users?.actionsLabel || '操作')
  const envActionsMinWidth = computed(() => ui.currentPresetConfig.menus.envs?.actionsMinWidth || 140)
  const envActionsLabel = computed(() => ui.currentPresetConfig.menus.envs?.actionsLabel || '操作')
  const serverActionsMinWidth = computed(() => ui.currentPresetConfig.menus.servers?.actionsMinWidth || 180)
  const serverActionsLabel = computed(() => ui.currentPresetConfig.menus.servers?.actionsLabel || '操作')

  const userActions = computed(() => userActionsConfig.filter((item) => canAction('users', item.code)))
  const envActions = computed(() => envActionsConfig.filter((item) => canAction('envs', item.code)))
  const serverActions = computed(() => serverActionsConfig.filter((item) => canAction('servers', item.code)))

  return {
    currentRole,
    visibleMenuMap,
    canAction,
    centerTitle,
    centerHint,
    activeToolbarSections,
    onPresetChange,
    statusFilter,
    toggleStatusFilter,
    memberFilterOptions,
    filteredProjects,
    filteredUsers,
    projectColumnsForView,
    userColumnsForView,
    envColumnsForView,
    serverColumnsForView,
    createProjectDialogFieldsForView,
    createUserDialogFieldsForView,
    createEnvDialogFieldsForView,
    createServerDialogFieldsForView,
    projectCreateDialogWidth,
    userCreateDialogWidth,
    envCreateDialogWidth,
    serverCreateDialogWidth,
    projectDetailFieldsForView,
    projectDetailDrawerTitle,
    projectDetailDrawerSize,
    settingDialogFieldsForView,
    settingDialogWidth,
    copyDialogFieldsForView,
    copyDialogWidth,
    exportDialogFieldsForView,
    exportDialogWidth,
    sessionDialogFieldsForView,
    sessionDialogWidth,
    serverAddUserDialogFieldsForView,
    serverDeleteUserDialogFieldsForView,
    serverUserDialogWidth,
    serverDeleteDangerText,
    toolDialogTitle,
    toolDialogWidth,
    toolButtonsForView,
    projectDeleteConfirmTitle,
    projectDeleteConfirmTextTemplate,
    projectDeleteSuccessTextTemplate,
    userDeleteConfirmTitle,
    userDeleteConfirmTextTemplate,
    userDeleteSuccessTextTemplate,
    projectActions,
    projectActionsMinWidth,
    projectActionsLabel,
    userActionsMinWidth,
    userActionsLabel,
    envActionsMinWidth,
    envActionsLabel,
    serverActionsMinWidth,
    serverActionsLabel,
    userActions,
    envActions,
    serverActions,
  }
}
