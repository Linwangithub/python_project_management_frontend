/**
 * 前端运行时网络配置。
 *
 * 作用：
 * - 统一维护 API base URL，避免在业务代码中硬编码服务器 IP。
 * - 生产或联调环境通过 VITE_API_BASE_URL 注入真实后端地址。
 * - 未配置时使用相对路径 /api，便于由 Vite proxy 或 Nginx 转发。
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
