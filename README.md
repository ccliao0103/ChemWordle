# ChemWordle

> 每天一題化學英文 Wordle — 輔仁大學化學系班級活動用

純靜態前端,後端由已部署好的 Supabase 專案提供(Magic Link 認證 + 自訂 RPC)。

---

## 技術棧

- **前端**:原生 HTML / CSS / JavaScript(無 React、無 jQuery、無 Tailwind)
- **建置工具**:[Vite 5](https://vitejs.dev/)(只用 dev server 與 static build)
- **後端**:[Supabase](https://supabase.com/)(Auth + PostgreSQL + RPC)
- **前端套件**:`@supabase/supabase-js` v2
- **部署**:[Cloudflare Pages](https://pages.cloudflare.com/)(任何靜態主機都行)
- **Node**:20 以上

## 目錄結構

```
chemwordle/
├── index.html                    # 入口 HTML(只有 <div id="app">)
├── package.json
├── vite.config.js
├── .env.example                  # CI / Cloudflare 用環境變數範本
├── .gitignore
├── public/                       # Vite 把整個 public/ 原樣複製到 dist/
│   ├── config.js                 # 預設 placeholder(commit 用)
│   ├── config.local.js           # 本機實際值(gitignore,自己複製)
│   ├── config.local.js.example   # 給你複製的範本
│   ├── favicon.svg
│   └── logo.png                  # 系 logo(自備;沒檔則 Header 顯示文字)
├── scripts/
│   ├── generate-config.js        # build 前:env vars → public/config.js
│   └── postbuild-cleanup.js      # build 後:從 dist/ 移除 config.local.js
└── src/
    ├── main.js                   # 入口
    ├── supabase-client.js
    ├── auth.js                   # Magic Link / signOut / getCurrentUser
    ├── router.js                 # Hash routing + auth guard
    ├── api.js                    # 6 個 RPC wrapper
    ├── utils.js                  # 學號遮罩、錯誤翻譯、parseHash
    ├── game-engine.js            # 遊戲共用引擎(game.js / guest.js 共用)
    ├── components/               # header / board / keyboard / toast / spinner
    ├── pages/                    # 9 個頁面(home / login / register / ... / leaderboard)
    └── styles/                   # 6 個 CSS 檔
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

## 環境變數

### 開發
不用 `.env`。`public/config.local.js` 會在瀏覽器執行時被載入,覆蓋 `public/config.js` 的 placeholder。

### Production build
`npm run build` 會跑 `scripts/generate-config.js`,從**環境變數**產生 `public/config.js`(覆蓋 placeholder),然後再讓 vite 打包進 `dist/`。

| 變數 | 必填 | 說明 |
|---|---|---|
| `SUPABASE_URL` | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | anon public key(JWT,`eyJ...`)|
| `EMAIL_DOMAIN` | ✅ | 學校信箱網域,預設 `mail.fju.edu.tw` |
| `SITE_URL` | ✅ | 部署後的網址,Magic Link 回呼用 |

`generate-config.js` 會做兩重檢查:
1. 任何欄位缺漏 → exit 1,build 中止
2. anon key 若被誤填成 `service_role` → exit 1

## 部署到 Cloudflare Pages

1. **推 repo 到 GitHub**(或任何 CF 支援的 git 平台)
2. **登入 Cloudflare → Pages → Create a project → Connect to Git**
3. **Build settings**:
   - Framework preset:`None`
   - Build command:`npm run build`
   - Build output directory:`dist`
   - Root directory:(留空)
   - Node version:`20`(在 Environment variables 設 `NODE_VERSION=20`)
4. **Environment variables**(全部選 `Production`,並視需要也加到 `Preview`):
   ```
   SUPABASE_URL          https://你的專案.supabase.co
   SUPABASE_ANON_KEY     eyJ...(anon public key)
   EMAIL_DOMAIN          mail.fju.edu.tw
   SITE_URL              https://你的網域.pages.dev
   NODE_VERSION          20
   ```
5. **Deploy** 第一次部署
6. **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** 加入兩個項目:
   ```
   http://localhost:5173/#/auth-callback         (本機開發)
   https://你的網域.pages.dev/#/auth-callback    (production)
   ```
   缺這個 → Magic Link 點了會跳到 Supabase 的錯誤頁

> **自訂網域**:CF Pages 設定自訂網域後,要記得**更新** `SITE_URL` 環境變數,並在 Supabase Redirect URLs 新增該網域。

## 把第一個帳號設成 admin

先用學生身分自助註冊,然後在 Supabase SQL Editor 執行:

```sql
update public.students
set role = 'admin'
where student_id = '你的學號';
```

admin 只是後台權限的標記,前端 UI 不會因此改變(管理用 Supabase Dashboard 直接操作)。

## 安全規範(必須遵守)

1. ✅ `public/config.local.js`、`.env*` 不可 commit(已在 `.gitignore`)
2. ✅ `SUPABASE_ANON_KEY` 只能填 anon public,不可填 service_role(`generate-config.js` 會擋)
3. ✅ 前端不直接 SELECT/INSERT/UPDATE/DELETE 資料表,全走 RPC
4. ✅ 前端不寫死任何題目答案
5. ✅ 「今天」的判斷由後端 `tw_today()` 決定,前端時區只用於顯示

## 常見問題排除

### Magic Link 寄不出去
- Supabase 免費方案 SMTP **限 4 封 / 小時**,容易卡關
- 看 Supabase Dashboard → Authentication → Email logs
- 真要量產:設定自己的 SMTP(SendGrid 等)

### 點 Magic Link 跳到 Supabase 錯誤頁
- 99% 是 Redirect URL 沒設好
- 檢查 Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs**
- 必須包含本機與 production 兩個 `/#/auth-callback`

### 點 Magic Link 後一直停在「登入中…」
- 看瀏覽器 DevTools Console,常見:
  - `otp_expired` → 連結過期/已用過,重申請新的
  - 網路問題:檢查 Supabase 專案是否在線

### Header 左邊只有「ChemWordle」文字
- 預期行為:`/logo.png` 不存在時的 fallback
- 把你的 logo 命名為 `logo.png` 放進 `public/`

### 開啟頁面就看到「Supabase 設定尚未完成」
- 沒做 Quickstart 第 2 步:沒複製 `public/config.local.js.example` → `public/config.local.js` 並填值
- 或者填的值是中文範例值(`你的專案`)

### Session 莫名過期
- Supabase Client 預設會自動 refresh token
- 真的過期 → RPC 回 401 → 自動導向 `/login`(已實作)

### Production build 失敗:`缺少必要環境變數`
- prebuild 步驟在保護你 — 缺哪個欄位就補哪個
- 本機臨時 build 測試:`SUPABASE_URL=... SUPABASE_ANON_KEY=... ... npm run build`

### Magic Link 收不到信
- 檢查垃圾信箱
- 等 1 分鐘
- 重新 Email 但學校 IT 可能擋外部寄信:跟 IT 詢問允許 supabase.co 的網域

## 不在這個 repo 內

依 SPEC,以下功能**刻意不做**(用 Supabase Dashboard 處理):
- 教師 / 管理員後台網頁
- Email 通知功能
- 題庫管理 UI
- 密碼登入
- 註冊以外的個人資料修改

## License

內部教學使用,無公開授權。
