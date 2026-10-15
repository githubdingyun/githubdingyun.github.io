---
layout:     post
title:      "Windows 服务器本地部署大模型全攻略（A6000 48GB 自用）"
subtitle:   "常用模型调研 × 部署方式对比 × 从零部署步骤"
date:       2026-10-15
author:     "LSG"
header-img: "img/home-bg.jpg"
catalog: true
tags:
  - Ollama
  - LLM
  - Windows
  - 本地部署
  - A6000
---

> 一台配了 RTX A6000（48GB 显存）+ 64GB 内存的 Windows 服务器，想自己跑大模型、写代码、不依赖公网 API。本文分三部分：常用模型调研、部署方式对比、从零部署步骤。

## 一、硬件与选型背景

A6000 48GB 显存，Q4 量化下：



| 档位           | 代表模型                             | Q4 显存占用       | 用途                        |
| ------------ | -------------------------------- | ------------- | ------------------------- |
| 轻快日常         | Qwen3-8B / Qwen3.8-27B           | \~5 / \~18 GB | 秒回、挂后台、摘要、多模态             |
| **写代码主力（新）** | **Qwen3-Coder-30B-A3B**（2025-08） | \~18 GB       | 专门代码模型，Agentic coding     |
| **通用最新（新）**  | **Qwen3.8-27B**（2026-08）         | \~18 GB       | 通用模型，编程 / 推理 / Agent 全面升级 |
| 推理疑难         | DeepSeek-R1-Distill-32B          | \~20 GB       | 复杂 bug、算法、重构分析            |
| 极限           | Llama-3.3-70B / Qwen3-72B Q4     | \~40 GB       | 刚好塞满，质量最高                 |

日常自用甜点位是 **27B–30B Q4**：显存占一半、MoE 激活参数小、速度和质量平衡最好。



***

## 二、常用模型调研

### 2.1 代码场景主流模型对比（按发布时间）



| 模型                           | 发布时间        | 参数               | 许可证             | Q4 显存   | 上下文  | 特点                                 |
| ---------------------------- | ----------- | ---------------- | --------------- | ------- | ---- | ---------------------------------- |
| **Qwen3.8-27B**              | **2026-08** | 27B              | Apache-2.0      | \~18 GB | 256K | 最新通用模型，编程 / 推理 / Agent 全面升级，支持图片输入 |
| **Qwen3-Coder-30B-A3B**      | **2025-08** | 30B MoE（激活 3.3B） | Apache-2.0      | \~18 GB | 262K | 专门代码模型，Agentic coding 优化，代码专精      |
| Qwen2.5-Coder-32B            | 2025-02     | 32B 稠密           | Apache-2.0      | \~20 GB | 128K | 上一代代码主力，补全 / 生成均衡                  |
| DeepSeek-Coder-V2            | 2024-06     | 16B (MoE)        | MIT             | \~10 GB | 128K | MoE 激活小、速度快，代码补全强                  |
| DeepSeek-R1-Distill-Qwen-32B | 2025-01     | 32B              | MIT             | \~20 GB | 128K | 推理模型，先思考再作答，适合难题                   |
| Llama-3.3-70B-Instruct       | 2024-12     | 70B              | Llama Community | \~40 GB | 128K | 通用强，代码中上，社区生态好                     |

### 2.2 Qwen3-Coder-30B vs Qwen3.8-27B 怎么选



| 维度           | Qwen3-Coder-30B（2025-08） | Qwen3.8-27B（2026-08） |
| ------------ | ------------------------ | -------------------- |
| 定位           | 专门代码模型                   | 通用模型（编程能力大升级）        |
| 架构           | 30B MoE，激活 3.3B          | 27B 稠密（基于 Qwen3.5）   |
| 代码专精         | ✅ 更强（为代码训练）              | ⚠️ 强但非专精             |
| 多模态（看图）      | ❌                        | ✅ 支持图片               |
| 工具调用 / Agent | ✅                        | ✅                    |
| 推理模式         | ✅                        | ✅（强化）                |
| 上下文          | 262K                     | 256K                 |
| 速度           | MoE 激活小，快                | 27B 稠密，略慢            |

**结论**：纯写代码、读代码库、补全选 `qwen3-coder:30b`；综合日常（聊天 / 看图 / 推理 / 工具调用）选 `qwen3.8`。你 48GB 显存两个都能挂，建议都拉按场景切。

### 2.3 写代码怎么选



* **90% 日常**（写接口、改 SQL、修 bug、看日志、写单测）→ `qwen3-coder:30b`，快、工程化、上下文长。

* **10% 疑难**（并发问题、算法、架构取舍）→ `deepseek-r1:32b`，让它先推理一遍。

* **综合 / 多模态**（看截图、读架构图、跨任务）→ `qwen3.8`。

* 同一时间只跑一个模型，Ollama 自动切换，加载只要几秒。

### 2.4 结论



| 场景         | 选谁                                         |
| ---------- | ------------------------------------------ |
| 主力写代码      | **Qwen3-Coder-30B**（`qwen3-coder:30b`）     |
| 综合日常 / 多模态 | **Qwen3.8-27B**（`qwen3.8`）                 |
| 推理 / 疑难    | DeepSeek-R1-Distill-32B（`deepseek-r1:32b`） |
| 轻量快速备用     | Qwen3-8B（`qwen3:8b`）                       |



***

## 三、部署方式调研

### 3.1 主流部署工具对比



| 方式                    | 难度       | GPU 利用             | WebUI                | 并发   | 适合场景             |
| --------------------- | -------- | ------------------ | -------------------- | ---- | ---------------- |
| **Ollama**            | ⭐ 极简     | 自动（CUDA）           | 自带 CLI，可接 Open WebUI | 单机自用 | **个人自用首选**       |
| LM Studio             | ⭐⭐ 图形化   | 自动                 | 内置模型市场               | 单机   | 新手、不想敲命令         |
| llama.cpp             | ⭐⭐⭐ 命令行  | 需手动配               | 无                    | 单机   | 极致轻量、跨平台、GGUF 量化 |
| Text Generation WebUI | ⭐⭐⭐⭐ 配置多 | 自动                 | 功能最全（插件 / 扩展）        | 单机   | 折腾党、研究向          |
| vLLM                  | ⭐⭐⭐ 专业   | PagedAttention 高吞吐 | API                  | 多并发  | 生产环境、多人服务        |
| Docker + 自建 API       | ⭐⭐⭐      | 取决于底层              | 自己写                  | 灵活   | 定制化              |

### 3.2 为什么选 Ollama + Open WebUI



* **Ollama**：一条命令装 Windows 服务、开机自启、自动识别 A6000、模型管理统一命令（pull/run/list/ps）、内置 OpenAI 兼容 API（`:11434/v1`）。

* **Open WebUI**：类 ChatGPT 网页端，Docker 一条命令起，支持多会话、文件上传、模型切换、多用户。

* 组合起来：**5 分钟部署、开机自启、浏览器打开即用、API 可接自己的脚本**。

* vLLM 这类高吞吐方案适合多人服务，单人自用不需要；LM Studio 更适合纯新手；llama.cpp 灵活但要自己折腾量化和启动参数。



***

## 四、部署步骤

### 4.1 装驱动和 Ollama



```
# 确认 GPU 识别
nvidia-smi

# 装 Ollama（winget 或官网下载安装包）
winget install Ollama.Ollama
# 装完以后台服务运行，开机自启
```

### 4.2 配置 Ollama



```
# 默认只听 127.0.0.1:11434，本机自用无需改。
# 如果要从内网其他机器访问，管理员 PowerShell：
setx OLLAMA_HOST "0.0.0.0:11434"

# 模型常驻显存不自动卸载（可选，A6000 48GB 可以）
setx OLLAMA_KEEP_ALIVE "60m"

# 重启 Ollama（托盘退出重开，或重启服务）
Restart-Service Ollama
```

### 4.3 拉模型



```
ollama pull qwen3-coder:30b        # 写代码主力（2025-08，代码专精）
ollama pull qwen3.8                # 综合/多模态（2026-08，最新通用）
ollama pull deepseek-r1:32b        # 疑难推理备用
ollama pull qwen3:8b               # 轻快任务（可选）

ollama list                        # 查看已装
ollama run qwen3-coder:30b "你好"   # 测试
```

### 4.4 装 Open WebUI（Docker Desktop）



```
# 装 Docker Desktop（如未装）
winget install Docker.DockerDesktop
# 启动 Docker，等鲸鱼图标变绿

# 一条命令起 WebUI
docker run -d -p 3000:8080 `
  --add-host=host.docker.internal:host-gateway `
  -v open-webui:/app/backend/data `
  --name open-webui `
  --restart always `
  ghcr.io/open-webui/open-webui:main
```

`--restart always` 保证 Docker 启动时 WebUI 自动起来。

### 4.5 首次使用配置



1. 浏览器打开 `http://localhost:3000`（或 `http://服务器IP:3000`）

2. **第一个注册的账号自动成为管理员**，注册完：

* 管理面板 → 设置 → 通用 → 关闭「公开注册」

1. 顶部模型下拉选 `qwen3-coder:30b`，开始聊天。



***

## 五、架构总览



```
浏览器（localhost:3000 或 内网IP:3000）
        ↓
Open WebUI（Docker 容器，:3000）
        ↓ host.docker.internal:11434
Ollama（Windows 本机服务，:11434，开机自启）
        ↓
RTX A6000 48GB
```



***

## 六、验证清单



| 检查项        | 命令 / 操作                                | 通过标准             |
| ---------- | -------------------------------------- | ---------------- |
| GPU 识别     | `nvidia-smi`                           | 看到 RTX A6000     |
| 模型进 GPU    | `ollama ps`（跑一次对话后）                    | PROCESSOR 显示 GPU |
| Ollama API | `curl http://localhost:11434/api/tags` | 返回模型列表 JSON      |
| WebUI      | 浏览器 `http://localhost:3000`            | 打开聊天界面           |
| WebUI 调通   | 对话里发一句话                                | 正常流式输出           |



***

## 七、安全建议



* 服务器有公网 IP，**不要把 3000 和 11434 暴露公网**；绑内网 /[localhost](https://localhost)，防火墙只放行办公网段。

* WebUI 第一个账号设强密码，关闭公开注册。

* 本机 / 内网自用不需要 HTTPS；要走公网再考虑反代 + TLS。



***

## 八、日常运维



```
ollama list                  # 看已装模型
ollama ps                    # 看当前显存里挂了什么
docker logs open-webui       # WebUI 有问题查日志
docker restart open-webui    # 重启 WebUI
ollama pull <model>          # 更新模型
```



***

这套下来：浏览器打开就能用，模型在 A6000 上跑，开机自启，只自己访问。写代码主力用 **Qwen3-Coder-30B**（2025-08 发布），综合 / 多模态用 **Qwen3.8-27B**（2026-08 发布），疑难问题切 DeepSeek-R1-Distill-32B。