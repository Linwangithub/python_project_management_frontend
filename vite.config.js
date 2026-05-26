import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { VITE_BUILD_OPTIONS, VITE_BUILD_ROLLUP_OUTPUT } from './src/config/build/vite.build.config.js'

/**
 * 根据当前运行模式生成本地开发代理配置。
 *
 * 参数：
 * - mode：Vite 当前运行模式，例如 development 或 production。
 *
 * 返回：
 * - 当配置了 VITE_DEV_API_TARGET 时，返回 HTTP 与 WebSocket 代理配置。
 * - 当未配置 VITE_DEV_API_TARGET 时，返回 undefined，表示不启用本地代理。
 *
 * 使用位置：
 * - Vite dev server 的 server.proxy 配置。
 *
 * 说明：
 * - /api 同时承载普通 HTTP 接口和终端 WebSocket 接口，所以必须开启 ws。
 * - /ws 保留为兼容入口，便于后续独立 WebSocket 路径接入。
 */
const buildProxy = (mode) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || ''
  const wsTarget = env.VITE_DEV_WS_TARGET || apiTarget.replace(/^http/, 'ws')

  if (!apiTarget) return undefined

  return {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      ws: true,
    },
    '/ws': {
      target: wsTarget,
      changeOrigin: true,
      ws: true,
    },
  }
}

/**
 * Vite 项目入口配置。
 *
 * 作用：
 * - 注册 Vue 插件。
 * - 配置 @ 到 src 的路径别名。
 * - 注入本地开发接口代理。
 * - 复用统一构建配置，避免构建参数散落在入口文件中。
 */
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: buildProxy(mode),
  },
  build: {
    ...VITE_BUILD_OPTIONS,
    rollupOptions: {
      output: VITE_BUILD_ROLLUP_OUTPUT,
    },
  },
}))
