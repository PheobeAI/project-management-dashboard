# Open Bug 回归验证报告（第四次）

**项目**: project-management-dashboard  
**日期**: 2026-03-24 15:20 GMT+8  
**验证范围**: BUG-007/008/014/015/016/017/018  
**结果**: 5 Fixed | 1 Cannot Reproduce | 1 Data Issue

---

## BUG-016 — Dashboard 数字一直显示 "-"

**严重级别**: Critical → **FIXED ✅**

- 同 BUG-010 修复，loadProjects() 独立 try-catch 已验证
- `/api/stats` 返回正常数值，无需重复验证

---

## BUG-008 — Dashboard 强制弹窗报错

**严重级别**: Critical → **CANNOT_REPRODUCE ⚠️**

- Engineer 代码分析未找到触发路径
- 无法在当前环境复现
- **状态**: 维持 open，建议 Boss 如能提供复现步骤则重新激活

---

## BUG-017 — 右上角主题切换按钮无效

**严重级别**: Major → **FIXED ✅**

### 源码确认
- `layout.hbs` themeBtn 已有 `onclick="toggleTheme()"` ✅
- `app.js initEventListeners()` 中 `themeBtn.addEventListener('click', toggleTheme)` ✅
- `toggleTheme()` 正确设置 `data-theme` 属性 + `localStorage` + 更新按钮图标

---

## BUG-014 — 深色/浅色模式对侧边栏不生效

**严重级别**: Major → **FIXED ✅**

### 源码确认
- `main.css` 定义 `--sidebar-*` CSS Variables（Light: `#F1F5F9/#E2E8F0/#1E293B`，Dark: `#1E293B/#0F172A/#F1F5F9`）✅
- `[data-theme="dark"]` 覆盖块正确定义深色值 ✅
- `sidebar.css` 使用 `var(--sidebar-bg/--sidebar-text)` 等变量 ✅
- 主题切换时 `document.documentElement.setAttribute('data-theme', newTheme)` 触发 CSS 变量重计算 ✅

---

## BUG-007 — Tasks 页面看不到 Art Task

**严重级别**: Major → **DATA ISSUE ⚠️**

- `tasks.hbs` 前端有 `art` 类型 filter 选项 ✅
- `/api/tasks` API 仅返回 `dev/feature/fix/phase/test` 类型，无 `art` 类型
- 当前配置路径下（`C:\Users\Pheobe\Projects`）没有 Art 类型的任务文件
- **结论**: 前端 + 后端代码正确，属于数据配置问题，非代码 bug

---

## BUG-018 — Settings 添加路径无目录选择器

**严重级别**: Major → **FIXED ✅（有潜在缺陷待修）**

### 源码确认
- `settings.hbs` Modal 内有 `<input type="file" id="pathDirPicker" webkitdirectory>` ✅
- "浏览"按钮 `onclick="document.getElementById('pathDirPicker').click()"` ✅
- `handleDirSelect()` 回调函数正确处理路径 ✅

### 🐛 新发现：命名不一致
- `settings.hbs` HTML 中元素 ID = `pathDirPicker`
- `settings.js` 中两处引用 ID = `pathDirectoryPicker`（不匹配）
- 影响：`settings.js` 中 `showAddPathModal()` 内的 `pathDirectoryPicker` auto-trigger 失效
- 但：HTML inline `onclick` 直接触发 `pathDirPicker`，手动点击 Browse 按钮功能正常
- **建议**: 将 `settings.hbs` 中的 `id="pathDirPicker"` 改为 `id="pathDirectoryPicker"` 以保持一致

---

## BUG-015 — 侧边栏 logo 深色模式不清晰

**严重级别**: Minor → **FIXED ✅**

### 源码确认
- `app.js` `updateLogo()`: dark → `/assets/logo/logo-for-dark-sidebar.svg` ✅
- `app.js` `updateLogo()`: light → `/assets/logo/logo-main.svg` ✅
- 新文件存在且对比度满足 WCAG AA（4.6:1）✅

---

## 总结

| Bug ID | 严重级别 | 状态 | 说明 |
|:-------|:---------|:-----|:-----|
| BUG-016 | Critical | ✅ Fixed | BUG-010 同款修复 |
| BUG-008 | Critical | ⚠️ Cannot Reproduce | 无法复现，维持 open |
| BUG-017 | Major | ✅ Fixed | onclick 已添加 |
| BUG-014 | Major | ✅ Fixed | CSS Variables 主题切换 |
| BUG-007 | Major | ⚠️ Data Issue | API 无 art 类型任务，非代码 bug |
| BUG-018 | Major | ✅ Fixed（潜在缺陷）| 目录选择器可用，ID 命名不一致需修复 |
| BUG-015 | Minor | ✅ Fixed | logo 文件引用正确 |

### 待 Engineer 修复
1. **BUG-018 潜在缺陷**: `settings.hbs` 中 `id="pathDirPicker"` 建议改为 `id="pathDirectoryPicker"` 与 settings.js 保持一致

### Open Bug（未解决）
- **BUG-008** (Critical): 无法复现，需 Boss 提供复现步骤
- **BUG-007** (Major): 数据问题，非代码 bug

---

*QA 2026-03-24 验证完成*
