// Page: 登入頁 #/login
//
// 流程:
// 1. 輸入 email
// 2. 送出 → signInWithMagicLink(shouldCreateUser: false)
// 3. 成功 → 存 last_email + resend_info → 跳 #/check-email
// 4. 失敗 → inline error,提示去註冊

import { signInWithMagicLink } from '../auth.js';
import { validateEmail, escapeHtml, translateAuthError } from '../utils.js';
import { navigate } from '../router.js';

export async function render(container /* , params */) {
  container.innerHTML = `
    <section>
      <h2 class="page-title">登入</h2>
      <p class="text-muted">輸入你註冊時用的 email,我們會寄登入連結。</p>

      <form id="login-form" novalidate>
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email"
                 inputmode="email" autocomplete="email"
                 placeholder="例:fjuchem@gmail.com" required />
          <p class="form-error hidden" id="err"></p>
        </div>
        <button type="submit" class="btn btn-block" id="submit">送出登入連結</button>
      </form>

      <p class="text-center text-muted" style="margin-top:1.5rem;">
        還沒有帳號?<a href="#/register">註冊</a>
      </p>
    </section>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const errEl = container.querySelector('#err');
  const submitBtn = container.querySelector('#submit');

  function showError(html) {
    errEl.innerHTML = html;
    errEl.classList.remove('hidden');
    emailInput.setAttribute('aria-invalid', 'true');
  }
  function clearError() {
    errEl.classList.add('hidden');
    errEl.innerHTML = '';
    emailInput.removeAttribute('aria-invalid');
  }

  emailInput.addEventListener('input', clearError);
  emailInput.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = emailInput.value.trim().toLowerCase();
    if (!validateEmail(email)) {
      showError('請填有效的 email');
      return;
    }

    submitBtn.disabled = true;
    const orig = submitBtn.textContent;
    submitBtn.textContent = '傳送中…';
    try {
      await signInWithMagicLink({ email });
      sessionStorage.setItem('chemwordle:last_email', email);
      sessionStorage.setItem('chemwordle:resend_info', JSON.stringify({
        fn: 'signin',
        args: { email }
      }));
      navigate('/check-email');
    } catch (ex) {
      console.error('[login] signInWithMagicLink failed:', ex);
      const msg = String(ex?.message || ex);
      if (/not allowed|not found|signup/i.test(msg)) {
        showError('找不到此帳號,請<a href="#/register">註冊</a>');
      } else {
        showError(escapeHtml(translateAuthError(msg)));
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
}
