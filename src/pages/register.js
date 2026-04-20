// Page: 註冊頁 #/register?role=student|teacher
//
// 流程:
// 1. 從 params.role 決定表單(預設 student)
// 2. 即時驗證:學號長度(9/6)+ 純數字、姓名 ≥ 2 字元
// 3. 即時顯示推導出的 email
// 4. 送出 → signUpWithMagicLink → 存 resend_info → 跳 #/check-email
// 5. 失敗 → inline error

import { signUpWithMagicLink } from '../auth.js';
import { validateStudentId, escapeHtml, translateAuthError } from '../utils.js';
import { navigate } from '../router.js';

export async function render(container, params = {}) {
  const role = params.role === 'teacher' ? 'teacher' : 'student';
  const idLen = role === 'student' ? 9 : 6;
  const title = role === 'student' ? '學生註冊' : '教職員註冊';
  const idLabel = role === 'student' ? '學號' : '編號';

  container.innerHTML = `
    <section>
      <h2 class="page-title">${title}</h2>
      <p class="text-muted">註冊後我們會寄一封登入連結到你的學校信箱,點連結即可完成帳號建立。</p>

      <form id="reg-form" novalidate>
        <div class="form-field">
          <label for="sid">${idLabel}(${idLen} 碼數字)</label>
          <input id="sid" name="student_id" type="text"
                 inputmode="numeric" autocomplete="off"
                 maxlength="${idLen}" required />
          <p class="form-error hidden" id="err-sid"></p>
        </div>

        <div class="form-field">
          <label for="name">姓名</label>
          <input id="name" name="name" type="text"
                 autocomplete="name" minlength="2" required />
          <p class="form-error hidden" id="err-name"></p>
        </div>

        <p class="form-hint" id="email-hint"></p>

        <button type="submit" class="btn btn-block" id="submit" style="margin-top:1rem;">送出註冊</button>
      </form>

      <p class="text-center text-muted" style="margin-top:1.5rem;">
        已經有帳號?<a href="#/login">登入</a>
      </p>
    </section>
  `;

  const form = container.querySelector('#reg-form');
  const sidInput = container.querySelector('#sid');
  const nameInput = container.querySelector('#name');
  const errSid = container.querySelector('#err-sid');
  const errName = container.querySelector('#err-name');
  const emailHint = container.querySelector('#email-hint');
  const submitBtn = container.querySelector('#submit');

  function setFieldError(fieldEl, errEl, html) {
    if (html) {
      errEl.innerHTML = html;
      errEl.classList.remove('hidden');
      fieldEl.setAttribute('aria-invalid', 'true');
    } else {
      errEl.classList.add('hidden');
      errEl.innerHTML = '';
      fieldEl.removeAttribute('aria-invalid');
    }
  }

  function updateEmailHint() {
    const v = sidInput.value.trim();
    if (validateStudentId(v, role)) {
      emailHint.textContent = `登入連結會寄到 ${v}@${window.CONFIG.EMAIL_DOMAIN}`;
    } else {
      emailHint.textContent = '';
    }
  }

  sidInput.addEventListener('input', () => {
    setFieldError(sidInput, errSid, '');
    updateEmailHint();
  });
  nameInput.addEventListener('input', () => {
    setFieldError(nameInput, errName, '');
  });

  sidInput.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = sidInput.value.trim();
    const name = nameInput.value.trim();

    let ok = true;
    if (!validateStudentId(studentId, role)) {
      setFieldError(sidInput, errSid,
        role === 'student' ? '學生學號必須是 9 位數字' : '教職員編號必須是 6 位數字'
      );
      ok = false;
    }
    if (name.length < 2) {
      setFieldError(nameInput, errName, '姓名至少需要 2 個字元');
      ok = false;
    }
    if (!ok) return;

    submitBtn.disabled = true;
    const origText = submitBtn.textContent;
    submitBtn.textContent = '傳送中…';
    try {
      const { email } = await signUpWithMagicLink({ studentId, name, role });
      sessionStorage.setItem('chemwordle:last_email', email);
      sessionStorage.setItem('chemwordle:resend_info', JSON.stringify({
        fn: 'signup',
        args: { studentId, name, role }
      }));
      navigate('/check-email');
    } catch (ex) {
      console.error('[register] signUpWithMagicLink failed:', ex);
      // Supabase 自己的錯(rate limit、email 格式、服務暫停等)
      // trigger 錯誤(INVALID_STUDENT_ID 等)要點連結後才會出現,那邊由 auth-callback 處理
      const zh = translateAuthError(ex?.message || String(ex));
      setFieldError(sidInput, errSid, escapeHtml(zh));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });
}
