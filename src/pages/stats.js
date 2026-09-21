// Page: 我的成績 #/stats
//
// 常駐練習模式:顯示累積統計,不再有月份與獎勵。
//   - streak 大字(連續挑戰天數,允許中間缺 1 天)
//   - 累積挑戰 / 答對 / 命中率 / 最長連續
//   - 今日狀態與行動按鈕
//
// 資料來自 get_my_lifetime_stats(),只計算 relaunch_date 之後的紀錄。

import { getMyLifetimeStats } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { escapeHtml } from '../utils.js';

export async function render(container /* , params */) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入成績中…'));

  let d;
  try {
    d = await getMyLifetimeStats();
  } catch (e) {
    console.error('[stats] getMyLifetimeStats failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>載入成績失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  renderStats(container, d);
}

function renderStats(container, d) {
  const challenged = d.challenged ?? 0;
  const solved = d.solved ?? 0;
  const streak = d.streak ?? 0;
  const best = d.best_streak ?? 0;
  const accuracy = d.accuracy;
  const playedToday = !!d.played_today;

  // 還沒玩過 → 給一個歡迎畫面而不是一整排 0
  if (challenged === 0) {
    container.innerHTML = `
      <section>
        <h2 class="page-title">我的成績</h2>
        <div class="card text-center" style="margin:1.5rem 0;">
          <p style="font-size:1.05rem;margin:0 0 0.5rem;">還沒有紀錄 — 今天就是第 1 天 👋</p>
          <p class="text-muted" style="margin:0;">每天花 1 分鐘猜一個化學英文單字,紀錄會累積在這裡。</p>
        </div>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
          <a class="btn" href="#/game">開始今日題目</a>
          <a class="btn btn-secondary" href="#/leaderboard">看排行榜</a>
        </div>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <section>
      <div class="stats-header">
        <h2 class="page-title" style="margin:0;">我的成績</h2>
        <span class="badge ${playedToday ? 'badge-ok' : 'badge-warn'}">
          ${playedToday ? '✓ 今日已完成' : '⚠ 今日尚未挑戰'}
        </span>
      </div>

      ${renderStreakCard(streak, best, playedToday)}

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">累積挑戰</div>
          <div class="stat-value">${challenged}<span class="sub">天</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">累積答對</div>
          <div class="stat-value">${solved}<span class="sub">題</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">命中率</div>
          <div class="stat-value">${accuracy != null ? escapeHtml(String(accuracy)) : '—'}<span class="sub">%</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最長連續</div>
          <div class="stat-value">${best}<span class="sub">天</span></div>
        </div>
      </div>

      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        ${playedToday
          ? `<a class="btn btn-secondary" href="#/game">看今日結果</a>`
          : `<a class="btn" href="#/game">挑戰今日題目</a>`
        }
        <a class="btn btn-secondary" href="#/leaderboard">看排行榜</a>
      </div>
    </section>
  `;
}

function renderStreakCard(streak, best, playedToday) {
  // streak 斷了(0)但以前有紀錄 → 鼓勵重新開始,而不是顯示一個難看的 0
  if (streak === 0) {
    return `
      <div class="streak-card streak-broken">
        <div class="streak-flame">🌱</div>
        <div>
          <div class="streak-num">重新開始</div>
          <div class="streak-sub">
            連續紀錄已中斷,今天挑戰就能重新累積。最長紀錄 <strong>${best}</strong> 天。
          </div>
        </div>
      </div>
    `;
  }

  const hint = playedToday
    ? (streak === best && best > 1
        ? '這是你的最佳紀錄,繼續保持!'
        : `明天再來就是第 ${streak + 1} 天。`)
    : '今天還沒挑戰 — 完成今天就能延續。';

  return `
    <div class="streak-card">
      <div class="streak-flame">🔥</div>
      <div>
        <div class="streak-num">連續 <strong>${streak}</strong> 天</div>
        <div class="streak-sub">${escapeHtml(hint)}</div>
      </div>
    </div>
  `;
}
