import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const activeMenu = ref('projects')
  const fullTerminal = ref(false)
  const currentMemberFilter = ref('all')

  const centerVisible = computed(() => !fullTerminal.value)

  const switchMenu = (key) => {
    activeMenu.value = key
  }

  const setMemberFilter = (member) => {
    currentMemberFilter.value = member
  }

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
