<template>
  <el-dialog
    :model-value="modelValue"
    :title="syncProjectDialogComponentText.title"
    :width="width || '920px'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-row :gutter="12">
        <el-col v-for="field in fields" v-show="field.visible !== false" :key="field.key" :span="field.span || 24">
          <el-form-item :label="field.label">
            <el-input
              v-if="field.component === 'input'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              @blur="handleFieldBlur(field)"
            />

            <el-input
              v-else-if="field.component === 'password'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              type="password"
              show-password
            />

            <el-input
              v-else-if="field.component === 'textarea'"
              class="sync-textarea"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              type="textarea"
              :rows="field.rows || 2"
            />

            <el-select
              v-else-if="field.component === 'select'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :clearable="field.clearable !== false"
              filterable
              style="width: 100%"
              @change="handleFieldChange(field)"
              @clear="handleFieldChange(field)"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="typeof opt === 'string' ? opt : opt.value"
                :label="typeof opt === 'string' ? opt : (opt.selectedLabel || opt.label)"
                :value="typeof opt === 'string' ? opt : opt.value"
                :disabled="typeof opt !== 'string' && opt.disabled"
              >
                <span v-if="typeof opt !== 'string' && opt.optionLabel">{{ opt.optionLabel }}</span>
              </el-option>
            </el-select>

            <el-select
              v-else-if="field.component === 'selectCreate'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              style="width: 100%"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="typeof opt === 'string' ? opt : opt.value"
                :label="typeof opt === 'string' ? opt : opt.label"
                :value="typeof opt === 'string' ? opt : opt.value"
              />
            </el-select>

            <el-cascader
              v-else-if="field.component === 'projectPathCascader'"
              v-model="form.projectPathCascaderValue"
              class="full-width"
              :disabled="field.disabled"
              :options="field.options || []"
              :props="projectPathProps"
              clearable
              filterable
              :show-all-levels="false"
              :placeholder="field.placeholder"
              @change="handleProjectPathChange"
              @clear="handleProjectPathClear"
            />

            <el-cascader
              v-else-if="field.component === 'entryPathCascader'"
              v-model="form.entryPathCascaderValue"
              class="full-width"
              :disabled="field.disabled"
              :options="field.options || []"
              :props="entryPathProps"
              clearable
              filterable
              :show-all-levels="false"
              :placeholder="field.placeholder"
              @change="handleEntryPathChange"
              @clear="handleEntryPathClear"
            />

            <div
              v-else-if="field.component === 'nginxConfChooser'"
              class="nginx-conf-chooser"
              :class="{ 'is-disabled': field.disabled }"
            >
              <div v-if="field.loading" class="nginx-conf-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>{{ syncProjectDialogComponentText.nginxLoading }}</span>
              </div>

              <el-select
                v-model="form.nginxExistingConfPath"
                :disabled="field.disabled"
                clearable
                filterable
                :placeholder="syncProjectDialogComponentText.chooseExistingConfPlaceholder"
                style="width: 100%"
                @change="handleExistingConfChange"
                @clear="handleExistingConfChange('')"
              >
                <el-option
                  v-for="opt in field.options || []"
                  :key="typeof opt === 'string' ? opt : opt.value"
                  :label="typeof opt === 'string' ? opt : opt.label"
                  :value="typeof opt === 'string' ? opt : opt.value"
                  :disabled="typeof opt !== 'string' && opt.disabled"
                />
              </el-select>
              <div class="field-hint" :class="form.nginxConfPath ? 'success' : 'warning'">
                {{ form.nginxConfPath ? syncProjectDialogComponentText.selectedConf(form.nginxConfPath) : syncProjectDialogComponentText.existingConfOnlyTip }}
              </div>
            </div>

            <el-switch
              v-else-if="field.component === 'switch'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :active-text="field.activeText || syncProjectDialogComponentText.switchActiveDefault"
              :inactive-text="field.inactiveText || syncProjectDialogComponentText.switchInactiveDefault"
            />

            <el-button
              v-else-if="field.component === 'button'"
              :type="field.buttonType || 'primary'"
              :disabled="field.disabled"
              :loading="field.loading"
              @click="handleButtonClick(field)"
            >
              {{ field.buttonText || syncProjectDialogComponentText.buttonDefault }}
            </el-button>

            <div v-else-if="field.component === 'hint'" class="field-hint" :class="field.hintType || ''">
              {{ field.text }}
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ syncProjectDialogComponentText.cancel }}</el-button>
      <el-button type="primary" :disabled="confirmDisabled" @click="emit('confirm')">{{ syncProjectDialogComponentText.confirmSync }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { syncProjectDialogComponentText } from '@/config/project/project.dialog.messages.config'

const props = defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'server-change',
  'path-change',
  'entry-path-change',
  'conda-check',
  'database-check',
  'nginx-check',
  'nginx-port-blur',
  'nginx-frontend-port-change',
])

const joinLinuxPath = (base, rel) => {
  const left = String(base || '').trim().replace(/\/+$/, '')
  const right = String(rel || '').trim().replace(/^\/+/, '')
  if (!right) return ''
  if (!left) return `/${right}`
  return `${left}/${right}`
}

const confirmDisabled = computed(() => {
  const form = props.form || {}
  if (!String(form.serverIp || '').trim()) return true
  if (!String(form.backendPath || '').trim()) return true
  if (!String(form.entryFilePath || '').trim()) return true
  if (!String(form.name || '').trim()) return true
  if (!form.condaChecked) return true
  if (form.enableDatabase && !form.dbChecked) return true
  if (form.enableDatabase && !String(form.databaseName || '').trim()) return true
  if (form.enableNginx) {
    if (!form.nginxChecked) return true
    if (!String(form.nginxConfPath || '').trim()) return true
    if (!form.nginxFrontendPortChecked || !form.nginxBackendPortChecked) return true
  }
  if (form.syncing) return true
  return false
})

const projectPathProps = {
  lazy: true,
  emitPath: true,
  checkStrictly: true,
  lazyLoad: async (node, resolve) => {
    emit('path-change', { node, resolve })
  },
}

const entryPathProps = {
  lazy: true,
  emitPath: true,
  checkStrictly: false,
  lazyLoad: async (node, resolve) => {
    emit('entry-path-change', { node, resolve })
  },
}

const handleFieldChange = (field) => {
  if (field.key === 'serverIp') {
    emit('server-change')
  }
  if (field.key === 'nginxFrontendPort') {
    emit('nginx-frontend-port-change')
  }
}

const handleFieldBlur = (field) => {
  if (field.key === 'nginxFrontendPort') {
    emit('nginx-port-blur', 'frontend')
  }
  if (field.key === 'nginxBackendPort') {
    emit('nginx-port-blur', 'backend')
  }
}

const handleProjectPathChange = (values) => {
  const list = Array.isArray(values) ? values : []
  const form = props.form || {}
  const last = list.length ? String(list[list.length - 1] || '').trim() : ''
  form.projectRelPath = last
  form.backendPath = joinLinuxPath(form.basePath, last)
  form.entryPathCascaderValue = []
  form.entryRelPath = ''
  form.entryFilePath = ''
  if (last && !String(form.name || '').trim()) {
    form.name = last.split('/').filter(Boolean).pop() || ''
  }
  emit('path-change', { selected: true })
}

const handleProjectPathClear = () => {
  const form = props.form || {}
  form.projectPathCascaderValue = []
  form.projectRelPath = ''
  form.backendPath = ''
  form.entryPathOptions = []
  form.entryPathCascaderValue = []
  form.entryRelPath = ''
  form.entryFilePath = ''
}

const handleEntryPathChange = (values) => {
  const list = Array.isArray(values) ? values : []
  const form = props.form || {}
  const last = list.length ? String(list[list.length - 1] || '').trim() : ''
  form.entryRelPath = last
  form.entryFilePath = joinLinuxPath(form.backendPath, last)
}

const handleEntryPathClear = () => {
  const form = props.form || {}
  form.entryPathCascaderValue = []
  form.entryRelPath = ''
  form.entryFilePath = ''
}

const handleExistingConfChange = (value) => {
  const form = props.form || {}
  form.nginxConfPath = String(value || '').trim()
  form.nginxFrontendPort = ''
  form.nginxBackendPort = ''
  form.nginxSelectedServerBlock = ''
  form.nginxServerPortOptions = []
  form.nginxFrontendPortChecked = false
  form.nginxBackendPortChecked = false
  emit('nginx-frontend-port-change')
}

const handleButtonClick = (field) => {
  if (field.key === 'condaCheck') emit('conda-check')
  if (field.key === 'databaseCheck') emit('database-check')
  if (field.key === 'nginxCheck') emit('nginx-check')
}
</script>

<style scoped lang="scss">
.full-width {
  width: 100%;
}

:deep(.sync-textarea .el-textarea__inner) {
  min-height: 32px !important;
  height: 32px;
  resize: vertical;
  line-height: 20px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.field-hint {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #606266;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.field-hint.success {
  background: #f0f9eb;
  color: #529b2e;
}

.field-hint.warning {
  background: #fdf6ec;
  color: #b88230;
}

.field-hint.danger {
  background: #fef0f0;
  color: #c45656;
}

.nginx-conf-chooser {
  width: 100%;
}

.nginx-conf-chooser.is-disabled {
  opacity: 0.78;
}

.nginx-conf-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecf5ff;
  color: #337ecc;
  font-size: 12px;
}
</style>
