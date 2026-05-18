<template>
  <el-dialog
    :model-value="modelValue"
    title="项目操作日志"
    width="900px"
    class="project-log-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="log-body">
      <div class="log-hero">
        <div>
          <div class="hero-label">项目名称</div>
          <div class="hero-title">{{ logData?.project_name || '-' }}</div>
        </div>
        <el-tag effect="dark">共 {{ logItems.length }} 条记录</el-tag>
      </div>

      <el-empty v-if="!logItems.length" description="暂无操作日志" />

      <el-timeline v-else class="log-timeline">
        <el-timeline-item
          v-for="item in logItems"
          :key="item.id"
          placement="top"
          type="primary"
        >
          <el-collapse class="log-item-collapse">
            <el-collapse-item :name="`log-${item.id}`">
              <template #title>
                <div class="log-line-title">
                  <span class="line-time">{{ formatTime(item.created_at) }}</span>
                  <span class="line-action">{{ item.action_label || item.action }}</span>
                  <span class="line-operator">操作人：{{ item.operator_name || '-' }}</span>
                </div>
              </template>

              <div class="log-card">
                <div v-if="changedFields(item).length" class="change-box">
                  <div class="block-title">配置变更</div>
                  <div v-for="change in changedFields(item)" :key="change.key" class="change-row">
                    <div class="change-label">{{ change.label || change.key }}</div>
                    <div v-if="change.key === 'nginx_config_text'" class="change-values nginx-config-change">
                      <el-collapse class="inline-config-collapse">
                        <el-collapse-item title="点击查看Nginx详细配置" :name="`nginx-${item.id}-${change.key}`">
                          <div class="nginx-config-compare">
                            <div>
                              <div class="config-subtitle">修改前</div>
                              <pre class="config-light-pre">{{ displayValue(change.before) }}</pre>
                            </div>
                            <div>
                              <div class="config-subtitle">修改后</div>
                              <pre class="config-light-pre">{{ displayValue(change.after) }}</pre>
                            </div>
                          </div>
                        </el-collapse-item>
                      </el-collapse>
                    </div>
                    <div v-else class="change-values">
                      <span class="old-value">{{ displayValue(change.before) }}</span>
                      <span class="arrow">&rarr;</span>
                      <span class="new-value">{{ displayValue(change.after) }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="actionRows(item).length" class="actions-box">
                  <div class="actions-title">Actions 动作</div>
                  <pre class="actions-pre">{{ actionRows(item).join('\n') }}</pre>
                </div>

                <el-collapse v-if="snapshotRows(item).length" class="snapshot-collapse">
                  <el-collapse-item title="当前版本完整配置" name="detail">
                    <div class="snapshot-grid">
                      <div v-for="row in snapshotRows(item)" :key="row.key" class="snapshot-item" :class="{ wide: row.wide }">
                        <div class="snapshot-label">{{ row.label }}</div>
                        <pre v-if="row.pre" class="snapshot-pre">{{ row.value }}</pre>
                        <div v-else class="snapshot-value">{{ row.value }}</div>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  logData: { type: Object, default: () => ({ data: [] }) },
})

const emit = defineEmits(['update:modelValue'])

const fieldLabels = {
  id: '项目ID',
  name: '项目名称',
  description: '项目描述',
  owner: '所属人员',
  server_ip: '项目服务器IP',
  backend_path: '后端代码位置',
  frontend_path: '前端代码位置',
  entry_file_path: '项目入口文件位置',
  conda_env_name: 'Conda环境',
  conda_env_path: 'Conda环境位置',
  python_version: 'Python版本',
  database_name: '数据库名称',
  database_host: '数据库IP',
  database_port: '数据库端口',
  database_user: '数据库账号',
  database_password: '数据库密码',
  nginx_server_ip: 'Nginx服务器IP',
  nginx_conf_path: 'Nginx配置文件路径',
  frontend_port: 'Nginx前端端口',
  backend_dev_port: '后端开发端口',
  backend_deploy_port: '后端部署端口',
  nginx_config_text: 'Nginx详细配置',
  dev_start_command: '开发启动命令',
  deploy_start_command: '部署启动命令',
  status: '项目状态',
  auto_start: '是否开机自启',
  remark: '备注',
  created_at: '创建时间',
  updated_at: '更新时间',
  target_dir: '目标目录',
  target_server_ip: '目标服务器IP',
  message: '执行结果',
  execution_logs: '执行日志',
}

const hiddenKeys = new Set(['owner_id', 'server_id', 'updated_fields', 'actions', 'execution_logs'])

const logItems = computed(() => props.logData?.data || [])

const formatTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '空'
  if (Array.isArray(value)) return value.join('\n')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const changedFields = (item) => item?.detail?.changed_fields || []

const actionRows = (item) => {
  const detail = item?.detail || {}
  const rows = detail.actions || detail.execution_logs || []
  if (Array.isArray(rows)) return rows.map((row) => displayValue(row)).filter((row) => row !== '\u7a7a')
  const text = displayValue(rows)
  return text === '\u7a7a' ? [] : [text]
}

const rowsFromObject = (obj) => {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([key, value]) => !hiddenKeys.has(key) && displayValue(value) !== '空')
    .map(([key, value]) => {
      const text = displayValue(value)
      return {
        key,
        label: fieldLabels[key] || key,
        value: text,
        pre: text.includes('\n') || key.includes('config') || key.includes('logs') || text.length > 120,
        wide: text.includes('\n') || text.length > 80,
      }
    })
}

const snapshotRows = (item) => {
  const rows = []
  rows.push(...rowsFromObject(item?.after_data))
  const detail = { ...(item?.detail || {}) }
  delete detail.changed_fields
  delete detail.actions
  delete detail.execution_logs
  delete detail.updated_fields
  rows.push(...rowsFromObject(detail))
  return rows
}
</script>

<style scoped lang="scss">
.log-body {
  min-height: 260px;
}

.log-hero {
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 16px;
  color: #eaf2ff;
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-label {
  color: #bfdbfe;
  font-size: 12px;
  margin-bottom: 6px;
}

.hero-title {
  font-size: 22px;
  font-weight: 900;
}

.log-timeline {
  padding: 4px 8px 0 4px;
}

.log-card {
  border: 1px solid #dbe6f5;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.log-item-collapse {
  border: none;
}

.log-line-title {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.line-time {
  color: #2563eb;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  font-weight: 900;
}

.line-action {
  color: #0f172a;
  font-size: 15px;
  font-weight: 1000;
}

.line-operator {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.change-box {
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px;
  margin-bottom: 10px;
}

.block-title {
  font-size: 13px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 8px;
}

.change-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 10px;
  align-items: start;
  padding: 8px 0;
  border-top: 1px dashed #dbe6f5;
}

.change-row:first-of-type {
  border-top: none;
}

.change-label {
  color: #475569;
  font-weight: 800;
}

.change-values {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.old-value,
.new-value {
  padding: 7px 9px;
  border-radius: 10px;
  word-break: break-all;
  white-space: pre-wrap;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
}

.old-value {
  background: #fff1f2;
  color: #9f1239;
}

.new-value {
  background: #ecfdf5;
  color: #047857;
}

.arrow {
  text-align: center;
  color: #2563eb;
  font-weight: 900;
}

.snapshot-collapse {
  border-top: 1px solid #eef2f7;
  margin-top: 8px;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.snapshot-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
  background: #f8fafc;
}

.snapshot-item.wide {
  grid-column: 1 / -1;
}

.snapshot-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 800;
  margin-bottom: 6px;
}

.snapshot-value {
  color: #0f172a;
  font-weight: 800;
  word-break: break-all;
}

.actions-box {
  margin-bottom: 10px;
}

.actions-title {
  color: #0f172a;
  font-size: 18px;
  font-weight: 1000;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.actions-pre {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  overflow: auto;
  white-space: pre-wrap;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  max-height: 220px;
}

.nginx-config-change {
  display: block;
}

.inline-config-collapse {
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}


.inline-config-collapse :deep(.el-collapse-item__header) {
  padding: 0 16px;
}

.inline-config-collapse :deep(.el-collapse-item__content) {
  padding: 14px 16px 16px;
}

.nginx-config-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.config-subtitle {
  color: #475569;
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 6px;
}

.config-light-pre {
  margin: 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  overflow: auto;
  white-space: pre-wrap;
  max-height: 220px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.snapshot-pre {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  background: #f1f5f9;
  border: 1px solid #dbe6f5;
  color: #0f172a;
  overflow: auto;
  white-space: pre-wrap;
  max-height: 260px;
}
</style>
