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

import { getMyMonthlyStats, getMyMonthlyRewards } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { escapeHtml } from '../utils.js';

export async function render(container /* , params */) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入統計中…'));

  let stats, rewards;
  try {
    [stats, rewards] = await Promise.all([
      getMyMonthlyStats(),
      // 獎勵試算失敗不要擋整頁 — 個別 catch 後傳 null
      getMyMonthlyRewards().catch((e) => {
        console.warn('[stats] getMyMonthlyRewards failed:', e);
        return null;
      })
    ]);
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

  renderStats(container, stats, rewards);
}

function renderStats(container, d, rewards) {
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

      ${renderRewardCard(rewards, monthNum)}

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

function renderRewardCard(r, monthNum) {
  if (!r || r.error || (r.attend_days ?? 0) === 0) {
    // 還沒玩過任何一題 → 不顯示獎勵卡片(避免空訊息煩人)
    return '';
  }

  const parts = [];
  if (r.full_attendance) {
    parts.push(`<li>✅ <strong>全勤獎</strong>:出席滿 ${r.total_days} 天 → <strong>2 張</strong></li>`);
  } else {
    const needMore = r.total_days - r.attend_days;
    parts.push(`<li>⬜ 全勤獎(出席滿 ${r.total_days} 天 → 2 張):還差 <strong>${needMore} 天</strong></li>`);
  }
  if (r.participation) {
    parts.push(`<li>✅ <strong>參加獎</strong>:出席 ${r.attend_days} 天(≥ 20)→ <strong>1 張</strong></li>`);
  } else {
    const needMore = Math.max(0, 20 - r.attend_days);
    parts.push(`<li>⬜ 參加獎(出席 ≥ 20 天 → 1 張):還差 <strong>${needMore} 天</strong></li>`);
  }
  if (r.top_rank && r.top_rank >= 1 && r.top_rank <= 10 && r.rank_award > 0) {
    const emoji = r.top_rank === 1 ? '🥇'
                : r.top_rank === 2 ? '🥈'
                : r.top_rank === 3 ? '🥉'
                : '🏅';
    parts.push(`<li>${emoji} <strong>月排行第 ${r.top_rank} 名</strong>(top 10)→ <strong>${r.rank_award} 張</strong></li>`);
  } else if (r.top_rank && r.top_rank > 10) {
    parts.push(`<li>⬜ 月排行第 ${r.top_rank} 名(未進 top 10)</li>`);
  }

  return `
    <div class="reward-card">
      <div class="reward-card-title">🍦 ${monthNum} 月可領獎勵</div>
      <div class="reward-total">目前可領 <strong>${r.total_coupons}</strong> 張霜淇淋券</div>
      <ul class="reward-list">${parts.join('')}</ul>
      <p class="reward-note">月底結算後確定。月排行 5/31 23:59 截止。</p>
    </div>
  `;
}

/** '2026-04-01' → 4 */
function monthNumberOf(monthVal) {
  if (!monthVal) return '?';
  const m = String(monthVal).split('-')[1];
  return m ? parseInt(m, 10) : '?';
}
