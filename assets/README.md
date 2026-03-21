# 美术资产目录

**项目**：project-management-dashboard  
**版本**：v1.0  
**更新**：2026-03-21

---

## 目录结构

```
assets/
├── css/
│   ├── variables.css    # CSS 变量（颜色、字体、间距）
│   ├── components.css  # 组件样式
│   └── animations.css  # 动效规范
├── icons/
│   ├── nav-*.svg        # 导航图标（Dashboard/Projects/Agents等）
│   ├── status-*.svg     # 状态图标（waiting/in_progress/done等）
│   ├── action-*.svg     # 操作图标（refresh/search/plus等）
│   ├── bug-*.svg         # Bug优先级图标（high/medium/low）
│   ├── file-*.svg        # 文件类型图标
│   └── *.svg            # 其他图标
├── js/
│   ├── charts-phase-config.js  # Phase 图表配置
│   └── charts-bug-config.js    # Bug 图表配置
└── README.md            # 本文件
```

---

## 使用方式

### 1. CSS 变量

在 HTML 中引入 CSS 变量文件：
```html
<link rel="stylesheet" href="assets/css/variables.css">
```

然后在 CSS 中使用变量：
```css
.element {
  color: var(--color-primary);
  background: var(--color-card);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
```

### 2. 组件样式

引入组件样式：
```html
<link rel="stylesheet" href="assets/css/components.css">
```

使用组件类：
```html
<div class="card card-hover">卡片内容</div>
<button class="btn btn-primary">主按钮</button>
<span class="badge badge-success">成功</span>
```

### 3. 动画

引入动画样式：
```html
<link rel="stylesheet" href="assets/css/animations.css">
```

使用动画类：
```html
<div class="card animate-fade-in-up">入场动画</div>
<div class="skeleton animate-shimmer">加载中</div>
```

### 4. 图标

直接在 HTML 中引用 SVG：
```html
<img src="assets/icons/status-done.svg" alt="完成">
```

或使用内联 SVG：
```html
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
  <polyline points="22 4 12 14.01 9 11.01"/>
</svg>
```

### 5. 图表配置

引入 Chart.js 和配置：
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="assets/js/charts-phase-config.js"></script>
```

使用配置生成器：
```javascript
const config = window.ChartConfigs.getPhaseBarChartConfig([1, 2, 3, 5, 2, 1, 0, 0]);
new Chart(ctx, config);
```

---

## 图标清单

### 导航图标
| 文件 | 用途 |
|:-----|:-----|
| `nav-dashboard.svg` | Dashboard 首页 |
| `nav-projects.svg` | Projects 项目 |
| `nav-agents.svg` | Agents 团队 |
| `nav-tasks.svg` | Tasks 任务 |
| `nav-versions.svg` | Versions 版本 |
| `nav-documents.svg` | Documents 文档 |
| `nav-bugs.svg` | Bugs Bug追踪 |
| `nav-settings.svg` | Settings 设置 |

### 状态图标
| 文件 | 状态 | 颜色 |
|:-----|:-----|:-----|
| `status-waiting.svg` | 等待 | #3B82F6 |
| `status-in-progress.svg` | 进行中 | #F59E0B |
| `status-done.svg` | 完成 | #10B981 |
| `status-blocked.svg` | 阻塞 | #EF4444 |
| `status-cancelled.svg` | 取消 | #64748B |
| `status-paused.svg` | 暂停 | #94A3B8 |

### 操作图标
| 文件 | 用途 |
|:-----|:-----|
| `action-refresh.svg` | 刷新 |
| `action-search.svg` | 搜索 |
| `action-plus.svg` | 添加 |
| `action-close.svg` | 关闭 |
| `action-chevron-down.svg` | 下拉 |
| `action-chevron-right.svg` | 展开 |
| `action-sun.svg` | 浅色模式 |
| `action-moon.svg` | 深色模式 |

### Bug 优先级
| 文件 | 优先级 | 颜色 |
|:-----|:-------|:-----|
| `bug-high.svg` | High | #EF4444 |
| `bug-medium.svg` | Medium | #F59E0B |
| `bug-low.svg` | Low | #3B82F6 |

---

## CSS 变量参考

### 颜色变量
```css
--color-primary: #1E40AF;
--color-primary-light: #3B82F6;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-bg: #F8FAFC;
--color-card: #FFFFFF;
--color-text-primary: #0F172A;
```

### 间距变量
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
```

### 圆角变量
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

---

**版本**：v1.0  
**更新日期**：2026-03-21
