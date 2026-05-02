// What's New modal — 每次有更新,回訪用戶會看到一次
//
// 觸發時機:
//   1. main.js 啟動時呼叫 maybeShowUpdateModal()
//   2. 若用戶是第一次進站(尚未看過 how-to),會自動把所有 update 標記已讀
//      → 新手不會被「更新公告」干擾(那些對他們而言根本不算更新)
//   3. 回訪者:列出所有「未讀」的更新,使用者關掉後全部標記已讀
//
// 我下一次要再公告新東西時:
//   只要在下方 UPDATES 陣列的「最上方」加一個物件即可,version 用唯一字串
//   (建議格式 'YYYY-MM-DD-shortname'),系統會自動偵測未讀版本並彈出。

import { showModal } from './modal.js';

const SEEN_KEY = 'chemwordle:updates_seen';

// ── 更新清單(新的放最上面) ─────────────────
const UPDATES = [
  {
    version: '2026-04-30-rewards',
    date: '4/30',
    title: '🎁 獎勵辦法調整',
    body: `
      <ul class="update-list">
        <li><strong>全勤獎加碼</strong>:該月每天都有提交紀錄 → 霜淇淋券由 1 張 → <strong>2 張</strong></li>
        <li><strong>新增「參加獎」</strong>:該月出席達 <strong>20 天(含)以上</strong> → 額外獲得 <strong>霜淇淋券 1 張</strong></li>
      </ul>
      <p class="update-note">
        ※ 月排行(🥇10 / 🥈6 / 🥉4 張)維持不變。<br>
        ※ 這些獎勵可同時獲得,不擇優。例如全勤(出席 30 天)就能拿到 2 + 1 = 3 張。
      </p>
    `
  }
  // 之後新公告往這上面加,例如:
  // {
  //   version: '2026-05-15-something',
  //   date: '5/15',
  //   title: '...',
  //   body: '...'
  // }
];

// ─── 工具 ────────────────────────────────
function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSeen(versions) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(versions));
  } catch {}
}

function getUnseenUpdates() {
  const seen = new Set(loadSeen());
  return UPDATES.filter(u => !seen.has(u.version));
}

/**
 * 把「目前所有 UPDATES」標記成已讀(不彈窗)。
 * 第一次進站的新手用,讓他們不會看到歷史公告。
 */
export function markAllUpdatesSeen() {
  saveSeen(UPDATES.map(u => u.version));
}

/**
 * 啟動時呼叫:有未讀就彈,沒未讀就什麼也不做。
 * @param {boolean} silent 若為 true,只標記已讀不彈窗(給第一次進站的新手用)
 */
export async function maybeShowUpdateModal({ silent = false } = {}) {
  const unseen = getUnseenUpdates();
  if (unseen.length === 0) return;

  if (silent) {
    markAllUpdatesSeen();
    return;
  }

  await showModal({
    title: '✨ 系統更新',
    body: renderUpdatesHtml(unseen),
    closeText: '知道了'
  });

  // 不論看完幾個,全部標記已讀
  saveSeen(UPDATES.map(u => u.version));
}

function renderUpdatesHtml(updates) {
  return `
    <div class="update-content">
      ${updates.map(u => `
        <section class="update-item">
          <div class="update-date">${u.date}</div>
          <h3 class="update-title">${u.title}</h3>
          <div class="update-body">${u.body}</div>
        </section>
      `).join('')}
    </div>
  `;
}
