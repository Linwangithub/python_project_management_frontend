/**
 * 菜单与后端权限 menu_key 映射。
 *
 * 作用：
 * - 前端菜单 key 与后端 RBAC 菜单权限 key 不直接耦合。
 * - 权限字段变更时只需要维护本配置。
 */
export const menuPermissionKeyMap = {
  projects: 'project_management',
  users: 'user_management',
  envs: 'env_management',
  servers: 'server_management',
}

/**
 * 前端动作 code 与后端权限 action_key 映射。
 *
 * 说明：
 * - null 表示该动作只依赖菜单可见权限，不额外检查动作权限。
 * - 非 null 值会与 menuPermissionKeyMap 组合后做按钮级权限控制。
 */
export const actionPermissionKeyMap = {
  projects: {
    start_fg: 'start_foreground',
    start_bg: 'start_background',
    deploy_start: 'deploy_start',
    stop: 'stop',
    setting: 'setting',
    copy: 'copy',
    export: 'export',
    delete: 'delete',
    detail: null,
    log: null,
    tools: null,
  },
  users: {
    delete: 'delete',
  },
  envs: {
    view: null,
    delete: 'delete',
  },
  servers: {
    add_user: 'assign',
    delete_server: 'delete',
    delete_user: 'delete',
  },
}
