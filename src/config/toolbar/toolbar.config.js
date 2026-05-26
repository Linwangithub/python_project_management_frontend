/**
 * 顶部工具栏区块配置。
 *
 * 作用：
 * - 定义每个工具栏区块在哪些菜单下展示。
 * - 使用 order 控制从左到右的展示顺序。
 */
export const toolbarSectionsConfig = [
  {
    type: 'preset-selector',
    menus: ['projects', 'users', 'envs', 'servers'],
    order: 0,
  },
  {
    type: 'member-filter',
    menus: ['projects', 'users'],
    order: 1,
  },
  {
    type: 'status-filter',
    menus: ['projects'],
    order: 2,
  },
  {
    type: 'create-button',
    menus: ['projects', 'users', 'envs', 'servers'],
    order: 3,
  },
  {
    type: 'sync-project-button',
    menus: ['projects'],
    order: 4,
  },
]

/**
 * Dashboard 中心面板工具栏固定文案。
 *
 * 作用：
 * - DashboardCenterPanel.vue 根据工具栏区块类型渲染按钮。
 * - 按钮文案集中在这里维护，避免组件内散落固定字符串。
 */
export const toolbarText = {
  createButton: '+ 新建',
  syncProjectButton: '同步',
}
