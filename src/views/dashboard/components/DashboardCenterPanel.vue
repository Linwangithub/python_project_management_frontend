<template>
  <section class="center-wrap">
    <div class="toolbar">
      <template v-for="section in activeToolbarSections" :key="section.type">
        <div v-if="section.type === 'preset-selector'" class="tool-group">
          <el-select :model-value="currentPreset" size="small" style="width: 120px" @update:model-value="emit('preset-change', $event)">
            <el-option v-for="preset in viewPresetsConfig" :key="preset.key" :label="preset.label" :value="preset.key" />
          </el-select>
        </div>

        <div v-else-if="section.type === 'member-filter'" class="tool-group">
          <el-button
            v-for="member in memberFilterOptions"
            :key="member.value"
            size="small"
            class="chip"
            :type="currentMemberFilter === member.value ? 'primary' : 'default'"
            @click="emit('member-filter-change', member.value)"
          >
            {{ member.label }}
          </el-button>
        </div>

        <div v-else-if="section.type === 'status-filter'" class="tool-group">
          <el-button
            v-for="status in statusFilterOptions"
            :key="status.value"
            size="small"
            class="chip"
            :type="statusFilter === status.value ? status.activeType : 'default'"
            @click="emit('status-filter-toggle', status.value)"
          >
            {{ status.label }}
          </el-button>
        </div>

        <el-button v-else-if="section.type === 'create-button'" size="small" type="primary" @click="emit('create')">{{ toolbarText.createButton }}</el-button>
        <el-button v-else-if="section.type === 'sync-project-button'" size="small" type="success" plain @click="emit('sync-project')">{{ toolbarText.syncProjectButton }}</el-button>
      </template>
    </div>

    <div class="tip-row">
      <span>{{ centerTitle }}</span>
      <span class="muted">{{ centerHint }}</span>
    </div>

    <div class="view-wrap" v-loading="loading">
      <ProjectTableView
        v-if="activeMenu === 'projects'"
        :rows="filteredProjects"
        :columns="projectColumnsForView"
        :actions-label="projectActionsLabel"
        :actions-min-width="projectActionsMinWidth"
        :actions="projectActions"
        :action-disabled="isProjectActionDisabled"
        :health-checking-ids="projectHealthCheckingIds"
        :service-checking-ids="projectServiceCheckingIds"
        @action="(code, row) => emit('project-action', code, row)"
        @health-check="(row) => emit('project-health-check', row)"
        @service-check="(row) => emit('project-service-check', row)"
      />

      <UserTableView
        v-else-if="activeMenu === 'users'"
        :rows="filteredUsers"
        :columns="userColumnsForView"
        :actions-label="userActionsLabel"
        :actions-min-width="userActionsMinWidth"
        :actions="userActions"
        @action="(code, row) => emit('user-action', code, row)"
      />

      <EnvTableView
        v-else-if="activeMenu === 'envs'"
        :rows="envs"
        :columns="envColumnsForView"
        :actions-label="envActionsLabel"
        :actions-min-width="envActionsMinWidth"
        :actions="envActions"
        @action="(code, row) => emit('env-action', code, row)"
      />

      <ServerTableView
        v-else
        :rows="servers"
        :columns="serverColumnsForView"
        :actions-label="serverActionsLabel"
        :actions-min-width="serverActionsMinWidth"
        :actions="serverActions"
        @action="(code, row) => emit('server-action', code, row)"
      />
    </div>
  </section>
</template>

<script setup>
import { viewPresetsConfig } from '@/config/preset/view.presets.config'
import { statusFilterOptions } from '@/config/filter/filter.config'
import { PROJECT_BUSY_STATUS_TEXTS } from '@/config/project/project.workflow.config'
import { toolbarText } from '@/config/toolbar/toolbar.config'
import ProjectTableView from '@/components/tables/ProjectTableView.vue'
import UserTableView from '@/components/tables/UserTableView.vue'
import EnvTableView from '@/components/tables/EnvTableView.vue'
import ServerTableView from '@/components/tables/ServerTableView.vue'

const props = defineProps([
  'loading',
  'activeMenu',
  'currentPreset',
  'currentMemberFilter',
  'memberFilterOptions',
  'activeToolbarSections',
  'statusFilter',
  'centerTitle',
  'centerHint',
  'filteredProjects',
  'filteredUsers',
  'envs',
  'servers',
  'projectColumnsForView',
  'userColumnsForView',
  'envColumnsForView',
  'serverColumnsForView',
  'projectActionsLabel',
  'projectActionsMinWidth',
  'projectActions',
  'projectBusyIds',
  'projectHealthCheckingIds',
  'projectServiceCheckingIds',
  'userActionsLabel',
  'userActionsMinWidth',
  'userActions',
  'envActionsLabel',
  'envActionsMinWidth',
  'envActions',
  'serverActionsLabel',
  'serverActionsMinWidth',
  'serverActions',
])

const isProjectActionDisabled = (action, row) => {
  const id = Number(row?.id || 0)
  const busyIds = Array.isArray(props.projectBusyIds) ? props.projectBusyIds.map((item) => Number(item)) : []
  if (id && busyIds.includes(id)) return true
  return PROJECT_BUSY_STATUS_TEXTS.includes(String(row?.status || '').trim())
}


const emit = defineEmits([
  'preset-change',
  'member-filter-change',
  'status-filter-toggle',
  'create',
  'sync-project',
  'project-action',
  'project-health-check',
  'project-service-check',
  'user-action',
  'env-action',
  'server-action',
])
</script>

<style scoped lang="scss">
.center-wrap {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  gap: 8px;
}

.tip-row {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.muted {
  color: #90a5c4;
}

.view-wrap {
  min-height: 0;
  overflow: hidden;
}
</style>
