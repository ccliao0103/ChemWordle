// Page: 遊戲主頁 #/game
//
// 進入流程:
//   0. 若有昨天答案且還沒揭曉過 → 彈 modal 顯示(教學功能)
//   1. get_today_puzzle_info → 拿 status(no_puzzle / completed / in_progress)
//   2. 根據 status 分派三種 UI
//
// 答案顯示政策(延遲揭曉):
//   - 今天:無論猜中或猜錯,都不顯示答案
//   - 明天一登入:modal 顯示昨天答案 + 中文翻譯

import { getTodayPuzzle, submitGuess, getYesterdayReveal } from '../api.js';
import { createGameEngine } from '../game-engine.js';
import { createBoard } from '../components/board.js';
import { createSpinner } from '../components/spinner.js';
import { showModal } from '../components/modal.js';
import { translateGameError, escapeHtml } from '../utils.js';

let _currentEngine = null; // 頁面切換時 destroy

export async function render(container /* , params */) {
  // 離開先前的 engine(避免實體鍵盤 listener 殘留)
  if (_currentEngine) {
    try { _currentEngine.destroy(); } catch {}
    _currentEngine = null;
  }

  container.innerHTML = '';
  container.appendChild(createSpinner('載入今日題目中…'));

  // Step 0:先看看有沒有昨天揭曉要秀(獨立失敗也不影響遊戲載入)
  try {
    await maybeShowYesterdayReveal();
  } catch (e) {
    console.warn('[game] yesterday reveal skipped:', e);
  }

  let info;
  try {
    info = await getTodayPuzzle();
  } catch (e) {
    console.error('[game] getTodayPuzzle failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin-top:2rem;">
        <h2>載入今日題目失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  container.innerHTML = '';

  if (info.status === 'no_puzzle') {
    renderNoPuzzle(container, info);
    return;
  }
  if (info.status === 'completed') {
    renderCompleted(container, info);
    return;
  }
  renderInProgress(container, info);
}

// ─────────────────────────────────────────────
// Step 0:昨日揭曉 modal
// ─────────────────────────────────────────────
const REVEALED_KEY_PREFIX = 'chemwordle:revealed:';

async function maybeShowYesterdayReveal() {
  let info;
  try {
    info = await getYesterdayReveal();
  } catch (e) {
    console.warn('[game] getYesterdayReveal failed:', e);
    return;
  }
  if (!info || !info.answer) return; // 昨天沒排題

  const key = REVEALED_KEY_PREFIX + info.puzzle_date;
  if (localStorage.getItem(key)) return; // 看過了

  const body = `
    <p class="reveal-date">昨日(${escapeHtml(info.puzzle_date)})的答案是</p>
    <p class="reveal-word">${escapeHtml(info.answer)}</p>
    ${info.zh_name
      ? `<p class="reveal-zhname">${escapeHtml(info.zh_name)}</p>`
      : ''
    }
    ${info.zh_description
      ? `<p class="reveal-desc">${escapeHtml(info.zh_description)}</p>`
      : ''
    }
  `;
  await showModal({ title: '📖 昨日揭曉', body, closeText: '開始今日挑戰' });
  localStorage.setItem(key, '1');
}

// ─────────────────────────────────────────────
// 狀態 1:今日無題
// ─────────────────────────────────────────────
function renderNoPuzzle(container, info) {
  container.innerHTML = `
    <section class="card text-center" style="margin:2rem auto;max-width:480px;">
      <h2 style="margin-top:0;">今日題目尚未開放</h2>
      <p class="text-muted">${escapeHtml(info.message || '請明天再來')}</p>
      <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
        <a class="btn btn-secondary" href="#/stats">看我的成績</a>
        <a class="btn" href="#/leaderboard">看排行榜</a>
      </div>
    </section>
  `;
}

// ─────────────────────────────────────────────
// 狀態 2:今日已完成
// ─────────────────────────────────────────────
function renderCompleted(container, info) {
  container.innerHTML = `
    <div id="game-board-wrap"></div>
    <div id="game-result" class="game-result"></div>
  `;
  const boardWrap = container.querySelector('#game-board-wrap');
  const resultEl = container.querySelector('#game-result');

  const board = createBoard({ rows: 6, cols: info.word_length });
  const guesses = info.guesses || [];
  for (let i = 0; i < guesses.length; i++) {
    const { word, colors } = guesses[i] || {};
    if (word && colors) board.setRowStatic(i, word, colors);
  }
  boardWrap.appendChild(board.element);

  const solved = !!info.solved;
  const score = info.score ?? 0;
  const guessCount = info.guess_count ?? guesses.length;

  resultEl.innerHTML = renderResultBlock({ solved, guessCount, score });
}

// ─────────────────────────────────────────────
// 狀態 3:進行中
// ─────────────────────────────────────────────
function renderInProgress(container, info) {
  container.innerHTML = `
    <div id="game-root"></div>
    <p class="game-status" id="game-hint">按 Enter 送出</p>
    <div id="game-end" class="game-result hidden"></div>
  `;
  const gameRoot = container.querySelector('#game-root');
  const endRoot = container.querySelector('#game-end');
  const hintEl = container.querySelector('#game-hint');

  const engine = createGameEngine({
    wordLength: info.word_length,
    maxAttempts: 6,
    initialGuesses: info.guesses || [],
    submitter: async (word) => {
      try {
        const res = await submitGuess(word);
        if (res?.error) {
          return { type: 'error', message: translateGameError(res.error) };
        }
        if (res?.status === 'continue') {
          return { type: 'continue', colors: res.colors };
        }
        if (res?.status === 'finished') {
          return {
            type: 'finished',
            colors: res.colors,
            solved: !!res.solved,
            score: res.score,
            // answer 不再使用(延遲揭曉)
            guessCount: res.guess_count
          };
        }
        return { type: 'error', message: '未知的伺服器回應' };
      } catch (e) {
        console.error('[game] submit error:', e);
        return { type: 'error', message: e?.message || '網路錯誤' };
      }
    }
  });

  gameRoot.appendChild(engine.element);
  _currentEngine = engine;

  engine.onEnd((result) => {
    hintEl.remove();
    endRoot.classList.remove('hidden');
    endRoot.innerHTML = renderResultBlock({
      solved: !!result.solved,
      guessCount: result.guessCount ?? result.guess_count ?? 0,
      score: result.score ?? 0
    });
  });
}

// ─────────────────────────────────────────────
// 共用:結果區塊 HTML(延遲揭曉版 — 今日絕不顯示答案)
// ─────────────────────────────────────────────
function renderResultBlock({ solved, guessCount, score }) {
  const mainLine = solved
    ? `🎉 第 ${guessCount} 次猜中,得 ${score} 分`
    : `未猜中,得 ${score} 分`;
  const subLine = solved
    ? ''
    : `<p class="text-muted" style="margin-top:0.5rem;">答案將於明天揭曉</p>`;
  return `
    <h2>${escapeHtml(mainLine)}</h2>
    ${subLine}
    <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
      <a class="btn btn-secondary" href="#/stats">看我的成績</a>
      <a class="btn" href="#/leaderboard">看排行榜</a>
    </div>
  `;
}
