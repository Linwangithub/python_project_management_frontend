<template>
  <section class="terminal-wrap">
    <div class="session-row">
      <div
        v-for="session in terminalStore.sessions"
        :key="session.id"
        class="session-tab"
        :class="{ 'is-active': terminalStore.activeSessionId === session.id }"
        :title="session.serverIp"
        @click="emit('switch-session', session.id)"
      >
        <span class="alias" :title="session.serverIp">{{ session.alias }}</span>
        <button class="tab-plus" @click.stop="emit('add-sibling-session', session.id)">+</button>
        <span
          class="tab-close"
          :class="{ disabled: session.locked }"
          :title="session.locked ? (session.lockReason || terminalMessages.sessionLocked) : terminalPanelText.closeSession"
          @click.stop="session.locked ? undefined : emit('close-session', session.id)"
        >{{ terminalPanelText.closeSessionSymbol }}</span>
      </div>
      <div v-if="!terminalStore.sessions.length" class="session-empty">{{ terminalPanelText.sessionEmpty }}</div>
    </div>

    <div class="terminal-head">
      <span>{{ terminalPanelText.title }}</span>
      <div class="head-actions">
        <el-button size="small" @click="emit('open-session')">{{ terminalPanelText.createSession }}</el-button>
        <el-button size="small" @click="emit('upload')">{{ terminalPanelText.upload }}</el-button>
        <el-button size="small" @click="emit('download')">{{ terminalPanelText.download }}</el-button>
      </div>
    </div>

    <div
      ref="consoleRef"
      class="console"
      tabindex="0"
      @keydown="emit('terminal-shortcut', $event)"
      @scroll="emit('console-scroll', $event)"
    >
      <div
        v-for="(line, idx) in terminalLines"
        :key="idx"
        class="console-line"
        :class="{ 'is-empty': !String(line || '').length }"
      >{{ String(line || '').length ? line : TERMINAL_EMPTY_LINE_PLACEHOLDER }}</div>
    </div>

    <div class="input-row">
      <el-input
        v-model="commandInputProxy"
        :disabled="activeSessionLocked"
        :placeholder="activeSessionLocked ? (activeSessionLockReason || terminalMessages.commandBlockedByTask) : terminalPanelText.commandPlaceholder"
        @keydown.tab.prevent="emit('command-tab-complete', $event)"
        @keydown.up.prevent="emit('terminal-shortcut', $event)"
        @keydown.down.prevent="emit('terminal-shortcut', $event)"
        @keydown.ctrl.c.prevent="emit('terminal-shortcut', $event)"
        @keydown.ctrl.l.prevent="emit('terminal-shortcut', $event)"
        @keyup.enter="emit('execute')"
      />
      <el-button size="small" type="primary" :disabled="activeSessionLocked" @click="emit('execute')">{{ terminalPanelText.execute }}</el-button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { TERMINAL_EMPTY_LINE_PLACEHOLDER } from '@/config/terminal/terminal.control.config'
import { terminalMessages, terminalPanelText } from '@/config/terminal/terminal.messages.config'

const props = defineProps(['terminalStore', 'terminalLines', 'commandInput', 'activeSessionLocked', 'activeSessionLockReason'])

const emit = defineEmits([
  'update:command-input',
  'open-session',
  'upload',
  'download',
  'switch-session',
  'add-sibling-session',
  'close-session',
  'execute',
  'console-mounted',
  'console-scroll',
  'terminal-shortcut',
  'command-tab-complete',
])

const commandInputProxy = computed({
  get: () => props.commandInput,
  set: (value) => emit('update:command-input', value),
})

const consoleRef = ref(null)
onMounted(() => {
  emit('console-mounted', consoleRef.value)
})
</script>

<style scoped lang="scss">
.terminal-wrap {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}

.session-row {
  padding: 8px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.session-empty {
  font-size: 12px;
  color: #8aa0bf;
}

.session-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid #22324d;
  border-radius: 8px;
  background: #11203a;
  font-size: 12px;
  cursor: pointer;
}

.session-tab.is-active {
  border-color: #3a64b4;
}

.alias {
  color: #dce7f7;
}

.tab-plus {
  padding: 0 6px;
  border: 1px solid #2e3f61;
  background: #1a2b48;
  color: #cfe0ff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
}

.tab-close {
  cursor: pointer;
  font-size: 12px;
  opacity: 0.8;
}

.tab-close.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.terminal-head {
  padding: 10px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #bfd2ec;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.console {
  background: #040914;
  color: #9ef3c6;
  padding: 10px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-y: auto;
  overflow-x: auto;
  overscroll-behavior: contain;
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
}

.console-line {
  min-height: 18px;
  margin: 0 0 2px;
}

.console-line.is-empty {
  min-height: 18px;
}

.input-row {
  padding: 8px;
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
</style>
