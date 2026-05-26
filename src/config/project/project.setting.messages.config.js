/**
 * 项目设置弹框提示文案配置。
 *
 * 作用：
 * - 集中维护校验、确认、成功、失败提示语。
 * - 避免 `ProjectSettingDialog.vue` 中散落大量硬编码文案。
 */

/** 设置弹框通用提示文案。 */
export const settingMessages = {
  databaseCheckRequired: '请先测试数据库连接',
  databaseConnectSuccessCanCreate: '连接成功，该数据库不存在，可以创建使用',
  databaseExistsChangeName: '连接成功，但该数据库已经存在，不可创建，请更改数据库名称',
  databaseConnectFailed: '连接失败',
  databaseHostRequired: '请填写数据库IP',
  databaseUserRequired: '请填写数据库账号',
  databaseNameRequired: '请填写数据库名称',
  databaseCheckClickRequired: '请先点击 Check 测试数据库连接',
  condaEnvRequired: '请填写Conda环境',
  projectServerIpMissing: '项目服务器IP缺失',
  nginxServerIpRequired: '请选择Nginx服务器IP',
  nginxCheckRequired: '请先检测Nginx服务',
  nginxConfirmDetailRequired: '请先确认Nginx详细配置',
  nginxConfigRequired: 'Nginx详细配置不能为空',
  nginxServiceAvailable: 'Nginx服务可用',
  nginxServiceUnavailable: 'Nginx服务不可用',
  nginxSameServerPortConflict: '服务器IP和Nginx服务器IP相同时，Nginx前端端口和后端部署端口不能相同',
  nginxConfPathRequired: '请选择已有Nginx配置文件，或新建一个 .conf 配置文件',
  entryFileRequired: '请先选择项目入口文件位置',
  entryPathLoadFailed: '加载入口文件路径失败',
  sameEntryFile: '和原项目入口文件一样，请修改',
  sameDevCommand: '和原开发启动命令一样，请修改',
  sameDeployCommand: '和原部署启动命令一样，请修改',
  descriptionSameAsOriginal: '和原项目描述一样，请修改',
  portMustBeNumber: '端口必须为数字',
  portCheckFailed: '端口校验失败',
  condaEnvListLoadFailed: '查询Conda环境列表失败',
  projectIdMissingForPortCheck: '项目ID缺失，无法校验端口',
  pythonVersionRequired: '请填写Python版本',
  databaseUnchangedUsable: '当前数据库配置未修改，可直接使用',
  condaEnvSameAsOriginal: '和原Conda环境一样，请修改',
  condaSwitchToExisting: '将切换到已有Conda环境',
  condaCreateNew: '将创建新的Conda环境',
  dropOriginalDatabaseSelected: '已选择不保留原数据库，将在点击确认设置后删除',
}

/** 设置弹框确认框文案。 */
export const settingConfirmMessages = {
  nginxModifyTitle: '确认修改Nginx配置',
  nginxModifyContent: '这会删除原配置信息并使用新的Nginx配置，是否确认？',
  condaPolicyTitle: 'Conda环境处理',
  databasePolicyTitle: '原数据库处理',
  databasePolicyContent: '是否保留原数据库，如果选择不保留则会直接删除原数据库。',
  retainButtonText: '保留',
  dropButtonText: '不保留',
  dangerousConfirmTitle: '危险操作确认',
  dangerousConfirmContent: '原配置信息将会实际删除，请谨慎操作。',
  okButtonText: '确定',
  confirmButtonText: '确认',
  cancelButtonText: '取消',
}

/** 构造带动态参数的设置提示文案。 */
export const settingMessageFactory = {
  duplicatePort(other, current) {
    return `${other} 与 ${current} 不能相同`
  },
  nginxListenRequired(port) {
    return `Nginx详细配置必须包含 listen ${port}`
  },
  nginxProxyPassRequired(port) {
    return `Nginx详细配置必须包含 proxy_pass 后端端口 ${port}`
  },
  dbPortInvalid(min, max) {
    return `数据库端口不合法（${min}-${max}）`
  },
  nginxFrontendPortInvalid(min, max) {
    return `Nginx前端端口不合法（${min}-${max}）`
  },
  backendDeployPortInvalid(min, max) {
    return `后端部署端口不合法（${min}-${max}）`
  },
  backendDevPortInvalid(min, max) {
    return `后端开发端口不合法（${min}-${max}）`
  },
  portRangeInvalid(label, min, max) {
    return `${label}需在 ${min}-${max} 范围内`
  },
  portAvailable(label) {
    return `${label}可用`
  },
  portCheckFailed(label) {
    return `${label}校验失败`
  },
  dropOriginalCondaSelected(name) {
    return `已选择不保留原【${name}】Conda环境，将在点击确认设置后删除`
  },  condaPolicyQuestion(original) {
    return `是否保留原【${original}】Conda环境`
  },
  condaCreatePythonTip(nextName) {
    return `新Conda环境【${nextName}】不存在，请填写Python版本；最终确认后会创建该环境。`
  },
  newConfSelectedDir(dir) {
    return `已选择目录：${dir}`
  },
  newConfFinalPath(path) {
    return `最终路径：${path}`
  },

}
