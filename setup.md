# 提示词：全自动安装、修补、验证 bb-browser（AutoClaw 版）

> **目标**：从零开始安装 bb-browser，修改 AutoClaw 适配，启动浏览器登录 x.com，完成第一次抓取验证。
>
> **前置条件**：
> - 系统已安装 AutoClaw（内置 openclaw，支持 browser 命令）
> - 系统已安装 npm（用于全局安装 bb-browser）
> - Windows 系统（路径以 Windows 为例）
> - 如果在中国大陆，需要能访问 x.com 的网络环境
>
> **安全说明**：
> - 只修改 bb-browser 的 bridge 文件，不修改 AutoClaw 本身
> - 修改前必须先备份原文件
> - 推荐使用 Node.js 脚本精确修改，避免 PowerShell 转义问题

---

## 第一步：安装 bb-browser

在终端中全局安装 bb-browser，并拉取社区适配器：

```bash
npm install -g bb-browser
bb-browser site update
```

验证安装成功：

```bash
bb-browser --version
bb-browser site list
```

---

## 第二步：修改 openclaw bridge

bb-browser 默认调用 `npx openclaw` 来与浏览器交互，但 AutoClaw 内置的 openclaw 才支持 browser 命令。需要改为直接调用 AutoClaw 内置的 openclaw。

**推荐方式：用 Node.js 脚本精确修改**

创建一个临时脚本 `patch-bridge.js` 并执行：

```javascript
const fs = require('fs');
const path = require('path');

// 找到 bridge 文件
const dir = path.join(process.env.APPDATA, 'npm', 'node_modules', 'bb-browser', 'dist');
const files = fs.readdirSync(dir).filter(f => f.startsWith('openclaw-bridge-') && !f.includes('.bak') && !f.includes('.map'));
if (files.length === 0) {
  console.log('ERROR: Bridge file not found');
  process.exit(1);
}
const file = path.join(dir, files[0]);

// 备份
fs.copyFileSync(file, file + '.bak');
console.log('Backup created: ' + file + '.bak');

let content = fs.readFileSync(file, 'utf8');

// 修改 1: execFileSync 从 npx 改为 AutoClaw 内置 node + openclaw.mjs
const oldExec = 'return execFileSync("npx", buildOpenClawArgs(args, timeout), {';
const newExec = 'return execFileSync("C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\node\\\\node.exe", ["C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\gateway\\\\openclaw\\\\openclaw.mjs", ...buildOpenClawArgs(args, timeout)], {';

if (content.includes(oldExec)) {
  content = content.replace(oldExec, newExec);
  console.log('Patch 1 applied: npx -> AutoClaw node path');
} else if (content.includes('C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\node\\\\node.exe')) {
  console.log('Patch 1: Already patched, skipping');
} else {
  // Try to find the pattern and show what's there
  const match = content.match(/return execFileSync\("[^"]+",[^{]+\{/);
  console.log('Patch 1: Pattern not found. Current code:');
  console.log(match ? match[0] : 'Could not find execFileSync call');
  console.log('You may need to manually edit: ' + file);
}

// 修改 2: buildOpenClawArgs 去掉 "openclaw" 前缀
const oldArgs = 'return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];';
const newArgs = 'return ["browser", subcommand, "--timeout", String(timeout), ...rest];';

if (content.includes(oldArgs)) {
  content = content.replace(oldArgs, newArgs);
  console.log('Patch 2 applied: removed "openclaw" prefix');
} else if (content.includes('return ["browser", subcommand,')) {
  console.log('Patch 2: Already patched, skipping');
} else {
  console.log('Patch 2: Pattern not found (may already be patched in newer versions)');
}

// 修改 3: tabs 超时从 15s 改为 60s
if (content.includes('runOpenClaw(["tabs", "--json"], 15e3)')) {
  content = content.replace('runOpenClaw(["tabs", "--json"], 15e3)', 'runOpenClaw(["tabs", "--json"], 60e3)');
  console.log('Patch 3 applied: tabs timeout 15s -> 60s');
} else if (content.includes('runOpenClaw(["tabs", "--json"], 30e3)')) {
  content = content.replace('runOpenClaw(["tabs", "--json"], 30e3)', 'runOpenClaw(["tabs", "--json"], 60e3)');
  console.log('Patch 3 applied: tabs timeout 30s -> 60s');
} else {
  console.log('Patch 3: Pattern not found (may already be patched)');
}

// 修改 4: evaluate 超时从 120s 改为 180s（安全余量）
if (content.includes('var OPENCLAW_EVALUATE_TIMEOUT_MS = 12e4;')) {
  content = content.replace('var OPENCLAW_EVALUATE_TIMEOUT_MS = 12e4;', 'var OPENCLAW_EVALUATE_TIMEOUT_MS = 18e4;');
  console.log('Patch 4 applied: evaluate timeout 120s -> 180s');
} else {
  console.log('Patch 4: Pattern not found or already patched');
}

// 写入
fs.writeFileSync(file, content);
console.log('\nBridge file patched: ' + file);
console.log('Backup at: ' + file + '.bak');
```

执行：

```bash
node patch-bridge.js
```

确认输出包含 4 个 Patch 的 applied 或 skipping 信息。

---

## 第三步：启动浏览器、登录 x.com

启动 AutoClaw 内置浏览器并打开 x.com：

```bash
openclaw browser start
openclaw browser open https://x.com
```

**在浏览器中手动登录你的 Twitter 账号。** 登录完成后回来告诉 AI。

AI 验证登录状态：

```bash
openclaw browser tabs --json
```

确认有 x.com 的标签页后，进入下一步。

---

## 第四步：抓取验证

登录完成后，执行以下命令抓取指定用户的推文：

```bash
bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json
```

如果返回了包含 `id`、`text`、`likes`、`retweets`、`created_at` 字段的结构化数据，说明全程验证通过。

也可以尝试其他用户：

```bash
bb-browser site twitter/tweets <任意用户名> --count 3 --openclaw --json
```

---

## 第五步：生成安装报告

确认后，请按以下格式生成安装报告：

```
## bb-browser 安装报告

| 项目 | 结果 |
|------|------|
| 安装版本 | bb-browser v0.x.x |
| Bridge 修改 | ✅ / ❌ |
| x.com 登录 | ✅ / ❌ |
| 推文抓取验证 | ✅ / ❌ |

### 验证数据样例
（粘贴 elonmusk 3 条推文的 JSON 输出）

### 异常说明
（如有任何问题，在此描述）
```

---

## 已知问题

| 问题 | 说明 |
|------|------|
| Gateway 超时 | 默认 120s，复杂查询可能超时，减少 `--count` |
| bb-browser 更新会覆盖修改 | npm 更新 bb-browser 后需要重新执行第二步 |
| 小红书适配器不太可靠 | XHR 拦截缓存切换有 bug，不建议依赖小红书适配器 |
| CORS 限制 | 公开 API（如 HackerNews Firebase）在浏览器环境可能被 CORS 阻止，但需要登录态的网站（Twitter/Reddit）不受影响 |

## 验证可靠性参考

| 平台 | 适配器 | 可靠性 | 原因 |
|------|--------|--------|------|
| Twitter/X | `twitter/tweets` | ✅ 可靠 | GraphQL API + cookie |
| Twitter/X | `twitter/search` | ✅ 可靠 | 搜索接口 + cookie |
| Reddit | `reddit/hot` | ✅ 可靠 | Cookie fetch |
| 微博 | `weibo/hot` | ✅ 可靠 | Cookie fetch |
| HackerNews | `hackernews/top` | ⚠️ CORS | Firebase API 在浏览器被 CORS 阻止 |
| 小红书 | `xiaohongshu/user_posts` | ❌ 不可靠 | XHR 拦截 + Vue store 缓存 bug |
