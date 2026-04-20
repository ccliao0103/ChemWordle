// Wordle 棋盤元件
//
// Factory 函式。回傳物件包含操作方法,方便 game.js 使用。
//
// API:
//   const board = createBoard({ rows: 6, cols: 6 });
//   container.appendChild(board.element);
//   board.setLetters(0, 'CAR');          // 第 0 列填 C A R(剩下空白)
//   await board.flipRow(0, ['green', 'yellow', 'gray', 'gray', 'gray', 'gray']);
//   board.setRowStatic(1, 'CARBON', [...]);  // 不動畫直接畫出(還原 completed)
//   board.shakeRow(2);
//   board.reset();

export function createBoard({ rows = 6, cols = 6 } = {}) {
  const el = document.createElement('div');
  el.className = 'board';

  const tiles = []; // tiles[rowIdx][colIdx] = HTMLElement

  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'board-row';
    rowEl.style.setProperty('--cols', cols);
    const rowTiles = [];
    for (let c = 0; c < cols; c++) {
      const t = document.createElement('div');
      t.className = 'tile';
      t.setAttribute('data-state', 'empty');
      rowEl.appendChild(t);
      rowTiles.push(t);
    }
    el.appendChild(rowEl);
    tiles.push(rowTiles);
  }

  function setLetters(rowIdx, word) {
    const rowTiles = tiles[rowIdx];
    if (!rowTiles) return;
    const w = String(word || '');
    for (let c = 0; c < cols; c++) {
      const L = (w[c] || '').toUpperCase();
      const t = rowTiles[c];
      const prev = t.textContent;
      t.textContent = L;
      // 若目前已被染色(correct/present/absent),不覆寫 state
      const state = t.getAttribute('data-state');
      if (state === 'empty' || state === 'filled') {
        t.setAttribute('data-state', L ? 'filled' : 'empty');
      }
      // 新填字母時 pop 一下
      if (L && L !== prev && (state === 'empty' || state === 'filled')) {
        t.classList.remove('anim-pop');
        // force reflow 重啟動畫
        void t.offsetWidth;
        t.classList.add('anim-pop');
      }
    }
  }

  /**
   * 翻轉動畫。每格 delay 100ms,每格翻轉 600ms。
   * 在翻轉到一半(300ms)時,換成對應顏色。
   */
  async function flipRow(rowIdx, colors) {
    const rowTiles = tiles[rowIdx];
    if (!rowTiles) return;
    const FLIP_MS = 600;
    const DELAY_MS = 100;

    const jobs = rowTiles.map((t, c) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          t.classList.add('anim-flip');
          setTimeout(() => {
            t.setAttribute('data-state', colorToState(colors[c]));
          }, FLIP_MS / 2);
          setTimeout(() => {
            t.classList.remove('anim-flip');
            resolve();
          }, FLIP_MS);
        }, c * DELAY_MS);
      });
    });
    await Promise.all(jobs);
  }

  /**
   * 不動畫直接畫出整列(for completed 狀態還原)。
   */
  function setRowStatic(rowIdx, word, colors) {
    const rowTiles = tiles[rowIdx];
    if (!rowTiles) return;
    const w = String(word || '');
    for (let c = 0; c < cols; c++) {
      const t = rowTiles[c];
      t.textContent = (w[c] || '').toUpperCase();
      t.setAttribute('data-state', colorToState(colors?.[c]));
    }
  }

  function shakeRow(rowIdx) {
    const rowEl = el.children[rowIdx];
    if (!rowEl) return;
    rowEl.classList.remove('anim-shake');
    void rowEl.offsetWidth;
    rowEl.classList.add('anim-shake');
    setTimeout(() => rowEl.classList.remove('anim-shake'), 300);
  }

  function reset() {
    for (const row of tiles) {
      for (const t of row) {
        t.textContent = '';
        t.setAttribute('data-state', 'empty');
        t.classList.remove('anim-pop', 'anim-flip');
      }
    }
  }

  return { element: el, rows, cols, setLetters, flipRow, setRowStatic, shakeRow, reset };
}

function colorToState(color) {
  switch (color) {
    case 'green':  return 'correct';
    case 'yellow': return 'present';
    case 'gray':   return 'absent';
    default:       return 'empty';
  }
}
