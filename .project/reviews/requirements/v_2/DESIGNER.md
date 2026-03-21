# Designer 需求修订意见

**项目**：project-management-dashboard  
**评审人**：Designer  
**修订版本**：v3.0  
**日期**：2026-03-20

---

## 修订背景

Boss MVP 评审打回，指出以下问题：
1. 功能缺失：没有 Agent 任务视图、阶段进展视图、测试详情视图
2. UI 问题：弹窗体验差、筛选功能 bug、路径选择不方便
3. GitHub 需求理解错误

---

## v3.0 修订内容汇总

### 新增功能（3 项）

| 功能 | 描述 | 优先级 |
|:-----|:-----|:-------|
| F10 Agent 任务视图 | 按 Agent 分组显示任务列表（waiting/in_progress/done） | P0 |
| F11 项目阶段进展视图 | 展示 Phase 0-8 时间线和当前阶段 | P0 |
| F12 测试详情视图 | 展示评审意见、Bug 统计、版本历史 | P1 |

### UI 修复（3 项）

| 问题 | 解决方案 |
|:-----|:---------|
| 对话框"加载失败"弹窗 | 改为内联提示 |
| task 筛选后列表为空 | 修复筛选逻辑，显示"无匹配结果" |
| 添加路径不方便 | 优先调起系统目录选择对话框 |

### GitHub 需求澄清

- ~~在 Dashboard 中集成 GitHub 管理~~（错误理解）
- ✅ 项目**本身源码**提交 GitHub，打 v0.1.0 tag

---

## 修订文档列表

| 文档 | 修订内容 |
|:-----|:---------|
| 01-product-overview.md | 新增阶段定义、Agent 管理、术语表 |
| 02-functional-req.md | 新增 F10/F11/F12，UI 修复，GitHub 澄清 |
| 04-user-stories.md | 新增 US12-US17 |
| 05-acceptance-criteria.md | 新增验收条件 5.5-5.8 |
| 06-visual-ui-req.md | 新增视图设计 6.10-6.13 |
| changelog.md | 完整记录 v3.0 变更 |
| README.md | 更新 v3.0 功能说明 |

---

## 下一步

建议 Engineer 根据 v3.0 需求补充技术设计，然后重新实现 MVP。

---
