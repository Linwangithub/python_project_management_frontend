import { ROOT_PATH_VALUE } from './projectSettingConstants'

export const sanitizePort = (value) => String(value || '').trim()

export const hasText = (value) => String(value || '').trim().length > 0

export const normalizeAbsolutePath = (basePath, entryPath) => {
  const base = String(basePath || '').trim().replace(/\/+$/, '')
  const entry = String(entryPath || '').trim().replace(/^\/+/, '')
  if (!entry) return ''
  if (entry.startsWith(base)) return entry
  return `${base}/${entry}`
}

export const hasNginxWildcard = (value) => /[*?\[]/.test(String(value || ''))

export const isNginxModulesPath = (value) => {
  const path = String(value || '').trim().replace(/\\/g, '/')
  return path.includes('/modules') || path.includes('/modules/')
}

export const isValidConfFileName = (value) => {
  const name = String(value || '').trim()
  if (!name) return false
  if (name.includes('/') || name.includes('\\')) return false
  return name.endsWith('.conf')
}

export const joinPath = (dir, file) => {
  const left = String(dir || '').trim().replace(/\/+$/, '')
  const right = String(file || '').trim().replace(/^\/+/, '')
  return right ? `${left}/${right}` : left
}

export const buildNginxDirTreeOptions = (items) => {
  const rootMap = new Map()
  const ensureNode = (children, value, label) => {
    let node = children.find((item) => item.value === value)
    if (!node) {
      node = { value, label, children: [] }
      children.push(node)
    }
    return node
  }

  ;(items || []).forEach((item) => {
    const baseDir = String(item.base_dir || item.baseDir || item.path || '').trim()
    const directory = String(item.directory || item.dir_path || item.dirPath || '').trim()
    const status = String(item.status || '').trim()
    if (!baseDir || !directory || status === 'disabled') return

    if (!rootMap.has(baseDir)) {
      rootMap.set(baseDir, { value: baseDir, label: baseDir, children: [] })
    }
    const root = rootMap.get(baseDir)
    const rel = directory.slice(baseDir.length).replace(/^\/+/, '')
    let current = root
    rel.split('/').filter(Boolean).forEach((part) => {
      const nextValue = `${current.value.replace(/\/+$/, '')}/${part}`
      current = ensureNode(current.children, nextValue, part)
    })
  })

  const markLeaf = (node) => {
    if (!node.children || node.children.length === 0) {
      node.leaf = true
      delete node.children
      return
    }
    node.children.forEach(markLeaf)
  }
  const roots = Array.from(rootMap.values())
  roots.forEach(markLeaf)
  return roots
}

export const isValidPort = (value, min, max) => {
  const text = sanitizePort(value)
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= min && num <= max
}

export const buildRootCascaderNode = (label = '/') => ({
  label,
  value: ROOT_PATH_VALUE,
  leaf: false,
})

export const stripNginxComments = (value) => {
  return String(value || '')
    .split('\n')
    .map((line) => {
      let quote = ''
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i]
        if ((ch === '"' || ch === "'") && line[i - 1] !== '\\') quote = quote === ch ? '' : ch
        if (ch === '#' && !quote) return line.slice(0, i)
      }
      return line
    })
    .join('\n')
}

