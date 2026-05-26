<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="dialog-text">{{ text }}</p>
    <el-radio-group
      :model-value="migrate"
      @update:model-value="emit('update:migrate', $event)"
    >
      <el-radio label="yes">{{ deleteUserDialogText.migrateYes }}</el-radio>
      <el-radio label="no">{{ deleteUserDialogText.migrateNo }}</el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ dialogCommonText.cancel }}</el-button>
      <el-button type="primary" @click="emit('confirm')">{{ dialogCommonText.confirm }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { deleteUserDialogText, dialogCommonText } from '@/config/dialog/dialog.text.config'
defineProps(['modelValue', 'title', 'text', 'migrate'])
const emit = defineEmits(['update:modelValue', 'update:migrate', 'confirm'])
</script>

<style scoped lang="scss">
.dialog-text {
  margin: 0 0 12px;
}
</style>
