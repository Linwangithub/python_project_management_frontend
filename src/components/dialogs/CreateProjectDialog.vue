<template>
  <el-dialog
    :model-value="modelValue"
    title="新建项目"
    :width="width"
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
            >
              <template v-if="field.loading" #prefix>
                <el-icon class="is-loading">
                  <Loading />
                </el-icon>
              </template>
            </el-input>
            <el-input
              v-else-if="field.component === 'password'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              type="password"
              show-password
            />
            <el-select
              v-else-if="field.component === 'select'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :clearable="!!field.clearable"
              style="width: 100%"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="typeof opt === 'string' ? opt : opt.value"
                :label="typeof opt === 'string' ? opt : opt.label"
                :value="typeof opt === 'string' ? opt : opt.value"
              />
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
            <el-select
              v-else-if="field.component === 'selectOrCreateNginxConf'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              :loading="field.loading"
              style="width: 100%"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="typeof opt === 'string' ? opt : opt.value"
                :label="typeof opt === 'string' ? opt : opt.label"
                :value="typeof opt === 'string' ? opt : opt.value"
              >
                <div class="nginx-conf-option">
                  <span>{{ typeof opt === 'string' ? opt : opt.label }}</span>
                  <el-tag v-if="typeof opt !== 'string' && opt.tag" size="small" effect="plain">
                    {{ opt.tag }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
            <div
              v-else-if="field.component === 'nginxConfChooser'"
              class="nginx-conf-chooser"
              :class="{ 'is-disabled': field.disabled }"
            >
              <div v-if="field.loading" class="nginx-conf-loading">
                <el-icon class="is-loading">
                  <Loading />
                </el-icon>
                <span>正在加载Nginx配置文件...</span>
              </div>

              <el-row class="nginx-conf-row" :gutter="12">
                <el-col class="nginx-conf-col" :span="12">
                  <div
                    class="nginx-conf-card"
                    :class="{ active: hasExistingConfPath, 'is-card-disabled': hasNewConfDraft }"
                  >
                    <div class="nginx-conf-card__title">使用已有配置文件</div>
                    <el-select
                      v-model="form.nginxExistingConfPath"
                      :disabled="field.disabled || hasNewConfDraft"
                      clearable
                      placeholder="请选择已有Nginx配置文件"
                      style="width: 100%"
                      @change="handleExistingConfChange"
                      @clear="handleExistingConfChange('')"
                    >
                      <el-option
                        v-for="opt in field.existingOptions || []"
                        :key="typeof opt === 'string' ? opt : opt.value"
                        :label="typeof opt === 'string' ? opt : opt.label"
                        :value="typeof opt === 'string' ? opt : opt.value"
                        :disabled="typeof opt !== 'string' && opt.disabled"
                      >
                        <div class="nginx-conf-option">
                          <span>{{ typeof opt === 'string' ? opt : opt.label }}</span>
                        </div>
                      </el-option>
                    </el-select>
                    <div class="nginx-conf-preview" :class="{ danger: hasNewConfDraft }">
                      {{ hasNewConfDraft ? '右侧已填写内容，当前区域已置灰并清空不可继续编辑' : '请选择一个已有配置文件路径' }}
                    </div>
                  </div>
                </el-col>

                <el-col class="nginx-conf-col" :span="12">
                  <div
                    class="nginx-conf-card"
                    :class="{ active: hasNewConfDraft, 'is-card-disabled': hasExistingConfPath }"
                  >
                    <div class="nginx-conf-card__title">新建配置文件</div>
                    <el-cascader
                      v-model="form.nginxNewConfDirCascaderValue"
                      class="nginx-dir-cascader"
                      :disabled="field.disabled || hasExistingConfPath"
                      :options="field.dirTreeOptions || []"
                      :props="nginxDirCascaderProps"
                      clearable
                      filterable
                      :show-all-levels="false"
                      placeholder="请选择Nginx配置目录"
                      @change="handleNewConfDirCascaderChange"
                      @clear="handleNewConfDirClear"
                    />
                    <div class="selected-line">
                      <span class="selected-label">已选择：</span>
                      <span class="selected-value">{{ selectedNginxDirText || ' ' }}</span>
                    </div>
                    <el-input
                      v-model="form.nginxNewConfFileName"
                      :disabled="field.disabled || hasExistingConfPath || !form.nginxNewConfDirPath"
                      placeholder="请输入配置文件名，例如 pspm-project.conf"
                      @input="handleNewConfChange"
                    />
                    <div class="nginx-conf-preview" :class="{ danger: isNewConfFileInvalid }">
                      {{ newConfTip }}
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <el-input
              v-else-if="field.component === 'textarea'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              type="textarea"
              :rows="field.rows || 2"
            />
            <el-switch
              v-else-if="field.component === 'switch'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :active-text="field.activeText || '开'"
              :inactive-text="field.inactiveText || '关'"
            />
            <el-popover
              v-else-if="field.component === 'button' && field.key === 'nginxPreview'"
              v-model:visible="previewVisible"
              placement="right-start"
              :width="560"
              trigger="manual"
              :teleported="false"
              popper-class="nginx-preview-popover"
            >
              <template #reference>
                <el-button
                  :type="field.buttonType || 'primary'"
                  :disabled="field.disabled"
                  :loading="field.loading"
                  @click="handleButtonClick(field)"
                >
                  {{ field.buttonText || '预览详细配置' }}
                </el-button>
              </template>
              <div class="nginx-preview-editor">
                <div class="nginx-preview-editor__header">Nginx详细配置</div>
                <el-input
                  v-model="form.nginxPreviewDraft"
                  type="textarea"
                  :rows="18"
                  resize="vertical"
                  placeholder="请确认或调整Nginx server配置"
                />
                <div class="nginx-preview-editor__footer">
                  <el-button @click="cancelPreview">取消</el-button>
                  <el-button type="success" @click="confirmPreview">确认</el-button>
                </div>
              </div>
            </el-popover>
            <el-button
              v-else-if="field.component === 'button'"
              :type="field.buttonType || 'primary'"
              :disabled="field.disabled"
              :loading="field.loading"
              @click="handleButtonClick(field)"
            >
              {{ field.buttonText || '按钮' }}
            </el-button>
            <div v-else-if="field.component === 'hint'" class="field-hint" :class="field.hintType || ''">
              {{ field.text }}
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button
        type="primary"
        :disabled="confirmDisabled"
        @click="emit('confirm')"
      >
        确认创建
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits(['update:modelValue', 'confirm', 'name-blur', 'database-check', 'nginx-check', 'preview-nginx', 'nginx-port-blur'])

const previewVisible = computed({
  get: () => !!(props.form || {}).nginxPreviewVisible,
  set: (value) => {
    const form = props.form || {}
    form.nginxPreviewVisible = !!value
  },
})

const nginxDirCascaderProps = {
  emitPath: true,
  checkStrictly: false,
}

const confirmDisabled = computed(() => {
  const form = props.form || {}
  if (form.enableDatabase && !form.dbChecked) return true
  if (form.enableNginx && !form.nginxChecked) return true
  if (form.enableNginx && !String(form.nginxConfPath || '').trim()) return true
  if (form.nginxChecking) return true
  return false
})

const isValidConfFileName = (value) => {
  const name = String(value || '').trim()
  if (!name) return false
  if (name.includes('/') || name.includes('\\')) return false
  return name.toLowerCase().endsWith('.conf')
}

const joinPath = (dir, file) => {
  const left = String(dir || '').trim().replace(/\/+$/, '')
  const right = String(file || '').trim().replace(/^\/+/, '')
  return left && right ? `${left}/${right}` : ''
}

const isNewConfFileInvalid = computed(() => {
  const form = props.form || {}
  const fileName = String(form.nginxNewConfFileName || '').trim()
  if (!fileName) return false
  return !isValidConfFileName(fileName)
})

const hasExistingConfPath = computed(() => !!String((props.form || {}).nginxExistingConfPath || '').trim())

const hasNewConfDraft = computed(() => {
  const form = props.form || {}
  return !!(
    String(form.nginxNewConfBaseDir || '').trim()
    || String(form.nginxNewConfDirPath || '').trim()
    || String(form.nginxNewConfFileName || '').trim()
  )
})

const newConfTip = computed(() => {
  const form = props.form || {}
  const dir = String(form.nginxNewConfDirPath || '').trim()
  const fileName = String(form.nginxNewConfFileName || '').trim()
  if (!dir && !fileName) return '右侧用于创建新的 .conf 配置文件；与左侧已有配置文件二选一。'
  if (!dir) return '请先选择配置目录。'
  if (!fileName) return `已选择目录：${dir}`
  if (!isValidConfFileName(fileName)) return '文件名必须以 .conf 结尾，且不能包含 / 或 \\。'
  return `最终路径：${joinPath(dir, fileName)}`
})

const selectedNginxDirText = computed(() => {
  return String((props.form || {}).nginxNewConfDirPath || '').trim()
})

const handleExistingConfChange = (value) => {
  const form = props.form || {}
  const path = String(value || '').trim()
  if (path) {
    form.nginxNewConfBaseDir = ''
    form.nginxNewConfDirPath = ''
    form.nginxNewConfDirCascaderValue = []
    form.nginxNewConfFileName = ''
  }
  form.nginxConfPath = path
}

const handleNewConfDirCascaderChange = (value) => {
  const form = props.form || {}
  const values = Array.isArray(value) ? value : []
  form.nginxNewConfDirCascaderValue = values
  const last = values.length ? String(values[values.length - 1] || '').trim() : ''
  form.nginxNewConfBaseDir = values.length ? String(values[0] || '').trim() : ''
  form.nginxNewConfDirPath = last
  if (!last) {
    form.nginxNewConfFileName = ''
    form.nginxConfPath = ''
  }
  handleNewConfChange()
}

const handleNewConfDirClear = () => {
  const form = props.form || {}
  form.nginxNewConfDirCascaderValue = []
  form.nginxNewConfBaseDir = ''
  form.nginxNewConfDirPath = ''
  form.nginxNewConfFileName = ''
  form.nginxConfPath = ''
  handleNewConfChange()
}

const handleNewConfChange = () => {
  const form = props.form || {}
  const baseDir = String(form.nginxNewConfBaseDir || '').trim()
  const dirPath = String(form.nginxNewConfDirPath || '').trim()
  const fileName = String(form.nginxNewConfFileName || '').trim()
  if (baseDir || dirPath || fileName) {
    form.nginxExistingConfPath = ''
  }
  if (dirPath && isValidConfFileName(fileName)) {
    form.nginxConfPath = joinPath(dirPath, fileName)
  } else {
    form.nginxConfPath = ''
  }
}

const previewText = computed(() => String((props.form || {}).nginxPreviewText || ''))

const handleFieldBlur = (field) => {
  if (field.key === 'name') {
    emit('name-blur')
    return
  }
  if (field.key === 'nginxFrontendPort') {
    emit('nginx-port-blur', 'frontend')
    return
  }
  if (field.key === 'nginxBackendPort') {
    emit('nginx-port-blur', 'backend')
  }
}

const handleButtonClick = (field) => {
  if (field.key === 'databaseCheck') {
    emit('database-check')
    return
  }
  if (field.key === 'nginxCheck') {
    emit('nginx-check')
    return
  }
  if (field.key === 'nginxPreview') {
    const form = props.form || {}
    form.nginxPreviewDraft = String(form.nginxPreviewText || previewText.value || '')
    form.nginxPreviewVisible = true
    emit('preview-nginx')
  }
}

const cancelPreview = () => {
  const form = props.form || {}
  form.nginxPreviewVisible = false
  form.nginxPreviewDraft = String(form.nginxPreviewText || '')
}

const stripNginxComments = (value) => {
  return String(value || '')
    .split('\n')
    .map((line) => {
      let inSingle = false
      let inDouble = false
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i]
        if (ch === "'" && !inDouble) inSingle = !inSingle
        if (ch === '"' && !inSingle) inDouble = !inDouble
        if (ch === '#' && !inSingle && !inDouble) return line.slice(0, i)
      }
      return line
    })
    .join('\n')
}

const nginxConfigHasListenPort = (text, port) => {
  const portText = String(port || '').trim()
  if (!portText) return false
  const clean = stripNginxComments(text)
  const listenRe = /^\s*listen\s+([^;]+);/gim
  let match = listenRe.exec(clean)
  while (match) {
    const raw = String(match[1] || '')
    if (new RegExp(`(^|[^0-9])${portText}([^0-9]|$)`).test(raw)) return true
    match = listenRe.exec(clean)
  }
  return false
}

const nginxConfigHasProxyPassPort = (text, port) => {
  const portText = String(port || '').trim()
  if (!portText) return false
  const clean = stripNginxComments(text)
  const proxyRe = /^\s*proxy_pass\s+([^;]+);/gim
  let match = proxyRe.exec(clean)
  while (match) {
    const raw = String(match[1] || '')
    if (new RegExp(`:${portText}([^0-9]|$)`).test(raw)) return true
    match = proxyRe.exec(clean)
  }
  return false
}

const confirmPreview = () => {
  const form = props.form || {}
  const draft = String(form.nginxPreviewDraft || '').trim()
  const frontendPort = String(form.nginxFrontendPort || '').trim()
  const backendPort = String(form.nginxBackendPort || '').trim()

  if (!draft) {
    ElMessage.warning('Nginx详细配置不能为空')
    return
  }
  if (!nginxConfigHasListenPort(draft, frontendPort)) {
    ElMessage.warning(`Nginx详细配置必须包含 listen ${frontendPort}`)
    return
  }
  if (!nginxConfigHasProxyPassPort(draft, backendPort)) {
    ElMessage.warning(`Nginx详细配置必须包含 proxy_pass 后端端口 ${backendPort}`)
    return
  }

  form.nginxPreviewText = draft
  form.nginxPreviewDraft = draft
  form.nginxPreviewConfirmed = true
  form.nginxPreviewVisible = false
}
</script>

<style scoped lang="scss">
.nginx-preview-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2d3d;
}

.nginx-preview-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.nginx-conf-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.field-hint {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #606266;
  font-size: 12px;
  line-height: 1.5;
}

.field-hint.success {
  background: #f0f9eb;
  color: #529b2e;
}

.field-hint.danger {
  background: #fef0f0;
  color: #c45656;
}

.field-hint.warning {
  background: #fdf6ec;
  color: #b88230;
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

.nginx-conf-card {
  width: 100%;
  height: 100%;
  min-height: 182px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.nginx-conf-card.active {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.12);
}

.nginx-conf-card.is-card-disabled {
  background: #f7f8fa;
  opacity: 0.68;
}

.nginx-conf-card__title {
  margin-bottom: 10px;
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}

.nginx-conf-preview {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.nginx-conf-preview.danger {
  color: #f56c6c;
}

.nginx-dir-cascader {
  width: 100%;
}

.selected-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  margin: 8px 0 10px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 12px;
}

.selected-label {
  flex: 0 0 auto;
  color: #606266;
}

.selected-value {
  color: #303133;
  font-weight: 600;
  word-break: break-all;
}

:deep(.nginx-conf-row) {
  align-items: stretch;
}

:deep(.nginx-conf-col) {
  display: flex;
}
</style>
