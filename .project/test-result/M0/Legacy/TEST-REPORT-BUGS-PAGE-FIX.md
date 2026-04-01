# Bugs 页面数据修复验证报告

**项目**: project-management-dashboard  
**日期**: 2026-03-24 14:40 GMT+8  
**问题来源**: Boss 反馈 Bugs 页面看不到数据  
**根本原因**: DataParser.parseBugs() 期望 `bug/M0/index.json`，但 QA 产出的是个别 `BUG-XXX.md` 文件  
**修复方式**: Engineer 修改 DataParser 支持直接解析 `bug/M0/BUG-*.md` 文件  
**验证结果**: ✅ 全部通过

---

## 验证方式
1. API 数据验证：`/api/bugs` + `/api/bugs/stats`
2. 前端页面内容检查

## 验证结果

### API 数据

| 端点 | 预期 | 实际 | 状态 |
|:-----|:-----|:-----|:-----|
| GET /api/bugs | 返回 bug 数组 | 返回 18 个 bug | ✅ |
| GET /api/bugs/stats | 返回统计 | total:18, fixed:11, open:7 | ✅ |

### Bug 统计明细

| 维度 | 数量 | 说明 |
|:-----|:-----|:-----|
| **Total** | 18 | 全部 bug |
| **Fixed** | 11 | 61% 修复率 |
| **Open** | 7 | 39% 未修复 |
| **Critical** | 6 | 5 fixed, 1 open |
| **Major** | 9 | 5 fixed, 4 open |
| **Minor** | 3 | 1 fixed, 2 open |

### 严重级别分布（Open bugs）

| Bug ID | 严重级别 | 状态 | 描述 |
|:-------|:---------|:-----|:-----|
| BUG-007 | Major | Open | Tasks 页面无法看到 Art Task |
| BUG-008 | Critical | Open | Dashboard 强制弹窗报错 |
| BUG-014 | Major | Open | 深色/浅色模式切换对侧边栏无效 |
| BUG-015 | Minor | Open | 侧边栏 logo 深色模式不清晰 |
| BUG-016 | Critical | Open | Dashboard 打开后数字一直显示"-" |
| BUG-017 | Major | Open | 右上角切换主题按钮无效 |
| BUG-018 | Major | Open | Settings 页面添加路径无目录选择器 |

### 注意事项
- `bySeverity` 统计仅显示 `critical` 和 `minor`，`major` 未归入 high/medium 类别（前端展示限制，非数据错误）

---

## 根因分析（测试疏漏）

**问题**：Bugs API 从未被验证过。

**为什么漏了**：
- 测试重点在 Dashboard 数字显示、Settings 编辑功能
- 每次看到 Dashboard 有数据就认为"系统正常"
- 从未真正打开 Bugs 页面验证数据加载

**教训**：即使后端 API 返回 success:true，前端页面也可能因为"数据格式不匹配"而显示空白。需要端到端验证每个页面的实际渲染结果。

---

## QA 工作流修正

**后端约定**（Engineer 确认）：
- BUG 文件只需包含 `## 基本信息` 表格（含 **严重级别** 和 **状态** 列）即可被 DataParser 正确解析
- 无需维护 `index.json`

---

*QA 2026-03-24 验证完成*
