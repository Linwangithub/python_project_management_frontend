<template>
  <MainLayout>
    <template #default>
      <DashboardCenterPanel
        :loading="projectStore.loading"
        :active-menu="layout.activeMenu"
        :current-preset="ui.currentPreset"
        :current-member-filter="layout.currentMemberFilter"
        :member-filter-options="memberFilterOptions"
        :active-toolbar-sections="activeToolbarSections"
        :status-filter="statusFilter"
        :center-title="centerTitle"
        :center-hint="centerHint"
        :filtered-projects="filteredProjects"
        :filtered-users="filteredUsers"
        :envs="projectStore.envs"
        :servers="projectStore.servers"
        :project-columns-for-view="projectColumnsForView"
        :user-columns-for-view="userColumnsForView"
        :env-columns-for-view="envColumnsForView"
        :server-columns-for-view="serverColumnsForView"
        :project-actions-label="projectActionsLabel"
        :project-actions-min-width="projectActionsMinWidth"
        :project-actions="projectActions"
        :project-busy-ids="projectStore.busyProjectIds"
        :project-health-checking-ids="projectStore.healthCheckingProjectIds"
        :project-service-checking-ids="projectStore.serviceCheckingProjectIds"
        :user-actions-label="userActionsLabel"
        :user-actions-min-width="userActionsMinWidth"
        :user-actions="userActions"
        :env-actions-label="envActionsLabel"
        :env-actions-min-width="envActionsMinWidth"
        :env-actions="envActions"
        :server-actions-label="serverActionsLabel"
        :server-actions-min-width="serverActionsMinWidth"
        :server-actions="serverActions"
        @preset-change="onPresetChange"
        @member-filter-change="layout.setMemberFilter"
        @status-filter-toggle="toggleStatusFilter"
        @create="openCreateDialog"
        @sync-project="openSyncProjectDialog"
        @project-action="onProjectTableActionFromTable"
        @project-health-check="checkProjectHealth"
        @project-service-check="checkProjectService"
        @user-action="onUserTableActionFromTable"
        @env-action="onEnvTableActionFromTable"
        @server-action="onServerTableActionFromTable"
      />
    </template>

    <template #terminal>
      <TerminalPanel
        :terminal-store="terminalStore"
        :terminal-lines="terminalLines"
        :command-input="commandInput"
        :active-session-locked="activeSessionLocked"
        :active-session-lock-reason="activeSessionLockReason"
        @update:command-input="commandInput = $event"
        @console-mounted="(el) => { if (el) terminal.consoleRef.value = el }"
        @open-session="openSessionDialog"
        @upload="uploadFile"
        @download="downloadFile"
        @switch-session="switchSession"
        @add-sibling-session="addSiblingSession"
        @close-session="closeSession"
        @execute="executeCommand"
        @command-tab-complete="handleCommandTabComplete"
        @terminal-shortcut="handleConsoleShortcut"
        @console-scroll="onConsoleScroll"
      />
    </template>
  </MainLayout>

  <DashboardDialogsHost
    :project-drawer-visible="projectDrawerVisible"
    :selected-project="selectedProject"
    :selected-project-detail="selectedProjectDetail"
    :project-detail-loading="projectDetailLoading"
    :project-detail-drawer-title="projectDetailDrawerTitle"
    :project-detail-drawer-size="projectDetailDrawerSize"
    :project-detail-fields-for-view="projectDetailFieldsForView"
    :project-dialog-visible="projectDialogVisible"
    :project-create-dialog-width="projectCreateDialogWidth"
    :create-project-dialog-fields-for-view="projectCreateDialogFieldsForView"
    :project-create-form="projectCreateForm"
    :setting-dialog-visible="settingDialogVisible"
    :setting-dialog-width="settingDialogWidth"
    :setting-dialog-fields-for-view="settingDialogFieldsForView"
    :setting-form="settingForm"
    :copy-dialog-visible="copyDialogVisible"
    :copy-dialog-width="copyDialogWidth"
    :copy-dialog-fields-for-view="copyDialogFieldsForView"
    :copy-form="copyForm"
    :export-dialog-visible="exportDialogVisible"
    :export-dialog-width="exportDialogWidth"
    :export-dialog-fields-for-view="exportDialogFieldsForView"
    :export-form="exportForm"
    :tool-dialog-visible="toolDialogVisible"
    :tool-dialog-title="toolDialogTitle"
    :tool-dialog-width="toolDialogWidth"
    :tool-buttons-for-view="toolButtonsForView"
    :tool-form="toolForm"
    :user-dialog-visible="userDialogVisible"
    :user-create-dialog-width="userCreateDialogWidth"
    :create-user-dialog-fields-for-view="createUserDialogFieldsForView"
    :create-user-form="createUserForm"
    :env-dialog-visible="envDialogVisible"
    :env-create-dialog-width="envCreateDialogWidth"
    :create-env-dialog-fields-for-view="createEnvDialogFieldsForView"
    :env-create-form="envCreateForm"
    :server-dialog-visible="serverDialogVisible"
    :server-create-dialog-width="serverCreateDialogWidth"
    :create-server-dialog-fields-for-view="createServerDialogFieldsForView"
    :server-create-form="serverCreateForm"
    :session-dialog-visible="sessionDialogVisible"
    :session-dialog-width="terminalSessionDialogWidth"
    :session-dialog-fields-for-view="terminalSessionDialogFieldsForView"
    :create-session-form="createSessionForm"
    :delete-user-dialog-visible="deleteUserDialogVisible"
    :user-delete-confirm-title="userDeleteConfirmTitle"
    :user-delete-confirm-text="userDeleteConfirmText"
    :delete-user-migrate="deleteUserMigrate"
    :server-add-user-dialog-visible="serverAddUserDialogVisible"
    :server-delete-user-dialog-visible="serverDeleteUserDialogVisible"
    :server-user-dialog-width="serverUserDialogWidth"
    :server-add-user-dialog-fields-for-view="serverAddUserDialogFieldsForView"
    :server-delete-user-dialog-fields-for-view="serverDeleteUserDialogFieldsForView"
    :server-add-user-form="serverAddUserForm"
    :server-delete-user-form="serverDeleteUserForm"
    :server-delete-danger-text="serverDeleteDangerText"
    :project-log-dialog-visible="projectLogDialogVisible"
    :project-log-loading="projectLogLoading"
    :project-log-data="projectLogData"
    :sync-project-dialog-visible="syncProjectDialogVisible"
    :sync-project-dialog-width="syncProjectDialogWidth"
    :sync-project-form="syncProjectForm"
    :sync-project-fields-for-view="syncProjectFieldsForView"
    @update:project-drawer-visible="projectDrawerVisible = $event"
    @update:project-log-dialog-visible="projectLogDialogVisible = $event"
    @update:project-dialog-visible="projectDialogVisible = $event"
    @update:sync-project-dialog-visible="syncProjectDialogVisible = $event"
    @update:setting-dialog-visible="settingDialogVisible = $event"
    @update:copy-dialog-visible="copyDialogVisible = $event"
    @update:export-dialog-visible="exportDialogVisible = $event"
    @update:tool-dialog-visible="toolDialogVisible = $event"
    @update:user-dialog-visible="userDialogVisible = $event"
    @update:env-dialog-visible="envDialogVisible = $event"
    @update:server-dialog-visible="serverDialogVisible = $event"
    @update:session-dialog-visible="sessionDialogVisible = $event"
    @update:delete-user-dialog-visible="deleteUserDialogVisible = $event"
    @update:delete-user-migrate="onDeleteUserMigrateChange"
    @update:server-add-user-dialog-visible="serverAddUserDialogVisible = $event"
    @update:server-delete-user-dialog-visible="serverDeleteUserDialogVisible = $event"
    @confirm-create-project="confirmCreate('project')"
    @confirm-sync-project="confirmSyncProject"
    @sync-project-server-change="onSyncProjectServerChange"
    @sync-project-path-change="onSyncProjectPathChange"
    @sync-project-entry-path-change="onSyncProjectEntryPathChange"
    @sync-project-conda-check="onSyncProjectCondaCheck"
    @sync-project-db-check="onSyncProjectDatabaseCheck"
    @sync-project-nginx-check="onSyncProjectNginxCheck"
    @sync-project-nginx-port-blur="onSyncProjectNginxPortBlur"
    @sync-project-nginx-frontend-port-change="onSyncProjectNginxFrontendPortChange"
    @create-project-name-blur="checkProjectNameOnBlur"
    @create-project-db-check="onCreateProjectDatabaseCheck"
    @create-project-nginx-check="onCreateProjectNginxCheck"
    @create-project-nginx-port-blur="onCreateProjectNginxPortBlur"
    @save-project-setting="saveProjectSetting"
    @confirm-copy-project="confirmCopyProject"
    @confirm-export-project="confirmExportProject"
    @project-tool-click="handleProjectToolClick"
    @confirm-create-user="confirmCreateUser"
    @confirm-create-env="confirmCreate('env')"
    @confirm-create-server="confirmCreateServer"
    @confirm-create-session="confirmCreateSession"
    @confirm-delete-user="confirmDeleteUser"
    @confirm-add-server-user="confirmAddServerUser"
    @confirm-delete-server-user="confirmDeleteServerUser"
  />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import DashboardCenterPanel from '@/views/dashboard/components/DashboardCenterPanel.vue'
import DashboardDialogsHost from '@/views/dashboard/components/DashboardDialogsHost.vue'
import TerminalPanel from '@/views/dashboard/components/TerminalPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import { useUiStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
import { useTerminalStore } from '@/stores/terminal'
import { useDashboardPreset } from '@/views/dashboard/composables/useDashboardPreset'
import { useDashboardTerminal } from '@/views/dashboard/composables/useDashboardTerminal'
import { useDashboardDialogs } from '@/views/dashboard/composables/useDashboardDialogs'
import { useDashboardActions } from '@/views/dashboard/composables/useDashboardActions'

const auth = useAuthStore()
const layout = useLayoutStore()
const ui = useUiStore()
const projectStore = useProjectStore()
const terminalStore = useTerminalStore()

const preset = useDashboardPreset({ auth, layout, ui, projectStore })
const terminal = useDashboardTerminal({ terminalStore, projectStore })
const dialogs = useDashboardDialogs({
  layout,
  projectStore,
  terminalStore,
  activeSessionAlias: terminal.activeSessionAlias,
  activeSessionIp: terminal.activeSessionIp,
  appendTerminal: terminal.appendTerminal,
  ensureCreateProjectSession: terminal.ensureCreateProjectSession,
  ensureProjectTaskSession: terminal.ensureProjectTaskSession,
  appendSessionLine: terminal.appendSessionLine,
  appendSessionLines: terminal.appendSessionLines,
  lockSession: terminal.lockSession,
  unlockSession: terminal.unlockSession,
  canAction: preset.canAction,
  projectDeleteConfirmTitle: preset.projectDeleteConfirmTitle,
  projectDeleteConfirmTextTemplate: preset.projectDeleteConfirmTextTemplate,
  projectDeleteSuccessTextTemplate: preset.projectDeleteSuccessTextTemplate,
  userDeleteConfirmTextTemplate: preset.userDeleteConfirmTextTemplate,
  userDeleteSuccessTextTemplate: preset.userDeleteSuccessTextTemplate,
})

const {
  currentRole,
  visibleMenuMap,
  centerTitle,
  centerHint,
  activeToolbarSections,
  memberFilterOptions,
  onPresetChange,
  statusFilter,
  toggleStatusFilter,
  filteredProjects,
  filteredUsers,
  projectColumnsForView,
  userColumnsForView,
  envColumnsForView,
  serverColumnsForView,
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
  toolDialogTitle,
  toolDialogWidth,
  toolButtonsForView,
  userDeleteConfirmTitle,
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
} = preset

const {
  terminalLines,
  scrollToBottom,
  commandInput,
  activeSessionLocked,
  activeSessionLockReason,
  executeCommand,
  handleCommandTabComplete,
  switchSession,
  addSiblingSession,
  closeSession,
  sessionDialogVisible,
  sessionDialogWidth: terminalSessionDialogWidth,
  sessionDialogFieldsForView: terminalSessionDialogFieldsForView,
  createSessionForm,
  openSessionDialog,
  confirmCreateSession,
  uploadFile,
  downloadFile,
  handleConsoleShortcut,
  onConsoleScroll,
} = terminal

const {
  selectedProject,
  selectedProjectDetail,
  projectDetailLoading,
  projectDrawerVisible,
  projectLogDialogVisible,
  projectLogLoading,
  projectLogData,
  syncProjectDialogVisible,
  syncProjectDialogWidth,
  syncProjectForm,
  syncProjectFieldsForView,
  projectDialogVisible,
  userDialogVisible,
  envDialogVisible,
  serverDialogVisible,
  settingDialogVisible,
  copyDialogVisible,
  exportDialogVisible,
  toolDialogVisible,
  projectCreateForm,
  createUserForm,
  envCreateForm,
  serverCreateForm,
  settingForm,
  copyForm,
  exportForm,
  toolForm,
  deleteUserDialogVisible,
  deleteUserMigrate,
  userDeleteConfirmText,
  openCreateDialog,
  openSyncProjectDialog,
  confirmCreate,
  confirmSyncProject,
  onSyncProjectServerChange,
  onSyncProjectPathChange,
  onSyncProjectEntryPathChange,
  onSyncProjectCondaCheck,
  onSyncProjectDatabaseCheck,
  onSyncProjectNginxCheck,
  onSyncProjectNginxPortBlur,
  onSyncProjectNginxFrontendPortChange,
  onCreateProjectDatabaseCheck,
  onCreateProjectNginxCheck,
  onCreateProjectNginxPortBlur,
  checkProjectNameOnBlur,
  confirmCreateUser,
  saveProjectSetting,
  confirmCopyProject,
  confirmExportProject,
  handleProjectToolClick,
  confirmDeleteUser,
  serverAddUserDialogVisible,
  serverDeleteUserDialogVisible,
  serverAddUserForm,
  serverDeleteUserForm,
  projectCreateDialogFieldsForView,
  serverAddUserDialogFieldsForView,
  serverDeleteUserDialogFieldsForView,
  serverUserDialogWidth,
  serverDeleteDangerText,
  confirmCreateServer,
  confirmAddServerUser,
  confirmDeleteServerUser,
  checkProjectHealth,
  checkProjectService,
} = dialogs

const {
  onProjectTableActionFromTable,
  onUserTableActionFromTable,
  onEnvTableActionFromTable,
  onServerTableActionFromTable,
  onDeleteUserMigrateChange,
} = useDashboardActions({ dialogs })

const ensureActiveMenu = () => {
  const allowed = Object.keys(visibleMenuMap.value || {})
  if (!allowed.length) return
  if (!allowed.includes(layout.activeMenu)) {
    layout.switchMenu(allowed[0])
  }
}

watch(visibleMenuMap, ensureActiveMenu, { immediate: true, deep: true })

onMounted(async () => {
  ui.ensurePresetByRole(currentRole.value)
  if (!projectStore.loaded) {
    const result = await projectStore.loadBundle()
    if (!result.ok) {
      console.error(result.message)
    }
  }
  projectStore.currentUsername = auth.user?.username || 'user'
  projectStore.currentRole = auth.role || 'user'
  projectStore.currentProjectBasePath = auth.user?.projectBasePath || ''
  projectStore.projectRootBasePath = auth.user?.projectRootBasePath || ''
  projectStore.projectUserBasePathTemplate = auth.user?.projectUserBasePathTemplate || ''
  ensureActiveMenu()
  scrollToBottom()
})
</script>
