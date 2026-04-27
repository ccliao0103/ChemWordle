// Page: 首頁 #/
//
// - Logo + 系統名稱 + 一句說明
// - 動態活動狀態 banner(搶先體驗中 / 進行中 / 已結束 — 依今天日期自動切)
// - 三個大按鈕:註冊 / 登入 / 訪客體驗
// - 遊戲規則與使用須知(摺疊)

import { isAuthenticated } from '../auth.js';

// 活動期間設定(台灣時區錨定)
const EVENT_START = new Date('2026-05-01T00:00:00+08:00');
const EVENT_END = new Date('2026-07-01T00:00:00+08:00'); // 6/30 23:59 之後

function renderEventStatus() {
  const now = new Date();
  if (now < EVENT_START) {
    return `
      <div class="event-banner pre-launch">
        <span class="event-badge">⚡ 搶先體驗中</span>
        <p class="event-period-line">正式開賽:<strong>2026 / 5 / 1</strong> — 2026 / 6 / 30</p>
        <p class="event-hint">現在註冊就能玩!熟悉玩法 + 鍵盤手感,等 5/1 開賽就直接拚分數。</p>
      </div>
    `;
  }
  if (now < EVENT_END) {
    return `
      <div class="event-banner active">
        <span class="event-badge">🔥 活動進行中</span>
        <p class="event-period-line">2026 / 5 / 1 — <strong>2026 / 6 / 30</strong></p>
      </div>
    `;
  }
  return `
    <div class="event-banner finished">
      <span class="event-badge">🏁 活動已結束</span>
      <p class="event-period-line">2026 / 5 / 1 — 2026 / 6 / 30</p>
      <p class="event-hint">感謝參與!查看最終結果:<a href="#/leaderboard">排行榜</a></p>
    </div>
  `;
}

export async function render(container /* , params */) {
  const authed = await isAuthenticated();

  container.innerHTML = `
    <div class="home-hero">
      <h1>ChemWordle</h1>
      <p>每天一題化學英文 Wordle</p>
      ${renderEventStatus()}
    </div>

    <div class="home-cta">
      ${authed
        ? `<a class="btn btn-block" href="#/game">進入今日題目</a>
           <a class="btn btn-block btn-secondary" href="#/leaderboard">看排行榜</a>
           <a class="btn btn-block btn-ghost" href="#/guest">訪客體驗</a>`
        : `<a class="btn btn-block" href="#/register">註冊</a>
           <a class="btn btn-block btn-secondary" href="#/login">登入</a>
           <a class="btn btn-block btn-ghost" href="#/guest">訪客體驗</a>`
      }
    </div>

    <p class="home-footer">
      ${authed
        ? `<a href="#/stats">我的成績</a>`
        : `用你常看的 email 註冊,1 分鐘搞定`
      }
    </p>

    <section class="home-notes">
      <details open>
        <summary>遊戲規則</summary>
        <ul>
          <li>每天一題 6 字化學英文單字,每人每天 <strong>6 次</strong>猜測機會</li>
          <li>顏色說明:<span class="chip chip-green">綠</span> 字母位置正確、<span class="chip chip-yellow">黃</span> 字母存在但位置錯、<span class="chip chip-gray">灰</span> 字母不存在</li>
          <li>必須是有效英文單字,亂打(如 XZQPWL)會被擋下,但<strong>不扣次數</strong></li>
          <li>計分:1/2/3/4/5/6 次猜中分別得 100/90/80/70/60/50 分;猜錯 0 分</li>
          <li>台灣時間每天 00:00 換新題;答案<strong>隔天</strong>登入會顯示(含中文解釋)</li>
        </ul>
      </details>

      <details>
        <summary>登入須知(重要)</summary>
        <ul>
          <li>使用 <strong>Magic Link</strong> 登入(無密碼),第一次需要去信箱點連結</li>
          <li>第一次登入後,本裝置 <strong>30 天內不用再收信</strong>,直接打開網站就是登入狀態</li>
          <li>Email 推薦用你常看的(<strong>Gmail 最佳</strong>,送達率高)</li>
          <li>建議<strong>把網站加入書籤</strong>,以後一鍵進入</li>
          <li>手機建議用 <strong>Safari 書籤</strong> 或 <strong>Chrome 書籤</strong>(iPhone 不建議「加到主畫面」,會跟瀏覽器登入分家)</li>
          <li>若 1 分鐘內沒收到信:
            <ol>
              <li>檢查信箱的「垃圾郵件」資料夾</li>
              <li>用學校信箱(@mail.fju.edu.tw)收不到時,可改用 Gmail 重新註冊</li>
              <li>或到 FJU 郵件隔離系統 → <a href="https://spammail.fju.edu.tw/symphony/login.html" target="_blank" rel="noopener">https://spammail.fju.edu.tw</a> 登入 → 找 "ChemWordle 登入連結" → 點「動作」→ 「加入個人白名單」+「重送」</li>
            </ol>
          </li>
          <li>換電腦 / 換瀏覽器 / 清掉 cookies → 需要重新收信登入</li>
          <li>⚠️ <strong>若網頁無回應</strong>:按 <strong>F5</strong>(電腦)或下拉重新整理(手機)就會恢復</li>
        </ul>
      </details>

      <details>
        <summary>評分與獎勵 🍦</summary>
        <ul>
          <li><strong>出席獎(全勤)</strong>:該月每天都有提交紀錄(不論對錯)→ <strong>霜淇淋券 1 張</strong></li>
          <li><strong>月排行</strong>(每月結算):
            <ul>
              <li>🥇 第一名 → 霜淇淋券 <strong>10 張</strong></li>
              <li>🥈 第二名 → 霜淇淋券 <strong>6 張</strong></li>
              <li>🥉 第三名 → 霜淇淋券 <strong>4 張</strong></li>
            </ul>
          </li>
          <li>同分比較順序:總分 → 答對次數 → 平均猜測次數</li>
          <li>排行榜以<strong>姓名 + 身分</strong>(如「化三甲」「碩士」「教職員」)顯示,不外露學號</li>
        </ul>
      </details>

      <details>
        <summary>隱私與技術</summary>
        <ul>
          <li>email 僅用於登入,不會外流,不會寄廣告信</li>
          <li>成績與猜測紀錄存於 Supabase,僅自己、教師、排行榜能看到(姓名+遮罩學號)</li>
          <li>訪客模式不記錄任何資料</li>
          <li>問題回報:<code>noreply@ccllab-tw.com</code></li>
        </ul>
      </details>
    </section>
  `;
}
