// Page: 收信提示 #/check-email
//
// 顯示「請查收登入連結」大標題 + 寄到哪個 email + 60 秒倒數的「重新發送」按鈕。
// 重發資訊從 sessionStorage 的 chemwordle:resend_info 讀取。
// 頁面重整會遺失這些資訊,這時重發按鈕 disabled,並提示「請回上一頁重新送出」。

import { signInWithMagicLink, signUpWithMagicLink } from '../auth.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils.js';

const RESEND_COOLDOWN_SEC = 60;

export async function render(container /* , params */) {
  const email = sessionStorage.getItem('chemwordle:last_email') || '';
  const resendRaw = sessionStorage.getItem('chemwordle:resend_info');
  let resendInfo = null;
  try {
    resendInfo = resendRaw ? JSON.parse(resendRaw) : null;
  } catch { /* 忽略壞掉的 JSON */ }

  const emailDisplay = email
    ? escapeHtml(email)
    : '你的學校信箱';

  container.innerHTML = `
    <section class="text-center" style="padding-top:2rem;">
      <h2 style="font-size:1.5rem;">請查收登入連結</h2>
      <p class="text-muted" style="margin:0.75rem 0;">
        我們已寄出一封登入信到 <strong>${emailDisplay}</strong>,請去信箱點擊連結。
      </p>
      <p class="text-muted" style="font-size:0.875rem;">
        若 1 分鐘內沒收到,請檢查垃圾信箱。
      </p>

      <div style="margin-top:2rem;">
        <button type="button" class="btn btn-secondary" id="resend"
                ${resendInfo ? '' : 'disabled'}>
          重新發送
        </button>
        <p class="text-muted" id="resend-hint" style="font-size:0.8125rem;margin-top:0.5rem;">
          ${resendInfo ? '' : '若此頁重整過,請回上一頁重新送出。'}
        </p>
      </div>

      <p class="text-muted" style="margin-top:2rem;font-size:0.8125rem;">
        寄錯 email 了嗎?<a href="#/register">回去重填</a>
        (請等約 1 分鐘再重送,系統有冷卻限制)
      </p>

      <p style="margin-top:1rem;">
        <a href="#/">回首頁</a>
      </p>
    </section>
  `;

  if (!resendInfo) return;

  const btn = container.querySelector('#resend');
  const hint = container.querySelector('#resend-hint');

  // 進頁即進入冷卻(剛剛才送過)
  startCooldown(btn, hint, RESEND_COOLDOWN_SEC);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    hint.textContent = '傳送中…';
    try {
      if (resendInfo.fn === 'signup') {
        await signUpWithMagicLink(resendInfo.args);
      } else {
        await signInWithMagicLink(resendInfo.args);
      }
      showToast('已重新寄出登入連結', { type: 'info' });
      startCooldown(btn, hint, RESEND_COOLDOWN_SEC);
    } catch (ex) {
      console.error('[check-email] resend failed:', ex);
      showToast('重新發送失敗:' + (ex?.message || ex));
      btn.disabled = false;
      hint.textContent = '';
    }
  });
}

function startCooldown(btn, hint, sec) {
  btn.disabled = true;
  let remaining = sec;
  const tick = () => {
    if (remaining <= 0) {
      btn.disabled = false;
      hint.textContent = '';
      return;
    }
    hint.textContent = `${remaining} 秒後可重新發送`;
    remaining -= 1;
    setTimeout(tick, 1000);
  };
  tick();
}
