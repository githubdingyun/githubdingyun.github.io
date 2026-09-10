---
layout:     post
title:      "四种 AI 编程 Agent 的 Harness 对比：Codex、Claude Code、豆包、WorkBuddy"
subtitle:   "从形态、沙箱、权限、扩展机制拆解它们的编排层实现差异"
date:       2026-08-25
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - Harness
  - AI编程
  - Agent
  - Codex
  - Claude Code
---

## 前言

这两年 AI 编程助手从「补全代码」一路演进到「自主完成任务」的 Agent。大家讨论时往往盯着模型本身——谁的代码更强、谁更会推理，但真正决定一个 Agent 好不好用、稳不稳、安不安全的，其实是它下面的那一层：**Harness（编排 / 运行时层）**。

这篇不去比谁的模型分高，而是拆开四个产品的 Harness：**OpenAI Codex、Anthropic Claude Code、字节豆包（Trae）、微信 WorkBuddy**，对比它们在实现方式上的本质差异。

## 什么是 Harness

先对齐概念。一个 AI 编程 Agent 可以粗略分成两层：

- **模型（Brain）**：负责推理、规划、生成代码和工具调用，也就是大家熟悉的 GPT / Claude / 豆包等。
- **Harness（Body / 运行时）**：把模型"接进"真实世界的软件，负责：

| Harness 的职责 | 说明 |
| --- | --- |
| Agent 循环 | 模型 → 调用工具 → 拿到结果 → 再推理，如此往复 |
| 工具执行 | 真正去跑 shell 命令、改文件、搜代码、开浏览器 |
| 沙箱与权限 | 把模型的动作限制在安全边界内，必要时向人申请授权 |
| 上下文管理 | 管理对话历史、自动压缩、注入项目信息 |
| 扩展机制 | MCP、hooks、插件、Skills、SDK 等 |
| 多代理编排 | 子代理、并行、分层任务分解 |
| 项目约定 | 读取 `AGENTS.md` / `CLAUDE.md` 之类的仓库级指令 |

一句话：**模型决定上限，Harness 决定下限和形态**。同一个模型，套在 CLI 沙箱里和套在 IDE 里，体验与安全性可以完全不同。

---

## 一、OpenAI Codex：极简、透明、模型驱动

Codex 的 Harness 家族很完整，核心是开源参考实现 **Codex CLI**（Rust 编写，Apache-2.0），之上还有云代理（浏览器 / IDE 里的 cloud agent）、VS Code 扩展，以及给开发者自建 Harness 用的 **Codex SDK**（TypeScript / Python）。

**实现风格：把 Harness 做"薄"，把智能留给模型。**

- **沙箱隔离是重头戏**：macOS 上用 `seatbelt`（sandbox-exec），Linux 上用 `landlock` + `bubblewrap`，对文件系统和网络做系统级限制——这是它区别于"直接跑命令"的关键。
- **审批分级**：full-auto / auto / suggest / read-only 几档，还有面向 CI 的 non-interactive 模式，所以它能很自然地跑在无人值守环境里。
- **项目约定用 `AGENTS.md`**：和 Claude Code 的 `CLAUDE.md` 是同一思路的两种命名。
- **工具相对克制**：shell、`apply_patch`（结构化改文件）、读图、`web_search`，并支持 **MCP**。
- **模型接入开放**：主打 GPT Codex 系列，也支持本地模型（走 OpenAI 兼容接口，比如 Ollama）。

Codex 的哲学是**透明**：模型输出明确的工具调用，Harness 只是忠实地、安全地执行，尽量不"自作主张"加编排逻辑。这让它的行为可预测、可审计，但也意味着很多体验（自动拆任务、子代理调度）要靠模型本身的能力，而非 Harness 兜底。

## 二、Claude Code：最"框架化"的 Harness

如果说 Codex 是把 Harness 做薄，那 Claude Code 走的是相反方向——**把 Harness 做成一个可编程平台**。

- **Agent SDK（TS / Python）**：官方把 Agent 循环开放成 SDK，可以拿它搭自己的 Harness / agent。这是它和 Codex 最本质的分野：Codex 给你 CLI，Claude 给你"造 CLI 的积木"。
- **Subagents 子代理**：每个子代理有独立上下文、指令、工具集，用于分层任务分解，也是它控制上下文的关键手段。
- **Hooks 生命周期钩子**：`PreToolUse` / `PostToolUse` / `UserPromptSubmit` / `SessionStart` / `Stop` / `SubagentStop`……可以在工具执行前后插入任意校验逻辑，在企业落地里非常重要（强制 lint、阻止危险命令、审计日志）。
- **权限模型**：allow / deny / ask 规则 + 沙箱（Linux 用 bubblewrap / Landlock，macOS 用 Seatbelt）。
- **MCP 全栈支持**：既是 MCP client（能接大量工具），也能作为 MCP server 被别的系统调用。
- **`CLAUDE.md` + Skills + 斜杠命令 + 插件**：一套很完整的扩展生态。
- **上下文管理**：自动压缩 + 子代理下放，尽量保持主上下文精简。

Claude Code 的 Harness 更像一个**操作系统 / 框架**，把"编排"这一层显式暴露给你控制。代价是复杂度更高、概念更多（hooks、subagents、skills、plugins 都要学），但换来企业级可定制性与可治理性。

## 三、豆包（字节 Trae）：IDE 原生，编排藏在编辑器里

字节的编程 Agent 家族以 **Trae**（AI IDE，基于 VS Code 深度二次开发）和 **豆包 MarsCode**（插件 / CLI / Web）为代表，底层统一接豆包大模型。

**实现风格：IDE 即 Harness。**

- 和前两者最大的不同：它**没有把"沙箱里的无头 CLI"当主体**，而是把 Agent 直接做进 IDE。Agent 直接操作编辑器状态——标签页、diff 预览、内置终端、LSP 语言服务、调试器。
- **Plan-first 流程**：典型交互是"先出计划 / 改动预览，人确认后再执行"，很符合国内团队对"可控"的预期。
- **多文件编辑 + 终端控制 + 浏览器预览**：能力边界基本由 IDE 的能力决定，而非一套独立沙箱。
- 公开技术细节相对少，沙箱 / 权限的隔离模型不像 Codex、Claude Code 那样有大量开源文档可查；它更多依赖 IDE 自身的文件 / 进程边界 + 人工确认。

一句话：Codex / Claude Code 是把 Agent 塞进**终端和沙箱**，Trae 是把 Agent 塞进**编辑器**。后者的优势是开箱即用、所见即所得；代价是更"重"、更难嵌入 CI 或服务端无头场景。

## 四、微信 WorkBuddy：企业协作场景里的 Agent

WorkBuddy 是腾讯 / 微信生态里的 AI 编程与工作 Agent，定位偏向**企业微信（WeCom）/ 微信协作场景**，把"编程 Agent"和"企业内部工作流"绑在一起——比如在群里 @ 它，让它改代码、跑任务、生成汇报。

需要说明：**WorkBuddy 的 Harness 内部实现公开资料较少**（不像 Codex CLI、Claude Code 那样开源可审计），所以这一节只讲定位和可观察到的形态，细节以官方文档为准。

- **形态**：强绑定微信 / 企业微信入口，人机协作是"会话式 + 任务卡片"，而非传统 CLI。
- **与腾讯云的 AI 基础设施打通**：腾讯云有 **CodeBuddy**（AI 代码助手）这一支技术，WorkBuddy 更偏"企业工作 Agent"，两者在模型与工具能力上大概率共享底子。
- **权限与治理**：天然和企业微信的组织架构、权限、审批流结合——这是它和前三者最大的差异化，但也意味着它更"封闭"，不像开源 CLI 那样可随意改造或接入任意 MCP。

---

## 对比总表

| 维度 | Codex | Claude Code | 豆包 / Trae | WorkBuddy |
| --- | --- | --- | --- | --- |
| Harness 形态 | 开源 CLI + 云 + SDK | 原生 CLI + Agent SDK | AI IDE / 插件 | 微信 / 企业微信 Agent |
| 运行环境 | 沙箱（seatbelt / landlock / bwrap） | 沙箱 + 权限规则 | IDE 进程内 | 企业云托管 |
| 开源 / 可审计 | ✅ CLI 开源 | ✅ 核心能力开源（SDK） | ❌ 闭源 | ❌ 闭源 |
| 项目约定文件 | `AGENTS.md` | `CLAUDE.md` | IDE 配置为主 | 未知 / 少公开 |
| 扩展机制 | MCP、SDK | MCP、Hooks、Skills、插件、SDK | 插件生态（VS Code 系） | 企业集成 |
| 多代理编排 | 云任务并行、子代理 | Subagents（强） | IDE 内 agent 模式 | 任务卡片式 |
| 模型接入 | 开放（含本地模型） | 以 Claude 为主 | 豆包为主 | 腾讯模型为主 |
| 目标场景 | 终端 / CI / 云 | 终端 / 企业可定制 | 开发者桌面 IDE | 企业协作办公 |

## 五个关键维度的横评

**1. 沙箱隔离强度**
Codex 和 Claude Code 都做了真正的 OS 级沙箱（Seatbelt / Landlock / bubblewrap），这是"让 AI 随便改代码但不敢乱来"的底气。Trae 依赖 IDE 边界，WorkBuddy 依赖云端托管——隔离模型不同，前两者在这点上最透明、最可验证。

**2. 权限与治理**
Claude Code 的 hooks + allow / deny / ask 规则最细，几乎能定制出完整的合规审计流程；Codex 的审批分级更简洁。企业若要求"每次跑危险命令都要留痕、要审批"，Claude Code 的 Harness 目前最友好。

**3. 扩展性**
Claude Code 的 Agent SDK + MCP 全栈 + Hooks 最"开放"；Codex 靠 SDK + MCP 也能自建，但哲学上更克制。两者都远超闭源的 Trae / WorkBuddy。

**4. 上下文与多代理**
Claude Code 的 Subagents 是最成体系的多代理方案；Codex 走"模型自主 + 云任务并行"；Trae 在 IDE 里做 agent 模式；WorkBuddy 则是任务卡片。

**5. 形态哲学**
这是最根本的分野：

- **Codex**：薄 Harness，模型驱动，追求透明可审计。
- **Claude Code**：厚 Harness，平台化，追求可编程可治理。
- **Trae**：IDE 原生，追求开箱即用、所见即所得。
- **WorkBuddy**：协作原生，追求把 Agent 融进企业工作流。

## 选型建议

- 想要**开源、可审计、能进 CI**：Codex CLI。
- 想要**企业级定制、治理、合规审计**：Claude Code（配合 Agent SDK 自建）。
- 想要**桌面端开箱即用、改代码直观**：Trae。
- 想要**在微信 / 企业微信里让 Agent 干活、对接组织流程**：WorkBuddy。

## 结语

Harness 不是模型的"附属品"，而是决定一个 Agent 能不能真正落地到生产的关键。理解这四种实现方式的差异，比纠结"谁的模型又涨了几分"更有价值。

---

> ⚠️ 说明：本文基于写作时的已有知识整理，未做实时联网核验；其中 Trae 与 WorkBuddy 的内部实现细节公开资料有限，部分描述为基于可观察形态的推断，建议以官方文档为准。
