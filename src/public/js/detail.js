/**
 * Detail Page JavaScript
 * 
 * 项目详情页逻辑
 */

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  const projectId = getProjectIdFromUrl();
  
  if (projectId) {
    await loadProjectDetail(projectId);
  }
  
  initEventListeners();
});

function getProjectIdFromUrl() {
  const match = window.location.pathname.match(/\/project\/(.+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function loadProjectDetail(projectId) {
  try {
    renderProjectSkeleton();
    
    const response = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
    const result = await response.json();
    
    if (result.success) {
      const project = result.data;
      window.AppState = window.AppState || {};
      window.AppState.currentProjectId = projectId;
      window.AppState.currentProject = project;
      renderProjectDetail(project);
      renderAgentStatus(project);
      renderTasks(project.tasks || []);
      renderTestResults(project.testResults);
      await loadF10F11F12(projectId);
    } else {
      showError('项目不存在');
    }
  } catch (error) {
    console.error('Failed to load project:', error);
    showError('加载项目详情失败');
  }
}

async function loadF10F11F12(projectId) {
  // F11: Phase Timeline
  const phaseSection = document.getElementById('phaseTimelineSection');
  if (phaseSection) {
    phaseSection.style.display = 'block';
    const project = window.AppState.currentProject;
    renderPhaseTimeline(project);
  }
  
  // F10: Agent Tasks
  try {
    const agentTasksResponse = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/agent-tasks`);
    const agentTasksResult = await agentTasksResponse.json();
    
    if (agentTasksResult.success && agentTasksResult.data.agents.length > 0) {
      const agentSection = document.getElementById('agentTasksSection');
      if (agentSection) {
        agentSection.style.display = 'block';
        renderAgentTasks(agentTasksResult.data.agents);
      }
    }
  } catch (e) {
    console.warn('Agent tasks not available:', e);
  }
  
  // F12: Test Details - Bug Stats
  try {
    const bugsResponse = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/bugs`);
    const bugsResult = await bugsResponse.json();
    
    if (bugsResult.success) {
      const testDetailsSection = document.getElementById('testDetailsSection');
      if (testDetailsSection) {
        testDetailsSection.style.display = 'block';
        renderBugStats(bugsResult.data);
      }
    }
    
    const reviewsResponse = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/reviews`);
    const reviewsResult = await reviewsResponse.json();
    
    if (reviewsResult.success) {
      renderReviews(reviewsResult.data.reviews);
    }
  } catch (e) {
    console.warn('Test details not available:', e);
  }
}

function renderProjectDetail(project) {
  const container = document.getElementById('projectInfo');
  if (!container) return;
  
  container.innerHTML = `
    <div class="project-header">
      <div class="path-tag" style="background-color: ${project.pathColor || '#3B82F6'}; color: white;">
        ${project.pathAlias || project.path}
      </div>
      <h1 class="project-title">${project.name}</h1>
    </div>
    <div class="project-meta-row">
      <span class="phase-badge">Phase ${project.phase}</span>
      <span class="status-badge ${project.status}">${getStatusText(project.status)}</span>
    </div>
    <div class="progress-section">
      <div class="progress-bar large">
        <div class="progress-fill" style="width: ${project.progress}%"></div>
      </div>
      <span class="progress-label">${project.progress}% 完成</span>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">创建时间</span>
        <span class="info-value">${formatDate(project.lastUpdated)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">等待处理</span>
        <span class="info-value">
          ${project.waitingFor ? `${project.waitingFor.agent} - ${project.waitingFor.action}` : '-'}
        </span>
      </div>
    </div>
  `;
}

function renderProjectSkeleton() {
  const container = document.getElementById('projectInfo');
  if (!container) return;
  
  container.innerHTML = `
    <div class="skeleton-line" style="width: 40%; height: 28px;"></div>
    <div class="skeleton-line" style="width: 20%; height: 20px; margin-top: 8px;"></div>
    <div class="skeleton-line" style="width: 60%; height: 40px; margin-top: 16px;"></div>
  `;
}

function renderAgentStatus(project) {
  const container = document.getElementById('agentGrid');
  if (!container) return;
  
  const agents = ['PM', 'Art', 'Engineer', 'QA', 'Designer'];
  const agentIcons = { PM: '👤', Art: '🎨', Engineer: '💻', QA: '🧪', Designer: '🤖' };
  
  const agentStats = {};
  agents.forEach(a => { agentStats[a] = { done: 0, total: 0 }; });
  
  (project.tasks || []).forEach(task => {
    const assignee = task.assignee || 'Other';
    if (!agentStats[assignee]) agentStats[assignee] = { done: 0, total: 0 };
    agentStats[assignee].total++;
    if (task.status === 'done') agentStats[assignee].done++;
  });
  
  container.innerHTML = agents.map(agent => {
    const stats = agentStats[agent];
    const isWaiting = project.waitingFor?.agent === agent;
    const status = stats.total === 0 ? '未参与' : stats.done === stats.total ? '已完成' : '进行中';
    
    return `
      <div class="agent-card ${isWaiting ? 'waiting' : ''}">
        <div class="agent-icon">${agentIcons[agent]}</div>
        <div class="agent-name">${agent}</div>
        <div class="agent-status">${status}</div>
        ${stats.total > 0 ? `<div class="agent-progress">${stats.done}/${stats.total}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderTasks(tasks) {
  const container = document.getElementById('taskList');
  if (!container) return;
  
  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无任务</div>';
    return;
  }
  
  const statusOrder = ['in_progress', 'waiting', 'done', 'cancelled', 'paused'];
  const sortedTasks = [...tasks].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  
  container.innerHTML = sortedTasks.map(task => `
    <div class="task-item">
      <div class="task-status">
        <span class="task-status-icon">${getTaskStatusIcon(task.status)}</span>
      </div>
      <div class="task-content">
        <div class="task-title">${task.title || task.id}</div>
        <div class="task-meta">
          <span class="task-type">${getTaskTypeText(task.type)}</span>
          ${task.assignee ? `<span class="task-assignee">${task.assignee}</span>` : ''}
          ${task.due ? `<span class="task-due">${formatDate(task.due)}</span>` : ''}
        </div>
      </div>
      <div class="task-badge">
        <span class="status-badge ${task.status}">${getTaskStatusText(task.status)}</span>
      </div>
    </div>
  `).join('');
}

function renderTestResults(testResults) {
  const container = document.getElementById('testStats');
  if (!container) return;
  
  if (!testResults) {
    container.innerHTML = '<div class="test-stat-card"><div class="test-stat-value">-</div><div class="test-stat-label">暂无测试数据</div></div>';
    return;
  }
  
  const passRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  
  document.getElementById('testStats').innerHTML = `
    <div class="test-stat-card">
      <div class="test-stat-value">${passRate}%</div>
      <div class="test-stat-label">通过率</div>
    </div>
    <div class="test-stat-card">
      <div class="test-stat-value">${testResults.total}</div>
      <div class="test-stat-label">总数</div>
    </div>
    <div class="test-stat-card">
      <div class="test-stat-value pass">${testResults.passed}</div>
      <div class="test-stat-label">通过</div>
    </div>
    <div class="test-stat-card">
      <div class="test-stat-value fail">${testResults.failed}</div>
      <div class="test-stat-label">失败</div>
    </div>
  `;
}

// Phase Timeline
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

function renderPhaseTimeline(project) {
  const container = document.getElementById('phaseTimeline');
  if (!container) return;
  
  const currentPhase = project.phase || 0;
  
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
  
  const currentPhaseInfo = PHASES[currentPhase] || PHASES[0];
  
  container.innerHTML = `
    <div class="phase-timeline-bar">
      ${phasesHtml}
    </div>
    <div class="phase-details">
      <div class="current-phase">
        <span class="current-phase-badge" style="background: ${currentPhaseInfo.color}">
          Phase ${currentPhase} - ${currentPhaseInfo.name}
        </span>
        ${project.waitingFor ? `<span class="waiting-info">等待: ${project.waitingFor.agent} (${project.waitingFor.action})</span>` : ''}
      </div>
      ${project.since ? `<div class="phase-since">开始于: ${formatDate(project.since)}</div>` : ''}
    </div>
  `;
}

// Agent Tasks
function renderAgentTasks(agents) {
  const container = document.getElementById('agentGroupsContainer');
  if (!container) return;
  
  if (agents.length === 0) {
    container.innerHTML = '<div class="empty-state-small">暂无 Agent 任务数据</div>';
    return;
  }
  
  container.innerHTML = agents.map(agent => `
    <div class="agent-group-card" data-agent="${agent.name}">
      <div class="agent-group-header" onclick="toggleAgentCard(this)">
        <div class="agent-group-info">
          <span class="agent-icon">${agent.icon}</span>
          <span class="agent-name">${agent.name}</span>
        </div>
        <div class="agent-stats">
          <span class="agent-stat">等待 ${agent.waiting.length}</span>
          <span class="agent-stat">进行 ${agent.inProgress.length}</span>
          <span class="agent-stat">完成 ${agent.done.length}</span>
          <span class="agent-toggle-icon">▼</span>
        </div>
      </div>
      <div class="agent-tasks-content">
        ${renderAgentTaskSection('等待处理', agent.waiting)}
        ${renderAgentTaskSection('进行中', agent.inProgress)}
        ${renderAgentTaskSection('已完成', agent.done)}
      </div>
    </div>
  `).join('');
}

function renderAgentTaskSection(title, tasks) {
  if (!tasks || tasks.length === 0) return '';
  
  const taskItems = tasks.map(task => `
    <div class="agent-task-item" data-status="${task.status}">
      <span class="task-status-icon">${getTaskStatusIcon(task.status)}</span>
      <span class="task-title">${task.title || task.id}</span>
      ${task.due ? `<span class="task-due">due: ${formatDate(task.due)}</span>` : ''}
    </div>
  `).join('');
  
  return `
    <div class="agent-task-section">
      <div class="agent-task-section-title">${title} (${tasks.length})</div>
      ${taskItems}
    </div>
  `;
}

function toggleAgentCard(header) {
  const card = header.closest('.agent-group-card');
  card.classList.toggle('collapsed');
}

// Bug Stats
function renderBugStats(data) {
  const container = document.getElementById('bugStatsContainer');
  if (!container) return;
  
  const { stats, bugs } = data;
  
  if (!bugs || bugs.length === 0) {
    container.innerHTML = `
      <div class="bug-stat-card"><div class="bug-stat-value">0</div><div class="bug-stat-label">总Bug</div></div>
      <div class="bug-stat-card"><div class="bug-stat-value pass">0</div><div class="bug-stat-label">已修复</div></div>
      <div class="bug-stat-card"><div class="bug-stat-value fail">0</div><div class="bug-stat-label">未修复</div></div>
      <div class="bug-stat-card"><div class="bug-stat-value">0%</div><div class="bug-stat-label">修复率</div></div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="bug-stat-card"><div class="bug-stat-value">${stats.total}</div><div class="bug-stat-label">总Bug</div></div>
    <div class="bug-stat-card"><div class="bug-stat-value pass">${stats.fixed}</div><div class="bug-stat-label">已修复</div></div>
    <div class="bug-stat-card"><div class="bug-stat-value fail">${stats.open}</div><div class="bug-stat-label">未修复</div></div>
    <div class="bug-stat-card"><div class="bug-stat-value">${stats.progress}%</div><div class="bug-stat-label">修复率</div></div>
  `;
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  if (!container) return;
  
  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<div class="empty-state-small">暂无评审历史</div>';
    return;
  }
  
  container.innerHTML = reviews.map(review => {
    const conclusionClass = review.conclusion?.toLowerCase().includes('approve') ? 'approve' :
                           review.conclusion?.toLowerCase().includes('reject') ? 'reject' : 'needs_revision';
    
    return `
      <div class="review-item">
        <div class="review-header">
          <span class="review-round">${review.round || 'Review'}</span>
          <span class="review-role">${review.role || '-'}</span>
          <span class="review-conclusion ${conclusionClass}">${review.conclusion || '-'}</span>
        </div>
        <div class="review-date">${formatDate(review.date)}</div>
      </div>
    `;
  }).join('');
}

// Utility functions
function getStatusText(status) {
  const statusMap = { normal: '正常', warning: '进行中', blocked: '阻塞', uninitialized: '未初始化' };
  return statusMap[status] || status;
}

function getTaskStatusIcon(status) {
  const iconMap = { done: '✅', in_progress: '🔄', waiting: '⏳', cancelled: '❌', paused: '⏸️' };
  return iconMap[status] || '📋';
}

function getTaskStatusText(status) {
  const textMap = { done: '已完成', in_progress: '进行中', waiting: '待处理', cancelled: '已取消', paused: '已暂停' };
  return textMap[status] || status;
}

function getTaskTypeText(type) {
  const textMap = { dev: '开发', art: '设计', test: '测试', other: '其他' };
  return textMap[type] || type;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showError(message) {
  const errorDiv = document.getElementById('pageError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
  } else {
    console.error(message);
  }
}

function initEventListeners() {
  const agentFilter = document.getElementById('agentFilter');
  const statusFilter = document.getElementById('agentTaskStatusFilter');
  const searchInput = document.getElementById('agentTaskSearch');
  
  if (agentFilter) agentFilter.addEventListener('change', filterAgentTasks);
  if (statusFilter) statusFilter.addEventListener('change', filterAgentTasks);
  if (searchInput) searchInput.addEventListener('input', filterAgentTasks);
}

function filterAgentTasks() {
  const agentFilter = document.getElementById('agentFilter');
  const statusFilter = document.getElementById('agentTaskStatusFilter');
  const searchInput = document.getElementById('agentTaskSearch');
  
  const selectedAgent = agentFilter?.value || '';
  const selectedStatus = statusFilter?.value || '';
  const searchQuery = searchInput?.value.toLowerCase() || '';
  
  const cards = document.querySelectorAll('.agent-group-card');
  
  cards.forEach(card => {
    let show = true;
    
    if (selectedAgent && card.dataset.agent !== selectedAgent) show = false;
    
    if (show && selectedStatus) {
      const tasksInCard = card.querySelectorAll('.agent-task-item');
      let hasStatusMatch = false;
      tasksInCard.forEach(task => {
        if (task.dataset.status === selectedStatus) hasStatusMatch = true;
      });
      if (!hasStatusMatch) show = false;
    }
    
    if (show && searchQuery) {
      const tasksInCard = card.querySelectorAll('.agent-task-item');
      let hasSearchMatch = false;
      tasksInCard.forEach(task => {
        if (task.querySelector('.task-title')?.textContent.toLowerCase().includes(searchQuery)) {
          hasSearchMatch = true;
        }
      });
      if (!hasSearchMatch) show = false;
    }
    
    card.style.display = show ? 'block' : 'none';
  });
}

// Exports
window.loadProjectDetail = loadProjectDetail;
window.getProjectIdFromUrl = getProjectIdFromUrl;
window.toggleAgentCard = toggleAgentCard;
