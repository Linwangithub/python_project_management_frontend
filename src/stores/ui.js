import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { viewPresetsConfig } from '@/config/preset/view.presets.config'
import {
  ROOT_DEFAULT_VIEW_PRESET,
  USER_DEFAULT_VIEW_PRESET,
  VIEW_PRESET_STORAGE_KEY,
} from '@/config/layout/layout.config'
import { ROOT_ROLE_KEY } from '@/config/auth/auth.config'

/**
 * 判断视图预设 key 是否存在于配置表。
 *
 * 参数：
 * - value：待检查的视图预设 key。
 *
 * 返回：
 * - true 表示配置存在，可安全使用。
 */
const isValidPreset = (value) => {
  return !!value && viewPresetsConfig.some((item) => item.key === value)
}

/**
 * 读取初始视图预设。
 *
 * 返回：
 * - 用户已保存的合法预设；否则返回 root 默认预设。
 */
const getInitialPreset = () => {
  if (typeof window === 'undefined') return ROOT_DEFAULT_VIEW_PRESET
  try {
    const saved = window.localStorage.getItem(VIEW_PRESET_STORAGE_KEY)
    return isValidPreset(saved) ? saved : ROOT_DEFAULT_VIEW_PRESET
  } catch {
    return ROOT_DEFAULT_VIEW_PRESET
  }
}

/**
 * UI 偏好 Store。
 *
 * 作用：
 * - 维护当前视图预设。
 * - 将用户选择的视图预设持久化到 localStorage。
 */
export const useUiStore = defineStore('ui', () => {
  /** 当前视图预设 key。 */
  const currentPreset = ref(getInitialPreset())

  /** 当前视图预设完整配置。 */
  const currentPresetConfig = computed(() => {
    return viewPresetsConfig.find((item) => item.key === currentPreset.value) || viewPresetsConfig[0]
  })

  /** 保存并切换视图预设。 */
  const setPreset = (preset) => {
    currentPreset.value = preset
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(VIEW_PRESET_STORAGE_KEY, preset)
    } catch {
      // 忽略浏览器隐私模式下的存储失败。
    }
  }

  /** 判断用户是否已经主动保存过视图预设。 */
  const hasUserPreset = () => {
    if (typeof window === 'undefined') return false
    try {
      return isValidPreset(window.localStorage.getItem(VIEW_PRESET_STORAGE_KEY))
    } catch {
      return false
    }
  }

  /** 未保存预设时，根据角色自动选择默认预设。 */
  const ensurePresetByRole = (role) => {
    if (hasUserPreset()) return
    const roleDefault = role === ROOT_ROLE_KEY ? ROOT_DEFAULT_VIEW_PRESET : USER_DEFAULT_VIEW_PRESET
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
