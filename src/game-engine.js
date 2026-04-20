// Wordle 遊戲引擎(page 共用)
//
// 責任:
//   - 建立 board + keyboard DOM 並還原已猜過的行
//   - 監聽虛擬 + 實體鍵盤輸入
//   - 送出時跑翻轉動畫、更新鍵盤染色、轉交結果給 onEnd
//   - 錯誤(後端業務錯誤)用 toast 顯示,shake 當前行
//
// 呼叫方(game.js / guest.js)要提供:
//   submitter(word) → Promise<Result>
//     Result:
//       { type: 'continue',  colors }
//       { type: 'finished',  colors, solved, score?, answer?, guessCount? }
//       { type: 'error',     message }
//
// 回傳:
//   { element, onEnd, destroy }
//     element:      要掛進 container 的 DOM
//     onEnd(cb):    註冊結束回呼(finished 時 cb(result) 一次)
//     destroy():    解除實體鍵盤 listener 並移除 DOM(離開頁面時呼叫)

import { createBoard } from './components/board.js';
import { createKeyboard, attachPhysicalKeyboard } from './components/keyboard.js';
import { showToast } from './components/toast.js';

export function createGameEngine({
  wordLength = 6,
  maxAttempts = 6,
  submitter,
  initialGuesses = []
} = {}) {
  const element = document.createElement('div');
  element.className = 'game-engine';

  const board = createBoard({ rows: maxAttempts, cols: wordLength });
  const kbd = createKeyboard({ onKey: handleKey });

  element.appendChild(board.element);
  element.appendChild(kbd.element);

  // 還原已猜過的行(無動畫)
  for (let i = 0; i < initialGuesses.length; i++) {
    const { word, colors } = initialGuesses[i] || {};
    if (!word || !colors) continue;
    board.setRowStatic(i, word, colors);
    kbd.applyRow(word, colors);
  }

  let currentRow = initialGuesses.length;
  let currentGuess = '';
  let busy = false;
  let finished = currentRow >= maxAttempts; // 防禦:已滿就不再接受輸入
  const endCallbacks = [];

  const detachPhysical = attachPhysicalKeyboard(handleKey);

  async function handleKey(keyName) {
    if (finished || busy) return;

    if (keyName === 'ENTER') {
      if (currentGuess.length === wordLength) {
        busy = true;
        try {
          await submitCurrent();
        } finally {
          // submitCurrent 內部已妥善重設 busy(錯誤分支也重設)
        }
      } else {
        board.shakeRow(currentRow);
      }
      return;
    }

    if (keyName === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        board.setLetters(currentRow, currentGuess);
      }
      return;
    }

    if (/^[A-Z]$/.test(keyName)) {
      if (currentGuess.length < wordLength) {
        currentGuess += keyName;
        board.setLetters(currentRow, currentGuess);
      }
    }
  }

  async function submitCurrent() {
    const submittedWord = currentGuess;
    let res;
    try {
      res = await submitter(submittedWord);
    } catch (e) {
      console.error('[engine] submitter threw:', e);
      showToast('送出失敗,請稍後重試');
      board.shakeRow(currentRow);
      busy = false;
      return;
    }

    if (!res || res.type === 'error') {
      showToast(res?.message || '送出失敗');
      board.shakeRow(currentRow);
      busy = false;
      return;
    }

    // 翻轉動畫(600ms * 6 格,延遲每格 100ms 由 board.flipRow 處理)
    await board.flipRow(currentRow, res.colors);
    kbd.applyRow(submittedWord, res.colors);

    if (res.type === 'continue') {
      currentRow += 1;
      currentGuess = '';
      busy = false;
      return;
    }

    if (res.type === 'finished') {
      finished = true;
      busy = false;
      detachPhysical();
      const payload = { ...res, word: submittedWord };
      for (const cb of endCallbacks) {
        try { cb(payload); } catch (err) { console.error('[engine] onEnd cb error:', err); }
      }
      return;
    }

    // 未知 type — 保險起見解鎖
    console.warn('[engine] unknown result type:', res);
    busy = false;
  }

  function onEnd(cb) {
    if (typeof cb === 'function') endCallbacks.push(cb);
  }

  function destroy() {
    detachPhysical();
    if (element.parentNode) element.parentNode.removeChild(element);
  }

  return { element, onEnd, destroy };
}
