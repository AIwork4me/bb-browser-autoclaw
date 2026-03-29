<div align="center">

# 🦞 bb-browser-autoclaw

### Scrape x.com tweets in your terminal. No API key. No rate limit. No BS.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bb-browser](https://img.shields.io/badge/bb--browser-0.10.1-green.svg)](https://github.com/epiral/bb-browser)
[![AutoClaw](https://img.shields.io/badge/AutoClaw-compatible-orange.svg)](https://github.com/nicepkg/openclaw)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://github.com/AIwork4me/bb-browser-autoclaw)

**One patch → Your browser becomes the ultimate scraping API**

[Quick Start](#-quick-start) · [中文文档](README_zh-CN.md) · [Setup Guide](SETUP.md) · [Auto-Patcher](patch-bridge.js)

</div>

---

## 🎯 The Problem

[bb-browser](https://github.com/epiral/bb-browser) is brilliant — it turns 36+ websites into CLI commands using your browser's login state. No API keys needed.

**But it doesn't work with [AutoClaw](https://github.com/nicepkg/openclaw).**

bb-browser calls `npx openclaw` by default, which points to the npm version that lacks browser support. AutoClaw's built-in `openclaw` has full browser control, but bb-browser can't find it.

**This repo fixes that with a single command.**

## ✨ The Result

After patching, you get structured tweet data straight in your terminal:

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
      "text": "SpaceX Falcon 9 family has now launched 636 times and counting...",
      "likes": 2167,
      "retweets": 456,
      "created_at": "Sun Mar 29 18:36:52 +0000 2026"
    }
  ]
}
```

**Real data. Real time. No API key. No rate limit. Your browser, your login.**

## 🚀 Quick Start

### Prerequisites

- [AutoClaw](https://github.com/nicepkg/openclaw) installed (includes `openclaw` with browser support)
- [Node.js](https://nodejs.org/) 18+ and npm
- A browser with Twitter/X logged in
- Windows (Linux/macOS support coming)

### 3 Steps to Tweet Data

```bash
# 1. Install bb-browser and patch for AutoClaw
npm install -g bb-browser && bb-browser site update
node patch-bridge.js

# 2. Open x.com and log in
openclaw browser start
openclaw browser open https://x.com
# → Log in to your Twitter account in the browser window

# 3. Scrape tweets
bb-browser site twitter/tweets elonmusk --count 5 --openclaw --json
```

That's it. You're scraping tweets.

## 🔧 What The Patch Does

The auto-patcher ([patch-bridge.js](patch-bridge.js)) makes 4 surgical changes to bb-browser's bridge file:

| # | Change | Why |
|---|--------|-----|
| 1 | `npx` → AutoClaw's built-in node path | bb-browser defaults to npm's `openclaw` which lacks browser support |
| 2 | Remove `"openclaw"` arg prefix | AutoClaw's `openclaw.mjs` doesn't need the `openclaw` subcommand |
| 3 | Tabs timeout: 15s → 60s | AutoClaw startup needs more time than the default |
| 4 | Evaluate timeout: 120s → 180s | Complex page evaluations need extra safety margin |

**The patch is idempotent** — run it multiple times safely. It auto-backs up the original file.

## 📋 Verified Platforms

| Platform | Adapter | Status | How it works |
|----------|---------|--------|-------------|
| **Twitter/X** | `twitter/tweets` | ✅ Verified | GraphQL API + cookie auth |
| **Twitter/X** | `twitter/search` | ✅ Verified | Search API + cookie auth |
| Reddit | `reddit/hot` | ✅ Verified | Cookie-based fetch |
| 微博 Weibo | `weibo/hot` | ✅ Verified | Cookie-based fetch |
| 知乎 Zhihu | `zhihu/hot` | ✅ Needs login | Cookie-based fetch |
| Bilibili | `bilibili/popular` | ✅ Verified | Cookie-based fetch |
| HackerNews | `hackernews/top` | ⚠️ CORS blocked | Firebase API blocked in browser context |

### More Examples

```bash
# Search tweets
bb-browser site twitter/search "AI Agent" --count 10 --openclaw --json

# Reddit front page
bb-browser site reddit/hot --openclaw --json

# Weibo trending
bb-browser site weibo/hot --openclaw --json

# Zhihu hot questions (needs login)
bb-browser site zhihu/hot --openclaw --json

# Filter with jq
bb-browser site twitter/tweets elonmusk --count 5 --openclaw --json | jq '.tweets[] | {text, likes}'
```

## ⚠️ Known Issues

- `npm update -g bb-browser` overwrites the patch — re-run `node patch-bridge.js`
- x.com requires network access (China users need a proxy)
- HackerNews uses public Firebase API which gets CORS-blocked in browser context (not a bridge issue)
- Xiaohongshu adapter has XHR interception cache bugs — unreliable

## 🤝 For AutoClaw Users (One-Prompt Setup)

Copy the entire content of [SETUP.md](SETUP.md) and paste it to your AutoClaw AI. It will automatically:

1. Install bb-browser
2. Run the patch script
3. Start the browser and open x.com
4. Wait for your manual login
5. Verify by scraping tweets

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for bug reports, feature requests, and pull requests.

## License

[MIT](LICENSE) — Use it however you want.

## Related

- [bb-browser](https://github.com/epiral/bb-browser) — The core tool that makes websites into CLI commands
- [AutoClaw](https://github.com/nicepkg/openclaw) — AI agent framework with built-in browser control

---

<div align="center">

**If this saved you from Twitter API rate limits, ⭐ star this repo!**

Made with 🦞 by [Lobster Company](https://github.com/AIwork4me)

</div>
