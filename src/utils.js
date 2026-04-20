// 通用工具函式
//
// - 學號格式驗證與遮罩
// - Hash 路由解析
// - 錯誤碼 → 中文對照(遊戲、訪客、註冊 trigger)
// - 日期 / 月份格式化

// ─────────────────────────────────────────────
// 學號
// ─────────────────────────────────────────────

/**
 * 遮罩學號。
 * - 9 碼:412345678 → 412***678
 * - 6 碼:123456    → 12**56
 * - 其他長度:原樣回傳
 */
export function maskStudentNo(no) {
  if (!no) return '';
  const s = String(no);
  if (s.length === 9) return s.slice(0, 3) + '***' + s.slice(-3);
  if (s.length === 6) return s.slice(0, 2) + '**' + s.slice(-2);
  return s;
}

/**
 * 驗證學號格式。
 * @param {string} id
 * @param {'student'|'teacher'} role
 */
export function validateStudentId(id, role) {
  const s = String(id || '');
  if (!/^\d+$/.test(s)) return false;
  if (role === 'student') return s.length === 9;
  if (role === 'teacher') return s.length === 6;
  return false;
}

/**
 * 登入頁用:從學號長度推斷 role。
 * 9 碼 → student、6 碼 → teacher、其他 → null
 */
export function inferRoleFromId(id) {
  const s = String(id || '');
  if (!/^\d+$/.test(s)) return null;
  if (s.length === 9) return 'student';
  if (s.length === 6) return 'teacher';
  return null;
}

// ─────────────────────────────────────────────
// Hash 路由解析
// ─────────────────────────────────────────────

/**
 * 將 '#/register?role=student' 解析成 { path: '/register', params: { role: 'student' } }
 */
export function parseHash(hash) {
  const h = hash || window.location.hash || '#/';
  const withoutHash = h.startsWith('#') ? h.slice(1) : h;
  const [rawPath, rawQuery] = withoutHash.split('?');
  const path = rawPath || '/';
  const params = {};
  if (rawQuery) {
    const sp = new URLSearchParams(rawQuery);
    for (const [k, v] of sp) params[k] = v;
  }
  return { path, params };
}

/**
 * 反向產生 hash 字串。buildHash('/register', { role: 'student' }) → '#/register?role=student'
 */
export function buildHash(path, params) {
  let h = `#${path}`;
  if (params && Object.keys(params).length > 0) {
    const sp = new URLSearchParams(params);
    h += `?${sp.toString()}`;
  }
  return h;
}

// ─────────────────────────────────────────────
// 錯誤碼中文化
// ─────────────────────────────────────────────

// submit_guess 回傳的 error 代碼
const GAME_ERRORS = {
  not_authenticated: '請先登入',
  no_puzzle_today: '今日無題',
  invalid_chars: '只能輸入英文字母',
  wrong_length: '必須是 6 個字母',
  not_in_dictionary: '不是有效單字',
  already_completed: '今日已完成,明天再來',
  max_attempts_reached: '已用完 6 次'
};
export function translateGameError(errorCode) {
  if (!errorCode) return '未知錯誤';
  return GAME_ERRORS[errorCode] || `未知錯誤:${errorCode}`;
}

// try_guess 回傳的 error 代碼
const GUEST_ERRORS = {
  puzzle_not_found: '找不到題目',
  puzzle_not_available: '此題目暫不開放',
  invalid_chars: '只能輸入英文字母',
  wrong_length: '必須是 6 個字母',
  not_in_dictionary: '不是有效單字'
};
export function translateGuestError(errorCode) {
  if (!errorCode) return '未知錯誤';
  return GUEST_ERRORS[errorCode] || `未知錯誤:${errorCode}`;
}

// 註冊 trigger raise 的錯誤訊息(從 Supabase auth error.message 中找關鍵字)
const REGISTER_ERROR_KEYWORDS = {
  INVALID_STUDENT_ID: '學生學號必須是 9 位數字',
  INVALID_TEACHER_ID: '教職員編號必須是 6 位數字',
  INVALID_NAME: '姓名至少需要 2 個字元',
  DUPLICATE_ID: '此編號已註冊過,請直接登入'
};
export function translateRegisterError(errMsg) {
  if (!errMsg) return '註冊時發生未知錯誤';
  const s = String(errMsg);
  for (const [keyword, zh] of Object.entries(REGISTER_ERROR_KEYWORDS)) {
    if (s.includes(keyword)) return zh;
  }
  return s;
}

// Supabase Magic Link / OTP 錯誤(出現在 URL 的 #error_code=... 中)
const SUPABASE_AUTH_ERROR_CODES = {
  otp_expired: '登入連結已過期或已使用過,請重新申請',
  otp_invalid: '登入連結無效,請重新申請',
  access_denied: '登入被拒,請重新申請',
  email_link_invalid: '登入連結無效',
  server_error: '伺服器錯誤,請稍後再試',
  signup_disabled: '此專案目前不允許註冊'
};
/**
 * 翻譯 Supabase OTP/Auth 錯誤。
 * 優先:error_code 精確對照 → 後端 trigger 訊息(INVALID_STUDENT_ID 等) → 關鍵字 fallback。
 */
export function translateAuthError(raw) {
  if (!raw) return '登入失敗';
  const s = String(raw);
  // 1) Supabase OTP 錯誤碼精確對照
  if (SUPABASE_AUTH_ERROR_CODES[s]) return SUPABASE_AUTH_ERROR_CODES[s];
  for (const [code, zh] of Object.entries(SUPABASE_AUTH_ERROR_CODES)) {
    if (s.toLowerCase().includes(code)) return zh;
  }
  // 2) 後端 trigger 錯誤(INVALID_STUDENT_ID 等)
  for (const [keyword, zh] of Object.entries(REGISTER_ERROR_KEYWORDS)) {
    if (s.includes(keyword)) return zh;
  }
  // 3) 英文關鍵字 fallback
  if (/expired/i.test(s)) return '登入連結已過期或已使用過,請重新申請';
  if (/invalid/i.test(s) && /link/i.test(s)) return '登入連結無效,請重新申請';
  if (/rate limit/i.test(s)) return '寄送頻率過高,請稍後再試';
  return s;
}

// ─────────────────────────────────────────────
// 日期格式化
// ─────────────────────────────────────────────

/**
 * '2026-04-01' 或 Date → '2026 年 4 月'
 */
export function formatMonthZh(monthVal) {
  if (!monthVal) return '';
  const s = String(monthVal);
  const [y, m] = s.split('-');
  if (!y || !m) return s;
  return `${y} 年 ${parseInt(m, 10)} 月`;
}

/**
 * '2026-04-17' → 4 / 17
 * (給遊戲頁顯示「今日題目 4/17」用,若需要)
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = String(dateStr).split('-');
  if (!m || !d) return dateStr;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

// ─────────────────────────────────────────────
// HTML 輔助
// ─────────────────────────────────────────────

export function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
