/**
 * 布局状态配置。
 *
 * 作用：
 * - 统一维护默认菜单、默认成员筛选值和默认视图预设。
 * - layout/ui store 只读取配置，不直接写固定字符串。
 */

/** 登录后默认打开的菜单 key。 */
export const DEFAULT_ACTIVE_MENU = 'projects'

/** 成员筛选器默认值。 */
export const DEFAULT_MEMBER_FILTER = 'all'

/** 视图预设在 localStorage 中的 key。 */
export const VIEW_PRESET_STORAGE_KEY = 'pspm:view-preset'

/** root 用户默认视图预设。 */
export const ROOT_DEFAULT_VIEW_PRESET = 'full'

/** 普通用户默认视图预设。 */
export const USER_DEFAULT_VIEW_PRESET = 'compact'

/**
 * 主布局用户可见文案。
 *
 * 作用：
 * - MainLayout.vue 只负责渲染布局，不直接维护固定中文文案。
 * - 后续如果调整顶部栏、侧边栏文案，只需要修改这里。
 */
export const mainLayoutText = {
  terminalFullscreen: '终端全屏',
  exitTerminalFullscreen: '退出终端全屏',
  logout: '退出',
  sideMenuTitle: '功能菜单',
  dragResizeTitle: '拖动调整宽度',
  userPrefix: '用户',
  rolePrefix: '角色',
  emptyValue: '-',
}

/**
 * 主布局三分屏尺寸配置。
 *
 * 字段说明：
 * - defaultLeftWidth：左侧菜单默认宽度。
 * - defaultRightWidth：右侧终端默认宽度。
 * - minLeftWidth：左侧菜单最小宽度。
 * - minCenterWidth：中间内容区 CSS minmax 的最小宽度。
 * - centerGuardWidth：中间区域保护宽度，避免操作按钮被右侧终端遮挡。
 * - minRightWidth：右侧终端最小宽度。
 * - splitterWidth：左右拖拽条宽度。
 * - bodyGap：布局网格之间的间距。
 */
export const mainLayoutSizeConfig = {
  defaultLeftWidth: 220,
  defaultRightWidth: 500,
  minLeftWidth: 112,
  minCenterWidth: 980,
  centerGuardWidth: 1450,
  minRightWidth: 340,
  splitterWidth: 8,
  bodyGap: 8,
}
