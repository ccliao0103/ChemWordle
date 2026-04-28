# ChemWordle

> 每天一題化學英文 Wordle — 輔仁大學化學系班級活動用
>
> 線上版:<https://chemwordle-a5p.pages.dev>
> Repo:<https://github.com/ccliao0103/ChemWordle>

純靜態前端,後端由已部署好的 Supabase 專案提供(Magic Link 認證 + 自訂 RPC + ~24K 詞字典)。

---

## 技術棧

- **前端**:原生 HTML / CSS / JavaScript(無 React、無 jQuery、無 Tailwind)
- **建置工具**:[Vite 5](https://vitejs.dev/)(只用 dev server 與 static build)
- **後端**:[Supabase](https://supabase.com/)(Auth + PostgreSQL + RPC)
- **前端套件**:`@supabase/supabase-js` v2
- **部署**:[Cloudflare Pages](https://pages.cloudflare.com/)
- **SMTP**:[Resend](https://resend.com/) + 自有 domain `ccllab-tw.com`(Magic Link 寄送)
- **Node**:20 以上

## 功能總覽

- ✅ Email 自由註冊(任何 email,**不限**學校信箱)+ Magic Link 登入
- ✅ 身分分類:大學部(化一/化二/化三/化四 + 甲/乙)/ 碩士班 / 博士班 / 教職員
- ✅ 每日一題(5 字 OR 6 字隨題目;台灣時間 00:00 換新)
- ✅ 字典擋亂打(15K 個 6 字 + 8K 個 5 字 ENABLE 英文詞;不在字典中**不扣次數**)
- ✅ 訪客模式:從 21 題訪客池隨機抽,獨立於每日題庫
- ✅ 延遲揭曉:今日答案不顯示,**隔天**登入時 modal 揭曉(含中英文解釋)
- ✅ 月排行榜:顯示「化三甲 + 姓名」(無學號外露)
- ✅ How to Play modal(NYT 風格中英並列;首訪自動彈、❓ 隨時可開)
- ✅ 30 天 session(首次收信後不用再收信)

## 目錄結構

```
chemwordle/
├── index.html                       # 入口 HTML(含 PWA meta)
├── package.json
├── vite.config.js
├── .env.example                     # CI / Cloudflare 用環境變數範本
├── .gitignore
├── public/                          # Vite 把整個 public/ 原樣複製到 dist/
│   ├── config.js                    # 預設 placeholder(commit 用)
│   ├── config.local.js              # 本機實際值(gitignore)
│   ├── config.local.js.example
│   ├── favicon.svg
│   └── logo.png                     # 系 logo(自備;無檔則 Header 顯示文字)
├── scripts/                         # 後端 SQL + build 工具
│   ├── generate-config.js           # build 前:env vars → public/config.js
│   ├── postbuild-cleanup.js         # build 後:從 dist/ 移除 config.local.js
│   ├── generate-words-sql.js        # 從 ENABLE 字典產 seed-words-N.sql
│   ├── seed-words.sql               # 6 字字典 15232 詞
│   ├── seed-words-5.sql             # 5 字字典 8636 詞
│   ├── rpc-dictionary-check.sql     # is_valid_guess_word helper
│   ├── rpc-guest-pool-and-en.sql    # 訪客池 + en_description 欄位
│   ├── rpc-delayed-reveal.sql       # 延遲揭曉(zh_name/zh_description/RPC)
│   ├── migrate-to-email-model.sql   # email 註冊模式遷移(原版,有 bug)
│   ├── fix-migration.sql            # ↑ 的修補版(用這個)
│   ├── rpc-leaderboard-class-name.sql  # 排行榜改顯示 class_name
│   ├── seed-daily-puzzles.sql       # 4/24-6/25 排程 + 訪客池 21 題
│   ├── word-candidates.md           # 6 字化學詞候選清單
│   └── word-candidates-5.md         # 5 字化學詞候選清單
└── src/
    ├── main.js                      # 入口:載 config → init Supabase → mount header/router/modal
    ├── supabase-client.js           # lazy createClient
    ├── auth.js                      # signUp/signIn/signOut/getCurrentUser
    ├── router.js                    # Hash routing + auth guard
    ├── api.js                       # 7 個 RPC wrapper
    ├── utils.js                     # validateEmail / parseHash / 錯誤翻譯 / formatMonthZh
    ├── game-engine.js               # 遊戲共用引擎(game.js / guest.js 共用)
    ├── components/
    │   ├── header.js                # logo + ❓ + 登入/使用者選單
    │   ├── board.js                 # Wordle 棋盤(6 列 × N 格)
    │   ├── keyboard.js              # 虛擬 + 實體鍵盤監聽
    │   ├── toast.js                 # 通知
    │   ├── spinner.js               # loading
    │   ├── modal.js                 # 通用 modal
    │   └── howto-modal.js           # NYT 風格 How to Play(中英並列)
    ├── pages/                       # 9 個頁面 (home / login / register / check-email / auth-callback / game / guest / stats / leaderboard)
    └── styles/                      # 6 個 CSS 檔
```

## Quickstart(本機開發)

```bash
# 1. 裝依賴
npm install

# 2. 建立本機設定
cp public/config.local.js.example public/config.local.js
# 編輯 public/config.local.js,填入 Supabase URL 與 anon key
# (從 Supabase Dashboard → Project Settings → API 取)

# 3. 啟動 dev server
npm run dev
# 開瀏覽器:http://localhost:5173
```

> **⚠️ 重要**:`SUPABASE_ANON_KEY` 只能填 **anon public** key,**絕對不可**填 `service_role` key。後者擁有繞過所有 RLS 規則的能力,洩漏等同資料庫裸奔。

---

## 後端建置(全新 Supabase 專案要跑這順序)

依序在 Supabase SQL Editor 跑這些檔(整段貼上 → Run):

| # | 檔案 | 做什麼 |
|---|---|---|
| 1 | `seed-words.sql` | 建 valid_words 表 + 灌 6 字字典 15232 詞 |
| 2 | `seed-words-5.sql` | 加 5 字字典 8636 詞 + 放寬長度約束 |
| 3 | `rpc-dictionary-check.sql` | 建 `is_valid_guess_word()` helper |
| 4 | `rpc-delayed-reveal.sql` | daily_puzzles 加 zh_name/zh_description + 改 submit_guess |
| 5 | `rpc-guest-pool-and-en.sql` | 加 en_description / is_guest_pool + 改 get_guest_puzzle / try_guess |
| 6 | `fix-migration.sql` | students 表 schema 改 email 模式 + 重寫 handle_new_user trigger |
| 7 | `rpc-leaderboard-class-name.sql` | 排行榜改顯示 class_name(取代 student_no)|
| 8 | `seed-daily-puzzles.sql` | 排程 4/24-6/25 共 63 題每日 + 21 題訪客池 |
| 9 | `seed-finale-week.sql` | 6/26-6/30 收尾週 5 題 |
| 10 | `per-user-queue.sql` | 🆕 Per-user 洗牌題序(防班群傳答案)|

**注意**:後端某些 RPC(如 `submit_guess`、`try_guess`)在第 4、5、6 步重寫時會用 `CREATE OR REPLACE`,若你的後端有自訂版本,需要手動 merge。

---

## 環境變數

### 開發
**不用 `.env`**。`public/config.local.js` 會在瀏覽器執行時被載入,覆蓋 `public/config.js` 的 placeholder。

### Production build
`npm run build` 跑 `scripts/generate-config.js`,從**環境變數**產生 `public/config.js`,再讓 vite 打包進 `dist/`。

| 變數 | 必填 | 說明 |
|---|---|---|
| `SUPABASE_URL` | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | anon public key(JWT,`eyJ...`)|
| `EMAIL_DOMAIN` | ✅ | 預設 `mail.fju.edu.tw`(目前**不再**使用,但變數仍保留;之後做學號自動推導 email 才會用)|
| `SITE_URL` | ✅ | 部署網址(production:`https://chemwordle-a5p.pages.dev`)|

`generate-config.js` 會做兩重檢查:
1. 任何欄位缺漏 → exit 1,build 中止
2. anon key 若被誤填成 `service_role` → exit 1

---

## 部署到 Cloudflare Pages

1. **推 repo 到 GitHub**
2. **Cloudflare Dashboard → Compute → Workers & Pages → Get started → Pages → Import existing Git repository**
3. **Build settings**:
   - Framework preset:`None`
   - Build command:`npm run build`
   - Build output directory:`dist`
   - Root directory:留空
4. **Environment variables** + `NODE_VERSION=20`
5. **Deploy**
6. **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** 加入兩個項目:
   ```
   http://localhost:5173/#/auth-callback
   https://你的網域.pages.dev/#/auth-callback
   ```
   缺這個 → Magic Link 點了會跳到 Supabase 的錯誤頁

> **自訂網域**:CF Pages 設自訂網域後,要更新 `SITE_URL` 環境變數,並在 Supabase Redirect URLs 新增該網址。

---

## SMTP(Magic Link 寄信)

**強烈建議用 Resend + 自有 domain**(不要用 Supabase 內建 SMTP)。

### 為什麼?
- Supabase 內建 SMTP 限 4 封/小時(免費方案),班級註冊會卡關
- Gmail 個人帳號 SMTP **送學校信箱會被擋**(實測:輔大會擋 Supabase 透過 Gmail 寄的信)
- Resend 免費 100 封/天 + 3000 封/月,送達率 95%+

### 設定步驟(已做完,留檔備忘)
1. 買 domain(Porkbun ~$11/年,例:`ccllab-tw.com`)
2. DNS 換到 Cloudflare(免費)
3. Resend 註冊 + Add Domain → 加 4 筆 DNS(SPF / DKIM / MX / DMARC)→ Verify
4. Resend → API Keys → Create Sending key
5. Supabase Dashboard → Authentication → Settings → SMTP Settings:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `re_...` (API key)
   - Sender email: `noreply@你的domain`

---

## 把第一個帳號設成 admin

先用任意身分自助註冊,然後在 Supabase SQL Editor 執行:

```sql
update public.students
set role = 'admin'
where email = '你的email';
```

admin 只是後台權限的標記,前端 UI 不會因此改變(管理用 Supabase Dashboard 直接操作)。

---

## 安全規範(必須遵守)

1. ✅ `public/config.local.js`、`.env*` 不可 commit(已在 `.gitignore`)
2. ✅ `SUPABASE_ANON_KEY` 只能填 anon public,不可填 service_role
3. ✅ 前端不直接 SELECT/INSERT/UPDATE/DELETE 資料表,全走 RPC
4. ✅ 前端不寫死任何題目答案
5. ✅ 「今天」的判斷由後端 `tw_today()` 決定,前端時區只用於顯示
6. ✅ Magic Link refresh token 存 localStorage(瀏覽器隔離)

---

## 常見問題排除

### 學生收不到 Magic Link
1. 檢查信箱「垃圾郵件」資料夾
2. 若是學校信箱(`@mail.fju.edu.tw`):
   - 去 <https://spammail.fju.edu.tw/symphony/login.html> 登入
   - 找 "ChemWordle 登入連結" → 動作 → 加入個人白名單 + 重送
3. 改用 Gmail 之類的個人信箱重新註冊(送達率最高)

### 點 Magic Link 跳到 Supabase 錯誤頁
- 99% 是 Redirect URL 沒設好
- Supabase Dashboard → Authentication → URL Configuration → Redirect URLs 必須包含本機與 production 的 `/#/auth-callback`

### 點 Magic Link 後一直停在「登入中…」
- 看瀏覽器 DevTools Console:
  - `otp_expired` → 連結過期/已用過,重申請
  - 網路問題 → 檢查 Supabase 專案是否在線

### 註冊報「Database error saving new user」
- handle_new_user trigger 失敗。最可能 schema 沒到位:重跑 `scripts/fix-migration.sql`

### Header 左邊只有「ChemWordle」文字
- 預期行為:`/logo.png` 不存在時的 fallback
- 把你的 logo 命名為 `logo.png` 放進 `public/`

### 開啟頁面就看到「Supabase 設定尚未完成」
- 沒做 Quickstart 第 2 步,或填的是中文範例值

### Session 莫名過期
- Supabase Client 預設會自動 refresh token(30 天)
- 真的過期 → RPC 回 401 → 自動導向 `/login`

### Production build 失敗:`缺少必要環境變數`
- prebuild 步驟在保護你 — 缺哪個欄位就補哪個
- 本機臨時 build 測試:`SUPABASE_URL=... SUPABASE_ANON_KEY=... ... npm run build`

### 手機快速點擊鍵盤,螢幕會放大
- 已修:`touch-action: manipulation` 全域生效
- 仍可雙指 pinch 縮放(無障礙保留)

### 訪客每次玩都同一題
- 訪客池有 21 題,`get_guest_puzzle()` 用 `order by random()` 隨機抽
- 重整頁面才會抽新題(前端 sessionStorage 同 puzzle_id 不變)

---

## 不在這個 repo 內

依 SPEC,以下功能**刻意不做**(用 Supabase Dashboard 處理):
- 教師 / 管理員後台網頁
- Email 通知功能
- 題庫管理 UI(用 SQL UPDATE)
- 密碼登入(只用 Magic Link)
- 註冊以外的個人資料修改

## License

內部教學使用,無公開授權。
