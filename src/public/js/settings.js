/**
 * Settings Page JavaScript
 *
 * API_BASE set by layout.hbs inline script (do NOT redeclare)
 */

// State
let selectedColor = '#3B82F6';
let editingPathId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPaths();
  loadGitHubStatus();
  initEventListeners();
});

async function loadSettings() {
  try {
    const response = await fetch(`${window.API_BASE}/settings`);
    const result = await response.json();
    if (result.success) {
      const settings = result.data;
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
      const autoRefreshToggle = document.getElementById('autoRefreshToggle');
      if (autoRefreshToggle) autoRefreshToggle.checked = settings.autoRefresh !== false;
      const autoCommitToggle = document.getElementById('autoCommitToggle');
      if (autoCommitToggle) autoCommitToggle.checked = settings.autoCommit === true;
      const refreshInterval = document.getElementById('refreshInterval');
      if (refreshInterval) refreshInterval.value = settings.refreshInterval || 60;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function loadPaths() {
  try {
    const response = await fetch(`${window.API_BASE}/paths`);
    const result = await response.json();
    if (result.success) {
      renderPaths(result.data);
      window.pathData = {};
      result.data.forEach(p => { window.pathData[p.id] = p; });
    }
  } catch (error) {
    console.error('Failed to load paths:', error);
  }
}

function loadGitHubStatus() {
  const tokenInput = document.getElementById('githubToken');
  if (tokenInput && tokenInput.value.trim()) {
    const container = document.getElementById('githubStatus');
    if (container) container.innerHTML = '<span class="github-status loading">检查中...</span>';
    setTimeout(() => {
      const container = document.getElementById('githubStatus');
      if (container) container.innerHTML = '<span class="github-status ok">已配置</span>';
    }, 500);
  }
}

function renderPaths(paths) {
  const container = document.getElementById('pathList');
  if (!container) return;
  if (!paths || paths.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无路径配置</div>';
    return;
  }
  container.innerHTML = paths.map(path => `
    <div class="path-item" data-id="${path.id}">
      <div class="path-item-info">
        <span class="path-color" style="background-color: ${path.color || '#3B82F6'}"></span>
        <div class="path-details">
          <span class="path-alias">${path.alias || path.path}</span>
          <span class="path-address">${path.path}</span>
        </div>
      </div>
      <div class="path-actions">
        <button class="btn-icon-sm" onclick="editPath('${path.id}')" title="编辑">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon-sm" onclick="deletePath('${path.id}')" title="删除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function initEventListeners() {
  // Theme toggle
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      saveSettings({ theme: newTheme });
    });
  }

  // Auto refresh toggle
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await saveSettings({ autoRefresh: enabled });
      if (window.opener && window.opener.AppState) {
        if (enabled) {
          window.opener.startAutoRefresh();
        } else {
          window.opener.stopAutoRefresh();
        }
      }
    });
  }

  // Refresh interval
  const refreshInterval = document.getElementById('refreshInterval');
  if (refreshInterval) {
    refreshInterval.addEventListener('change', async (e) => {
      const interval = parseInt(e.target.value);
      await saveSettings({ refreshInterval: interval });
    });
  }

  // Auto commit toggle
  const autoCommitToggle = document.getElementById('autoCommitToggle');
  if (autoCommitToggle) {
    autoCommitToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await saveSettings({ autoCommit: enabled });
    });
  }

  // GitHub token
  const githubTokenInput = document.getElementById('githubToken');
  if (githubTokenInput) {
    githubTokenInput.addEventListener('change', async (e) => {
      await updateGithubToken(e.target.value.trim());
    });
  }

  // Add path modal
  const addPathBtn = document.getElementById('addPathBtn');
  if (addPathBtn) {
    addPathBtn.addEventListener('click', showAddPathModal);
  }

  const cancelAddPath = document.getElementById('cancelAddPath');
  if (cancelAddPath) {
    cancelAddPath.addEventListener('click', hideAddPathModal);
  }

  // Browse button for directory picker
  const browseBtn = document.getElementById('browsePathBtn');
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      const dirPicker = document.getElementById('pathDirectoryPicker');
      if (dirPicker) dirPicker.click();
    });
  }

  const dirPicker = document.getElementById('pathDirectoryPicker');
  if (dirPicker) {
    dirPicker.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        let dirPath = file.webkitRelativePath || file.name;
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) { parts.pop(); dirPath = parts.join('/'); }
        }
        if (file.mozFullPath) { dirPath = file.mozFullPath.split('/').slice(0, -1).join('/'); }
        if (file.fullPath) { dirPath = file.fullPath.split('/').slice(0, -1).join('/'); }
        document.getElementById('newPathInput').value = dirPath;
        document.getElementById('newPathInput').placeholder = '已选择: ' + dirPath;
      }
    });
  }

  // Close modal on backdrop click
  const modal = document.getElementById('addPathModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideAddPathModal();
    });
  }

  // Color buttons
  document.querySelectorAll('.color-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
      selectedColor = b.dataset.color;
    });
  });
}

async function saveSettings(updates) {
  try {
    const response = await fetch(`${window.API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { success: false, error: error.message };
  }
}

async function updateGithubToken(token) {
  const result = await saveSettings({ githubToken: token });
  if (result.success) {
    loadGitHubStatus();
  } else {
    showError('GitHub token 更新失败');
  }
}

function showAddPathModal() {
  editingPathId = null;
  const modal = document.getElementById('addPathModal');
  const title = modal ? modal.querySelector('h3') : null;
  const confirmBtn = document.getElementById('confirmAddPath');
  if (title) title.textContent = '添加路径';
  if (confirmBtn) confirmBtn.textContent = '添加';
  document.getElementById('newPathInput').value = '';
  document.getElementById('newPathInput').placeholder = '输入或选择路径';
  document.getElementById('newPathAlias').value = '';
  selectedColor = '#3B82F6';
  document.querySelectorAll('.color-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === selectedColor);
  });
  if (modal) modal.style.display = 'flex';
}

function hideAddPathModal() {
  const modal = document.getElementById('addPathModal');
  if (modal) modal.style.display = 'none';
  editingPathId = null;
  const title = modal ? modal.querySelector('h3') : null;
  const confirmBtn = document.getElementById('confirmAddPath');
  if (title) title.textContent = '添加路径';
  if (confirmBtn) confirmBtn.textContent = '添加';
}

async function addPath() {
  const pathInput = document.getElementById('newPathInput');
  const aliasInput = document.getElementById('newPathAlias');
  const path = pathInput.value.trim();
  if (!path) {
    pathInput.placeholder = '请输入或选择路径';
    pathInput.focus();
    return;
  }
  try {
    const response = await fetch(`${window.API_BASE}/paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, alias: aliasInput.value.trim(), color: selectedColor })
    });
    const result = await response.json();
    if (result.success) {
      hideAddPathModal();
      renderPaths(result.data);
      if (window.opener) window.opener.location.reload();
    } else {
      showError('添加失败: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to add path:', error);
    showError('添加路径失败');
  }
}

async function updatePath() {
  const pathId = document.getElementById('newPathId');
  if (!pathId || !pathId.value) {
    showError('路径 ID 错误');
    return;
  }
  const pathInput = document.getElementById('newPathInput');
  const aliasInput = document.getElementById('newPathAlias');
  try {
    const response = await fetch(`${window.API_BASE}/paths/${pathId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathInput.value.trim(), alias: aliasInput.value.trim(), color: selectedColor })
    });
    const result = await response.json();
    if (result.success) {
      hideAddPathModal();
      renderPaths(result.data);
      if (window.opener) window.opener.location.reload();
    } else {
      showError('更新失败: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to update path:', error);
    showError('更新路径失败');
  }
}

function editPath(id) {
  const pathData = window.pathData || {};
  const path = pathData[id];
  if (!path) { showError('路径不存在'); return; }
  editingPathId = id;
  document.getElementById('newPathId').value = id;
  document.getElementById('newPathInput').value = path.path;
  document.getElementById('newPathAlias').value = path.alias || '';
  selectedColor = path.color || '#3B82F6';
  document.querySelectorAll('.color-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === selectedColor);
  });
  const modal = document.getElementById('addPathModal');
  const title = modal ? modal.querySelector('h3') : null;
  const confirmBtn = document.getElementById('confirmAddPath');
  if (title) title.textContent = '编辑路径';
  if (confirmBtn) confirmBtn.textContent = '保存';
  if (modal) modal.style.display = 'flex';
}

async function deletePath(id) {
  if (!confirm('确定要删除这个路径吗?')) return;
  try {
    const response = await fetch(`${window.API_BASE}/paths/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      renderPaths(result.data);
      if (window.opener) window.opener.location.reload();
    } else {
      showError('删除失败: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to delete path:', error);
    showError('删除路径失败');
  }
}

// Modal confirm button handler - decides add vs update
document.addEventListener('DOMContentLoaded', () => {
  const confirmBtn = document.getElementById('confirmAddPath');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (editingPathId) {
        updatePath();
      } else {
        addPath();
      }
    });
  }
});
