# 任务管理体系扩展方案

> 版本：v1.1
> 作者：Designer
> 日期：2026-03-24
> 状态：已评审，持续迭代

---

## Changelog

| 版本 | 日期 | 变更内容 |
|:-----|:-----|:---------|
| v1.0 | 2026-03-24 | 初稿发布 |
| v1.1 | 2026-03-24 | 评审反馈处理：新增 rejected 终态；明确 todo = 等待依赖；REV 改为 1:1 按对象拆；OPS 范围缩小到部署/CI/CD；优先级改为 P0/P1/P2；澄清 depends_on 填写规则和 revision 循环；新增 due_date 和 estimated_hours 字段 |

---

## 一、背景与目标

当前 `.project/task/` 主要覆盖 Art（ART-XXX）和 Developer 相关任务，QA、Design、Review 等业务环节缺乏统一的结构化跟踪机制。

本方案将 Task 扩展为**全业务覆盖**，通过统一的 Task 类型定义、标准状态机、显式依赖关系，实现：

- 所有关键业务环节（需求、设计、开发、测试、评审）都有可追踪的 Task
- 上游 Task 不完成，下游 Task 无法开始（强制执行依赖）
- 任何人都能通过 Task 状态一眼看清项目进度

---

## 二、Task 类型定义

### 2.1 类型总览

| 类型前缀 | 类型名称 | 负责人 | 典型交付物 |
|:---------|:---------|:-------|:-----------|
| `REQ-XXX` | Requirements Task | Designer | 需求文档、调研报告、PRD |
| `ART-XXX` | Art / Visual Design Task | Art | 视觉稿、UI 方案、风格指南 |
| `DEV-XXX` | Development Task | Engineer | 功能代码、API、集成实现 |
| `QA-XXX` | QA / Testing Task | QA | 测试计划、测试用例、测试报告 |
| `REV-XXX` | Review Task | 评审者（跨角色） | 评审结论（通过/需修订/拒绝） |
| `OPS-XXX` | Operations Task | Engineer / DevOps | **部署、配置变更、CI/CD 流水线** |

> **单 Bug 验证（Bug Fix Verification）不单独建 Task**，作为 DEV-XXX 任务内的验收环节处理。日常运维（监控、巡检）不纳入本体系。

### 2.2 任务粒度原则

**应建 Task 的场景**：
- 有明确交付物（文档、视觉稿、报告、代码 PR）
- 需要多角色协作或等待上游完成
- 有明确的完成标准

**不建 Task 的场景**：
- 日常沟通、同步会、周报
- 单个 Bug 的验证（已在 DEV-XXX 中覆盖）
- 纯个人手头的小操作（< 1 小时且无依赖）

### 2.3 REV Task 粒度原则

REV Task **按被评审对象拆，1:1 对应**，不按评审场次合并。

| 被评审对象 | REV Task | 说明 |
|:-----------|:---------|:-----|
| REQ-001 | REV-001 | 需求文档评审 |
| ART-002 | REV-002 | 视觉设计评审 |
| DEV-003 | REV-003 | 代码评审 |

### 2.4 Task 文件命名规范

```
task/M{N}/[TYPE]-[三位序号].md
```

示例：
- `task/M1/REQ-001.md` — M1 的需求调研任务
- `task/M1/ART-002.md` — M1 的视觉设计任务
- `task/M1/DEV-003.md` — M1 的开发任务
- `task/M1/QA-004.md` — M1 的全面测试任务
- `task/M1/REV-005.md` — M1 的综合评审任务

---

## 三、Task 状态机

### 3.1 统一状态定义

所有 Task 类型共享同一状态机，通过 **`task_status`** 字段标识：

| 状态值 | 含义 | 说明 |
|:-------|:-----|:-----|
| `todo` | 待开始 | **等待前置依赖满足**（depends_on 全部达到 approved/done），不是没人认领 |
| `in_progress` | 进行中 | 正在执行 |
| `in_review` | 评审中 | 交付物已提交，等待评审结论 |
| `revision` | 需修订 | 评审不通过，需返工 |
| `approved` | 已通过 | 评审通过，交付物达标（Work is done, awaiting formal sign-off） |
| `done` | 已完成 | 任务完全归档（包括收尾整理） |
| `rejected` | 已拒绝 | 评审结论为"拒绝"，任务终止，需重新规划 |

### 3.2 状态流转规则

```
[todo]
   │（前置依赖全部满足 → approved 或 done）
   ▼
[in_progress]
   │（提交交付物）
   ▼
[in_review]
   ├──→ [approved] ──────────────────→ [done]
   ├──→ [revision] ──→ [in_progress] → [in_review]（循环）
   └──→ [rejected] ─────────────────→ [done]（终止）
```

**revision 循环说明**：
当评审者给出"需修订"结论时：
1. REV Task 置为 `revision`
2. 被评审对象 Task 重新进入 `in_progress`
3. 修复完成后，被评审对象提交 → REV Task 回到 `in_review`
4. 循环直到最终 `approved` 或 `rejected`

### 3.3 done 和 approved 的区别

| 字段 | 含义 | 使用场景 |
|:-----|:-----|:---------|
| `approved` | 交付物达标，评审通过 | 有正式评审流程的 Task（REQ/ART/DEV/QA） |
| `done` | 任务完全归档，包括收尾 | 所有 Task；无评审 Task（OPS）可直接 done |

**规则**：
- 有评审的 Task：必须经过 `approved` 才能进入 `done`
- 无评审的 Task（OPS 类）：可直接 `done`
- REV Task：必须 `approved` 才可 `done`（强制评审闭环）

### 3.4 各类型 Review 强制规则

| Task 类型 | 评审门槛 | 评审者 |
|:---------|:---------|:-------|
| REQ | 必须评审通过才能进入 ART/DEV | PM 或 Boss |
| ART | 必须评审通过才能进入 DEV | PM + Boss（或指定审核者） |
| DEV | 代码评审 + PM 验收 | Engineer Lead + PM |
| QA | PM 验收测试报告完整性 | PM |
| OPS | 部署变更需 PM 验收 | PM |

---

## 四、Task 依赖关系设计

### 4.1 依赖表示方法

在每个 Task 的 `.md` 文件中，使用 **`depends_on`** 字段声明前置依赖：

```yaml
---
task_id: ART-002
type: ART
title: M1 视觉设计方案
assignee: art
depends_on:
  - REQ-001    # 需求文档完成后才能开始设计
task_status: todo
created_at: 2026-03-24
due_date: 2026-04-01
estimated_hours: 8
---
```

### 4.2 depends_on 填写规则（重要）

| 角色 | depends_on 填什么 | 说明 |
|:-----|:----------------|:-----|
| 被评审对象（REQ/ART/DEV/QA） | 填上游依赖（**不填 REV**） | DEV-003 完成后直接提交，不等 REV |
| REV Task | 填被评审对象 | REV-004 `depends_on: [DEV-003]` |
| 无评审 Task（OPS） | 填实际前置 | 部署任务依赖代码 PR approved |

> ⚠️ **陷阱**：被评审对象不要把 REV Task 放进 depends_on！REV Task 是被评审对象提交后才触发评审，两者依赖方向相反。

### 4.3 依赖规则

| 依赖类型 | 规则 | 示例 |
|:---------|:-----|:-----|
| 线性依赖 | A → B，下游必须等上游完成 | REQ-001 → ART-002 → DEV-003 |
| 并行依赖 | A 和 B 都完成后 C 才能开始 | REQ-001 **和** ART-002 → DEV-003 |
| 评审依赖 | 被评审 Task 先完成，REV Task 依赖它 | DEV-003（独立完成提交）→ REV-004（依赖 DEV-003）|

### 4.4 依赖校验机制

| 校验方式 | 说明 |
|:---------|:-----|
| **人工为主** | Task 负责人在变更状态前自行检查 depends_on 是否全部 approved/done |
| **系统辅助** | HEARTBEAT 巡检时检查状态变更是否违反依赖规则，并推送提醒 |
| **Review 把关** | 评审者检查被评审 Task 的依赖是否合理、完整 |

### 4.5 依赖关系图（含 revision 循环）

```
                    ┌──────────┐
                    │ REQ-001  │ approved
                    └────┬─────┘
                         │（线性依赖）
                         ▼
              ┌─────────────────┐
              │    ART-002      │
              │  视觉设计方案    │ approved
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          ▼                        ▼
   ┌─────────────┐          ┌─────────────┐
   │  DEV-003    │          │（其他并行    │
   │  开发实现   │          │   任务）     │
   └──────┬──────┘          └──────┬──────┘
          │                        │
          │（都完成后）             │
          └───────────┬────────────┘
                      ▼
              ┌─────────────┐
              │  in_review  │  ← DEV-003 提交
              │  等待评审   │
              └──────┬──────┘
                     │（REV Task 依赖 DEV-003）
                     ▼
              ┌─────────────┐
              │  REV-004   │ depends_on: [DEV-003]
              │  代码评审   │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   [approved]   [revision]   [rejected]
      │            │            │
      │            │（revision 循环）
      │            ▼            ▼
      │     ┌─────────────┐   [done]
      │     │ DEV-003    │   （终止）
      │     │ in_progress│
      │     └──────┬─────┘
      │            │
      │            └──→ [in_review] → ...
      │
      ▼
   [done]（继续下游 QA）
```

---

## 五、与 Milestone / Phase 流程的整合

### 5.1 整合原则

- **Milestone（M$N）是容器**：`task/M$N/` 目录下包含该 Milestone 所有类型的 Task
- **Phase（阶段）定义的是工作流顺序**：
  - Phase 1: Requirements → REQ Task
  - Phase 2: Visual Design → ART Task
  - Phase 3: Development → DEV Task
  - Phase 4: QA → QA Task
  - Phase 5: Review & Release → REV Task → done

- **Phase 和 Task 类型一一对应**，但不强制限死（某些 Milestone 可能跳过某类 Task）

### 5.2 Milestone 内 Task 清单管理

每个 Milestone 的 `.project/status.json` 新增 `task_index` 字段：

```json
{
  "milestone": "M1",
  "phase": "iterating",
  "task_index": {
    "REQ": ["REQ-001", "REQ-002"],
    "ART": ["ART-001"],
    "DEV": ["DEV-001", "DEV-002"],
    "QA": ["QA-001"],
    "REV": ["REV-001", "REV-002"]
  },
  "progress": {
    "total": 7,
    "done": 2,
    "pct": 29
  }
}
```

### 5.3 Task 与 Review-Designer.md 的关系

| 场景 | 谁负责写 Review | 依赖关系 |
|:-----|:----------------|:---------|
| Design Review（需求/设计评审）| Designer | REQ/ART → REV → Designer 收到反馈 |
| Art Review（美术资产评审）| **Designer（唯一审核者）** | ART → REV → 资产验收通过/需修订 |
| QA Review（测试报告评审）| PM | QA → REV → PM 验收测试报告 |
| 综合评审（Boss Acceptance）| PM | QA + 所有依赖完成 → PM 发起 |

### 5.4 各角色与 Task 类型的对应

| 角色 | 主要负责的 Task 类型 | 参与评审的 Task 类型 |
|:-----|:--------------------|:--------------------|
| Designer | REQ-XXX | ART-XXX 视觉评审 |
| Art | ART-XXX | — |
| Engineer | DEV-XXX、OPS-XXX | 代码评审（REV） |
| QA | QA-XXX | — |
| PM | 协调所有类型 | 所有类型的 Review |
| Boss | — | 最终验收、综合评审 |

---

## 六、Task 文件模板（更新版）

```markdown
---
task_id: REQ-001
type: REQ
title: [简洁标题]
description: [详细描述，why 做这件事]
assignee: designer
depends_on: []          # 前置依赖列表，不含 REV Task
task_status: todo        # todo | in_progress | in_review | revision | approved | done | rejected
priority: P0            # P0（最高）/ P1（重要）/ P2（普通）
created_at: 2026-03-24
due_date: 2026-04-01
estimated_hours: 8
---

## 交付物
-

## 完成标准
-

## 备注
-
```

---

## 七、迁移策略

### 7.1 现有 ART-XXX 任务
- 保持 `task_id` 不变，补全新增字段（`depends_on`、`description`、`priority`、`due_date`、`estimated_hours`）
- 状态映射：`todo` → `todo`，`in_progress` → `in_progress`，`art_done` → `in_review`，`approved` → `approved`，`done` → `done`

### 7.2 新增类型分阶段引入
1. **立即可用**：所有新建 Milestone 采用新类型定义
2. **存量兼容**：现有 `.project/task/` 中的 ART-XXX 不强制迁移，保持兼容

---

## 八、已关闭事项

| # | 问题 | 结论 |
|:--|:-----|:-----|
| 1 | REV Task 粒度 | **按被评审对象拆**，1:1 对应 |
| 2 | rejected 终止态 | **新增** `rejected` 状态作为终态 |
| 3 | todo 定义模糊 | **明确**：等待前置依赖满足，不是没人认领 |
| 4 | REV 依赖陷阱 | **澄清**：被评审对象不填 REV，REV Task 填被评审对象 |
| 5 | OPS-XXX 范围 | **缩小**为部署/CI/CD，日常运维不纳入 |
| 6 | 优先级字段 | **改为 P0/P1/P2** |
| 7 | 依赖自动通知 | **暂不加** |
| 8 | 谁校验 dependency | **人工为主**，HEARTBEAT 系统辅助提醒 |
| 9 | done vs approved | **不合并**，有评审 Task 必须 approved 才能 done |
| 10 | due_date / estimated_hours | **新增**这两个字段 |

---

*本文件为 v1.1 版本，已处理 PM 评审反馈。*
