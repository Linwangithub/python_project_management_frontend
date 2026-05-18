<template>
  <div class="view-table">
    <el-table class="pspm-data-table" :data="rows" size="small" height="100%" :header-cell-class-name="() => 'pspm-table-header'" :row-class-name="() => 'pspm-table-row'">
      <el-table-column
        v-for="col in columns"
        :key="col.key"
        :label="col.label"
        :prop="col.key"
        :width="col.width"
        :min-width="col.minWidth"
      >
        <template #default="scope">
          <slot
            :name="`cell-${col.key}`"
            :row="scope.row"
            :column="col"
            :value="cellValue(col.key, scope.row)"
          >
            <span class="cell-text" :class="cellClass(col.key, scope.row)">{{ cellValue(col.key, scope.row) }}</span>
          </slot>
        </template>
      </el-table-column>

      <el-table-column v-if="showActionsColumn" :label="actionsLabel" :min-width="actionsMinWidth">
        <template #default="scope">
          <slot name="actions" :row="scope.row" :actions="actions">
            <div v-if="showActionsForRow(scope.row)" class="op-group">
              <button
                v-for="action in actions"
                :key="action.code"
                class="mini-btn"
                :class="[action.styleType || '', { disabled: isActionDisabled(action, scope.row) }]"
                :disabled="isActionDisabled(action, scope.row)"
                @click="handleActionClick(action, scope.row)"
              >
                {{ action.label }}
              </button>
            </div>
            <span v-else>-</span>
          </slot>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  actionsLabel: { type: String, default: '操作' },
  actionsMinWidth: { type: [Number, String], default: 160 },
  actions: { type: Array, default: () => [] },
  showActionsColumn: { type: Boolean, default: true },
  showActionsForRow: { type: Function, default: () => true },
  actionDisabled: { type: Function, default: null },
  formatCell: { type: Function, default: null },
  cellClassName: { type: Function, default: null },
})

const emit = defineEmits(['action'])

const cellValue = (columnKey, row) => {
  if (props.formatCell) {
    return props.formatCell(columnKey, row)
  }
  return row[columnKey]
}

const cellClass = (columnKey, row) => {
  return props.cellClassName ? props.cellClassName(columnKey, row) : undefined
}

const isActionDisabled = (action, row) => {
  if (typeof action?.disabled === 'function') return !!action.disabled(row)
  if (typeof props.actionDisabled === 'function') return !!props.actionDisabled(action, row)
  return !!action?.disabled
}

const handleActionClick = (action, row) => {
  if (isActionDisabled(action, row)) return
  emit('action', action.code, row)
}
</script>

<style scoped lang="scss">
.view-table {
  height: 100%;
  background: #ffffff;
}

.cell-text {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
}

:deep(.pspm-data-table) {
  --el-table-border-color: #e5e7eb;
  --el-table-row-hover-bg-color: #eff6ff;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
}

:deep(.pspm-data-table .cell) {
  padding: 0 6px;
}

:deep(.pspm-data-table .el-table__inner-wrapper),
:deep(.pspm-data-table .el-table__body-wrapper),
:deep(.pspm-data-table .el-scrollbar),
:deep(.pspm-data-table .el-scrollbar__view) {
  background: #ffffff;
}

:deep(.pspm-table-header) {
  background: #f8fafc !important;
  color: #111827 !important;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  border-bottom: 1px solid #d1d5db !important;
}

:deep(.pspm-table-row td),
:deep(.el-table--striped .pspm-table-row.el-table__row--striped td) {
  background: #ffffff !important;
  color: #111827;
  border-bottom: 1px solid #e5e7eb !important;
}

:deep(.pspm-table-row:hover td) {
  background: #eff6ff !important;
}

.op-group {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mini-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1f2937;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.mini-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.mini-btn.ok {
  color: #047857;
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.mini-btn.warn {
  color: #b45309;
  background: #fffbeb;
  border-color: #fcd34d;
}

.mini-btn.info {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.mini-btn.danger {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
}

.mini-btn:disabled,
.mini-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.25);
}
</style>
