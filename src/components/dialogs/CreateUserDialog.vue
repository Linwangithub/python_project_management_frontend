<template>
  <el-dialog
    :model-value="modelValue"
    title="创建账号"
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
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="emit('confirm')">确认创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>
