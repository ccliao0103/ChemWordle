// Page: 月排行榜 #/leaderboard
//
// 進入呼叫 get_monthly_leaderboard(),拿:
//   { month, top: [{rank, class_name, name, total_score, attend_days, solved_count, avg_guess_count}],
//     my_rank: {rank, total_score, attend_days, solved_count} | null }
// 顯示:
//   - 標題:「YYYY 年 M 月排行榜」
//   - 「我的排名」突出區塊(my_rank 不為 null 時)
//   - 前 10 名表格(顯示班別 tag 如「化三甲」)
//   - 若我在前 10 名,該列加亮 (.is-me)

import { getMonthlyLeaderboard } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { formatMonthZh, escapeHtml } from '../utils.js';

export async function render(container /* , params */) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入排行榜中…'));

  let data;
  try {
    data = await getMonthlyLeaderboard();
  } catch (e) {
    console.error('[leaderboard] getMonthlyLeaderboard failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>載入排行榜失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  renderLeaderboard(container, data);
}

function renderLeaderboard(container, d) {
  const monthLabel = formatMonthZh(d.month);
  const top = Array.isArray(d.top) ? d.top : [];
  const myRank = d.my_rank;

  container.innerHTML = `
    <section>
      <h2 class="page-title">${escapeHtml(monthLabel)} 排行榜</h2>

      ${renderMyRank(myRank)}

      ${top.length === 0
        ? `<div class="card text-center text-muted">本月還沒有人挑戰過,快去玩 <a href="#/game">今日題目</a>!</div>`
        : renderTopTable(top, myRank)
      }

      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        <a class="btn btn-secondary" href="#/stats">看我的成績</a>
        <a class="btn btn-secondary" href="#/game">回到遊戲</a>
      </div>
    </section>
  `;
}

function renderMyRank(my) {
  if (!my) {
    return `
      <div class="card text-muted text-center" style="margin:1rem 0;">
        你本月還沒有提交過任何挑戰,目前未列入排名。
      </div>
    `;
  }
  return `
    <div class="my-rank-card">
      <div>
        <div class="rank">你的排名:第 ${my.rank} 名</div>
        <div class="detail">
          ${my.total_score ?? 0} 分 · 出席 ${my.attend_days ?? 0} 天 · 答對 ${my.solved_count ?? 0} 次
        </div>
      </div>
    </div>
  `;
}

function renderTopTable(top, myRank) {
  const myRankNum = myRank?.rank ?? null;
  const rows = top.map((row) => {
    const isMe = myRankNum && row.rank === myRankNum;
    return `
      <tr class="${isMe ? 'is-me' : ''}">
        <td>${row.rank}</td>
        <td>${escapeHtml(row.name || '—')}</td>
        <td><span class="class-tag">${escapeHtml(row.class_name || '—')}</span></td>
        <td>${row.total_score ?? 0}</td>
        <td>${row.attend_days ?? 0}</td>
        <td>${row.solved_count ?? 0}</td>
      </tr>
    `;
  }).join('');

  return `
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
