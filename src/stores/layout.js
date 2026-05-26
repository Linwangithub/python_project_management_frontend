import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_ACTIVE_MENU, DEFAULT_MEMBER_FILTER } from '@/config/layout/layout.config'

/**
 * 布局状态 Store。
 *
 * 作用：
 * - 维护当前菜单、终端全屏状态、成员筛选状态。
 * - 为 Dashboard 三分屏和顶部筛选提供共享状态。
 */
export const useLayoutStore = defineStore('layout', () => {
  /** 当前激活菜单 key。 */
  const activeMenu = ref(DEFAULT_ACTIVE_MENU)
  /** 是否进入终端全屏模式。 */
  const fullTerminal = ref(false)
  /** 当前成员筛选值。 */
  const currentMemberFilter = ref(DEFAULT_MEMBER_FILTER)

  /** 中间内容区是否可见。 */
  const centerVisible = computed(() => !fullTerminal.value)

  /** 切换当前菜单。 */
  const switchMenu = (key) => {
    activeMenu.value = key
  }

  /** 设置当前成员筛选值。 */
  const setMemberFilter = (member) => {
    currentMemberFilter.value = member
  }

  /** 切换终端全屏模式。 */
  const toggleFullTerminal = () => {
    fullTerminal.value = !fullTerminal.value
  }

  return {
    activeMenu,
    fullTerminal,
    centerVisible,
    currentMemberFilter,
    switchMenu,
    setMemberFilter,
    toggleFullTerminal,
  }
})
