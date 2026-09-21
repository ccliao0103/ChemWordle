// Page: 排行榜 #/leaderboard
//
// 兩個分頁:
//   - 累積榜(預設):get_lifetime_leaderboard(),從 relaunch_date 起累積,
//     排序為 答對 desc → 挑戰天數 desc → 平均猜測 asc
//   - 歷史(2026 競賽期):get_monthly_leaderboard(),保留 4/5/6 月的舊月榜,
//     讓當時得獎的同學還看得到自己的名字(見 DECISIONS.md #4)

import { getLifetimeLeaderboard, getMonthlyLeaderboard } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { formatMonthZh, escapeHtml } from '../utils.js';

const HISTORY_MONTHS = [
  { value: '2026-05-01', label: '2026 年 5 月' },
  { value: '2026-06-01', label: '2026 年 6 月' }
];

let _tab = 'lifetime';                       // 'lifetime' | 'history'
let _historyMonth = HISTORY_MONTHS[1].value; // 預設看 6 月(競賽最後一個月)

export async function render(container /* , params */) {
  await load(container);
}

async function load(container) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入排行榜中…'));

  let data;
  try {
    data = _tab === 'lifetime'
      ? await getLifetimeLeaderboard()
      : await getMonthlyLeaderboard(_historyMonth);
  } catch (e) {
    console.error('[leaderboard] load failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>載入排行榜失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <section>
      <h2 class="page-title">排行榜</h2>

      <div class="tab-bar" role="tablist">
        <button type="button" class="tab ${_tab === 'lifetime' ? 'is-active' : ''}"
                data-tab="lifetime" role="tab">累積榜</button>
        <button type="button" class="tab ${_tab === 'history' ? 'is-active' : ''}"
                data-tab="history" role="tab">歷史(2026 競賽期)</button>
      </div>

      <div id="lb-body">
        ${_tab === 'lifetime' ? renderLifetime(data) : renderHistory(data)}
      </div>

      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        <a class="btn btn-secondary" href="#/stats">看我的成績</a>
        <a class="btn btn-secondary" href="#/game">回到遊戲</a>
      </div>
    </section>
  `;

  container.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const next = btn.dataset.tab;
      if (next === _tab) return;
      _tab = next;
      await load(container);
    });
  });

  const sel = container.querySelector('#lb-history-month');
  if (sel) {
    sel.addEventListener('change', async (e) => {
      _historyMonth = e.target.value;
      await load(container);
    });
  }
}

// ─────────────────────────────────────────────
// 累積榜
// ─────────────────────────────────────────────
function renderLifetime(d) {
  const top = Array.isArray(d.top) ? d.top : [];
  const me = d.my_rank;
  const since = d.relaunch_date ? String(d.relaunch_date).replaceAll('-', ' / ') : '';

  if (top.length === 0) {
    return `
      <p class="lb-note">統計自 ${escapeHtml(since)} 起</p>
      <div class="card text-center text-muted">
        還沒有人挑戰過,你可以是第一個 — <a href="#/game">今日題目</a>
      </div>
    `;
  }

  const myRankNum = me?.rank ?? null;
  const rows = top.map((r) => `
    <tr class="${myRankNum && r.rank === myRankNum ? 'is-me' : ''}">
      <td>${r.rank}</td>
      <td>${escapeHtml(r.name || '—')}</td>
      <td><span class="class-tag">${escapeHtml(r.class_name || '—')}</span></td>
      <td>${r.solved ?? 0}</td>
      <td>${r.challenged ?? 0}</td>
      <td>${r.accuracy != null ? escapeHtml(String(r.accuracy)) + '%' : '—'}</td>
    </tr>
  `).join('');

  return `
    <p class="lb-note">統計自 ${escapeHtml(since)} 起 · 依累積答對題數排序</p>

    ${me ? `
      <div class="my-rank-card">
        <div>
          <div class="rank">你的排名:第 ${me.rank} 名</div>
          <div class="detail">
            答對 ${me.solved ?? 0} 題 · 挑戰 ${me.challenged ?? 0} 天
            ${me.accuracy != null ? ` · 命中率 ${escapeHtml(String(me.accuracy))}%` : ''}
          </div>
        </div>
      </div>
    ` : `
      <div class="card text-muted text-center" style="margin:1rem 0;">
        你還沒有挑戰紀錄,玩過就會出現在這裡。
      </div>
    `}

    <table class="rank-table">
      <thead>
        <tr>
          <th>排名</th>
          <th>姓名</th>
          <th>身分</th>
          <th>答對</th>
          <th>挑戰</th>
          <th>命中率</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─────────────────────────────────────────────
// 歷史月榜(2026 競賽期)
// ─────────────────────────────────────────────
function renderHistory(d) {
  const top = Array.isArray(d.top) ? d.top : [];
  const me = d.my_rank;
  const myRankNum = me?.rank ?? null;

  const picker = `
    <div class="leaderboard-header">
      <p class="lb-note" style="margin:0;">
        ${escapeHtml(formatMonthZh(d.month))} · 這是已結束的競賽期紀錄,僅供回顧
      </p>
      <label class="month-picker">
        月份:
        <select id="lb-history-month">
          ${HISTORY_MONTHS.map(m => `
            <option value="${m.value}" ${m.value === _historyMonth ? 'selected' : ''}>${m.label}</option>
          `).join('')}
        </select>
      </label>
    </div>
  `;

  if (top.length === 0) {
    return picker + `<div class="card text-center text-muted">這個月沒有紀錄。</div>`;
  }

  const rows = top.map((r) => `
    <tr class="${myRankNum && r.rank === myRankNum ? 'is-me' : ''}">
      <td>${r.rank}</td>
      <td>${escapeHtml(r.name || '—')}</td>
      <td><span class="class-tag">${escapeHtml(r.class_name || '—')}</span></td>
      <td>${r.total_score ?? 0}</td>
      <td>${r.attend_days ?? 0}</td>
      <td>${r.solved_count ?? 0}</td>
    </tr>
  `).join('');

  return picker + `
    <table class="rank-table">
      <thead>
        <tr>
          <th>排名</th>
          <th>姓名</th>
          <th>身分</th>
          <th>總分</th>
          <th>出席</th>
          <th>答對</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
