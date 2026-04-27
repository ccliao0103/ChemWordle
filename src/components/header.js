// Header 元件
//
// - 掛載在 #header-root,獨立於 #page-root(router 切頁面不會影響 header)
// - 訂閱 auth 狀態變化,登入/登出後自動重繪
// - Logo fallback:/logo.png 載入失敗時,加 class 顯示文字 "ChemWordle"

import { navigate } from '../router.js';
import {
  getCurrentUser,
  getCurrentUserName,
  signOut,
  onAuthStateChange
} from '../auth.js';
import { escapeHtml } from '../utils.js';

let _hostEl = null;
let _bound = false;

export function mountHeader(hostEl) {
  _hostEl = hostEl;
  render();
  // 監聽 auth 狀態,登入/登出後重繪
  onAuthStateChange(() => render());
}

async function render() {
  if (!_hostEl) return;
  const user = await getCurrentUser();
  const name = user ? await getCurrentUserName() : null;

  _hostEl.innerHTML = `
    <div class="hdr-inner">
      <a class="hdr-logo" href="#/" aria-label="ChemWordle 首頁">
        <img class="hdr-logo-img" src="/logo.png" alt="ChemWordle" />
        <span class="hdr-logo-text">ChemWordle</span>
      </a>
      <div class="hdr-right">
        <button type="button" class="hdr-help"
                data-action="show-howto"
                aria-label="How to play / 怎麼玩"
                title="How to play">?</button>
        ${user ? renderUserMenu(name) : renderLoginButton()}
      </div>
    </div>
  `;

  setupLogoFallback();
  bindEventsOnce();
}

function renderLoginButton() {
  return `<a class="hdr-btn" href="#/login">登入</a>`;
}

function renderUserMenu(name) {
  const safe = escapeHtml(name || '使用者');
  return `
    <details class="hdr-menu">
      <summary title="${safe}">${safe} ▼</summary>
      <div class="hdr-menu-panel">
        <a href="#/stats">我的成績</a>
        <a href="#/leaderboard">排行榜</a>
        <button type="button" data-action="logout">登出</button>
      </div>
    </details>
  `;
}

function setupLogoFallback() {
  const wrap = _hostEl.querySelector('.hdr-logo');
  const img = _hostEl.querySelector('.hdr-logo-img');
  if (!wrap || !img) return;
  // 若圖已經載入失敗(complete 但 naturalWidth 為 0)
  if (img.complete && img.naturalWidth === 0) {
    wrap.classList.add('hdr-logo-fallback');
    return;
  }
  img.addEventListener(
    'error',
    () => wrap.classList.add('hdr-logo-fallback'),
    { once: true }
  );
}

function bindEventsOnce() {
  // _hostEl 是持久元素,只需綁定一次。render 會重建內部 DOM,事件用 delegation。
  if (_bound) return;
  _bound = true;
  _hostEl.addEventListener('click', async (ev) => {
    const actionEl = ev.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'logout') {
      ev.preventDefault();
      // 立刻收下拉選單
      _hostEl.querySelectorAll('details[open]').forEach((d) => (d.open = false));
      // 先導航回首頁,讓 UI 即時反應
      navigate('/');
      // signOut 在背景跑:清本地 session(scope='local' 不打伺服器,不會卡)
      signOut().catch((err) => console.warn('[header] signOut failed:', err));
    } else if (action === 'show-howto') {
      ev.preventDefault();
      const { showHowToModal } = await import('./howto-modal.js');
      // 點 ❓ 開的不算「初次」,不寫 localStorage(下次首訪還是會自動秀)
      // 已經看過的人才會點 ❓ — 讓他們複習,但不影響「首次」邏輯
      showHowToModal({ markSeen: false });
    }
  });
}
