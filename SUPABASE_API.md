# ChemWordle Supabase API 文件

本文件描述後端所有可呼叫的 RPC 函式與認證流程。
**前端只能使用以下 API,不可直接 SELECT / INSERT / UPDATE / DELETE 任何資料表。**

---

## 認證流程(Supabase Auth + Magic Link)

### Magic Link 註冊(第一次)

```js
const { error } = await supabase.auth.signInWithOtp({
  email: `${studentId}@${EMAIL_DOMAIN}`,
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${SITE_URL}/#/auth-callback`,
    data: {
      student_id: studentId,    // 字串,9 碼(學生)或 6 碼(教職員)
      name: userName,            // 字串,至少 2 字元
      role: roleType             // 'student' 或 'teacher'
    }
  }
});

if (error) {
  // 處理錯誤
  // 常見:rate limit、email 格式錯誤
}
```

**注意**:
- `data` 中的 `student_id`、`name`、`role` 會傳到 Supabase Auth metadata
- 後端的 `handle_new_user` trigger 會在使用者第一次點 Magic Link 後讀取這些資料,並在 `students` 表建立 profile
- 若 trigger 內驗證失敗(如學號格式錯、重複註冊),會 raise exception,使用者點連結會看到錯誤
- 對應的錯誤訊息(後端 raise):
  - `INVALID_STUDENT_ID`: 學生學號必須是 9 位數字
  - `INVALID_TEACHER_ID`: 教職員編號必須是 6 位數字
  - `INVALID_NAME`: 姓名至少需要 2 個字元
  - `DUPLICATE_ID`: 此編號已註冊過,請直接登入

### Magic Link 登入(已註冊)

```js
const { error } = await supabase.auth.signInWithOtp({
  email: `${studentId}@${EMAIL_DOMAIN}`,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: `${SITE_URL}/#/auth-callback`
  }
});
```

**注意**:`shouldCreateUser: false`,且不需要傳 `data`。

### 登出

```js
await supabase.auth.signOut();
```

### 取得當前使用者

```js
const { data: { user } } = await supabase.auth.getUser();
// user 為 null 代表未登入
// user.id 是 auth.users.id(uuid)
// user.email 是註冊用的 email
```

### 監聽認證狀態變化

```js
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED' 等
  // session 是當前的 session,登出時為 null
});
```

---

## 遊戲核心 RPC

### `get_today_puzzle_info()`

取得今日題目狀態,前端開遊戲頁時呼叫。**不需要參數**。

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
  "puzzle_date": "2026-04-17",
  "word_length": 6,
  "guess_count": 3,
  "solved": true,
  "score": 80,
  "guesses": [
    { "word": "OXYGEN", "colors": ["green","gray","yellow","gray","gray","gray"] },
    { "word": "ABCDEF", "colors": ["gray","gray","gray","gray","gray","gray"] },
    { "word": "CARBON", "colors": ["green","green","green","green","green","green"] }
  ]
}
```

#### 狀態 3:進行中(或還沒開始)
```json
{
  "status": "in_progress",
  "puzzle_date": "2026-04-17",
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
**注意**:`answer` 只在 `solved=false` 時有值,猜中時為 null。

#### error
```json
{
  "error": "wrong_length",
  "message": "必須是 6 個字母"
}
```

**所有可能的錯誤代碼**:
| error | 中文訊息 | 場景 |
|---|---|---|
| `not_authenticated` | 請先登入 | 未登入 |
| `no_puzzle_today` | 今日無題 | 今天沒排題 |
| `invalid_chars` | 只能輸入英文字母 | 含中文/符號 |
| `wrong_length` | 必須是 6 個字母 | 長度不對 |
| `already_completed` | 今日已完成,明天再來 | 已寫入 attempts |
| `max_attempts_reached` | 已用完 6 次 | session 已滿 |

前端錯誤處理建議:
```js
const { data } = await supabase.rpc('submit_guess', { guess_input });
if (data.error) {
  showToast(data.message);
  return;
}
if (data.status === 'continue') {
  // 顯示顏色,等下一次
} else if (data.status === 'finished') {
  // 顯示結束畫面
}
```

---

## 統計 RPC

### `get_my_monthly_stats(target_month date default null)`

取得我的本月統計。**需要登入**。

```js
// 不帶參數 = 當月
const { data } = await supabase.rpc('get_my_monthly_stats');

// 指定月份
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
- `active_days_so_far`:本月「已開放」的天數(用來算「5/7」這種顯示)
- `played_today`:今天是否已完成

---

### `get_monthly_leaderboard(target_month date default null, top_n int default 10)`

取得月排行榜。**需要登入**。

```js
const { data } = await supabase.rpc('get_monthly_leaderboard');

// 自訂前 N 名
const { data } = await supabase.rpc('get_monthly_leaderboard', {
  top_n: 20
});
```

**回傳**:
```json
{
  "month": "2026-04-01",
  "top": [
    {
      "rank": 1,
      "student_no": "412345678",
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
- `my_rank` 在當月還沒玩過時會是 `null`
- `top` 在當月沒任何人玩時會是 `[]`
- 同分排序:總分降序 → 答對次數降序 → 平均猜測次數升序
- **目前不回傳 role**,排行榜暫時不顯示「(教師)」標記

**前端處理學號遮罩**:
```js
function maskStudentNo(no) {
  if (!no) return '';
  if (no.length === 9) return no.slice(0,3) + '***' + no.slice(-3);
  if (no.length === 6) return no.slice(0,2) + '**' + no.slice(-2);
  return no;
}
```

---

## 訪客模式 RPC(不需要登入)

### `get_guest_puzzle()`

取得訪客可玩的題目(昨天的題,或 fallback)。**不需要參數**。

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

**欄位**:
- `puzzle_id`:這題的 UUID,接下來呼叫 `try_guess` 要傳這個
- `is_fallback`:
  - `false`:正在玩昨天的正式題
  - `true`:沒有昨天的題,系統用了 fallback(OXYGEN)

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

**回傳**:
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

**錯誤回傳**:
| error | 場景 |
|---|---|
| `puzzle_not_found` | puzzle_id 不存在 |
| `puzzle_not_available` | 試圖玩今天或未來的題(防作弊) |
| `invalid_chars` | 含非英文字母 |
| `wrong_length` | 長度不對 |

---

## 資料模型摘要

(僅供前端理解,**不要直接 query 這些表**)

### `students`
```
id           uuid (= auth.users.id)
student_id   text (學號或職員編號)
name         text
role         text ('student' / 'teacher' / 'admin')
class_name   text
created_at   timestamptz
updated_at   timestamptz
```

### `daily_puzzles`
```
id           uuid
puzzle_date  date (台灣時間日期)
answer       text (前端不該看到)
word_length  int
category     text
is_active    boolean
```

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
student_id   uuid
puzzle_date  date
guesses      jsonb
is_complete  boolean
updated_at   timestamptz
```

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

建議在 `src/api.js` 把所有 RPC 包成乾淨的函式:

```js
import { supabase } from './supabase-client.js';

export async function getTodayPuzzle() {
  const { data, error } = await supabase.rpc('get_today_puzzle_info');
  if (error) throw error;
  return data;
}

export async function submitGuess(guess) {
  const { data, error } = await supabase.rpc('submit_guess', {
    guess_input: guess
  });
  if (error) throw error;
  return data;
}

export async function getMyStats(month = null) {
  const params = month ? { target_month: month } : {};
  const { data, error } = await supabase.rpc('get_my_monthly_stats', params);
  if (error) throw error;
  return data;
}

export async function getLeaderboard(month = null, topN = 10) {
  const params = { top_n: topN };
  if (month) params.target_month = month;
  const { data, error } = await supabase.rpc('get_monthly_leaderboard', params);
  if (error) throw error;
  return data;
}

export async function getGuestPuzzle() {
  const { data, error } = await supabase.rpc('get_guest_puzzle');
  if (error) throw error;
  return data;
}

export async function tryGuess(puzzleId, guess) {
  const { data, error } = await supabase.rpc('try_guess', {
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
- 檢查 Supabase Dashboard → Authentication → Email 設定
- 預設使用 Supabase 的 SMTP,有 rate limit(免費方案 4 emails/hour)
- 如果寄不出去,可能要設定自己的 SMTP

### 學生收到 Magic Link 但點了沒反應
- 檢查 redirectTo URL 是否正確
- 檢查 Supabase Dashboard → Authentication → URL Configuration → Redirect URLs 是否包含你的網址

### 註冊失敗
- 後端 trigger 會 raise exception
- error 物件會包含原因(INVALID_STUDENT_ID 等)
- 前端要解析這些訊息並顯示中文

### Session 過期
- Supabase Client 預設會自動 refresh
- 如果 session 真的過期,RPC 呼叫會回 401
- 應該重新導向到 `#/login`
