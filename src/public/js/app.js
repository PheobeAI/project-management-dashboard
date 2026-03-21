/**
 * Main Application JavaScript
 * Project Management Dashboard
 */

const AppState = {
  projects: [],
  settings: { theme: 'light', autoRefresh: true, refreshInterval: 60000 },
  currentFilter: 'all',
  searchQuery: '',
  pathFilter: '',
  refreshTimer: null
};

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initEventListeners();
  await loadSettings().catch(() => {});
  await loadProjects().catch(() => {});
  if (AppState.settings.autoRefresh) startAutoRefresh();
});

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  AppState.settings.theme = savedTheme;
  updateThemeButton(savedTheme);
  updateLogo(savedTheme);
}

function toggleTheme() {
  const newTheme = AppState.settings.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  AppState.settings.theme = newTheme;
  updateThemeButton(newTheme);
  updateLogo(newTheme);
  if (window.charts) updateChartsTheme(newTheme);
}

function updateLogo(theme) {
  const logo = document.getElementById('sidebarLogo');
  if (logo) {
    logo.src = theme === 'dark' ? '/assets/logo/logo-dark-bg.svg' : '/assets/logo/logo-icon.svg';
  }
}

function updateThemeButton(theme) {
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    if (theme === 'light') {
      themeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    } else {
      themeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    }
  }
}

async function loadSettings() {
  const response = await fetch(`${API_BASE}/settings`);
  const result = await response.json();
  if (result.success) {
    AppState.settings = { ...AppState.settings, ...result.data };
    if (AppState.settings.theme) {
      document.documentElement.setAttribute('data-theme', AppState.settings.theme);
      updateThemeButton(AppState.settings.theme);
    }
  }
}

async function loadProjects() {
  const response = await fetch(`${API_BASE}/projects`);
  const result = await response.json();
  if (result.success) {
    AppState.projects = result.data;
    renderProjects();
    renderStats();
    renderCharts();
    renderPathFilter();
  }
}

function showError(message) {
  const errorDiv = document.getElementById('pageError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
  }
}

async function refreshData() {
  const response = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
  const result = await response.json();
  if (result.success) {
    AppState.projects = result.data.projects;
    renderProjects();
    renderStats();
    renderCharts();
  }
}

function renderProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  const filtered = filterProjects(AppState.projects);
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📂</div><div class="empty-state-title">暂无项目</div></div>';
    return;
  }
  grid.innerHTML = filtered.map((p, i) => `
    <div class="project-card" onclick="navigateToProject('${p.id}')" style="animation-delay:${i*50}ms">
      <div class="project-name">
        <span class="path-tag" style="background:${p.pathColor||'#3B82F6'};color:white">${p.pathAlias||'默认'}</span>
        ${p.name}
      </div>
      <div class="project-meta">
        <span class="phase">${getPhaseName(p.phase)}</span>
        <span class="status-badge ${p.status}">${getStatusText(p.status)}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      <div class="progress-text"><span>${p.progress}%</span>${p.waitingFor?`<span>等待:${p.waitingFor.agent}</span>`:''}</div>
    </div>
  `).join('');
}

function renderStats() {
  const s = {
    total: AppState.projects.length,
    inProgress: AppState.projects.filter(p => p.status === 'warning').length,
    completed: AppState.projects.filter(p => p.progress === 100).length,
    blocked: AppState.projects.filter(p => p.status === 'blocked').length
  };
  const el = id => document.getElementById(id);
  if (el('totalProjects')) el('totalProjects').textContent = s.total;
  if (el('inProgress')) el('inProgress').textContent = s.inProgress;
  if (el('completed')) el('completed').textContent = s.completed;
  if (el('blocked')) el('blocked').textContent = s.blocked;
}

function renderPathFilter() {
  const select = document.getElementById('pathFilter');
  if (!select) return;
  const paths = [...new Set(AppState.projects.map(p => JSON.stringify({id:p.pathId,alias:p.pathAlias,color:p.pathColor})))].map(JSON.parse);
  select.innerHTML = '<option value="">所有路径</option>' + paths.map(p => `<option value="${p.id}">${p.alias}</option>`).join('');
}

function renderCharts() {
  if (typeof Chart === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    s.onload = () => initCharts();
    document.head.appendChild(s);
  } else {
    initCharts();
  }
}

function initCharts() {
  const isDark = AppState.settings.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  
  const progressCanvas = document.getElementById('progressChart');
  if (progressCanvas) {
    const ctx = progressCanvas.getContext('2d');
    if (window.progressChart) window.progressChart.destroy();
    window.progressChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: AppState.projects.slice(0,10).map(p=>p.name),
        datasets: [{label:'进度 %',data:AppState.projects.slice(0,10).map(p=>p.progress),backgroundColor:AppState.projects.slice(0,10).map(p=>p.status==='blocked'?'#EF4444':p.status==='warning'?'#F59E0B':'#3B82F6'),borderRadius:4}]
      },
      options: {responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{color:textColor},grid:{color:gridColor}},x:{ticks:{color:textColor},grid:{display:false}}}}
    });
  }
  
  const taskCanvas = document.getElementById('taskChart');
  if (taskCanvas) {
    const ctx = taskCanvas.getContext('2d');
    const sc = {done:0,in_progress:0,waiting:0,cancelled:0,paused:0};
    AppState.projects.forEach(p => {(p.tasks||[]).forEach(t => {if(sc[t.status]!==undefined) sc[t.status]++;});});
    if (window.taskChart) window.taskChart.destroy();
    window.taskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {labels:['已完成','进行中','待处理','已取消','暂停'],datasets:[{data:[sc.done,sc.in_progress,sc.waiting,sc.cancelled,sc.paused],backgroundColor:['#10B981','#3B82F6','#F59E0B','#64748B','#94A3B8']}]},
      options: {responsive:true,plugins:{legend:{position:'bottom',labels:{color:textColor}}}}
    });
  }
  
  window.charts = true;
}

function updateChartsTheme() { initCharts(); }

function filterProjects(projects) {
  return projects.filter(p => {
    if (AppState.searchQuery && !p.name.toLowerCase().includes(AppState.searchQuery.toLowerCase())) return false;
    if (AppState.currentFilter === 'done') { if (p.progress < 100) return false; }
    else if (AppState.currentFilter === 'in_progress') { if (p.progress >= 100 || p.status === 'blocked') return false; }
    else if (AppState.currentFilter === 'blocked') { if (p.status !== 'blocked') return false; }
    if (AppState.pathFilter && p.pathId !== AppState.pathFilter) return false;
    return true;
  });
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (AppState.settings.refreshInterval > 0) {
    AppState.refreshTimer = setInterval(refreshData, AppState.settings.refreshInterval);
  }
}

function stopAutoRefresh() {
  if (AppState.refreshTimer) { clearInterval(AppState.refreshTimer); AppState.refreshTimer = null; }
}

const PHASE_NAMES = {0:'初始化',1:'需求分析',2:'设计',3:'开发',4:'测试',5:'部署',6:'维护',7:'完成',8:'已发布',init:'初始化',planning:'规划中',requirements:'需求分析',design:'设计',developing:'开发中',development:'开发',testing:'测试中',testing_done:'测试完成',deploying:'部署中',deployed:'已部署',maintenance:'维护中',completed:'已完成',released:'已发布',reviewing:'评审中',approved:'已批准',rejected:'已拒绝',iterating:'迭代中',paused:'已暂停',cancelled:'已取消'};
const STATUS_NAMES = {normal:'正常',warning:'进行中',blocked:'阻塞',uninitialized:'未初始化'};

function getPhaseName(phase) { return PHASE_NAMES[phase] || phase; }
function getStatusText(status) { return STATUS_NAMES[status] || status; }
function navigateToProject(id) { window.location.href = `/project/${encodeURIComponent(id)}`; }

function initEventListeners() {
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) { themeBtn.addEventListener('click', toggleTheme); }
  
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('updating');
      refreshData().finally(() => { setTimeout(() => refreshBtn.classList.remove('updating'), 500); });
    });
  }
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) { searchInput.addEventListener('input', e => { AppState.searchQuery = e.target.value; renderProjects(); }); }
  
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });
  
  const pathFilter = document.getElementById('pathFilter');
  if (pathFilter) { pathFilter.addEventListener('change', e => { AppState.pathFilter = e.target.value; renderProjects(); }); }
  
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) { settingsBtn.addEventListener('click', () => { window.location.href = '/settings'; }); }
}

window.AppState = AppState;
window.toggleTheme = toggleTheme;
window.refreshData = refreshData;
window.navigateToProject = navigateToProject;
