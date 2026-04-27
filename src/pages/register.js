// Page: 註冊頁 #/register
//
// 流程:
// 1. 填:姓名、email、身分(role_category)
// 2. 若身分是「大學部」→ 多選年級 + 班別
// 3. 可選:學號 / 職員編號
// 4. 送出 → signUpWithMagicLink
// 5. 跳 #/check-email,並存 resend_info 供再寄

import { signUpWithMagicLink } from '../auth.js';
import { validateEmail, escapeHtml, translateAuthError } from '../utils.js';
import { navigate } from '../router.js';

export async function render(container /* , params */) {
  container.innerHTML = `
    <section>
      <h2 class="page-title">註冊</h2>
      <p class="text-muted">填一次,以後 30 天不用再收信。Email 推薦用你的 Gmail。</p>

      <form id="reg-form" novalidate>
        <div class="form-field">
          <label for="name">姓名 <span class="req">*</span></label>
          <input id="name" name="name" type="text" autocomplete="name" required />
          <p class="form-error hidden" id="err-name"></p>
        </div>

        <div class="form-field">
          <label for="email">Email <span class="req">*</span></label>
          <input id="email" name="email" type="email"
                 inputmode="email" autocomplete="email"
                 placeholder="例:peter@gmail.com" required />
          <p class="form-hint">用你常看的信箱。Magic Link 寄到這裡。</p>
          <p class="form-error hidden" id="err-email"></p>
        </div>

        <div class="form-field">
          <label>身分 <span class="req">*</span></label>
          <div class="radio-group">
            <label><input type="radio" name="role_category" value="undergrad" checked /> 大學部</label>
            <label><input type="radio" name="role_category" value="master" /> 碩士班</label>
            <label><input type="radio" name="role_category" value="phd" /> 博士班</label>
            <label><input type="radio" name="role_category" value="staff" /> 教職員</label>
          </div>
        </div>

        <div class="form-field" id="year-field">
          <label>年級 <span class="req">*</span></label>
          <div class="radio-group">
            <label><input type="radio" name="year_tag" value="化一" /> 化一</label>
            <label><input type="radio" name="year_tag" value="化二" /> 化二</label>
            <label><input type="radio" name="year_tag" value="化三" /> 化三</label>
            <label><input type="radio" name="year_tag" value="化四" /> 化四</label>
          </div>
          <p class="form-error hidden" id="err-year"></p>
        </div>

        <div class="form-field" id="class-field">
          <label>班別 <span class="req">*</span></label>
          <div class="radio-group">
            <label><input type="radio" name="class_tag" value="甲" /> 甲</label>
            <label><input type="radio" name="class_tag" value="乙" /> 乙</label>
          </div>
          <p class="form-error hidden" id="err-class"></p>
        </div>

        <div class="form-field">
          <label for="student_id">學號 / 職員編號(選填)</label>
          <input id="student_id" name="student_id" type="text" />
          <p class="form-hint">填了方便兌換獎品時對應身分,不填也沒關係。</p>
        </div>

        <button type="submit" class="btn btn-block" id="submit" style="margin-top:1rem;">送出註冊</button>
      </form>

      <p class="text-center text-muted" style="margin-top:1.5rem;">
        已經有帳號?<a href="#/login">登入</a>
      </p>
    </section>
  `;

  const form = container.querySelector('#reg-form');
  const submitBtn = container.querySelector('#submit');
  const yearField = container.querySelector('#year-field');
  const classField = container.querySelector('#class-field');

  // 切換 undergrad 顯示/隱藏年級+班別
  function updateRoleVisibility() {
    const v = form.querySelector('[name="role_category"]:checked')?.value;
    const isUndergrad = v === 'undergrad';
    yearField.style.display = isUndergrad ? '' : 'none';
    classField.style.display = isUndergrad ? '' : 'none';
  }
  form.querySelectorAll('[name="role_category"]').forEach((r) => {
    r.addEventListener('change', updateRoleVisibility);
  });
  updateRoleVisibility();

  // 錯誤顯示
  function setError(id, html) {
    const el = container.querySelector('#' + id);
    el.innerHTML = html;
    el.classList.remove('hidden');
  }
  function clearError(id) {
    const el = container.querySelector('#' + id);
    el.classList.add('hidden');
    el.innerHTML = '';
  }
  function clearAll() {
    ['err-name', 'err-email', 'err-year', 'err-class'].forEach(clearError);
  }

  // 送出
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAll();

    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim().toLowerCase();
    const roleCategory = form.querySelector('[name="role_category"]:checked')?.value;
    const yearTag = form.querySelector('[name="year_tag"]:checked')?.value || null;
    const classTag = form.querySelector('[name="class_tag"]:checked')?.value || null;
    const studentId = form.querySelector('#student_id').value.trim() || null;

    let ok = true;
    if (name.length < 2) { setError('err-name', '姓名至少需要 2 個字元'); ok = false; }
    if (!validateEmail(email)) { setError('err-email', '請填有效的 email'); ok = false; }
    if (roleCategory === 'undergrad') {
      if (!yearTag) { setError('err-year', '請選年級'); ok = false; }
      if (!classTag) { setError('err-class', '請選班別'); ok = false; }
    }
    if (!ok) return;

    submitBtn.disabled = true;
    const orig = submitBtn.textContent;
    submitBtn.textContent = '傳送中…';
    try {
      await signUpWithMagicLink({
        email, name, roleCategory,
        yearTag: roleCategory === 'undergrad' ? yearTag : null,
        classTag: roleCategory === 'undergrad' ? classTag : null,
        studentId
      });
      sessionStorage.setItem('chemwordle:last_email', email);
      sessionStorage.setItem('chemwordle:resend_info', JSON.stringify({
        fn: 'signup',
        args: { email, name, roleCategory, yearTag, classTag, studentId }
      }));
      navigate('/check-email');
    } catch (ex) {
      console.error('[register] signUpWithMagicLink failed:', ex);
      const zh = translateAuthError(ex?.message || String(ex));
      setError('err-email', escapeHtml(zh));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
}
