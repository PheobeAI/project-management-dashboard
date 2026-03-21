# 技术设计文档

**项目**：project-management-dashboard  
**版本**：v1.0  
**评审人**：Engineer  
**日期**：2026-03-20

---

## 1. 技术架构

### 1.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Frontend)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Views     │  │   Store    │  │   Services          │  │
│  │  - Home     │  │  - Paths    │  │  - FileScanner      │  │
│  │  - Detail   │  │  - Projects │  │  - DataParser       │  │
│  │  - Settings │  │  - Theme    │  │  - ConfigManager    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                            │                                  │
│                       ┌─────┴─────┐                           │
│                       │  Utils    │                           │
│                       │ - Router  │                           │
│                       │ - Theme   │                           │
│                       │ - Charts  │                           │
│                       └───────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                     Node.js (Backend)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │  Services   │  │   Config            │  │
│  │  - /api     │  │  - FileSvc  │  │  - paths.json       │  │
│  │  - /static  │  │  - GitSvc   │  │  - settings.json    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     File System (Data Source)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Project A   │  │ Project B   │  │ Project C           │  │
│  │ .project/   │  │ .project/   │  │ .project/           │  │
│  │  status.json│  │  status.json│  │  status.json        │  │
│  │  tasks/     │  │  tasks/     │  │  tasks/             │  │
│  │  test-results/│ │  test-results/│ │  test-results/    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|:-----|:---------|:-----|:-----|
| 前端框架 | 原生 HTML5 + ES6+ | - | 轻量，无需重型框架 |
| 样式 | CSS3 + CSS Variables | - | 主题切换必需 |
| 模板 | Handlebars | ^4.7 | 轻量模板引擎 |
| 图表 | Chart.js | ^4.4 | 轻量、支持主题 |
| 后端 | Express.js | ^4.18 | 轻量 HTTP 服务器 |
| 文件操作 | Node.js fs/promises | - | 原生模块 |
| 配置存储 | JSON 文件 | - | 存放在 %APPDATA% |
| GitHub 集成 | gh CLI / @octokit | P2 | 后续迭代 |

### 1.3 模块划分

| 模块 | 职责 | 关键文件 |
|:-----|:-----|:---------|
| `src/server/` | HTTP 服务、API 路由 | `index.js`, `routes/` |
| `src/services/` | 业务逻辑服务 | `FileScanner.js`, `DataParser.js` |
| `src/views/` | 页面模板 | `home.hbs`, `detail.hbs`, `settings.hbs` |
| `src/public/` | 静态资源 | `css/`, `js/`, `images/` |
| `src/utils/` | 工具函数 | `theme.js`, `router.js`, `charts.js` |
| `config/` | 配置文件 | `default.json` |

---

## 2. 数据设计

### 2.1 配置数据结构

**路径配置** (`%APPDATA%/project-management-dashboard/paths.json`)

```json
{
  "paths": [
    {
      "id": "path-001",
      "path": "C:\\Users\\Pheobe\\Projects",
      "alias": "主项目目录",
      "color": "#3B82F6",
      "enabled": true,
      "order": 0
    }
  ],
  "version": "1.0"
}
```

**应用设置** (`%APPDATA%/project-management-dashboard/settings.json`)

```json
{
  "theme": "light",
  "autoRefresh": true,
  "refreshInterval": 60000,
  "lastUpdated": "2026-03-20T10:00:00Z"
}
```

### 2.2 API 设计

| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| GET | `/api/projects` | 获取所有项目列表 |
| GET | `/api/projects/:id` | 获取项目详情 |
| GET | `/api/paths` | 获取路径配置 |
| POST | `/api/paths` | 添加新路径 |
| PUT | `/api/paths/:id` | 更新路径 |
| DELETE | `/api/paths/:id` | 删除路径 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |
| POST | `/api/refresh` | 手动刷新数据 |

### 2.3 项目数据模型

```typescript
interface Project {
  id: string;                    // 项目 ID（目录名）
  name: string;                  // 项目名称
  path: string;                 // 完整路径
  pathId: string;               // 所属路径 ID
  phase: number;                // 当前阶段 (0-8)
  status: 'normal' | 'warning' | 'blocked' | 'uninitialized';
  progress: number;             // 完成度 (0-100)
  waitingFor: {                 // 等待处理
    agent: string;
    action: string;
    since?: string;
  } | null;
  tasks: Task[];                // 任务列表
  testResults: TestResults | null; // 测试结果
  lastUpdated: string;           // 最后更新时间
}

interface Task {
  id: string;
  title: string;
  type: 'dev' | 'art' | 'test' | 'other';
  status: 'waiting' | 'in_progress' | 'done' | 'cancelled' | 'paused';
  assignee?: string;
  due?: string;
}

interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
}
```

---

## 3. 功能设计

### 3.1 核心流程

```
用户访问 → Server 启动 → 加载配置 → 扫描路径 → 解析数据 → 渲染页面
                                  ↓
                            定期刷新/用户手动刷新
```

### 3.2 F1 项目列表与概览

**实现方案**：
1. Server 启动时扫描所有 enabled 路径
2. 对每个路径的子目录，尝试读取 `.project/status.json`
3. 解析任务完成度，计算 progress
4. 根据 progress + waiting_for.since 判断状态指示器

**关键代码**：

```javascript
// services/FileScanner.js
async function scanProjects(paths) {
  const projects = [];
  for (const config of paths) {
    if (!config.enabled) continue;
    
    const entries = await fs.readdir(config.path, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      
      const projectPath = path.join(config.path, entry.name);
      const status = await loadProjectStatus(projectPath);
      projects.push(normalizeProject(status, config));
    }
  }
  return projects;
}
```

### 3.3 F2 项目详情视图

**实现方案**：
- 路由：`/project/:id`
- 读取 `<project>/.project/status.json`
- 读取 `<project>/.project/tasks/*.json`
- 读取 `<project>/test-results/` 或 `<project>/test/`

### 3.4 F3 任务状态追踪

**实现方案**：
- 扫描 `<project>/.project/tasks/` 目录下所有 `.json` 文件
- 按 status 分类统计
- 支持客户端筛选（filter）

### 3.5 F4 测试结果展示

**实现方案**：
- 尝试读取 `test-results/summary.json` 或 `test-results/index.json`
- 兼容单文件 JSON 和多文件结构
- 失败时显示友好提示

### 3.6 F5 Agent 工作状态

**实现方案**：
- 从 `status.json` 读取 `waiting_for` 字段
- 根据 `since` 时间计算等待时长
- 超过 48 小时标记为阻塞

### 3.7 F6 数据可视化

**图表配置**（Chart.js）：

| 图表 | 类型 | 数据源 |
|:-----|:-----|:-------|
| 项目进展 | Bar/Pie | projects[].progress |
| 任务分布 | Doughnut | task status 统计 |
| 阶段分布 | Pie | projects[].phase |
| 路径分布 | Bar | projects 按 pathId 分组 |

### 3.8 F7 自动刷新

**实现方案**：
- 前端 `setInterval` 定时请求 `/api/refresh`
- 后端使用 FSWatcher 监听文件变化（更高效）
- 刷新时显示 loading 状态

```javascript
// 前端
const refreshInterval = setInterval(() => {
  loadProjects();
}, settings.refreshInterval);
```

### 3.9 F8 深色/浅色模式

**实现方案**：

```css
/* theme.css */
:root {
  --bg-primary: #F8FAFC;
  --bg-card: #FFFFFF;
  --text-primary: #0F172A;
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-card: #1E293B;
  --text-primary: #F8FAFC;
}
```

```javascript
// utils/theme.js
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
}
```

### 3.10 F9 多路径管理

**实现方案**：
- CRUD API 操作 `paths.json`
- 添加路径时验证目录存在性
- 路径配置变更后重新扫描

---

## 4. 文件结构

```
project-management-dashboard/
├── src/
│   ├── server/
│   │   ├── index.js           # 入口文件
│   │   ├── routes/
│   │   │   ├── api.js         # API 路由
│   │   │   └── static.js      # 静态文件路由
│   │   └── services/
│   │       ├── FileScanner.js # 文件扫描服务
│   │       ├── DataParser.js  # 数据解析服务
│   │       └── ConfigManager.js# 配置管理
│   ├── views/
│   │   ├── layout.hbs         # 布局模板
│   │   ├── home.hbs           # 首页
│   │   ├── detail.hbs         # 详情页
│   │   └── settings.hbs       # 设置页
│   ├── public/
│   │   ├── css/
│   │   │   ├── main.css       # 主样式
│   │   │   ├── theme.css      # 主题样式
│   │   │   └── components.css # 组件样式
│   │   ├── js/
│   │   │   ├── app.js         # 主逻辑
│   │   │   ├── router.js      # 路由
│   │   │   ├── charts.js      # 图表
│   │   │   └── theme.js       # 主题管理
│   │   └── images/
│   └── utils/
│       ├── logger.js
│       └── helpers.js
├── config/
│   └── default.json           # 默认配置
├── samples/                   # 示例数据
│   └── sample-project/
│       └── .project/
│           ├── status.json
│           └── tasks/
├── tests/
│   └── basic/                 # 基础测试
├── .project/
│   └── status.json
├── package.json
├── server.js                  # 生产入口
└── README.md
```

---

## 5. 性能优化

| 优化点 | 方案 |
|:-------|:-----|
| 首屏加载 | 静态 HTML + 内联关键 CSS |
| 数据扫描 | 首次扫描后缓存，变更时增量更新 |
| 刷新机制 | 文件系统监听 (chokidar) 而非轮询 |
| 图表渲染 | 按需渲染，懒加载 |
| 主题切换 | CSS Variables + transform，避免重排 |

---

## 6. GitHub 集成 (P2)

> ⚠️ 此功能为后续迭代，MVP 暂不包含

**实现思路**：
- 使用 gh CLI 或 @octokit/rest
- 监听文件变化事件，自动 commit + push
- 用户需配置 GitHub Personal Access Token

---

## 7. 验收要点

| 功能 | 验收标准 |
|:-----|:---------|
| 项目列表 | 正确显示所有路径下的项目 |
| 进度计算 | progress = done / total * 100% |
| 状态指示 | 阻塞判断：waiting_for.since > 48h |
| 主题切换 | 切换无闪烁，localStorage 持久化 |
| 路径管理 | 添加/编辑/删除后列表即时更新 |
| 图表展示 | Chart.js 图表正确渲染 |
