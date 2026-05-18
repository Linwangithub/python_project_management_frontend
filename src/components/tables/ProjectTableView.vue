<template>
  <BaseTableView
    :rows="rows"
    :columns="columns"
    :actions-label="actionsLabel"
    :actions-min-width="actionsMinWidth"
    :actions="actions"
    :cell-class-name="resolveCellClass"
    :action-disabled="actionDisabled"
    @action="(code, row) => emit('action', code, row)"
  >
    <template #cell-name="{ row }">
      <div class="project-name-cell">
        <span class="project-dot"></span>
        <span class="project-name-text">{{ row.name || '-' }}</span>
      </div>
    </template>

    <template #cell-description="{ row }">
      <span class="desc-text" :title="row.description || ''">{{ row.description || '未填写' }}</span>
    </template>

    <template #cell-serverIp="{ row }">
      <span class="field-value server-ip-value">{{ row.serverIp || '-' }}</span>
    </template>

    <template #cell-nginxInfo="{ row }">
      <InfoStack :items="nginxItems(row)" tone="nginx" empty-text="未配置" />
    </template>

    <template #cell-databaseInfo="{ row }">
      <InfoStack :items="databaseItems(row)" tone="database" empty-text="未配置" />
    </template>

    <template #cell-runningPort="{ row }">
      <span class="field-value running-port-value" :class="{ empty: !row.runningPort }">{{ row.runningPort || '-' }}</span>
    </template>

    <template #cell-serviceStatus="{ row }">
      <button
        class="status-pill service-check-btn"
        :class="[serviceStatusClass(row), { checking: isServiceChecking(row) }]"
        :disabled="isServiceChecking(row)"
        @click.stop="emit('service-check', row)"
      >
        {{ serviceStatusText(row) }}
      </button>
    </template>

    <template #cell-projectStatus="{ row }">
      <el-tooltip :content="row.projectStatusDetail || '点击检测当前项目状态'" placement="top" :disabled="!row.projectStatusDetail">
        <button
          class="health-btn"
          :class="healthStatusClass(row)"
          :disabled="isHealthChecking(row)"
          @click.stop="emit('health-check', row)"
        >
          {{ healthStatusText(row) }}
        </button>
      </el-tooltip>
    </template>
  </BaseTableView>
</template>

<script setup>
import { h } from 'vue'
import BaseTableView from '@/components/base/BaseTableView.vue'

const InfoStack = (props) => {
  const rawItems = Array.isArray(props.items) ? props.items : []
  const toneClass = props.tone ? ` ${props.tone}` : ''
  const hasValue = rawItems.some((item) => item && item.value)
  if (!hasValue) {
    return h('span', { class: `empty-info${toneClass}` }, props.emptyText || '未配置')
  }
  return h('div', { class: `info-stack${toneClass}` }, rawItems.map((item) => {
    const value = item && item.value ? item.value : '未配置'
    const emptyClass = item && item.value ? '' : ' empty'
    return h('div', { class: `info-line${emptyClass}` }, `${item.label}: ${value}`)
  }))
}

InfoStack.props = ['items', 'emptyText', 'tone']

const props = defineProps(['rows', 'columns', 'actionsLabel', 'actionsMinWidth', 'actions', 'actionDisabled', 'healthCheckingIds', 'serviceCheckingIds'])

const emit = defineEmits(['action', 'health-check', 'service-check'])

const nginxItems = (row) => [
  { label: 'IP', value: row.nginxServerIp || '' },
  { label: '前端', value: row.frontendPort || '' },
  { label: '后端', value: row.backendDeployPort || '' },
]

const databaseItems = (row) => [
  { label: 'IP', value: row.databaseHost || '' },
  { label: '库', value: row.databaseName || '' },
]


const isHealthChecking = (row) => {
  const ids = Array.isArray(props.healthCheckingIds) ? props.healthCheckingIds.map((item) => Number(item)) : []
  return ids.includes(Number(row?.id || 0))
}

const isServiceChecking = (row) => {
  const ids = Array.isArray(props.serviceCheckingIds) ? props.serviceCheckingIds.map((item) => Number(item)) : []
  return ids.includes(Number(row?.id || 0))
}

const serviceStatusText = (row) => {
  if (isServiceChecking(row)) return '检测中...'
  return row?.serviceStatus || row?.status || '已停止'
}

const serviceStatusClass = (row) => {
  const value = String(row?.serviceStatus || row?.status || '').trim()
  return value === '运行中' ? 'running' : 'stopped'
}

const healthStatusText = (row) => {
  if (isHealthChecking(row)) return '检测中...'
  const value = String(row?.projectStatus || '').trim()
  return value && value !== '未检测' ? value : '检测状态'
}

const healthStatusClass = (row) => {
  if (isHealthChecking(row)) return 'checking'
  const value = String(row?.projectStatus || '').trim()
  if (value === '正常') return 'normal'
  if (value === '异常') return 'abnormal'
  return 'unchecked'
}

const resolveCellClass = (columnKey, row) => {
  if (columnKey === 'serviceStatus' || columnKey === 'status') {
    return row.serviceStatus === '运行中' || row.status === '运行中' ? 'st-run' : 'st-stop'
  }
  if (columnKey === 'projectStatus') {
    return row.projectStatus === '异常' ? 'st-error' : 'st-ok'
  }
  return undefined
}
</script>

<style scoped lang="scss">
.project-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.project-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  flex: 0 0 auto;
}

.project-name-text {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.desc-text {
  display: inline-block;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.field-value {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.server-ip-value {
  color: #1d4ed8;
}

.running-port-value {
  color: #ea580c;
}

.field-value.empty {
  color: #64748b;
  font-weight: 800;
}

.empty-info {
  color: #6b7280;
  font-size: 12px;
  font-weight: 650;
}

.info-stack {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.28;
}

:deep(.info-line) {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.01em;
}

:deep(.info-stack.nginx .info-line) {
  color: #1e40af !important;
}

:deep(.info-stack.database .info-line) {
  color: #4338ca !important;
}

:deep(.info-line.empty),
.empty-info {
  color: #94a3b8 !important;
  font-size: 12px;
  font-weight: 800;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  min-height: 24px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  font-family: inherit;
  border: 1px solid transparent;
}

.service-check-btn {
  cursor: pointer;
}

.service-check-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14);
}

.service-check-btn:disabled {
  opacity: 0.72;
  cursor: wait;
}

.status-pill.running,
.status-pill.normal {
  color: #047857;
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.status-pill.stopped {
  color: #475569;
  background: #f8fafc;
  border-color: #cbd5e1;
}

.status-pill.abnormal {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
}

.status-pill.checking {
  color: #b45309;
  background: #fffbeb;
  border-color: #fcd34d;
}

.health-btn {
  min-width: 74px;
  min-height: 26px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.health-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14);
}

.health-btn:disabled {
  opacity: 0.68;
  cursor: wait;
}

.health-btn.normal {
  color: #047857;
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.health-btn.abnormal {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
}

.health-btn.checking {
  color: #b45309;
  background: #fffbeb;
  border-color: #fcd34d;
}

.health-btn.unchecked {
  color: #374151;
  background: #ffffff;
  border-color: #cbd5e1;
}

:deep(.st-run) {
  color: #047857;
  font-weight: 800;
}

:deep(.st-stop) {
  color: #475569;
  font-weight: 800;
}

:deep(.st-ok) {
  color: #047857;
  font-weight: 800;
}

:deep(.st-error) {
  color: #dc2626;
  font-weight: 800;
}
</style>
