# 会话学习笔记：SDD + Harness（2026-09-10）

> 本文件记录一次与 Claude Code 学习会话的核心结论，便于跨会话 / 跨机器保留。
> 放在 `_notes/` 目录（下划线开头，Jekyll 不会发布到博客）。可随时删改。

## 一、核心概念：三层模型

| 层 | 是什么 | 负责「什么」 | 谁控制 |
| --- | --- | --- | --- |
| SDD（spec） | 需求 / 规范 / 验收标准 | 做什么 | 人写 |
| 模型（Model） | 大脑，推理 + 生成代码 | 怎么想 | 厂商训练 |
| Harness（运行时） | 包裹模型的软件 | 怎么执行、怎么管 | 可配置 |

比喻：**model is the engine, harness is the chassis**（模型是发动机，Harness 是底盘）。

## 二、模型 ↔ Harness 对照

| 模型（发动机） | Harness（底盘） |
| --- | --- |
| ChatGPT（GPT / o 系列） | Codex |
| Claude | Claude Code |
| DeepSeek | 可被任意 harness 调用 |
| 豆包（Doubao） | Trae / 豆包 MarsCode |
| 腾讯模型 | WorkBuddy |

底盘可插拔发动机（Codex 可接本地模型；Cursor 可接 GPT / Claude / DeepSeek）。

## 三、Harness 的扩展机制

Hooks（生命周期拦截）、斜杠命令（Slash commands）、Skills（技能包）、MCP（外部工具）、Subagents（子代理）、CLAUDE.md（记忆，自动注入）。

## 四、本项目已落地的 Hooks

1. `.claude/hooks/delete-guard.js` — PreToolUse 删除护栏
   - 保护 `_posts/`、`_includes/posts/`
   - 删除需连续三次提醒，第四次放行
2. `.claude/hooks/test-on-edit.js` — PostToolUse 改码跑测试
   - 编辑代码文件后自动跑测试（博客项目无代码、处于休眠；Java 项目会自动探测 `mvn test`）

### Hook 底层机制（stdio 契约）

- stdin ← Claude Code 喂 JSON 事件
- stdout → 返回控制 JSON（`hookSpecificOutput`）
- exit code：`0` = 放行，`2` = 打断

### Hook 触发三件套

1. 脚本文件（实现 stdio 契约）
2. `settings.json` 注册（决定何时调）
3. `matcher`（匹配哪些工具 / 事件）

## 五、CLAUDE.md vs .claude/（别混）

- `CLAUDE.md` = 记忆 / 知识（自动注入上下文，模型能看到）
- `.claude/` = 配置（settings.json、hooks —— 配置行为，不注入上下文）
- 两者都支持用户级（`~/.claude/`）和项目级（`./`）

## 六、SpecKit / OpenSpec 用法

- 输入 = 斜杠命令（`/specify`、`/plan`、`/tasks`、`/implement`）
- 输出 = 工具生成的 spec.md / plan.md / tasks.md（**不是手写**）
- SpecKit 偏新建：`/specify 描述功能`
- OpenSpec 偏修改：`/openspec:proposal → /openspec:apply → /openspec:archive`（写增量 delta）
- 定位已有功能：靠**命名规范 + agent 搜索**（说「购物车」，它 grep specs/ 命中 shopping-cart；最稳是点名 + 给路径）

## 七、本项目关键约定

- 博客文章：标准 Jekyll 单文件 `_posts/YYYY/YYYY-MM-DD-slug.md`，不拆 en/zh
- Front matter：`layout: post`、`author: "LSG"`、`header-img: "img/home-bg.jpg"`、`catalog: true`、`tags`
- 详细见项目根 `CLAUDE.md`

## 八、容易混的点（踩坑记录）

1. 「Harness」不是「模型自带功能」，是包裹模型的运行时。
2. hook 是「强制规则」；模型默认的「改完自动跑测试」是「默认行为」，不是 hook。
3. 豆包是模型，Trae 是底盘。
4. spec 文档放 `CLAUDE.md`（自动加载），不配进 `settings.json`。
5. 光把脚本放进 `.claude/hooks/` 不够，必须在 `settings.json` 注册才会触发。
