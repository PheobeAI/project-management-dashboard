# 测试策略

**项目**：project-management-dashboard  
**日期**：2026-03-20

---

## 1. 测试目标

确保项目管理仪表盘的各项功能按需运作，数据展示准确，用户体验流畅。

---

## 2. 测试范围

| 层级 | 测试内容 |
|:-----|:---------|
| 单元测试 | 工具函数、数据解析逻辑 |
| 集成测试 | API 端点、文件系统交互 |
| E2E 测试 | 关键用户路径 |

---

## 3. 测试用例

### 3.1 单元测试 (tests/basic/)

| 模块 | 测试场景 | 预期结果 |
|:-----|:---------|:---------|
| DataParser | 解析 valid status.json | 返回正确对象 |
| DataParser | 解析 missing status.json | 返回 null |
| DataParser | 解析 malformed JSON | 抛出错误 |
| DataParser | 计算 progress (3/5 done) | 返回 60% |
| Theme | toggleTheme() 切换到 dark | data-theme="dark" |
| Theme | 刷新页面 | 保持上次主题 |

### 3.2 集成测试

| 场景 | 测试步骤 | 验证点 |
|:-----|:---------|:-------|
| 项目列表 | GET /api/projects | 返回项目数组 |
| 路径管理 | POST /api/paths | 新路径生效 |
| 手动刷新 | POST /api/refresh | 数据更新 |
| 设置更新 | PUT /api/settings | 设置持久化 |

### 3.3 E2E 测试

| 用户故事 | 测试步骤 |
|:---------|:---------|
| US1 查看项目列表 | 访问首页 → 验证项目卡片显示 |
| US3 查看项目详情 | 点击卡片 → 验证详情页数据 |
| US8 自动刷新 | 开启自动刷新 → 验证数据更新 |

---

## 4. 测试数据

使用 `samples/` 目录下的示例项目：
- 完整 status.json
- 多种任务状态
- 测试结果文件

---

## 5. 工具

| 用途 | 工具 |
|:-----|:-----|
| 单元测试 | Vitest / Jest |
| E2E | Playwright / Cypress |
| 覆盖率 | Vitest coverage |

---

## 6. 通过标准

- 单元测试覆盖率 > 70%
- 所有 E2E 测试通过
- 手动验证 UI 符合设计稿
