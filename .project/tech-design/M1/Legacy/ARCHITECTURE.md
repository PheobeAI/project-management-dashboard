# Project Dashboard - 技术架构文档

> 版本：v1.0 | 更新：2026-04-01 | 状态：稳定

---

## 1. 整体架构

### 1.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | 原生 JavaScript (ES6+) + Handlebars 模板 |
| CSS | CSS Variables + Flexbox/Grid |
| 图表 | Chart.js 4.x (本地化) |
| 后端 | Node.js + Express |
| 数据 | 内存 + JSON 文件持久化 |
| 构建 | 无（直接运行） |

### 1.2 目录结构

```
project-management-dashboard/
├── assets/                    # 静态资源（不经构建）
│   ├── css/
│   │   ├── variables.css      # CSS 变量定义（颜色、间距、字体）
│   │   └── animations.css    # 动画样式
│   ├── js/
│   │   ├── chart.min.js      # Chart.js 本地副本
│   │   ├── charts-phase-config.js
│   │   └── charts-bug-config.js
│   ├── logo/
│   └── icons/
├── src/
│   ├── public/               # 服务器静态文件 (/static/*)
│   │   ├── js/
│   │   │   ├── constants.js   # ⭐ 共享常量（单一数据源）
│   │   │   ├── app.js        # Dashboard 主逻辑
│   │   │   ├── detail.js     # 项目详情页逻辑
│   │   │   ├── settings.js   # 设置页逻辑
│   │   │   └── sidebar.js    # 侧边栏逻辑
│   │   └── css/
│   │       ├── main.css      # 主样式 + 亮色主题变量
│   │       ├── theme.css     # 暗色主题覆盖
│   │       ├── components.css
│   │       └── sidebar.css
│   ├── server/
│   │   ├── index.js          # Express 入口
│   │   └── routes/
│   │       ├── api.js         # REST API 路由
│   │       └── static.js     # 页面渲染路由
│   └── views/                 # Handlebars 模板
│       ├── layout.hbs         # 主布局模板
│       ├── home.hbs          # Dashboard 页面
│       ├── detail.hbs        # 项目详情
│       └── ...
└── data/                      # JSON 数据文件
```

---

## 2. 前端架构

### 2.1 JavaScript 文件加载顺序

```
layout.hbs <head>:
  1. window.API_BASE = '/api'        (inline, 最早执行)
  2. theme flash prevention           (inline, 在 DOM 渲染前应用主题)

layout.hbs <body>:
  3. chart.min.js                    (Chart.js 本地副本)
  4. constants.js                    (⭐ 所有共享常量)
  5. app.js / detail.js / settings.js (页面逻辑)
  6. sidebar.js
  7. charts-phase-config.js          (依赖 constants.js)
  8. charts-bug-config.js
```

### 2.2 constants.js — 单一数据源

所有 phase/status 映射统一在 `constants.js` 中定义：

```javascript
window.PHASES              // Phase 数组 [{id, name, shortName, color}, ...]
window.PHASE_NAME_TO_ID    // 字符串→ID 映射 {iterating:3, approved:7, ...}
window.PHASE_DISPLAY_NAMES // ID→中文名映射 {0:'初始化', 3:'开发', ...}
window.PHASE_COLORS        // ID→颜色映射 {0:'#94A3B8', 3:'#10B981', ...}
window.STATUS_TEXT         // Status→中文映射 {normal:'正常', warning:'进行中', ...}

window.getPhaseDisplayName(phase)  // 兼容数字 ID 或字符串
window.getPhaseShortName(phase)    // 返回短名称
window.getPhaseColor(phase)        // 返回颜色值
window.getStatusDisplayText(status) // 返回中文状态
window.showError(message, duration) // 共享错误提示
```

**使用规则**：
- Phase/Status 显示逻辑**只调用** `constants.js` 导出的函数
- 禁止在其他 JS 文件中定义重复的映射表
- `PHASE_NAME_TO_ID` 支持多种 API 字段名（如 `dev`/`development`/`iterating` 都映射到 phase 3）

### 2.3 主题切换机制

```
用户点击切换按钮
    → toggleTheme()
    → localStorage.setItem('theme', newTheme)
    → document.documentElement.setAttribute('data-theme', newTheme)
```

**Flash 防护**：在 `<head>` 中内联脚本，页面渲染前即读取 localStorage 应用主题：
```javascript
(function(){
  var t = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
```

**主题 CSS 加载顺序**：
1. `variables.css` — CSS 变量定义
2. `main.css` — 亮色主题所有 CSS 变量
3. `theme.css` — `[data-theme="dark"]` 暗色覆盖（优先级最高）

---

## 3. 后端架构

### 3.1 Express 路由

| 路径 | 处理 |
|------|------|
| `GET /` | 渲染 Dashboard 首页 |
| `GET /project/:id` | 渲染项目详情页 |
| `GET /settings` | 渲染设置页 |
| `GET /api/projects` | 项目列表 API |
| `GET /api/project/:id` | 项目详情 API |
| `POST /api/refresh` | 刷新数据 |
| `GET /api/settings` | 读取设置 |
| `PUT /api/settings` | 更新设置 |
| `GET /static/*` | 静态文件 → `src/public/` |
| `GET /assets/*` | 静态资源 → `assets/` |

### 3.2 API 响应格式

```json
{
  "success": true,
  "data": { ... }
}
```

### 3.3 数据模型

**Project**：
```javascript
{
  id: string,
  name: string,
  phase: number | string,  // 0-8 或 'iterating'/'approved' 等
  status: 'normal' | 'warning' | 'blocked' | 'uninitialized',
  progress: number,         // 0-100
  pathId: string,
  pathAlias: string,
  pathColor: string,
  tasks: Task[],
  waitingFor: { agent, action } | null
}
```

**Phase ID 映射**（由 `getPhaseDisplayName` 处理）：

| ID | 名称 | 短名 |
|----|------|------|
| 0 | 初始化 | Init |
| 1 | 需求分析 | Req |
| 2 | 设计 | Design |
| 3 | 开发 | Dev |
| 4 | 测试 | Test |
| 5 | 部署 | Deploy |
| 6 | 维护 | Maint |
| 7 | 完成 | Done |
| 8 | 已发布 | Released |

---

## 4. 已知问题与限制

| 问题 | 说明 | 状态 |
|------|------|------|
| CDP/Headless 环境 | script src 标签不会自动执行 | 已知限制，非 bug |
| `initEventListeners` 重名 | 三个 JS 文件各定义了同名函数 | 页面隔离，无冲突 |

---

## 5. 最近修复记录（2026-03-31）

| 日期 | 修复内容 |
|------|---------|
| 03-31 | 新建 `constants.js`，消除 phase/status 映射三处重复定义 |
| 03-31 | `app.js` 移除冗余 `PHASE_NAMES`、`STATUS_NAMES`、`API_BASE` 声明 |
| 03-31 | `charts-phase-config.js` 重命名 `PHASE_NAMES` → 使用 `window.PHASE_DISPLAY_NAMES` |
| 03-31 | `detail.js` / `settings.js` 移除重复 `API_BASE` 和 `showError` |
| 03-31 | 修复主题闪烁——`<head>` 内联主题应用脚本 |
| 03-31 | Chart.js CDN → 本地文件（消除单点依赖） |
| 03-31 | `layout.hbs` CSS 加载顺序修复（variables.css 在 sidebar.css 之前） |
| 03-31 | 删除 `main.css` 中与 `theme.css` 重复的 `[data-theme="dark"]` sidebar 块 |
| 03-31 | `app.js` async 函数添加 try/catch（`loadSettings`/`loadProjects`/`refreshData`） |
| 04-01 | 重写 `settings.js` 修复多处字节级编码损坏导致的语法错误 |
| 04-01 | 清理 `detail.js` 14处中文注释/字符串编码损坏 |
| 04-01 | `detail.js` 移除重复 `showError` 函数定义，统一使用 `constants.js` 版本 |
| 04-01 | `detail.js` 修复 `PHASES[currentPhase]` → `getPhaseColor()` 等 helper 函数 |

---

## 6. 开发指南

### 6.1 添加新的 Phase

在 `constants.js` 中修改 `PHASES` 数组，添加新条目会自动传播到所有页面和图表。

### 6.2 添加新的 Status

在 `constants.js` 中修改 `STATUS_TEXT` 对象。

### 6.3 添加新页面

1. 在 `src/views/` 创建 `.hbs` 模板
2. 在 `src/server/routes/static.js` 添加路由
3. 在 `layout.hbs` 或路由中引入页面专用 JS（如需）
4. 如页面需要 phase/status 显示，确保加载 `constants.js`

### 6.4 本地测试

```bash
cd C:\Users\Pheobe\Projects\project-management-dashboard
node src/server/index.js
# 访问 http://localhost:3000
```
