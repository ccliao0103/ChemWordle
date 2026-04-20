// Page: 訪客模式 #/guest
//
// 流程:
//   1. get_guest_puzzle → 拿 puzzle_id + word_length + is_fallback
//   2. 存 puzzle_id 到 sessionStorage(跨頁面保持,重整會消失是刻意設計)
//   3. 顯示頂部 banner(昨日題 or 體驗題)
//   4. createGameEngine,submitter 呼叫 try_guess(不寫 DB,後端無狀態比對)
//   5. 結束後顯示結果 + 「再玩一次」(重新呼叫 get_guest_puzzle)+ 註冊提示

import { getGuestPuzzle, tryGuess } from '../api.js';
import { createGameEngine } from '../game-engine.js';
import { createSpinner } from '../components/spinner.js';
import { translateGuestError, escapeHtml } from '../utils.js';

const MAX_ATTEMPTS = 6;
const PUZZLE_ID_KEY = 'chemwordle:guest_puzzle_id';

let _currentEngine = null;

export async function render(container /* , params */) {
  if (_currentEngine) {
    try { _currentEngine.destroy(); } catch {}
    _currentEngine = null;
  }

  container.innerHTML = '';
  container.appendChild(createSpinner('取題中…'));

  let info;
  try {
    info = await getGuestPuzzle();
  } catch (e) {
    console.error('[guest] getGuestPuzzle failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>無法取得訪客題目</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  sessionStorage.setItem(PUZZLE_ID_KEY, info.puzzle_id);

  mountGame(container, info);
}

function mountGame(container, info) {
  const bannerText = info.is_fallback
    ? '訪客體驗題'
    : '訪客模式:你正在玩昨天的題目';

  container.innerHTML = `
    <div class="guest-banner">${escapeHtml(bannerText)}</div>
    <div id="guest-game"></div>
    <p class="game-status" id="guest-hint">按 Enter 送出</p>
    <div id="guest-end" class="game-result hidden"></div>
  `;

  const gameRoot = container.querySelector('#guest-game');
  const endRoot = container.querySelector('#guest-end');
  const hintEl = container.querySelector('#guest-hint');

  // 訪客的猜測次數僅在記憶體(前端計),後端 try_guess 是無狀態的
  let guessCount = 0;
  const puzzleId = info.puzzle_id;

  const engine = createGameEngine({
    wordLength: info.word_length,
    maxAttempts: MAX_ATTEMPTS,
    initialGuesses: [],
    submitter: async (word) => {
      try {
        const res = await tryGuess(puzzleId, word);
        if (res?.error) {
          return { type: 'error', message: translateGuestError(res.error) };
        }
        guessCount += 1;
        const solved = !!res?.solved;
        const atLimit = guessCount >= MAX_ATTEMPTS;
        if (solved || atLimit) {
          return {
            type: 'finished',
            colors: res.colors,
            solved,
            // try_guess 只在 solved=true 時回 answer,失敗就是 null
            answer: res.answer || null,
            guessCount
          };
        }
        return { type: 'continue', colors: res.colors };
      } catch (e) {
        console.error('[guest] tryGuess error:', e);
        return { type: 'error', message: e?.message || '網路錯誤' };
      }
    }
  });

  gameRoot.appendChild(engine.element);
  _currentEngine = engine;

  engine.onEnd((result) => {
    hintEl.remove();
    endRoot.classList.remove('hidden');
    endRoot.innerHTML = renderGuestEnd(result);

    const playAgainBtn = endRoot.querySelector('#play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        // 重新呼叫 get_guest_puzzle(可能跨午夜拿到新題)
        render(container);
      });
    }
  });
}

function renderGuestEnd(result) {
  const solved = !!result.solved;
  const guessCount = result.guessCount ?? 0;
  const mainLine = solved
    ? `🎉 第 ${guessCount} 次猜中!`
    : `挑戰失敗`;
  const answerLine = !solved && result.answer
    ? `<p>答案是 <span class="answer">${escapeHtml(result.answer)}</span></p>`
    : (!solved ? `<p class="text-muted">已用完 ${MAX_ATTEMPTS} 次機會</p>` : '');

  return `
    <h2>${escapeHtml(mainLine)}</h2>
    ${answerLine}
    <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
      <button type="button" class="btn" id="play-again">再玩一次</button>
      <a class="btn btn-secondary" href="#/">想參加排行榜?註冊</a>
    </div>
  `;
}
