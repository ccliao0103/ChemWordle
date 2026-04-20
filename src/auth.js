// 認證封裝
//
// 只用 Magic Link(signInWithOtp),沒有密碼。
// Email 是從學號推導出來的:${studentId}@${EMAIL_DOMAIN}。

import { getSupabase } from './supabase-client.js';

/**
 * 由學號推出 email。
 */
export function emailFromStudentId(studentId) {
  return `${studentId}@${window.CONFIG.EMAIL_DOMAIN}`;
}

/**
 * Magic Link 的回調 URL,會帶到信件裡。
 */
export function authCallbackUrl() {
  return `${window.CONFIG.SITE_URL}/#/auth-callback`;
}

/**
 * 註冊(第一次登入,需帶 metadata)。
 * @param {{ studentId: string, name: string, role: 'student'|'teacher' }} args
 */
export async function signUpWithMagicLink({ studentId, name, role }) {
  const supabase = getSupabase();
  const email = emailFromStudentId(studentId);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: authCallbackUrl(),
      data: {
        student_id: studentId,
        name,
        role
      }
    }
  });
  if (error) throw error;
  return { email };
}

/**
 * 已註冊者登入(不帶 metadata)。
 */
export async function signInWithMagicLink({ studentId }) {
  const supabase = getSupabase();
  const email = emailFromStudentId(studentId);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: authCallbackUrl()
    }
  });
  if (error) throw error;
  return { email };
}

/**
 * 登出。
 * 預設 scope='local' — 只清瀏覽器 localStorage 的 session,不打伺服器。
 *   好處:沒有網路 round-trip,UI 不會卡。即使網路有問題也能登出。
 *   代價:該 refresh token 理論上還有 30 天內可被重用(實際要拿到它才行,風險低)。
 * 若要 server-side 失效所有 device,改呼叫 signOut({ scope: 'global' })。
 */
export async function signOut({ scope = 'local' } = {}) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut({ scope });
  if (error) throw error;
}

/**
 * 取得當前 Supabase Auth user 物件(非 students profile)。
 * - 未登入回 null
 * - 登入時回 { id, email, user_metadata: { student_id, name, role }, ... }
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated() {
  return (await getCurrentUser()) !== null;
}

/**
 * 取當前使用者的顯示名稱。
 * 優先用 user_metadata.name(註冊時存的),退一步用 email local part。
 */
export async function getCurrentUserName() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.user_metadata?.name || user.email?.split('@')[0] || '使用者';
}

/**
 * 監聽認證狀態變化(SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED ...)。
 * 回傳 subscription,呼叫方需要時用 subscription.unsubscribe() 取消。
 */
export function onAuthStateChange(callback) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
