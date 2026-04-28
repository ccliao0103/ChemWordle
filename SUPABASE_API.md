# ChemWordle Supabase API 文件

本文件描述後端所有可呼叫的 RPC 函式與認證流程。
**前端只能使用以下 API,不可直接 SELECT / INSERT / UPDATE / DELETE 任何資料表。**

> 最後更新:2026-04-28(per-user shuffled queue 模型)
>
> **重大變化**:每位學生擁有專屬洗牌題序(`student_puzzle_queues`)。
> 同一天不同學生玩到的題目**不同**,防止班群傳答案。
> 所有 RPC **簽名與回傳結構不變**,只是內部邏輯改成從學生個人 queue 找題。

---

## 認證流程(Supabase Auth + Magic Link)

從 v2(email 模式)開始,**email 由使用者自由填**(任何信箱),不再從學號推導。

### 註冊(第一次)

```js
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,                 // 使用者自填的 email
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${SITE_URL}/#/auth-callback`,
    data: {
      name: userName,                // 必填,至少 2 字元
      role_category: 'undergrad',    // 必填,'undergrad' | 'master' | 'phd' | 'staff'
      year_tag: '化三',              // undergrad 必填,'化一'/'化二'/'化三'/'化四'
      class_tag: '甲',               // undergrad 必填,'甲'/'乙'
      student_id: '412345678'        // 可選,純文字,不限格式(兌獎時對身分用)
    }
  }
});
```

**後端 trigger `handle_new_user` 會在使用者第一次點 Magic Link 後讀這些 metadata,寫入 `students` 表,並自動計算 `class_name` 顯示 tag**:
- undergrad → `年級 + 班別`(如 `化三甲`)
- master → `碩士`
- phd → `博士`
- staff → `教職員`

**對應的錯誤訊息**(後端 raise,前端從 `error.message` 解析):
| 錯誤碼 | 中文訊息 |
|---|---|
| `INVALID_NAME` | 姓名至少需要 2 個字元 |
| `INVALID_ROLE_CATEGORY` | 請選擇身分(大學部 / 碩士 / 博士 / 教職員)|
| `INVALID_YEAR_TAG` | 大學部請選年級(化一 / 化二 / 化三 / 化四)|
| `INVALID_CLASS_TAG` | 大學部請選班別(甲 / 乙)|

### 登入(已註冊)

```js
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: `${SITE_URL}/#/auth-callback`
  }
});
```

`shouldCreateUser: false`,不需要傳 `data`。

### 登出

```js
await supabase.auth.signOut({ scope: 'local' });
// scope='local' 只清本地 session,不打伺服器(UI 不會卡)
// scope='global' 會 invalidate refresh token 在所有裝置
```

### 取得當前使用者 / 監聽認證變化

```js
const { data: { user } } = await supabase.auth.getUser();
// user.id = auth.users.id (uuid)
// user.email = 註冊用的 email
// user.user_metadata = { name, role_category, year_tag, class_tag, student_id }

supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' / 'SIGNED_OUT' / 'TOKEN_REFRESHED' ...
});
```

---

## 遊戲核心 RPC

### `get_today_puzzle_info()`

取得今日題目狀態。**需要登入**。**不需要參數**。

```js
const { data, error } = await supabase.rpc('get_today_puzzle_info');
```

**回傳結構(三種狀態之一)**:

#### 狀態 1:今日無題
```json
{
  "status": "no_puzzle",
  "message": "教師尚未排定今日題目"
}
```

#### 狀態 2:今日已完成
```json
{
  "status": "completed",
  "puzzle_date": "2026-04-23",
  "word_length": 6,
  "guess_count": 3,
  "solved": true,
  "score": 80,
  "guesses": [
    { "word": "OXYGEN", "colors": ["green","gray","yellow","gray","gray","gray"] },
    { "word": "PROBES", "colors": ["gray","gray","gray","gray","gray","gray"] },
    { "word": "CARBON", "colors": ["green","green","green","green","green","green"] }
  ]
}
```

> **注意**:`completed` 回傳**不含** `answer` 欄位(延遲揭曉:今日不洩漏答案)。前端若要顯示「答案是 X」,只能在 `solved=true` 時用 `guesses.last().word`。

#### 狀態 3:進行中(或還沒開始)
```json
{
  "status": "in_progress",
  "puzzle_date": "2026-04-23",
  "word_length": 6,
  "guesses": []
}
```

如果有進行中的猜測,`guesses` 會包含已猜過的內容。

---

### `submit_guess(guess_input text)`

提交一次猜測。**需要登入**。

```js
const { data, error } = await supabase.rpc('submit_guess', {
  guess_input: 'CARBON'
});
```

**回傳結構(三種之一)**:

#### `continue`(還沒結束)
```json
{
  "status": "continue",
  "colors": ["green", "yellow", "gray", "gray", "gray", "gray"],
  "guess_count": 2,
  "remaining": 4
}
```

#### `finished`(結束了)
```json
{
  "status": "finished",
  "colors": ["green", "green", "green", "green", "green", "green"],
  "solved": true,
  "guess_count": 3,
  "score": 80,
  "answer": null
}
```

> **延遲揭曉政策**:`answer` **永遠為 null**(不論 solved 與否)。猜中時前端從棋盤最後一列即可知道;失敗時不顯示,改寫「明日揭曉」文案。

#### error
```json
{
  "error": "not_in_dictionary",
  "message": "不是有效單字"
}
```

**所有錯誤代碼**:
| error | 中文訊息 | 場景 |
|---|---|---|
| `not_authenticated` | 請先登入 | 未登入 |
| `no_puzzle_today` | 今日無題 | 今天沒排題 |
| `invalid_chars` | 只能輸入英文字母 | 含中文/符號 |
| `wrong_length` | 必須是 N 個字母(N 跟著當日題目)| 長度不對 |
| `not_in_dictionary` | 不是有效單字 | 字典中沒有 |
| `already_completed` | 今日已完成,明天再來 | 已寫入 attempts |
| `max_attempts_reached` | 已用完 6 次 | session 已滿 |

> **`not_in_dictionary` 不佔用 6 次機會**:後端在字典檢查就 reject,不寫入 attempts/sessions。

---

### `get_yesterday_puzzle_reveal()` 🆕

取得昨日題目揭曉資訊(含中英解釋)。**需要登入**。**不需要參數**。

```js
const { data, error } = await supabase.rpc('get_yesterday_puzzle_reveal');
```

**回傳**:
```json
{
  "puzzle_date": "2026-04-22",
  "answer": "PHENOL",
  "zh_name": "苯酚",
  "zh_description": "芳香族醇類,具殺菌性,也是許多合成材料的原料。",
  "en_description": "An aromatic alcohol with antiseptic properties; raw material for many synthetics."
}
```

**昨日沒排題**:回傳 `null`。

**前端用法**:進 `/game` 時呼叫,若有結果且 `localStorage[chemwordle:revealed:{puzzle_date}]` 沒值,彈 modal 顯示。

---

## 統計 RPC

### `get_my_monthly_stats(target_month date default null)`

取得我的本月統計。**需要登入**。

```js
const { data } = await supabase.rpc('get_my_monthly_stats');
// 或指定月份:
const { data } = await supabase.rpc('get_my_monthly_stats', {
  target_month: '2026-04-01'
});
```

**回傳**:
```json
{
  "month": "2026-04-01",
  "attend_days": 5,
  "active_days_so_far": 7,
  "solved_count": 4,
  "failed_count": 1,
  "total_score": 380,
  "avg_guess_count": "3.20",
  "played_today": true
}
```

**欄位說明**:
- `attend_days`:本月已提交天數
- `active_days_so_far`:本月「已開放」的天數(算「5/7」這種顯示)
- `played_today`:今天是否已完成

---

### `get_monthly_leaderboard(target_month date default null, top_n int default 10)`

取得月排行榜。**需要登入**。

```js
const { data } = await supabase.rpc('get_monthly_leaderboard');
const { data } = await supabase.rpc('get_monthly_leaderboard', { top_n: 20 });
```

**回傳**:
```json
{
  "month": "2026-04-01",
  "top": [
    {
      "rank": 1,
      "class_name": "化三甲",
      "name": "王小明",
      "total_score": 700,
      "attend_days": 7,
      "solved_count": 7,
      "avg_guess_count": "2.50"
    }
  ],
  "my_rank": {
    "rank": 25,
    "total_score": 380,
    "attend_days": 5,
    "solved_count": 4
  }
}
```

**注意**:
- ⚠️ **欄位 `class_name` 取代了 `student_no`**(不再外露學號)
- `class_name` 即 `students.class_name`,自動從 role_category + year_tag + class_tag 計算
- `my_rank` 在當月還沒玩過時會是 `null`
- `top` 在當月沒任何人玩時會是 `[]`
- 同分排序:總分降序 → 答對次數降序 → 平均猜測次數升序

---

## 訪客模式 RPC(不需要登入)

### `get_guest_puzzle()`

從訪客池隨機抽一題。**不需要參數**。

```js
const { data } = await supabase.rpc('get_guest_puzzle');
```

**回傳**:
```json
{
  "puzzle_id": "uuid-xxx-xxx-xxx",
  "word_length": 6,
  "category": "element",
  "is_fallback": false
}
```

**邏輯**(2026-04-27 改版):
1. 從 `daily_puzzles where is_guest_pool = true and is_active = true` 隨機抽一題 → `is_fallback: false`
2. 訪客池空 → fallback 抽過去日期(`puzzle_date < tw_today`)最新一題 → `is_fallback: true`
3. 都沒有 → `{"error": "no_guest_puzzle"}`

**前端處理**:把 `puzzle_id` 存到 `sessionStorage`,每次 `try_guess` 都帶。

---

### `try_guess(puzzle_id uuid, guess_input text)`

訪客提交猜測,**不寫資料庫**。**不需要登入**。

```js
const { data } = await supabase.rpc('try_guess', {
  puzzle_id: storedPuzzleId,
  guess_input: 'CARBON'
});
```

**回傳**(成功):
```json
{
  "colors": ["green", "yellow", "gray", "gray", "gray", "gray"],
  "solved": false,
  "answer": null
}
```

猜中時:
```json
{
  "colors": ["green", "green", "green", "green", "green", "green"],
  "solved": true,
  "answer": "CARBON"
}
```

> **訪客猜中**才回 `answer`,失敗則 null。訪客玩完一題不公開答案(只有自己解開才知道)。

**錯誤回傳**:
| error | 場景 |
|---|---|
| `puzzle_not_found` | puzzle_id 不存在 |
| `puzzle_not_available` | 試圖玩今天/未來的「正規題」(防作弊。訪客池題目跳過此檢查)|
| `invalid_chars` | 含非英文字母 |
| `wrong_length` | 長度不對 |
| `not_in_dictionary` | 不是有效單字(同 submit_guess) |

---

## 資料模型摘要

僅供前端理解,**不要直接 query 這些表**。

### `students`
```
id              uuid (= auth.users.id)
email           text unique          🆕 主識別
name            text
role            text ('student' / 'teacher' / 'admin')
role_category   text ('undergrad'/'master'/'phd'/'staff')  🆕
year_tag        text (undergrad 才有,'化一'~'化四')         🆕
class_tag       text (undergrad 才有,'甲'/'乙')             🆕
class_name      text (顯示 tag,如「化三甲」「碩士」)         🆕 自動算
student_id      text (nullable,可選,給兌獎用)               改 nullable
created_at      timestamptz
updated_at      timestamptz
```

### `daily_puzzles`
```
id              uuid
puzzle_date     date (台灣時間日期。訪客池題目此欄為 null)   改 nullable
answer          text (前端不該看到)
word_length     int  (generated column = length(answer);自動 5 或 6)
category        text
is_active       boolean
is_guest_pool   boolean (default false;true = 訪客池題目)    🆕
zh_name         text (中文名,如「苯酚」)                     🆕
zh_description  text (中文解釋,給揭曉 modal 用)              🆕
en_description  text (英文解釋,給揭曉 modal 用)              🆕
```

**約束**(`daily_puzzles_date_pool_consistency`):
- `is_guest_pool = true` ⇔ `puzzle_date is null`
- `is_guest_pool = false` ⇔ `puzzle_date is not null`

### `attempts`(每人每天最多一筆)
```
id             uuid
student_id     uuid
puzzle_date    date
guess_count    int (1-6)
solved         boolean
score          int (0-100)
guesses        jsonb (array of {word, colors})
submitted_at   timestamptz
```

### `guess_sessions`(進行中的猜測,RPC 內部用)
```
student_id     uuid
puzzle_date    date
guesses        jsonb
is_complete    boolean
updated_at     timestamptz
```

### `valid_words`(字典)
```
word           text primary key
```
**約束**:`length(word) BETWEEN 4 AND 10 AND word = upper(word)`
**目前資料**:8636 個 5 字 + 15232 個 6 字 = 23868 個 ENABLE 字典英文詞

### `student_puzzle_queues`🆕(每位學生的專屬題序)
```
student_id     uuid (FK → students.id, ON DELETE CASCADE)
position       int  (0-indexed, 對應 Day N)
puzzle_id      uuid (FK → daily_puzzles.id)
round_number   int  (純記錄第幾輪洗牌)
added_at       timestamptz
PRIMARY KEY (student_id, position)
```
**邏輯**:
- 學生註冊時,trigger `handle_new_user` 自動呼叫 `shuffle_round_for_student()`
  把所有非訪客池 + active 的 daily_puzzles 隨機排序,塞 position 0..N-1
- 管理員 INSERT 新 daily_puzzle 時,trigger `on_daily_puzzle_inserted` 自動 append 到所有學生 queue 末尾
- Day N = `(tw_today() - student.created_at::date)`
- 學生今天玩 `queue[Day N]`;若 Day N 超過 max position,自動再洗一輪
- 缺席當天 → 該題永遠跳過(時間驅動,不補玩)

---

## 完整的 Supabase Client 初始化範例

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  window.CONFIG.SUPABASE_URL,
  window.CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true  // 重要:讓 magic link callback 自動處理
    }
  }
);
```

---

## API 呼叫包裝建議

`src/api.js` 把所有 RPC 包成乾淨的函式:

```js
import { getSupabase } from './supabase-client.js';

export async function getTodayPuzzle() {
  const { data, error } = await getSupabase().rpc('get_today_puzzle_info');
  if (error) throw error;
  return data;
}

export async function submitGuess(guess) {
  const { data, error } = await getSupabase().rpc('submit_guess', { guess_input: guess });
  if (error) throw error;
  return data;
}

export async function getYesterdayReveal() {
  const { data, error } = await getSupabase().rpc('get_yesterday_puzzle_reveal');
  if (error) throw error;
  return data;
}

export async function getMyMonthlyStats(month = null) {
  const params = month ? { target_month: month } : {};
  const { data, error } = await getSupabase().rpc('get_my_monthly_stats', params);
  if (error) throw error;
  return data;
}

export async function getMonthlyLeaderboard(month = null, topN = 10) {
  const params = { top_n: topN };
  if (month) params.target_month = month;
  const { data, error } = await getSupabase().rpc('get_monthly_leaderboard', params);
  if (error) throw error;
  return data;
}

export async function getGuestPuzzle() {
  const { data, error } = await getSupabase().rpc('get_guest_puzzle');
  if (error) throw error;
  return data;
}

export async function tryGuess(puzzleId, guess) {
  const { data, error } = await getSupabase().rpc('try_guess', {
    puzzle_id: puzzleId,
    guess_input: guess
  });
  if (error) throw error;
  return data;
}
```

---

## 常見錯誤處理

### Magic Link 寄不出去
- 已切到 Resend SMTP(`smtp.resend.com`,自有 domain `ccllab-tw.com`)
- 看 Resend Dashboard → Emails 確認有沒有寄出
- 沒寄出 → SMTP 設定可能跑掉,檢查 Supabase Authentication → Settings → SMTP Settings

### 學生收到 Magic Link 但點了沒反應
- 檢查 `redirectTo` URL 是否正確(SITE_URL 環境變數)
- Supabase Authentication → URL Configuration → Redirect URLs 必須包含本機與 production 兩個 `/#/auth-callback`
- iOS 加到主畫面後 PWA 模式 webview 跟 Safari session 隔離,建議學生用 Safari 書籤

### 註冊失敗(`Database error saving new user`)
- handle_new_user trigger 失敗
- 最可能 schema 沒到位:重跑 `scripts/fix-migration.sql`

### Session 過期
- Supabase Client 預設會自動 refresh(30 天)
- 真的過期 → RPC 回 401 → 前端 router 自動導向 `/login`

### 排行榜不顯示某些使用者
- 檢查 `students.class_name` 是否為 null(trigger 應該會自動填,但若是舊版 trigger 留下的孤立帳號可能沒填)
- 用 `update public.students set class_name = '...' where id = '...'` 補
