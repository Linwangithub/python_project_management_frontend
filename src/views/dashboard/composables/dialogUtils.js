import { PROJECT_DELETE_SCOPE_OPTIONS } from './dialogConstants'
import {
  ANSI_ESCAPE_PATTERN,
  CONTROL_CHAR_PATTERN,
  OSC_ESCAPE_PATTERN,
  REPLACEMENT_CHARACTER,
  RESIDUAL_TERMINAL_CONTROL_PATTERN,
} from '@/config/terminal/terminal.sanitize.config'

const ANSI_ESCAPE_RE = new RegExp(ANSI_ESCAPE_PATTERN, 'g')
const OSC_ESCAPE_RE = new RegExp(OSC_ESCAPE_PATTERN, 'g')
const CONTROL_CHAR_RE = new RegExp(CONTROL_CHAR_PATTERN, 'g')
const RESIDUAL_TERMINAL_CONTROL_RE = new RegExp(RESIDUAL_TERMINAL_CONTROL_PATTERN, 'g')

/**
 * 清洗单行终端输出。
 *
 * 参数：
 * - line：终端 WebSocket 或接口返回的一行输出。
 *
 * 返回：
 * - 移除 ANSI 控制序列、不可见控制字符、替换字符后的文本。
 */
export const sanitizeTerminalLine = (line) => {
  return String(line ?? '')
    .replace(OSC_ESCAPE_RE, '')
    .replace(RESIDUAL_TERMINAL_CONTROL_RE, '')
    .replace(ANSI_ESCAPE_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .replaceAll(REPLACEMENT_CHARACTER, '')
}

/**
 * 清洗多行终端输出。
 *
 * 参数：
 * - lines：终端输出数组。
 *
 * 返回：
 * - 清洗、去掉尾部空白且过滤空行后的数组。
 */
export const sanitizeTerminalLines = (lines) => {
  if (!Array.isArray(lines)) return []
  return lines
    .map((line) => sanitizeTerminalLine(line))
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

/**
 * 等待指定毫秒数。
 *
 * 参数：
 * - ms：等待毫秒数，默认 120。
 *
 * 返回：
 * - 在指定时间后 resolve 的 Promise。
 */
export const sleep = (ms = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * 将路径文本拆成路径片段。
 *
 * 参数：
 * - pathText：Linux/Windows 风格路径文本。
 *
 * 返回：
 * - 去掉空片段后的路径数组。
 */
export const splitPathToSegments = (pathText) => {
  const value = String(pathText || '').trim().replace(/\\/g, '/')
  if (!value) return []
  return value.split('/').filter((item) => !!item)
}

/**
 * 生成 Element Plus Cascader 使用的路径 value 链。
 *
 * 参数：
 * - pathText：完整路径。
 *
 * 返回：
 * - 从 root 节点到目标节点的 value 数组。
 */
export const buildCascaderPathValues = (pathText) => {
  const segs = splitPathToSegments(pathText)
  const values = ['__root__']
  for (let i = 0; i < segs.length; i += 1) {
    values.push(segs.slice(0, i + 1).join('/'))
  }
  return values
}

/**
 * 将绝对路径转换成项目相对路径。
 *
 * 参数：
 * - basePath：项目根目录。
 * - pathText：需要转换的路径。
 *
 * 返回：
 * - 相对项目根目录的路径；不在根目录内时返回去掉开头斜杠后的路径。
 */
export const toProjectRelativePath = (basePath, pathText) => {
  const base = String(basePath || '').trim().replace(/\\/g, '/').replace(/\/+$/, '')
  const raw = String(pathText || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  if (base && raw === base) return ''
  if (base && raw.startsWith(`${base}/`)) {
    return raw.slice(base.length + 1)
  }
  return raw.replace(/^\/+/, '')
}

/**
 * 根据项目已配置资源生成可用删除范围。
 *
 * 参数：
 * - project：项目行数据。
 *
 * 返回：
 * - 删除弹框可展示的删除范围选项。
 */
export const getProjectDeleteScopeOptions = (project) => {
  const dbName = String(project?.databaseName ?? project?.database_name ?? '').trim()
  const nginxPath = String(project?.nginxPath ?? project?.nginx_conf_path ?? '').trim()
  return PROJECT_DELETE_SCOPE_OPTIONS.filter((item) => {
    const needsDb = item.value === 'project_conda_and_db' || item.value === 'project_conda_db_nginx'
    const needsNginx = item.value === 'project_conda_nginx' || item.value === 'project_conda_db_nginx'
    if (needsDb && !dbName) return false
    if (needsNginx && !nginxPath) return false
    return true
  })
}

/**
 * 替换删除确认文案中的项目名占位符。
 *
 * 参数：
 * - template：包含 `{name}` 的模板文本。
 * - name：项目名。
 *
 * 返回：
 * - 替换后的文案。
 */
export const fillDeleteText = (template, name) => String(template || '').split('{name}').join(name || '')

/**
 * 拼接路径前缀和子路径。
 *
 * 参数：
 * - prefix：路径前缀。
 * - name：子路径或文件名。
 *
 * 返回：
 * - 去除重复斜杠后的拼接结果。
 */
export const normalizeJoinPath = (prefix, name) => {
  const base = String(prefix || '').trim().replace(/\/+$/, '')
  const child = String(name || '').trim().replace(/^\/+/, '')
  return child ? `${base}/${child}` : base
}

/**
 * 校验创建阶段端口是否在允许范围内。
 *
 * 参数：
 * - value：端口输入值。
 * - min：最小端口。
 * - max：最大端口。
 *
 * 返回：
 * - 合法返回 true，否则 false。
 */
export const isPortInCreateRange = (value, min, max) => {
  const text = String(value || '').trim()
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= min && num <= max
}
