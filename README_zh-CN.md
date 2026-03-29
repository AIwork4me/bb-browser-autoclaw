<div align="center">

# 🦞 bb-browser-autoclaw

### 在终端抓取 x.com 推文。无需 API Key。无速率限制。无废话。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bb-browser](https://img.shields.io/badge/bb--browser-0.10.1-green.svg)](https://github.com/epiral/bb-browser)
[![AutoClaw](https://img.shields.io/badge/AutoClaw-compatible-orange.svg)](https://github.com/nicepkg/openclaw)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://github.com/AIwork4me/bb-browser-autoclaw)

**一个补丁 → 你的浏览器变成终极数据抓取 API**

[快速开始](#-快速开始) · [English](README.md) · [安装指南](SETUP.md) · [自动补丁脚本](patch-bridge.js)

</div>

---

## 🎯 解决什么问题

[bb-browser](https://github.com/epiral/bb-browser) 很厉害——它把 36+ 个网站变成 CLI 命令，复用浏览器的登录态，不需要 API Key。

**但它跟 [AutoClaw](https://github.com/nicepkg/openclaw) 不兼容。**

bb-browser 默认调用 `npx openclaw`，这个版本不支持浏览器控制。AutoClaw 内置的 `openclaw` 才有完整的浏览器能力，但 bb-browser 找不到它。

**本仓库用一个命令搞定这件事。**

## ✨ 效果

补丁之后，终端直接输出结构化的推文数据：

```bash
$ bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json
```

```json
{
  "count": 3,
  "tweets": [
    {
      "id": "2038138194861166638",
      "type": "tweet",
      "author": "elonmusk",
      "text": "Tesla FSD",
      "likes": 46103,
      "retweets": 4686,
      "created_at": "Sun Mar 29 06:16:27 +0000 2026"
    },
    {
      "id": "2038140569655165031",
      "type": "retweet",
      "author": "elonmusk",
      "rt_author": "DimaZeniuk",
      "text": "Starship is the first planet-colonizer class rocket",
      "likes": 8076,
      "retweets": 1722,
      "created_at": "Sun Mar 29 06:25:53 +0000 2026"
    },
    {
      "id": "2038280385835307008",
      "type": "tweet",
      "author": "elonmusk",
      "text": "SpaceX Falcon 9 family has now launched 636 times...",
      "likes": 2167,
      "retweets": 456,
      "created_at": "Sun Mar 29 18:36:52 +0000 2026"
    }
  ]
}
```

**真实数据。实时获取。无需 API Key。无速率限制。你的浏览器，你的登录态。**

## 🚀 快速开始

### 前置条件

- 已安装 [AutoClaw](https://github.com/nicepkg/openclaw)（内置 openclaw，支持浏览器控制）
- [Node.js](https://nodejs.org/) 18+ 和 npm
- 已在浏览器中登录 Twitter/X
- Windows 系统（Linux/macOS 支持即将推出）

### 三步抓取推文

```bash
# 1. 安装 bb-browser 并打补丁
npm install -g bb-browser && bb-browser site update
node patch-bridge.js

# 2. 打开 x.com 并登录
openclaw browser start
openclaw browser open https://x.com
# → 在浏览器窗口中手动登录你的 Twitter 账号

# 3. 抓取推文
bb-browser site twitter/tweets elonmusk --count 5 --openclaw --json
```

完事了。

## 🔧 补丁做了什么

自动补丁脚本（[patch-bridge.js](patch-bridge.js)）对 bb-browser 的 bridge 文件做了 4 个精确修改：

| # | 修改 | 原因 |
|---|------|------|
| 1 | `npx` → AutoClaw 内置 node 路径 | bb-browser 默认调 npm 版 openclaw，不支持浏览器 |
| 2 | 去掉 `"openclaw"` 参数前缀 | AutoClaw 的 `openclaw.mjs` 不需要 openclaw 子命令 |
| 3 | tabs 超时：15s → 60s | AutoClaw 启动需要更多时间 |
| 4 | evaluate 超时：120s → 180s | 复杂页面求值需要安全余量 |

**补丁是幂等的**——多次运行安全无害。自动备份原文件。

## 📋 已验证平台

| 平台 | 适配器 | 状态 | 原理 |
|------|--------|------|------|
| **Twitter/X** | `twitter/tweets` | ✅ 已验证 | GraphQL API + cookie 登录态 |
| **Twitter/X** | `twitter/search` | ✅ 已验证 | 搜索接口 + cookie 登录态 |
| Reddit | `reddit/hot` | ✅ 已验证 | Cookie fetch |
| 微博 | `weibo/hot` | ✅ 已验证 | Cookie fetch |
| 知乎 | `zhihu/hot` | ✅ 需登录 | Cookie fetch |
| B站 | `bilibili/popular` | ✅ 已验证 | Cookie fetch |
| HackerNews | `hackernews/top` | ⚠️ CORS 受阻 | Firebase API 在浏览器环境被阻止 |

### 更多示例

```bash
# 搜索推文
bb-browser site twitter/search "AI Agent" --count 10 --openclaw --json

# Reddit 首页
bb-browser site reddit/hot --openclaw --json

# 微博热搜
bb-browser site weibo/hot --openclaw --json

# 知乎热榜（需登录）
bb-browser site zhihu/hot --openclaw --json

# 用 jq 过滤
bb-browser site twitter/tweets elonmusk --count 5 --openclaw --json | jq '.tweets[] | {text, likes}'
```

## ⚠️ 已知问题

- `npm update -g bb-browser` 会覆盖补丁——重新运行 `node patch-bridge.js`
- x.com 需要能访问的网络环境（中国大陆用户需要代理）
- HackerNews 使用公开 Firebase API，在浏览器环境被 CORS 阻止（非 bridge 问题）
- 小红书适配器有 XHR 拦截缓存 bug——结果不太可靠

## 🤝 AutoClaw 用户一键安装

把 [SETUP.md](SETUP.md) 的全部内容复制给你的 AutoClaw AI，它会自动完成：

1. 安装 bb-browser
2. 运行补丁脚本
3. 启动浏览器并打开 x.com
4. 等你手动登录
5. 抓取推文验证

## 贡献

Bug 报告、功能建议、Pull Request 详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE) —— 随便用。

## 相关项目

- [bb-browser](https://github.com/epiral/bb-browser) —— 把网站变成 CLI 命令的核心工具
- [AutoClaw](https://github.com/nicepkg/openclaw) —— 内置浏览器控制的 AI Agent 框架

---

<div align="center">

**如果这个项目帮你摆脱了 Twitter API 的速率限制，请 ⭐ Star！**

由 🦞 [澳龙公司](https://github.com/AIwork4me) 出品

</div>
