// Page: 首頁 #/
//
// 常駐練習模式(2026-09 起,競賽期已結束):
// - Logo + 系統名稱 + 一句說明
// - 三個大按鈕:註冊 / 登入 / 訪客體驗
// - 遊戲規則與使用須知(摺疊)

import { isAuthenticated } from '../auth.js';

export async function render(container /* , params */) {
  const authed = await isAuthenticated();

  container.innerHTML = `
    <div class="home-hero">
      <h1>ChemWordle</h1>
      <p>每天一題化學英文單字,花 1 分鐘記一個字</p>
      <div class="event-banner active">
        <span class="event-badge">📚 每日練習</span>
        <p class="event-hint">
          沒有競賽、沒有獎勵 — 純粹累積自己的紀錄。
          題庫 300+ 題,每人題序不同。
        </p>
      </div>
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
          <li>每天一題 5 或 6 字化學英文單字,每人每天 <strong>6 次</strong>猜測機會</li>
          <li><strong>每人題目不同</strong>:系統幫每位學生洗一份專屬題序,跟同學「對答案」沒用 😉</li>
          <li>顏色說明:<span class="chip chip-green">綠</span> 字母位置正確、<span class="chip chip-yellow">黃</span> 字母存在但位置錯、<span class="chip chip-gray">灰</span> 字母不存在</li>
          <li>必須是有效英文單字,亂打(如 XZQPWL)會被擋下,但<strong>不扣次數</strong></li>
          <li>台灣時間每天 00:00 換新題;<strong>缺席當天的題就跳過</strong>(不能補玩)</li>
          <li>玩完當下立刻顯示答案 + 中英文解釋(每人題目不同,不怕外洩)</li>
        </ul>
      </details>

      <details>
        <summary>紀錄怎麼算</summary>
        <ul>
          <li><strong>沒有競賽、沒有獎勵</strong> — 這是練習工具,紀錄純粹是給自己看的</li>
          <li><strong>連續天數</strong>:每天有提交就延續。<strong>允許中間缺 1 天</strong>,缺 2 天才歸零</li>
          <li><strong>累積答對</strong>:你到目前為止學會幾個化學英文單字</li>
          <li>排行榜依<strong>累積答對題數</strong>排序,來得勤比猜得準更重要</li>
          <li>排行榜以<strong>姓名 + 身分</strong>(如「化三甲」「碩士班」)顯示,不外露學號</li>
          <li>2026 年 5–6 月的競賽期舊榜保留在排行榜的「歷史」分頁</li>
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
        <summary>隱私與技術</summary>
        <ul>
          <li>email 僅用於登入,不會外流,不會寄廣告信</li>
          <li>成績與猜測紀錄存於 Supabase,僅自己、教師、排行榜能看到(姓名+遮罩學號)</li>
          <li>訪客模式不記錄任何資料</li>
          <li>問題回報 / Bug / 補分申請:<a href="mailto:165804@mail.fju.edu.tw"><code>165804@mail.fju.edu.tw</code></a>(廖振成)</li>
        </ul>
      </details>
    </section>
  `;
}
