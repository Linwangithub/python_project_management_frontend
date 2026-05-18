export const toolbarSectionsConfig = [
  {
    type: 'preset-selector',
    menus: ['projects', 'users', 'envs', 'servers'],
    order: 0,
  },
  {
    type: 'member-filter',
    menus: ['projects', 'users'],
    order: 1,
  },
  {
    type: 'status-filter',
    menus: ['projects'],
    order: 2,
  },
  {
    type: 'create-button',
    menus: ['projects', 'users', 'envs', 'servers'],
    order: 3,
  },
]
