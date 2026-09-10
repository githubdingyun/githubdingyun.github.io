#!/usr/bin/env node
/**
 * 删除护栏（PreToolUse hook）
 *
 * 拦截对博客文章目录的删除操作：
 *   - _posts/**           （标准 Jekyll 文章）
 *   - _includes/posts/**  （旧版 en/zh 双语文案）
 *
 * 规则：删除命令需连续「三次提醒」后，第四次执行才会真正放行。
 * 计数按目标路径（key）持久化到 .claude/delete-guard-state.json。
 */
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'delete-guard-state.json');
const MAX_REMINDERS = 3; // 提醒次数：前三次拦截，第四次放行

// ---- 工具函数 ----
function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function emit(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

function passThrough() {
  process.exit(0); // 不干预，正常放行
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// 是否包含删除类命令
function isDeleteCmd(cmd) {
  const c = cmd.toLowerCase();
  if (/\bgit\s+rm\b/.test(c)) return true;
  if (/remove-item/.test(c)) return true;
  if (/\brmdir\b/.test(c)) return true;
  if (/\bunlink\b/.test(c)) return true;
  if (/\bdel\b|\berase\b/.test(c)) return true;
  if (/(^|[;&|()\s])rm\s/.test(c)) return true;
  if (/-delete\b/.test(c)) return true; // find ... -delete
  return false;
}

// 从命令里提取被删除的目标（含 _posts 或 _includes/posts 的路径 token）
function extractTarget(cmd) {
  const norm = cmd.replace(/\\/g, '/');
  const m = norm.match(/[^\s'"`;|&()<>]*?(?:_posts|_includes\/posts)[^\s'"`;|&()<>]*/);
  if (!m) return null;
  return m[0].replace(/^\.\//, '').replace(/\/+$/, '');
}

// ---- 主流程 ----
function main() {
  const event = readStdin();
  if (event.tool_name !== 'Bash') return passThrough();

  const cmd = (event.tool_input && event.tool_input.command) || '';
  if (!isDeleteCmd(cmd)) return passThrough();

  const target = extractTarget(cmd);
  if (!target) return passThrough(); // 是删除命令，但未触及博客目录

  const state = readState();
  const count = typeof state[target] === 'number' ? state[target] : 0;

  if (count >= MAX_REMINDERS) {
    // 已提醒满三次，第四次放行，并重置计数
    const next = { ...state };
    delete next[target];
    writeState(next);
    return emit('allow', `已连续提醒 ${MAX_REMINDERS} 次，本次放行删除：${target}`);
  }

  const n = count + 1;
  writeState({ ...state, [target]: n });

  const remaining = MAX_REMINDERS - n;
  const headline = `⚠️【第 ${n} 次提醒${remaining === 0 ? '（最后一次）' : ''}】`;
  const tail =
    remaining > 0
      ? `还需 ${remaining} 次明确确认才会放行。`
      : '下次再执行该删除命令，将真正删除。';
  const reason = `${headline}\n你正在尝试删除博客文章：${target}\n删除护栏已拦截此操作（${n}/${MAX_REMINDERS} 次提醒）。${tail}\n若确认要删除，请再次明确告诉我「确认删除」。`;

  return emit('deny', reason);
}

main();
