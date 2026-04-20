// Supabase Client 初始化(lazy,首次呼叫 getSupabase() 才建立)
//
// 之所以採 lazy 初始化,是因為 config 需要經過 main.js 的動態載入流程
// (config.js → config.local.js)才會就緒,若在 module 載入時就呼叫 createClient,
// 會在 config 尚未載完時拿到 placeholder 值。
import { createClient } from '@supabase/supabase-js';

let _client = null;

function isPlaceholder(cfg) {
  if (!cfg) return true;
  const url = cfg.SUPABASE_URL || '';
  const key = cfg.SUPABASE_ANON_KEY || '';
  // 已知的 placeholder 字串(config.js 與 config.local.js.example 的預設值)
  if (!url) return true;
  if (url.includes('YOUR_PROJECT')) return true;
  if (url.includes('你的專案')) return true;
  // 合法的 Supabase URL 必然是 https://xxx.supabase.co
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return true;
  if (!key) return true;
  if (key.includes('YOUR_ANON')) return true;
  if (key.includes('填入')) return true;
  // 合法的 anon key 是 JWT,一定以 'eyJ' 起始
  if (!key.startsWith('eyJ')) return true;
  return false;
}

export function getSupabase() {
  if (_client) return _client;

  const cfg = window.CONFIG;
  if (isPlaceholder(cfg)) {
    throw new Error(
      'Supabase config 尚未設定。請複製 public/config.local.js.example 成 public/config.local.js 並填值。'
    );
  }

  _client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 重要:讓 Magic Link callback URL 能被自動解析並交換 token
      detectSessionInUrl: true
    }
  });

  return _client;
}

// 方便除錯用,不要在 production 程式邏輯中依賴這個
export function isConfigReady() {
  return !isPlaceholder(window.CONFIG);
}
