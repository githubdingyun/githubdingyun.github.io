# Spec：个人博客站点（githubdingyun.github.io）

> 状态：implemented（本地已改，未提交） ｜ 日期：2026-09-10 ｜ 作者：DingYun ｜ 关联变更：站点更名（→ Lsg's Blog）
>
> 本文是**存量系统基线 spec**：先把站点"应该是什么样"钉死成可验收契约，再据此验收改名等变更。只写 WHAT，不写 HOW。

## 1. 背景

站点是基于 [Hux Blog](https://github.com/Huxpro/huxpro.github.io) fork 的 Jekyll 静态博客，托管于 GitHub Pages（`permalink: pretty`，`paginate: 10`）。目前累计 **46 篇**博文（2018 年 5 篇 + 2019 年 13 篇技术笔记 + 2026 年 8–9 月学习系列 28 篇；文件扩展名同时存在 `.md` 与 `.markdown`）。

当前存在 4 个**非做不可**的现状问题，均有量化证据：

| # | 问题 | 证据 | 代价 |
|---|---|---|---|
| 1 | 评论实际不可用 | `_config.yml` 配了 Gitalk（`enable: true`），但没有任何 layout/include 引入 `js/gitalk.min.js` / `css/gitalk.css`；Disqus 被注释、`netease_comment: false` | 全部 46 篇文章评论区为空，读者无法反馈 |
| 2 | 站点域名写错 | `_config.yml` 中 `url: https://guthubdingyun.github.io/`（guthub → github） | `canonical`、`og:url`、`og:image`、RSS 的 `link`/`guid` 全部指向不存在的域名 |
| 3 | 品牌不一致 | `title` 已改为 `Lsg's Blog`，但 `SEOTitle` 仍是 `DingYun Blog \| 定陨 的博客`；`pwa/manifest.json` 的 `name` 已是 `Lsg's Blog` 而 `short_name` 仍是 `DingYun Blog`；footer 硬编码 `GitHub's DingYun` | 站内 5 处署名 3 种叫法，品牌混乱 |
| 4 | 统计归属他人 | `ga_track_id: UA-49627206-1` 是模板原作者 Hux 的 Google Analytics 属性 ID | 站点访问数据计入他人账号，作者看不到自己的数据 |

## 2. 目标

- 品牌命名在站内**所有对外暴露处保持一致**：`title` / `SEOTitle` / `manifest.name` / `manifest.short_name` / footer，一致性 5/5 处（口径以 §9 变更记录为准）。
- 站点对外 URL 与真实域名**100% 一致**：`guthub` 拼写命中 0 处；`canonical`、`og:url`、`og:image`、RSS `link`/`guid` 域名正确。
- 正文页评论**可用**：页面加载后 3s 内渲染出可登录的评论框，Console 无报错；死配置 0 处。
- 访问统计**只计入站点所有者**（或明确关闭），不出现他人 ID。
- 保持纯静态、零服务端依赖，既有 46 篇文章 URL 不失效。

> 技术方案（选哪个评论系统、GA3 还是 GA4、如何改模板）属于 plan，不在本 spec 内定夺。

## 3. 用户故事

- 作为**读者**，我想在文章底部留评论/提问，以便与作者交流。
- 作为**读者**，我想把文章链接分享到社交平台时看到正确的标题、摘要与缩略图，以便预览不失真。
- 作为**读者**，我想按标签筛选归档、并按年份浏览全部文章，以便找到感兴趣的内容。
- 作为**作者**，我想站点各处署名统一为 `Lsg's Blog`，以便品牌不混乱。
- 作为**作者**，我想看到自己站点的真实访问数据，以便知道哪些文章受欢迎。
- 作为**作者**，我想新增一篇博文时只写 Markdown 而不用改模板代码，以便持续更新。

## 4. 验收标准

> 前置条件：本地 `jekyll serve` 构建成功，或 GitHub Pages 已发布最新提交。

- **AC-1（品牌一致性）**：GIVEN 站点构建产物，WHEN 抓取页面 `<title>`、`og:site_name`、`pwa/manifest.json` 的 `name`/`short_name`、footer 版权文案，THEN 5 处均以 `Lsg's Blog` 为站点名主体、命名口径一致，且全站不含 `DingYun Blog` 字样（命中 0 处）。（是否保留中文副标题见 §9 决策；`short_name` 建议 ≤ 12 字符。）
- **AC-2（域名正确性）**：GIVEN 任一文章 HTML 与 `/feed.xml`，WHEN 提取 `canonical`、`og:url`、`og:image`、RSS 的 `link`/`guid`，THEN 全部以 `https://githubdingyun.github.io/` 开头；产物中 `guthub` 命中 0 处。
- **AC-3（评论可用）**：GIVEN 任一文章页，WHEN 打开并等待 3s，THEN 评论容器渲染出可交互的评论框（DOM 存在且非空），Console 中 JS 报错数为 0。
- **AC-4（首页分页）**：GIVEN 站点共 46 篇文章、`paginate: 10`，WHEN 访问首页，THEN 每页展示 10 篇、共 5 页；第 k 页 URL 为 `/page/k/`。
- **AC-5（归档与标签）**：GIVEN 访问 `/archive.html`，WHEN 点击任一标签，THEN 列表仅显示含该标签的文章；点击 `Show All` 显示全部 46 篇；每篇按年份分组。
- **AC-6（多语言 About）**：GIVEN 访问 `/about/?lang=en`，WHEN 页面加载完成，THEN 显示英文版内容、中文版 `display:none`；不带参数时默认中文。
- **AC-7（PWA 离线，分两级）**：
  - **7a**：GIVEN 某页面已被访问过，WHEN 浏览器切为 Offline 后刷新该页，THEN 由 Service Worker 命中缓存返回，不出现浏览器默认离线错误页；Application 面板可见 SW 已激活。
  - **7b**：GIVEN 浏览器处于 Offline，WHEN 访问一个**从未访问过**的页面，THEN 返回 `offline.html` 兜底页。
  - 预缓存曾因缺失文件整表失败导致 7b 不通过，已在 §9 修复；要求修复后 7a、7b 同时通过。
- **AC-8（新增文章零改模板）**：GIVEN 在 `_posts/2026/` 新增一个 front matter 合法的 `.md`，WHEN 触发构建，THEN 该文出现在首页列表、`/archive.html` 与 `feed.xml`，且**无需修改任何模板文件**。
- **AC-9（统计归属）**：GIVEN 构建产物，WHEN 检查统计脚本中的 ID，THEN 该 ID 属于站点所有者，或统计已关闭（不出现 `UA-49627206-1` 等他人 ID）。
- **AC-10（历史 URL 不失效）**：GIVEN 既有 46 篇文章，WHEN 访问其 `permalink` 形式 URL，THEN 全部返回 200，且 slug 与改动前一致。

## 5. 非目标

- 不重构主题：不更换 Jekyll 主题、不改动 Bootstrap / LESS / Grunt 构建链。
- 不新增功能：搜索、邮件订阅、评论审核后台、阅读量统计等一律不做。
- 不改既有 46 篇博文的内容与 URL（`permalink` 保持不变）。
- 不引入服务端能力，保持纯静态 GitHub Pages 可托管。
- 不做视觉改版：配色、字体、布局、header 图不动。
- 不配置自定义域名（`CNAME` 保持现状）。

## 6. 边界条件

- **空结果**：标签筛选无匹配 → 显示空列表 + 正常状态码，不报错。
- **评论降级**：读者未登录 GitHub / 第三方服务不可达 → 评论框降级为提示文案，**不得阻塞正文渲染**，失败可在 Console 观察到（不静默）。
- **CDN 不可达**：`cdnjs` 上的 font-awesome / anchor.js / fastclick 加载失败 → 正文核心内容仍可读，仅装饰与锚点功能缺失。
- **离线兜底**：预缓存缺失时 `offline.html` 兜底不可靠 → 离线访问未访问页面可能落到浏览器默认错误页（曾真实发生，已在 §9 修复）。
- **极限数据**：文章增至 100 篇 → 首页仍正常分页；`/archive.html` 与 `feed.xml`（`limit:10`）生成时间 < 60s。
- **非法 front matter**：某篇缺 `title`/`date` 非法 → 构建明确报错并指出文件，不产出半成品页面。
- **域名变更**：若启用自定义域名（`CNAME` 当前为 0 字节），`canonical`/`og:url` 必须同步更新，否则 AC-2 回归。
- **文件名含空格**：`_posts/2019/…-reentry-problem .md`（`.md` 前有空格）产生的 slug 含空格，URL 需正确编码且不产生 404。

## 7. 验证方式

| AC | 取证手段 |
|---|---|
| AC-1 | 构建后 `grep -r "Lsg's Blog" _site` 存在；`grep -r "DingYun Blog" _site` 命中 0 |
| AC-2 | `grep -r "guthub" _site` 命中 0；抽查 1 篇 HTML 的 `canonical`/`og:url` + `feed.xml` 的 `link` |
| AC-3 | 本地 `jekyll serve` 打开 1 篇文章，DevTools 检查评论容器 + Console 无错 |
| AC-4/5/6 | 本地 serve 断言：`/page/2/` 等分页 URL、标签筛选结果数、`?lang=en` 显示切换 |
| AC-7 | Chrome Application 面板确认 SW 激活；Network 切 Offline 分别验 7a（刷新已访问页）与 7b（访问未访问页 → `offline.html`）；Console 观察 `cache.addAll` 是否报错 |
| AC-8 | 新建 1 篇测试文 → 构建 → 断言出现在首页与 `feed.xml`，`git diff` 无模板改动 |
| AC-9 | `grep -r "UA-\|hm.js" _site` 与本人统计属性比对 |
| AC-10 | 遍历 46 个 permalink 断言 HTTP 200 |

## 8. 四类契约

- **数据契约**：文章 front matter 字段 —— 实测使用：`layout: post`、`title`、`subtitle?`、`date`、`author`（现均为 `LSG`）、`header-img?`、`catalog?`、`mathjax?`、`tags`；模板另支持 `lang?`（`index.html` 对 `en` 截断 300 字、其余 200 字）与 `multilingual?`（当前仅 about 页使用）。文件扩展名 `.md` 与 `.markdown` 并存，两者都必须被识别。任何字段变更须向后兼容既有 46 篇。
- **行为契约**：`permalink: pretty` → `/YYYY/MM/DD/<slug>/`；首页分页 `/page/:num/`；`/archive.html`；`/about/?lang=zh|en`；`/feed.xml`；`/404.html`；`/offline.html`。
- **质量契约**：单篇 HTML < 300KB；本地首屏 < 2s；46 篇全站构建 < 60s。
- **可观测性契约**：访问统计归属本人；评论/统计等第三方加载失败必须可在 Console 观察到，不静默失败。

## 9. 变更记录（Delta：站点更名 → Lsg's Blog）

### MODIFIED Requirements

**Requirement: 站点展示名**

- （此前）`title: DingYun's Blog`；`SEOTitle: DingYun Blog | 定陨 的博客`；`manifest.name: DingYun's Blog`；`manifest.short_name: DingYun Blog`；footer 文案 `GitHub's DingYun`
- （改为）—— 5 处**全部已落地**：

| 处 | 终值 | 位置 | 状态 |
|---|---|---|---|
| `title` | `Lsg's Blog` | `_config.yml:2` | ✅ 已改 |
| `SEOTitle` | `Lsg's Blog \| 定陨 的博客` | `_config.yml:3` | ✅ 已改 |
| `manifest.name` | `Lsg's Blog` | `pwa/manifest.json:2` | ✅ 已改 |
| `manifest.short_name` | `Lsg's Blog` | `pwa/manifest.json:3` | ✅ 已改 |
| footer 源码链接 | `GitHub's Lsg` | `_includes/footer.html:12` | ✅ 已改 |

> **口径决策（已定）**：站点名主体统一为 `Lsg's Blog`；`SEOTitle` 保留中文副标题 `定陨 的博客` 以保中文 SEO；`short_name` 直接用 `Lsg's Blog`（10 字符 ≤ 12）。

#### Scenario: 名称一致性

- GIVEN 站点配置与 PWA manifest
- WHEN 按 AC-1 抓取 5 处名称
- THEN 均以 `Lsg's Blog` 为主体，`DingYun Blog` 命中 0 处

### 本次一并纳入验收的已知缺陷（对应 §1 的 4 个问题）

| 缺陷 | 位置 | 对应 AC | 状态 |
|---|---|---|---|
| `url` 拼写错误 `guthubdingyun` | `_config.yml:9` | AC-2 | ✅ 已修（guthub → github） |
| Gitalk 已配置但未接线 | `_config.yml:71`；修复：`_includes/head.html`、`_layouts/post.html` | AC-3 | ✅ 已修（接线并渲染） |
| `SEOTitle` / `short_name` / footer 未同步改名 | `_config.yml:3`、`pwa/manifest.json:3`、`_includes/footer.html:12` | AC-1 | ✅ 已修 |
| GA ID 属模板原作者 | `_config.yml:85-88` | AC-9 | ⚠️ 已停用；待填本人 GA ID 后启用 |

> Gitalk 接线要点：`_includes/head.html` 引入 `css/gitalk.css`；`_layouts/post.html` 加 `#gitalk-container` 容器与初始化脚本，`id` 用路径短哈希（中文 permalink 经 URL 编码会超过 Gitalk 的 50 字符上限）。
>
> ⚠️ **安全提示**：`clientSecret` 写在公开仓库的 `_config.yml` 里（Gitalk 静态站点固有问题），任何人都能读到。若在意，建议改用仅含 `public_repo` 权限、可随时吊销的专用 OAuth App，或改用无需 secret 的评论方案。

### 顺带发现并已修的问题（原会拖垮 AC-7）

**预缓存整表失败（已修）**：`sw.js` 的 `PRECACHE_LIST` 曾含不存在的 `./img/avatar-hux.jpg`。`cache.addAll()` 是原子操作，一项 404 即整表 reject，被 `.catch(console.log)` 静默吞掉 → app shell（含 `offline.html`、jquery、CSS、图片）**从未被预缓存**，离线兜底因此不可靠。

- 修复：从 `PRECACHE_LIST` 删除该条目；`.catch` 改为 `console.error('[sw] precache failed:', err)`，不再静默。
- 另修：`.then(self.skipWaiting())` → `.then(() => self.skipWaiting())`（原写法是立即调用而非回调，SW 更新时机不符预期）。

### 其它模板残留（未处理，供参考）

- `package.json` 仍为 `hux-blog` v1.8.2 / author `Hux`。
- `_config.yml` 侧边栏头像为 `/img/小埋0.png`；`description` / `keyword` 仍带 `DingYun`、`定陨` 字样（属关键词，未强制统一）。
- `_includes/head.html` 仍保留原作者 Hux 的 `google-site-verification` 令牌。
- `pwa/manifest.json` 的 `description` 仍为模板英文原句。
