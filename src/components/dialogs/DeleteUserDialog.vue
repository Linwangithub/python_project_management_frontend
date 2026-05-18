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
      <el-radio label="yes">删除账号并迁移其项目到我的目录</el-radio>
      <el-radio label="no">仅删除账号，不迁移项目</el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="emit('confirm')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps(['modelValue', 'title', 'text', 'migrate'])
const emit = defineEmits(['update:modelValue', 'update:migrate', 'confirm'])
</script>

<style scoped lang="scss">
.dialog-text {
  margin: 0 0 12px;
}
</style>
