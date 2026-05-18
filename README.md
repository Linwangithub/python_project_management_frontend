# Python Project Management Frontend

Python Project Management Frontend 是个人服务器 Python 项目管理平台的前端工程，基于 Vue 3、Vite、Pinia、Vue Router 和 Element Plus 构建。

该平台面向个人 Python 开发者和 Python 团队，用于分布式管理自己的服务器和 Python 项目，是一个偏自动化运维场景的 Web 管理工具。

## 项目状态

基础功能已经完成，可以直接使用：

- 新建项目
- 服务状态检测
- 项目健康检测
- 前台启动
- 后台启动
- 部署启动
- 停止服务
- 项目设置
- 项目详情
- 操作日志
- 删除项目

工具开发和缺陷修正仍在持续补充中。

## 主要亮点

- 统一管理多台服务器上的 Python 项目。
- 支持项目目录、Conda 环境、数据库和 Nginx 配置的可视化配置。
- 项目创建、设置、删除等操作与右侧终端区域联动，便于观察执行过程。
- 支持前台启动、后台启动、部署启动和安全停止服务。
- 支持项目详情、操作日志、服务状态和项目检测，便于排查项目运行状态。
- 支持三分屏布局，兼顾菜单、项目列表和终端操作。

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router
- Element Plus
- Axios
- Sass

## 本地开发

```bash
npm install
npm run dev
```

默认接口地址在 `src/utils/request.js` 中配置，也可以通过环境变量覆盖：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8888/api npm run dev
```

Windows PowerShell 示例：

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8888/api"
npm run dev
```

## 构建

```bash
npm run build
```

构建产物位于 `dist/`。

## 后端项目

后端仓库：

```text
https://github.com/Linwangithub/python_project_management
```

## 开源协议

Apache License 2.0
