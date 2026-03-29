# bb-browser-autoclaw

bb-browser 在 AutoClaw 环境下的安装、修复和验证指南。

## 这是什么

[bb-browser](https://github.com/epiral/bb-browser) 把任何网站变成 CLI 命令。36+ 平台，100+ 命令——Twitter、Reddit、知乎、B站、微博等。复用你的浏览器登录态，不需要 API Key。

这个仓库解决一个具体问题：**bb-browser 在 AutoClaw 环境下默认无法工作**，需要修复 OpenClaw bridge 的兼容性。

## 一键安装

把 [SETUP.md](SETUP.md) 的全部内容复制到 AutoClaw 对话框，AutoClaw 会自动完成：

1. 安装 bb-browser
2. 修复 OpenClaw bridge 兼容性
3. 打开浏览器让你登录 x.com
4. 抓取推文验证
5. 输出安装报告

## 手动安装

如果你知道自己在做什么，按以下步骤操作：

### 1. 安装

```bash
npm install -g bb-browser
bb-browser site update
```

### 2. 修复 bridge

找到文件：

```bash
# Windows
dir %APPDATA%\npm\node_modules\bb-browser\dist\openclaw-bridge-*.js
```

备份后做三处修改：

**a)** `execFileSync` 调用从 `npx` 改为 AutoClaw 内置路径：
```javascript
// FROM
return execFileSync("npx", buildOpenClawArgs(args, timeout), {...})
// TO
return execFileSync("C:\\Program Files\\AutoClaw\\resources\\node\\node.exe", ["C:\\Program Files\\AutoClaw\\resources\\gateway\\openclaw\\openclaw.mjs", ...buildOpenClawArgs(args, timeout)], {...})
```

**b)** `buildOpenClawArgs` 返回值去掉 `"openclaw"` 前缀：
```javascript
// FROM
return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];
// TO
return ["browser", subcommand, "--timeout", String(timeout), ...rest];
```

**c)** tabs 超时从 15s 改为 30s：
```javascript
// FROM
runOpenClaw(["tabs", "--json"], 15e3)
// TO
runOpenClaw(["tabs", "--json"], 30e3)
```

### 3. 验证

```bash
bb-browser site hackernews/top 1 --openclaw --json
```

### 4. 登录 Twitter 并抓取

```bash
openclaw browser open https://x.com
# 手动登录后：
bb-browser site twitter/tweets steipete --count 3 --openclaw --json
```

## 已知问题

- `npm update -g bb-browser` 会覆盖修复，需要重新操作第 2 步
- 小红书适配器有缓存 bug，结果不可靠
- x.com 在中国大陆需要代理

## 许可

MIT
