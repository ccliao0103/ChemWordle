// Page: 登入頁 #/login
//
// 流程:
// 1. 輸入 9 或 6 碼純數字 → 自動推 role 並即時顯示推導 email
// 2. 送出 → signInWithMagicLink(shouldCreateUser: false)
// 3. 成功 → sessionStorage 存 resend info + last_email → 跳 #/check-email
// 4. 失敗 → inline error,提示去首頁註冊

import { signInWithMagicLink } from '../auth.js';
import { inferRoleFromId, escapeHtml, translateAuthError } from '../utils.js';
import { navigate } from '../router.js';

export async function render(container /* , params */) {
  container.innerHTML = `
    <section>
      <h2 class="page-title">登入</h2>
      <p class="text-muted">輸入學號(9 碼)或教職員編號(6 碼),我們會寄登入連結到你的學校信箱。</p>

      <form id="login-form" novalidate>
        <div class="form-field">
          <label for="sid">學號 / 編號</label>
          <input id="sid" name="student_id" type="text"
                 inputmode="numeric" autocomplete="off"
                 maxlength="9" required />
          <p class="form-hint" id="hint"></p>
          <p class="form-error hidden" id="err"></p>
        </div>
        <button type="submit" class="btn btn-block" id="submit">送出登入連結</button>
      </form>

      <p class="text-center text-muted" style="margin-top:1.5rem;">
        還沒有帳號?<a href="#/">回首頁註冊</a>
      </p>
    </section>
  `;

  const form = container.querySelector('#login-form');
  const sidInput = container.querySelector('#sid');
  const hint = container.querySelector('#hint');
  const err = container.querySelector('#err');
  const submitBtn = container.querySelector('#submit');

  function showError(html) {
    err.innerHTML = html;
    err.classList.remove('hidden');
    sidInput.setAttribute('aria-invalid', 'true');
  }
  function clearError() {
    err.classList.add('hidden');
    err.innerHTML = '';
    sidInput.removeAttribute('aria-invalid');
  }
  function updateHint() {
    clearError();
    const v = sidInput.value.trim();
    if (!v) { hint.textContent = ''; return; }
    if (!/^\d+$/.test(v)) {
      hint.textContent = '請只輸入數字';
      return;
    }
    const role = inferRoleFromId(v);
    if (role) {
      hint.textContent = `登入連結會寄到 ${v}@${window.CONFIG.EMAIL_DOMAIN}`;
    } else {
      hint.textContent = `請輸入 9 碼學生學號或 6 碼教職員編號`;
    }
  }

  sidInput.addEventListener('input', updateHint);
  sidInput.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const v = sidInput.value.trim();
    const role = inferRoleFromId(v);
    if (!role) {
      showError('學號格式不正確(需為 9 或 6 碼純數字)');
      return;
    }

    submitBtn.disabled = true;
    const origText = submitBtn.textContent;
    submitBtn.textContent = '傳送中…';
    try {
      const { email } = await signInWithMagicLink({ studentId: v });
      sessionStorage.setItem('chemwordle:last_email', email);
      sessionStorage.setItem('chemwordle:resend_info', JSON.stringify({
        fn: 'signin',
        args: { studentId: v }
      }));
      navigate('/check-email');
    } catch (ex) {
      console.error('[login] signInWithMagicLink failed:', ex);
      const msg = String(ex?.message || ex);
      // "Signups not allowed for otp" / "User not found" → 未註冊
      if (/not allowed|not found|signup/i.test(msg)) {
        showError('找不到此帳號,請<a href="#/">回首頁註冊</a>');
      } else {
        // Rate limit、服務中斷等其他錯誤 → 走 translateAuthError
        showError(escapeHtml(translateAuthError(msg)));
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });
}
