// Page: 我的統計 #/stats
//
// 進入呼叫 get_my_monthly_stats(),拿:
//   { month, attend_days, active_days_so_far, solved_count, failed_count,
//     total_score, avg_guess_count, played_today }
// 顯示:
//   - 大字 "N 月成績"
//   - 5 張卡片:總分 / 出席 / 答對 / 答錯 / 平均猜測
//   - 今日狀態徽章
//   - 看排行榜按鈕

import { getMyMonthlyStats } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { escapeHtml } from '../utils.js';

export async function render(container /* , params */) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入統計中…'));

  let data;
  try {
    data = await getMyMonthlyStats();
  } catch (e) {
    console.error('[stats] getMyMonthlyStats failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>載入統計失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  renderStats(container, data);
}

function renderStats(container, d) {
  const monthNum = monthNumberOf(d.month);
  const played = !!d.played_today;
  const attend = d.attend_days ?? 0;
  const activeSoFar = d.active_days_so_far ?? 0;

  container.innerHTML = `
    <section>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <h2 class="page-title" style="margin:0;">${monthNum} 月成績</h2>
        <span class="badge ${played ? 'badge-ok' : 'badge-warn'}">
          ${played ? '✓ 今日已完成' : '⚠ 今日尚未挑戰'}
        </span>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">總分</div>
          <div class="stat-value">${d.total_score ?? 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">出席天數</div>
          <div class="stat-value">${attend}<span class="sub">/ ${activeSoFar} 天</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">答對</div>
          <div class="stat-value">${d.solved_count ?? 0}<span class="sub">次</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">答錯</div>
          <div class="stat-value">${d.failed_count ?? 0}<span class="sub">次</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均猜測</div>
          <div class="stat-value">${escapeHtml(d.avg_guess_count ?? '—')}<span class="sub">次</span></div>
        </div>
      </div>

      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        ${played
          ? `<a class="btn btn-secondary" href="#/game">看今日結果</a>`
          : `<a class="btn" href="#/game">挑戰今日題目</a>`
        }
        <a class="btn btn-secondary" href="#/leaderboard">看排行榜</a>
      </div>
    </section>
  `;
}

/** '2026-04-01' → 4 */
function monthNumberOf(monthVal) {
  if (!monthVal) return '?';
  const m = String(monthVal).split('-')[1];
  return m ? parseInt(m, 10) : '?';
}
