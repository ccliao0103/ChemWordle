# ChemWordle 前端開發規格書

## 專案概述

**系統名稱**:ChemWordle
**使用情境**:輔仁大學化學系班級活動
**目標使用者**:200-600 名學生 + 教職員 + 訪客
**核心玩法**:每天一題化學英文 Wordle,全班同題,每人每天一次機會

## 技術選型

- **前端**:純 HTML / CSS / JavaScript(不用 React、不用框架)
- **建置工具**:Vite(只用來開 dev server 和 build 靜態檔)
- **後端**:Supabase(已建好,前端只呼叫 RPC)
- **JS 函式庫**:`@supabase/supabase-js` v2,以及必要時的 ES Modules
- **不要使用**:React、Vue、jQuery、Tailwind、其他大型框架

## 已確定的所有設計決策

### 遊戲規則
| 項目 | 決定 |
|---|---|
| 題目長度 | 6 字母(第一版固定) |
| 猜測次數 | 每天 6 次 |
| 提示機制 | 無(標準 Wordle) |
| 每日限制 | 每人每天最多一次正式作答 |
| 題目切換 | 台灣時間午夜 00:00 |
| 時區 | Asia/Taipei |

### 計分與獎勵
| 項目 | 決定 |
|---|---|
| 計分 | 1-6 次猜中 = 100/90/80/70/60/50 分,失敗 0 分 |
| 全勤獎 | 該月每天都有提交紀錄(不論對錯) |
| 高分獎 | 該月總分前 3 名 |
| 同分順序 | 總分 → 答對次數 → 平均猜測次數 |

### 身分系統
| 角色 | 識別方式 | 權限 |
|---|---|---|
| `student` | 9 碼數字學號 | 玩遊戲、看自己成績、看排行榜 |
| `teacher` | 6 碼數字編號 | 同學生(也參加遊戲) |
| `admin` | (你一人,後台手動設定) | 全部 + Supabase Dashboard |
| 訪客 | 不註冊 | 只能玩昨天的題,不存紀錄 |

### 帳號機制
- **註冊**:學生自助註冊(Magic Link)
- **登入**:Magic Link(學號 → 自動推 email → 寄連結)
- **密碼**:無
- **Email 推導**:`學號@mail.fju.edu.tw`
- **Session**:30 天

### UI 設計
| 項目 | 決定 |
|---|---|
| 整體風格 | 簡約黑白,參考 Wordle 配色 |
| Logo | 系 logo 放在 `public/logo.png` |
| 排行榜 | 顯示完整姓名,學生與教職員整合排榜 |
| 排行榜學號顯示 | 後 3 碼遮罩(例 `412***678`) |
| 響應式 | 桌機 / 手機都要好用 |

### 訪客模式
- 訪客玩**昨天的正式題**
- 第一天系統剛上線時,玩 fallback 題目(後端已準備 OXYGEN)
- 訪客**只能**玩昨天和更早的題目(後端強制檢查),防止用訪客模式破解今日題
- 訪客**不留任何紀錄**,不上排行榜

## 配色

```css
:root {
  /* 基本色 */
  --bg: #FFFFFF;
  --text: #1A1A1B;
  --text-secondary: #787C7E;
  --border: #D3D6DA;
  --border-active: #878A8C;

  /* Wordle 顏色(格子狀態) */
  --color-correct: #6AAA64;   /* green - 位置正確 */
  --color-present: #C9B458;   /* yellow - 字母在但位置錯 */
  --color-absent: #787C7E;    /* gray - 不存在 */

  /* 鍵盤 */
  --key-bg: #D3D6DA;
  --key-text: #1A1A1B;
  --key-bg-active: #878A8C;
}
```

## 字體

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Helvetica Neue",
  "Segoe UI",
  "PingFang TC",
  "Microsoft JhengHei",
  sans-serif;
```

- 標題、按鈕、Wordle 格子用粗體
- Wordle 格子大寫顯示,字母 font-size 大

## 頁面與路由

使用 hash routing(`#/login`, `#/game` 等),好處是純靜態部署不需要伺服器設定。

| Hash 路由 | 頁面 | 需登入 |
|---|---|---|
| `#/` | 首頁(三個入口) | 否 |
| `#/login` | 學生 / 教職員登入(輸入學號) | 否 |
| `#/register?role=student\|teacher` | 註冊頁 | 否 |
| `#/check-email` | 提示去信箱收連結 | 否 |
| `#/auth-callback` | Magic link 回調處理 | 否 |
| `#/game` | 今日遊戲(主頁) | 是 |
| `#/stats` | 我的本月統計 | 是 |
| `#/leaderboard` | 月排行榜 | 是 |
| `#/guest` | 訪客模式遊戲 | 否 |

未登入嘗試訪問 `#/game / #/stats / #/leaderboard` 應自動導向 `#/login`。

## 各頁面詳細需求

### 首頁 `#/`

**版面**:置中,簡潔。
- Logo + 系統名稱
- 一句說明:「每天一題化學英文 Wordle」
- 三個大按鈕:
  1. 「我是學生(9 碼學號)」→ `#/register?role=student`
  2. 「我是教職員(6 碼編號)」→ `#/register?role=teacher`
  3. 「訪客體驗」→ `#/guest`
- 下方小字:「已經有帳號?」→ `#/login`

**邏輯**:若已登入,「我是學生 / 教職員」按鈕直接跳 `#/game`。

### 註冊頁 `#/register`

**版面**:標題、表單、送出按鈕。

**從 query string 拿 role**(student / teacher),用來決定:
- 表單標題(「學生註冊」 / 「教職員註冊」)
- 學號欄位的格式驗證(9 碼 / 6 碼純數字)
- 傳給 `signInWithOtp` 的 `role` metadata

**欄位**:
1. 學號 / 編號(學生 9 碼,教職員 6 碼,即時格式驗證,不符顯示提示)
2. 姓名(至少 2 字元)

**互動**:
- 即時顯示推導出的 email:「我們會寄登入連結到 `412345678@mail.fju.edu.tw`」
- 「送出」按鈕:呼叫 `signInWithOtp({ email, options: { shouldCreateUser: true, data: { student_id, name, role }, emailRedirectTo: callback_url } })`
- 成功 → 跳 `#/check-email`
- 失敗(學號已被註冊等)→ Toast 提示

**錯誤訊息**:
- 「學生學號必須是 9 位數字」
- 「教職員編號必須是 6 位數字」
- 「姓名至少需要 2 個字元」
- 「此編號已註冊過,請直接登入」(後端會回 DUPLICATE_ID)

### 登入頁 `#/login`

**只一個欄位**:學號 / 編號(自動判斷 9 碼或 6 碼)。

**互動**:
- 「送出」呼叫 `signInWithOtp({ email, options: { shouldCreateUser: false } })`
- 成功 → 跳 `#/check-email`
- 失敗 → 顯示「找不到此帳號,請[註冊](連到首頁)」

### 收信提示頁 `#/check-email`

**內容**:
- 大標題:「請查收登入連結」
- 說明:「我們已寄出一封信到 `xxx@mail.fju.edu.tw`,請去信箱點擊連結。」
- 提醒:「若 1 分鐘內沒收到,請檢查垃圾信箱。」
- 「重新發送」按鈕(60 秒倒數冷卻)

### Auth Callback `#/auth-callback`

**功能**:處理 Supabase Magic Link redirect。

**流程**:
1. Supabase JS Client 會自動讀 URL 中的 hash 並交換 token
2. 顯示「登入中…」spinner
3. 完成後跳 `#/game`
4. 若 error,顯示錯誤並提供「回首頁」按鈕

### 遊戲頁 `#/game`(主頁)

**進入時**:呼叫 `get_today_puzzle_info()`,根據回傳 status 決定 UI。

#### 狀態 1:`no_puzzle`
顯示:「今日題目尚未開放,請明天再來。」
按鈕:「看我的成績」「看排行榜」

#### 狀態 2:`completed`(今日已完成)
顯示:
- 已完成的棋盤(從 `guesses` 還原顏色)
- 結果摘要:
  - 若 `solved=true`:「🎉 第 N 次猜中,得 X 分」
  - 若 `solved=false`:「未猜中,答案是 OOOOOO,得 0 分」
- 按鈕:「看我的成績」「看排行榜」

#### 狀態 3:`in_progress`(進行中或還沒開始)
顯示:
- 棋盤(已猜過的填入,剩下空白)
- 虛擬鍵盤(根據 `guesses` 染色)
- 提示:「按 Enter 送出」

**互動**:
- 實體鍵盤輸入(英文字母自動填格、Backspace 刪除、Enter 送出)
- 也可點虛擬鍵盤
- 送出時呼叫 `submit_guess({ guess_input: 'CARBON' })`

**送出後處理**:
- 收到 `continue` → 翻轉動畫顯示顏色,鍵盤更新染色,等下一次猜測
- 收到 `finished` → 翻轉動畫 → 結束畫面
- 收到 error → Toast 顯示對應中文訊息

**動畫**:
- 字母輸入:scale 動畫 100ms
- 顏色翻轉:flip 動畫 600ms,delay 從左到右各 100ms
- 失敗 shake 動畫 300ms

### 我的統計頁 `#/stats`

**進入時**:呼叫 `get_my_monthly_stats()`。

**版面**:卡片排版。

**顯示內容**:
- 大字:「N 月成績」
- 卡片群:
  - 總分:380
  - 出席:5 / 7 天(後者是當月已開放天數)
  - 答對:4 次
  - 答錯:1 次
  - 平均猜測:3.20 次
- 「今日狀態」徽章:「✓ 已完成」 / 「⚠ 尚未挑戰」
- 「看排行榜」按鈕

### 排行榜頁 `#/leaderboard`

**進入時**:呼叫 `get_monthly_leaderboard()`。

**版面**:
- 標題:「2026 年 4 月排行榜」(從回傳的 month 算)
- 前 10 名表格(欄位:排名 / 姓名 / 學號 / 總分 / 出席 / 答對)
  - 學號顯示:`412***678`(中間 3 碼遮罩)
- 我的排名區塊(突出顯示):「你的排名:第 25 名,380 分」
- 若我在前 10 名,排行榜該列加亮

**注意**:目前後端 RPC 沒回傳 role,**先不顯示「教師」標記**,留 TODO 註解。

### 訪客模式 `#/guest`

**進入時**:
1. 呼叫 `get_guest_puzzle()` 取題
2. 將 `puzzle_id` 存到 `sessionStorage`
3. 顯示頂部 banner:
   - 若 `is_fallback=false`:「訪客模式:你正在玩昨天的題目」
   - 若 `is_fallback=true`:「訪客體驗題」

**遊戲 UI**:同主遊戲頁,但「送出」呼叫 `try_guess({ puzzle_id, guess_input })`。

**結束**:
- 顯示結果(猜中 / 未猜中 + 答案)
- 「再玩一次」按鈕:重新呼叫 `get_guest_puzzle()`(因為跨午夜可能是新題)
- 「想參加排行榜?註冊」按鈕 → `#/`

**狀態管理**:訪客的猜測進度只存在記憶體中,重整頁面就消失(設計如此)。

## Header 設計

**所有頁面共用**:
- 左側:Logo(`public/logo.png`,失敗時顯示文字 "ChemWordle")
- 中間:標題 "ChemWordle"
- 右側:
  - **未登入**:「登入」按鈕 → `#/login`
  - **已登入**:「姓名 ▼」下拉選單(我的成績 / 排行榜 / 登出)

點 Logo 跳 `#/`(若已登入)或 `#/`(未登入)。

## 環境變數設計

由於是純靜態前端,需要兩層設定檔:

### `src/config.js`(可 commit,placeholder 值)
```js
window.CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  EMAIL_DOMAIN: 'mail.fju.edu.tw',
  SITE_URL: 'http://localhost:8080'
};
```

### `src/config.local.js`(.gitignore,實際值)
```js
window.CONFIG = {
  SUPABASE_URL: 'https://abcde.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGc...',
  EMAIL_DOMAIN: 'mail.fju.edu.tw',
  SITE_URL: 'http://localhost:8080'
};
```

### 載入邏輯
在 `index.html` 中:
```html
<script src="/src/config.js"></script>
<script>
  // 嘗試載入 local config 覆蓋(僅開發環境)
  const s = document.createElement('script');
  s.src = '/src/config.local.js';
  s.onerror = () => {}; // 沒有 local config 也 OK
  document.head.appendChild(s);
</script>
```

### 部署時的環境變數
Cloudflare Pages 部署時,在 build script 中用環境變數產生 `config.js`。
README 要說明這部分。

## 檔案結構(必須完全照這個)

```
chemwordle/
├── .env.example              # 範本(可 commit)
├── .gitignore                # 含 .env, config.local.js, node_modules, dist
├── README.md                 # 完整說明
├── package.json              # vite + supabase-js
├── vite.config.js            # Vite 設定
├── index.html                # 入口,做 hash routing
├── public/
│   ├── logo.png              # 系 logo(使用者自己放)
│   └── favicon.ico           # 預設 favicon
├── src/
│   ├── config.js             # 預設 config(placeholder)
│   ├── config.local.js.example  # 範本(教使用者複製成 config.local.js)
│   ├── main.js               # 入口 JS,初始化 router 和 supabase
│   ├── supabase-client.js    # 初始化 Supabase Client
│   ├── auth.js               # signIn/signOut/getUser 等
│   ├── router.js             # Hash routing
│   ├── api.js                # 包裝所有 RPC
│   ├── utils.js              # 通用工具(masking 學號、時間格式化等)
│   ├── pages/
│   │   ├── home.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── check-email.js
│   │   ├── auth-callback.js
│   │   ├── game.js
│   │   ├── guest.js
│   │   ├── stats.js
│   │   └── leaderboard.js
│   ├── components/
│   │   ├── header.js
│   │   ├── board.js          # Wordle 棋盤渲染
│   │   ├── keyboard.js       # 虛擬鍵盤
│   │   ├── toast.js          # 錯誤提示
│   │   └── spinner.js        # Loading
│   └── styles/
│       ├── main.css
│       ├── header.css
│       ├── board.css
│       ├── keyboard.css
│       ├── pages.css
│       └── animations.css
```

## 安全規範(必須遵守)

1. **`.env`、`config.local.js` 絕對不能 commit** — `.gitignore` 必須包含
2. **Service role key 絕對不能出現在前端任何檔案** — 我們只用 anon key
3. **前端不能直接 SELECT/INSERT 資料表** — 全部走 RPC
4. **前端不能寫死任何答案** — 答案永遠在後端
5. **前端時區判斷只用於顯示** — 所有「今天」的判斷由後端 `tw_today()` 處理

## README 必須包含

1. 專案介紹
2. 技術棧
3. 環境變數說明
4. 本機開發步驟:
   - `cp src/config.local.js.example src/config.local.js`
   - 編輯 `config.local.js` 填入 Supabase URL 和 anon key
   - `npm install`
   - `npm run dev`
   - 開瀏覽器訪問 `http://localhost:8080`
5. 部署到 Cloudflare Pages 步驟:
   - 連結 GitHub repo
   - Build command: `npm run build`
   - Output directory: `dist`
   - 環境變數設定方式
6. 把第一個帳號設成 admin 的 SQL:
   ```sql
   update public.students set role = 'admin' where student_id = '你的學號';
   ```
   (在 Supabase SQL Editor 執行)
7. 常見問題排除

## 不要做的事

- 不要做教師後台網頁(管理員直接用 Supabase Dashboard)
- 不要做 email 通知功能
- 不要做題庫管理 UI
- 不要做密碼登入功能(只用 magic link)
- 不要做註冊以外的個人資料修改
- 不要在前端寫死任何題目答案
- 不要使用 `from('xxx').select/insert/update/delete()`,**全部走 RPC**

## 開發流程建議

請依以下順序產出檔案,每完成一個批次跟我確認:

1. **批次 1**:`package.json`、`vite.config.js`、`.gitignore`、`.env.example`、`README.md` 骨架
2. **批次 2**:`index.html`、`src/config.js`、`src/config.local.js.example`、`src/main.js`、`src/supabase-client.js`
3. **批次 3**:`src/router.js`、`src/auth.js`、`src/api.js`、`src/utils.js`
4. **批次 4**:`src/components/*`(共用元件)+ 對應 CSS
5. **批次 5**:`src/pages/home.js`、`src/pages/login.js`、`src/pages/register.js`、`src/pages/check-email.js`、`src/pages/auth-callback.js`
6. **批次 6**:`src/pages/game.js`(最重要)、`src/pages/guest.js`
7. **批次 7**:`src/pages/stats.js`、`src/pages/leaderboard.js`
8. **批次 8**:完整 README、`.env.example` 整理、最終測試

每批次結束時告訴我:
- 這批做了哪些檔案
- 跑起來預期看到什麼
- 我下一步該做什麼測試
