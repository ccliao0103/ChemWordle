// ChemWordle 入口
//
// 啟動流程:
//   0. PRE-Supabase:預處理 Magic Link 回呼的特殊 URL 格式
//   1. 動態載入 config.js(必要)與 config.local.js(可選)
//   2. 驗證 config 不是 placeholder
//   3. 初始化 Supabase Client(lazy,首次呼叫才建立)
//   3.5 等 Supabase 完成 URL session 偵測(detectSessionInUrl 是非同步)
//   3.6 還原目標路由(若步驟 0 暫存了 access_token,現在把 hash 設回 /auth-callback)
//   4. 在 #app 建 layout(header / page / toast 三區塊)
//   5. 掛 header、初始化 toast、啟動 router

// CSS — Vite 會把這些 bundle 進 dist,並於 dev 啟用 HMR
import './styles/main.css';
import './styles/header.css';
import './styles/board.css';
import './styles/keyboard.css';
import './styles/pages.css';
import './styles/animations.css';

const APP_EL = () => document.getElementById('app');

// ─────────────────────────────────────────────
// Magic Link URL 預處理
// ─────────────────────────────────────────────
//
// Supabase Magic Link 回呼常見三種 URL 格式(原本的 redirectTo 是 `#/auth-callback`):
//
//   (A) 成功但 double-hash:
//       `#/auth-callback#access_token=...&refresh_token=...&type=magiclink`
//       → Supabase 找不到 token(因 hash 前綴有 `/auth-callback#`),
//         我們的 router 也 404(路徑含第二個 `#`)。
//       處理:暫時把 hash 改成 `#access_token=...` 讓 Supabase 消化,
//             並記住 target_route,消化完再改回來。
//
//   (B) 錯誤且 double-hash:
//       `#/auth-callback#error=...&error_code=otp_expired`
//       處理:存原始 hash(給 auth-callback 讀錯誤),路由設到 `/auth-callback`。
//
//   (C) 錯誤但 Supabase 直接覆寫了 hash:
//       `#error=...&error_code=otp_expired`
//       處理:存原始 hash,路由設到 `/auth-callback`。
//
// 這三種格式都要在 Supabase client init 前處理。
const AUTH_HASH_KEYS = [
  'access_token', 'refresh_token', 'provider_token', 'provider_refresh_token',
  'expires_in', 'expires_at', 'token_type',
  'type',
  'error', 'error_code', 'error_description'
];

function isAuthFragment(fragment) {
  if (!fragment) return false;
  const first = fragment.split('&')[0].split('=')[0];
  return AUTH_HASH_KEYS.includes(first);
}

function preprocessAuthUrl() {
  const h = window.location.hash;
  if (!h || h === '#' || h === '#/') return;

  // Case A/B: double hash pattern → `#/path(?q)?#tail`
  const m = h.match(/^#(\/[^#]*)#(.+)$/);
  if (m) {
    const pathPart = m[1];             // e.g. '/auth-callback'
    const tailPart = m[2];             // e.g. 'access_token=...&type=magiclink'
    if (isAuthFragment(tailPart)) {
      sessionStorage.setItem('chemwordle:auth_url_hash', '#' + tailPart);
      if (tailPart.includes('access_token=')) {
        // Case A:需要讓 Supabase 消化 token
        history.replaceState(null, '', '#' + tailPart);
        sessionStorage.setItem('chemwordle:auth_target_route', pathPart);
      } else {
        // Case B:純錯誤,直接路由到 callback
        history.replaceState(null, '', '#' + pathPart);
      }
      return;
    }
  }

  // Case C:hash 不是 `#/` 開頭(Supabase 完全覆寫)
  if (!h.startsWith('#/')) {
    const tail = h.slice(1);
    if (isAuthFragment(tail)) {
      sessionStorage.setItem('chemwordle:auth_url_hash', h);
      if (tail.includes('access_token=')) {
        // 罕見:access_token 在單層 hash — 讓 Supabase 消化後再導回 /auth-callback
        sessionStorage.setItem('chemwordle:auth_target_route', '/auth-callback');
      } else {
        // 錯誤:直接改成 /auth-callback
        history.replaceState(null, '', '#/auth-callback');
      }
    }
  }
}

function restoreAuthTargetRoute() {
  const target = sessionStorage.getItem('chemwordle:auth_target_route');
  if (target) {
    sessionStorage.removeItem('chemwordle:auth_target_route');
    history.replaceState(null, '', '#' + target);
  }
}

// ─────────────────────────────────────────────
// Config 動態載入
// ─────────────────────────────────────────────
function loadScript(src, required) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => {
      if (required) reject(new Error(`Failed to load required script: ${src}`));
      else resolve(false);
    };
    document.head.appendChild(s);
  });
}

async function loadConfig() {
  // public/config.js 與 public/config.local.js → 在 dev 與 production build 都會以
  // 網站根目錄路徑提供(Vite 把 public/ 原樣複製到 dist/)。
  await loadScript('/config.js', true);
  await loadScript('/config.local.js', false);
}

// ─────────────────────────────────────────────
// 啟動錯誤畫面
// ─────────────────────────────────────────────
function showFatalError(title, detail) {
  APP_EL().innerHTML = `
    <div style="max-width:560px;margin:4rem auto;padding:1.5rem;border:1px solid #D3D6DA;border-radius:8px;">
      <h1 style="margin:0 0 0.5rem;font-size:1.25rem;">${escapeHtml(title)}</h1>
      <p style="margin:0;color:#787C7E;line-height:1.6;">${escapeHtml(detail)}</p>
    </div>
  `;
}
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  // 0. 預處理 Magic Link URL(必須在 Supabase client 建立前)
  preprocessAuthUrl();

  // 1. 載入 config
  try {
    await loadConfig();
  } catch (e) {
    showFatalError('載入設定失敗', e.message);
    return;
  }

  // 2. 驗證 config
  const { getSupabase, isConfigReady } = await import('./supabase-client.js');
  if (!isConfigReady()) {
    showFatalError(
      'Supabase 設定尚未完成',
      '請依 README 複製 public/config.local.js.example 成 public/config.local.js,並填入你的 Supabase URL 與 anon key。'
    );
    return;
  }

  // 3. 建立 Supabase client(此時若 URL 有 access_token 會開始非同步消化)
  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    showFatalError('Supabase Client 初始化失敗', e.message);
    return;
  }
  // 開發時方便在 DevTools 直接用 window.supabase 測試;production build 自動移除
  if (import.meta.env.DEV) {
    window.supabase = supabase;
  }

  // 3.5 等 Supabase 完成 URL session 偵測
  //     getSession() 內部 await 了 detectSessionInUrl 的 setTimeout,
  //     完成後 URL 的 token 被消化,hash 會被清空。
  try {
    await supabase.auth.getSession();
  } catch (e) {
    console.warn('[ChemWordle] getSession 失敗:', e);
  }

  // 3.6 還原 target route(若步驟 0 存過)
  restoreAuthTargetRoute();

  console.log('[ChemWordle] Supabase client 已初始化');
  console.log('[ChemWordle] Config:', {
    SUPABASE_URL: window.CONFIG.SUPABASE_URL,
    EMAIL_DOMAIN: window.CONFIG.EMAIL_DOMAIN,
    SITE_URL: window.CONFIG.SITE_URL
  });

  // 4. 建 layout
  APP_EL().innerHTML = `
    <header id="header-root"></header>
    <main id="page-root"></main>
    <footer class="site-footer">
      <p class="footer-credit">
        製作:<strong>廖振成</strong> · 輔大化學系 CCL Lab · © 2026
      </p>
      <p class="footer-disclaimer">
        靈感來自 NYT Wordle · 非商業用途,僅用於教育<br>
        <span class="en">Inspired by Wordle (NYT). Independent project, non-commercial, for educational use only.</span>
      </p>
    </footer>
    <div id="toast-root" class="toast-root" aria-live="polite"></div>
  `;

  // 5. 掛 header / toast / router
  const [{ mountHeader }, { initToast }, { initRouter }] = await Promise.all([
    import('./components/header.js'),
    import('./components/toast.js'),
    import('./router.js')
  ]);

  initToast(document.getElementById('toast-root'));
  mountHeader(document.getElementById('header-root'));
  initRouter(document.getElementById('page-root'));

  // 6. 第一次進站秀 How to Play modal(localStorage 記錄看過後就不再自動秀)
  //    auth-callback 頁面跳過(剛收信進來,不要打擾流程)
  if (!window.location.hash.startsWith('#/auth-callback')) {
    import('./components/howto-modal.js').then(({ shouldShowHowTo, showHowToModal }) => {
      if (shouldShowHowTo()) {
        // 延遲一點,讓頁面先 render,再彈 modal
        setTimeout(() => showHowToModal(), 400);
      }
    });
  }
}

main();
