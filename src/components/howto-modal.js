// How to Play modal — NYT 風格、中英並列
//
// 觸發時機:
//   1. 第一次進站(localStorage 沒紀錄)→ 自動彈
//   2. 任何時候點 header 的 ❓ icon → 手動彈
//
// API:
//   shouldShowHowTo() — 第一次進站時用,回傳是否該秀
//   showHowToModal({ markSeen = true }) — 顯示 modal,關閉時記到 localStorage

import { showModal } from './modal.js';

const SEEN_KEY = 'chemwordle:howto_seen';

export function shouldShowHowTo() {
  return !localStorage.getItem(SEEN_KEY);
}

export async function showHowToModal({ markSeen = true } = {}) {
  await showModal({
    title: 'How to Play / 怎麼玩',
    body: BODY_HTML,
    closeText: 'Start / 開始挑戰'
  });
  if (markSeen) {
    localStorage.setItem(SEEN_KEY, '1');
  }
}

const BODY_HTML = `
  <div class="howto-content">
    <p class="howto-lead">
      <strong>Guess the chem word in 6 tries.</strong><br>
      <span class="zh">在 6 次內猜出今日的化學詞。</span>
    </p>

    <ul class="howto-rules">
      <li>
        Each guess must be a valid English word.<br>
        <span class="zh">每次猜測必須是有效英文單字(5 或 6 字母,依當日題目)。</span>
      </li>
      <li>
        The color of the tiles will change to show how close your guess was.<br>
        <span class="zh">格子顏色顯示你的猜測與答案的關係。</span>
      </li>
      <li>
        Words not in the dictionary are blocked and don't count against your tries.<br>
        <span class="zh">不在字典裡的字會被擋掉,<strong>不佔用</strong>次數。</span>
      </li>
    </ul>

    <h3 class="howto-h3">Examples / 範例</h3>

    <div class="howto-example">
      <div class="howto-tiles">
        <div class="tile demo correct">W</div>
        <div class="tile demo">A</div>
        <div class="tile demo">T</div>
        <div class="tile demo">E</div>
        <div class="tile demo">R</div>
      </div>
      <p>
        <strong>W</strong> is in the word and in the correct spot.<br>
        <span class="zh"><strong>W</strong> 在答案裡,而且位置正確。</span>
      </p>
    </div>

    <div class="howto-example">
      <div class="howto-tiles">
        <div class="tile demo">S</div>
        <div class="tile demo present">O</div>
        <div class="tile demo">D</div>
        <div class="tile demo">I</div>
        <div class="tile demo">U</div>
        <div class="tile demo">M</div>
      </div>
      <p>
        <strong>O</strong> is in the word but in the wrong spot.<br>
        <span class="zh"><strong>O</strong> 在答案裡,但位置不對。</span>
      </p>
    </div>

    <div class="howto-example">
      <div class="howto-tiles">
        <div class="tile demo">C</div>
        <div class="tile demo">A</div>
        <div class="tile demo">R</div>
        <div class="tile demo">B</div>
        <div class="tile demo">O</div>
        <div class="tile demo absent">N</div>
      </div>
      <p>
        <strong>N</strong> is not in the word in any spot.<br>
        <span class="zh"><strong>N</strong> 不在答案裡。</span>
      </p>
    </div>

    <p class="howto-footer">
      A new puzzle is released daily at midnight (Taipei Time).<br>
      <span class="zh">每天台灣時間 00:00 換新題。答案隔天揭曉。</span>
    </p>
  </div>
`;
