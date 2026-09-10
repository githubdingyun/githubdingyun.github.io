# CLAUDE.md

本文件是 Claude Code 的项目记忆，会话启动时自动加载。

## 项目简介

Lsg（李帅国 / dingyun）的个人技术博客，Jekyll 静态站，部署在 GitHub Pages。

- 站点：https://githubdingyun.github.io
- 模板：fork 自 Huxpro/huxpro.github.io
- 配置见 `_config.yml`（要点：`future: true` 允许未来日期文章发布；`permalink: pretty`；`timezone: CN`）

## 博客文章规范（重要）

新文章一律用**标准 Jekyll 单文件格式**，不要用旧的双语拆分结构。

- 位置：`_posts/<年份>/<YYYY-MM-DD>-<slug>.md`（单文件，不拆 en/zh）
- Front matter 模板：

```yaml
---
layout:     post
title:      "标题"
subtitle:   "副标题"
date:       YYYY-MM-DD
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - 标签
---
```

- 文件名日期与 front matter 的 `date` 保持一致；同一天可有多篇（slug 不同即可）。
- `_includes/posts/<slug>/en.md` + `zh.md` 是历史遗留的双语结构，仅存量文章使用，不要新建。

## 关键约束

1. **禁止随意删除博客文章**：`_posts/` 和 `_includes/posts/` 下的文章受 `.claude/hooks/delete-guard.js` 保护，删除需连续三次提醒才会放行。
2. 提交前检查 front matter 完整、日期正确。

## 已有的 Harness（hooks）配置

- `.claude/hooks/delete-guard.js` — PreToolUse 删除护栏，保护博客文章目录。
- `.claude/hooks/test-on-edit.js` — PostToolUse 改代码后自动跑测试（本仓库为纯博客、无测试，处于休眠；搬到 Java 项目后会自动探测 `mvn test`）。

## 构建 / 预览

- 推送到 `master` 后 GitHub Pages 自动构建发布。
- 本地预览（需本地安装 Jekyll）：`jekyll serve`，生成 `_site/`（已在 `.gitignore` 中忽略）。
