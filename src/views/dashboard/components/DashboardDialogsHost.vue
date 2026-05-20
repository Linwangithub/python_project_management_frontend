<template>
  <ProjectDetailDrawer
    :model-value="projectDrawerVisible"
    :project="selectedProject"
    :detail="selectedProjectDetail"
    :loading="projectDetailLoading"
    :title="projectDetailDrawerTitle"
    :size="projectDetailDrawerSize"
    :fields="projectDetailFieldsForView"
    @update:model-value="emit('update:projectDrawerVisible', $event)"
  />

  <ProjectLogDialog
    :model-value="projectLogDialogVisible"
    :loading="projectLogLoading"
    :log-data="projectLogData"
    @update:model-value="emit('update:projectLogDialogVisible', $event)"
  />

  <CreateProjectDialog
    :model-value="projectDialogVisible"
    :width="projectCreateDialogWidth"
    :fields="createProjectDialogFieldsForView"
    :form="projectCreateForm"
    @update:model-value="emit('update:projectDialogVisible', $event)"
    @confirm="emit('confirmCreateProject')"
    @name-blur="emit('create-project-name-blur')"
    @database-check="emit('create-project-db-check')"
    @nginx-check="emit('create-project-nginx-check')"
    @nginx-port-blur="emit('create-project-nginx-port-blur', $event)"
  />

  <SyncProjectDialog
    :model-value="syncProjectDialogVisible"
    :width="syncProjectDialogWidth"
    :fields="syncProjectFieldsForView"
    :form="syncProjectForm"
    @update:model-value="emit('update:syncProjectDialogVisible', $event)"
    @confirm="emit('confirmSyncProject')"
    @server-change="emit('syncProjectServerChange')"
    @path-change="emit('syncProjectPathChange', $event)"
    @entry-path-change="emit('syncProjectEntryPathChange', $event)"
    @conda-check="emit('syncProjectCondaCheck')"
    @database-check="emit('syncProjectDbCheck')"
    @nginx-check="emit('syncProjectNginxCheck')"
    @nginx-port-blur="emit('syncProjectNginxPortBlur', $event)"
  />

  <ProjectSettingDialog
    :model-value="settingDialogVisible"
    :width="settingDialogWidth"
    :fields="settingDialogFieldsForView"
    :form="settingForm"
    @update:model-value="emit('update:settingDialogVisible', $event)"
    @confirm="emit('saveProjectSetting')"
  />

  <CopyProjectDialog
    :model-value="copyDialogVisible"
    :width="copyDialogWidth"
    :fields="copyDialogFieldsForView"
    :form="copyForm"
    @update:model-value="emit('update:copyDialogVisible', $event)"
    @confirm="emit('confirmCopyProject')"
  />

  <ExportProjectDialog
    :model-value="exportDialogVisible"
    :width="exportDialogWidth"
    :fields="exportDialogFieldsForView"
    :form="exportForm"
    @update:model-value="emit('update:exportDialogVisible', $event)"
    @confirm="emit('confirmExportProject')"
  />

  <ProjectToolDialog
    :model-value="toolDialogVisible"
    :title="toolDialogTitle"
    :width="toolDialogWidth"
    :buttons="toolButtonsForView"
    :form="toolForm"
    @update:model-value="emit('update:toolDialogVisible', $event)"
    @tool-click="emit('projectToolClick', $event)"
  />

  <CreateUserDialog
    :model-value="userDialogVisible"
    :width="userCreateDialogWidth"
    :fields="createUserDialogFieldsForView"
    :form="createUserForm"
    @update:model-value="emit('update:userDialogVisible', $event)"
    @confirm="emit('confirmCreateUser')"
  />

  <CreateEnvDialog
    :model-value="envDialogVisible"
    :width="envCreateDialogWidth"
    :fields="createEnvDialogFieldsForView"
    :form="envCreateForm"
    @update:model-value="emit('update:envDialogVisible', $event)"
    @confirm="emit('confirmCreateEnv')"
  />

  <CreateServerDialog
    :model-value="serverDialogVisible"
    :width="serverCreateDialogWidth"
    :fields="createServerDialogFieldsForView"
    :form="serverCreateForm"
    @update:model-value="emit('update:serverDialogVisible', $event)"
    @confirm="emit('confirmCreateServer')"
  />

  <CreateSessionDialog
    :model-value="sessionDialogVisible"
    :width="sessionDialogWidth"
    :fields="sessionDialogFieldsForView"
    :form="createSessionForm"
    @update:model-value="emit('update:sessionDialogVisible', $event)"
    @confirm="emit('confirmCreateSession')"
  />

  <DeleteUserDialog
    :model-value="deleteUserDialogVisible"
    :title="userDeleteConfirmTitle"
    :text="userDeleteConfirmText"
    :migrate="deleteUserMigrate"
    @update:model-value="emit('update:deleteUserDialogVisible', $event)"
    @update:migrate="emit('update:deleteUserMigrate', $event)"
    @confirm="emit('confirmDeleteUser')"
  />

  <ServerUserDialog
    :model-value="serverAddUserDialogVisible"
    title="增加用户"
    :width="serverUserDialogWidth"
    :fields="serverAddUserDialogFieldsForView"
    :form="serverAddUserForm"
    @update:model-value="emit('update:serverAddUserDialogVisible', $event)"
    @confirm="emit('confirmAddServerUser')"
  />

  <ServerUserDialog
    :model-value="serverDeleteUserDialogVisible"
    title="删除用户"
    :width="serverUserDialogWidth"
    :fields="serverDeleteUserDialogFieldsForView"
    :form="serverDeleteUserForm"
    :danger-text="serverDeleteDangerText"
    @update:model-value="emit('update:serverDeleteUserDialogVisible', $event)"
    @confirm="emit('confirmDeleteServerUser')"
  />
</template>

<script setup>
import ProjectDetailDrawer from '@/components/dialogs/ProjectDetailDrawer.vue'
import ProjectLogDialog from '@/components/dialogs/ProjectLogDialog.vue'
import CreateProjectDialog from '@/components/dialogs/CreateProjectDialog.vue'
import SyncProjectDialog from '@/components/dialogs/SyncProjectDialog.vue'
import ProjectSettingDialog from '@/components/dialogs/ProjectSettingDialog.vue'
import CopyProjectDialog from '@/components/dialogs/CopyProjectDialog.vue'
import ExportProjectDialog from '@/components/dialogs/ExportProjectDialog.vue'
import ProjectToolDialog from '@/components/dialogs/ProjectToolDialog.vue'
import CreateUserDialog from '@/components/dialogs/CreateUserDialog.vue'
import CreateEnvDialog from '@/components/dialogs/CreateEnvDialog.vue'
import CreateServerDialog from '@/components/dialogs/CreateServerDialog.vue'
import CreateSessionDialog from '@/components/dialogs/CreateSessionDialog.vue'
import DeleteUserDialog from '@/components/dialogs/DeleteUserDialog.vue'
import ServerUserDialog from '@/components/dialogs/ServerUserDialog.vue'

defineProps([
  'projectDrawerVisible',
  'selectedProject',
  'projectLogData',
  'projectLogLoading',
  'projectLogDialogVisible',
  'projectDetailLoading',
  'selectedProjectDetail',
  'projectDetailDrawerTitle',
  'projectDetailDrawerSize',
  'projectDetailFieldsForView',
  'projectDialogVisible',
  'projectCreateDialogWidth',
  'createProjectDialogFieldsForView',
  'projectCreateForm',
  'syncProjectDialogVisible',
  'syncProjectDialogWidth',
  'syncProjectForm',
  'syncProjectFieldsForView',
  'settingDialogVisible',
  'settingDialogWidth',
  'settingDialogFieldsForView',
  'settingForm',
  'copyDialogVisible',
  'copyDialogWidth',
  'copyDialogFieldsForView',
  'copyForm',
  'exportDialogVisible',
  'exportDialogWidth',
  'exportDialogFieldsForView',
  'exportForm',
  'toolDialogVisible',
  'toolDialogTitle',
  'toolDialogWidth',
  'toolButtonsForView',
  'toolForm',
  'userDialogVisible',
  'userCreateDialogWidth',
  'createUserDialogFieldsForView',
  'createUserForm',
  'envDialogVisible',
  'envCreateDialogWidth',
  'createEnvDialogFieldsForView',
  'envCreateForm',
  'serverDialogVisible',
  'serverCreateDialogWidth',
  'createServerDialogFieldsForView',
  'serverCreateForm',
  'sessionDialogVisible',
  'sessionDialogWidth',
  'sessionDialogFieldsForView',
  'createSessionForm',
  'deleteUserDialogVisible',
  'userDeleteConfirmTitle',
  'userDeleteConfirmText',
  'deleteUserMigrate',
  'serverAddUserDialogVisible',
  'serverDeleteUserDialogVisible',
  'serverUserDialogWidth',
  'serverAddUserDialogFieldsForView',
  'serverDeleteUserDialogFieldsForView',
  'serverAddUserForm',
  'serverDeleteUserForm',
  'serverDeleteDangerText',
])

const emit = defineEmits([
  'update:projectDrawerVisible',
  'update:projectLogDialogVisible',
  'update:projectDialogVisible',
  'update:syncProjectDialogVisible',
  'update:settingDialogVisible',
  'update:copyDialogVisible',
  'update:exportDialogVisible',
  'update:toolDialogVisible',
  'update:userDialogVisible',
  'update:envDialogVisible',
  'update:serverDialogVisible',
  'update:sessionDialogVisible',
  'update:deleteUserDialogVisible',
  'update:deleteUserMigrate',
  'update:serverAddUserDialogVisible',
  'update:serverDeleteUserDialogVisible',
  'confirmCreateProject',
  'confirmSyncProject',
  'syncProjectServerChange',
  'syncProjectPathChange',
  'syncProjectEntryPathChange',
  'syncProjectCondaCheck',
  'syncProjectDbCheck',
  'syncProjectNginxCheck',
  'syncProjectNginxPortBlur',
  'create-project-name-blur',
  'create-project-db-check',
  'create-project-nginx-check',
  'create-project-nginx-port-blur',
  'saveProjectSetting',
  'confirmCopyProject',
  'confirmExportProject',
  'projectToolClick',
  'confirmCreateUser',
  'confirmCreateEnv',
  'confirmCreateServer',
  'confirmCreateSession',
  'confirmDeleteUser',
  'confirmAddServerUser',
  'confirmDeleteServerUser',
])
</script>
