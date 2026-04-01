# Bug 报告 - BLOCKER-023

## 基本信息

| 项目 | 内容 |
|:-----|:-----|
| **Bug ID** | BLOCKER-023 |
| **严重级别** | Minor |
| **状态** | ✅ **FIXED & VERIFIED** |
| **发现时间** | 2026-03-24 |
| **Engineer 修复** | 2026-03-25 10:21 GMT+8 — commit 9308d96 |
| **验证时间** | 2026-03-25 10:21 GMT+8 |

---

## 修复内容

### 1. Agents 页面卡片间距
**问题**：`.agents-grid` 在 `main.css` 和 `agents.hbs` 两处定义，main.css 的 `gap: var(--space-lg)` 覆盖了 hbs 的 `gap: 20px`，导致间距 24px 而非 20px。

**修复**：`main.css` 中 `.agents-grid` 规则已删除，仅 `agents.hbs` 内联 `<style>` 保留 `gap: 20px` ✅

### 2. 工作负载图表 Y 轴
**修复**：`renderWorkloadChart()` 的 `options.scales.y` 添加 `suggestedMax = Math.ceil(maxTasks * 1.2)`，防止柱子溢出 ✅

---

*QA 2026-03-25 验证*
