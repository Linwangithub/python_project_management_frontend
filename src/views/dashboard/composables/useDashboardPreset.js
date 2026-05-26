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
import { USER_ROLE_KEY } from '@/config/auth/auth.config'
import { DEFAULT_ACTIVE_MENU, DEFAULT_MEMBER_FILTER } from '@/config/layout/layout.config'
import {
  DASHBOARD_DEFAULT_ACTION_COLUMN,
  DASHBOARD_DEFAULT_CENTER_HINT,
  DASHBOARD_DEFAULT_CENTER_TITLE,
  DASHBOARD_DEFAULT_DIALOG_WIDTHS,
  DASHBOARD_DEFAULT_PROJECT_DELETE_TEXTS,
  DASHBOARD_DEFAULT_PROJECT_DETAIL_TITLE,
  DASHBOARD_DEFAULT_SERVER_DELETE_DANGER_TEXT,
  DASHBOARD_DEFAULT_TOOL_BUTTONS,
  DASHBOARD_DEFAULT_TOOL_DIALOG_TITLE,
  DASHBOARD_DEFAULT_USER_DELETE_TEXTS,
} from '@/config/preset/dashboard.defaults.config'

/**
 * Dashboard 视图预设组合函数。
 *
 * 作用：
 * - 根据当前预设、菜单权限和动作权限计算可见菜单、列、按钮和弹框配置。
 * - 将配置层与 Dashboard 页面渲染逻辑隔离。
 */
export const useDashboardPreset = (options) => {
  const { auth, layout, ui, projectStore } = options

  /** 当前用户角色，未登录时按普通用户处理。 */
  const currentRole = computed(() => auth.role || USER_ROLE_KEY)

  /** 把页面菜单 key 转成后端权限菜单 key。 */
  const permissionMenuKey = (menuKey) => menuPermissionKeyMap[menuKey] || menuKey

  /** 当前用户可见菜单映射，用于主布局过滤菜单。 */
  const visibleMenuMap = computed(() =>
    Object.fromEntries(
      menuConfig
        .filter((item) => auth.hasMenu(permissionMenuKey(item.key)))
        .map((item) => [item.key, true]),
    ),
  )

  /**
   * 判断某个菜单动作是否可用。
   *
   * 参数：
   * - menuKey：前端菜单 key。
   * - actionCode：前端动作 code。
   *
   * 返回：
   * - true 表示当前用户拥有该动作权限。
   */
  const canAction = (menuKey, actionCode) => {
    const mappedAction = actionPermissionKeyMap[menuKey]?.[actionCode]
    const menuPerm = permissionMenuKey(menuKey)

    if (mappedAction === undefined || mappedAction === null) {
      return auth.hasMenu(menuPerm)
    }
    return auth.hasAction(menuPerm, mappedAction)
  }

  /** 当前激活菜单配置。 */
  const currentMenu = computed(() => menuConfig.find((m) => m.key === layout.activeMenu))

  /** 中心区域标题。 */
  const centerTitle = computed(() => {
    return ui.currentPresetConfig.menus[layout.activeMenu]?.menuLabel || currentMenu.value?.label || DASHBOARD_DEFAULT_CENTER_TITLE
  })
  /** 中心区域说明。 */
  const centerHint = computed(() => {
    return (
      ui.currentPresetConfig.menus[layout.activeMenu]?.menuHint ||
      DASHBOARD_DEFAULT_CENTER_HINT
    )
  })

  /** 当前菜单可见工具栏分组。 */
  const activeToolbarSections = computed(() => {
    return [...toolbarSectionsConfig]
      .filter((item) => item.menus.includes(layout.activeMenu))
      .filter((item) => ui.currentPresetConfig.toolbarSections.includes(item.type))
      .sort((a, b) => a.order - b.order)
  })

  /** 切换视图预设。 */
  const onPresetChange = (preset) => {
    ui.setPreset(preset)
  }

  /** 项目状态筛选值。 */
  const statusFilter = ref('')
  /** 切换项目状态筛选。 */
  const toggleStatusFilter = (status) => {
    statusFilter.value = statusFilter.value === status ? '' : status
  }

  watch(
    () => layout.activeMenu,
    (menu) => {
      if (menu !== DEFAULT_ACTIVE_MENU) {
        statusFilter.value = ''
      }
    },
  )

  /** 根据成员和状态筛选后的项目列表。 */
  const filteredProjects = computed(() => {
    const member = layout.currentMemberFilter
    let rows = projectStore.projects
    if (member !== DEFAULT_MEMBER_FILTER) {
      rows = rows.filter((row) => row.owner === member)
    }
    if (statusFilter.value) {
      rows = rows.filter((row) => row.status === statusFilter.value)
    }
    return rows
  })

  /** 根据成员筛选后的用户列表。 */
  const filteredUsers = computed(() => {
    const member = layout.currentMemberFilter
    if (member === DEFAULT_MEMBER_FILTER) return projectStore.users
    return projectStore.users.filter((row) => row.username === member)
  })

  /** 成员筛选选项。 */
  const memberFilterOptions = computed(() => projectStore.memberFilterOptions)

  /**
   * 按 key 从配置列表中挑选需要展示的字段。
   *
   * 参数：
   * - source：完整字段配置。
   * - keys：需要展示的字段 key 列表。
   *
   * 返回：
   * - 过滤后的字段配置；keys 为空时返回完整配置。
   */
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

  const projectCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.createDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.PROJECT_CREATE)
  const userCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.users?.createDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.USER_CREATE)
  const envCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.envs?.createDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.ENV_CREATE)
  const serverCreateDialogWidth = computed(() => ui.currentPresetConfig.menus.servers?.createDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.SERVER_CREATE)

  const projectDetailFieldsForView = computed(() => pickFields(projectDetailFieldsConfig, ui.currentPresetConfig.menus.projects?.detailFields))
  const projectDetailDrawerTitle = computed(() => ui.currentPresetConfig.menus.projects?.detailDrawerTitle || DASHBOARD_DEFAULT_PROJECT_DETAIL_TITLE)
  const projectDetailDrawerSize = computed(() => ui.currentPresetConfig.menus.projects?.detailDrawerSize || DASHBOARD_DEFAULT_DIALOG_WIDTHS.DETAIL_DRAWER)

  const settingDialogFieldsForView = computed(() => pickFields(settingDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.settingFields))
  const settingDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.settingDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.SETTING)

  const copyDialogFieldsForView = computed(() => pickFields(copyDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.copyFields))
  const copyDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.copyDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.COPY)

  const exportDialogFieldsForView = computed(() => pickFields(exportDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.exportFields))
  const exportDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.exportDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.EXPORT)

  const sessionDialogFieldsForView = computed(() => pickFields(createSessionDialogFieldsConfig, ui.currentPresetConfig.menus.projects?.sessionFields))
  const sessionDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.sessionDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.SESSION)

  const serverAddUserDialogFieldsForView = computed(() => addServerUserDialogFieldsConfig)
  const serverDeleteUserDialogFieldsForView = computed(() => deleteServerUserDialogFieldsConfig)
  const serverUserDialogWidth = computed(() => DASHBOARD_DEFAULT_DIALOG_WIDTHS.SERVER_USER)
  const serverDeleteDangerText = computed(() => DASHBOARD_DEFAULT_SERVER_DELETE_DANGER_TEXT)

  const toolDialogTitle = computed(() => ui.currentPresetConfig.menus.projects?.toolDialogTitle || DASHBOARD_DEFAULT_TOOL_DIALOG_TITLE)
  const toolDialogWidth = computed(() => ui.currentPresetConfig.menus.projects?.toolDialogWidth || DASHBOARD_DEFAULT_DIALOG_WIDTHS.TOOL)
  const toolButtonsForView = computed(() => {
    return ui.currentPresetConfig.menus.projects?.toolButtons || DASHBOARD_DEFAULT_TOOL_BUTTONS
  })

  const projectDeleteConfirmTitle = computed(() => ui.currentPresetConfig.menus.projects?.deleteConfirmTitle || DASHBOARD_DEFAULT_PROJECT_DELETE_TEXTS.TITLE)
  const projectDeleteConfirmTextTemplate = computed(() => ui.currentPresetConfig.menus.projects?.deleteConfirmText || DASHBOARD_DEFAULT_PROJECT_DELETE_TEXTS.CONFIRM)
  const projectDeleteSuccessTextTemplate = computed(() => ui.currentPresetConfig.menus.projects?.deleteSuccessText || DASHBOARD_DEFAULT_PROJECT_DELETE_TEXTS.SUCCESS)
  const userDeleteConfirmTitle = computed(() => ui.currentPresetConfig.menus.users?.deleteConfirmTitle || DASHBOARD_DEFAULT_USER_DELETE_TEXTS.TITLE)
  const userDeleteConfirmTextTemplate = computed(() => ui.currentPresetConfig.menus.users?.deleteConfirmText || DASHBOARD_DEFAULT_USER_DELETE_TEXTS.CONFIRM)
  const userDeleteSuccessTextTemplate = computed(() => ui.currentPresetConfig.menus.users?.deleteSuccessText || DASHBOARD_DEFAULT_USER_DELETE_TEXTS.SUCCESS)

  const projectActions = computed(() => {
    const actionCodes = ui.currentPresetConfig.menus.projects?.showProjectActions
    return projectActionsConfig
      .filter((item) => !actionCodes || !actionCodes.length || actionCodes.includes(item.code))
      .filter((item) => canAction('projects', item.code))
  })

  const projectActionsMinWidth = computed(() => ui.currentPresetConfig.menus.projects?.actionsMinWidth || DASHBOARD_DEFAULT_ACTION_COLUMN.PROJECT_MIN_WIDTH)
  const projectActionsLabel = computed(() => ui.currentPresetConfig.menus.projects?.actionsLabel || DASHBOARD_DEFAULT_ACTION_COLUMN.LABEL)
  const userActionsMinWidth = computed(() => ui.currentPresetConfig.menus.users?.actionsMinWidth || DASHBOARD_DEFAULT_ACTION_COLUMN.USER_MIN_WIDTH)
  const userActionsLabel = computed(() => ui.currentPresetConfig.menus.users?.actionsLabel || DASHBOARD_DEFAULT_ACTION_COLUMN.LABEL)
  const envActionsMinWidth = computed(() => ui.currentPresetConfig.menus.envs?.actionsMinWidth || DASHBOARD_DEFAULT_ACTION_COLUMN.ENV_MIN_WIDTH)
  const envActionsLabel = computed(() => ui.currentPresetConfig.menus.envs?.actionsLabel || DASHBOARD_DEFAULT_ACTION_COLUMN.LABEL)
  const serverActionsMinWidth = computed(() => ui.currentPresetConfig.menus.servers?.actionsMinWidth || DASHBOARD_DEFAULT_ACTION_COLUMN.SERVER_MIN_WIDTH)
  const serverActionsLabel = computed(() => ui.currentPresetConfig.menus.servers?.actionsLabel || DASHBOARD_DEFAULT_ACTION_COLUMN.LABEL)

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
