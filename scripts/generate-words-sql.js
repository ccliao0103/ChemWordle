#!/usr/bin/env node
// 從 scripts/data/wordsN.txt 產生 scripts/seed-words-N.sql。
//
// 用法:
//   node scripts/generate-words-sql.js          # 預設產 6 字字典
//   node scripts/generate-words-sql.js 5        # 產 5 字字典
//   node scripts/generate-words-sql.js 6        # 產 6 字字典(明示)

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const len = parseInt(process.argv[2] || '6', 10);
if (!Number.isFinite(len) || len < 3 || len > 10) {
  console.error(`[gen-sql] ✗ 字長參數無效:${process.argv[2]}`);
  process.exit(1);
}

const SRC = resolve(ROOT, `scripts/data/words${len}.txt`);
const OUT = resolve(ROOT, `scripts/seed-words-${len}.sql`);
const BATCH_SIZE = 2000;

const raw = readFileSync(SRC, 'utf8');
const re = new RegExp(`^[A-Z]{${len}}$`);
const words = raw
  .split(/\r?\n/)
  .map((s) => s.trim().toUpperCase())
  .filter((s) => re.test(s));

const unique = Array.from(new Set(words)).sort();
console.log(`[gen-sql] ${len} 字 — 從 ${words.length} 行讀到 ${unique.length} 個唯一詞`);

const lines = [];
lines.push(`-- ChemWordle 字典:有效猜測詞清單(${len} 字)`);
lines.push(`-- 從 ENABLE 字典 (Public Domain) 抽出 ${len} 字英文詞,共 ${unique.length} 個`);
lines.push(`-- 由 scripts/generate-words-sql.js 自動產生,請勿手動編輯`);
lines.push(`-- 在 Supabase SQL Editor 整個貼上執行;可重複跑(ON CONFLICT DO NOTHING)`);
lines.push('');
lines.push('-- ─────────────────────────');
lines.push('-- 1) 確保資料表存在(若已存在會 no-op)');
lines.push('-- ─────────────────────────');
lines.push('create table if not exists public.valid_words (');
lines.push('  word text primary key');
lines.push(');');
lines.push('');
lines.push('-- 寬鬆長度約束:支援 4–10 字(若舊約束 length=6 存在,先 drop)');
lines.push('alter table public.valid_words drop constraint if exists valid_words_word_check;');
lines.push('alter table public.valid_words add constraint valid_words_word_check');
lines.push('  check (length(word) between 4 and 10 and word = upper(word));');
lines.push('');
lines.push('alter table public.valid_words enable row level security;');
lines.push('');
lines.push('-- ─────────────────────────');
lines.push(`-- 2) 批次插入 ${unique.length} 個詞,每批 ${BATCH_SIZE}`);
lines.push('-- ─────────────────────────');

for (let i = 0; i < unique.length; i += BATCH_SIZE) {
  const chunk = unique.slice(i, i + BATCH_SIZE);
  lines.push('');
  lines.push(`-- 批次 ${Math.floor(i / BATCH_SIZE) + 1}:第 ${i + 1} ~ ${Math.min(i + BATCH_SIZE, unique.length)} 個詞`);
  lines.push('insert into public.valid_words(word) values');
  const valueLines = chunk.map((w, idx) => {
    const sep = idx === chunk.length - 1 ? '' : ',';
    return `  ('${w}')${sep}`;
  });
  lines.push(...valueLines);
  lines.push('on conflict (word) do nothing;');
}

lines.push('');
lines.push('-- ─────────────────────────');
lines.push('-- 3) 驗證');
lines.push('-- ─────────────────────────');
lines.push(`select count(*) filter (where length(word) = ${len}) as count_${len}_letter,`);
lines.push('       count(*) as total_in_dict');
lines.push('from public.valid_words;');
lines.push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
const sizeKB = Math.round(Buffer.byteLength(lines.join('\n'), 'utf8') / 1024);
console.log(`[gen-sql] ✓ 已寫入 ${OUT}(${sizeKB} KB)`);
