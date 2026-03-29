# bb-browser-autoclaw

> [bb-browser](https://github.com/epiral/bb-browser) 的 AutoClaw 适配指南 —— 克隆后一条命令抓取 x.com 推文

## 这是什么

[bb-browser](https://github.com/epiral/bb-browser) 把任何网站变成 CLI 命令。36+ 平台，100+ 命令 —— Twitter、Reddit、知乎、B站、微博。复用浏览器登录态，不需要 API Key。

本仓库解决一个关键问题：**bb-browser 的 `--openclaw` 模式默认无法工作**，需要修改 bridge 文件适配。

## ✅ 已验证可用

| 平台 | 适配器 | 状态 | 说明 |
|------|--------|------|------|
| **Twitter/X** | `twitter/tweets` | ✅ 可靠 | GraphQL API + cookie 登录态 |
| **Twitter/X** | `twitter/search` | ✅ 可靠 | 搜索推文 |
| Reddit | `reddit/hot` | ✅ 可靠 | Cookie fetch |
| 微博 | `weibo/hot` | ✅ 可靠 | Cookie fetch |
| HackerNews | `hackernews/top` | ⚠️ CORS | Firebase API 在浏览器环境被阻止，非 bridge 问题 |

## 一键安装（给 AutoClaw 的提示词）

把 [SETUP.md](SETUP.md) 的全部内容复制给 AutoClaw，它会自动完成：

1. 安装 bb-browser
2. 修改 OpenClaw bridge 文件
3. 启动浏览器并打开 x.com
4. 等你手动登录
5. 抓取推文验证

## 手动安装

如果你知道自己在做什么，按以下步骤操作：

### 1. 安装

```bash
npm install -g bb-browser
bb-browser site update
```

### 2. 修改 bridge

找到文件：

```powershell
# Windows
Get-ChildItem "$env:APPDATA\npm\node_modules\bb-browser\dist\openclaw-bridge-*.js" | Select-Object -First 1
```

**先备份原文件**，然后做以下修改：

**a)** `execFileSync` 调用从 `npx` 改为 AutoClaw 内置路径
```javascript
// FROM
return execFileSync("npx", buildOpenClawArgs(args, timeout), {...})
// TO
return execFileSync("C:\\Program Files\\AutoClaw\\resources\\node\\node.exe", ["C:\\Program Files\\AutoClaw\\resources\\gateway\\openclaw\\openclaw.mjs", ...buildOpenClawArgs(args, timeout)], {...})
```

**b)** `buildOpenClawArgs` 返回值去掉 `"openclaw"` 前缀
```javascript
// FROM
return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];
// TO
return ["browser", subcommand, "--timeout", String(timeout), ...rest];
```

**c)** tabs 超时从 15s 改为 60s
```javascript
// FROM
runOpenClaw(["tabs", "--json"], 15e3)
// TO
runOpenClaw(["tabs", "--json"], 60e3)
```

**d)** evaluate 超时从 120s 改为 180s
```javascript
// FROM
var OPENCLAW_EVALUATE_TIMEOUT_MS = 12e4;
// TO
var OPENCLAW_EVALUATE_TIMEOUT_MS = 18e4;
```

### 3. 验证

```bash
# 启动浏览器
openclaw browser start

# 先用一个可靠适配器验证 bridge 链路（会 CORS 失败，但能确认 bridge 通了）
bb-browser site hackernews/top 1 --openclaw --json
# 看到 "Command failed" 而不是 "spawnSync ... ETIMEDOUT" 就说明 bridge 链路通了
```

### 4. 登录 Twitter 并抓取

```bash
openclaw browser open https://x.com
# 手动登录你的 Twitter 账号，登录完成后告诉 AI

# 抓取推文
bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json
```

### 5. 确认安装报告

```
## bb-browser 安装报告

| 项目 | 结果 |
|------|------|
| 安装版本 | bb-browser v0.x.x |
| Bridge 修改 | ✅ / ❌ |
| x.com 登录 | ✅ / ❌ |
| 推文抓取验证 | ✅ / ❌ |
```

## 已知问题

- `npm update -g bb-browser` 会覆盖修改，需要重新执行步骤 2
- 小红书适配器有缓存切换 bug，结果不太可靠
- x.com 在中国大陆需要代理
- HackerNews Firebase API 在浏览器环境被 CORS 阻止（这是 adapter 本身的限制）

## 许可证

MIT
