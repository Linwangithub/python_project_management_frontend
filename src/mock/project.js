const mockProjects = [
  {
    id: 101,
    owner: 'alice',
    name: 'demo_api',
    serverIp: '192.168.1.10',
    frontendPort: '15173',
    backendDevPort: '18080',
    backendDeployPort: '18081',
    databaseName: 'demo_db',
    status: '运行中',
    deployCommand: 'conda run -n demo_api gunicorn config.wsgi:application -b 0.0.0.0:18081 --workers 2',
    devCommand: 'conda run -n demo_api python manage.py runserver 0.0.0.0:18080',
    path: '/home/alice/projects/demo_api',
    nginxPath: '/etc/nginx/conf.d/demo_api.conf',
  },
  {
    id: 102,
    owner: 'bob',
    name: 'algo_srv',
    serverIp: '192.168.1.11',
    frontendPort: '19080',
    backendDevPort: '19090',
    backendDeployPort: '19091',
    databaseName: 'algo_db',
    status: '已停止',
    deployCommand: 'conda run -n algo_srv uvicorn main:app --host 0.0.0.0 --port 19091 --workers 2',
    devCommand: 'conda run -n algo_srv python main.py --port 19090',
    path: '/home/bob/projects/algo_srv',
    nginxPath: '/etc/nginx/conf.d/algo_srv.conf',
  },
]

const mockUsers = [
  {
    id: 2,
    username: 'alice',
    password: 'alice123',
    role: 'user',
    operator: 'root',
    createdAt: '2026-05-08 18:00',
  },
  {
    id: 3,
    username: 'bob',
    password: 'bob123',
    role: 'user',
    operator: 'root',
    createdAt: '2026-05-08 18:20',
  },
  {
    id: 1,
    username: 'root',
    password: 'root123',
    role: 'root',
    operator: 'system',
    createdAt: '2026-05-08 17:30',
  },
]

const mockEnvs = [
  {
    envName: 'demo_api',
    projectName: 'demo_api',
    createdAt: '2026-05-09 10:10',
  },
  {
    envName: 'algo_srv',
    projectName: 'algo_srv',
    createdAt: '2026-05-08 20:15',
  },
]

const mockServers = [
  {
    ip: '192.168.1.10',
    sshPort: '22',
    middlewares: 'nginx redis python3.11',
    users: 'alice,bob',
    heartbeat: '11:18:03',
  },
  {
    ip: '192.168.1.11',
    sshPort: '22',
    middlewares: 'nginx python3.10',
    users: 'bob',
    heartbeat: '11:18:07',
  },
]

const clone = (data) => JSON.parse(JSON.stringify(data))

export const getProjectBundleMock = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        projects: clone(mockProjects),
        users: clone(mockUsers),
        envs: clone(mockEnvs),
        servers: clone(mockServers),
      })
    }, 120)
  })
