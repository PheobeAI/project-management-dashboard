/**
 * Shared Constants
 * Single source of truth for all phase/status mappings across the app.
 * Used by app.js, detail.js, and chart config files.
 */

window.PHASES = [
  { id: 0, name: '初始化',   shortName: 'Init',     color: '#94A3B8' },
  { id: 1, name: '需求分析', shortName: 'Req',      color: '#3B82F6' },
  { id: 2, name: '设计',     shortName: 'Design',   color: '#8B5CF6' },
  { id: 3, name: '开发',     shortName: 'Dev',      color: '#10B981' },
  { id: 4, name: '测试',     shortName: 'Test',     color: '#F59E0B' },
  { id: 5, name: '部署',     shortName: 'Deploy',   color: '#EC4899' },
  { id: 6, name: '维护',     shortName: 'Maint',    color: '#06B6D4' },
  { id: 7, name: '完成',     shortName: 'Done',     color: '#64748B' },
  { id: 8, name: '已发布',   shortName: 'Released', color: '#1E40AF' }
];

// Map phase name string → phase ID (for API values like 'iterating', 'approved')
window.PHASE_NAME_TO_ID = {
  pending: 0, idea: 0,
  requirements: 1, requirement_analysis: 1,
  design: 2, 设计验证: 2,
  dev: 3, development: 3, iterating: 3,
  testing: 4, test: 4,
  deployment: 5, deploy: 5, deploying: 5,
  maint: 6, maintenance: 6,
  done: 7, completed: 7, approved: 7,
  released: 8, published: 8, 上线: 8
};

// Short display names (for charts - uses Chinese names matching PHASES)
window.PHASE_DISPLAY_NAMES = PHASES.reduce((acc, p) => {
  acc[p.id] = p.name;
  return acc;
}, {});

window.PHASE_COLORS = PHASES.reduce((acc, p) => {
  acc[p.id] = p.color;
  return acc;
}, {});

// Status display names
window.STATUS_TEXT = {
  normal: '正常',
  warning: '进行中',
  blocked: '阻塞',
  uninitialized: '未初始化',
  in_progress: '进行中',
  done: '已完成',
  waiting: '待处理',
  paused: '已暂停',
  cancelled: '已取消'
};

/**
 * Get phase display name from numeric ID or string value
 * @param {number|string} phase - phase ID (0-8) or API string ('iterating', etc.)
 * @returns {string} display name
 */
window.getPhaseDisplayName = function(phase) {
  if (typeof phase === 'number') {
    const p = PHASES.find(x => x.id === phase);
    return p ? p.name : phase;
  }
  const id = PHASE_NAME_TO_ID[phase];
  if (id !== undefined) {
    const p = PHASES.find(x => x.id === id);
    return p ? p.name : phase;
  }
  return phase;
};

/**
 * Get short phase name (for charts/timelines)
 */
window.getPhaseShortName = function(phase) {
  if (typeof phase === 'number') {
    const p = PHASES.find(x => x.id === phase);
    return p ? p.shortName : phase;
  }
  const id = PHASE_NAME_TO_ID[phase];
  if (id !== undefined) {
    const p = PHASES.find(x => x.id === id);
    return p ? p.shortName : phase;
  }
  return phase;
};

/**
 * Get phase color
 */
window.getPhaseColor = function(phase) {
  if (typeof phase === 'number') {
    return PHASE_COLORS[phase] || '#94A3B8';
  }
  const id = PHASE_NAME_TO_ID[phase];
  return PHASE_COLORS[id] || '#94A3B8';
};

/**
 * Get status display text
 */
window.getStatusDisplayText = function(status) {
  return STATUS_TEXT[status] || status;
};

/**
 * Show error message on page (shared utility)
 */
window.showError = function(message, duration = 5000) {
  const errorDiv = document.getElementById('pageError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, duration);
  } else {
    console.error(message);
  }
};
