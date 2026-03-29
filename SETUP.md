# AutoClaw Auto-Setup Prompt

> **Goal**: From scratch, install bb-browser, patch it for AutoClaw, launch browser, log into x.com, and verify tweet scraping.
>
> **Prerequisites**:
> - AutoClaw installed (includes `openclaw` with browser support)
> - npm available (for installing bb-browser)
> - Windows system (paths are Windows-style)
> - Network access to x.com (proxy needed in mainland China)
>
> **Safety**:
> - Only modifies bb-browser's bridge file, not AutoClaw itself
> - Always backs up original file before patching
> - Uses Node.js script for precise patching (avoids shell escaping issues)

---

## Step 1: Install bb-browser

Install bb-browser globally and pull community adapters:

```bash
npm install -g bb-browser
bb-browser site update
```

Verify:

```bash
bb-browser --version
bb-browser site list
```

---

## Step 2: Patch the OpenClaw Bridge

Run the included patch script:

```bash
node patch-bridge.js
```

Expected output — 4 patches applied (or "already patched" if run before):

```
🔧 bb-browser AutoClaw Bridge Patcher

📂 Bridge file: C:\...\openclaw-bridge-XXXXXXX.js
💾 Backup created: C:\...\openclaw-bridge-XXXXXXX.js.bak
✅ Patch 1: npx -> AutoClaw built-in path
✅ Patch 2: Removed "openclaw" prefix
✅ Patch 3: tabs timeout -> 60s
✅ Patch 4: evaluate timeout -> 180s

🔍 Verifying patches...
  ✅ AutoClaw path
  ✅ No npx call
  ✅ No openclaw prefix
  ✅ tabs 60s timeout
  ✅ evaluate 180s timeout

🎉 All patches verified!
```

---

## Step 3: Launch Browser & Log into x.com

Start AutoClaw's browser and open x.com:

```bash
openclaw browser start
openclaw browser open https://x.com
```

**Manually log into your Twitter account in the browser window.** Come back when done.

Verify login:

```bash
openclaw browser tabs --json
```

---

## Step 4: Scrape Tweets

Once logged in, scrape any user's tweets:

```bash
bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json
```

If you see structured JSON with `id`, `text`, `likes`, `retweets`, `created_at` fields — **congratulations, it works!**

Try other users:

```bash
bb-browser site twitter/tweets <any_username> --count 3 --openclaw --json
```

---

## Step 5: Report

Generate an installation report:

```
## bb-browser Installation Report

| Item | Result |
|------|--------|
| Version | bb-browser v0.x.x |
| Bridge patched | ✅ / ❌ |
| x.com login | ✅ / ❌ |
| Tweet scraping | ✅ / ❌ |

### Verification data
(paste elonmusk 3-tweet JSON output here)

### Issues
(describe any problems here)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `spawnSync ... ETIMEDOUT` | AutoClaw cold start is slow. Restart browser: `openclaw browser stop && openclaw browser start`, then retry. |
| `TypeError: Failed to fetch` on HN | Normal — HackerNews Firebase API is CORS-blocked. Twitter/Reddit work fine. |
| `bb-browser` command not found | Make sure npm global bin is in PATH: `npm config get prefix` |
| Patch says "pattern not found" | bb-browser may have updated its bridge code. Open an [Issue](https://github.com/AIwork4me/bb-browser-autoclaw/issues). |
