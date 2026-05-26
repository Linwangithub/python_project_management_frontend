import { projectActionsConfig } from '@/config/action/project.actions.config'
import { userActionsConfig } from '@/config/action/user.actions.config'
import { envActionsConfig } from '@/config/action/env.actions.config'
import { serverActionsConfig } from '@/config/action/server.actions.config'
import { projectColumnsConfig } from '@/config/table/project.columns.config'
import { userColumnsConfig } from '@/config/table/user.columns.config'
import { envColumnsConfig } from '@/config/table/env.columns.config'
import { serverColumnsConfig } from '@/config/table/server.columns.config'

/**
 * 左侧菜单与各菜单表格、操作按钮配置。
 *
 * 作用：
 * - 统一维护菜单名称、列名和动作按钮名称。
 * - Dashboard 根据该配置生成菜单视图。
 */
export const menuConfig = [
  {
    key: 'projects',
    label: '项目管理',
    columns: projectColumnsConfig.map((x) => x.label),
    actions: projectActionsConfig.map((x) => ({ code: x.code, label: x.label })),
  },
  {
    key: 'users',
    label: '用户管理',
    columns: userColumnsConfig.map((x) => x.label),
    actions: userActionsConfig.map((x) => ({ code: x.code, label: x.label })),
  },
  {
    key: 'envs',
    label: '环境管理',
    columns: envColumnsConfig.map((x) => x.label),
    actions: envActionsConfig.map((x) => ({ code: x.code, label: x.label })),
  },
  {
    key: 'servers',
    label: '服务器管理',
    columns: serverColumnsConfig.map((x) => x.label),
    actions: serverActionsConfig.map((x) => ({ code: x.code, label: x.label })),
  },
]
