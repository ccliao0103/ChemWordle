// Supabase RPC 呼叫封裝
//
// ⚠️ 本專案的安全規則:
//   - 前端只透過 RPC 存取資料,絕不用 .from('xxx').select/insert/update/delete()
//   - 所有題目答案、今天的日期判斷、計分,全由後端 RPC 處理
//   - 前端只負責 UI 與把 RPC 回傳的資料呈現出來
//
// 錯誤處理策略:
//   - 網路錯誤 / Supabase-client 層級錯誤 → throw(上層 catch 顯示 Toast)
//   - RPC 回傳的業務錯誤(如 data.error = 'wrong_length')→ 不 throw,原樣回傳
//     上層用 utils.translateGameError / translateGuestError 翻譯

import { getSupabase } from './supabase-client.js';

// ─────────────────────────────────────────────
// 遊戲(登入版)
// ─────────────────────────────────────────────

/**
 * 取得今日題目狀態。進遊戲頁第一個呼叫。
 * 回傳三種 status 之一:'no_puzzle' / 'completed' / 'in_progress'
 */
export async function getTodayPuzzle() {
  const { data, error } = await getSupabase().rpc('get_today_puzzle_info');
  if (error) throw error;
  return data;
}

/**
 * 送出一次猜測。
 * 回傳:
 *   - { status: 'continue', colors, guess_count, remaining }
 *   - { status: 'finished', colors, solved, guess_count, score, answer }  // answer 只在 solved=false 時有值
 *   - { error: <code>, message: <zh> }                                    // 業務錯誤
 */
export async function submitGuess(guess) {
  const { data, error } = await getSupabase().rpc('submit_guess', {
    guess_input: guess
  });
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// 統計與排行榜
// ─────────────────────────────────────────────

/**
 * 取昨日題目揭曉資訊(含中文)。需要登入。
 * 回傳 { puzzle_date, answer, zh_name, zh_description } 或 null(昨天沒排題)
 */
export async function getYesterdayReveal() {
  const { data, error } = await getSupabase().rpc('get_yesterday_puzzle_reveal');
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// Admin(僅 role=admin 可成功;其他人會回 {error:'forbidden'})
// ─────────────────────────────────────────────

export async function getAdminOverview() {
  const { data, error } = await getSupabase().rpc('get_admin_overview');
  if (error) throw error;
  return data;
}

export async function getAdminUserList(month = null) {
  const params = month ? { target_month: month } : {};
  const { data, error } = await getSupabase().rpc('get_admin_user_list', params);
  if (error) throw error;
  return data;
}

/**
 * 取我的本月統計。
 * @param {string|null} month 'YYYY-MM-01',不傳 = 當月
 */
export async function getMyMonthlyStats(month = null) {
  const params = month ? { target_month: month } : {};
  const { data, error } = await getSupabase().rpc('get_my_monthly_stats', params);
  if (error) throw error;
  return data;
}

/**
 * 取月排行榜。
 * @param {string|null} month 'YYYY-MM-01',不傳 = 當月
 * @param {number} topN 前 N 名,預設 10
 */
export async function getMonthlyLeaderboard(month = null, topN = 10) {
  const params = { top_n: topN };
  if (month) params.target_month = month;
  const { data, error } = await getSupabase().rpc('get_monthly_leaderboard', params);
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// 訪客模式
// ─────────────────────────────────────────────

/**
 * 取訪客可玩的題目(昨天的,或 fallback OXYGEN)。
 * 回傳 { puzzle_id, word_length, category, is_fallback }
 */
export async function getGuestPuzzle() {
  const { data, error } = await getSupabase().rpc('get_guest_puzzle');
  if (error) throw error;
  return data;
}

/**
 * 訪客送出一次猜測(不寫 DB,後端無狀態比對)。
 * 回傳:
 *   - { colors, solved, answer }       // 猜中才有 answer
 *   - { error: <code>, message: <zh> } // 業務錯誤
 */
export async function tryGuess(puzzleId, guess) {
  const { data, error } = await getSupabase().rpc('try_guess', {
    puzzle_id: puzzleId,
    guess_input: guess
  });
  if (error) throw error;
  return data;
}
