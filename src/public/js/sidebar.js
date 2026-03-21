/**
 * Sidebar JavaScript
 * 
 * 侧边栏切换逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
});

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  
  if (!sidebar) {
    console.error('Sidebar element not found');
    return;
  }
  
  // 从 localStorage 读取收缩状态
  const savedCollapsed = localStorage.getItem('sidebarCollapsed');
  
  // 如果有保存的状态，应用它
  if (savedCollapsed !== null) {
    const shouldCollapse = savedCollapsed === 'true';
    if (shouldCollapse) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
    }
  }
  
  // 桌面端收缩/展开按钮
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isCollapsed = sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
      
      // 保存状态
      localStorage.setItem('sidebarCollapsed', isCollapsed);
      
      // 更新按钮文字
      updateToggleButtonText(isCollapsed);
    });
  }
  
  // 移动端菜单按钮
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
  
  // 点击其他区域关闭移动端侧边栏
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1023) {
      if (!sidebar.contains(e.target) && (!mobileMenuBtn || !mobileMenuBtn.contains(e.target))) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
  
  // 响应式处理 - 只在首次加载时处理，不在 resize 时强制覆盖用户选择
  handleResponsive();
  
  // 高亮当前页面的导航项
  highlightActiveNav();
  
  // 只在切换断点时调整，移动端不强制收缩
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    const wasMobile = lastWidth <= 1023;
    const isMobile = currentWidth <= 1023;
    
    // 只有在切换移动/桌面模式时才调整
    if (wasMobile !== isMobile) {
      handleResponsive();
    }
    
    lastWidth = currentWidth;
  });
}

function updateToggleButtonText(isCollapsed) {
  const toggleBtn = document.getElementById('sidebarToggle');
  if (!toggleBtn) return;
  
  const toggleIcon = toggleBtn.querySelector('.toggle-icon');
  const toggleText = toggleBtn.querySelector('.toggle-text');
  
  if (toggleIcon) {
    toggleIcon.textContent = isCollapsed ? '▶' : '◀';
  }
  if (toggleText) {
    toggleText.textContent = isCollapsed ? '展开侧边栏' : '收缩侧边栏';
  }
}

function handleResponsive() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  if (window.innerWidth <= 1023) {
    // 移动端：移除强制收缩
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
  }
  // 桌面端不强制任何状态，让用户选择
}

// 高亮当前页面的导航项
function highlightActiveNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const currentPath = location.pathname;
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath) {
      item.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      item.classList.add('active');
    }
  });
}

// ============ 导出 ============

window.initSidebar = initSidebar;
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    updateToggleButtonText(isCollapsed);
  }
};
