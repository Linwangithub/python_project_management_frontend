import { PROJECT_DELETE_SCOPE_OPTIONS } from './dialogConstants'

const ANSI_ESCAPE_RE = /\u001b\[[0-9;?]*[ -/]*[@-~]/g
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B-\u001F\u007F]/g

export const sanitizeTerminalLine = (line) => {
  return String(line ?? '')
    .replace(ANSI_ESCAPE_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .replace(/\uFFFD/g, '')
}

export const sanitizeTerminalLines = (lines) => {
  if (!Array.isArray(lines)) return []
  return lines
    .map((line) => sanitizeTerminalLine(line))
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

export const sleep = (ms = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const splitPathToSegments = (pathText) => {
  const value = String(pathText || '').trim().replace(/\\/g, '/')
  if (!value) return []
  return value.split('/').filter((item) => !!item)
}

export const buildCascaderPathValues = (pathText) => {
  const segs = splitPathToSegments(pathText)
  const values = ['__root__']
  for (let i = 0; i < segs.length; i += 1) {
    values.push(segs.slice(0, i + 1).join('/'))
  }
  return values
}

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


export const fillDeleteText = (template, name) => String(template || '').split('{name}').join(name || '')

export const normalizeJoinPath = (prefix, name) => {
  const base = String(prefix || '').trim().replace(/\/+$/, '')
  const child = String(name || '').trim().replace(/^\/+/, '')
  return child ? `${base}/${child}` : base
}

export const isPortInCreateRange = (value, min, max) => {
  const text = String(value || '').trim()
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= min && num <= max
}

