---
layout:     post
title:      "MCP、Hooks、插件、Skills、SDK：AI Agent 的五种扩展机制详解"
subtitle:   "各自是什么、挂在哪一层、怎么配、什么时候用哪个——附可跑的真实配置"
date:       2026-05-18
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - MCP
  - Claude Code
  - AI编程
  - Harness
---

## 0. 先给结论

模型本身只负责一件事：**想**。它要能用上外部能力、守住你的规矩、被你自己编排，就得靠这一圈的「扩展机制」。

这五个名字经常被并排提起，但它们**不在同一个层面**：

| 机制 | 一句话作用 | 属于哪一层 | 挂在哪 | 典型场景 |
|---|---|---|---|---|
| **MCP** | 把外部工具/数据源标准化，让模型能接进来 | 协议层（开放标准） | 工具调用入口 | 接数据库、GitHub、内部 API |
| **Hooks** | 在生命周期事件上插一段确定性脚本 | 产品机制 | 事件前后 | 阻止危险命令、改完自动跑测试 |
| **Skills** | 把某类专家经验打包成按需触发的能力 | 产品机制 | 上下文注入 | 「本项目怎么跑测试」 |
| **插件** | 把 commands / skills / hooks / agents / MCP 打成一包分发 | 产品机制 | 分发单元 | 团队统一一套配置 |
| **SDK** | 把 Agent 循环开放成库，自己造 | 代码层 | 你自己的程序 | 把 Agent 嵌进产品 |

一句话记法：

> **MCP 管「能接到什么」，Hooks 管「不许干什么」，Skills 管「该照什么干」，插件管「怎么发给别人」，SDK 管「我自己造一个」。**

---

## 1. 先分清：它们不在同一个层面

最容易犯的错，是把这五个当成并列的五个功能。它们其实分属**三个层面**：

- **协议层**：**MCP** —— 跨厂商的开放标准，管「模型怎么连上外部工具」
- **机制层**：**Hooks / Skills / 插件** —— 具体产品的扩展机制（本文以 Claude Code 为例）
- **代码层**：**SDK** —— 把整个 Agent 循环开放成编程库

![](/img/in-post/agent-extension-layers.svg)

| | MCP | Hooks / Skills / 插件 | SDK |
|---|---|---|---|
| 谁定的 | 开放协议，多厂商支持 | 某一家产品 | 某一家产品 |
| 换模型 / 换产品 | 大多数客户端都能用 | 基本要重写 | 要重写 |
| 你要写的东西 | 一个 MCP Server（或只写配置） | 配置文件 + 脚本 | 一段程序 |

> 划重点：**MCP 是「协议」，另外四个是「实现」。** 协议的价值正在于此——你今天给 Claude Code 接上的工具，换个客户端大概率还能用。

后面的顺序：先讲 MCP，再讲 Hooks、Skills，然后是**插件**——因为插件是前面几样的「打包盒」，得先知道盒子里装什么，才说得清它是什么。

---

## 2. MCP：把外部工具标准化

### 2.1 是什么

**MCP（Model Context Protocol）** 是一个开放协议，用统一的接口把「外部能力」标准化成 **MCP Server**；模型这一侧则是 **MCP Client**。

一个类比：**它是 AI 世界的 USB-C**。不管什么工具，插上就能用，不必为每个工具再写一套胶水代码。

### 2.2 解决什么：把 N×M 变成 N+M

没有 MCP 的时候，有 N 个模型、M 个工具，就得维护 N×M 套适配代码。有了 MCP，工具方实现一次 Server、模型方实现一次 Client，总量变成 **N+M**。

### 2.3 怎么用

先看传输方式，三种，但只有一个要记：

| 传输 | 说明 | 现状 |
|---|---|---|
| `stdio` | 把 Server 当本地子进程跑，默认方式 | 可用，本地开发首选 |
| `http` | Streamable HTTP，单个端点，支持会话与断点续传 | **新项目首选** |
| `sse` | 老式双端点长连接 | **已废弃，别再用** |

用命令行加一个 Server：

```bash
# 本地进程（stdio）
claude mcp add --transport stdio --env API_KEY=xxx my-server -- uv run python -m my_server

# 远程服务（http）
claude mcp add --transport http my-api https://api.example.com/mcp \
  --header "Authorization: Bearer $TOKEN"
```

> 两个容易踩的语法坑：**所有 flag 都要写在名字前面**；名字和启动命令之间用 `--` 分隔。

团队共享则写进项目根目录的 `.mcp.json`（这个文件可以提交到 git）：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["run", "python", "-m", "my_server"]
    }
  }
}
```

配置作用域有三个，同名时优先级 **local > project > user**：

| scope | 存在哪 | 团队可见 |
|---|---|---|
| `local`（默认） | `~/.claude.json`（按项目路径区分） | 否 |
| `project` | 项目根 `.mcp.json` | **是** |
| `user` | `~/.claude.json`（全局） | 否 |

> 密钥别硬编码进 `.mcp.json`。它支持 `${VAR}` 和 `${VAR:-默认值}` 展开，把 token 放环境变量里更安全。

### 2.4 一个要记住的命名细节

MCP 提供的工具，在客户端里显示成 **`mcp__<server>__<tool>`**。比如接了个 filesystem server，读文件的工具就叫 `mcp__filesystem__read_file`。

这个命名规则后面在 SDK 那一节还会出现一次，不是巧合。

### 2.5 什么时候用

要接的是**外部系统**（数据库、内部 API、SaaS），并且希望**换个客户端也能用**——那就上 MCP。

---

## 3. Hooks：确定性的生命周期门禁

### 3.1 是什么：先记住这句定性

Hooks 是挂在**生命周期事件**上的脚本。它和后面要讲的 Skills 有本质区别，先把这句话记住：

> **Hooks 是确定性的：由人写、由机器跑，不由模型「决定要不要做」。**

模型可能忘了，可能觉得没必要，Hooks 不会。所以它是**硬约束**——要让某件事**一定发生**，或者**一定不发生**，只有 Hooks 靠得住。

### 3.2 有哪些事件

| 事件 | 触发时机 | 常见用途 |
|---|---|---|
| `SessionStart` | 会话开始 / 恢复 / 清空 / 压缩后 | 初始化环境、注入上下文 |
| `UserPromptSubmit` | 用户提交提问时 | 校验或补充提示 |
| `PreToolUse` | **工具执行前** | 拦截危险命令 |
| `PostToolUse` | **工具成功执行后** | 格式化、跑测试、审计 |
| `PostToolUseFailure` | 工具失败后 | 记录失败、补提示 |
| `PermissionRequest` | 弹出权限确认框时 | 自动批准 / 拒绝 |
| `Stop` | 模型想结束本轮时 | 跑验收、阻止「假装完成」 |
| `SubagentStart` / `SubagentStop` | 子代理启动 / 结束时 | 汇总或检查子代理产出 |
| `PreCompact` | 上下文压缩前 | 抢救关键信息 |
| `SessionEnd` | 会话结束 | 清理、存档 |

> 特别留意 `Stop`：模型说「我做完了」的时候先跑一遍验证，不过就**不让它停**。这是治「AI 假装完成」最有效的一招。

### 3.3 怎么用：注册 + stdio 契约

分两步，**少哪一步都不生效**。

**第一步，在 `.claude/settings.json` 里注册。** 三层嵌套：事件 → 匹配器 → 处理器。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/delete-guard.js\""
          }
        ]
      }
    ]
  }
}
```

`matcher` 的匹配规则值得单独记一下：

- `"*"`、空串或省略 → 匹配**所有**
- 纯字母数字（`Bash`、`Edit|Write`、`Edit, Write`）→ **精确匹配**，可用 `|` 或 `,` 列多个
- **含其他字符 → 当成 JavaScript 正则**（不加锚点），比如 `^Notebook`、`mcp__github__.*`

**第二步，脚本遵守 stdio 契约。** 脚本从 **stdin 读一段 JSON**（含 `tool_name`、`tool_input`、`cwd`、`session_id` 等），从 **stdout 回一段 JSON** 表达决定，并用 **exit code** 表示结果：

| exit code | 含义 |
|---|---|
| `0` | 成功；stdout 里的 JSON 会被解析成结构化控制 |
| `2` | **阻断**；stderr 的内容作为消息回灌给模型 |
| 其他 | 非阻断错误，流程继续 |

`PreToolUse` 用 `hookSpecificOutput.permissionDecision` 表达 `allow` / `deny` / `ask`，还可以用 `updatedInput` 顺手改写工具参数：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "这条命令会删除博客文章，已拦截"
  }
}
```

### 3.4 例子 A（真实）：删除护栏

这个博客仓库里就有一个 `delete-guard.js`，挂在 `PreToolUse` + `Bash` 上，专门保护 `_posts/`。

它的逻辑很直白：

1. 从 stdin 读事件，只处理 `tool_name === "Bash"`
2. 判断命令是不是删除类（`git rm`、`rm`、`rmdir`、`Remove-Item`、`find -delete` …）
3. 从命令里提取路径，看是否碰到 `_posts` 或 `_includes/posts`
4. **连续三次说「不」，第四次才放行**——计数按目标路径持久化到本地状态文件

核心那一段：

```javascript
const count = typeof state[target] === 'number' ? state[target] : 0;

if (count >= MAX_REMINDERS) {
  // 已提醒满三次，第四次放行，并重置计数
  const next = { ...state };
  delete next[target];
  writeState(next);
  return emit('allow', `已连续提醒 ${MAX_REMINDERS} 次，本次放行删除：${target}`);
}
```

效果是：模型想删文章，**第一次就会被拦住**，并被告知「你正在尝试删除博客文章」。只有人明确说「确认删除」，翻过三次，才真的删掉。

> 这就是 Hooks 的意义：模型再自信，也**绕不过**它。护栏不在模型的判断里，在模型之外。

### 3.5 例子 B（真实）：改完代码自动跑测试

同一个仓库的 `test-on-edit.js`，挂在 `PostToolUse` + `Edit|Write|NotebookEdit` 上：

1. 只看代码文件（按后缀过滤，`.java` / `.py` / `.ts` …）
2. 解析要跑的测试命令，优先级：环境变量 `TEST_ON_EDIT_COMMAND` → `.claude/test-command` 配置 → **自动探测**
3. 自动探测的表很实用，搬到 Java 项目就会自动生效：

| 发现这个文件 | 就跑 |
|---|---|
| `pom.xml` | `mvn test -q` |
| `build.gradle` / `.kts` | `gradlew test` |
| `package.json` | `npm test` |
| `pyproject.toml` / `requirements.txt` | `pytest -q` |
| `go.mod` | `go test ./...` |
| `Cargo.toml` | `cargo test -q` |
| `Makefile` | `make test` |

测试通过 → 用 `additionalContext` 往上下文里塞一句「✅ 已自动运行测试并通过」；失败 → **`exit 2` 打断流程**，把失败输出回灌给模型去修。

![](/img/in-post/hook-lifecycle.svg)

### 3.6 两个坑

1. **光把脚本放进 `.claude/hooks/` 是不生效的**——必须在 `settings.json` 里注册。这是「我明明配了，怎么没用」的第一大原因。
2. **Hooks 是强约束，写不好会卡死自己。** 默认超时 60 秒，脚本要快（2 秒内为宜）、要 fail safe。嫌「每次编辑都跑全套测试」太吵，就把触发点从 `PostToolUse` 挪到 `Stop`，改成收尾时统一跑一次。

---

## 4. Skills：把专家经验打包成按需触发的能力

### 4.1 是什么

Skill 就是**一个文件夹，里面放一个 `SKILL.md`**：

```
.claude/skills/<name>/SKILL.md
```

front matter 关键的就两个字段：

```markdown
---
name: my-skill
description: 生成 Python 函数的单元测试。当用户要求写测试或想提高测试覆盖率时使用。
---

（正文：写过程步骤，不是写散文）
```

- **`name`**：必须和目录名一致；只能小写字母、数字、连字符；建议用名词（`web-scraper`，而不是 `scrape-web`）
- **`description`**：这是 Claude **判断该不该触发这个技能的唯一依据**。要写「做什么 + 什么时候用」，用第三人称，并且稍微「主动」一点——因为模型天然倾向于**该用的时候不用**

### 4.2 和「往 CLAUDE.md 里堆规则」的本质区别

| | CLAUDE.md | Skills |
|---|---|---|
| 加载时机 | **常驻**，每次会话都注入 | **按需**，命中才读 |
| 占用上下文 | 一直占着 | 平时不占 |
| 适合放什么 | 项目全局约束、约定 | 成体系的专项流程 |

背后机制叫**渐进式披露（progressive disclosure）**：平时只有 `name` 和 `description` 进上下文（就一两行），正文要等技能真的被激活才加载。

所以——**技能可以写得很长，却不拖累日常对话**。

> 这也是它比「什么都往 CLAUDE.md 里塞」高明的地方：CLAUDE.md 是「一直摆在你桌上」，Skills 是「需要时再去书架上拿」。

### 4.3 什么时候用

**高频、成体系、有步骤**的活儿——比如「本项目怎么跑测试」「按团队规范写 commit」「发版流程」。一次性的事不值得做成技能。

---

## 5. 插件：把扩展打包成一个可分发单元

### 5.1 是什么

前面讲的 Hooks、Skills，再加上 commands、agents、MCP 配置，全都是**散在你自己机器上**的。插件的作用就是把它们**打包成一个人可分发的东西**。

一个插件的目录长这样：

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json      # 清单：name / description / version
├── skills/              # <name>/SKILL.md
├── agents/              # 子代理定义
├── hooks/
│   └── hooks.json       # 生命周期钩子
└── .mcp.json            # MCP server 配置
```

### 5.2 怎么用

```bash
# 交互式
/plugin marketplace add owner/repo
/plugin install my-plugin@my-marketplace
/plugin install my-plugin --scope project

# 命令行
claude plugin init my-plugin --with skills hooks
claude --plugin-dir ./my-plugin     # 本地调试，不用先发布
```

marketplace 本身也是一个仓库，根目录放 `.claude-plugin/marketplace.json`，列出这里有哪些插件。安装时可以选作用域（`user` / `project` / `local`）：装到 `project` 就是提交进仓库、团队共享。

### 5.3 和 Skills 的区别（最容易混的一对）

> **Skills 是「能力单位」，插件是「分发单位」。**

一个插件里可以装好几个 Skills、Hooks、子代理。你写 Skill，是为了让 AI 会干某件事；你做插件，是为了**让别人一键装上你这一整套**。

### 5.4 什么时候用

**团队统一**（把项目规范打成插件，新人装一下就有），或者**对外发布**。

---

## 6. SDK：把 Agent 循环变成你的代码

### 6.1 是什么

Claude Agent SDK 把 Claude Code 里那一整套「Agent 循环」——调用模型、执行工具、管理上下文、跑子代理——**开放成编程库**：

- TypeScript：`@anthropic-ai/claude-agent-sdk`
- Python：`claude-agent-sdk`（需要 Python 3.10+）

> 它原来叫 "Claude Code SDK"，后来改名为 **Agent SDK**。这个改名本身就说明了定位：不只是给 Claude Code 写扩展，而是**用同一套能力造你自己的 agent**。

### 6.2 和「直接用模型 API」的区别

| | 模型 API | Agent SDK |
|---|---|---|
| 你拿到什么 | 一次 completion | 一个能自己循环、自己调工具的 agent |
| 工具循环 | 自己写 | 内置 |
| 上下文管理 | 自己管 | 内置 |
| 权限控制 | 没有 | 有（可配 permissionMode） |

一句话：**模型 API 给你发动机，Agent SDK 给你整台车。**

### 6.3 怎么用

最小可跑：

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="找出 auth.py 里的 bug 并修复",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
    ):
        print(message)

asyncio.run(main())
```

自定义工具的写法很值得注意——**它就是把你的函数包成一个「进程内的 MCP Server」**：

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("lookup_customer", "按 ID 查客户", {"customer_id": str})
async def lookup_customer(args):
    customer = await db.get(args["customer_id"])
    return {"content": [{"type": "text", "text": json.dumps(customer)}]}

server = create_sdk_mcp_server(name="my-tools", version="1.0.0", tools=[lookup_customer])
options = ClaudeAgentOptions(mcp_servers={"my-tools": server})
```

这个工具调用起来，名字是 `mcp__my-tools__lookup_customer`——**和前面 MCP 那一节的命名规则一模一样**。这不是巧合：SDK 把「你自己写的函数」和「外部 MCP Server」统一成了同一个抽象。

### 6.4 什么时候用

要把 Agent **嵌进自己的产品、或者某个后台任务**里，而不是在终端里对话。

### 6.5 和前四个的关系

> **前四个是在别人的 Harness 里做扩展，SDK 是自己造 Harness。**

---

## 7. 五者对比

| 机制 | 解决什么 | 谁写 / 谁触发 | 挂载点 | 分发方式 | 换产品的迁移成本 |
|---|---|---|---|---|---|
| **MCP** | 接外部能力 | 工具方写 Server / **模型主动调** | 工具调用入口 | 协议，跨产品通用 | 低 |
| **Hooks** | 加硬约束、做自动化 | 人写 / **事件自动触发** | 生命周期事件 | 配置 + 脚本 | 高（要重写） |
| **Skills** | 让 AI 按你的方法干活 | 人写 / **模型按需触发** | 上下文注入 | 一个文件夹 | 高 |
| **插件** | 分发一整套扩展 | 人写 / 安装即用 | 不是挂载点，是包装 | marketplace | 高 |
| **SDK** | 自己造 Agent | 人写程序 / 你的代码调 | 你自己的程序 | npm / pip | — |

### 四组最容易混的区别

**① MCP vs Hooks：都是「往外接」，接的东西不一样。**

- MCP 接的是**能力**——模型**主动决定**调不调
- Hooks 接的是**约束**——**自动执行，模型无权决定**

**② Skills vs 插件：能力单位 vs 分发单位。**

**③ Hooks vs Skills：硬约束 vs 软知识。**

- Hooks：「**一定**要跑测试」（不跑就不让你停）
- Skills：「**知道**怎么跑测试」（用不用，模型自己判断）

**④ 前四个 vs SDK：做扩展 vs 重造。**

![](/img/in-post/extension-decision.svg)

---

## 8. 怎么选：一段决策流

- 要接**外部系统**（数据库、内部 API、SaaS）→ **MCP**
- 要加**硬性规矩**，要求「一定发生 / 一定不发生」→ **Hooks**
- 要让 AI **按某套方法干活**，而且内容成体系 → **Skills**
- 要让**团队一键用上**你这一整套 → **插件**
- 要把 Agent **嵌进自己的产品** → **SDK**

一个真实的最小组合：**这个博客仓库自己就是「Hooks + CLAUDE.md」的实践**——CLAUDE.md 放项目约定（常驻），两个 hook 分别守住文章不被误删、代码改完自动跑测试（确定性）。

---

## 9. 常见混淆点

1. **CLAUDE.md ≠ Skills ≠ 记忆。** CLAUDE.md 是常驻的项目记忆；Skills 是按需加载的能力包；两者都不等于「对话记忆」。
2. **hook 脚本放对目录 ≠ 生效。** 必须在 `settings.json` 里注册，否则它就是个躺在磁盘上的死文件。
3. **MCP 是协议，不是工具。** 你接的是某个具体的 MCP Server；协议只规定「怎么说话」。
4. **插件 ≠ SDK。** 插件是给现有产品做扩展（装上去用），SDK 是拿积木自己造。
5. **五个里只有 MCP 是开放协议**，其余四个都是具体产品的机制——所以换产品时，只有 MCP 那部分大概率能原样带走。

---

## 10. 总结

一句话串起来：

> **MCP 让 Agent 能接到外部世界；Hooks 给它立下不可违抗的规矩；Skills 教它按你的方法做事；插件把这套东西打包发出去；SDK 让你自己造一个。**

它们不是五个并列的功能，而是**从「用别人的」到「造自己的」一条线**。理清这条线，以后再看到任何新工具的名字，都能立刻把它定位到某一层。

---

## 11. 术语速查卡

| 术语 | 一句话 |
|---|---|
| MCP | 开放协议，把外部工具标准化成 Server；工具名 `mcp__<server>__<tool>` |
| stdio / http / sse | MCP 三种传输；sse 已废弃，新项目用 http |
| `.mcp.json` | 项目级 MCP 配置，可提交 git 给团队共享，优先级 local > project > user |
| Hooks | 挂在生命周期事件上的确定性脚本，`exit 2` 阻断 |
| `matcher` | hook 的过滤器；非纯字母数字时按 JS 正则处理 |
| `PreToolUse` / `PostToolUse` | 工具执行前 / 成功后 |
| `Stop` | 模型想收工时触发，可以阻止它停 |
| Skills | `.claude/skills/<name>/SKILL.md`，靠 description 命中触发 |
| 渐进式披露 | 平时只加载 name + description，正文按需加载 |
| 插件 | 把 skills / hooks / agents / MCP 打包分发，清单在 `.claude-plugin/plugin.json` |
| marketplace | 插件目录，清单在 `.claude-plugin/marketplace.json` |
| Agent SDK | `@anthropic-ai/claude-agent-sdk` / `claude-agent-sdk` |
| `query()` | Agent SDK 的主入口，返回消息的异步生成器 |

---

## 12. 延伸阅读

- MCP 官方规范：<https://modelcontextprotocol.io>
- Claude Code 文档 · Hooks 参考：<https://code.claude.com/docs/en/hooks>
- Claude Code 文档 · 插件参考：<https://code.claude.com/docs/en/plugins-reference>
- Claude Code 文档 · Agent SDK：<https://code.claude.com/docs/en/agent-sdk/overview>

> 这几个接口都在快速演进（比如 MCP 的传输方式、SDK 的改名）。**以官方文档为准**——本文里的字段名和命令，都是按官方文档逐个核对过的，没有凭印象写。
