# 项目管理平台 - 需求文档

## 概述

本需求文档定义了 **项目管理平台**（Project Management Platform）的功能需求、用户体验要求和验收标准。

## 文档版本

**当前版本：v3.0** (2026-03-20)

## 文档结构

| 文档 | 描述 |
|:-----|:-----|
| [01-product-overview.md](./01-product-overview.md) | 产品定位、目标和用户价值 |
| [02-functional-req.md](./02-functional-req.md) | 功能需求详情（F1-F12） |
| [03-non-functional-req.md](./03-non-functional-req.md) | 性能、安全、兼容性等非功能需求 |
| [04-user-stories.md](./04-user-stories.md) | 用户故事 |
| [05-acceptance-criteria.md](./05-acceptance-criteria.md) | 验收标准 |
| [06-visual-ui-req.md](./06-visual-ui-req.md) | 视觉与 UI 需求（布局、色彩、组件） |
| [07-page-design.md](./07-page-design.md) | **页面功能设计**（Dashboard/Projects/Agents/Tasks/Versions/Documents/Bugs/Settings） |
| [changelog.md](./changelog.md) | 需求变更记录 |

## v3.0 新增/修复功能

### 核心视图（新增）

| 功能 | 描述 |
|:-----|:-----|
| Agent 任务视图 | 按 Agent 分组显示任务列表（waiting/in_progress/done） |
| 项目阶段进展视图 | 展示 Phase 0-8 时间线和当前阶段 |
| 测试详情视图 | 展示评审意见、Bug 统计、版本历史 |

### UI 修复

| 问题 | 解决方案 |
|:-----|:---------|
| 对话框弹出"加载失败" | 改为内联提示，不弹窗 |
| task 筛选后列表为空 | 修复筛选逻辑，显示"无匹配结果" |
| 添加路径不方便 | 优先调起系统目录选择对话框 |

### GitHub 需求澄清

- 项目管理系统**源码**提交 GitHub，打 v0.1.0 tag
- 不在 Dashboard 中集成 GitHub 管理功能

---

## v2.0 功能

### 深色/浅色模式切换
- 支持深色模式和浅色模式
- 主题偏好保存在本地存储
- 支持跟随系统深色模式偏好

### 多路径管理
- 支持添加多个项目目录路径
- 每个路径可设置别名和颜色标签
- 支持按路径筛选项目

---

## 数据源说明

平台数据来源于用户配置的多个项目路径（默认 `$PROJECTS_DIR`）：

| 数据类型 | 来源路径 | 说明 |
|:---------|:---------|:-----|
| 项目状态 | `<project>/.project/status.json` | 项目总体进展、当前阶段 |
| 任务 | `<project>/.project/tasks/` | Task 完成情况 |
| 测试结果 | `<project>/test-results/` 或 `<project>/test/` | 测试通过/失败情况 |
| Bug 列表 | `<project>/test-results/bugs/` 或 `<project>/bugs/` | Bug 追踪 |
| 评审意见 | `<project>/.project/reviews/` | 评审记录 |

---

## 软件开发阶段（Phase 0-8）

| Phase | 名称 |
|:------|:-----|
| 0 | 初始化 |
| 1 | 需求分析 |
| 2 | 设计 |
| 3 | 开发 |
| 4 | 测试 |
| 5 | 部署 |
| 6 | 维护 |
| 7 | 完成 |
| 8 | 已发布 |

---

*本文档由 Designer 编写，版本 v3.0*
