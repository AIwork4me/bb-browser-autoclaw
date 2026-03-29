# 提示词：全自动安装并验证 bb-browser（AutoClaw 版）

> **目标**：从零开始安装 bb-browser，修复 AutoClaw 兼容性，启动浏览器，登录 x.com，完成一条推文抓取验证。
>
> **注意**：
> - 你运行在 AutoClaw 环境中，系统中有一个内置的 openclaw（支持 browser 子命令）和一个 npm 全局安装的 openclaw（不支持 browser 子命令），注意辨别。
> - bb-browser 默认调用 `npx openclaw`，会指向错误的版本，需要修复。
> - Windows 环境，路径中有空格和反斜杠，注意转义。
> - 原始数据不要截断、不要改写，完整呈现。

---

## 第一步：安装 bb-browser

运行以下命令全局安装 bb-browser 并更新社区适配器库：

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

## 第二步：修复 openclaw bridge

bb-browser 调用 `npx openclaw` 来驱动浏览器，但这会指向 npm 全局的 openclaw（不支持 browser 子命令）。需要修改为直接调用 AutoClaw 内置的 openclaw。

找到编译后的 bridge 文件（文件名可能因版本不同而变化，在 `dist/` 目录下找包含 `openclaw-bridge` 的文件）：

```powershell
# 找到文件
$bridgeFile = Get-ChildItem "$env:APPDATA\npm\node_modules\bb-browser\dist\openclaw-bridge-*.js" | Select-Object -First 1
Write-Output "Bridge file: $($bridgeFile.FullName)"
```

对该文件做三处修改。**先备份原文件**，再逐项修改：

**修改 1**: 将 `runOpenClaw` 函数中的 `execFileSync` 调用从 `npx` 改为直接调用 AutoClaw 的 node + openclaw.mjs：

找到形如这样的代码（具体内容可能因版本略有不同，关键是 `execFileSync` 开头的那一行）：

```javascript
return execFileSync("npx", buildOpenClawArgs(args, timeout), {
```

替换为：

```javascript
return execFileSync("C:\\Program Files\\AutoClaw\\resources\\node\\node.exe", ["C:\\Program Files\\AutoClaw\\resources\\gateway\\openclaw\\openclaw.mjs", ...buildOpenClawArgs(args, timeout)], {
```

保持该行后面的 `encoding`、`timeout`、`stdio` 等参数不变。

**修改 2**: `buildOpenClawArgs` 函数的返回值中，去掉 `"openclaw"` 前缀：

找到：

```javascript
return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];
```

改为：

```javascript
return ["browser", subcommand, "--timeout", String(timeout), ...rest];
```

**修改 3**: 将 tabs 命令的超时时间从 15 秒增加到 30 秒（因为 AutoClaw 的 openclaw 启动需要加载插件，15 秒不够）：

找到：

```javascript
runOpenClaw(["tabs", "--json"], 15e3)
```

改为：

```javascript
runOpenClaw(["tabs", "--json"], 30e3)
```

修改完成后验证：

```bash
bb-browser site hackernews/top 1 --openclaw --json
```

如果返回了包含 `posts` 字段的 JSON 数据，说明修复成功。如果返回 CORS 错误（`Failed to fetch`），也说明 bridge 链路已通，只是 HackerNews 的 Firebase API 在浏览器内被 CORS 限制，可以继续下一步。

---

## 第三步：启动浏览器并登录 x.com

用 AutoClaw 内置的 browser 工具打开 x.com：

```
browser open https://x.com
```

**请手动登录你的 Twitter 账号。** 登录完成后告诉 AI。

AI 会检查登录状态：

```bash
openclaw browser tabs --json
```

确认有 x.com 标签页后，继续下一步。

---

## 第四步：抓取验证

登录完成后，运行以下命令抓取指定账户的推文：

```bash
bb-browser site twitter/tweets steipete --count 3 --openclaw --json
```

如果返回了结构化推文数据（包含 id、text、likes、retweets、created_at 字段），说明全流程验证通过。

也可以尝试其他账户：

```bash
bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json
```

---

## 第五步：输出安装报告

完成以上步骤后，输出以下格式的安装报告：

```
## bb-browser 安装报告

| 项目 | 结果 |
|------|------|
| 安装版本 | bb-browser v0.x.x |
| 适配器数量 | xxx 个 |
| Bridge 修复 | ✅ / ❌ |
| HackerNews 验证 | ✅ / ❌ |
| Twitter 登录 | ✅ / ❌ |
| 推文抓取验证 | ✅ / ❌ |

### 验证数据样本
（粘贴 steipete 最新 3 条推文的 JSON 输出）

### 异常说明
（如有问题，在此说明）
```

---

## 已知问题

| 问题 | 说明 |
|------|------|
| Gateway 超时 | 默认 20 秒，复杂 evaluate 可能超时，减少 count 参数 |
| bb-browser 升级覆盖修复 | npm 升级 bb-browser 后需要重新执行第二步 |
| 小红书适配器不可靠 | XHR 拦截方案有缓存 bug，不要依赖小红书适配器 |
| CORS 限制 | 部分公开 API（如 HackerNews Firebase）在浏览器内可能被 CORS 阻止，但需要登录态的网站 API 不受影响 |

## 验证可靠性参考

| 平台 | 适配器 | 可靠性 | 原因 |
|------|--------|--------|------|
| Twitter | twitter/tweets | ✅ 可靠 | GraphQL API + cookie |
| HackerNews | hackernews/top | ✅ 可靠 | 公开 Firebase API（可能被 CORS 限制） |
| Reddit | reddit/hot | ✅ 可靠 | Cookie fetch |
| 小红书 | xiaohongshu/user_posts | ❌ 不可靠 | XHR 拦截 + Vue store 缓存 bug |
