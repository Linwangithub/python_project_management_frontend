<template>
  <BaseTableView
    :rows="rows"
    :columns="columns"
    :actions-label="actionsLabel"
    :actions-min-width="actionsMinWidth"
    :actions="actions"
    :show-actions-for-row="canShowActions"
    @action="(code, row) => emit('action', code, row)"
  />
</template>

<script setup>
import BaseTableView from '@/components/base/BaseTableView.vue'

defineProps(['rows', 'columns', 'actionsLabel', 'actionsMinWidth', 'actions'])

const emit = defineEmits(['action'])

const canShowActions = (row) => row.username !== 'root'
</script>
