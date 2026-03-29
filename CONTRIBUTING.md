# Contributing to bb-browser-autoclaw

Thanks for your interest! Here's how to help:

## 🐛 Bug Reports

Open an [Issue](https://github.com/AIwork4me/bb-browser-autoclaw/issues) with:

1. **OS version** (e.g., Windows 11, macOS 15)
2. **bb-browser version** (`bb-browser --version`)
3. **AutoClaw version** (`openclaw --version`)
4. **What you ran** (exact command)
5. **What happened** (full error output)
6. **What you expected**

## 💡 Feature Requests

- New platform adapter testing results
- Linux/macOS compatibility patches
- Better error messages
- Auto-detection of AutoClaw install path

## 🔧 Pull Requests

1. Fork → Branch → PR
2. Test your change: `node patch-bridge.js` should still work
3. If adding new patches, add verification checks
4. Keep the patch script idempotent (safe to run multiple times)

## 🌍 Translations

README translations welcome! Add a `README.<lang>.md` and link it from the main README.

## 📋 Testing Checklist

Before submitting a PR, verify:

- [ ] `node patch-bridge.js` runs without errors on fresh bb-browser install
- [ ] `node patch-bridge.js` is idempotent (second run = "already patched")
- [ ] At least one platform verified (e.g., `twitter/tweets` returns data)

## Code of Conduct

Be respectful. Be constructive. Ship good work.
