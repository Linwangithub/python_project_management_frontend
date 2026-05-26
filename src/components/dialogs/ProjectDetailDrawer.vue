<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="size"
    custom-class="project-detail-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="drawer-body">
      <template v-if="detailSections.length">
        <div class="hero-card">
          <div>
            <div class="hero-label">{{ projectDetailDrawerText.currentProject }}</div>
            <div class="hero-title">{{ detailTitle }}</div>
          </div>
          <el-tag v-if="statusText" effect="dark" :type="statusText === projectDetailDrawerText.running ? 'success' : 'info'">
            {{ statusText }}
          </el-tag>
        </div>

        <div v-for="section in detailSections" :key="section.title" class="section-card">
          <div class="section-title">
            <span class="section-dot"></span>
            <span>{{ section.title }}</span>
          </div>

          <div class="field-grid">
            <div
              v-for="field in section.fields"
              :key="`${section.title}-${field.key || field.label}`"
              class="field-item"
              :class="{ wide: isWide(field, section) }"
            >
              <div class="field-label">{{ field.label }}</div>
              <div class="field-value" :class="{ mono: field.mono, pre: isPre(field) }">
                <template v-if="field.secret">
                  <span>{{ visibleSecrets[field.key] ? safeValue(field.value) : maskValue(field.value) }}</span>
                  <button class="secret-btn" @click="toggleSecret(field.key)">
                    {{ visibleSecrets[field.key] ? projectDetailDrawerText.hideSecret : projectDetailDrawerText.showSecret }}
                  </button>
                </template>
                <pre v-else-if="isPre(field)">{{ safeValue(field.value) }}</pre>
                <span v-else>{{ safeValue(field.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <el-empty v-else :description="projectDetailDrawerText.emptyDescription" />
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, reactive } from 'vue'
import {
  projectDetailCondaText,
  projectDetailDrawerText,
  projectDetailPathText,
  SECRET_MASK_TEXT,
} from '@/config/project/project.detail.fields.config'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  project: { type: Object, default: null },
  detail: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  title: { type: String, default: projectDetailDrawerText.title },
  size: { type: String, default: '520px' },
  fields: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const visibleSecrets = reactive({})

const fallbackSections = computed(() => {
  if (!props.project || !props.fields.length) return []
  return [
    {
      title: projectDetailDrawerText.baseInfoTitle,
      fields: props.fields.map((field) => ({
        key: field.key,
        label: field.label,
        value: props.project[field.key] || '',
        mono: false,
        secret: false,
      })),
    },
  ]
})

const detailSections = computed(() => normalizeDetailSections(props.detail?.sections || fallbackSections.value))
const detailTitle = computed(() => props.detail?.project_name || props.project?.name || projectDetailDrawerText.emptyValue)
const statusText = computed(() => {
  for (const section of detailSections.value) {
    const hit = (section.fields || []).find((field) => field.key === 'status')
    if (hit?.value) return String(hit.value)
  }
  return props.project?.status || ''
})

const safeValue = (value) => String(value ?? '').trim() || projectDetailDrawerText.emptyValue
const maskValue = (value) => {
  const text = String(value ?? '').trim()
  return text ? SECRET_MASK_TEXT : projectDetailDrawerText.emptyValue
}
const normalizePath = (path) => String(path || '').replace(/\/+$/, '')
const isAbsolutePath = (path) => /^([a-zA-Z]:[\\/]|\/)/.test(String(path || ''))
const joinPath = (basePath, entryPath) => {
  const base = normalizePath(basePath)
  const entry = String(entryPath || '').trim()
  if (!entry) return base
  if (isAbsolutePath(entry)) return entry
  return base ? `${base}/${entry.replace(/^\/+/, '')}` : entry
}
const getField = (fields, key) => (fields || []).find((field) => field.key === key)
const normalizePathSectionFields = (fields) => {
  const backendPath = getField(fields, 'backend_path')
  const entryFilePath = getField(fields, 'entry_file_path')
  const frontendPath = getField(fields, 'frontend_path')
  const result = []

  if (backendPath || entryFilePath) {
    result.push({
      ...(backendPath || entryFilePath),
      key: 'backend_entry_path',
      label: projectDetailPathText.backendEntryLabel,
      value: joinPath(backendPath?.value, entryFilePath?.value),
      mono: true,
    })
  }

  if (frontendPath) {
    result.push({
      ...frontendPath,
      label: projectDetailPathText.frontendDistLabel,
      mono: true,
    })
  }

  return result
}
const normalizeDetailSections = (sections) => (sections || []).map((section) => {
  if (section.title === projectDetailPathText.sectionTitle) {
    return {
      ...section,
      fields: normalizePathSectionFields(section.fields),
    }
  }

  if (section.title === projectDetailCondaText.sectionTitle) {
    return {
      ...section,
      fields: (section.fields || []).map((field) => (
        field.key === 'conda_python_version' ? { ...field, label: projectDetailCondaText.actualPythonVersionLabel } : field
      )),
    }
  }

  return section
})
const isPre = (field) => String(field?.value || '').includes('\n') || ['nginx_config_text'].includes(field?.key)
const isWide = (field, section) => section?.title === projectDetailPathText.sectionTitle || isPre(field) || String(field?.value || '').length > 48
const toggleSecret = (key) => {
  visibleSecrets[key] = !visibleSecrets[key]
}
</script>

<style scoped lang="scss">
.drawer-body {
  min-height: 260px;
  display: grid;
  gap: 14px;
  align-content: start;
  padding-bottom: 20px;
}

.hero-card {
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.38));
  color: #eaf2ff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
}

.hero-label {
  font-size: 12px;
  color: #93c5fd;
  margin-bottom: 6px;
}

.hero-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.4px;
}

.section-card {
  border: 1px solid #dbe6f5;
  border-radius: 16px;
  background: #ffffff;
  padding: 14px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 12px;
}

.section-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.13);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.field-item {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #f8fafc, #ffffff);
}

.field-item.wide {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 700;
}

.field-value {
  min-height: 22px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  word-break: break-all;
  line-height: 1.55;
}

.field-value.mono {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
}

.field-value pre {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #dbe6f5;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  overflow: auto;
  max-height: 220px;
  white-space: pre-wrap;
  line-height: 1.55;
}

.secret-btn {
  margin-left: 10px;
  border: none;
  color: #2563eb;
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
</style>
