# Dashboard 整体布局设计 v3.0

**项目**：project-management-dashboard  
**版本**：v3.0  
**更新日期**：2026-03-20  
**基于**：Boss 评审反馈 v2

---

## 布局概述

采用**左侧侧边栏 + 右侧主内容区**的经典 Dashboard 布局。

---

## SVG 布局图

### 展开状态（Expanded Sidebar）

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" style="background: #F8FAFC; font-family: Inter, sans-serif;">
  <!-- 左侧侧边栏 -->
  <g id="sidebar-expanded">
    <!-- 侧边栏背景 -->
    <rect x="0" y="0" width="240" height="700" fill="#1E293B"/>
    
    <!-- Logo 区域 -->
    <rect x="0" y="0" width="240" height="64" fill="#0F172A"/>
    <text x="20" y="40" fill="#FFFFFF" font-size="18" font-weight="700">Dashboard</text>
    
    <!-- 侧边栏菜单项 -->
    <!-- Dashboard -->
    <g transform="translate(0, 64)">
      <rect x="0" y="0" width="240" height="48" fill="#3B82F6"/>
      <text x="20" y="30" fill="#FFFFFF" font-size="14">📊 Dashboard</text>
    </g>
    
    <!-- Projects -->
    <g transform="translate(0, 112)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">📁 Projects</text>
    </g>
    
    <!-- Agents -->
    <g transform="translate(0, 160)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">👥 Agents</text>
    </g>
    
    <!-- Tasks -->
    <g transform="translate(0, 208)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">✅ Tasks</text>
    </g>
    
    <!-- Versions -->
    <g transform="translate(0, 256)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">🏷️ Versions</text>
    </g>
    
    <!-- Documents -->
    <g transform="translate(0, 304)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">📄 Documents</text>
    </g>
    
    <!-- Divider -->
    <line x1="20" y1="370" x2="220" y2="370" stroke="#334155" stroke-width="1"/>
    
    <!-- Settings -->
    <g transform="translate(0, 378)">
      <rect x="0" y="0" width="240" height="48" fill="transparent"/>
      <text x="20" y="30" fill="#94A3B8" font-size="14">⚙️ Settings</text>
    </g>
    
    <!-- 收缩按钮 -->
    <g transform="translate(0, 652)">
      <rect x="0" y="0" width="240" height="48" fill="#0F172A"/>
      <text x="20" y="30" fill="#64748B" font-size="14">◀ 收缩侧边栏</text>
    </g>
  </g>
  
  <!-- 右侧主内容区 -->
  <g id="main-content" transform="translate(240, 0)">
    <!-- Header -->
    <rect x="0" y="0" width="960" height="64" fill="#FFFFFF"/>
    <line x1="0" y1="64" x2="960" y2="64" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Header 内容 -->
    <text x="24" y="40" fill="#0F172A" font-size="20" font-weight="600">Dashboard</text>
    <g transform="translate(800, 20)">
      <rect x="0" y="0" width="32" height="32" rx="16" fill="#E2E8F0"/>
      <text x="16" y="22" fill="#64748B" font-size="14" text-anchor="middle">👤</text>
    </g>
    
    <!-- 主内容区域 -->
    <g transform="translate(24, 88)">
      <!-- Stats Cards -->
      <g transform="translate(0, 0)">
        <rect width="200" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="16" y="30" fill="#64748B" font-size="12">项目总数</text>
        <text x="16" y="65" fill="#0F172A" font-size="28" font-weight="700">12</text>
      </g>
      
      <g transform="translate(216, 0)">
        <rect width="200" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="16" y="30" fill="#64748B" font-size="12">进行中</text>
        <text x="16" y="65" fill="#3B82F6" font-size="28" font-weight="700">5</text>
      </g>
      
      <g transform="translate(432, 0)">
        <rect width="200" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="16" y="30" fill="#64748B" font-size="12">已完成</text>
        <text x="16" y="65" fill="#10B981" font-size="28" font-weight="700">4</text>
      </g>
      
      <g transform="translate(648, 0)">
        <rect width="200" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="16" y="30" fill="#64748B" font-size="12">阻塞</text>
        <text x="16" y="65" fill="#EF4444" font-size="28" font-weight="700">3</text>
      </g>
      
      <!-- Project Cards -->
      <g transform="translate(0, 124)">
        <rect width="440" height="180" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="20" y="30" fill="#0F172A" font-size="16" font-weight="600">char-counter</text>
        <text x="20" y="50" fill="#64748B" font-size="12">Phase 3 - 开发中</text>
        <rect x="20" y="65" width="400" height="8" rx="4" fill="#E2E8F0"/>
        <rect x="20" y="65" width="280" height="8" rx="4" fill="#3B82F6"/>
        <text x="20" y="95" fill="#0F172A" font-size="14">80% 正常</text>
      </g>
      
      <g transform="translate(456, 124)">
        <rect width="440" height="180" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="20" y="30" fill="#0F172A" font-size="16" font-weight="600">web-server</text>
        <text x="20" y="50" fill="#64748B" font-size="12">Phase 5 - 部署</text>
        <rect x="20" y="65" width="400" height="8" rx="4" fill="#E2E8F0"/>
        <rect x="20" y="65" width="360" height="8" rx="4" fill="#10B981"/>
        <text x="20" y="95" fill="#0F172A" font-size="14">100% 完成</text>
      </g>
      
      <!-- Phase Timeline Section -->
      <g transform="translate(0, 320)">
        <rect width="880" height="160" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="20" y="30" fill="#0F172A" font-size="16" font-weight="600">项目阶段进展</text>
        
        <!-- Timeline -->
        <g transform="translate(20, 60)">
          <!-- Phase dots and lines -->
          <line x1="30" y1="20" x2="90" y2="20" stroke="#10B981" stroke-width="2"/>
          <circle cx="20" cy="20" r="10" fill="#10B981"/>
          <text x="20" y="50" fill="#64748B" font-size="10" text-anchor="middle">P0</text>
          
          <line x1="110" y1="20" x2="170" y2="20" stroke="#10B981" stroke-width="2"/>
          <circle cx="100" cy="20" r="10" fill="#10B981"/>
          <text x="100" y="50" fill="#64748B" font-size="10" text-anchor="middle">P1</text>
          
          <line x1="190" y1="20" x2="250" y2="20" stroke="#10B981" stroke-width="2"/>
          <circle cx="180" cy="20" r="10" fill="#10B981"/>
          <text x="180" y="50" fill="#64748B" font-size="10" text-anchor="middle">P2</text>
          
          <line x1="270" y1="20" x2="330" y2="20" stroke="#3B82F6" stroke-width="2"/>
          <circle cx="260" cy="20" r="14" fill="#3B82F6"/>
          <circle cx="260" cy="20" r="20" fill="none" stroke="#3B82F6" stroke-width="2" opacity="0.3"/>
          <text x="260" y="50" fill="#3B82F6" font-size="10" font-weight="600" text-anchor="middle">P3</text>
          
          <line x1="350" y1="20" x2="410" y2="20" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4"/>
          <circle cx="340" cy="20" r="8" fill="#E2E8F0"/>
          <text x="340" y="50" fill="#94A3B8" font-size="10" text-anchor="middle">P4</text>
          
          <line x1="430" y1="20" x2="490" y2="20" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4"/>
          <circle cx="420" cy="20" r="8" fill="#E2E8F0"/>
          <text x="420" y="50" fill="#94A3B8" font-size="10" text-anchor="middle">P5</text>
          
          <line x1="510" y1="20" x2="570" y2="20" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4"/>
          <circle cx="500" cy="20" r="8" fill="#E2E8F0"/>
          <text x="500" y="50" fill="#94A3B8" font-size="10" text-anchor="middle">P6</text>
          
          <line x1="590" y1="20" x2="650" y2="20" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4"/>
          <circle cx="580" cy="20" r="8" fill="#E2E8F0"/>
          <text x="580" y="50" fill="#94A3B8" font-size="10" text-anchor="middle">P7</text>
          
          <line x1="670" y1="20" x2="730" y2="20" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="4"/>
          <circle cx="660" cy="20" r="8" fill="#E2E8F0"/>
          <text x="660" y="50" fill="#94A3B8" font-size="10" text-anchor="middle">P8</text>
        </g>
        
        <!-- Phase Details -->
        <g transform="translate(20, 100)">
          <rect width="200" height="40" rx="8" fill="#DBEAFE"/>
          <text x="16" y="26" fill="#2563EB" font-size="12">Phase 3 - 开发中</text>
          <text x="220" y="26" fill="#64748B" font-size="12">等待: Designer</text>
        </g>
      </g>
    </g>
  </g>
</svg>
```

### 收缩状态（Collapsed Sidebar）

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" style="background: #F8FAFC; font-family: Inter, sans-serif;">
  <!-- 收缩后的左侧侧边栏 -->
  <g id="sidebar-collapsed">
    <!-- 侧边栏背景 -->
    <rect x="0" y="0" width="64" height="700" fill="#1E293B"/>
    
    <!-- Logo 区域 -->
    <rect x="0" y="0" width="64" height="64" fill="#0F172A"/>
    <text x="32" y="40" fill="#FFFFFF" font-size="20" font-weight="700" text-anchor="middle">D</text>
    
    <!-- 侧边栏菜单项（仅图标） -->
    <g transform="translate(16, 80)">
      <rect width="32" height="32" rx="8" fill="#3B82F6"/>
      <text y="22" fill="#FFFFFF" font-size="14" text-anchor="middle">📊</text>
    </g>
    
    <g transform="translate(16, 120)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">📁</text>
    </g>
    
    <g transform="translate(16, 160)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">👥</text>
    </g>
    
    <g transform="translate(16, 200)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">✅</text>
    </g>
    
    <g transform="translate(16, 240)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">🏷️</text>
    </g>
    
    <g transform="translate(16, 280)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">📄</text>
    </g>
    
    <g transform="translate(16, 600)">
      <rect width="32" height="32" rx="8" fill="transparent"/>
      <text y="22" fill="#94A3B8" font-size="14" text-anchor="middle">⚙️</text>
    </g>
    
    <!-- 展开按钮 -->
    <g transform="translate(16, 650)">
      <text y="22" fill="#64748B" font-size="14" text-anchor="middle">▶</text>
    </g>
  </g>
  
  <!-- 右侧主内容区（与展开状态相同，但向左扩展） -->
  <g id="main-content" transform="translate(64, 0)">
    <!-- Header -->
    <rect x="0" y="0" width="1136" height="64" fill="#FFFFFF"/>
    <line x1="0" y1="64" x2="1136" y2="64" stroke="#E2E8F0" stroke-width="1"/>
    
    <!-- Header 内容 -->
    <text x="24" y="40" fill="#0F172A" font-size="20" font-weight="600">Dashboard</text>
    <g transform="translate(976, 20)">
      <rect x="0" y="0" width="32" height="32" rx="16" fill="#E2E8F0"/>
      <text x="16" y="22" fill="#64748B" font-size="14" text-anchor="middle">👤</text>
    </g>
    
    <!-- 主内容区域（示意） -->
    <rect x="24" y="88" width="1088" height="588" rx="12" fill="#F1F5F9"/>
    <text x="568" y="382" fill="#94A3B8" font-size="16" text-anchor="middle">主内容区域（自动扩展）</text>
  </g>
</svg>
```

---

## 侧边栏功能说明

### 侧边栏栏目

| 栏目 | 图标 | 功能说明 |
|:-----|:-----|:---------|
| Dashboard | 📊 | 返回首页，概览所有项目 |
| Projects | 📁 | 项目列表视图 |
| Agents | 👥 | Agent 任务视图（F10） |
| Tasks | ✅ | 任务列表和筛选 |
| Versions | 🏷️ | 版本历史和发布管理 |
| Documents | 📄 | 文档管理（评审记录、设计文档等） |
| Settings | ⚙️ | 系统设置（主题、路径配置等） |

### 收缩/展开行为

- **展开宽度**：240px
- **收缩宽度**：64px（仅显示图标）
- **切换方式**：点击底部"收缩/展开"按钮
- **状态保持**：收缩状态保存到 localStorage

---

## 响应式行为

| 窗口宽度 | 侧边栏状态 |
|:---------|:-----------|
| ≥1280px | 默认展开（240px） |
| 1024-1279px | 默认收缩（64px） |
| <1024px | 自动收缩，侧边栏浮出 |

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|:-----|:-----|:---------|
| v1.0 | 2026-03-20 | 顶部导航布局 |
| v2.0 | 2026-03-20 | Art/Engineer 设计文档 |
| v3.0 | 2026-03-20 | Boss 反馈：改为左侧可收缩侧边栏布局 |
