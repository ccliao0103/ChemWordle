// 通用工具函式
//
// - Email 驗證
// - Hash 路由解析
// - 錯誤碼 → 中文對照(遊戲、訪客、註冊 trigger、Supabase OTP)
// - 日期 / 月份格式化
// - HTML escape

// ─────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────

/**
 * 簡易 email 格式檢查。不做 DNS 查詢,只檢查 local@domain.tld 結構。
 */
export function validateEmail(email) {
  if (!email) return false;
  const s = String(email).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

// 註冊 trigger raise 的錯誤訊息
const REGISTER_ERROR_KEYWORDS = {
  INVALID_NAME: '姓名至少需要 2 個字元',
  INVALID_ROLE_CATEGORY: '請選擇身分(大學部 / 碩士 / 博士 / 教職員)',
  INVALID_YEAR_TAG: '大學部請選年級(化一 / 化二 / 化三 / 化四)',
  INVALID_CLASS_TAG: '大學部請選班別(甲 / 乙)'
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
 * 優先:error_code 精確對照 → 後端 trigger 訊息 → 關鍵字 fallback。
 */
export function translateAuthError(raw) {
  if (!raw) return '登入失敗';
  const s = String(raw);
  if (SUPABASE_AUTH_ERROR_CODES[s]) return SUPABASE_AUTH_ERROR_CODES[s];
  for (const [code, zh] of Object.entries(SUPABASE_AUTH_ERROR_CODES)) {
    if (s.toLowerCase().includes(code)) return zh;
  }
  for (const [keyword, zh] of Object.entries(REGISTER_ERROR_KEYWORDS)) {
    if (s.includes(keyword)) return zh;
  }
  if (/already.*registered/i.test(s) || /duplicate/i.test(s) || /unique/i.test(s)) {
    return '此 email 已註冊過,請改用「登入」';
  }
  if (/expired/i.test(s)) return '登入連結已過期或已使用過,請重新申請';
  if (/invalid/i.test(s) && /link/i.test(s)) return '登入連結無效,請重新申請';
  // Supabase 對每個 email 1 分鐘冷卻(常見訊息含 "security purposes" / "once every X seconds")
  if (/security purposes|once every|every \d+ seconds/i.test(s)) {
    return '系統限制每個 email 1 分鐘只能寄一次信。請等約 1 分鐘後再試。';
  }
  if (/rate limit/i.test(s)) return '寄送頻率過高,請稍後再試(1 小時內可寄信數量有上限)';
  return s;
}

// ─────────────────────────────────────────────
// 日期格式化
// ─────────────────────────────────────────────

export function formatMonthZh(monthVal) {
  if (!monthVal) return '';
  const s = String(monthVal);
  const [y, m] = s.split('-');
  if (!y || !m) return s;
  return `${y} 年 ${parseInt(m, 10)} 月`;
}

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
