#!/usr/bin/env node
/**
 * bb-browser AutoClaw Bridge Patcher v1.0.0
 *
 * Patches bb-browser's OpenClaw bridge file to work with AutoClaw's
 * built-in openclaw (which has full browser control).
 *
 * Features:
 *   - 4 surgical patches (path, prefix, timeouts)
 *   - Auto-backup of original file
 *   - Idempotent (safe to run multiple times)
 *   - Built-in verification after patching
 *
 * Usage:
 *   node patch-bridge.js
 *
 * Requirements:
 *   - bb-browser installed globally (npm install -g bb-browser)
 *   - AutoClaw installed (includes openclaw with browser support)
 *   - Windows (AutoClaw paths are Windows-specific)
 *
 * License: MIT
 */

const fs = require('fs');
const path = require('path');

const AUTOCLOW_NODE = 'C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\node\\\\node.exe';
const AUTOCLOW_MJS = 'C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\gateway\\\\openclaw\\\\openclaw.mjs';

console.log('🔧 bb-browser AutoClaw Bridge Patcher v1.0.0\n');

// ─── Locate bridge file ───────────────────────────────────────────
const dir = path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'bb-browser', 'dist');

if (!fs.existsSync(dir)) {
  console.error('❌ bb-browser is not installed.');
  console.error('   Run: npm install -g bb-browser');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f =>
  f.startsWith('openclaw-bridge-') &&
  f.endsWith('.js') &&
  !f.includes('.bak') &&
  !f.endsWith('.map')
);

if (files.length === 0) {
  console.error('❌ Bridge file not found in: ' + dir);
  console.error('   Ensure bb-browser is correctly installed.');
  process.exit(1);
}

if (files.length > 1) {
  console.log('⚠️  Multiple bridge files found. Using: ' + files[0]);
}

const filePath = path.join(dir, files[0]);
console.log('📂 Bridge file: ' + filePath);

// ─── Backup ────────────────────────────────────────────────────────
const backupPath = filePath + '.bak';
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('💾 Backup created: ' + backupPath);
} else {
  console.log('💾 Backup exists, skipping');
}

// ─── Read & Patch ──────────────────────────────────────────────────
let content = fs.readFileSync(filePath, 'utf8');
let patched = 0;
let warnings = 0;

// Patch 1: Replace npx with AutoClaw's built-in node + openclaw.mjs
const NPX_PATTERN = 'return execFileSync("npx", buildOpenClawArgs(args, timeout), {';
const AUTOCLOW_CALL = `return execFileSync("${AUTOCLOW_NODE}", ["${AUTOCLOW_MJS}", ...buildOpenClawArgs(args, timeout)], {`;

if (content.includes(NPX_PATTERN)) {
  content = content.replace(NPX_PATTERN, AUTOCLOW_CALL);
  console.log('✅ Patch 1: npx → AutoClaw built-in path');
  patched++;
} else if (content.includes(AUTOCLOW_NODE)) {
  console.log('⏭️  Patch 1: Already applied');
} else {
  console.log('⚠️  Patch 1: Pattern not found');
  const m = content.match(/return execFileSync\("[^"]*"[^}]*\{/);
  if (m) console.log('   Current: ' + m[0]);
  warnings++;
}

// Patch 2: Remove "openclaw" subcommand prefix from args
const OLD_ARGS = 'return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];';
const NEW_ARGS = 'return ["browser", subcommand, "--timeout", String(timeout), ...rest];';

if (content.includes(OLD_ARGS)) {
  content = content.replace(OLD_ARGS, NEW_ARGS);
  console.log('✅ Patch 2: Removed "openclaw" subcommand prefix');
  patched++;
} else if (content.includes(NEW_ARGS)) {
  console.log('⏭️  Patch 2: Already applied');
} else {
  console.log('⚠️  Patch 2: Pattern not found');
  warnings++;
}

// Patch 3: Increase tabs timeout (15s or 30s → 60s)
const TABS_FIXES = [
  ['runOpenClaw(["tabs", "--json"], 15e3)', 'runOpenClaw(["tabs", "--json"], 60e3)'],
  ['runOpenClaw(["tabs", "--json"], 30e3)', 'runOpenClaw(["tabs", "--json"], 60e3)'],
];
let p3 = false;
for (const [from, to] of TABS_FIXES) {
  if (content.includes(from)) {
    content = content.replace(from, to);
    console.log('✅ Patch 3: tabs timeout → 60s');
    patched++;
    p3 = true;
    break;
  }
}
if (!p3) {
  if (content.includes('runOpenClaw(["tabs", "--json"], 60e3)')) {
    console.log('⏭️  Patch 3: Already applied');
  } else {
    console.log('⚠️  Patch 3: Pattern not found');
    warnings++;
  }
}

// Patch 4: Increase evaluate timeout (120s → 180s)
const OLD_EVAL = 'var OPENCLAW_EVALUATE_TIMEOUT_MS = 12e4;';
const NEW_EVAL = 'var OPENCLAW_EVALUATE_TIMEOUT_MS = 18e4;';

if (content.includes(OLD_EVAL)) {
  content = content.replace(OLD_EVAL, NEW_EVAL);
  console.log('✅ Patch 4: evaluate timeout → 180s');
  patched++;
} else if (content.includes(NEW_EVAL)) {
  console.log('⏭️  Patch 4: Already applied');
} else {
  console.log('⚠️  Patch 4: Pattern not found');
  warnings++;
}

// ─── Write ─────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content);
console.log(`\n📝 ${patched > 0 ? patched + ' patch(es) applied' : 'No changes needed'}: ${filePath}`);

// ─── Verify ────────────────────────────────────────────────────────
console.log('\n🔍 Verifying patches...');
const verify = fs.readFileSync(filePath, 'utf8');

const checks = [
  ['AutoClaw path present',     verify.includes('AutoClaw')],
  ['No npx calls',              !verify.includes('execFileSync("npx"')],
  ['No openclaw prefix',        !verify.includes('"openclaw", "browser"')],
  ['tabs timeout ≥ 60s',       !verify.includes('15e3)') && !verify.includes('30e3)')],
  ['evaluate timeout 180s',     verify.includes('18e4')],
];

let allOk = true;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log('\n🎉 All patches verified!');
  console.log('\nNext steps:');
  console.log('  1. openclaw browser start');
  console.log('  2. openclaw browser open https://x.com');
  console.log('  3. Log into Twitter in the browser');
  console.log('  4. bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json');
  process.exit(0);
} else {
  console.log('\n⚠️  Some patches failed verification. Check the ❌ items above.');
  console.log('You may need to manually edit: ' + filePath);
  console.log('Original backup: ' + backupPath);
  process.exit(1);
}
