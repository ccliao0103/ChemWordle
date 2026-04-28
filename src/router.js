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
const AUTH_REQUIRED = new Set(['/game', '/stats', '/leaderboard', '/admin']);

// 路由 → 頁面 module 的 dynamic import
const ROUTES = {
  '/':              () => import('./pages/home.js'),
  '/login':         () => import('./pages/login.js'),
  '/register':      () => import('./pages/register.js'),
  '/check-email':   () => import('./pages/check-email.js'),
  '/auth-callback': () => import('./pages/auth-callback.js'),
  '/game':          () => import('./pages/game.js'),
  '/stats':         () => import('./pages/stats.js'),
  '/leaderboard':   () => import('./pages/leaderboard.js'),
  '/guest':         () => import('./pages/guest.js'),
  '/admin':         () => import('./pages/admin.js')
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
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const mod = await loader();
      if (typeof mod.render !== 'function') {
        throw new Error(`Page ${path} 沒有 export render()`);
      }
      _container.innerHTML = '';
      await mod.render(_container, params);
      return; // success
    } catch (e) {
      // 🆕 特殊處理:dynamic import 失敗(部署新版後舊頁面拿不到新 chunk)
      // 這是 Vite SPA 經典問題 — 用 reload 取得最新 HTML 即可解。
      const isStaleChunk = (e instanceof TypeError) && (
        /Failed to fetch dynamically imported module/i.test(e.message) ||
        /Importing a module script failed/i.test(e.message) ||
        /error loading dynamically imported module/i.test(e.message)
      );
      if (isStaleChunk) {
        console.warn('[router] 偵測到舊版 chunk,自動重新整理取得最新版');
        renderStaleChunkBanner();
        // 給使用者看到提示 0.6 秒,然後 reload
        setTimeout(() => window.location.reload(), 600);
        return;
      }

      // 一般失敗:重試一次(常見時序 bug)
      if (attempt < 2) {
        console.warn(`[router] ${path} 載入失敗(第 ${attempt} 次),250ms 後重試...`, e);
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      console.error(`[router] ${path} 重試後仍失敗:`, e);
      renderPageLoadError(path, e);
      return;
    }
  }
}

function renderStaleChunkBanner() {
  _container.innerHTML = `
    <div style="max-width:480px;margin:4rem auto;padding:1.5rem;text-align:center;
                font-family:system-ui,sans-serif;border:1px solid #D3D6DA;border-radius:8px;">
      <p style="margin:0;color:#6AAA64;font-size:1rem;">🔄 偵測到新版本</p>
      <p style="margin:0.5rem 0 0;color:#787C7E;font-size:0.875rem;">正在更新中,請稍候…</p>
    </div>
  `;
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
  console.error('[router] page load error:', err);
  _container.innerHTML = `
    <section class="card text-center" style="max-width:480px;margin:3rem auto;">
      <h2 style="margin-top:0;">頁面載入失敗</h2>
      <p class="text-muted">路徑:<code>${escapeHtml(path)}</code></p>
      <p class="text-muted" style="font-size:0.875rem;">
        最簡單的解法:點下面按鈕重新整理。
      </p>
      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        <button type="button" class="btn"
                onclick="window.location.reload()">↻ 重新整理</button>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </div>
      <details style="margin-top:1.5rem;color:var(--text-secondary);font-size:0.75rem;text-align:left;">
        <summary>技術細節(若回報問題,請截這段)</summary>
        <pre style="white-space:pre-wrap;margin:0.5rem 0 0;">${escapeHtml(String(err?.stack || err))}</pre>
      </details>
    </section>
  `;
}
