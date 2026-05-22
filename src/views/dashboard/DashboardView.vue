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

  <el-dialog
    v-model="downloadDialogVisible"
    title="下载文件或目录"
    width="560px"
  >
    <el-form label-width="96px">
      <el-form-item label="当前会话">
        <span>{{ activeSessionAlias }}</span>
      </el-form-item>
      <el-form-item label="下载路径">
        <el-cascader
          ref="downloadPathCascaderRef"
          v-model="downloadPathCascaderValue"
          class="download-cascader"
          :options="downloadPathOptions"
          :props="downloadPathProps"
          clearable
          filterable
          :show-all-levels="false"
          :loading="downloadDialogLoading"
          placeholder="请选择要下载的文件或目录"
          @change="handleDownloadPathChange"
          @clear="clearDownloadPath"
        >
          <template #default="{ data }">
            <span
              class="download-path-node"
              :class="data.type === 'dir' ? 'is-dir' : 'is-file'"
            >
              <span
                class="download-path-type-icon"
                :class="data.type === 'dir' ? 'is-dir' : 'is-file'"
              />
              <span class="download-path-name">{{ data.label }}</span>
            </span>
          </template>
        </el-cascader>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="downloadDialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!downloadSelectedPath"
        :loading="downloadDialogLoading"
        @click="confirmDownloadFile"
      >
        下载
      </el-button>
    </template>
  </el-dialog>

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
import { nextTick, onMounted, ref, watch } from 'vue'
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
let dialogs
const terminal = useDashboardTerminal({
  terminalStore,
  projectStore,
  onCtrlC: (payload) => dialogs?.handleTerminalCtrlC?.(payload),
  getForegroundProjectBySessionId: (sessionId) => dialogs?.getForegroundProjectBySessionId?.(sessionId),
})
dialogs = useDashboardDialogs({
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
  runProjectForegroundInSession: terminal.runProjectForegroundInSession,
  executeSessionCommand: terminal.executeSessionCommand,
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
  activeSessionAlias,
  downloadDialogVisible,
  downloadDialogLoading,
  downloadPathOptions,
  downloadSelectedPath,
  downloadPathCascaderValue,
  loadDownloadCascaderChildren,
  onDownloadPathChange,
  clearDownloadPath,
  confirmDownloadFile,
  uploadFile,
  downloadFile,
  handleConsoleShortcut,
  onConsoleScroll,
} = terminal

const downloadPathProps = {
  emitPath: true,
  checkStrictly: true,
  lazy: true,
  lazyLoad: loadDownloadCascaderChildren,
}

const downloadPathCascaderRef = ref()

const handleDownloadPathChange = (value) => {
  onDownloadPathChange(value)
  nextTick(() => {
    downloadPathCascaderRef.value?.togglePopperVisible?.(false)
  })
}

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

<style scoped>
.download-cascader {
  width: 100%;
}

.download-path-node {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  line-height: 1;
}

.download-path-type-icon {
  flex: 0 0 auto;
  position: relative;
  display: inline-block;
}

.download-path-type-icon.is-dir {
  width: 18px;
  height: 13px;
  margin-top: 2px;
  border-radius: 4px;
  background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18);
}

.download-path-type-icon.is-dir::before {
  position: absolute;
  top: -4px;
  left: 2px;
  width: 8px;
  height: 5px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%);
  content: '';
}

.download-path-type-icon.is-file {
  width: 15px;
  height: 18px;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.download-path-type-icon.is-file::after {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 6px;
  height: 6px;
  border-bottom: 1px solid #94a3b8;
  border-left: 1px solid #94a3b8;
  border-radius: 0 4px 0 2px;
  background: linear-gradient(135deg, #e2e8f0 0%, #ffffff 100%);
  content: '';
}

.download-path-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-path-node.is-dir .download-path-name {
  color: #1d4ed8;
  font-weight: 700;
}

.download-path-node.is-file .download-path-name {
  color: #475569;
  font-weight: 500;
}
</style>
