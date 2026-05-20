<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-position="top">
      <el-form-item label="项目">
        <el-input v-model="form.projectName" disabled />
      </el-form-item>
    </el-form>
    <div class="tool-row">
      <el-button v-for="btn in buttons" :key="btn" size="small" @click="emit('tool-click', btn)">{{ btn }}</el-button>
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps(['modelValue', 'title', 'width', 'buttons', 'form'])
const emit = defineEmits(['update:modelValue', 'tool-click'])
</script>

<style scoped lang="scss">
.tool-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
