# 动效设计规范

**项目**：project-management-dashboard  
**版本**：v1.0  
**日期**：2026-03-21

---

## 1. 动效原则

### 1.1 目的
- **引导注意**：帮助用户理解界面变化
- **提供反馈**：让用户知道操作已生效
- **创建连续性**：使页面转换流畅自然
- **增强愉悦感**：精致的微交互提升体验

### 1.2 时机
- **立即响应**：< 100ms，用户感觉无延迟
- **快速过渡**：100-300ms，大多数 UI 动效
- **慢速动画**：300-500ms，复杂状态变化
- **暂停/延迟**：> 500ms，等待加载等

### 1.3 缓动曲线

| 曲线名称 | CSS 值 | 使用场景 |
|:---------|:-------|:---------|
| 标准 | `cubic-bezier(0.4, 0, 0.2, 1)` | 大多数 UI 元素 |
| 进入 | `cubic-bezier(0, 0, 0.2, 1)` | 元素出现 |
| 退出 | `cubic-bezier(0.4, 0, 1, 1)` | 元素消失 |
| 弹性 | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 按钮点击、弹出 |

---

## 2. 页面加载动画

### 2.1 卡片入场动画

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

/* 错开延迟 */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 50ms; }
.card:nth-child(3) { animation-delay: 100ms; }
.card:nth-child(4) { animation-delay: 150ms; }
.card:nth-child(5) { animation-delay: 200ms; }
.card:nth-child(6) { animation-delay: 250ms; }
.card:nth-child(7) { animation-delay: 300ms; }
.card:nth-child(8) { animation-delay: 350ms; }
```

### 2.2 骨架屏加载

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 深色模式 */
[data-theme="dark"] .skeleton {
  background: linear-gradient(
    90deg,
    #334155 25%,
    #475569 50%,
    #334155 75%
  );
  background-size: 200% 100%;
}
```

---

## 3. 悬停动画

### 3.1 卡片悬停

```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

### 3.2 按钮悬停

```css
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  background-color: var(--color-primary-dark);
  transform: scale(1.02);
}

.btn:active {
  transform: scale(0.98);
}
```

### 3.3 侧边栏菜单悬停

```css
.menu-item {
  transition: background-color 0.2s ease,
              border-color 0.2s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.menu-item.active {
  background-color: #334155;
  border-left: 4px solid #60A5FA;
}
```

---

## 4. 侧边栏收缩动画

```css
.sidebar {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed {
  width: 60px;
}

/* 菜单文字淡出 */
.sidebar.collapsed .menu-text,
.sidebar.collapsed .logo-text,
.sidebar.collapsed .collapse-text {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

/* 菜单图标居中 */
.sidebar.collapsed .menu-item {
  justify-content: center;
}
```

---

## 5. Tab 切换动画

```css
.tab-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 或滑入效果 */
.tab-content.slide {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 6. 主题切换动画

```css
body,
.card,
.header,
.sidebar {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}

/* 主题切换时禁用过渡，避免闪烁 */
.theme-transitioning * {
  transition: none !important;
}
```

---

## 7. 数据更新动画

### 7.1 数字变化闪烁

```css
@keyframes dataPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.data-updating {
  animation: dataPulse 0.5s ease-in-out;
}
```

### 7.2 进度条动画

```css
.progress-bar-fill {
  transition: width 0.8s ease-out;
}
```

### 7.3 图表绘制动画

```css
.chart-bar {
  animation: growUp 0.6s ease-out forwards;
  transform-origin: bottom;
}

@keyframes growUp {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

/* 延迟错开 */
.chart-bar:nth-child(1) { animation-delay: 0ms; }
.chart-bar:nth-child(2) { animation-delay: 50ms; }
.chart-bar:nth-child(3) { animation-delay: 100ms; }
/* ... */
```

---

## 8. 折叠/展开动画

```css
.collapse-content {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease-out,
              opacity 0.2s ease;
}

.collapse-content.expanded {
  max-height: 1000px; /* 足够大的值 */
  opacity: 1;
}
```

---

## 9. Toast 通知动画

```css
/* 进入 */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 退出 */
@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast {
  animation: slideInRight 0.3s ease-out;
}

.toast.hiding {
  animation: slideOutRight 0.3s ease-in forwards;
}
```

---

## 10. Modal 弹窗动画

```css
.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 11. 加载状态

### 11.1 按钮加载

```css
.btn.loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.btn.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### 11.2 骨架屏组件

```css
.skeleton-text {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 12. 动画性能优化

### 12.1 优先使用 transform 和 opacity

```css
/* ✅ 好：GPU 加速 */
.card:hover {
  transform: translateY(-4px);
  opacity: 0.9;
}

/* ❌ 差：触发重排 */
.card:hover {
  margin-top: -4px;
  background-color: newColor;
}
```

### 12.2 使用 will-change

```css
.animating-element {
  will-change: transform, opacity;
}
```

### 12.3 避免动画属性

| 属性 | 性能影响 |
|:-----|:---------|
| width/height | ❌ 触发重排 |
| margin/padding | ❌ 触发重排 |
| left/top/right/bottom | ❌ 触发重排 |
| transform | ✅ GPU 加速 |
| opacity | ✅ GPU 加速 |
| box-shadow | ⚠️ 慎用 |

---

**版本**：v1.0  
**更新日期**：2026-03-21
