#!/usr/bin/env node
// 從 scripts/data/words6.txt 產生 scripts/seed-words.sql。
//
// scripts/data/words6.txt 是純文字檔,每行一個大寫 6 字英文字。
// 本腳本產生:
//   - CREATE TABLE valid_words(word text primary key) IF NOT EXISTS
//   - 多筆 batched INSERT(每批 2000 字,約 6~8 個 statement),
//     ON CONFLICT DO NOTHING 讓你可重複執行不報錯
//
// 執行方式:
//   node scripts/generate-words-sql.js
// 完成後:用 Supabase SQL Editor 開 scripts/seed-words.sql 整個貼上跑一次

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SRC = resolve(ROOT, 'scripts/data/words6.txt');
const OUT = resolve(ROOT, 'scripts/seed-words.sql');
const BATCH_SIZE = 2000;

const raw = readFileSync(SRC, 'utf8');
const words = raw
  .split(/\r?\n/)
  .map((s) => s.trim().toUpperCase())
  .filter((s) => /^[A-Z]{6}$/.test(s));

const unique = Array.from(new Set(words)).sort();
console.log(`[gen-sql] 從 ${words.length} 行讀到 ${unique.length} 個唯一 6 字英文詞`);

const lines = [];
lines.push('-- ChemWordle 字典:有效猜測詞清單');
lines.push(`-- 從 ENABLE 字典 (Public Domain) 抽出 6 字英文詞,共 ${unique.length} 個`);
lines.push(`-- 由 scripts/generate-words-sql.js 自動產生,請勿手動編輯`);
lines.push(`-- 在 Supabase SQL Editor 整個貼上執行;可重複跑(ON CONFLICT DO NOTHING)`);
lines.push('');
lines.push('-- ─────────────────────────');
lines.push('-- 1) 建立資料表');
lines.push('-- ─────────────────────────');
lines.push('create table if not exists public.valid_words (');
lines.push('  word text primary key check (length(word) = 6 and word = upper(word))');
lines.push(');');
lines.push('');
lines.push('-- 啟用 RLS,但不建立任何 policy → 一般 client 無法 SELECT');
lines.push('-- (RPC 用 security definer 跨過 RLS 做存在性檢查就好)');
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
lines.push('select count(*) as total_words from public.valid_words;');
lines.push(`-- 預期:${unique.length}`);
lines.push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
const sizeKB = Math.round(Buffer.byteLength(lines.join('\n'), 'utf8') / 1024);
console.log(`[gen-sql] ✓ 已寫入 ${OUT}(${sizeKB} KB)`);
