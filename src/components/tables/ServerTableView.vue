<template>
  <BaseTableView
    :rows="rows"
    :columns="columns"
    :actions-label="actionsLabel"
    :actions-min-width="actionsMinWidth"
    :actions="actions"
    @action="(code, row) => emit('action', code, row)"
  />
</template>

<script setup>
import BaseTableView from '@/components/base/BaseTableView.vue'

defineProps(['rows', 'columns', 'actionsLabel', 'actionsMinWidth', 'actions'])

const emit = defineEmits(['action'])
</script>
