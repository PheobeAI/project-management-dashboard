# 技术设计文档 - F10/F11/F12

**项目**：project-management-dashboard  
**版本**：v2.0  
**评审人**：Engineer  
**日期**：2026-03-20

---

## 1. F10 Agent 任务视图

### 1.1 功能描述

按 Agent 分组显示项目中的任务，展示各 Agent 的 waiting/in_progress/done 状态任务。

### 1.2 数据结构

```javascript
// Agent 分组数据结构
const AgentTaskGroups = {
  agents: [
    {
      name: "Engineer",
      icon: "💻",
      waiting: [Task],    // status === 'waiting'
      inProgress: [Task], // status === 'in_progress'
      done: [Task]        // status === 'done'
    }
  ]
};
```

### 1.3 API 设计

**新增端点**：
```
GET /api/projects/:id/agent-tasks
```
返回按 Agent 分组的任务数据。

### 1.4 前端实现

**组件结构**：
```
AgentTasksSection
├── AgentGroupCard (for each agent)
│   ├── AgentHeader (icon + name + count)
│   ├── TaskList
│   │   └── TaskItem (for each task)
│   └── AgentSummary (total/waiting/in_progress/done)
```

**筛选逻辑**：
- 默认显示所有 Agent
- 可按 Agent 名称筛选
- 可按状态筛选（waiting/in_progress/done）

### 1.5 渲染代码

```javascript
function renderAgentTasks(groups) {
  const container = document.getElementById('agentTasksContainer');
  
  container.innerHTML = groups.map(agent => `
    <div class="agent-group-card">
      <div class="agent-header">
        <span class="agent-icon">${agent.icon}</span>
        <span class="agent-name">${agent.name}</span>
        <span class="agent-count">${agent.waiting.length + agent.inProgress.length + agent.done.length}</span>
      </div>
      <div class="task-section waiting">
        <div class="task-section-title">待处理 (${agent.waiting.length})</div>
        ${agent.waiting.map(renderTaskItem).join('')}
      </div>
      <div class="task-section in-progress">
        <div class="task-section-title">进行中 (${agent.inProgress.length})</div>
        ${agent.inProgress.map(renderTaskItem).join('')}
      </div>
      <div class="task-section done">
        <div class="task-section-title">已完成 (${agent.done.length})</div>
        ${agent.done.map(renderTaskItem).join('')}
      </div>
    </div>
  `).join('');
}
```

---

## 2. F11 项目阶段进展视图

### 2.1 功能描述

展示项目在 Software Workflow 中的 Phase 0-8 阶段时间线，清晰显示当前阶段和进展。

### 2.2 阶段定义

```javascript
const PHASES = [
  { id: 0, name: '初始化', shortName: 'Init', color: '#94A3B8' },
  { id: 1, name: '需求分析', shortName: 'Req', color: '#3B82F6' },
  { id: 2, name: '设计', shortName: 'Design', color: '#8B5CF6' },
  { id: 3, name: '开发', shortName: 'Dev', color: '#10B981' },
  { id: 4, name: '测试', shortName: 'Test', color: '#F59E0B' },
  { id: 5, name: '部署', shortName: 'Deploy', color: '#EC4899' },
  { id: 6, name: '维护', shortName: 'Maint', color: '#06B6D4' },
  { id: 7, name: '完成', shortName: 'Done', color: '#64748B' },
  { id: 8, name: '已发布', shortName: 'Released', color: '#1E40AF' }
];
```

### 2.3 组件结构

```
PhaseTimeline
├── PhaseTimelineBar
│   ├── PhaseStep (for each phase 0-8)
│   │   ├── PhaseDot (filled if completed)
│   │   └── PhaseLabel
│   └── CurrentPhaseMarker
├── PhaseProgressBar (current phase progress)
└── PhaseDetails
    ├── CurrentPhase (name + waiting_for)
    ├── PhaseStartTime
    └── NextPhase (if any)
```

### 2.4 时间线渲染

```javascript
function renderPhaseTimeline(currentPhase, waitingFor, since) {
  const container = document.getElementById('phaseTimeline');
  
  const phasesHtml = PHASES.map(phase => {
    const isCompleted = phase.id < currentPhase;
    const isCurrent = phase.id === currentPhase;
    const isPending = phase.id > currentPhase;
    
    return `
      <div class="phase-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}">
        <div class="phase-dot"></div>
        <div class="phase-label">${phase.shortName}</div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="phase-timeline-bar">
      ${phasesHtml}
    </div>
    <div class="phase-details">
      <div class="current-phase">
        <span class="phase-badge" style="background: ${PHASES[currentPhase].color}">
          ${PHASES[currentPhase].name}
        </span>
        ${waitingFor ? `<span class="waiting-info">等待: ${waitingFor.agent}</span>` : ''}
      </div>
      ${since ? `<div class="phase-since">开始于: ${formatDate(since)}</div>` : ''}
    </div>
  `;
}
```

### 2.5 样式规范

```css
.phase-timeline-bar {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  position: relative;
}

.phase-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.phase-step::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: var(--color-border);
}

.phase-step.completed::before {
  background: var(--color-success);
}

.phase-step.current::before {
  background: linear-gradient(90deg, var(--color-success) 50%, var(--color-border) 50%);
}

.phase-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-border);
  z-index: 1;
}

.phase-step.completed .phase-dot {
  background: var(--color-success);
}

.phase-step.current .phase-dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}
```

---

## 3. F12 测试详情视图

### 3.1 功能描述

展示评审意见汇总、Bug 统计、版本历史测试结果。

### 3.2 数据结构

```javascript
// Reviews 数据
{
  "reviews": [
    {
      "round": "v_1",
      "role": "Designer",
      "conclusion": "APPROVE",
      "date": "2026-03-20",
      "comments": "..."
    }
  ]
}

// Bugs 数据
{
  "bugs": [
    {
      "id": "BUG-001",
      "title": "字符计数不准确",
      "severity": "high",
      "status": "fixed",
      "created_at": "2026-03-18",
      "fixed_at": "2026-03-19"
    }
  ]
}

// Test Results 数据
{
  "versions": {
    "v0.1.0": {
      "date": "2026-03-19",
      "total": 20,
      "passed": 18,
      "failed": 2,
      "skipped": 0,
      "coverage": 85
    }
  }
}
```

### 3.3 组件结构

```
TestDetailSection
├── TestSummaryCard
│   ├── TotalTests
│   ├── PassedTests
│   ├── FailedTests
│   └── Coverage
├── BugStatsCard
│   ├── TotalBugs
│   ├── FixedBugs
│   ├── OpenBugs
│   └── BugProgressBar
├── ReviewsList
│   └── ReviewItem (for each review)
└── VersionSelector
    └── VersionTabs
```

### 3.4 Bug 统计计算

```javascript
function calculateBugStats(bugs) {
  const total = bugs.length;
  const fixed = bugs.filter(b => b.status === 'fixed').length;
  const open = total - fixed;
  const progress = total > 0 ? Math.round((fixed / total) * 100) : 0;
  
  return { total, fixed, open, progress };
}
```

### 3.5 渲染代码

```javascript
function renderBugStats(bugs) {
  const stats = calculateBugStats(bugs);
  
  return `
    <div class="bug-stats-card">
      <div class="stat-row">
        <span class="stat-label">总 Bug</span>
        <span class="stat-value">${stats.total}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">已修复</span>
        <span class="stat-value pass">${stats.fixed}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">未修复</span>
        <span class="stat-value fail">${stats.open}</span>
      </div>
      <div class="bug-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.progress}%"></div>
        </div>
        <span class="progress-label">${stats.progress}% 修复</span>
      </div>
    </div>
  `;
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  
  container.innerHTML = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <span class="review-round">${review.round}</span>
        <span class="review-role">${review.role}</span>
        <span class="review-conclusion ${review.conclusion.toLowerCase()}">${review.conclusion}</span>
      </div>
      <div class="review-date">${formatDate(review.date)}</div>
      ${review.comments ? `<div class="review-comments">${review.comments}</div>` : ''}
    </div>
  `).join('');
}
```

---

## 4. 新增 API 端点

### 4.1 Agent 任务视图

```
GET /api/projects/:id/agent-tasks
Response: {
  success: true,
  data: {
    agents: [
      {
        name: "Engineer",
        icon: "💻",
        waiting: [...],
        inProgress: [...],
        done: [...]
      }
    ]
  }
}
```

### 4.2 Reviews 数据

```
GET /api/projects/:id/reviews
Response: {
  success: true,
  data: {
    reviews: [...]
  }
}
```

### 4.3 Bugs 数据

```
GET /api/projects/:id/bugs
Response: {
  success: true,
  data: {
    bugs: [...],
    stats: { total, fixed, open, progress }
  }
}
```

---

## 5. 新增数据解析服务

### 5.1 DataParser 扩展

```javascript
// 新增方法

/**
 * 解析评审意见
 */
async parseReviews(projectDir) {
  const reviewsPath = path.join(projectDir, 'reviews', 'index.json');
  try {
    const content = await fs.readFile(reviewsPath, 'utf-8');
    const data = JSON.parse(content);
    return data.reviews || [];
  } catch {
    return [];
  }
}

/**
 * 解析 Bug 列表
 */
async parseBugs(projectDir) {
  const bugsPath = path.join(projectDir, 'bugs', 'index.json');
  try {
    const content = await fs.readFile(bugsPath, 'utf-8');
    const data = JSON.parse(content);
    return data.bugs || [];
  } catch {
    return [];
  }
}
```

---

## 6. 文件结构更新

```
src/
├── views/
│   ├── detail.hbs (更新：添加 F10/F11/F12 区域)
│   └── partials/
│       ├── agent-tasks.hbs
│       ├── phase-timeline.hbs
│       └── test-details.hbs
└── public/
    └── js/
        └── detail.js (更新：添加 F10/F11/F12 渲染逻辑)
```

---

## 7. 验收标准

### F10 Agent 任务视图
- [ ] 按 Agent 分组显示任务
- [ ] 每个 Agent 显示 waiting/in_progress/done 数量
- [ ] 支持按 Agent 筛选
- [ ] 支持按状态筛选

### F11 项目阶段进展视图
- [ ] 显示 Phase 0-8 时间线
- [ ] 当前阶段高亮显示
- [ ] 显示 waiting_for 信息
- [ ] 阶段间有过渡动画

### F12 测试详情视图
- [ ] 显示 Bug 统计（总数/已修复/未修复）
- [ ] Bug 修复进度条
- [ ] 显示评审意见列表
- [ ] 友好提示无数据情况
