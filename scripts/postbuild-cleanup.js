#!/usr/bin/env node
// Build 後清理:
// - 移除 dist/config.local.js(本機 build 時 Vite 會把整個 public/ 連 config.local.js
//   一起複製過來,本機開發者的真實 anon key 可能因此被打包進部署輸出)
// - 移除 dist/config.local.js.example(沒必要部署)
//
// CI/CD 環境因為 config.local.js 被 gitignore,checkout 後根本沒這檔,此腳本是 no-op。

import { existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const TO_REMOVE = [
  'dist/config.local.js',
  'dist/config.local.js.example'
];

let cleaned = 0;
for (const rel of TO_REMOVE) {
  const p = resolve(PROJECT_ROOT, rel);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`[postbuild] ✓ 移除 ${rel}`);
    cleaned += 1;
  }
}
if (cleaned === 0) {
  console.log('[postbuild] ✓ 無需清理(dist 中沒有 config.local.js)');
}
