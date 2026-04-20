// Hash-based 路由
//
// 為什麼用 hash routing?
//   - 純靜態部署,不需 server 做 SPA fallback
//   - Magic Link 的 redirectTo 用 hash 形式,Supabase Client 的
//     detectSessionInUrl 才能正確解析
//
// 每個 page module 必須 export 一個 async function render(container, params):
//   - container:要渲染的 <div id="app"> 元素
//   - params:query string 解析結果(例如 { role: 'student' })

import { parseHash, escapeHtml } from './utils.js';
import { isAuthenticated } from './auth.js';

// 登入守衛清單(未登入導向 /login)
const AUTH_REQUIRED = new Set(['/game', '/stats', '/leaderboard']);

// 路由 → 頁面 module 的 dynamic import
// 批次 5-7 會陸續補齊這些檔案
const ROUTES = {
  '/':              () => import('./pages/home.js'),
  '/login':         () => import('./pages/login.js'),
  '/register':      () => import('./pages/register.js'),
  '/check-email':   () => import('./pages/check-email.js'),
  '/auth-callback': () => import('./pages/auth-callback.js'),
  '/game':          () => import('./pages/game.js'),
  '/stats':         () => import('./pages/stats.js'),
  '/leaderboard':   () => import('./pages/leaderboard.js'),
  '/guest':         () => import('./pages/guest.js')
};

let _container = null;

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export function initRouter(container) {
  _container = container;
  window.addEventListener('hashchange', handleRoute);

  // 第一次進站若沒有 hash,導到 '#/'
  if (!window.location.hash) {
    // 用 replace 避免在 history 留下一筆空 hash 紀錄
    window.location.replace('#/');
    // replace 設 hash 會觸發 hashchange → 下一個 event loop 進 handleRoute
    return;
  }

  handleRoute();
}

/**
 * 導向某路徑。支援 '/login'、'#/login'、'/register?role=student' 等形式。
 */
export function navigate(target) {
  const h = target.startsWith('#') ? target : `#${target}`;
  if (window.location.hash === h) {
    // 相同 hash 不會觸發 hashchange,手動執行一次
    handleRoute();
  } else {
    window.location.hash = h;
  }
}

// ─────────────────────────────────────────────
// 內部:分派路由
// ─────────────────────────────────────────────

async function handleRoute() {
  if (!_container) return;

  const { path, params } = parseHash(window.location.hash);

  // 1) 登入守衛
  if (AUTH_REQUIRED.has(path)) {
    let authed = false;
    try {
      authed = await isAuthenticated();
    } catch (e) {
      // 若 Supabase call 失敗(極少數情況),視同未登入
      console.warn('[router] isAuthenticated 失敗,視同未登入', e);
    }
    if (!authed) {
      navigate('/login');
      return;
    }
  }

  // 2) 找路由
  const loader = ROUTES[path];
  if (!loader) {
    renderNotFound(path);
    return;
  }

  // 3) 載入頁面 module 並呼叫 render
  try {
    const mod = await loader();
    if (typeof mod.render !== 'function') {
      throw new Error(`Page ${path} 沒有 export render()`);
    }
    // 清空 container,交給 page module 自己畫
    _container.innerHTML = '';
    await mod.render(_container, params);
  } catch (e) {
    // 批次 3 階段,多數頁面檔案還不存在,會 404/import 失敗
    renderPageLoadError(path, e);
  }
}

// ─────────────────────────────────────────────
// 錯誤畫面(暫用 inline style,正式樣式在批次 4)
// ─────────────────────────────────────────────

function renderNotFound(path) {
  _container.innerHTML = `
    <div style="max-width:560px;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;text-align:center;">
      <h1>找不到頁面</h1>
      <p style="color:#787C7E;">路徑:<code>${escapeHtml(path)}</code></p>
      <p><a href="#/">回首頁</a></p>
    </div>
  `;
}

function renderPageLoadError(path, err) {
  _container.innerHTML = `
    <div style="max-width:640px;margin:3rem auto;padding:1.5rem;font-family:system-ui,sans-serif;border:1px solid #D3D6DA;border-radius:8px;">
      <h2 style="margin:0 0 0.5rem;">頁面尚未實作</h2>
      <p style="color:#787C7E;margin:0.25rem 0;">路徑:<code>${escapeHtml(path)}</code></p>
      <p style="color:#787C7E;margin:0.25rem 0;font-size:0.875rem;">
        (批次 3 骨架階段,Router 本身已可運作。頁面會在批次 5–7 陸續加入。)
      </p>
      <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="#/">首頁</a> ·
        <a href="#/login">登入</a> ·
        <a href="#/register?role=student">學生註冊</a> ·
        <a href="#/register?role=teacher">教職員註冊</a> ·
        <a href="#/check-email">收信提示</a> ·
        <a href="#/auth-callback">Auth Callback</a> ·
        <a href="#/game">遊戲(需登入)</a> ·
        <a href="#/stats">統計(需登入)</a> ·
        <a href="#/leaderboard">排行榜(需登入)</a> ·
        <a href="#/guest">訪客</a>
      </div>
      <details style="margin-top:1rem;color:#787C7E;font-size:0.75rem;">
        <summary>Error 詳情</summary>
        <pre style="white-space:pre-wrap;">${escapeHtml(String(err?.stack || err))}</pre>
      </details>
    </div>
  `;
}
