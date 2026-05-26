import { ROOT_PATH_VALUE } from './projectSettingConstants'

/**
 * 清洗端口输入值。
 *
 * 参数：
 * - value：端口输入框原始值。
 *
 * 返回：
 * - 去掉首尾空白后的字符串。
 */
export const sanitizePort = (value) => String(value || '').trim()

/**
 * 判断输入是否包含非空文本。
 *
 * 参数：
 * - value：任意输入值。
 *
 * 返回：
 * - 转为字符串并 trim 后长度大于 0 时返回 true。
 */
export const hasText = (value) => String(value || '').trim().length > 0

/**
 * 组合项目根目录和入口文件路径。
 *
 * 参数：
 * - basePath：项目后端根目录。
 * - entryPath：入口文件路径，可为绝对路径或相对路径。
 *
 * 返回：
 * - 入口文件绝对路径；输入为空时返回空字符串。
 */
export const normalizeAbsolutePath = (basePath, entryPath) => {
  const base = String(basePath || '').trim().replace(/\/+$/, '')
  const rawEntry = String(entryPath || '').trim()
  if (!rawEntry) return ''
  if (/^[a-zA-Z]:[\\/]/.test(rawEntry) || rawEntry.startsWith('/')) {
    return rawEntry
  }
  const entry = rawEntry.replace(/^\/+/, '')
  if (!base) return entry
  if (entry.startsWith(base)) return entry
  return `${base}/${entry}`
}

/**
 * 判断 Nginx 配置路径是否包含通配符。
 *
 * 参数：
 * - value：配置路径。
 *
 * 返回：
 * - 包含星号、问号或左方括号时返回 true。
 */
export const hasNginxWildcard = (value) => /[*?\[]/.test(String(value || ''))

/**
 * 判断路径是否指向 Nginx modules 目录。
 *
 * 参数：
 * - value：配置路径。
 *
 * 返回：
 * - 路径包含 modules 目录时返回 true。
 */
export const isNginxModulesPath = (value) => {
  const path = String(value || '').trim().replace(/\\/g, '/')
  return path.includes('/modules') || path.includes('/modules/')
}

/**
 * 校验 Nginx 配置文件名。
 *
 * 参数：
 * - value：文件名输入值。
 *
 * 返回：
 * - 非空、不含路径分隔符且以 .conf 结尾时返回 true。
 */
export const isValidConfFileName = (value) => {
  const name = String(value || '').trim()
  if (!name) return false
  if (name.includes('/') || name.includes('\\')) return false
  return name.endsWith('.conf')
}

/**
 * 拼接目录和文件名。
 *
 * 参数：
 * - dir：目录路径。
 * - file：文件名或子路径。
 *
 * 返回：
 * - 标准化后的拼接路径。
 */
export const joinPath = (dir, file) => {
  const left = String(dir || '').trim().replace(/\/+$/, '')
  const right = String(file || '').trim().replace(/^\/+/, '')
  return right ? `${left}/${right}` : left
}

/**
 * 构建 Nginx 配置目录级联树。
 *
 * 参数：
 * - items：后端返回的 Nginx 配置清单。
 *
 * 返回：
 * - Element Plus Cascader 可使用的目录树 options。
 */
export const buildNginxDirTreeOptions = (items) => {
  const rootMap = new Map()

  /**
   * 在指定 children 中查找或创建目录节点。
   *
   * 参数：
   * - children：当前层级节点列表。
   * - value：节点完整路径。
   * - label：节点展示名称。
   *
   * 返回：
   * - 已存在或新创建的节点。
   */
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

  /**
   * 标记树节点是否为叶子节点。
   *
   * 参数：
   * - node：当前目录树节点。
   */
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

/**
 * 校验端口是否为指定范围内的数字。
 *
 * 参数：
 * - value：端口输入值。
 * - min：最小端口。
 * - max：最大端口。
 *
 * 返回：
 * - 合法返回 true，否则 false。
 */
export const isValidPort = (value, min, max) => {
  const text = sanitizePort(value)
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= min && num <= max
}

/**
 * 构建级联选择器根节点。
 *
 * 参数：
 * - label：根节点显示文本，默认斜杠。
 *
 * 返回：
 * - 级联选择器根节点对象。
 */
export const buildRootCascaderNode = (label = '/') => ({
  label,
  value: ROOT_PATH_VALUE,
  leaf: false,
})

/**
 * 移除 Nginx 配置文本中的注释。
 *
 * 参数：
 * - value：Nginx 配置文本。
 *
 * 返回：
 * - 去掉未被引号包裹的井号注释后的配置文本。
 */
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
