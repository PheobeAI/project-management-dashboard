/**
 * Settings Page JavaScript
 * 
 * 设置页逻辑：主题、刷新、路径管理
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPaths();
  initEventListeners();
});

// ============ GitHub ============

async function loadGitHubStatus() {
  try {
    const response = await fetch(`${API_BASE}/github/status`);
    const result = await response.json();
    
    const statusEl = document.getElementById('githubStatus');
    const actionsEl = document.getElementById('githubActions');
    const helpEl = document.getElementById('githubHelp');
    
    if (!statusEl) return;
    
    if (result.success && result.data) {
      const status = result.data;
      
      if (status.authenticated) {
        statusEl.innerHTML = `
          <div class="github-status-connected">
            <span class="status-dot connected"></span>
            <span>已连接到 GitHub</span>
          </div>
        `;
        actionsEl.style.display = 'flex';
        helpEl.style.display = 'none';
      } else {
        statusEl.innerHTML = `
          <div class="github-status-disconnected">
            <span class="status-dot disconnected"></span>
            <span>${status.message || '未连接到 GitHub'}</span>
          </div>
        `;
        actionsEl.style.display = 'none';
        helpEl.style.display = 'block';
      }
    } else {
      statusEl.innerHTML = `
        <div class="github-status-disconnected">
          <span class="status-dot disconnected"></span>
          <span>GitHub 功能不可用</span>
        </div>
      `;
      actionsEl.style.display = 'none';
      helpEl.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load GitHub status:', error);
    const statusEl = document.getElementById('githubStatus');
    if (statusEl) {
      statusEl.innerHTML = `<div class="github-status-disconnected"><span>加载失败</span></div>`;
    }
  }
}

// ============ 加载设置 ============

async function loadSettings() {
  try {
    const response = await fetch(`${API_BASE}/settings`);
    const result = await response.json();
    
    if (result.success) {
      const settings = result.data;
      
      // 应用主题设置
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
        updateThemeButtons(settings.theme);
      }
      
      // 应用刷新设置
      const autoRefreshToggle = document.getElementById('autoRefreshToggle');
      if (autoRefreshToggle) {
        autoRefreshToggle.checked = settings.autoRefresh !== false;
      }
      
      const refreshInterval = document.getElementById('refreshInterval');
      if (refreshInterval && settings.refreshInterval) {
        refreshInterval.value = settings.refreshInterval;
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function loadPaths() {
  try {
    const response = await fetch(`${API_BASE}/paths`);
    const result = await response.json();
    
    if (result.success) {
      renderPaths(result.data);
    }
  } catch (error) {
    console.error('Failed to load paths:', error);
  }
}

// ============ 渲染 ============

function renderPaths(paths) {
  const container = document.getElementById('pathList');
  if (!container) return;
  
  if (paths.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">暂无路径</div>
        <div class="empty-state-description">点击上方按钮添加项目路径</div>
      </div>
    `;
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon-sm" onclick="deletePath('${path.id}')" title="删除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ============ 事件处理 ============

function initEventListeners() {
  // 主题切换
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newTheme = btn.dataset.theme;
      
      // 更新 UI
      updateThemeButtons(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // 保存设置
      await saveSettings({ theme: newTheme });
      
      // 通知首页更新（如果存在）
      if (window.opener) {
        window.opener.location.reload();
      }
    });
  });
  
  // 自动刷新开关
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await saveSettings({ autoRefresh: enabled });
      
      // 更新刷新定时器
      if (window.opener && window.opener.AppState) {
        if (enabled) {
          window.opener.startAutoRefresh();
        } else {
          window.opener.stopAutoRefresh();
        }
      }
    });
  }
  
  // 刷新间隔
  const refreshInterval = document.getElementById('refreshInterval');
  if (refreshInterval) {
    refreshInterval.addEventListener('change', async (e) => {
      const interval = parseInt(e.target.value);
      await saveSettings({ refreshInterval: interval });
      
      // 更新刷新定时器
      if (window.opener && window.opener.AppState) {
        window.opener.AppState.settings.refreshInterval = interval;
        if (window.opener.AppState.settings.autoRefresh) {
          window.opener.startAutoRefresh();
        }
      }
    });
  }
  
  // 添加路径按钮
  const addPathBtn = document.getElementById('addPathBtn');
  if (addPathBtn) {
    addPathBtn.addEventListener('click', showAddPathModal);
  }
  
  // 取消添加路径
  const cancelAddPath = document.getElementById('cancelAddPath');
  if (cancelAddPath) {
    cancelAddPath.addEventListener('click', hideAddPathModal);
  }
  
  // 确认添加路径
  const confirmAddPath = document.getElementById('confirmAddPath');
  if (confirmAddPath) {
    confirmAddPath.addEventListener('click', addPath);
  }
  
  // 颜色选择
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 自动提交开关
  const autoCommitToggle = document.getElementById('autoCommitToggle');
  if (autoCommitToggle) {
    autoCommitToggle.addEventListener('change', async (e) => {
      await saveSettings({ autoCommit: e.target.checked });
    });
  }
  
  // 加载 GitHub 状态
  loadGitHubStatus();
}

// ============ 主题 ============

function updateThemeButtons(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// ============ 路径管理 ============

let selectedColor = '#3B82F6';

function showAddPathModal() {
  const modal = document.getElementById('addPathModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('newPathInput').value = '';
    document.getElementById('newPathInput').placeholder = '选择或输入路径';
    document.getElementById('newPathAlias').value = '';
    selectedColor = '#3B82F6';
    document.querySelectorAll('.color-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.color === selectedColor);
    });
    
    // 设置目录选择器事件
    const dirPicker = document.getElementById('pathDirectoryPicker');
    if (dirPicker) {
      dirPicker.onchange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          // 获取第一个文件的路径（目录路径）
          const file = files[0];
          let dirPath = file.webkitRelativePath || file.name;
          // 从完整路径中提取目录
          if (file.webkitRelativePath) {
            const parts = file.webkitRelativePath.split('/');
            if (parts.length > 1) {
              parts.pop(); // 移除文件名
              dirPath = parts.join('/');
              // 获取盘符
              if (file.mozFullPath) {
                dirPath = file.mozFullPath.split('/').slice(0, -1).join('/');
              }
            }
          }
          // 尝试获取完整路径
          if (file.fullPath) {
            dirPath = file.fullPath.split('/').slice(0, -1).join('/');
          }
          document.getElementById('newPathInput').value = dirPath || file.name;
          document.getElementById('newPathInput').placeholder = dirPath || file.name;
        }
      };
    }
    
    // 浏览按钮
    const browseBtn = document.getElementById('browsePathBtn');
    if (browseBtn) {
      browseBtn.onclick = () => {
        const dirPicker = document.getElementById('pathDirectoryPicker');
        if (dirPicker) {
          dirPicker.click();
        }
      };
    }
  }
}

function hideAddPathModal() {
  const modal = document.getElementById('addPathModal');
  if (modal) {
    modal.classList.remove('active');
  }
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
    const response = await fetch(`${API_BASE}/paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        alias: aliasInput.value.trim(),
        color: selectedColor
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      hideAddPathModal();
      renderPaths(result.data);
      
      // 刷新首页
      if (window.opener) {
        window.opener.location.reload();
      }
    } else {
      showError('添加失败: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to add path:', error);
    showError('添加路径失败');
  }
}

async function deletePath(id) {
  if (!confirm('确定要删除这个路径吗？')) return;
  
  try {
    const response = await fetch(`${API_BASE}/paths/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      renderPaths(result.data);
      
      // 刷新首页
      if (window.opener) {
        window.opener.location.reload();
      }
    } else {
      showError('删除失败: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to delete path:', error);
    showError('删除路径失败');
  }
}

function editPath(id) {
  // TODO: 实现编辑路径功能
  showError('编辑路径功能开发中');
}

// ============ API ============

async function saveSettings(settings) {
  try {
    await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function showError(message) {
  // 显示错误提示在页面上，而不是弹窗
  const errorDiv = document.getElementById('pageError');
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

// ============ 导出 ============

window.loadSettings = loadSettings;
window.loadPaths = loadPaths;
window.showAddPathModal = showAddPathModal;
window.hideAddPathModal = hideAddPathModal;
window.addPath = addPath;
window.deletePath = deletePath;
window.editPath = editPath;
