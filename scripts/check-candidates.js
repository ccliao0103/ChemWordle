#!/usr/bin/env node
// 檢查候選字:長度、是否已在題庫、是否在 ENABLE 字典
//
// 用法:node scripts/check-candidates.js <候選字檔>
//   候選字檔:一行一個字(大寫),# 開頭為註解
//
// 輸出:TSV,欄位 = WORD  LEN  IN_DB  IN_ENABLE  VERDICT

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── ENABLE 字典 ──────────────────────────
const enable = new Set(
  readFileSync(resolve(ROOT, 'scripts/data/enable1.txt'), 'utf8')
    .split(/\r?\n/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
);

// ── 現有題庫(從 seed SQL 撈 answer) ──────
const SEED_FILES = [
  'scripts/seed-daily-puzzles.sql',
  'scripts/seed-finale-week.sql',
  'scripts/rpc-guest-pool-and-en.sql',
  'scripts/batch3-incorporate.sql'
];
const existing = new Set();
for (const f of SEED_FILES) {
  let raw;
  try { raw = readFileSync(resolve(ROOT, f), 'utf8'); } catch { continue; }
  // 抓 (null, 'WORD', ...  或  ('2026-xx-xx', 'WORD', ...
  const re = /\(\s*(?:null|'\d{4}-\d{2}-\d{2}')\s*,\s*'([A-Z]{3,12})'/g;
  let m;
  while ((m = re.exec(raw)) !== null) existing.add(m[1]);
}

// ── 讀候選 ───────────────────────────────
const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/check-candidates.js <候選字檔>');
  process.exit(1);
}
const candidates = readFileSync(resolve(ROOT, file), 'utf8')
  .split(/\r?\n/)
  .map(s => s.trim().toUpperCase())
  .filter(s => s && !s.startsWith('#'));

// ── 檢查 ─────────────────────────────────
const seen = new Set();
const rows = [];
for (const w of candidates) {
  const len = w.length;
  const inDb = existing.has(w);
  const inEnable = enable.has(w);
  const dup = seen.has(w);
  seen.add(w);

  let verdict;
  if (dup) verdict = 'DUP_IN_LIST';
  else if (len < 5 || len > 6) verdict = `BAD_LEN(${len})`;
  else if (inDb) verdict = 'ALREADY_IN_DB';
  else if (!/^[A-Z]+$/.test(w)) verdict = 'BAD_CHARS';
  else verdict = inEnable ? 'OK' : 'OK_NOT_IN_ENABLE';

  rows.push({ w, len, inDb, inEnable, verdict });
}

// ── 輸出 ─────────────────────────────────
console.log('WORD\tLEN\tIN_DB\tIN_ENABLE\tVERDICT');
for (const r of rows) {
  console.log(`${r.w}\t${r.len}\t${r.inDb ? 'Y' : '-'}\t${r.inEnable ? 'Y' : '-'}\t${r.verdict}`);
}

// ── 摘要 ─────────────────────────────────
const tally = rows.reduce((acc, r) => {
  acc[r.verdict] = (acc[r.verdict] || 0) + 1;
  return acc;
}, {});
console.error('\n── 摘要 ─────────────');
console.error(`候選總數: ${rows.length}`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.error(`  ${k}: ${v}`);
}
console.error(`現有題庫: ${existing.size} 題`);
console.error(`ENABLE 字典: ${enable.size} 字`);
