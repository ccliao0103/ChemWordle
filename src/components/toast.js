// Toast 提示
//
// 用法:
//   import { initToast, showToast } from '.../toast.js';
//   initToast(document.getElementById('toast-root'));  // main.js 初始化一次
//   showToast('必須是 6 個字母');                       // 預設 error 樣式
//   showToast('已登入', { type: 'info' });

let _root = null;

export function initToast(hostEl) {
  _root = hostEl;
}

/**
 * @param {string} message
 * @param {{ type?: 'error'|'info', duration?: number }} [opts]
 */
export function showToast(message, opts = {}) {
  const { type = 'error', duration = 2500 } = opts;
  if (!_root) {
    // 早於 initToast 被呼叫(不太可能,但兜底)
    console.warn('[toast] root 未初始化,fallback 到 alert');
    alert(message);
    return;
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');
  t.textContent = message;
  _root.appendChild(t);
  // force reflow 確保 transition 觸發
  void t.offsetWidth;
  t.classList.add('toast-show');
  setTimeout(() => {
    t.classList.remove('toast-show');
    setTimeout(() => t.remove(), 300);
  }, duration);
}
