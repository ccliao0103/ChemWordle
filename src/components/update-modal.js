// What's New modal — 每次有更新,回訪用戶會看到一次
//
// 觸發時機:
//   1. main.js 啟動時呼叫 maybeShowUpdateModal()
//   2. 第一次進站(未看過 how-to)→ markAllUpdatesSeen,不打擾新手
//   3. 回訪者:列出所有「未讀」+「在 showAfter..showUntil 區間內」的更新
//
// 進階欄位:
//   - showAfter: 'YYYY-MM-DD' (台灣時區),今天 < showAfter 時不彈
//   - showUntil: 'YYYY-MM-DD' (台灣時區),今天 >= showUntil 時不彈(過期)
//   - body: string | async () => string
//                若為 function,在彈出前才求值 — 可以視 auth 狀態 fetch 個人資料

import { showModal } from './modal.js';
import { isAuthenticated } from '../auth.js';
import { getMyMonthlyRewards } from '../api.js';

const SEEN_KEY = 'chemwordle:updates_seen';

// 月排行獎品對照表(by Olympic rank,並列共享獎品)
// 跟後端 SQL 的 v_award_table 對應
const RANK_AWARD_TABLE = [10, 6, 6, 4, 3, 3, 2, 2, 1, 1];

// ── 更新清單(新的放最上面) ─────────────────
const UPDATES = [
  {
    version: '2026-06-05-june-prize-voucher',
    date: '6/5',
    title: '🎁 6 月獎勵調整公告',
    showUntil: '2026-07-01',  // 6 月活動結束前都顯示
    body: `
      <p>考量 5 月已有不少同學得獎、6 月很可能<strong>得獎人重複</strong>,怕大家手上霜淇淋券吃不完 🍦,<strong>6 月份月排行前 10 名改發禮券</strong>:</p>
      <ul class="update-list">
        <li>🥇 第 1 名 → <strong>400 元禮券</strong></li>
        <li>第 2-5 名 → <strong>200 元禮券</strong></li>
        <li>第 6-10 名 → <strong>100 元禮券</strong></li>
      </ul>
      <p class="update-note">
        ※ <strong>全勤獎 + 參加獎維持原本霜淇淋券</strong>(全勤 2 張 / 參加 1 張),規則不變。<br>
        ※ 6 月活動依然按月排行 top 10 給獎,只是把獎品從券改成禮券。<br>
        ※ 有問題請來信:<a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)
      </p>
    `
  },
  {
    version: '2026-06-04-pending-pickup',
    date: '6/4',
    title: '🍦 還沒領獎品的同學請注意',
    showUntil: '2026-06-30',  // 5 月活動結束前都還能補領
    body: `
      <p>6/3 的頒獎已順利結束,但<strong>還有不少同學尚未來領取</strong>。</p>
      <p>還沒領到霜淇淋券 / 獎狀的同學,請至 <strong>CH207</strong> 找我領取(平日上班時間,可以先用 email 約個時間)。</p>
      <p class="update-note">
        ※ 不確定自己有沒有領到獎?到 <a href="#/stats">我的成績</a> 看自己的試算。<br>
        ※ 有問題或想預約時間請來信:<a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)
      </p>
    `
  },
  {
    version: '2026-05-29-rank-expansion',
    date: '5/29',
    title: '🎁 獎勵加碼:月排行擴大到 top 10!',
    showUntil: '2026-06-01',  // 6/1 起改由「結算公告」接力,這則就退場
    body: `
      <p>原本月排行只發給前三名,本月起 <strong>top 10 都有獎</strong>!</p>
      <ul class="update-list">
        <li>🥇 1 → <strong>10 張</strong> &nbsp;/&nbsp; 🥈 2 → <strong>6 張</strong> &nbsp;/&nbsp; 🥉 3 → <strong>4 張</strong></li>
        <li>4 → <strong>4 張</strong> &nbsp;/&nbsp; 5-6 → <strong>3 張</strong> &nbsp;/&nbsp; 7-8 → <strong>2 張</strong> &nbsp;/&nbsp; 9-10 → <strong>1 張</strong></li>
      </ul>
      <p class="update-note">
        ※ 同分以「總分 → 答對次數 → 平均猜測」決勝,並列同名次共享同樣獎品。<br>
        ※ <strong>5/31 23:59</strong> 截止,6/1 公布結算,<strong>6/3(三)14:00 於 CH118</strong> 領獎。<br>
        ※ 想看自己目前能拿幾張?到 <a href="#/stats">我的成績</a> 看試算。
      </p>
    `
  },
  {
    version: '2026-06-01-may-awards',
    date: '6/1',
    title: '🏆 5 月活動結算 + 領獎通知',
    showAfter: '2026-06-01',
    showUntil: '2026-06-04',  // 6/4 起自動下架
    body: async () => {
      const baseHtml = `
        <p>5 月活動圓滿結束,感謝同學參與!</p>
        <p>領獎時間:<strong>6/3(三)下午 2 點</strong>,地點:<strong>CH118</strong>(包含全勤獎、參加獎、月排行 top 10)。</p>
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
        ※ 月排行維持不變。<br>
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
  const tw = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  const y = tw.getFullYear();
  const m = String(tw.getMonth() + 1).padStart(2, '0');
  const d = String(tw.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isReady(update) {
  const today = twTodayStr();
  if (update.showAfter && today < update.showAfter) return false;
  if (update.showUntil && today >= update.showUntil) return false;
  return true;
}

function getUnseenUpdates() {
  const seen = new Set(loadSeen());
  return UPDATES.filter(u => !seen.has(u.version) && isReady(u));
}

export function markAllUpdatesSeen() {
  saveSeen(UPDATES.map(u => u.version));
}

export async function maybeShowUpdateModal() {
  const unseen = getUnseenUpdates();
  if (unseen.length === 0) return;

  const resolved = await Promise.all(unseen.map(async u => ({
    ...u,
    bodyHtml: typeof u.body === 'function' ? await u.body() : u.body
  })));

  await showModal({
    title: '✨ 系統更新',
    body: renderUpdatesHtml(resolved),
    closeText: '知道了'
  });

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
 * 個人獎勵卡片 HTML(popup 用)
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
  if (r.top_rank && r.top_rank >= 1 && r.top_rank <= 10 && r.rank_award > 0) {
    const emoji = r.top_rank === 1 ? '🥇'
                : r.top_rank === 2 ? '🥈'
                : r.top_rank === 3 ? '🥉'
                : '🏅';
    parts.push(`<li>${emoji} <strong>月排行第 ${r.top_rank} 名</strong> → <strong>${r.rank_award} 張</strong></li>`);
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
