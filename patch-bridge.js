#!/usr/bin/env node
/**
 * bb-browser AutoClaw Bridge Patcher
 * 
 * 一键修补 bb-browser 的 OpenClaw bridge 文件，适配 AutoClaw 内置环境。
 * 自动备份原文件，幂等执行（多次运行安全）。
 * 
 * 用法: node patch-bridge.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 bb-browser AutoClaw Bridge Patcher\n');

// ─── 找到 bridge 文件 ───
const dir = path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'bb-browser', 'dist');
if (!fs.existsSync(dir)) {
  console.error('❌ bb-browser 未安装。请先运行: npm install -g bb-browser');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f =>
  f.startsWith('openclaw-bridge-') && !f.includes('.bak') && !f.includes('.map')
);

if (files.length === 0) {
  console.error('❌ 找不到 bridge 文件。请确认 bb-browser 已正确安装。');
  process.exit(1);
}

const file = path.join(dir, files[0]);
console.log(`📂 Bridge 文件: ${file}`);

// ─── 备份 ───
const backup = file + '.bak';
if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log(`💾 备份已创建: ${backup}`);
} else {
  console.log(`💾 备份已存在，跳过`);
}

// ─── 读取并修补 ───
let content = fs.readFileSync(file, 'utf8');
let patched = 0;

// Patch 1: execFileSync 调用路径
const npxPattern = 'return execFileSync("npx", buildOpenClawArgs(args, timeout), {';
const autoclawPath = 'return execFileSync("C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\node\\\\node.exe", ["C:\\\\Program Files\\\\AutoClaw\\\\resources\\\\gateway\\\\openclaw\\\\openclaw.mjs", ...buildOpenClawArgs(args, timeout)], {';

if (content.includes(npxPattern)) {
  content = content.replace(npxPattern, autoclawPath);
  console.log('✅ Patch 1: npx -> AutoClaw 内置路径');
  patched++;
} else if (content.includes(autoclawPath)) {
  console.log('⏭️  Patch 1: 已应用，跳过');
} else {
  console.log('⚠️  Patch 1: 未找到匹配模式，可能需要手动修改');
  const match = content.match(/return execFileSync\("[^"]*"[^}]*\{/);
  if (match) console.log(`   当前代码: ${match[0]}`);
}

// Patch 2: 去掉 "openclaw" 前缀
const oldArgs = 'return ["openclaw", "browser", subcommand, "--timeout", String(timeout), ...rest];';
const newArgs = 'return ["browser", subcommand, "--timeout", String(timeout), ...rest];';

if (content.includes(oldArgs)) {
  content = content.replace(oldArgs, newArgs);
  console.log('✅ Patch 2: 移除 "openclaw" 前缀');
  patched++;
} else if (content.includes(newArgs)) {
  console.log('⏭️  Patch 2: 已应用，跳过');
} else {
  console.log('⚠️  Patch 2: 未找到匹配模式');
}

// Patch 3: tabs 超时 -> 60s
const tabsPatterns = [
  ['runOpenClaw(["tabs", "--json"], 15e3)', 'runOpenClaw(["tabs", "--json"], 60e3)'],
  ['runOpenClaw(["tabs", "--json"], 30e3)', 'runOpenClaw(["tabs", "--json"], 60e3)'],
];
let patch3Applied = false;
for (const [old, rep] of tabsPatterns) {
  if (content.includes(old)) {
    content = content.replace(old, rep);
    console.log(`✅ Patch 3: tabs 超时 -> 60s`);
    patched++;
    patch3Applied = true;
    break;
  }
}
if (!patch3Applied && content.includes('runOpenClaw(["tabs", "--json"], 60e3)')) {
  console.log('⏭️  Patch 3: 已应用，跳过');
} else if (!patch3Applied) {
  console.log('⚠️  Patch 3: 未找到匹配模式');
}

// Patch 4: evaluate 超时 -> 180s
const oldEval = 'var OPENCLAW_EVALUATE_TIMEOUT_MS = 12e4;';
const newEval = 'var OPENCLAW_EVALUATE_TIMEOUT_MS = 18e4;';

if (content.includes(oldEval)) {
  content = content.replace(oldEval, newEval);
  console.log('✅ Patch 4: evaluate 超时 -> 180s');
  patched++;
} else if (content.includes(newEval)) {
  console.log('⏭️  Patch 4: 已应用，跳过');
} else {
  console.log('⚠️  Patch 4: 未找到匹配模式');
}

// ─── 写入 ───
fs.writeFileSync(file, content);
console.log(`\n📝 ${patched > 0 ? `已应用 ${patched} 个补丁` : '无需修改'}: ${file}`);

// ─── 验证 ───
console.log('\n🔍 验证修补结果...');
const verify = fs.readFileSync(file, 'utf8');
const checks = [
  ['AutoClaw 路径', verify.includes('AutoClaw')],
  ['无 npx 调用', !verify.includes('execFileSync("npx"')],
  ['无 openclaw 前缀', !verify.includes('"openclaw", "browser"')],
  ['tabs 60s 超时', verify.includes('60e3)') || !verify.includes('15e3)')],
  ['evaluate 180s 超时', verify.includes('18e4')],
];

let allOk = true;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log('\n🎉 所有修补验证通过！');
  console.log('\n下一步:');
  console.log('  1. openclaw browser start');
  console.log('  2. openclaw browser open https://x.com');
  console.log('  3. 手动登录 Twitter');
  console.log('  4. bb-browser site twitter/tweets elonmusk --count 3 --openclaw --json');
} else {
  console.log('\n⚠️  部分修补未成功，请检查上方标记 ❌ 的项目。');
  console.log('可能需要手动修改 bridge 文件。');
  process.exit(1);
}
