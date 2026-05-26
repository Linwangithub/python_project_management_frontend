<template>
  <el-dialog
    :model-value="modelValue"
    :title="createServerDialogText.title"
    :width="width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-row :gutter="12">
        <el-col v-for="field in fields" :key="field.key" :span="field.span || 24">
          <el-form-item :label="field.label">
            <el-input
              v-if="field.component === 'input'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
            />
            <el-input
              v-else-if="field.component === 'textarea'"
              v-model="form[field.key]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              type="textarea"
              :rows="field.rows || 2"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ dialogCommonText.cancel }}</el-button>
      <el-button type="primary" @click="emit('confirm')">{{ dialogCommonText.confirmCreate }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { createServerDialogText, dialogCommonText } from '@/config/dialog/dialog.text.config'
defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>
