// Page: Auth Callback #/auth-callback
//
// Magic Link 點進來後由 Supabase Client(detectSessionInUrl:true)自動處理 URL 的 access_token。
// 然而 Supabase 有時會把 URL hash 整個覆寫成 #error=...&error_code=...(不是 #/auth-callback);
// main.js 已在啟動 router 前把那段 hash 暫存到 sessionStorage,並改寫 URL 回 #/auth-callback。
// 本頁負責:
//   1. 讀暫存 hash(與當前 URL)抓錯誤 → 翻譯顯示
//   2. 呼叫 getUser() 判斷是否已登入;若還沒,等 1.5 秒再試一次
//   3. 成功 → 清 session storage → 跳 #/game
//   4. 失敗 → 顯示錯誤 + 回首頁 / 重新登入 連結

import { getSupabase } from '../supabase-client.js';
import { navigate } from '../router.js';
import { translateAuthError, escapeHtml } from '../utils.js';

function pickParam(text, name) {
  if (!text) return null;
  const re = new RegExp(`[?&#]${name}=([^&]+)`);
  const m = text.match(re);
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
}

function showSpinner(container) {
  container.innerHTML = `
    <div style="padding:3rem 1rem;">
      <div class="spinner-wrap">
        <div class="spinner" aria-hidden="true"></div>
        <span class="spinner-label">登入中…</span>
      </div>
    </div>
  `;
}

function showError(container, message) {
  container.innerHTML = `
    <section class="card" style="max-width:480px;margin:3rem auto;text-align:center;">
      <h2 style="margin-top:0;">登入失敗</h2>
      <p class="form-error">${escapeHtml(message)}</p>
      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        <a class="btn btn-secondary" href="#/">回首頁</a>
        <a class="btn" href="#/login">重新登入</a>
      </div>
    </section>
  `;
}

export async function render(container /* , params */) {
  showSpinner(container);

  // 一次性消費 main.js 暫存的原始 hash
  const stashed = sessionStorage.getItem('chemwordle:auth_url_hash') || '';
  sessionStorage.removeItem('chemwordle:auth_url_hash');

  // 組合:當前 hash + 當前 search + 暫存 hash,三個地方都可能有錯誤參數
  const haystack =
    (window.location.hash || '') +
    '&' + (window.location.search || '') +
    '&' + stashed;

  // 優先順序:error_code(最穩定) → error_description → error
  const errCode = pickParam(haystack, 'error_code')
               || pickParam(haystack, 'error_description')
               || pickParam(haystack, 'error');

  if (errCode) {
    showError(container, translateAuthError(errCode));
    return;
  }

  const supabase = getSupabase();

  // 檢查 session。Supabase Client 可能還在處理 URL,給它一點時間
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    await new Promise((r) => setTimeout(r, 1500));
    ({ data: { user } } = await supabase.auth.getUser());
  }

  if (user) {
    sessionStorage.removeItem('chemwordle:last_email');
    sessionStorage.removeItem('chemwordle:resend_info');
    navigate('/game');
    return;
  }

  showError(container, '登入連結失效或已使用過,請重新申請');
}
