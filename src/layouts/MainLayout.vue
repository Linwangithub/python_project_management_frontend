<template>
  <div class="main-layout">
    <header class="topbar">
      <div class="brand">{{ appName }}</div>
      <div class="actions">
        <el-tag>{{ userLabel }}</el-tag>
        <el-button size="small" @click="layout.toggleFullTerminal">
          {{ layout.fullTerminal ? mainLayoutText.exitTerminalFullscreen : mainLayoutText.terminalFullscreen }}
        </el-button>
        <el-button size="small" type="danger" @click="logout">{{ mainLayoutText.logout }}</el-button>
      </div>
    </header>

    <div
      ref="bodyRef"
      class="body"
      :class="{ 'is-terminal-full': layout.fullTerminal, 'is-resizing': resizingType }"
      :style="bodyGridStyle"
    >
      <aside v-show="!layout.fullTerminal" class="left">
        <div class="side-head">{{ mainLayoutText.sideMenuTitle }}</div>
        <el-menu :default-active="layout.activeMenu" class="menu">
          <el-menu-item
            v-for="item in visibleMenus"
            :key="item.key"
            :index="item.key"
            @click="layout.switchMenu(item.key)"
          >
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </aside>

      <button
        v-show="!layout.fullTerminal"
        class="splitter splitter-left"
        type="button"
        :title="mainLayoutText.dragResizeTitle"
        @mousedown="startResize('left', $event)"
      ></button>

      <main v-show="!layout.fullTerminal" class="center">
        <slot />
      </main>

      <button
        v-show="!layout.fullTerminal"
        class="splitter splitter-right"
        type="button"
        :title="mainLayoutText.dragResizeTitle"
        @mousedown="startResize('right', $event)"
      ></button>

      <aside class="right">
        <slot name="terminal" />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { appConfig } from '@/config/app/app.config'
import { mainLayoutSizeConfig, mainLayoutText } from '@/config/layout/layout.config'
import { menuConfig } from '@/config/menu/menu.config'
import { menuPermissionKeyMap } from '@/config/permission/permission.map'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import { useProjectStore } from '@/stores/project'
import { useTerminalStore } from '@/stores/terminal'

const auth = useAuthStore()
const layout = useLayoutStore()
const projectStore = useProjectStore()
const terminalStore = useTerminalStore()
const appName = appConfig.appName
const bodyRef = ref(null)
const defaultLeftWidth = mainLayoutSizeConfig.defaultLeftWidth
const defaultRightWidth = mainLayoutSizeConfig.defaultRightWidth
const leftWidth = ref(defaultLeftWidth)
const rightWidth = ref(defaultRightWidth)
const resizingType = ref('')
const dragState = ref(null)

const minLeftWidth = mainLayoutSizeConfig.minLeftWidth
const minCenterWidth = mainLayoutSizeConfig.minCenterWidth
const centerGuardWidth = mainLayoutSizeConfig.centerGuardWidth
const minRightWidth = mainLayoutSizeConfig.minRightWidth
const splitterWidth = mainLayoutSizeConfig.splitterWidth
const bodyGap = mainLayoutSizeConfig.bodyGap
const bodyGridStyle = computed(() => {
  if (layout.fullTerminal) return undefined
  return {
    gridTemplateColumns: `${leftWidth.value}px ${splitterWidth}px minmax(${minCenterWidth}px, 1fr) ${splitterWidth}px ${rightWidth.value}px`,
  }
})

const getBodyWidth = () => bodyRef.value?.getBoundingClientRect().width || 0

const clamp = (value, min, max) => {
  const safeMax = Math.max(min, max)
  return Math.min(Math.max(value, min), safeMax)
}

const stopResize = () => {
  resizingType.value = ''
  dragState.value = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

const onResizeMove = (event) => {
  const state = dragState.value
  if (!state) return
  const deltaX = event.clientX - state.startX
  const bodyWidth = getBodyWidth()
  const reserved = splitterWidth * 2 + bodyGap * 4

  if (state.type === 'left') {
    leftWidth.value = clamp(state.startLeftWidth + deltaX, minLeftWidth, defaultLeftWidth)
    return
  }

  const maxRight = bodyWidth - leftWidth.value - centerGuardWidth - reserved
  rightWidth.value = clamp(state.startRightWidth - deltaX, minRightWidth, maxRight)
}

const startResize = (type, event) => {
  event.preventDefault()
  resizingType.value = type
  dragState.value = {
    type,
    startX: event.clientX,
    startLeftWidth: leftWidth.value,
    startRightWidth: rightWidth.value,
  }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  stopResize()
})

const visibleMenus = computed(() =>
  menuConfig.filter((m) => auth.hasMenu(menuPermissionKeyMap[m.key] || m.key)),
)

const userLabel = computed(() => {
  const username = auth.user?.username || mainLayoutText.emptyValue
  const role = auth.role || mainLayoutText.emptyValue
  return `${mainLayoutText.userPrefix}: ${username} ${mainLayoutText.rolePrefix}: ${role}`
})

const logout = () => {
  terminalStore.reset()
  auth.logout()
  projectStore.reset()
  location.hash = '#/login'
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100%;
  display: grid;
  grid-template-rows: 52px minmax(0, 1fr);
}
.topbar {
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(9, 15, 29, 0.92);
}
.brand {
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.body {
  min-height: 0;
  display: grid;
  grid-template-columns: 220px 8px minmax(980px, 1fr) 8px 500px;
  gap: 8px;
  padding: 10px;
  height: 100%;
}
.body.is-terminal-full {
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 0;
}
.body.is-resizing {
  user-select: none;
  cursor: col-resize;
}
.left,
.center,
.right {
  min-height: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--card);
}
.body.is-terminal-full .right {
  width: 100%;
  height: 100%;
}
.splitter {
  min-height: 0;
  width: 8px;
  height: 100%;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  padding: 0;
}
.splitter::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 3px;
  width: 2px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.splitter:hover::before,
.body.is-resizing .splitter::before {
  background: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
}
.side-head {
  padding: 12px;
  border-bottom: 1px solid var(--line);
  color: #bfd2ec;
  font-size: 13px;
  font-weight: 600;
}
.menu {
  border-right: none;
  height: calc(100% - 46px);
}
</style>
