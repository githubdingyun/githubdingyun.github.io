---
layout:     post
title:      "第 6 天：工具链——Spec-Kit 四命令与 delta spec 的增量之道"
subtitle:   "SDD+Harness 四周学习计划 · Week 1 · Day 6"
date:       2026-08-15
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - SDD
  - Harness
  - AI编程
---
> **SDD + Harness 四周学习计划 · Week 1 · Day 6（认知打底第 6 课）**
>
> 今日主题：**工具链**——Spec-Kit 四命令（/specify → /plan → /tasks → /implement）；delta spec 为何适合增量场景
>
> 建议用时：60–90 分钟 ｜ 参考：Day 2 精读的《SDD 和 Harness》工具部分 + 文末延伸阅读
>
> 输出物：一份「工具选型小结论」（Spec-Kit vs OpenSpec 你选哪个、为什么）+ 一个 delta spec 片段——前者是你 Day 7 周复盘的材料之一

---

## 0. 一句话剧透

Day 4 你学了 SDD 的**三种落地方式**，其中两种背后各有一套现成工具：**Spec-Kit**（自动化，AI 拆任务）和 **OpenSpec**（手动控制，增量规范）。今天把这两个工具拆开看：Spec-Kit 的四命令走一遍完整流程，再搞懂 OpenSpec 的 **delta spec** 为什么天生适合「改存量项目」。

> 记住 Day 4 的一句话：**Spec-Kit 让 AI 拆任务（快，但有误差），OpenSpec 让人拆任务（稳，但慢）。** 今天就是把这句话落到实处。

---

## 1. 今日目标（学完你能做到）

- [ ] 能背出 Spec-Kit 四命令的**顺序、输入、产物**（/specify → /plan → /tasks → /implement）
- [ ] 能说出 Spec-Kit 的「Constitution」和「持久化产物」各自解决什么问题
- [ ] 能讲清 Spec-Kit 的「两轮推断」风险出在哪一步
- [ ] 能说出 delta spec 的**四种标记**（ADDED / MODIFIED / REMOVED / RENAMED）和适用时刻
- [ ] 能用一句话回答：为什么 delta spec 适合增量/改造场景
- [ ] 完成实操：写一个 delta spec 片段 + 填一份工具选型小结论

> 对应计划 Day 6 主题：**工具链：Spec-Kit 四命令；delta spec 为何适合增量场景**。

---

## 2. 学习动线（建议时间分配）

| 步骤 | 内容 | 用时 |
|---|---|---|
| 1 | 精读「3」：Spec-Kit 三能力 + 四命令流程 + 完整小例 | 25 分钟 |
| 2 | 精读「4」：delta spec 机制（增量 vs 全量、四标记、提案结构） | 20 分钟 |
| 3 | 精读「5」：工具选型对比表 + 一句话选择 | 10 分钟 |
| 4 | 实操「6」：写 delta spec 片段 + 填选型结论 | 15–25 分钟 |
| 5 | 自测「7」+ 打卡 | 10 分钟 |

---

## 3. Spec-Kit：GitHub 官方的自动化 SDD 工具

### 3.1 它解决什么问题

Spec-Kit 是 GitHub 官方开源的 SDD 工具包（仓库：`github.com/github/spec-kit`）。它解决 AI 辅助开发中的一个基本挑战：**在和编程助手的多次交互中，上下文与一致性不断丢失。** 它靠三个设计来对抗：

| 设计 | 解决什么 |
|---|---|
| **持久化产物** | 规范、计划、任务以 Markdown 文件存进仓库（如 `specs/`），与代码一起版本管理——对话断了、换人了、换 AI 了，上下文都在 |
| **标准化工作流** | 定义死四个阶段：规范 → 计划 → 任务分解 → 实现，每一步都产出固定形态的文档，流程可复制 |
| **Constitution（宪法）** | 一份团队级规范文件，约束 AI 生成代码的风格、质量与架构，让它和团队标准一致，而不是自由发挥 |

### 3.2 四命令流程（今天的主角）

> 计划文档以 `/specify → /plan → /tasks → /implement` 称呼；官方完整调用带 `speckit` 前缀（如 `/speckit.specify`），下文两处写全，便于你查文档时对得上。

| 阶段 | 命令 | 输入 | 产出 | 这一步在问什么 |
|---|---|---|---|---|
| 1 | `/specify` | 粗略需求 | `spec.md` | 「什么」和「为什么」——动机与功能需求，**明确排除技术决策** |
| 2 | `/plan` | spec | `plan.md` | 「如何」——技术栈、框架、数据库、架构；附数据契约与研究结论 |
| 3 | `/tasks` | plan | `tasks.md` | 拆成可执行任务——依赖关系、可并行项、TDD 结构、验收标准 |
| 4 | `/implement` | tasks | 实现代码 | 逐条执行——验证前置条件 → 按序实现 → 测试 → 进度跟踪 |

**四步的因果链**：spec 管「做什么」，plan 管「怎么做」，tasks 管「谁先做」，implement 只管「照着做」。**前面任何一步写得含糊，后面 AI 就会在那一步替你猜。**

### 3.3 一个完整小例（登录功能）

```
需求："帮我加个登录功能"（这就是你 Day 5 之前会写的需求——危险）
→ /specify   产出 spec.md：
              目标=邮箱+密码登录；验收=登录成功返回 token、失败返回明确错误码
→ /plan      产出 plan.md：
              验证码存 Redis，JWT 用 jjwt 库，接口 POST /api/auth/login
→ /tasks     产出 tasks.md：
              T1 建用户表 → T2 写登录接口 → T3 写鉴权中间件 → T4 写测试…
→ /implement 按任务逐条实现，自动写代码、跑测试、报进度
```

注意：**「验证码存 Redis」这种 HOW 只出现在 plan.md，不污染 spec.md**——这正是 Day 5 你清扫 HOW 的原因：spec 保持技术无关，plan 才接技术方案。

### 3.4 优点与局限

**优点**：流程完整、产物可审查可回退；适合新手练手、中等复杂度、探索性开发和团队对齐。「先把流程跑起来」是它的核心价值。

**局限（关键）**：AI 要经历「拆任务 → 执行任务」**两轮推断**，每一轮都可能带误差。拆任务时就错了，后面执行得再努力，也是在错误方向上努力——等你 review 一大堆代码才发现最前面的任务拆错了，返工成本很高。所以**高风险场景不要裸用 Spec-Kit**。

---

## 4. delta spec：为什么增量规范适合改造场景

### 4.1 全量 vs 增量

传统规范要求**描述整个系统的行为**——系统有 100 个 API，改 1 个也要把 100 个都讲一遍，成本高、评审难、易冲突。而 **delta spec（增量规范）只记录本次变更涉及的部分**：100 个 API 只改 1 个，就只写这 1 个的变化。这是 OpenSpec（官网 openspec.dev）的核心机制。

### 4.2 四种标记

delta spec 用四个标题标明「这次改了什么」：

| 标记 | 含义 | 什么时候用 |
|---|---|---|
| `## ADDED Requirements` | 新增能力 | 加接口、加字段、加行为 |
| `## MODIFIED Requirements` | 行为变化（需含完整更新后的文本） | 改接口语义、改校验规则 |
| `## REMOVED Requirements` | 废弃功能 | 下线接口、删字段 |
| `## RENAMED Requirements` | 重命名 | 改概念名、改 API 名 |

### 4.3 一个变更提案的制品

OpenSpec 里每次变更是一个「变更提案」，目录结构大致如下：

```
change-proposals/
└── <变更名>/
    ├── proposal.md        # 变更的初衷和范围（为什么做、做什么）
    ├── specs/             # delta specs（按域组织，只描述行为变化）
    ├── design.md          # 技术设计方案（怎么做、具体步骤）
    ├── tasks.md           # 实施检查清单
    └── .openspec.yaml     # 变更元数据
```

> 4 个制品对应 4 个问题：**为什么（proposal）→ 变什么（specs）→ 怎么做（design）→ 做没做（tasks）。**

### 4.4 为什么 delta spec 天生适合增量 / 改造 / 开源贡献

| 优势 | 说明 |
|---|---|
| **不重写全量** | 主规范保持稳定，改动成本低 |
| **评审聚焦差异** | 审查者只看「这次改了什么」，不用在 100 个 API 里找那 1 个变化 |
| **变更意图明确** | proposal 记录初衷，人和 AI 都有据可查 |
| **协作冲突少** | 变更互不覆盖主规范，多人并行改动更安全 |

> 最关键的一句：**对已有项目，改错一个已有功能，比没做新功能更严重。** delta spec 把「改哪里、改成什么样、影响谁」钉死，正是为这个场景设计的。

---

## 5. 工具选型：Spec-Kit vs OpenSpec

| 维度 | Spec-Kit | OpenSpec |
|---|---|---|
| 控制方式 | 自动化：AI 拆任务 + AI 执行 | 手动：人写 spec/拆任务，AI 只执行 |
| AI 推断轮数 | 两轮（拆 + 执行），误差可叠加 | 一轮（只执行），判断权在人 |
| 任务粒度 | 偏大（功能级） | 中等（子功能级），每个任务后立即 review |
| 发现错误时机 | 最后 review 代码时 | 每个任务完成后 |
| 适合场景 | 新手、中等复杂度、快速试错、团队对齐 | 关键路径、存量改造、团队协作 |
| 增量/改造支持 | 弱（直接改主规范，易冲突） | 强（delta spec 天然为增量设计） |

**一句话选择**：探索性、快速试错用 Spec-Kit；关键路径、存量项目改造用 OpenSpec。**成熟工程师两种都会，按场景切换——这不是信仰之争。**

---

## 6. 今日实操（约 25 分钟）

### 6.1 写一个 delta spec 片段（15 分钟）

任选一个你熟悉的小系统（todo、笔记、订单都行），用 delta spec 格式写「给某个已有接口新增一个能力」：

```
# Delta for <你的域>
## ADDED Requirements
### Requirement: <新增能力名>
<新增的行为描述>
#### Scenario: <场景名>
- GIVEN <初始状态>
- WHEN <动作>
- THEN <预期结果 + 数字>

## MODIFIED Requirements
### Requirement: <要改的已有行为名>
（此前）<原行为>
（改为）<新行为>
```

> 写完后自检三问：① 只写了「这次改了什么」吗？② 每条 Scenario 有 GIVEN/WHEN/THEN 吗？③ 新增和修改分清楚了吗？

### 6.2 填一份工具选型小结论（10 分钟）

```
我的场景：______
我选：□ Spec-Kit  □ OpenSpec  □ 都用（分场景）
理由（必须写，不能只打勾）：______
```

> 这份小结论连同 Day 5 的 spec，就是你 Day 7 周复盘的输入材料。

---

## 7. 自测题

1. Spec-Kit 四命令的顺序和各自产物是什么？
2. Constitution（宪法）解决什么问题？
3. 为什么说 Spec-Kit 存在「两轮推断」风险？误差可能在哪一步引入？
4. delta spec 的四种标记是什么？各自什么时候用？
5. 系统有 100 个 API，本次只改 1 个——用全量 spec 和 delta spec 各自的代价是什么？
6. 你的项目是已有系统的关键模块改造，选 Spec-Kit 还是 OpenSpec？为什么？

---

## 附录 A：delta spec 完整示例（登录限流，参考写法）

```
# Delta for Auth
## ADDED Requirements
### Requirement: 登录失败限流
同一 IP 每分钟最多 10 次失败尝试，超过后返回 429。
#### Scenario: 连续失败 11 次
- GIVEN 已注册用户
- WHEN 1 分钟内连续提交 11 次错误密码
- THEN 第 11 次请求返回 429，提示"尝试过于频繁，请 1 分钟后再试"

## MODIFIED Requirements
### Requirement: 登录成功响应
（此前）登录成功仅返回 token
（改为）登录成功返回 token 与用户基础信息
```

---

## 延伸阅读

- GitHub Spec Kit 实战全流程（拆解 3 种错误）：https://juejin.cn/post/7666700111078768655
- Claude 结合 spec-kit 使用指南（命令时机表）：https://juejin.cn/post/7615577562702577664
- OpenSpec 深度指南：Delta Specs 机制：https://blog.csdn.net/qq_25112523/article/details/162766340
- OpenSpec 官方术语表（Delta spec 定义）：https://openspec.dev/docs/glossary
- OpenSpec 最佳实战：3 个命令 + Delta Specs：https://cloud.tencent.com/developer/article/2660452

---

*本工作纸依据《SDD+Harness四周学习计划.md》Day 6 主题编制。整理日期：2026-09-09*
