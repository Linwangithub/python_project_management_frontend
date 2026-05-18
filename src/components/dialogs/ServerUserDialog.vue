<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width || '500px'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
        <el-input
          v-if="field.component === 'input'"
          v-model="form[field.key]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
        />
        <el-select
          v-else-if="field.component === 'select'"
          v-model="form[field.key]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="opt in field.options || []"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="dangerText"
      :title="dangerText"
      type="error"
      :closable="false"
      show-icon
      class="danger-alert"
    />

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="emit('confirm')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps(['modelValue', 'title', 'width', 'fields', 'form', 'dangerText'])
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
.danger-alert {
  margin-top: 8px;
}
</style>
