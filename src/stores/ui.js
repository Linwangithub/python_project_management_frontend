import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { viewPresetsConfig } from '@/config/preset/view.presets.config'

const VIEW_PRESET_STORAGE_KEY = 'pspm:view-preset'
const DEFAULT_PRESET = 'full'

const isValidPreset = (value) => {
  return !!value && viewPresetsConfig.some((item) => item.key === value)
}

const getInitialPreset = () => {
  if (typeof window === 'undefined') return DEFAULT_PRESET
  try {
    const saved = window.localStorage.getItem(VIEW_PRESET_STORAGE_KEY)
    return isValidPreset(saved) ? saved : DEFAULT_PRESET
  } catch {
    return DEFAULT_PRESET
  }
}

export const useUiStore = defineStore('ui', () => {
  const currentPreset = ref(getInitialPreset())

  const currentPresetConfig = computed(() => {
    return viewPresetsConfig.find((item) => item.key === currentPreset.value) || viewPresetsConfig[0]
  })

  const setPreset = (preset) => {
    currentPreset.value = preset
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(VIEW_PRESET_STORAGE_KEY, preset)
    } catch {
      // 忽略浏览器隐私模式下的存储失败
    }
  }

  const hasUserPreset = () => {
    if (typeof window === 'undefined') return false
    try {
      return isValidPreset(window.localStorage.getItem(VIEW_PRESET_STORAGE_KEY))
    } catch {
      return false
    }
  }

  const ensurePresetByRole = (role) => {
    if (hasUserPreset()) return
    const roleDefault = role === 'root' ? 'full' : 'compact'
    setPreset(roleDefault)
  }

  return {
    currentPreset,
    currentPresetConfig,
    setPreset,
    hasUserPreset,
    ensurePresetByRole,
  }
})
