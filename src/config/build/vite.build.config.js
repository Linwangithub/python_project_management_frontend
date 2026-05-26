/**
 * Vite 构建分包配置。
 *
 * 作用：
 * - 将 Vue、Element Plus、工具库和业务代码拆成不同 chunk（代码块）。
 * - 降低单个 bundle（打包文件）体积，避免 Dashboard 业务代码和第三方依赖混在一起。
 * - 仅被根目录 vite.config.js 使用。
 */
export const VITE_BUILD_ROLLUP_OUTPUT = {
  manualChunks(id) {
    if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
      return 'vendor-vue'
    }

    if (id.includes('node_modules/element-plus') || id.includes('node_modules/@element-plus')) {
      return 'vendor-element-plus'
    }

    if (id.includes('node_modules/axios')) {
      return 'vendor-request'
    }

    if (id.includes('/src/views/dashboard/') || id.includes('\\src\\views\\dashboard\\')) {
      return 'dashboard'
    }

    return undefined
  },
}

/**
 * Vite 构建参数。
 *
 * chunkSizeWarningLimit 只用于构建体积提示：
 * Element Plus 是全局 UI 组件库，单独拆包后体积相对稳定，
 * 因此将提示阈值集中放在配置文件中，避免在 vite.config.js 内硬编码。
 */
export const VITE_BUILD_OPTIONS = {
  chunkSizeWarningLimit: 1000,
}
