/**
 * Main Application JavaScript
 * 
 * 项目管理仪表盘前端逻辑
 */

// 全局状�?const AppState = {
  projects: [],
  settings: {
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 60000
  },
  currentFilter: 'all',
  searchQuery: '',
  pathFilter: '',
  refreshTimer: null
};

// API 基础路径
const API_BASE = '/api';

// ============ 初始�?============

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化主�?  initTheme();
  
  // 加载设置
  await loadSettings();
  
  // 加载数据
  await loadProjects();
  
  // 初始化事件监�?  initEventListeners();
  
  // 启动自动刷新
  if (AppState.settings.autoRefresh) {
    startAutoRefresh();
  }
});

// ============ 主题管理 ============

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  AppState.settings.theme = savedTheme;
  
  // 更新主题按钮
  updateThemeButton(savedTheme);
  // 更新 logo
  updateLogo(savedTheme);
}

function toggleTheme() {
  const currentTheme = AppState.settings.theme;
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  AppState.settings.theme = newTheme;
  
  updateThemeButton(newTheme);
  updateLogo(newTheme);
  
  // 更新图表主题（如果已加载）
  if (window.charts) {
    updateChartsTheme(newTheme);
  }
}

function updateLogo(theme) {
  const logo = document.getElementById('sidebarLogo');
  if (logo) {
    if (theme === 'dark') {
      logo.src = '/assets/logo/logo-dark-bg.svg';
    } else {
      logo.src = '/assets/logo/logo-icon.svg';
    }
  }
}

function updateThemeButton(theme) {
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'light' 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  }
}

// ============ 数据加载 ============

async function loadSettings() {
  try {
    const response = await fetch(`${API_BASE}/settings`);
    const result = await response.json();
    
    if (result.success) {
      AppState.settings = { ...AppState.settings, ...result.data };
      
      // 应用设置
      if (AppState.settings.theme) {
        document.documentElement.setAttribute('data-theme', AppState.settings.theme);
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE}/projects`);
    const result = await response.json();
    
    if (result.success) {
      AppState.projects = result.data;
      renderProjects();
      renderStats();
      renderCharts();
      renderPathFilter();
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    showError('加载项目数据失败');
  }
}

function showError(message) {
  // 显示错误提示在页面上，而不是弹�?  const errorDiv = document.getElementById('pageError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  } else {
    console.error(message);
  }
}

async function refreshData() {
  try {
    const response = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      AppState.projects = result.data.projects;
      renderProjects();
      renderStats();
      renderCharts();
      
      // 显示更新动画
      document.querySelectorAll('.stat-value').forEach(el => {
        el.classList.add('updating');
        setTimeout(() => el.classList.remove('updating'), 500);
      });
    }
  } catch (error) {
    console.error('Failed to refresh:', error);
  }
}

// ============ 渲染 ============

function renderProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  
  // 过滤项目
  const filtered = filterProjects(AppState.projects);
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">暂无项目</div>
        <div class="empty-state-description">请在设置中添加项目路�?/div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map((project, index) => `
    <div class="project-card" onclick="navigateToProject('${project.id}')" style="animation-delay: ${index * 50}ms">
      <div class="project-name">
        <span class="path-tag" style="background-color: ${project.pathColor || '#3B82F6'}; color: white;">
          ${project.pathAlias || '默认'}
        </span>
        ${project.name}
      </div>
      <div class="project-meta">
        <span class="phase">${getPhaseName(project.phase)}</span>
        <span class="status-badge ${project.status}">${getStatusText(project.status)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${project.progress}%"></div>
      </div>
      <div class="progress-text">
        <span>${project.progress}%</span>
        ${project.waitingFor ? `<span>等待: ${project.waitingFor.agent}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function renderStats() {
  const stats = {
    total: AppState.projects.length,
    inProgress: AppState.projects.filter(p => p.status === 'warning').length,
    completed: AppState.projects.filter(p => p.progress === 100).length,
    blocked: AppState.projects.filter(p => p.status === 'blocked').length
  };
  
  document.getElementById('totalProjects').textContent = stats.total;
  document.getElementById('inProgress').textContent = stats.inProgress;
  document.getElementById('completed').textContent = stats.completed;
  document.getElementById('blocked').textContent = stats.blocked;
}

function renderPathFilter() {
  const select = document.getElementById('pathFilter');
  if (!select) return;
  
  // 收集所有路�?  const paths = [...new Set(AppState.projects.map(p => JSON.stringify({ id: p.pathId, alias: p.pathAlias, color: p.pathColor })))].map(JSON.parse);
  
  select.innerHTML = '<option value="">所有路�?/option>' + 
    paths.map(p => `<option value="${p.id}">${p.alias}</option>`).join('');
}

function renderCharts() {
  // 检�?Chart.js 是否加载
  if (typeof Chart === 'undefined') {
    // 动态加�?Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => initCharts();
    document.head.appendChild(script);
  } else {
    initCharts();
  }
}

function initCharts() {
  const isDark = AppState.settings.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  
  // 项目进度对比�?  const progressCanvas = document.getElementById('progressChart');
  if (progressCanvas) {
    const ctx = progressCanvas.getContext('2d');
    
    if (window.progressChart) window.progressChart.destroy();
    
    window.progressChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: AppState.projects.slice(0, 10).map(p => p.name),
        datasets: [{
          label: '进度 %',
          data: AppState.projects.slice(0, 10).map(p => p.progress),
          backgroundColor: AppState.projects.slice(0, 10).map(p => {
            if (p.status === 'blocked') return '#EF4444';
            if (p.status === 'warning') return '#F59E0B';
            return '#3B82F6';
          }),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          }
        }
      }
    });
  }
  
  // 任务状态分布图
  const taskCanvas = document.getElementById('taskChart');
  if (taskCanvas) {
    const ctx = taskCanvas.getContext('2d');
    
    // 统计任务状�?    const statusCount = { done: 0, in_progress: 0, waiting: 0, cancelled: 0, paused: 0 };
    AppState.projects.forEach(p => {
      (p.tasks || []).forEach(t => {
        if (statusCount[t.status] !== undefined) {
          statusCount[t.status]++;
        }
      });
    });
    
    if (window.taskChart) window.taskChart.destroy();
    
    window.taskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['已完�?, '进行�?, '待处�?, '已取�?, '暂停'],
        datasets: [{
          data: [statusCount.done, statusCount.in_progress, statusCount.waiting, statusCount.cancelled, statusCount.paused],
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#64748B', '#94A3B8']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor }
          }
        }
      }
    });
  }
  
  // 阶段分布�?  initPhaseChart();
  
  // 路径分布�?  initPathChart();
  
  window.charts = true;
}

function updateChartsTheme(theme) {
  initCharts();
}

// ============ Additional Charts ============

function initPhaseChart() {
  const canvas = document.getElementById('phaseChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const isDark = AppState.settings.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  
  // 统计阶段分布
  const phaseCount = {};
  AppState.projects.forEach(p => {
    const phase = p.phase || 0;
    phaseCount[phase] = (phaseCount[phase] || 0) + 1;
  });
  
  const phases = Object.keys(phaseCount).sort((a, b) => a - b);
  const counts = phases.map(p => phaseCount[p]);
  
  if (window.phaseChart) window.phaseChart.destroy();
  
  window.phaseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: phases.map(p => `Phase ${p}`),
      datasets: [{
        data: counts,
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
          '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor }
        }
      }
    }
  });
}

function initPathChart() {
  const canvas = document.getElementById('pathChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const isDark = AppState.settings.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  
  // 统计路径分布
  const pathCount = {};
  const pathColors = {};
  AppState.projects.forEach(p => {
    const alias = p.pathAlias || 'Unknown';
    pathCount[alias] = (pathCount[alias] || 0) + 1;
    pathColors[alias] = p.pathColor || '#3B82F6';
  });
  
  const paths = Object.keys(pathCount);
  const counts = paths.map(p => pathCount[p]);
  const colors = paths.map(p => pathColors[p]);
  
  if (window.pathChart) window.pathChart.destroy();
  
  window.pathChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: paths,
      datasets: [{
        label: '项目�?,
        data: counts,
        backgroundColor: colors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      }
    }
  });
}

// ============ 过滤 ============

function filterProjects(projects) {
  return projects.filter(project => {
    // 搜索过滤
    if (AppState.searchQuery && !project.name.toLowerCase().includes(AppState.searchQuery.toLowerCase())) {
      return false;
    }
    
    // 状态过�?- 筛选要显示的项�?    if (AppState.currentFilter === 'done') {
      if (project.progress < 100) return false;
    } else if (AppState.currentFilter === 'in_progress') {
      if (project.progress >= 100 || project.status === 'blocked') return false;
    } else if (AppState.currentFilter === 'blocked') {
      if (project.status !== 'blocked') return false;
    }
    
    // 路径过滤
    if (AppState.pathFilter && project.pathId !== AppState.pathFilter) {
      return false;
    }
    
    return true;
  });
}

// ============ 自动刷新 ============

function startAutoRefresh() {
  stopAutoRefresh();
  
  if (AppState.settings.refreshInterval > 0) {
    AppState.refreshTimer = setInterval(() => {
      refreshData();
    }, AppState.settings.refreshInterval);
  }
}

function stopAutoRefresh() {
  if (AppState.refreshTimer) {
    clearInterval(AppState.refreshTimer);
    AppState.refreshTimer = null;
  }
}

// ============ 工具函数 ============

// Phase 名称映射�?const PHASE_NAMES = {
  // 数字索引
  0: '初始�?,
  1: '需求分�?,
  2: '设计',
  3: '开�?,
  4: '测试',
  5: '部署',
  6: '维护',
  7: '完成',
  8: '已发�?,
  // 字符串名称（兼容旧数据）
  'init': '初始�?,
  'planning': '规划�?,
  'requirements': '需求分�?,
  'design': '设计',
  'developing': '开发中',
  'development': '开�?,
  'testing': '测试�?,
  'testing_done': '测试完成',
  'deploying': '部署�?,
  'deployed': '已部�?,
  'maintenance': '维护�?,
  'completed': '已完�?,
  'released': '已发�?,
  'reviewing': '评审�?,
  'approved': '已批�?,
  'rejected': '已拒�?,
  'iterating': '迭代�?,
  'paused': '已暂�?,
  'cancelled': '已取�?
};

function getPhaseName(phase) {
  if (PHASE_NAMES.hasOwnProperty(phase)) {
    return PHASE_NAMES[phase];
  }
  // 如果是未知值，直接返回原�?  return phase;
}

function getStatusText(status) {
  const statusMap = {
    normal: '正常',
    warning: '进行�?,
    blocked: '阻塞',
    uninitialized: '未初始化'
  };
  return statusMap[status] || status;
}

function navigateToProject(projectId) {
  window.location.href = `/project/${encodeURIComponent(projectId)}`;
}

// ============ 事件监听 ============

function initEventListeners() {
  // 主题切换
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
  
  // 刷新按钮
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('updating');
      refreshData().finally(() => {
        setTimeout(() => refreshBtn.classList.remove('updating'), 500);
      });
    });
  }
  
  // 搜索输入
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      renderProjects();
    });
  }
  
  // 状态筛�?  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });
  
  // 路径筛�?  const pathFilter = document.getElementById('pathFilter');
  if (pathFilter) {
    pathFilter.addEventListener('change', (e) => {
      AppState.pathFilter = e.target.value;
      renderProjects();
    });
  }
  
  // 设置按钮
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '/settings';
    });
  }
}

// ============ 导出 ============

window.AppState = AppState;
window.toggleTheme = toggleTheme;
window.refreshData = refreshData;
window.navigateToProject = navigateToProject;

