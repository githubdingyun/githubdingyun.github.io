---
layout:     post
title:      "第 9 天：精读 sdd-harness——.ai/ 目录结构与 runtime-agnostic 思想"
subtitle:   "SDD+Harness 四周学习计划 · Week 2 · Day 9"
date:       2026-08-18
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - SDD
  - Harness
  - AI编程
---
> **SDD + Harness 四周学习计划 · Week 2 · Day 9（全计划第 9 课）**
>
> 今日主题：**精读 sdd-harness README**：.ai/ 目录结构（ROUTING / PRODUCT / CONTEXT / BACKLOG / adrs / commands / hooks / specs）；runtime-agnostic 思想
>
> 建议用时：60–90 分钟 ｜ 前置：Day 8 的四大护栏对照卡；本地已 clone `github.com/iMark21/sdd-harness`（Day 7 预习动作）
>
> 输出物：一张自己画的 `.ai/` 目录结构图 + 一句「runtime-agnostic 如何换 AI」的解释

---

## 0. 一句话剧透

昨天你在纸面上认识了四大护栏，今天去看一个**真实落地**：sdd-harness（`github.com/iMark21/sdd-harness`）——一个 **runtime-agnostic（与 AI 运行时无关）、零依赖（只要 bash + git）** 的 harness 实现。它的全部灵魂在一个 `.ai/` 目录里：ROUTING.md 是唯一入口，其余目录各司其职，根目录只留 5 行「指针文件」。

**最反直觉的一点**：这个 harness 不绑定任何 AI——换 Claude Code、换 Codex、换任何能读 Markdown 的 agent，都只是「换一个指针文件」的事。今天是 Day 10 安装、Day 11 命令循环的地基。

---

## 1. 今日目标（学完你能做到）

- [ ] 能画出 `.ai/` 目录结构图，并说出每个目录的职责与谁维护
- [ ] 能解释为什么 ROUTING.md 是「canonical 唯一入口」
- [ ] 能说出 ADR 0008 回答的问题：为什么用 `.ai/` 而不是 `.claude/`
- [ ] 能用一句话解释 runtime-agnostic：为什么换 AI 只是换指针文件
- [ ] 能说出 commands/ 里是哪七个流程文件、hooks/ 里是哪两个脚本
- [ ] 完成实操：画结构图 + 验证 Day 8 猜测清单

> 对应计划 Day 9 主题：**精读 sdd-harness README**。读完这篇，你对「harness 只是一堆仓库里的文件」会有实感。

---

## 2. 学习动线（建议时间分配）

| 步骤 | 内容 | 用时 |
|---|---|---|
| 1 | 打开本地 clone 的 sdd-harness，通读 README | 15 分钟 |
| 2 | 精读「4」：.ai/ 目录逐块拆解 | 20 分钟 |
| 3 | 精读「5」–「6」：根目录 bootloader + commands/hooks 预告 | 10 分钟 |
| 4 | 精读「7」–「8」：安装/分支/release 速览 + marvel-android 案例 | 10 分钟 |
| 5 | 实操「9」：画结构图 + 验证猜测清单 | 15–20 分钟 |
| 6 | 自测「10」+ 打卡 | 10 分钟 |

---

## 3. sdd-harness 是什么：runtime-agnostic、零依赖

**两个关键词，先钉死：**

- **runtime-agnostic（与运行时无关）**：harness 不假设你在用哪个 AI 工具。Claude Code、Codex、Gemini CLI，只要能读 Markdown、能执行命令，就能被这个 harness「驾驭」。它只管「流程和规则」，不管「模型是谁」。
- **零依赖**：整个 harness 只依赖 **bash + git**。不需要装 Python 包、不需要 Node 模块、不需要任何运行时。装进任何仓库都能跑。

这意味着：**harness 本质是仓库里的一组文件（规则 + 脚本），而不是一个常驻服务。** 这正好呼应 Day 12 要对比的另一个实现 harness-sdd 的口号——"model is the engine, harness is the chassis"（模型是引擎，harness 是底盘）：引擎可以换，底盘是固定的。

---

## 4. .ai/ 目录逐块精读

sdd-harness 的全部机制放在 `.ai/` 目录里。先看全貌，再逐个拆：

```
<你的仓库>/
├── CLAUDE.md          # 根目录指针文件（5 行，只重定向）
├── AGENTS.md          # 根目录指针文件（换 AI 时换这个）
└── .ai/
    ├── ROUTING.md     # canonical 唯一入口：AI 进项目先读它
    ├── PRODUCT.md     # 用户填写：产品是什么
    ├── CONTEXT.md     # 用户填写：项目上下文/现状
    ├── BACKLOG.md     # 用户填写：待办池（需求从这进）
    ├── BOOTSTRAP.md   # 引导文件
    ├── adrs/          # 架构决策记录（含 ADR 0008 runtime-agnostic）
    ├── agents/        # 子代理定义（含 spec-writer）
    ├── commands/      # 七个 Markdown 流程文件（Day 11 主角）
    ├── hooks/         # pre-commit-spec-check.sh + post-edit-trace.sh
    ├── notes/         # 笔记
    └── specs/         # spec 存放处（Day 13 实操的落点）
```

| 路径 | 内容 | 谁维护 | 作用 |
|---|---|---|---|
| `ROUTING.md` | **canonical 唯一入口** | harness 自带 | AI 进项目第一个读的文件，告诉它「本项目规则从哪看、下一步去哪」 |
| `PRODUCT.md` | 产品定位/目标 | **用户填写** | AI 理解「我们在做什么产品」 |
| `CONTEXT.md` | 项目现状/背景 | **用户填写** | AI 理解「现在项目到哪一步了」 |
| `BACKLOG.md` | 待办需求池 | **用户填写** | 需求的入口，故事从这里被取出 |
| `BOOTSTRAP.md` | 引导说明 | harness 自带 | 新环境/新 AI 初始化时读的引导 |
| `adrs/` | 架构决策记录（ADR） | 随决策追加 | 记「为什么这么定」。**ADR 0008 就是 runtime-agnostic 的决策记录，解释为什么用 `.ai/` 而不是 `.claude/`** |
| `agents/` | 子代理定义 | harness 自带 | 定义专门的小 AI（如 spec-writer）——对应护栏四「上下文隔离」 |
| `commands/` | 七个流程文件 | harness 自带 | spec/story/implement/verify/review/release/phase-close，Day 11 展开 |
| `hooks/` | 钩子脚本 | harness 自带 | pre-commit-spec-check.sh（拦）+ post-edit-trace.sh（记录），Day 10 体验 |
| `notes/` | 学习/过程笔记 | 用户 | 沉淀过程 |
| `specs/` | spec 文件 | 用户 + AI | **spec-first 的「spec」落在这里**，pre-commit hook 检查的就是它 |

**关键读法**：这张表里，`ROUTING.md` 是「地图」，`PRODUCT/CONTEXT/BACKLOG` 是「事实输入」（必须用户填，harness 不替你猜），`adrs/` 是「决策历史」，`commands/` + `hooks/` 是「机制」（流程与守门），`specs/` 是「契约存放处」。

> Day 8 猜测清单验证第一弹：**项目规则** → `ROUTING.md` 这个唯一入口 + 各规则文件；**事后验证** → `hooks/`；**上下文隔离** → `agents/`。你对了几条？

---

## 5. 根目录 5 行 bootloader：换 AI 只是换指针文件

README 里根目录的 `CLAUDE.md` / `AGENTS.md` 被设计成**极简的引导文件（约 5 行）**：它们不做任何实质规则定义，**只做一件事——重定向到 `.ai/ROUTING.md`**。

这个设计就是 runtime-agnostic 的落地方式：

```
# CLAUDE.md（示意，行数约 5 行）
本仓库的规则与流程全部在 .ai/ROUTING.md。
开始任何工作前，先读 .ai/ROUTING.md。
……
```

- 今天用 Claude Code → `CLAUDE.md` 把 AI 指到 `.ai/ROUTING.md`
- 明天换 Codex → 换成 `AGENTS.md`（或对应工具约定文件名）指到同一个 `.ai/ROUTING.md`
- **规则本体只写一份，在 `.ai/` 里**；换 AI 只是换「哪个指针文件在生效」

> 一句话：**AI 会变，`.ai/` 不变。** 换工具的成本从「迁移整套规则」降为「换一个指针文件」——这就是 runtime-agnostic 的实际收益。

---

## 6. commands/ 与 hooks/：先认识，Day 10/11 再用

精读时不用深钻这两个目录的内容，但要知道它们是什么、为什么存在：

- **`commands/`（七个 Markdown 流程文件）**：`spec` / `story` / `implement` / `verify` / `review` / `release` / `phase-close`。每个文件是一个「流程说明书」，**用法是「让 AI 遵循该文件」**——你（或 AI）按需把它喂给当前会话，AI 就按文件里的步骤走。每个文件内含 **Usage / Inputs / Procedure / Done criteria** 四块（用法/输入/步骤/完成标准）。这是 Day 11 的主角，今天只记名字和位置。
- **`hooks/`（两个脚本）**：
  - `pre-commit-spec-check.sh`——**守门钩子**：在特定分支上改了代码却没写 spec/ADR，提交被拦（Day 10 亲手体验）。
  - `post-edit-trace.sh`——**记录钩子**：提交后被动打印本次提交涉及了哪些 spec/ADR/代码，**不拦截**，只留证据。

> 对应 Day 8：hooks 就是护栏三「事后验证」的实体；commands 是把「流程」变成可反复执行的文件。

---

## 7. 安装、分支与 release 速览（Day 10 铺路）

README 里这几件事今天先混个脸熟，明天实操：

**安装（两种方式）**
- 一键脚本：
  `curl -sSL https://raw.githubusercontent.com/iMark21/sdd-harness/main/bootstrap.sh | bash -s -- --stack <stack>`
  `--stack` 可选：`python` / `swift` / `android` / `node` / `go` / `rust` / `generic`
- clone 后安装：`git clone https://github.com/iMark21/sdd-harness` → 运行 `install.sh` → 执行 `sdd-harness init`

**分支规范**
- 从 `develop` 切分支；分支名形如 `type/short-description`
- 合回 `develop` 用 **squash merge**（把一条分支的所有提交压成一个）
- `main` 只做发布，不做日常开发

**release 流程（SemVer）**
- `release/vX.Y.Z` → squash merge 到 `main` → 打 tag `vX.Y.Z` → back-merge 回 `develop`
- 版本号遵循 **SemVer（语义化版本）**

> 这些是 Day 11 命令循环里 `release` 与 `phase-close` 的上下文，今天记住「分支从 develop 切、squash merge、main 只发布、SemVer」四个要点即可。

---

## 8. 实测案例：marvel-android——冷启动也能被 harness 接住

README 里有一个真实案例：**marvel-android**，一个 2021 年的遗留仓库。把它交给 sdd-harness 冷启动，过程大致是：

1. 仓库很老、没人维护，README 里散落着 TODO
2. 冷启动时把这些 TODO **迁成 BACKLOG 条目**（进入 backlog 池）
3. 其中一条 **MAR-002 分页功能**，走通了 `spec → implement → verify` 的完整链路
4. 整个过程 **pre-commit hook 全程强制**——每个提交都被守门钩子检查

这个案例传达的信息：harness 不是只给新项目用的。**存量仓库、遗留代码，只要有 bash + git，也能把它接进 spec-first 流程。**（案例细节以 README 原文为准，本讲义只摘录已核验的骨架。）

---

## 9. 今日实操（约 20 分钟）

### 9.1 画 .ai/ 目录结构图（10 分钟）

合上讲义，打开你本地 clone 的 sdd-harness 仓库，`ls .ai/` 对照目录确实存在；然后**凭记忆**画一张结构图（ASCII 即可，不用追求美观），画完和第 4 节的图对比，标出漏掉的目录。

### 9.2 验证 Day 8 猜测清单（10 分钟）

拿出 Day 8 那张「护栏 → sdd-harness」猜测表，逐条对照今天学到的内容填「验证结果」：

| 护栏 | sdd-harness 的对应（答案） |
|---|---|
| 项目规则 | `ROUTING.md`（canonical 唯一入口）+ `CLAUDE.md`/`AGENTS.md` 指针 + `PRODUCT/CONTEXT` 等规则文件 |
| 前置规划与权限 | 本讲义待核验：sdd-harness 主要靠文件规则约束流程；权限分级属于 AI 工具侧能力（如 Plan Mode/Permission），harness 是否内置权限机制以 README 为准 |
| 事后验证 | `hooks/pre-commit-spec-check.sh`（拦截）+ `post-edit-trace.sh`（留痕） |
| 上下文隔离 | `agents/`（如 spec-writer 子代理） |

> 把这张表记进笔记。明天（Day 10）你会在自己的测试仓库里亲手装它、亲手被它拦一次。

---

## 自测题

1. sdd-harness 的两个核心属性是什么？（简答）
2. ROUTING.md 为什么是「canonical 唯一入口」？（简答）
3. ADR 0008 记录了什么决策？（简答）
4. `PRODUCT.md` / `CONTEXT.md` / `BACKLOG.md` 三者谁维护？不填会怎样？（简答）
5. commands/ 里的七个文件是哪七个？（填空）
6. hooks/ 里的两个脚本各自「拦」还是「记」？（简答）
7. 判断：sdd-harness 只能配合 Claude Code 使用。（判断）
8. 判断：根目录 CLAUDE.md 里写了本项目的全部详细规则。（判断——正确答案是「否」，它只重定向）
9. 选择题：换 AI 工具时，sdd-harness 场景下你主要改的是：
   A. 重写 .ai/ 全部内容　B. 换根目录指针文件　C. 换 hooks 脚本　D. 重装 git
10. 用一句话向同事解释「runtime-agnostic」。（简答）

> 提示：第 3 题——ADR 0008 回答「为什么用 `.ai/` 而不是 `.claude/`」；第 4 题——这三份是「用户填写」，harness 不替你猜产品是什么。

---

## 延伸阅读

- sdd-harness 仓库（今天的主精读对象，README 全文）：https://github.com/iMark21/sdd-harness
- 《SDD 和 Harness：AI 编程的两大支柱》（四大护栏与 harness 概念出处）：https://blog.csdn.net/qq_43284469/article/details/164267908
- 《SDD 规范驱动 + Harness：AI 全栈开发从「能跑」到「可控」》（harness 在工程化闭环中的位置，Week 3 精读，先存）：https://cloud.tencent.com/developer/article/2703349

---

*本工作纸依据《SDD+Harness四周学习计划.md》Day 9 主题编制。整理日期：2026-09-09*
