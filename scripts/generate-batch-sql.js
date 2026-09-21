#!/usr/bin/env node
// 從 word-candidates-batchN.md 產生入庫 SQL。
//
// 用法:
//   node scripts/generate-batch-sql.js
//
// 讀:  scripts/word-candidates-batch4.md
//       scripts/word-candidates-batch5.md
// 產:  scripts/seed-batch4-5.sql
//
// 訪客池規則:
//   - md 的「訪客」欄有填任何非空白字元 → 強制進訪客池
//   - 沒人工標的話,從 ★ 難度自動挑(跨類別平均分配)補到 GUEST_TARGET 題
//
// 注意:daily_puzzles 有約束 is_guest_pool=true ⇔ puzzle_date is null,
//       所以一個字只能屬於其中一池。

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCES = [
  'scripts/word-candidates-batch4.md',
  'scripts/word-candidates-batch5.md'
];
const OUT = 'scripts/seed-batch4-5.sql';

// 自動挑訪客池的目標題數(現有 26 題 → 補到 ~66)
const GUEST_TARGET = 40;

// daily 題目的佔位日期起點(per-user queue 下日期只是 metadata)
const DATE_START = '2026-07-05';

// ── 解析 md 表格 ─────────────────────────
function parseMd(path) {
  const raw = readFileSync(resolve(ROOT, path), 'utf8');
  const lines = raw.split(/\r?\n/);
  const rows = [];
  let section = null;

  for (const line of lines) {
    // "## 7. 儀器分析(19 題)" → "儀器分析"(全形括號,故用 [^(] 切)
    const secM = line.match(/^##\s+\d+\.\s*([^(]+)/);
    if (secM) { section = secM[1].trim(); continue; }

    // | WORD ⚠️ 👤 | 中文 | 類別 | ★★ | 訪客 | zh | en |
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 7) continue;

    const wordCell = cells[0];
    const word = wordCell.replace(/[⚠️👤\s]/gu, '').toUpperCase();
    if (!/^[A-Z]{5,6}$/.test(word)) continue;   // 跳過表頭與分隔線

    rows.push({
      word,
      zh: cells[1],
      category: cells[2],
      difficulty: (cells[3].match(/★/g) || []).length,
      guestMark: cells[4].length > 0,
      zhDesc: cells[5],
      enDesc: cells[6],
      section,
      source: path
    });
  }
  return rows;
}

const all = [];
for (const src of SOURCES) all.push(...parseMd(src));

// ── 去重防呆 ─────────────────────────────
const seen = new Map();
for (const r of all) {
  if (seen.has(r.word)) {
    console.error(`✗ 重複:${r.word}(${seen.get(r.word).source} / ${r.source})`);
    process.exit(1);
  }
  seen.set(r.word, r);
}

// ── 決定訪客池 ───────────────────────────
const manualGuest = all.filter(r => r.guestMark);
let guest = [...manualGuest];

if (guest.length < GUEST_TARGET) {
  // 從 ★ 難度挑,跨類別輪流(round-robin)以求多樣
  const byCat = new Map();
  for (const r of all) {
    if (r.difficulty !== 1) continue;
    if (guest.includes(r)) continue;
    if (!byCat.has(r.section)) byCat.set(r.section, []);
    byCat.get(r.section).push(r);
  }
  const cats = [...byCat.keys()];
  let i = 0;
  while (guest.length < GUEST_TARGET && cats.length > 0) {
    const cat = cats[i % cats.length];
    const pool = byCat.get(cat);
    if (pool && pool.length > 0) {
      guest.push(pool.shift());
    } else {
      cats.splice(i % cats.length, 1);
      continue;
    }
    i++;
  }
}

const guestSet = new Set(guest.map(r => r.word));
const daily = all.filter(r => !guestSet.has(r.word));

// ── 產生佔位日期 ─────────────────────────
function dateAfter(startISO, offsetDays) {
  const d = new Date(startISO + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── SQL escape ───────────────────────────
const q = s => `'${String(s).replaceAll("'", "''")}'`;

// ── 組 SQL ───────────────────────────────
const lines = [];
lines.push('-- ═══════════════════════════════════════════════════════════════════');
lines.push('-- ChemWordle 題庫擴充:batch4 + batch5');
lines.push('--');
lines.push('-- 由 scripts/generate-batch-sql.js 自動產生,請勿手動編輯。');
lines.push('-- 要改題目請改 word-candidates-batch4.md / batch5.md 後重跑生成器。');
lines.push('--');
lines.push(`-- 每日題庫:${daily.length} 題`);
lines.push(`-- 訪客池  :${guest.length} 題`);
lines.push(`-- 合計    :${all.length} 題`);
lines.push('--');
lines.push('-- 用法:整段複製貼到 Supabase SQL Editor → Run。');
lines.push('-- 注意:answer 會由既有 trigger 自動同步進 valid_words,不必另外處理。');
lines.push('-- ═══════════════════════════════════════════════════════════════════');
lines.push('');
lines.push('');

// ── 每日題庫 ──
lines.push(`-- ─── 每日題庫(${daily.length} 題,佔位日期自 ${DATE_START} 起) ───`);
lines.push('insert into public.daily_puzzles');
lines.push('  (puzzle_date, answer, category, is_active, zh_name, zh_description, en_description)');
lines.push('values');
const dailyVals = daily.map((r, i) =>
  `  (${q(dateAfter(DATE_START, i))}, ${q(r.word)}, ${q(r.category)}, true, ${q(r.zh)}, ${q(r.zhDesc)}, ${q(r.enDesc)})`
);
lines.push(dailyVals.join(',\n') + ';');
lines.push('');
lines.push('');

// ── 訪客池 ──
lines.push(`-- ─── 訪客池(${guest.length} 題,puzzle_date 必須為 null) ───`);
lines.push('insert into public.daily_puzzles');
lines.push('  (puzzle_date, answer, category, is_active, is_guest_pool, zh_name, zh_description, en_description)');
lines.push('values');
const guestVals = guest.map(r =>
  `  (null, ${q(r.word)}, ${q(r.category)}, true, true, ${q(r.zh)}, ${q(r.zhDesc)}, ${q(r.enDesc)})`
);
lines.push(guestVals.join(',\n') + ';');
lines.push('');
lines.push('');

// ── 重洗所有學生的 queue ──
lines.push('-- ─── 重洗所有學生的 queue(讓新題目進入輪替) ───');
lines.push('delete from public.guess_sessions where is_complete = false;');
lines.push('truncate public.student_puzzle_queues;');
lines.push('');
lines.push('do $$');
lines.push('declare v_student record;');
lines.push('begin');
lines.push('  for v_student in select id from public.students loop');
lines.push('    perform public.shuffle_round_for_student(v_student.id);');
lines.push('  end loop;');
lines.push('end$$;');
lines.push('');
lines.push('');

// ── 驗證 ──
lines.push('-- ─── 驗證 ───');
lines.push('select');
lines.push('  (select count(*) from public.daily_puzzles where is_guest_pool=false and is_active=true) as daily_active,');
lines.push('  (select count(*) from public.daily_puzzles where is_guest_pool=true  and is_active=true) as guest_active,');
lines.push('  (select count(*) from public.valid_words) as dictionary_size,');
lines.push('  (select count(distinct student_id) from public.student_puzzle_queues) as students_reshuffled;');
lines.push('-- 預期:');
lines.push(`--   daily_active ≈ ${74 + daily.length}(原 74 + 本次 ${daily.length})`);
lines.push(`--   guest_active ≈ ${26 + guest.length}(原 26 + 本次 ${guest.length})`);
lines.push('');

writeFileSync(resolve(ROOT, OUT), lines.join('\n'), 'utf8');

// ── 報告 ─────────────────────────────────
console.log(`✓ 產出 ${OUT}`);
console.log(`  每日題庫 ${daily.length} 題`);
console.log(`  訪客池   ${guest.length} 題(人工標記 ${manualGuest.length},自動挑 ${guest.length - manualGuest.length})`);
console.log(`  合計     ${all.length} 題`);
console.log(`  佔位日期 ${DATE_START} → ${dateAfter(DATE_START, daily.length - 1)}`);
console.log('');
console.log('訪客池選出:');
const byCatGuest = new Map();
for (const r of guest) {
  if (!byCatGuest.has(r.section)) byCatGuest.set(r.section, []);
  byCatGuest.get(r.section).push(r.word);
}
for (const [cat, words] of byCatGuest) {
  console.log(`  ${cat}: ${words.join(' ')}`);
}
