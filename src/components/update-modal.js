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
//   - repeatDaily: true → 看過後隔天還會再彈(預設 false,只看一次)
//   - body: string | async () => string
//                若為 function,在彈出前才求值 — 可以視 auth 狀態 fetch 個人資料

import { showModal } from './modal.js';

const SEEN_KEY = 'chemwordle:updates_seen';

// ── 更新清單(新的放最上面) ─────────────────
//
// 2026-09 轉型為常駐練習模式時,清空了 5-6 月競賽期的 8 則公告
// (月排行獎、全勤獎、領獎通知等)。那些訊息對新的使用情境已無意義,
// 留著只會讓回訪的同學看到一串過期的獎勵辦法。
//
const UPDATES = [
  {
    version: '2026-relaunch-practice-mode',
    date: '新版',
    title: '📚 ChemWordle 回來了 — 改成每日練習',
    body: `
      <p>維修完成,題庫從 74 題擴充到 <strong>300 多題</strong>,一年不會重複。</p>
      <ul class="update-list">
        <li><strong>沒有競賽、沒有獎勵了</strong> — 單純每天花 1 分鐘記一個化學英文單字。</li>
        <li>新增<strong>連續挑戰天數</strong>:每天來就累積,允許中間缺 1 天,缺 2 天才歸零。</li>
        <li>排行榜改成<strong>累積答對題數</strong>,來得勤比猜得準更重要。</li>
        <li>5–6 月競賽期的舊排行榜移到排行榜頁的<strong>「歷史」分頁</strong>,得獎紀錄還看得到。</li>
      </ul>
      <p class="update-note">
        ※ 之前註冊過的帳號都還在,直接登入就能玩。<br>
        ※ 有問題或建議請來信:<a href="mailto:165804@mail.fju.edu.tw"><strong>165804@mail.fju.edu.tw</strong></a>(廖振成)
      </p>
    `
  }
];

// ─── 工具 ────────────────────────────────
//
// localStorage 結構:
//   { [version]: 'YYYY-MM-DD' }   - 該 version 最後一次被 dismiss 的台灣日期
//   或舊版陣列:  ['v1', 'v2']     - 視為「永遠看過」(向下相容)
//
// 比對規則:
//   - 一般 entry:有 key → seen(看過就不再彈)
//   - repeatDaily: true:dismissedDate < today → 視為未看過(隔天重彈)

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // 舊格式:全部當「永遠看過」
      const obj = {};
      parsed.forEach(v => { obj[v] = '9999-12-31'; });
      return obj;
    }
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function saveSeen(obj) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(obj));
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

function isUnseen(update, seen, today) {
  const dismissed = seen[update.version];
  if (!dismissed) return true;            // 從未看過
  if (update.repeatDaily && dismissed < today) return true;  // 看過但是昨天以前
  return false;
}

function getUnseenUpdates() {
  const seen = loadSeen();
  const today = twTodayStr();
  return UPDATES.filter(u => isUnseen(u, seen, today) && isReady(u));
}

export function markAllUpdatesSeen() {
  const seen = loadSeen();
  const today = twTodayStr();
  UPDATES.forEach(u => { seen[u.version] = today; });
  saveSeen(seen);
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

  // 把這次出現的全部標記為「今天看過」
  const seen = loadSeen();
  const today = twTodayStr();
  unseen.forEach(u => { seen[u.version] = today; });
  saveSeen(seen);
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
