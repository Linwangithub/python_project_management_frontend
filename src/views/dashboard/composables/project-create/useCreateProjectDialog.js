import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import {
  DB_PORT_MAX,
  DB_PORT_MIN,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  PORT_MAX,
  PORT_MIN,
  PROJECT_CREATED_TEXT,
  PROJECT_CREATE_FAILED_TEXT,
  PROJECT_CREATING_TEXT,
} from '../dialogConstants'
import {
  normalizeJoinPath,
  sanitizeTerminalLines,
  sleep,
} from '../dialogUtils'
import {
  FRONTEND_DIST_BASE_PATH,
  ROOT_PROJECT_BASE_PATH,
  USER_PROJECT_BASE_PATH_TEMPLATE,
  formatUserPath,
} from '@/config/project/project.paths.config'
import { buildProjectNginxServerTemplate } from '@/config/project/nginx-template.config'
import {
  CREATE_PROJECT_REQUIRED_FIELDS,
  createProjectDialogText,
  createProjectHintText,
  createProjectMessageFactory,
  createProjectMessages,
  createProjectNginxOptionText,
  createProjectPlaceholders,
  createProjectTerminalFactory,
  projectDialogCommonText,
  createProjectLogFilters,
} from '@/config/project/project.dialog.messages.config'

/**
 * Create project dialog workflow.
 * This module owns the create-project dialog fields, validation, nginx/database checks,
 * real create request, and terminal output during creation.
 */
export const useCreateProjectDialog = (options) => {
  const {
    projectCreateForm,
    projectStore,
    projectDialogVisible,
    ensureCreateProjectSession,
    appendSessionLine,
    lockSession,
    unlockSession,
  } = options

  const projectPathOptions = computed(() => {
    const configuredBasePath = String(projectStore.currentProjectBasePath?.value ?? projectStore.currentProjectBasePath ?? '').trim()
    if (configuredBasePath) return [configuredBasePath]

    const username = String(projectStore.currentUsername?.value ?? projectStore.currentUsername ?? 'user').trim()
    const role = String(projectStore.currentRole?.value ?? projectStore.currentRole ?? 'user').trim()
    const isRoot = role === 'root'
    if (isRoot) {
      const rootBase = String(projectStore.projectRootBasePath?.value ?? projectStore.projectRootBasePath ?? '').trim()
      return [rootBase || ROOT_PROJECT_BASE_PATH]
    }

    const userTemplate = String(projectStore.projectUserBasePathTemplate?.value ?? projectStore.projectUserBasePathTemplate ?? '').trim()
    if (userTemplate) {
      return [formatUserPath(userTemplate, username)]
    }
    return [formatUserPath(USER_PROJECT_BASE_PATH_TEMPLATE, username)]
  })
  const getRootBasePath = () => projectPathOptions.value[0] || ROOT_PROJECT_BASE_PATH
  const getCreateBasePath = () => {
    const rawPath = String(projectCreateForm.path || '').trim().replace(/\/+$/, '')
    const projectName = String(projectCreateForm.name || '').trim().replace(/^\/+|\/+$/g, '')
    if (!rawPath) return ''
    if (!projectName) return rawPath
    const suffix = `/${projectName}`
    if (rawPath.endsWith(suffix)) {
      return rawPath.slice(0, -suffix.length) || '/'
    }
    return rawPath
  }
  const getCreateTargetDir = () => normalizeJoinPath(getCreateBasePath(), projectCreateForm.name)
  const isCreatePortValid = (value) => {
    const text = String(value || '').trim()
    if (!/^\d+$/.test(text)) return false
    const num = Number(text)
    return num >= PORT_MIN && num <= PORT_MAX
  }
  const getCreateUsername = () => String(projectStore.currentUsername?.value ?? projectStore.currentUsername ?? 'root').trim() || 'root'
  const isCreateRootRole = () => String(projectStore.currentRole?.value ?? projectStore.currentRole ?? 'user').trim() === 'root'
  const getCreateFrontendRoot = () => {
    const projectName = String(projectCreateForm.name || '').trim()
    return projectName ? `${FRONTEND_DIST_BASE_PATH}/${projectName}` : FRONTEND_DIST_BASE_PATH
  }
  const buildCreateNginxPreview = () => {
    const frontendPort = String(projectCreateForm.nginxFrontendPort || '').trim()
    const backendPort = String(projectCreateForm.nginxBackendPort || '').trim()
    const nginxIp = String(projectCreateForm.nginxServerIp || '').trim()
    const serverIp = String(projectCreateForm.serverIp || '').trim()
    const frontendRoot = getCreateFrontendRoot()
    return buildProjectNginxServerTemplate({
      frontendPort,
      backendPort,
      nginxIp,
      serverIp,
      frontendRoot,
    })
  }
  const canShowCreateNginxPreview = computed(() => {
    if (!projectCreateForm.enableNginx || !projectCreateForm.nginxChecked) return false
    if (!String(projectCreateForm.nginxConfPath || '').trim()) return false
    if (!isCreatePortValid(projectCreateForm.nginxFrontendPort)) return false
    if (!isCreatePortValid(projectCreateForm.nginxBackendPort)) return false
    if (!projectCreateForm.nginxFrontendPortChecked || !projectCreateForm.nginxBackendPortChecked) return false
    return true
  })
  const createNginxPreviewText = computed(() => buildCreateNginxPreview())

  const refreshCreateNginxPreview = () => {
    projectCreateForm.nginxPreviewConfirmed = false
    projectCreateForm.nginxPreviewVisible = false
    const preview = createNginxPreviewText.value
    projectCreateForm.nginxPreviewText = preview
    projectCreateForm.nginxPreviewDraft = preview
  }

  watch(
    () => [
      projectCreateForm.nginxFrontendPort,
      projectCreateForm.nginxBackendPort,
      projectCreateForm.nginxServerIp,
      projectCreateForm.serverIp,
      projectCreateForm.name,
    ],
    (values, oldValues = []) => {
      const current = values.map((x) => String(x || '').trim())
      const previous = Array.isArray(oldValues) ? oldValues.map((x) => String(x || '').trim()) : []
      const oldFrontendPort = previous[0] ?? current[0]
      const oldBackendPort = previous[1] ?? current[1]
      const oldNginxServerIp = previous[2] ?? current[2]

      if (current[0] !== oldFrontendPort) {
        projectCreateForm.nginxFrontendPortChecked = false
      }
      if (current[1] !== oldBackendPort) {
        projectCreateForm.nginxBackendPortChecked = false
      }
      if (current[2] !== oldNginxServerIp) {
        projectCreateForm.nginxFrontendPortChecked = false
        projectCreateForm.nginxBackendPortChecked = false
      }

      refreshCreateNginxPreview()
    },
    { immediate: true },
  )

  const projectServerIpOptions = computed(() => {
    return (projectStore.servers || []).map((x) => x.ip).filter((x) => !!x)
  })

  const projectCreateServerSelected = computed(() => !!String(projectCreateForm.serverIp || '').trim())
  const projectCreateBaseFieldsDisabled = computed(() => !projectCreateServerSelected.value)
  const hasNginxWildcard = (value) => /[*?\[]/.test(String(value || ''))
  const isNginxModulesPath = (value) => {
    const path = String(value || '').trim().replace(/\\/g, '/')
    return path === '/usr/share/nginx/modules' || path.startsWith('/usr/share/nginx/modules/')
  }
  const nginxExistingConfOptions = computed(() => {
    const list = Array.isArray(projectCreateForm.nginxConfOptions) ? projectCreateForm.nginxConfOptions : []
    return list.map((item) => {
      const path = typeof item === 'string' ? item : (item.value || item.path || '')
      const source = typeof item === 'string' ? '' : (item.source || item.type || '')
      const kind = typeof item === 'string' ? 'file' : (item.kind || 'file')
      const status = typeof item === 'string' ? 'available' : (item.status || 'available')
      const selectable = typeof item === 'string' ? true : item.selectable !== false
      const tagMap = createProjectNginxOptionText
      const tag = kind === 'include_pattern'
        ? `${tagMap[source] || tagMap.include}${tagMap.includeRuleSuffix}`
        : (tagMap[source] || '')
      return {
        label: path,
        value: path,
        tag: '',
        disabled: status === 'disabled' || !selectable,
        status,
      }
    }).filter((x) => {
      const value = String(x.value || '').trim()
      return !!value && !hasNginxWildcard(value) && !isNginxModulesPath(value)
    })
  })

  const nginxNewConfBaseOptions = computed(() => {
    const list = Array.isArray(projectCreateForm.nginxNewConfDirs) ? projectCreateForm.nginxNewConfDirs : []
    const seen = new Set()
      return list.map((item) => {
        const baseDir = String(item.base_dir || item.baseDir || item.path || '').trim()
        const status = String(item.status || '').trim()
        if (!baseDir || seen.has(baseDir) || isNginxModulesPath(baseDir)) return null
        seen.add(baseDir)
        return {
        label: baseDir,
        value: baseDir,
        disabled: status === 'disabled',
      }
    }).filter(Boolean)
  })

  const nginxNewConfFolderOptions = computed(() => {
    const baseDir = String(projectCreateForm.nginxNewConfBaseDir || '').trim()
    if (!baseDir) return []
    const list = Array.isArray(projectCreateForm.nginxNewConfDirs) ? projectCreateForm.nginxNewConfDirs : []
    const seen = new Set()
    return list.map((item) => {
        const itemBase = String(item.base_dir || item.baseDir || item.path || '').trim()
        const directory = String(item.directory || item.dir_path || item.dirPath || '').trim()
        const status = String(item.status || '').trim()
        if (!directory || itemBase !== baseDir || isNginxModulesPath(directory)) return null
        if (seen.has(directory)) return null
      seen.add(directory)
      const source = String(item.source || '').trim()
      const tag = source === 'top'
        ? createProjectNginxOptionText.top
        : (source === 'http' ? createProjectNginxOptionText.http : '')
      const folderName = String(item.folder_name || item.folderName || '').trim()
      const label = String(item.label || '').trim() || (folderName ? `${folderName} (${directory})` : directory)
      return {
        label,
        value: directory,
        tag,
        disabled: status === 'disabled',
      }
    }).filter(Boolean)
  })

  const buildNginxDirTreeOptions = (items) => {
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
      if (!baseDir || !directory || !directory.startsWith(baseDir)) return
      if (isNginxModulesPath(baseDir) || isNginxModulesPath(directory)) return
      if (status === 'disabled') return

      if (!rootMap.has(baseDir)) {
        rootMap.set(baseDir, { value: baseDir, label: baseDir, children: [] })
      }
      const root = rootMap.get(baseDir)
      const rel = directory.slice(baseDir.length).replace(/^\/+/, '')
      if (!rel) return

      let current = root
      let currentPath = baseDir
      rel.split('/').filter(Boolean).forEach((part) => {
        currentPath = `${currentPath}/${part}`
        current = ensureNode(current.children, currentPath, part)
      })
    })

    const markLeaf = (node) => {
      if (!node.children || !node.children.length) {
        delete node.children
        node.leaf = true
        return node
      }
      node.children = node.children.map(markLeaf)
      return node
    }

    return Array.from(rootMap.values()).map(markLeaf)
  }

  const nginxNewConfDirTreeOptions = computed(() => {
    const list = Array.isArray(projectCreateForm.nginxNewConfDirs) ? projectCreateForm.nginxNewConfDirs : []
    return buildNginxDirTreeOptions(list)
  })

  const buildCreateField = (field) => ({
    disabled: projectCreateBaseFieldsDisabled.value,
    ...field,
  })

  const buildCreateReadonlyField = (field) => ({
    ...field,
    disabled: true,
  })

  const createNginxConfSelected = computed(() => {
    return !!String(projectCreateForm.nginxConfPath || '').trim()
  })

  const createNginxPortFieldsDisabled = computed(() => {
    return projectCreateBaseFieldsDisabled.value
      || !projectCreateForm.enableNginx
      || !projectCreateForm.nginxChecked
      || !createNginxConfSelected.value
      || !!projectCreateForm.nginxChecking
  })

  const projectCreateDialogFieldsForView = computed(() => [
    {
      key: 'serverIp',
      label: projectDialogCommonText.serverIp,
      component: 'select',
      placeholder: createProjectPlaceholders.chooseServerIp,
      options: projectServerIpOptions.value,
      span: 24,
    },
    buildCreateField({
      key: 'name',
      label: projectDialogCommonText.projectName,
      component: 'input',
      placeholder: createProjectPlaceholders.projectName,
      span: 12,
    }),
    buildCreateField({
      key: 'pythonVersion',
      label: projectDialogCommonText.pythonVersion,
      component: 'input',
      placeholder: createProjectPlaceholders.pythonVersion,
      span: 12,
    }),
    buildCreateField({
      key: 'description',
      label: projectDialogCommonText.projectDescription,
      component: 'textarea',
      placeholder: createProjectPlaceholders.projectDescription,
      rows: 2,
      span: 24,
    }),
    buildCreateReadonlyField({
      key: 'path',
      label: createProjectDialogText.projectLocation,
      component: 'input',
      placeholder: projectPathOptions.value[0] || '',
      disabled: true,
      span: 12,
    }),
    buildCreateReadonlyField({
      key: 'condaName',
      label: projectDialogCommonText.condaEnv,
      component: 'input',
      disabled: true,
      placeholder: createProjectPlaceholders.sameAsProjectName,
      span: 12,
    }),
    buildCreateField({
      key: 'enableNginx',
      label: projectDialogCommonText.nginxConfig,
      component: 'switch',
      activeText: projectDialogCommonText.enable,
      inactiveText: projectDialogCommonText.disable,
      span: 24,
    }),
    buildCreateField({
      key: 'nginxServerIp',
      label: projectDialogCommonText.nginxServerIp,
      component: 'select',
      placeholder: createProjectPlaceholders.chooseNginxServerIp,
      options: projectServerIpOptions.value,
      clearable: true,
      span: 12,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'nginxCheck',
      label: projectDialogCommonText.nginxServiceCheck,
      component: 'button',
      buttonText: projectCreateForm.nginxChecked ? projectDialogCommonText.checkPassed : projectDialogCommonText.nginxCheckButton,
      buttonType: projectCreateForm.nginxChecked ? 'success' : 'primary',
      loading: !!projectCreateForm.nginxChecking,
      disabled: projectCreateBaseFieldsDisabled.value || !String(projectCreateForm.nginxServerIp || '').trim(),
      span: 12,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'nginxConfChooser',
      label: projectDialogCommonText.nginxConfPath,
      component: 'nginxConfChooser',
      disabled: !projectCreateForm.nginxChecked,
      loading: !!projectCreateForm.nginxChecking,
      existingOptions: nginxExistingConfOptions.value,
      baseOptions: nginxNewConfBaseOptions.value,
      folderOptions: nginxNewConfFolderOptions.value,
      dirTreeOptions: nginxNewConfDirTreeOptions.value,
      span: 24,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'nginxFrontendPort',
      label: projectDialogCommonText.nginxFrontendPort,
      component: 'input',
      placeholder: createProjectPlaceholders.nginxFrontendPort,
      disabled: createNginxPortFieldsDisabled.value,
      span: 8,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'nginxBackendPort',
      label: projectDialogCommonText.backendDeployPort,
      component: 'input',
      placeholder: createProjectPlaceholders.backendDeployPort,
      disabled: createNginxPortFieldsDisabled.value,
      span: 8,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'nginxPreview',
      label: projectDialogCommonText.previewDetail,
      component: 'button',
      buttonText: projectCreateForm.nginxPreviewConfirmed ? createProjectDialogText.nginxPreviewConfirmed : projectDialogCommonText.previewDetail,
      buttonType: projectCreateForm.nginxPreviewConfirmed ? 'success' : 'info',
      span: 8,
      visible: projectCreateForm.enableNginx && canShowCreateNginxPreview.value,
    }),
    buildCreateField({
      key: 'nginxHint',
      label: projectDialogCommonText.hint,
      component: 'hint',
      text: projectCreateForm.nginxChecked
        ? createProjectHintText.nginxChecked
        : createProjectHintText.nginxUnchecked,
      hintType: projectCreateForm.nginxChecked ? 'success' : 'warning',
      span: 24,
      visible: projectCreateForm.enableNginx,
    }),
    buildCreateField({
      key: 'enableDatabase',
      label: projectDialogCommonText.databaseConfig,
      component: 'switch',
      activeText: projectDialogCommonText.enable,
      inactiveText: projectDialogCommonText.disable,
      span: 24,
    }),
    buildCreateField({
      key: 'databaseName',
      label: createProjectDialogText.databaseNameSameAsProject,
      component: 'input',
      disabled: true,
      placeholder: createProjectPlaceholders.sameAsProjectName,
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
    buildCreateField({
      key: 'databaseHost',
      label: projectDialogCommonText.databaseIp,
      component: 'selectCreate',
      placeholder: createProjectPlaceholders.databaseIp,
      options: projectServerIpOptions.value,
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
    buildCreateField({
      key: 'databasePort',
      label: projectDialogCommonText.databasePort,
      component: 'input',
      placeholder: createProjectPlaceholders.databasePort,
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
    buildCreateField({
      key: 'databaseUser',
      label: projectDialogCommonText.databaseUser,
      component: 'input',
      placeholder: createProjectPlaceholders.databaseUser,
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
    buildCreateField({
      key: 'databasePassword',
      label: projectDialogCommonText.databasePassword,
      component: 'password',
      placeholder: createProjectPlaceholders.databasePassword,
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
    buildCreateField({
      key: 'databaseCheck',
      label: projectDialogCommonText.databaseConnectionTest,
      component: 'button',
      buttonText: projectCreateForm.dbChecked ? projectDialogCommonText.checkPassed : projectDialogCommonText.check,
      buttonType: projectCreateForm.dbChecked ? 'success' : 'primary',
      span: 12,
      visible: projectCreateForm.enableDatabase,
    }),
  ])

  const resetCreateNginxCheckState = (options = {}) => {
    const clearServerIp = !!options.clearServerIp
    projectCreateForm.nginxChecking = false
    projectCreateForm.nginxChecked = false
    if (clearServerIp) {
      projectCreateForm.nginxServerIp = ''
    }
    projectCreateForm.nginxConfPath = ''
    projectCreateForm.nginxConfOptions = []
    projectCreateForm.nginxNewConfDirs = []
    projectCreateForm.nginxExistingConfPath = ''
    projectCreateForm.nginxNewConfBaseDir = ''
    projectCreateForm.nginxNewConfDirPath = ''
    projectCreateForm.nginxNewConfDirCascaderValue = []
    projectCreateForm.nginxNewConfFileName = ''
    projectCreateForm.nginxFrontendPortChecked = false
    projectCreateForm.nginxBackendPortChecked = false
    projectCreateForm.nginxPreviewVisible = false
    projectCreateForm.nginxPreviewText = createNginxPreviewText.value
    projectCreateForm.nginxPreviewDraft = projectCreateForm.nginxPreviewText
    projectCreateForm.nginxPreviewConfirmed = false
  }


  const openCreateDialog = () => {
    projectCreateForm.name = ''
    projectCreateForm.description = ''
    projectCreateForm.pythonVersion = ''
    projectCreateForm.path = normalizeJoinPath(getRootBasePath(), '')
    projectCreateForm.condaName = ''
    projectCreateForm.enableDatabase = false
    projectCreateForm.databaseName = ''
    projectCreateForm.databaseHost = ''
    projectCreateForm.databasePort = DEFAULT_DB_PORT
    projectCreateForm.databaseUser = DEFAULT_DB_USER
    projectCreateForm.databasePassword = DEFAULT_DB_PASSWORD
    projectCreateForm.dbChecked = false
    projectCreateForm.enableNginx = false
    projectCreateForm.nginxFrontendPort = ''
    projectCreateForm.nginxBackendPort = ''
    projectCreateForm.nginxPreviewVisible = false
    projectCreateForm.nginxPreviewText = ''
    resetCreateNginxCheckState({ clearServerIp: true })
    projectCreateForm.serverIp = ''
    projectDialogVisible.value = true
  }

  watch(
    () => projectCreateForm.name,
    (val) => {
      const name = String(val || '').trim()
      projectCreateForm.condaName = name
      projectCreateForm.path = normalizeJoinPath(getRootBasePath(), name)
      if (projectCreateForm.enableDatabase) {
        projectCreateForm.databaseName = name
      }
      projectCreateForm.nginxFrontendPortChecked = false
      projectCreateForm.nginxBackendPortChecked = false
    },
  )

  watch(
    () => projectStore.currentRole,
    () => {
      projectCreateForm.path = normalizeJoinPath(getRootBasePath(), projectCreateForm.name)
    },
  )

  watch(
    () => projectCreateForm.enableDatabase,
    (enabled) => {
      if (enabled) {
        projectCreateForm.databaseName = String(projectCreateForm.name || '').trim()
        if (!String(projectCreateForm.databaseHost || '').trim()) {
          projectCreateForm.databaseHost = String(projectCreateForm.serverIp || '').trim() || projectServerIpOptions.value[0] || ''
        }
        if (!String(projectCreateForm.databasePort || '').trim()) {
          projectCreateForm.databasePort = DEFAULT_DB_PORT
        }
        if (!String(projectCreateForm.databaseUser || '').trim()) {
          projectCreateForm.databaseUser = DEFAULT_DB_USER
        }
        if (!String(projectCreateForm.databasePassword || '')) {
          projectCreateForm.databasePassword = DEFAULT_DB_PASSWORD
        }
      } else {
        projectCreateForm.databaseName = ''
      }
      projectCreateForm.dbChecked = false
    },
  )

  watch(
    () => [projectCreateForm.databaseHost, projectCreateForm.databasePort, projectCreateForm.databaseUser, projectCreateForm.databasePassword],
    () => {
      if (projectCreateForm.enableDatabase) {
        projectCreateForm.dbChecked = false
      }
    },
  )

  watch(
    () => projectCreateForm.nginxConfPath,
    () => {
      projectCreateForm.nginxFrontendPortChecked = false
      projectCreateForm.nginxBackendPortChecked = false
      projectCreateForm.nginxPreviewConfirmed = false
      projectCreateForm.nginxPreviewVisible = false
    },
  )


  watch(
    () => projectCreateForm.enableNginx,
    async (enabled) => {
      if (!enabled) {
        resetCreateNginxCheckState({ clearServerIp: true })
        return
      }
      if (!String(projectCreateForm.nginxServerIp || '').trim()) {
        projectCreateForm.nginxServerIp = String(projectCreateForm.serverIp || '').trim()
      }
      resetCreateNginxCheckState()
    },
  )

  watch(
    () => projectCreateForm.nginxServerIp,
    () => {
      if (!projectCreateForm.enableNginx) return
      resetCreateNginxCheckState()
    },
  )


  watch(
    () => projectCreateForm.serverIp,
    async () => {
      projectCreateForm.dbChecked = false
      projectCreateForm.nginxFrontendPortChecked = false
      projectCreateForm.nginxBackendPortChecked = false
      resetCreateNginxCheckState()
      const serverIp = String(projectCreateForm.serverIp || '').trim()
      if (!serverIp) {
        projectCreateForm.name = ''
        projectCreateForm.description = ''
        projectCreateForm.pythonVersion = ''
        projectCreateForm.condaName = ''
        projectCreateForm.path = normalizeJoinPath(getRootBasePath(), '')
        projectCreateForm.enableDatabase = false
        projectCreateForm.enableNginx = false
        resetCreateNginxCheckState({ clearServerIp: true })
        return
      }
      projectCreateForm.path = normalizeJoinPath(getRootBasePath(), projectCreateForm.name)
      projectCreateForm.databaseHost = serverIp
      projectCreateForm.nginxServerIp = serverIp
    },
  )


  const checkProjectNameOnBlur = async () => {
    if (!projectDialogVisible.value) return

    const name = String(projectCreateForm.name || '').trim()
    const basePath = getCreateBasePath()
    const serverIp = String(projectCreateForm.serverIp || '').trim()

    if (!name || !basePath || !serverIp) return

    try {
      const resp = await projectApi.checkProjectName({
        name,
        base_path: basePath,
        server_ip: serverIp,
      })
      const exists = !!resp.data?.data?.exists
      if (exists) {
        ElMessage.error(createProjectMessages.projectNameExists)
      }
    } catch (error) {
      ElMessage.error(getErrorMessage(error, createProjectMessages.projectNameCheckFailed))
    }
  }

  const ensureRequiredProjectFields = () => {
    for (const field of CREATE_PROJECT_REQUIRED_FIELDS) {
      const label = field.labelKey ? projectDialogCommonText[field.labelKey] : field.labelText
      if (!String(projectCreateForm[field.key] || '').trim()) {
        ElMessage.warning(createProjectMessageFactory.required(label))
        return false
      }
    }
    return true
  }

  const ensureNginxReadyForCreate = () => {
    if (!projectCreateForm.enableNginx) return true
    if (!String(projectCreateForm.nginxServerIp || '').trim()) {
      ElMessage.warning(createProjectMessages.nginxServerIpRequired)
      return false
    }
    if (!projectCreateForm.nginxChecked) {
      ElMessage.warning(createProjectMessages.nginxCheckRequired)
      return false
    }
    if (!String(projectCreateForm.nginxConfPath || '').trim()) {
      ElMessage.warning(createProjectMessages.nginxConfRequired)
      return false
    }
    if (!isCreatePortValid(projectCreateForm.nginxFrontendPort)) {
      ElMessage.warning(createProjectMessageFactory.portRange(projectDialogCommonText.nginxFrontendPort, PORT_MIN, PORT_MAX))
      return false
    }
    if (!isCreatePortValid(projectCreateForm.nginxBackendPort)) {
      ElMessage.warning(createProjectMessageFactory.portRange(projectDialogCommonText.backendDeployPort, PORT_MIN, PORT_MAX))
      return false
    }
    const createServerIp = String(projectCreateForm.serverIp || '').trim()
    const createNginxIp = String(projectCreateForm.nginxServerIp || '').trim()
    if (createServerIp && createNginxIp && createServerIp === createNginxIp && String(projectCreateForm.nginxFrontendPort).trim() === String(projectCreateForm.nginxBackendPort).trim()) {
      ElMessage.warning(createProjectMessages.nginxSameServerPortConflict)
      return false
    }
    if (!projectCreateForm.nginxFrontendPortChecked || !projectCreateForm.nginxBackendPortChecked) {
      ElMessage.warning(createProjectMessages.nginxPortCheckRequired)
      return false
    }
    if (!projectCreateForm.nginxPreviewConfirmed || !String(projectCreateForm.nginxPreviewText || '').trim()) {
      ElMessage.warning(createProjectMessages.nginxPreviewConfirmRequired)
      return false
    }
    const existingPath = String(projectCreateForm.nginxExistingConfPath || '').trim()
    const newDir = String(projectCreateForm.nginxNewConfDirPath || '').trim()
    const newFile = String(projectCreateForm.nginxNewConfFileName || '').trim()
    const confPath = String(projectCreateForm.nginxConfPath || '').trim()
    if (existingPath && (newDir || newFile)) {
      ElMessage.warning(createProjectMessages.nginxExistingAndNewConflict)
      return false
    }
    if (!confPath.startsWith('/')) {
      ElMessage.warning(createProjectMessages.nginxConfPathMustAbsolute)
      return false
    }
    if (newDir || newFile) {
      if (!String(projectCreateForm.nginxNewConfBaseDir || '').trim()) {
        ElMessage.warning(createProjectMessages.nginxBaseDirRequired)
        return false
      }
      if (!newDir) {
        ElMessage.warning(createProjectMessages.nginxDirRequired)
        return false
      }
      if (!newFile) {
        ElMessage.warning(createProjectMessages.nginxFileNameRequired)
        return false
      }
      if (newFile.includes('/') || newFile.includes('\\') || !newFile.toLowerCase().endsWith('.conf')) {
        ElMessage.warning(createProjectMessages.nginxFileNameInvalid)
        return false
      }
    }
    return true
  }

  const checkDatabaseConnection = async () => {
    if (!projectCreateForm.enableDatabase) return true

    const host = String(projectCreateForm.databaseHost || '').trim()
    const port = String(projectCreateForm.databasePort || '').trim()
    const username = String(projectCreateForm.databaseUser || '').trim()
    const password = String(projectCreateForm.databasePassword || '')

    if (!host) {
      ElMessage.warning(createProjectMessages.databaseHostRequired)
      return false
    }
    if (!port || Number.isNaN(Number(port))) {
      ElMessage.warning(createProjectMessages.databasePortInvalid)
      return false
    }
    const dbPortNum = Number(port)
    if (dbPortNum < DB_PORT_MIN || dbPortNum > DB_PORT_MAX) {
      ElMessage.warning(createProjectMessageFactory.portRange(projectDialogCommonText.databasePort, DB_PORT_MIN, DB_PORT_MAX))
      return false
    }
    if (!username) {
      ElMessage.warning(createProjectMessages.databaseUserRequired)
      return false
    }

    try {
      const resp = await projectApi.checkProjectDatabase({
        host,
        port: dbPortNum,
        username,
        password,
        database_name: String(projectCreateForm.databaseName || '').trim(),
      })
      const data = resp.data?.data || {}
      if (data.can_create === true) {
        projectCreateForm.dbChecked = true
        ElMessage.success(createProjectMessages.databaseConnectSuccessCanCreate)
        return true
      }
      projectCreateForm.dbChecked = false
      ElMessage.warning(createProjectMessages.databaseExistsChangeProjectName)
      return false
    } catch (error) {
      projectCreateForm.dbChecked = false
      ElMessage.error(createProjectMessages.databaseConnectFailed)
      return false
    }
  }

  const checkNginxAvailability = async (showSuccess = true) => {
    if (!projectCreateForm.enableNginx) return true
    const serverIp = String(projectCreateForm.serverIp || '').trim()
    const nginxServerIp = String(projectCreateForm.nginxServerIp || '').trim()
    if (!serverIp) {
      ElMessage.warning(createProjectMessages.serverIpChooseFirst)
      return false
    }
    if (!nginxServerIp) {
      ElMessage.warning(createProjectMessages.nginxServerIpChoose)
      return false
    }
    try {
      resetCreateNginxCheckState()
      projectCreateForm.nginxChecking = true
      const resp = await projectApi.checkProjectNginx({
        server_ip: serverIp,
        nginx_server_ip: nginxServerIp,
      })
      const data = resp.data?.data || {}
      const confPath = String(data.conf_path || '')
      const confFiles = Array.isArray(data.conf_files) ? data.conf_files : []
      const newConfDirs = Array.isArray(data.new_conf_dirs) ? data.new_conf_dirs : []
      if (!confPath && !confFiles.length && !newConfDirs.length) {
        ElMessage.warning(createProjectMessages.nginxConfMissing)
        projectCreateForm.enableNginx = false
        resetCreateNginxCheckState()
        return false
      }
      projectCreateForm.nginxConfOptions = confFiles.length ? confFiles : (confPath ? [{ path: confPath, source: 'main' }] : [])
      projectCreateForm.nginxNewConfDirs = newConfDirs
      projectCreateForm.nginxConfPath = ''
      projectCreateForm.nginxExistingConfPath = ''
      projectCreateForm.nginxNewConfBaseDir = ''
      projectCreateForm.nginxNewConfDirPath = ''
      projectCreateForm.nginxNewConfDirCascaderValue = []
      projectCreateForm.nginxNewConfFileName = ''
      projectCreateForm.nginxChecked = true
      if (showSuccess) {
        ElMessage.success(createProjectMessages.nginxServiceAvailable)
      }
      return true
    } catch (error) {
      projectCreateForm.enableNginx = false
      resetCreateNginxCheckState()
      ElMessage.error(getErrorMessage(error, createProjectMessages.nginxServiceUnavailable))
      return false
    } finally {
      projectCreateForm.nginxChecking = false
    }
  }

  const validateCreateNginxPortPair = () => {
    if (!projectCreateForm.enableNginx) return true
    const frontend = String(projectCreateForm.nginxFrontendPort || '').trim()
    const backend = String(projectCreateForm.nginxBackendPort || '').trim()
    const serverIp = String(projectCreateForm.serverIp || '').trim()
    const nginxIp = String(projectCreateForm.nginxServerIp || '').trim()
    if (serverIp && nginxIp && serverIp === nginxIp && frontend && backend && frontend === backend) {
      projectCreateForm.nginxFrontendPortChecked = false
      projectCreateForm.nginxBackendPortChecked = false
      ElMessage.warning(createProjectMessages.nginxSameServerPortConflict)
      return false
    }
    return true
  }

  const checkCreateNginxPort = async (kind) => {
    if (!projectCreateForm.enableNginx) return true
    if (!String(projectCreateForm.nginxConfPath || '').trim()) {
      ElMessage.warning(createProjectMessages.nginxConfChooseFirst)
      return false
    }
    const isFrontend = kind === 'frontend'
    const key = isFrontend ? 'nginxFrontendPort' : 'nginxBackendPort'
    const checkedKey = isFrontend ? 'nginxFrontendPortChecked' : 'nginxBackendPortChecked'
    const label = isFrontend ? projectDialogCommonText.nginxFrontendPort : projectDialogCommonText.backendDeployPort
    const portText = String(projectCreateForm[key] || '').trim()
    projectCreateForm[checkedKey] = false
    projectCreateForm.nginxPreviewConfirmed = false
    if (!isCreatePortValid(portText)) {
      if (portText) ElMessage.warning(createProjectMessageFactory.portRange(label, PORT_MIN, PORT_MAX))
      return false
    }
    if (!validateCreateNginxPortPair()) return false
    try {
      await projectApi.checkProjectPort({
        project_id: 0,
        port: Number(portText),
        check_nginx_conf: true,
        nginx_server_ip: String(projectCreateForm.nginxServerIp || '').trim(),
      })
      projectCreateForm[checkedKey] = true
      ElMessage.success(createProjectMessageFactory.portAvailable(label))
      return true
    } catch (error) {
      ElMessage.warning(getErrorMessage(error, createProjectMessageFactory.portCheckFailed(label)))
      return false
    }
  }


  const ensureServerIdByIp = (ip) => {
    const row = (projectStore.servers || []).find((x) => x.ip === ip)
    return row?.id || null
  }

  const confirmCreateProjectReal = async () => {
    if (!ensureRequiredProjectFields()) return
    if (!ensureNginxReadyForCreate()) return

    const projectName = String(projectCreateForm.name || '').trim()
    const pythonVersion = String(projectCreateForm.pythonVersion || '').trim()
    const description = String(projectCreateForm.description || '').trim()
    const path = getCreateBasePath()
    const condaName = String(projectCreateForm.condaName || '').trim()
    const enableDatabase = !!projectCreateForm.enableDatabase
    const enableNginx = !!projectCreateForm.enableNginx
    const databaseName = enableDatabase ? String(projectCreateForm.databaseName || '').trim() : ''
    const databaseHost = enableDatabase ? String(projectCreateForm.databaseHost || '').trim() : ''
    const databasePort = enableDatabase ? Number(projectCreateForm.databasePort || 0) : null
    const databaseUser = enableDatabase ? String(projectCreateForm.databaseUser || '').trim() : ''
    const databasePassword = enableDatabase ? String(projectCreateForm.databasePassword || '') : ''
    const serverIp = String(projectCreateForm.serverIp || '').trim()
    const nginxServerIp = enableNginx ? String(projectCreateForm.nginxServerIp || '').trim() : ''
    const nginxConfPath = enableNginx ? String(projectCreateForm.nginxConfPath || '').trim() : ''
    const nginxFrontendPort = enableNginx ? String(projectCreateForm.nginxFrontendPort || '').trim() : ''
    const nginxBackendPort = enableNginx ? String(projectCreateForm.nginxBackendPort || '').trim() : ''
    const serverId = ensureServerIdByIp(serverIp)
    const targetDir = getCreateTargetDir()
    const mkdirCmd = `mkdir -p ${targetDir}`
    const condaCreateCmd = `conda create -n ${condaName} python=${pythonVersion} -y`
    const condaCheckCmd = `conda run -n ${condaName} python --version`

    projectDialogVisible.value = false

    const existsLocal = projectStore.projects.some((x) => x.name === projectName)
    if (existsLocal) {
      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATING_TEXT })
    } else {
      projectStore.prependProject({
        id: 0,
        owner: projectStore.currentUsername,
        name: projectName,
        description,
        serverId,
        serverIp,
        backendPath: targetDir,
        condaEnvName: condaName,
        databaseName,
        nginxPath: enableNginx ? nginxConfPath : '',
        nginxServerIp: enableNginx ? nginxServerIp : '',
        frontendPort: enableNginx ? nginxFrontendPort : '',
        backendDeployPort: enableNginx ? nginxBackendPort : '',
        pythonVersion,
        status: PROJECT_CREATING_TEXT,
      })
    }

    let sessionInfo = null
    const appendStepLine = async (line, delay = 120) => {
      if (!sessionInfo?.localSessionId) return
      appendSessionLine(sessionInfo.localSessionId, line)
      if (delay > 0) await sleep(delay)
    }

    const refreshProjectListAfterCreate = async () => {
      try {
        await projectStore.loadBundle()
      } catch (refreshError) {
        console.warn(createProjectMessages.refreshProjectListFailed, refreshError)
      }
    }

    try {
      sessionInfo = await ensureCreateProjectSession(serverIp)
      lockSession(sessionInfo.localSessionId, createProjectTerminalFactory.lock(projectName))

      await appendStepLine(createProjectTerminalFactory.stepConnect(serverIp))
      await appendStepLine('')
      await appendStepLine(createProjectTerminalFactory.stepStartCreateDir(targetDir))
      await appendStepLine(createProjectTerminalFactory.commandDone(mkdirCmd))
      await appendStepLine('')
      await appendStepLine(createProjectTerminalFactory.createConda(condaName, pythonVersion))
      await appendStepLine(createProjectTerminalFactory.commandRunning(condaCreateCmd), 80)
    } catch (error) {
      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
      ElMessage.error(getErrorMessage(error, createProjectMessages.createSessionFailed))
      await refreshProjectListAfterCreate()
      return
    }

    if (enableNginx && !projectCreateForm.nginxChecked) {
      const okNginx = await checkNginxAvailability()
      if (!okNginx) {
        projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
        appendSessionLine(sessionInfo.localSessionId, createProjectTerminalFactory.createFailed(createProjectMessages.nginxAvailabilityCheckFailed))
        await refreshProjectListAfterCreate()
        unlockSession(sessionInfo.localSessionId)
        return
      }
    }

    if (enableDatabase && !projectCreateForm.dbChecked) {
      const ok = await checkDatabaseConnection()
      if (!ok) {
        projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
        appendSessionLine(sessionInfo.localSessionId, createProjectTerminalFactory.createFailed(createProjectMessages.databaseConnectionCheckFailed))
        await refreshProjectListAfterCreate()
        unlockSession(sessionInfo.localSessionId)
        return
      }
    }

    try {
      const checkResp = await projectApi.checkProjectName({
        name: projectName,
        base_path: path,
        server_ip: serverIp,
      })
      if (checkResp.data?.data?.exists) {
        projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
        appendSessionLine(sessionInfo.localSessionId, createProjectTerminalFactory.createFailedDirectoryExists(targetDir))
        ElMessage.error(createProjectMessages.projectNameExists)
        await refreshProjectListAfterCreate()
        unlockSession(sessionInfo.localSessionId)
        return
      }
    } catch (error) {
      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
      appendSessionLine(sessionInfo.localSessionId, createProjectTerminalFactory.createFailedDuplicateCheck(getErrorMessage(error, createProjectMessages.unknownError)))
      ElMessage.error(getErrorMessage(error, createProjectMessages.projectNameCheckFailed))
      await refreshProjectListAfterCreate()
      unlockSession(sessionInfo.localSessionId)
      return
    }

    try {
      const resp = await projectApi.createProjectReal({
        name: projectName,
        description,
        python_version: pythonVersion,
        base_path: path,
        conda_env_name: condaName,
        use_database: enableDatabase,
        database_name: databaseName,
        database_host: databaseHost,
        database_port: databasePort,
        database_user: databaseUser,
        database_password: databasePassword,
        use_nginx: enableNginx,
        nginx_server_ip: nginxServerIp,
        nginx_conf_path: nginxConfPath,
        frontend_port: nginxFrontendPort,
        backend_deploy_port: nginxBackendPort,
        nginx_config_text: enableNginx ? String(projectCreateForm.nginxPreviewText || '') : '',
        server_ip: serverIp,
      })

      const data = resp.data?.data || {}
      const logs = sanitizeTerminalLines(data.logs || [])

      await appendStepLine(createProjectTerminalFactory.commandDone(condaCreateCmd))
      await appendStepLine('')
      await appendStepLine(createProjectTerminalFactory.checkConda(4))
      await appendStepLine(`  ${createProjectTerminalFactory.commandDone(condaCheckCmd).replace(/ ---> .+$/, '')}`)

      const pyVersionLines = logs.filter((line) => /^Python\s+\d+/i.test(line))
      for (const line of pyVersionLines) {
        await appendStepLine(line)
      }

      let stepNo = 4
      if (enableDatabase && databaseName) {
        stepNo += 1
        await appendStepLine('')
        await appendStepLine(createProjectTerminalFactory.createDatabase(stepNo, databaseName))
        const dbLogLines = logs.filter((line) => createProjectLogFilters.databaseInclude.test(line))
        const usefulDbLines = dbLogLines.filter((line) => !/conda create|Collecting|Downloading|Installing/i.test(line))
        if (usefulDbLines.length) {
          for (const line of usefulDbLines) {
            await appendStepLine(`  ${line.replace(/^\d+\.\s*/, '')}`)
          }
        } else {
          await appendStepLine(createProjectTerminalFactory.createDatabaseDone(databaseName))
        }
      }

      if (enableNginx) {
        stepNo += 1
        await appendStepLine('')
        await appendStepLine(createProjectTerminalFactory.writeNginx(stepNo, nginxConfPath))
        await appendStepLine(createProjectTerminalFactory.nginxServerIp(nginxServerIp))
        await appendStepLine(createProjectTerminalFactory.nginxFrontendPort(nginxFrontendPort))
        await appendStepLine(createProjectTerminalFactory.backendDeployPort(nginxBackendPort))
        const nginxLogLines = logs
          .filter((line) => createProjectLogFilters.nginxInclude.test(line))
          .filter((line) => !createProjectLogFilters.nginxExclude.test(line))
        const seenNginxLogs = new Set()
        for (const line of nginxLogLines) {
          const normalized = line.replace(/^\d+\.\s*/, '').trim()
          if (!normalized || seenNginxLogs.has(normalized)) continue
          seenNginxLogs.add(normalized)
          await appendStepLine(`  ${normalized}`)
        }
        await appendStepLine(createProjectTerminalFactory.writeNginxDone())
      }

      await appendStepLine('')
      await appendStepLine(createProjectTerminalFactory.createProjectSuccess(stepNo + 1), 0)


      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATED_TEXT })
      ElMessage.success(createProjectMessages.projectCreateSuccess)
      await projectStore.loadBundle()
      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATED_TEXT })
    } catch (error) {
      const msg = getErrorMessage(error, createProjectMessages.projectCreateFailed)
      projectStore.updateProjectByName(projectName, { status: PROJECT_CREATE_FAILED_TEXT })
      appendSessionLine(sessionInfo.localSessionId, createProjectTerminalFactory.createFailed(msg))
      ElMessage.error(msg)
      await refreshProjectListAfterCreate()
    } finally {
      unlockSession(sessionInfo.localSessionId)
    }
  }


  const onCreateProjectDatabaseCheck = async () => {
    await checkDatabaseConnection()
  }

  const onCreateProjectNginxCheck = async () => {
    await checkNginxAvailability()
  }

  const onCreateProjectNginxPortBlur = async (kind) => {
    await checkCreateNginxPort(kind)
  }

  return {
    projectCreateDialogFieldsForView,
    openCreateProjectDialog: openCreateDialog,
    checkProjectNameOnBlur,
    confirmCreateProjectReal,
    onCreateProjectDatabaseCheck,
    onCreateProjectNginxCheck,
    onCreateProjectNginxPortBlur,
  }
}
