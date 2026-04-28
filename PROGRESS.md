# ChemWordle 開發進度 / 接續指南

> 給「新對話接手」的速讀文件。最後更新:**2026-04-28**

---

## 30 秒了解專案

ChemWordle = 輔大化學系班級活動,化學英文 Wordle,每天一題,
**每位學生專屬洗牌題序**(防班群傳答案)。
活動期間 5/1 — 6/30,目前 4 位測試者(含你)註冊試玩中。

- **前端**:純 HTML/CSS/JS + Vite,無框架
- **後端**:Supabase(Auth + PostgreSQL + RPC + 23,868 詞字典)
- **部署**:Cloudflare Pages(自動 build on git push)
- **SMTP**:Resend + 自有 domain `ccllab-tw.com`(送達率 95%+)

---

## 重要連結

| 用途 | URL |
|---|---|
| Production | <https://chemwordle-a5p.pages.dev> |
| GitHub repo | <https://github.com/ccliao0103/ChemWordle> |
| Supabase 專案 | Dashboard 自己進 |
| Cloudflare Pages | Dashboard → Compute → Workers & Pages → chemwordle |
| Resend(SMTP) | <https://resend.com>(domain: ccllab-tw.com) |

---

## 目前全部功能(已上線)

### Auth & 使用者
- ✅ Email 自由註冊(任何 email,不限學校)+ Magic Link 登入
- ✅ 身分分類:大學部(化一/化二/化三/化四 + 甲/乙)/ 碩士 / 博士 / 教職員
- ✅ 30 天 session,瀏覽器自動 refresh
- ✅ 登出瞬間響應(scope='local',不打伺服器)

### 遊戲核心
- ✅ **Per-user shuffled queue**(每位學生專屬題序,Day N 從註冊日起算)
- ✅ 5/6 字混合題目(動態,跟著當日題目 word_length)
- ✅ 字典檢查擋亂打(8636 個 5 字 + 15232 個 6 字 = 23868 詞 ENABLE)
- ✅ 不在字典內**不佔次數**
- ✅ 缺席當天的題永遠跳過(不能補玩)
- ✅ Queue 用完自動再洗一輪(背景發生)
- ✅ 管理員加新 daily_puzzle → 自動 append 到所有學生 queue

### 訪客模式
- ✅ 從 21 題訪客池**隨機抽**(每次重玩可能不同)
- ✅ 與每日題庫完全獨立(`is_guest_pool=true`)

### UX
- ✅ 延遲揭曉:今日答案永不顯示;隔天登入 modal 揭曉(per-user)
- ✅ How to Play modal(NYT 風格中英並列,首訪自動彈 + ❓ 隨時可開)
- ✅ Header ❓ 說明 + ↻ 重新整理(救手機卡頓)
- ✅ 動態活動 banner(5/1 前/中/後三段式自動切)
- ✅ iOS double-tap 縮放修補(`touch-action: manipulation`)
- ✅ Footer 雙語 attribution(NYT Wordle 致敬 + 非商業教育聲明)

### 排行榜 / 統計
- ✅ 月排行榜(姓名 + 身分 tag,如「化三甲」「教職員」)
- ✅ 個人月統計(出席/答對/答錯/平均次數)
- ✅ 同分排序:總分 → 答對次數 → 平均猜測次數

---

## 後端 SQL 跑過順序(全新 Supabase 從零建)

依序在 SQL Editor 跑:

```
1. seed-words.sql                 # 6 字字典 15232 詞
2. seed-words-5.sql               # 5 字字典 8636 詞 + 放寬長度約束
3. rpc-dictionary-check.sql       # is_valid_guess_word helper
4. rpc-delayed-reveal.sql         # zh_name/zh_description 欄位 + RPC
5. rpc-guest-pool-and-en.sql      # en_description / is_guest_pool + RPC
6. fix-migration.sql              # students 改 email 模式 + handle_new_user trigger
7. rpc-leaderboard-class-name.sql # student_no → class_name
8. seed-daily-puzzles.sql         # 4/24-6/25 共 63 題 + 訪客池 21 題
9. seed-finale-week.sql           # 6/26-6/30 共 5 題收尾週
10. per-user-queue.sql            # 🆕 per-user 洗牌題序
```

---

## 已知不做的事(刻意 scope 外)

- ❌ 教師後台網頁(用 Supabase Dashboard)
- ❌ Email 通知功能
- ❌ 題庫管理 UI(SQL UPDATE)
- ❌ 密碼登入(只用 Magic Link)
- ❌ 註冊以外的個人資料修改

---

## 待辦 / 開放選項(下次接續可能想做的)

| 編號 | 項目 | 工時 | 備註 |
|---|---|---|---|
| **B** | 整站 EN/中切換(右上 🌐 toggle) | ~半天 | 給交換生用、化學系國際化形象 |
| **C** | 訪客池擴充 21 → 50 | 1-2 小時 | 需要更多 6 字化學詞候選 |
| **D** | 首頁「關於」摺疊 section | 30 分鐘 | 等使用者提供:聯絡 email/個人網頁/致謝 |
| 無 | 6/26-6/30 已排好 5 題,**不需追加** | — | seed-finale-week.sql 已跑 |

---

## 已知問題 / Workaround

### 「網頁卡住,點啥都沒反應」
- **症狀**:手機偶爾整個 UI 不回應,refresh 即恢復
- **可能根因**:modal animation 殘留(200ms `pointer-events` 漏關)— 已修補
- **使用者出口**:Header 右上 ↻ 按鈕,點下重新整理
- **下次發生時請**:F12 console 截圖 + 操作 sequence,讓我精準診斷

### Wordle 商標
- ChemWordle 名稱含 NYT 商標 "Wordle"
- 風險評估:< 0.01% 被追訴(教育用 + 非商業 + 小規模)
- 已加 disclaimer footer 降風險
- **若收到 NYT C&D**:rebrand 候選名 — ChemGuess / ChemTiles / ChemDle / Spectra

---

## 重要檔案速查

### 前端
```
src/main.js                    # 入口 + layout 建立 + 第一次 modal
src/auth.js                    # Magic Link 包裝
src/api.js                     # 7 個 RPC wrapper
src/router.js                  # Hash routing + auth guard
src/utils.js                   # email 驗證 + 錯誤碼翻譯
src/game-engine.js             # 共用遊戲引擎
src/pages/                     # 9 個頁面
src/components/                # header / board / keyboard / modal / howto-modal / toast / spinner
src/styles/                    # 6 個 CSS
```

### 設定與部署
```
public/config.local.js         # 你的 Supabase URL + anon key(gitignore)
.env.example                   # CF Pages env vars 範本
scripts/generate-config.js     # build 前產 config
scripts/postbuild-cleanup.js   # build 後清 dist/config.local.js
```

### 後端 SQL
```
scripts/seed-words.sql                  # 6 字字典
scripts/seed-words-5.sql                # 5 字字典
scripts/rpc-dictionary-check.sql        # 字典 helper
scripts/rpc-delayed-reveal.sql          # 延遲揭曉
scripts/rpc-guest-pool-and-en.sql       # 訪客池 + 英文解釋
scripts/fix-migration.sql               # email 模式 + handle_new_user
scripts/rpc-leaderboard-class-name.sql  # class_name leaderboard
scripts/seed-daily-puzzles.sql          # 4/24-6/25 排程
scripts/seed-finale-week.sql            # 6/26-6/30 收尾
scripts/per-user-queue.sql              # 🆕 per-user queue
```

### 字庫候選(已篩,可參考)
```
scripts/word-candidates.md          # 6 字 43 題
scripts/word-candidates-5.md        # 5 字 21 題
scripts/word-candidates-batch2.md   # 第二批 11 題(剩備案 6 題)
```

---

## 開新對話時這樣告訴 Claude

> 我有個 ChemWordle 專案,代碼在 `C:\Users\CCLiao\Documents\claude\projects\chemwordle`。
> 請先讀 `PROGRESS.md` 了解狀態,然後我們繼續做 [X 任務]。

或:

> 繼續 ChemWordle 開發。請讀 PROGRESS.md 跟 SUPABASE_API.md 同步狀態。今天我想做 [X]。

如果想做 B/C/D,直接說「做 B」/「做 C」/「做 D」即可,參數都在這份文件裡。

---

## 最近(2026-04-28)做的事

詳見 `C:\Users\CCLiao\Documents\claude\ob\2026-04-28.md` —
今天主要完成 per-user queue 系統 + UX 修補(↻ 按鈕)+ 法律 footer disclaimer。
