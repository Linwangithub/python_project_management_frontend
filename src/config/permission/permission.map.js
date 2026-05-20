export const menuPermissionKeyMap = {
  projects: 'project_management',
  users: 'user_management',
  envs: 'env_management',
  servers: 'server_management',
}

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
