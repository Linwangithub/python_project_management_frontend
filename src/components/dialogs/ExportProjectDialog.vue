<template>
  <el-dialog
    :model-value="modelValue"
    :title="exportProjectDialogText.title"
    :width="width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
        <el-input
          v-model="form[field.key]"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ dialogCommonText.cancel }}</el-button>
      <el-button type="primary" @click="emit('confirm')">{{ exportProjectDialogText.confirm }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { dialogCommonText, exportProjectDialogText } from '@/config/dialog/dialog.text.config'
defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>
