// Page: 首頁 #/
//
// 依 SPEC:
// - Logo + 系統名稱 + 一句說明
// - 三個大按鈕:學生註冊 / 教職員註冊 / 訪客體驗
// - 下方小字:已經有帳號 → 登入
// - 已登入時,「學生 / 教職員」按鈕直接跳 #/game(只改 href,版面照舊)

import { isAuthenticated } from '../auth.js';

export async function render(container /* , params */) {
  const authed = await isAuthenticated();
  const studentHref = authed ? '#/game' : '#/register?role=student';
  const teacherHref = authed ? '#/game' : '#/register?role=teacher';

  container.innerHTML = `
    <div class="home-hero">
      <h1>ChemWordle</h1>
      <p>每天一題化學英文 Wordle</p>
    </div>

    <div class="home-cta">
      <a class="btn btn-block" href="${studentHref}">我是學生(9 碼學號)</a>
      <a class="btn btn-block btn-secondary" href="${teacherHref}">我是教職員(6 碼編號)</a>
      <a class="btn btn-block btn-ghost" href="#/guest">訪客體驗</a>
    </div>

    <p class="home-footer">
      ${
        authed
          ? `<a href="#/stats">我的成績</a> · <a href="#/leaderboard">排行榜</a>`
          : `已經有帳號?<a href="#/login">登入</a>`
      }
    </p>
  `;
}
