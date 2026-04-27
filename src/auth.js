// 認證封裝
//
// Magic Link 模式,無密碼。Email 由使用者自由填(任何信箱),不再從學號推導。
//
// 註冊 metadata 包含:
//   - name (text, 必填)
//   - role_category ('undergrad' | 'master' | 'phd' | 'staff', 必填)
//   - year_tag ('化一'|'化二'|'化三'|'化四', undergrad 必填)
//   - class_tag ('甲'|'乙', undergrad 必填)
//   - student_id (text, 可選 — 兌獎時方便比對身分)
//
// trigger handle_new_user 讀取上述欄位,寫入 students 表並計算 class_name 顯示 tag。

import { getSupabase } from './supabase-client.js';

export function authCallbackUrl() {
  return `${window.CONFIG.SITE_URL}/#/auth-callback`;
}

/**
 * 註冊(第一次)。Email 直接傳,不再從學號推導。
 * @param {{
 *   email: string,
 *   name: string,
 *   roleCategory: 'undergrad'|'master'|'phd'|'staff',
 *   yearTag?: string,
 *   classTag?: string,
 *   studentId?: string
 * }} args
 */
export async function signUpWithMagicLink(args) {
  const supabase = getSupabase();
  const { email, name, roleCategory, yearTag, classTag, studentId } = args;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: authCallbackUrl(),
      data: {
        name,
        role_category: roleCategory,
        year_tag: yearTag || null,
        class_tag: classTag || null,
        student_id: studentId || null
      }
    }
  });
  if (error) throw error;
  return { email };
}

/**
 * 已註冊者登入。只要 email,不需 metadata。
 */
export async function signInWithMagicLink({ email }) {
  const supabase = getSupabase();
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
 * 登出(預設 scope='local',只清本地 session,UI 不會卡)。
 */
export async function signOut({ scope = 'local' } = {}) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut({ scope });
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated() {
  return (await getCurrentUser()) !== null;
}

/**
 * 取當前使用者顯示名稱。
 */
export async function getCurrentUserName() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.user_metadata?.name || user.email?.split('@')[0] || '使用者';
}

/**
 * 監聽認證狀態變化。回傳 subscription,可呼叫 unsubscribe()。
 */
export function onAuthStateChange(callback) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
