// Page: 遊戲主頁 #/game
//
// 進入流程:
//   1. get_today_puzzle_info → 拿 status(no_puzzle / completed / in_progress)
//   2. 根據 status 分派三種 UI
//
// 答案揭曉政策(per-user 模式下立即揭曉):
//   - 玩完(猜中或 6 次用完)→ 立刻顯示答案 + 中英解釋
//   - 重整頁面回到 /game → completed 也包含答案,持續顯示

import { getTodayPuzzle, submitGuess } from '../api.js';
import { createGameEngine } from '../game-engine.js';
import { createBoard } from '../components/board.js';
import { createSpinner } from '../components/spinner.js';
import { translateGameError, escapeHtml } from '../utils.js';

let _currentEngine = null;

export async function render(container /* , params */) {
  if (_currentEngine) {
    try { _currentEngine.destroy(); } catch {}
    _currentEngine = null;
  }

  container.innerHTML = '';
  container.appendChild(createSpinner('載入今日題目中…'));

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
// 狀態 2:今日已完成(立即揭曉答案)
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

  resultEl.innerHTML = renderResultBlock({
    solved: !!info.solved,
    guessCount: info.guess_count ?? guesses.length,
    score: info.score ?? 0,
    answer: info.answer,
    zhName: info.zh_name,
    zhDescription: info.zh_description,
    enDescription: info.en_description
  });
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
            guessCount: res.guess_count,
            answer: res.answer,
            zhName: res.zh_name,
            zhDescription: res.zh_description,
            enDescription: res.en_description
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
      score: result.score ?? 0,
      answer: result.answer,
      zhName: result.zhName,
      zhDescription: result.zhDescription,
      enDescription: result.enDescription
    });
    // 滑到結果區塊
    setTimeout(() => endRoot.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
  });
}

// ─────────────────────────────────────────────
// 共用:結果區塊(立即揭曉版 — 分數 + 完整答案卡片)
// ─────────────────────────────────────────────
function renderResultBlock({ solved, guessCount, score, answer, zhName, zhDescription, enDescription }) {
  const mainLine = solved
    ? `🎉 第 ${guessCount} 次猜中,得 ${score} 分`
    : `未猜中,得 ${score} 分`;

  const answerCard = answer ? `
    <div class="answer-card">
      <div class="answer-word">${escapeHtml(answer)}</div>
      ${zhName ? `<div class="answer-zh-name">${escapeHtml(zhName)}</div>` : ''}
      ${zhDescription ? `<p class="answer-desc">${escapeHtml(zhDescription)}</p>` : ''}
      ${enDescription ? `<p class="answer-desc-en">${escapeHtml(enDescription)}</p>` : ''}
    </div>
  ` : '';

  return `
    <h2>${escapeHtml(mainLine)}</h2>
    ${answerCard}
    <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
      <a class="btn btn-secondary" href="#/stats">看我的成績</a>
      <a class="btn" href="#/leaderboard">看排行榜</a>
    </div>
  `;
}
