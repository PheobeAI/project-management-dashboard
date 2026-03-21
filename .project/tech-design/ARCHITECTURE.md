# 技术设计文档 - Phase 3

**项目**：project-management-dashboard  
**版本**：v1.0  
**日期**：2026-03-21  
**状态**：Phase 3 技术设计

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │Dashboard│  │Projects │  │Agents  │  │ Tasks   │  │Settings │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
│                            │                                        │
│                      ┌─────┴─────┐                                │
│                      │  Router   │                                │
│                      └─────┬─────┘                                │
│                            │                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    State Management (AppState)               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                        │
│                      ┌─────┴─────┐                                │
│                      │  API Client │                              │
│                      └─────┬─────┘                                │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼─────────────────────────────────────┐
│                         Express.js (Backend)                      │
│                            │                                      │
│  ┌─────────────────────────┼───────────────────────────────┐     │
│  │                    API Routes                        │     │
│  │  /api/projects  /api/agents  /api/tasks  /api/stats │     │
│  └─────────────────────────┼───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────┼───────────────────────────────┐     │
│  │                  Services Layer                      │     │
│  │  FileScanner  DataParser  ConfigManager  GitHub   │     │
│  └─────────────────────────┼───────────────────────────────┘     │
│                            │                                      │
│  ┌─────────────────────────┼───────────────────────────────┐     │
│  │                  Data Sources                       │     │
│  │  File System (status.json, tasks/, test-results/) │     │
│  └───────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 版本 | 说明 |
|:-----|:-----|:-----|:-----|
| 前端框架 | 原生 HTML5 + ES6+ | - | 轻量，无需重型框架 |
| 模板引擎 | Handlebars | ^4.7 | 服务器端模板 |
| 路由 | 原生 + History API | - | SPA 体验 |
| 样式 | CSS3 + CSS Variables | - | 主题切换 |
| 图表 | Chart.js | ^4.4 | 数据可视化 |
| 后端 | Express.js | ^4.18 | REST API |
| 文件操作 | Node.js fs/promises | - | 原生模块 |
| 路径解析 | path | - | 跨平台兼容 |

### 1.3 目录结构

```
project-management-dashboard/
├── src/
│   ├── server/
│   │   ├── index.js              # Express 服务入口
│   │   ├── routes/
│   │   │   ├── api.js           # REST API 路由
│   │   │   ├── static.js        # 页面路由
│   │   │   └── index.js         # 路由汇总
│   │   └── services/
│   │       ├── FileScanner.js   # 文件扫描服务
│   │       ├── DataParser.js    # 数据解析服务
│   │       ├── ConfigManager.js # 配置管理
│   │       └── GitHubService.js # GitHub 服务
│   ├── views/
│   │   ├── layout.hbs          # 布局模板
│   │   ├── home.hbs            # Dashboard
│   │   ├── projects/
│   │   │   ├── list.hbs       # 项目列表
│   │   │   └── detail.hbs     # 项目详情
│   │   ├── agents.hbs          # Agents 页面
│   │   ├── tasks.hbs           # Tasks 页面
│   │   ├── versions.hbs        # Versions 页面
│   │   ├── documents.hbs       # Documents 页面
│   │   ├── bugs.hbs            # Bugs 页面
│   │   └── settings.hbs       # Settings 页面
│   └── public/
│       ├── css/
│       │   ├── main.css        # 主样式
│       │   ├── theme.css       # 主题
│       │   ├── sidebar.css     # 侧边栏
│       │   └── components.css  # 组件
│       └── js/
│           ├── app.js          # 主逻辑
│           ├── sidebar.js      # 侧边栏
│           ├── router.js        # 客户端路由
│           ├── charts.js       # 图表
│           └── pages/
│               ├── dashboard.js
│               ├── projects.js
│               ├── agents.js
│               ├── tasks.js
│               ├── versions.js
│               ├── documents.js
│               ├── bugs.js
│               └── settings.js
├── tests/
│   └── basic/                 # 单元测试
├── samples/                   # 示例数据
├── assets/                    # 静态资源
│   └── logo/                  # Logo 文件
└── package.json
```

---

## 2. API 设计

### 2.1 API 汇总

| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| GET | `/api/projects` | 项目列表 |
| GET | `/api/projects/:id` | 项目详情 |
| GET | `/api/projects/:id/tasks` | 项目任务 |
| GET | `/api/projects/:id/test-results` | 测试结果 |
| GET | `/api/projects/:id/bugs` | Bug 列表 |
| GET | `/api/projects/:id/versions` | 版本历史 |
| GET | `/api/stats` | 全局统计 |
| GET | `/api/stats/by-phase` | Phase 分布 |
| GET | `/api/stats/bugs` | Bug 统计 |
| GET | `/api/agents` | Agent 列表 |
| GET | `/api/agents/stats` | Agent 工作负载 |
| GET | `/api/tasks` | 所有任务 |
| GET | `/api/tasks/stats` | 任务统计 |
| GET | `/api/bugs` | 所有 Bug |
| GET | `/api/bugs/stats` | Bug 统计 |
| GET | `/api/bugs/trend` | Bug 趋势 |
| GET | `/api/versions` | 版本列表 |
| GET | `/api/documents` | 文档列表 |
| GET | `/api/documents/search` | 文档搜索 |
| GET | `/api/paths` | 路径配置 |
| POST | `/api/paths` | 添加路径 |
| PUT | `/api/paths/:id` | 更新路径 |
| DELETE | `/api/paths/:id` | 删除路径 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |
| POST | `/api/refresh` | 刷新数据 |

### 2.2 API 响应格式

```json
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": "Error message"
}
```

### 2.3 数据分页

支持分页的 API 添加 `page` 和 `pageSize` 参数：

```
GET /api/projects?page=1&pageSize=20
```

---

## 3. 数据层设计

### 3.1 数据目录结构

```
<project>/
├── .project/
│   ├── status.json           # 项目状态
│   ├── tasks/                # 任务目录
│   │   ├── DEV-001.json
│   │   └── ...
│   ├── reviews/             # 评审记录
│   │   └── index.json
│   ├── bugs/                # Bug 记录（Phase 3 新增）
│   │   ├── BUG-001.md
│   │   └── index.json
│   └── versions/             # 版本历史
│       └── index.json
├── test-results/             # 测试结果
│   ├── summary.json          # 测试汇总
│   ├── TEST-*.md            # 测试报告（Phase 3 新增）
│   └── bugs/                 # Bug 修复记录
│       ├── BUG-001.md
│       └── index.json
└── src/                     # 源代码
```

### 3.2 status.json 结构

```json
{
  "project_name": "char-counter",
  "phase": 3,
  "waiting_for": {
    "agent": "Designer",
    "action": "revise_requirements"
  },
  "since": "2026-03-20T08:00:00+08:00",
  "progress": 80,
  "lastUpdated": "2026-03-20T12:00:00+08:00"
}
```

### 3.3 tasks/ 结构

```json
{
  "id": "DEV-001",
  "title": "实现字符计数功能",
  "type": "dev",
  "status": "done",
  "assignee": "Engineer",
  "created_at": "2026-03-18T10:00:00Z",
  "due": "2026-03-19T18:00:00Z"
}
```

### 3.4 Bug 数据结构（Phase 3 新增）

**文件位置**：`.project/test-results/bugs/BUG-XXX.md` 或 `.project/bugs/`

```json
{
  "id": "BUG-001",
  "title": "状态筛选 UI 不生效",
  "severity": "minor",
  "status": "fixed",
  "created_at": "2026-03-19T10:00:00Z",
  "fixed_at": "2026-03-20T13:14:00Z",
  "reporter": "QA",
  "assignee": "Engineer",
  "description": "..."
}
```

### 3.5 测试报告结构（Phase 3 新增）

**文件位置**：`.project/test-results/TEST-*.md`

```markdown
# 测试报告 - v0.1.0

**日期**: 2026-03-20
**测试人**: QA
**结论**: APPROVE

## 测试结果

| 用例 | 状态 |
|:-----|:-----|
| 项目列表加载 | ✅ 通过 |
| 状态筛选 | ✅ 通过 |
| 任务详情 | ✅ 通过 |

## Bug 记录

- BUG-001: 已修复
- BUG-002: 已修复
```

### 3.6 Versions 结构

```json
{
  "versions": [
    {
      "tag": "v0.1.0",
      "date": "2026-03-20",
      "changes": [
        { "type": "feature", "desc": "初始版本发布" },
        { "type": "bugfix", "desc": "修复 BUG-001" }
      ]
    }
  ]
}
```

---

## 4. 页面路由设计

### 4.1 路由表

| URL | 页面 | 说明 |
|:----|:-----|:-----|
| `/` | Dashboard | 首页总览 |
| `/projects` | Projects List | 项目列表 |
| `/projects/:id` | Project Detail | 项目详情 |
| `/agents` | Agents | Agent 工作负载 |
| `/tasks` | Tasks | 任务列表 |
| `/versions` | Versions | 版本历史 |
| `/documents` | Documents | 文档中心 |
| `/bugs` | Bugs | Bug 追踪 |
| `/settings` | Settings | 系统设置 |

### 4.2 客户端路由实现

使用原生 History API 实现无刷新导航：

```javascript
// router.js
class Router {
  routes = [];
  
  add(path, handler) {
    this.routes.push({ path, handler });
  }
  
  navigate(path) {
    history.pushState(null, '', path);
    this.resolve();
  }
  
  resolve() {
    const path = location.pathname;
    const route = this.routes.find(r => r.path === path);
    if (route) {
      route.handler();
    }
  }
}
```

---

## 5. 组件设计

### 5.1 通用组件

| 组件 | 说明 |
|:-----|:-----|
| Sidebar | 侧边栏导航 |
| Header | 页面头部 |
| StatCard | 统计卡片 |
| ProjectCard | 项目卡片 |
| TaskItem | 任务项 |
| BugItem | Bug 项 |
| VersionItem | 版本项 |
| DocumentItem | 文档项 |
| FilterBar | 筛选栏 |
| Pagination | 分页 |
| EmptyState | 空状态 |
| ErrorState | 错误状态 |
| LoadingSkeleton | 加载骨架 |

### 5.2 图表组件

| 组件 | Chart.js 类型 |
|:-----|:-------------|
| PhaseBarChart | Bar |
| TaskStatusPie | Doughnut |
| BugTrendLine | Line |
| AgentWorkloadBar | Bar |

---

## 6. 实现优先级

### Phase 1 - 核心页面（MVP）
1. Dashboard 页面调整
2. Projects 详情页
3. Agents 页面
4. Bugs 页面

### Phase 2 - 扩展页面
5. Tasks 页面
6. Versions 页面

### Phase 3 - 文档和设置
7. Documents 页面
8. Settings 完善

---

## 7. 工时估算

| 工作项 | 工时 |
|:-------|:-----|
| API 扩展 | 4h |
| Dashboard 调整 | 2h |
| Agents 页面 | 2h |
| Tasks 页面 | 2h |
| Versions 页面 | 3h |
| Documents 页面 | 4h |
| Bugs 页面 | 2h |
| 路由和导航 | 2h |
| 测试和修复 | 3h |
| **总计** | **~24h** |

---

## 8. 技术风险

### 8.1 文档预览性能

**风险**：Documents 页面需要读取和渲染 Markdown 文件。

**方案**：使用 markdown-it 库，配合 CDN 加载。

### 8.2 Bug 趋势数据

**风险**：趋势需要历史数据。

**方案**：在 Bug 数据中增加 `created_at` 字段，前端按时间聚合。

### 8.3 跨平台路径

**风险**：Windows 和 Unix 路径分隔符不同。

**方案**：使用 Node.js `path.join()` 自动处理。
