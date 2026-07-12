// Page: 我的統計 #/stats
//
// 進入呼叫 get_my_monthly_stats() + get_my_monthly_rewards(),各拿一份月度資料。
// 顯示:
//   - 標題「N 月成績」+ 月份切換(4/5/6 月)
//   - 5 張卡片:總分 / 出席 / 答對 / 答錯 / 平均猜測
//   - 「今日狀態」徽章(只在看當月時顯示)
//   - 獎勵試算卡片(6 月是霜淇淋券 + 禮券並列;5 月是純霜淇淋券)
//   - 動作按鈕(挑戰今日 / 排行榜)

import { getMyMonthlyStats, getMyMonthlyRewards } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { escapeHtml } from '../utils.js';

const AVAILABLE_MONTHS = [
  { value: '2026-04-01', label: '4 月(試營運)' },
  { value: '2026-05-01', label: '5 月' },
  { value: '2026-06-01', label: '6 月' }
];

function defaultMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (y === 2026) {
    if (m <= 4) return '2026-04-01';
    if (m === 5) return '2026-05-01';
    if (m >= 6) return '2026-06-01';  // 6 月當月 & 7 月起(活動結束後)都預設看 6 月
  }
  if (y > 2026) return '2026-06-01';  // 活動結束後永遠停留在 6 月
  return '2026-05-01';
}

function isCurrentActualMonth(monthValue) {
  const now = new Date();
  const [y, m] = monthValue.split('-').map(Number);
  return y === now.getFullYear() && m === (now.getMonth() + 1);
}

let _selectedMonth = defaultMonth();

export async function render(container /* , params */) {
  await load(container);
}

async function load(container) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入統計中…'));

  let stats, rewards;
  try {
    [stats, rewards] = await Promise.all([
      getMyMonthlyStats(_selectedMonth),
      // 獎勵試算失敗不要擋整頁 — 個別 catch 後傳 null
      getMyMonthlyRewards(_selectedMonth).catch((e) => {
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
  const isCurrent = isCurrentActualMonth(_selectedMonth);
  const played = !!d.played_today;
  const attend = d.attend_days ?? 0;
  const activeSoFar = d.active_days_so_far ?? 0;

  container.innerHTML = `
    <section>
      <div class="stats-header">
        <h2 class="page-title" style="margin:0;">${monthNum} 月成績</h2>
        <div class="stats-header-controls">
          <label class="month-picker">
            月份:
            <select id="stats-month-select">
              ${AVAILABLE_MONTHS.map(m => `
                <option value="${m.value}" ${m.value === _selectedMonth ? 'selected' : ''}>${m.label}</option>
              `).join('')}
            </select>
          </label>
          ${isCurrent ? `
            <span class="badge ${played ? 'badge-ok' : 'badge-warn'}">
              ${played ? '✓ 今日已完成' : '⚠ 今日尚未挑戰'}
            </span>
          ` : ''}
        </div>
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

      ${renderRewardCard(rewards, monthNum, isCurrent)}

      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        ${isCurrent ? (played
          ? `<a class="btn btn-secondary" href="#/game">看今日結果</a>`
          : `<a class="btn" href="#/game">挑戰今日題目</a>`
        ) : ''}
        <a class="btn btn-secondary" href="#/leaderboard">看排行榜</a>
      </div>
    </section>
  `;

  // 月份切換
  const sel = container.querySelector('#stats-month-select');
  if (sel) {
    sel.addEventListener('change', async (e) => {
      _selectedMonth = e.target.value;
      await load(container);
    });
  }
}

function renderRewardCard(r, monthNum, isCurrent) {
  if (!r || r.error || (r.attend_days ?? 0) === 0) {
    return '';
  }

  const iceCount   = r.total_coupons ?? 0;
  const voucherAmt = r.total_voucher ?? r.voucher_amount ?? 0;
  const hasVoucher = voucherAmt > 0;

  const parts = [];
  if (r.full_attendance) {
    parts.push(`<li>✅ <strong>全勤獎</strong>:出席滿 ${r.total_days} 天 → <strong>霜淇淋券 2 張</strong></li>`);
  } else if (isCurrent) {
    const needMore = r.total_days - r.attend_days;
    parts.push(`<li>⬜ 全勤獎(出席滿 ${r.total_days} 天 → 2 張):還差 <strong>${needMore} 天</strong></li>`);
  } else {
    parts.push(`<li>⬜ 全勤獎(出席滿 ${r.total_days} 天 → 2 張):未達成(僅出席 ${r.attend_days} 天)</li>`);
  }

  if (r.participation) {
    parts.push(`<li>✅ <strong>參加獎</strong>:出席 ${r.attend_days} 天(≥ 20)→ <strong>霜淇淋券 1 張</strong></li>`);
  } else if (isCurrent) {
    const needMore = Math.max(0, 20 - r.attend_days);
    parts.push(`<li>⬜ 參加獎(出席 ≥ 20 天 → 1 張):還差 <strong>${needMore} 天</strong></li>`);
  } else {
    parts.push(`<li>⬜ 參加獎(出席 ≥ 20 天 → 1 張):未達成(僅出席 ${r.attend_days} 天)</li>`);
  }

  if (r.top_rank && r.top_rank >= 1 && r.top_rank <= 10) {
    const emoji = r.top_rank === 1 ? '🥇'
                : r.top_rank === 2 ? '🥈'
                : r.top_rank === 3 ? '🥉'
                : '🏅';
    if (voucherAmt > 0) {
      parts.push(`<li>${emoji} <strong>月排行第 ${r.top_rank} 名</strong>(top 10)→ <strong>禮券 ${voucherAmt} 元</strong></li>`);
    } else if (r.rank_award > 0) {
      parts.push(`<li>${emoji} <strong>月排行第 ${r.top_rank} 名</strong>(top 10)→ <strong>霜淇淋券 ${r.rank_award} 張</strong></li>`);
    }
  } else if (r.top_rank && r.top_rank > 10) {
    parts.push(`<li>⬜ 月排行第 ${r.top_rank} 名(未進 top 10)</li>`);
  }

  // 頂部總覽:霜淇淋券 + 禮券(視情況顯示)
  let totalLine;
  if (hasVoucher && iceCount > 0) {
    totalLine = `${isCurrent ? '目前可領' : '共領'} <strong>${iceCount}</strong> 張霜淇淋券 <span class="reward-plus">+</span> <strong>${voucherAmt}</strong> 元禮券`;
  } else if (hasVoucher) {
    totalLine = `${isCurrent ? '目前可領' : '共領'} <strong>${voucherAmt}</strong> 元禮券`;
  } else {
    totalLine = `${isCurrent ? '目前可領' : '共領'} <strong>${iceCount}</strong> 張霜淇淋券`;
  }

  return `
    <div class="reward-card">
      <div class="reward-card-title">🍦 ${monthNum} 月${isCurrent ? '可領' : '已領'}獎勵</div>
      <div class="reward-total">${totalLine}</div>
      <ul class="reward-list">${parts.join('')}</ul>
      ${isCurrent ? `<p class="reward-note">月底結算後確定。</p>` : ''}
    </div>
  `;
}

/** '2026-04-01' → 4 */
function monthNumberOf(monthVal) {
  if (!monthVal) return '?';
  const m = String(monthVal).split('-')[1];
  return m ? parseInt(m, 10) : '?';
}
