// What's New modal — 每次有更新,回訪用戶會看到一次
//
// 觸發時機:
//   1. main.js 啟動時呼叫 maybeShowUpdateModal()
//   2. 若用戶是第一次進站(尚未看過 how-to),會自動把所有 update 標記已讀
//      → 新手不會被「更新公告」干擾(那些對他們而言根本不算更新)
//   3. 回訪者:列出所有「未讀」+「showAfter 已到」的更新,使用者關掉後標記已讀
//
// 我下一次要再公告新東西時:
//   只要在下方 UPDATES 陣列的「最上方」加一個物件即可,version 用唯一字串
//   (建議格式 'YYYY-MM-DD-shortname'),系統會自動偵測未讀版本並彈出。
//
// 進階欄位:
//   - showAfter: 'YYYY-MM-DD' (台灣時區),今天 < showAfter 時不彈
//                (用來「先 deploy、到日子才自動曝光」)
//   - body: string | async () => string
//                若為 function,在彈出前才求值 — 可以視 auth 狀態 fetch 個人資料

import { showModal } from './modal.js';
import { isAuthenticated } from '../auth.js';
import { getMyMonthlyRewards } from '../api.js';

const SEEN_KEY = 'chemwordle:updates_seen';

// ── 更新清單(新的放最上面) ─────────────────
const UPDATES = [
  {
    version: '2026-06-01-may-awards',
    date: '6/1',
    title: '🏆 5 月活動結算 + 領獎通知',
    showAfter: '2026-06-01',
    body: async () => {
      const baseHtml = `
        <p>5 月活動圓滿結束,感謝同學參與!</p>
        <p>領獎時間:<strong>6/3(三)下午 2 點</strong>,地點:<strong>CH118</strong>(包含全勤獎 / 參加獎 / 月排行)。</p>
        <p class="update-note">
          若當天無法前來,可以之後與我實驗室同學領取。<br>
          有問題請來信:<a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)
        </p>
      `;
      let personalHtml = '';
      try {
        if (await isAuthenticated()) {
          const r = await getMyMonthlyRewards('2026-05-01');
          personalHtml = renderPersonalRewardsCard(r);
        }
      } catch (e) {
        console.warn('[update-modal] 個人獎勵載入失敗(略過個人區塊):', e);
      }
      return personalHtml + baseHtml;
    }
  },
  {
    version: '2026-05-29-award-ceremony',
    date: '5/29',
    title: '🏆 本月頒獎通知',
    body: `
      <p>感謝同學的參與!本月活動即將進入結算。</p>
      <p>我們將於 <strong>6/3(三)下午 2 點</strong>,在 <strong>CH118</strong> 進行頒獎(包含<strong>全勤獎</strong>與<strong>參加獎</strong>)。</p>
      <p class="update-note">
        若當天無法前來,可以之後與我實驗室的同學領取。<br>
        有任何問題請來信:<a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)
      </p>
    `
  },
  {
    version: '2026-04-30-dict-fix',
    date: '4/30',
    title: '🐛 Bug 修正:答案被判無效字',
    body: `
      <p>之前有少數題目的答案不在字典中,導致使用者打進<strong>正確答案</strong>反而被擋下「不是有效單字」,白白用掉次數。已全數修正,並加上自動同步機制,日後新題目不會再發生。</p>
      <p class="update-note">
        若你受到影響(成績不公),或之後遇到任何 bug、想反映建議,請來信:<br>
        <a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)<br>
        告訴我你的 email + 哪一天 + 什麼狀況,我可以手動幫你補分。
      </p>
    `
  },
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

/** 台灣今天 'YYYY-MM-DD' */
function twTodayStr() {
  const now = new Date();
  // TW = UTC+8(無夏令時間)
  const tw = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  const y = tw.getFullYear();
  const m = String(tw.getMonth() + 1).padStart(2, '0');
  const d = String(tw.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isReady(update) {
  if (!update.showAfter) return true;
  return twTodayStr() >= update.showAfter;
}

function getUnseenUpdates() {
  const seen = new Set(loadSeen());
  return UPDATES.filter(u => !seen.has(u.version) && isReady(u));
}

/**
 * 把「目前所有 UPDATES」標記成已讀(不彈窗)。
 * 第一次進站的新手用,讓他們不會看到歷史公告。
 * 注意:也會把「尚未到 showAfter」的 entry 標記已讀 — 對新手而言這是合理的
 * (他不需要看舊事件的公告;showAfter 的版本就也算「過去了」)。
 */
export function markAllUpdatesSeen() {
  saveSeen(UPDATES.map(u => u.version));
}

/**
 * 啟動時呼叫:有未讀且到時間的就彈,沒就什麼也不做。
 */
export async function maybeShowUpdateModal() {
  const unseen = getUnseenUpdates();
  if (unseen.length === 0) return;

  // 求值所有 async body(可能會 fetch 個人資料)
  const resolved = await Promise.all(unseen.map(async u => ({
    ...u,
    bodyHtml: typeof u.body === 'function' ? await u.body() : u.body
  })));

  await showModal({
    title: '✨ 系統更新',
    body: renderUpdatesHtml(resolved),
    closeText: '知道了'
  });

  // 全部標記已讀(包含「沒準備好的」未來公告 — 之後當它們到 showAfter
  // 也不會再彈了。如果想之後重彈,改 version 字串)
  saveSeen(UPDATES.map(u => u.version));
}

function renderUpdatesHtml(updates) {
  return `
    <div class="update-content">
      ${updates.map(u => `
        <section class="update-item">
          <div class="update-date">${u.date}</div>
          <h3 class="update-title">${u.title}</h3>
          <div class="update-body">${u.bodyHtml}</div>
        </section>
      `).join('')}
    </div>
  `;
}

/**
 * 個人獎勵卡片 HTML(popup 與 /stats 頁共用,但保持獨立避免循環依賴)
 */
function renderPersonalRewardsCard(r) {
  if (!r || r.error) return '';
  const parts = [];
  if (r.full_attendance) {
    parts.push(`<li>✅ <strong>全勤獎</strong>:出席滿 ${r.total_days} 天 → <strong>2 張</strong></li>`);
  } else if (r.attend_days > 0) {
    parts.push(`<li>⬜ 全勤獎:出席 ${r.attend_days} / ${r.total_days} 天(未達)</li>`);
  }
  if (r.participation) {
    parts.push(`<li>✅ <strong>參加獎</strong>:出席 ${r.attend_days} 天(≥ 20) → <strong>1 張</strong></li>`);
  } else if (r.attend_days > 0) {
    parts.push(`<li>⬜ 參加獎:出席 ${r.attend_days} / 20 天(未達)</li>`);
  }
  if (r.top_rank === 1) {
    parts.push(`<li>🥇 <strong>月排行第 1 名</strong> → <strong>10 張</strong></li>`);
  } else if (r.top_rank === 2) {
    parts.push(`<li>🥈 <strong>月排行第 2 名</strong> → <strong>6 張</strong></li>`);
  } else if (r.top_rank === 3) {
    parts.push(`<li>🥉 <strong>月排行第 3 名</strong> → <strong>4 張</strong></li>`);
  }

  if (parts.length === 0) {
    return `
      <div class="reward-card">
        <div class="reward-card-title">你的 5 月獎勵</div>
        <p class="text-muted" style="margin:0.25rem 0 0;">本月沒有提交紀錄,沒有獎勵 ☹️</p>
      </div>
    `;
  }

  return `
    <div class="reward-card">
      <div class="reward-card-title">🍦 你的 5 月可領獎勵</div>
      <div class="reward-total">共 <strong>${r.total_coupons}</strong> 張霜淇淋券</div>
      <ul class="reward-list">${parts.join('')}</ul>
    </div>
  `;
}
