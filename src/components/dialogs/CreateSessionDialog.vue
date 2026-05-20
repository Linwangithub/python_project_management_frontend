<template>
  <el-dialog
    :model-value="modelValue"
    title="创建会话"
    :width="width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
        <el-input
          v-model="form[field.key]"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
          v-if="field.component === 'input'"
        />
        <el-select
          v-else-if="field.component === 'select'"
          v-model="form[field.key]"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
          style="width: 100%"
        >
          <el-option
            v-for="opt in field.options || []"
            :key="typeof opt === 'string' ? opt : opt.value"
            :label="typeof opt === 'string' ? opt : opt.label"
            :value="typeof opt === 'string' ? opt : opt.value"
          />
        </el-select>
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
