---
layout:     post
title:      "第 13 天：实操——跑通 spec-first 提交三态（放行 / 拦截 / 显式例外）"
subtitle:   "SDD+Harness 四周学习计划 · Week 2 · Day 13"
date:       2026-08-22
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - SDD
  - Harness
  - AI编程
---
> **SDD + Harness 四周学习计划 · Week 2 · Day 13（全计划第 13 课）**
>
> 今日主题：**实操：跑通 spec-first 提交**——写 spec 与代码一起提交（放行）；只改代码（拦截）；SH_SDD_SKIP 显式例外
>
> 建议用时：90 分钟 ｜ 前置：Day 7 的 spec v2（`Day5-spec-<功能名>-v2.md`）+ Day 10 装好的 harness 测试仓库
>
> 输出物：三态实测记录（放行 / 拦截 / SH_SDD_SKIP 各一条 git 记录）+ 一张 hook 判定流程图

---

## 0. 一句话剧透

Day 10 你只被拦了一次，今天是**把 spec-first 的三种命运全部亲手跑一遍**：

1. **放行**：spec 与代码一起提交 → hook 放行；
2. **拦截**：只改代码、不碰 spec/ADR → hook 拦截；
3. **显式例外**：`SH_SDD_SKIP=1` → 明确声明跳过 → 放行（shell 历史留痕）。

而且——**测试素材是你的 spec v2**。Day 7 你复查修订出的那份 `Day5-spec-<功能名>-v2.md`，今天正式进入 `.ai/specs/`，成为你的第一份「被 harness 认可」的 spec。**Week 1 的契约，Week 2 的守门，今天接上了。**

---

## 1. 今日目标（学完你能做到）

- [ ] 能把 Day 7 的 spec v2 作为素材带进测试仓库的 `.ai/specs/`
- [ ] 能在 `feat/*` 分支上复现「spec + 代码一起提交 → 放行」
- [ ] 能在 `feat/*` 分支上复现「只改代码 → 拦截」
- [ ] 能说出 `SH_SDD_SKIP=1` 的用途、用法，以及它和「豁免分支」的区别
- [ ] 能画出一张 hook 判定流程图（分支类型 × 是否动 spec/ADR × 是否跳过）
- [ ] 完成三态实测记录（放行/拦截/例外 各留一条可回看的 git 痕迹）

> 对应计划 Day 13 主题：**实操：跑通 spec-first 提交**。这是 Week 2 的验收日——计划评估标准第 3 条「能跑通 spec-first 提交」今天落地。

---

## 2. 学习动线（时间盒）

| 步骤 | 内容 | 用时 |
|---|---|---|
| 1 | 素材准备：把 spec v2 带进 `.ai/specs/` | 10 分钟 |
| 2 | 精读「3」：spec-first 判定逻辑回顾 | 10 分钟 |
| 3 | 实操一：放行（spec+代码一起提交） | 20 分钟 |
| 4 | 实操二：拦截（只改代码） | 15 分钟 |
| 5 | 实操三：SH_SDD_SKIP 显式例外 | 15 分钟 |
| 6 | 画判定流程图 + 写三态记录 + 打卡 | 20 分钟 |

> 时间盒含「卡住排查」的余量。如果某一步结果和预期不符，先对照第 8 节的排查表，不要直接跳过。

---

## 3. spec-first 判定逻辑回顾（Day 10 规则 + Day 11 流程）

pre-commit hook（`pre-commit-spec-check.sh`）的判定，可以画成一张流程：

```
git commit 触发 pre-commit hook
    │
    ├─ 当前分支是 chore/* | docs/* | fix/* | hotfix/* ？──是→ 豁免，放行
    │
    ├─ 设了 SH_SDD_SKIP=1 ？──────────────────────是→ 显式例外，放行（shell 历史留痕）
    │
    ├─ 本次提交动了 .ai/specs/ 或 .ai/adrs/ ？────是→ 放行（spec-first 成立）
    │
    └─ 否则（feat/feature 分支 + 只改了代码）──→ 拦截，提交被拒
```

三个要点（已核验）：

1. 检查对象是「**有没有碰 spec/ADR**」，不是「spec 质量」——质量靠 Day 11 的 review 环节。
2. **豁免是「分支性质」**（这类分支永不检查），**SH_SDD_SKIP 是「单次声明」**（这次提交我明确跳过）。
3. `SH_SDD_SKIP=1` 会**在 shell 历史留痕**——显式例外不是偷偷绕行，是「留了证据的例外」。

---

## 4. 素材准备：把 spec v2 带进 .ai/specs/

### 4.1 确认你的 spec v2 存在

Day 7 的输出物是 `Day5-spec-<功能名>-v2.md`（在你的学习目录/工作目录里，文件名以你当时另存的名字为准）。**如果你还没产出 spec v2，用 Day 5 的 v1 或任意一份七要素齐全的 spec 代替，并在记录里注明「本轮使用 v1，v2 待补」。**

> 目录里没有现成 spec 文件的说明：本讲义假设你按 Day 5/7 的指引已经产出了这份文件——它是你自己的产物，不在讲义目录里。找不到就现场写一份最小的（目标 + 2 条 Given-When-Then 验收即可），不要卡住。

### 4.2 带进测试仓库

```bash
cd harness-test
git checkout develop 2>/dev/null || git checkout -b develop
git checkout -b feat/spec-first-demo

# 把 spec v2 复制进 .ai/specs/（文件名建议保留可追溯性）
mkdir -p .ai/specs
cp "/你的路径/Day5-spec-<功能名>-v2.md" .ai/specs/
```

> spec 放进 `.ai/specs/`，这是 hook 检查的路径之一（另一个是 `.ai/adrs/`）。**这一步本身就是「spec-first」的动作**——先让 spec 进入版本库的视野。

---

## 5. 实操一：放行——spec 与代码一起提交

在同一笔提交里，既有 spec（碰了 `.ai/specs/`），又有代码改动：

```bash
# 改代码（示例：往 app.py 加一行）
echo "print('feature from spec v2')" >> app.py

# 一起暂存、一起提交
git add .ai/specs/ app.py
git commit -m "feat: 实现 <功能名>（spec v2 与代码同提交）"
```

**预期**：提交成功。hook 判定——feat 分支 + 动了 `.ai/specs/` → 放行。

**验证**：

```bash
git log --oneline -1
# 应看到这条 feat 提交
git show --stat HEAD
# 应同时看到 .ai/specs/Day5-spec-<功能名>-v2.md 与 app.py
```

> 这就是 **spec-first 的「正命」**：契约与实现一起进历史，谁来看都知道「这个功能是照哪份 spec 做的」。观察终端里 post-commit hook 的输出——它会把本次提交涉及的 spec/代码打印出来（记录员上线）。

---

## 6. 实操二：拦截——只改代码

**继续留在 `feat/spec-first-demo` 分支**（关键：feat 分支才会被拦，这正好复现 Day 10）：

```bash
# 只改代码，绝不碰 .ai/specs/ 与 .ai/adrs/
echo "print('second change without spec')" >> app.py
git add app.py
git commit -m "feat: 调整输出（未写 spec）"
```

**预期**：提交被拒。hook 判定——feat 分支 + 改了代码 + 没动 spec/ADR → 拦截。

**验证**：

```bash
git log --oneline -1
# 仍停留在上一条「放行」提交，这条被拒的提交不存在
git status
# app.py 的改动还在（暂存区或工作区），没有丢失
```

把终端输出的**拒绝信息**原样复制进三态记录。

> 拦截的意义再强调一次：**不是不让你改代码，是要求你「先有契约再动实现」。** 被拦后正确的出路是补 spec（或明确这是无需 spec 的改动——见下一态），而不是偷偷绕过。

---

## 7. 实操三：SH_SDD_SKIP 显式例外

有些改动确实不需要 spec（比如临时调试、纯格式微调、被豁免分支之外的边缘场景）。sdd-harness 给的显式出口是环境变量：

```bash
# 仍留在 feat/spec-first-demo 分支，只改代码
echo "print('debug temp')" >> app.py
git add app.py
SH_SDD_SKIP=1 git commit -m "temp: 调试用临时改动（显式跳过 spec 检查）"
```

**预期**：提交成功（放行），且**shell 历史留痕**——`SH_SDD_SKIP=1` 会出现在你的 shell 历史里，事后可追溯「这次是显式跳过」。

**验证**：

```bash
git log --oneline -1   # 看到这条 temp 提交
# 在支持 history 的 shell 里查看：
history | grep SH_SDD_SKIP   # 或按你的 shell 习惯检索，应能查到这条命令
```

**对比记忆**：

| 方式 | 谁说了算 | 是否留痕 | 适用 |
|---|---|---|---|
| 豁免分支（fix/* 等） | 分支规则 | 分支名天然可查 | 类型固定的改动 |
| SH_SDD_SKIP=1 | 你这次提交显式声明 | **是**（shell 历史） | 临时的、一次性的例外 |

> 显式例外的设计哲学：**例外可以存在，但必须「大声」存在。** 偷偷绕过不可追溯，显式跳过可审计——这就是 harness 和「自觉」的区别。

---

## 8. 结果不符预期？排查表

| 现象 | 可能原因 | 处理 |
|---|---|---|
| 放行态被拦了 | 分支名不是 `feat/*`/`feature/*`？或没 add 到 `.ai/specs/` 的文件 | `git branch --show-current` 确认分支；`git status` 确认 spec 已暂存 |
| 拦截态放行了 | 分支其实是 `fix/*`/`chore/*` 等豁免分支；或 hook 未生效 | 确认分支名；回到 Day 10 第 6 节核对 hook 是否装上 |
| SH_SDD_SKIP 没生效 | 环境变量写法（`SH_SDD_SKIP=1 git commit ...` 只对单条命令生效） | 检查是否写成了分开的两条命令 |
| hook 完全没反应 | 安装未完成 / 钩子未挂载（挂载方式以安装脚本为准，标「待核验」） | 回到 Day 10 重装；或按仓库 README 手动挂载 |

> 任何一条不符，都不要「硬绕」——先查分支名、查 hook 状态，找到根因。

---

## 9. 三态实测记录模板（提交进学习笔记）

```
# Day 13 实操记录：spec-first 提交三态
日期：______　测试仓库：______　使用的 spec：Day5-spec-<功能名>-v2.md

## 态一 放行（spec + 代码同提交）
命令：______　结果：□ 成功　git log 哈希：______
post-commit 输出（粘贴）：______

## 态二 拦截（只改代码）
命令：______　结果：□ 被拒
拒绝信息（原样粘贴）：______
git log 确认无此提交：□

## 态三 SH_SDD_SKIP=1 显式例外
命令：______　结果：□ 成功
shell 历史留痕：□ 已查到（粘贴检索结果）

## 我的 hook 判定流程图（画在下面）
（ASCII 或手画后拍照）
```

> 这份记录是 Day 14 周复盘的核心素材——你要用它来总结「四大护栏里，Hooks 在我这里到底是怎么落地的」。

---

## 自测题

1. 三态是哪三态？各自的前提条件是什么？（简答）
2. pre-commit hook 检查的核心对象是什么？它检查 spec 质量吗？（简答）
3. `SH_SDD_SKIP=1` 的两种正确理解/一种错误理解分别是什么？（简答）
4. 判断题：在 `fix/typo` 分支上只改代码也会被拦。（判断——正确答案：否，fix/* 豁免）
5. 判断题：`SH_SDD_SKIP=1` 是偷偷绕行，不留痕迹。（判断——正确答案：否，shell 历史留痕）
6. 选择题：被拦后，正确的处理是：
   A. 换个分支名提交　B. 补一份 spec 一起提交　C. `git push --force`　D. 删掉 hook
7. spec 应该放进 `.ai/` 下的哪个目录？（填空）
8. 「豁免分支」和「SH_SDD_SKIP」的根本区别是什么？（简答）
9. 为什么 spec 要和代码**同一笔提交**，而不是先提交代码再补 spec？（开放性简答）
10. 一句话：spec-first 在你的测试仓库里，现在由什么机制强制保证？（简答）

> 提示：第 9 题——想想 Day 10 被拦的那一笔：如果代码先提交了，spec 再补，「先有契约再实现」就名存实亡，历史里也查不到对应关系；第 10 题——pre-commit hook + `.ai/specs/` 路径检查。

---

## 延伸阅读

- sdd-harness 仓库（hook 源码与判定逻辑原文）：https://github.com/iMark21/sdd-harness
- 《SDD 和 Harness：AI 编程的两大支柱》（spec-first / 先契约后实现的理念出处）：https://blog.csdn.net/qq_43284469/article/details/164267908
- 《出码率 90% 却没提效？》（为什么「能跑」不等于「可控」——今天的拦截体验就是答案）：https://cloud.tencent.com/developer/article/2669269

---

*本工作纸依据《SDD+Harness四周学习计划.md》Day 13 主题编制。整理日期：2026-09-09*
