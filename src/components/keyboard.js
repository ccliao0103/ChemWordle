// 虛擬鍵盤 + 實體鍵盤監聽
//
// API:
//   const kbd = createKeyboard({ onKey: (name) => { ... } });
//   // name: 'A' ~ 'Z' / 'ENTER' / 'BACKSPACE'
//   container.appendChild(kbd.element);
//   kbd.applyRow('CARBON', ['green','gray','yellow', ...]);  // 染色
//   kbd.reset();
//
//   const detach = attachPhysicalKeyboard(onKey);
//   detach();  // 離開頁面時解除

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export function createKeyboard({ onKey } = {}) {
  const el = document.createElement('div');
  el.className = 'keyboard';

  const keyStates = {}; // Letter → 'correct' | 'present' | 'absent'
  const priority = { absent: 1, present: 2, correct: 3 };

  function build() {
    el.innerHTML = '';
    ROWS.forEach((row, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kbd-row';
      if (rowIdx === 2) {
        rowEl.appendChild(makeKey('ENTER', 'ENTER', 'kbd-key-wide'));
      }
      for (const L of row) rowEl.appendChild(makeKey(L, L));
      if (rowIdx === 2) {
        rowEl.appendChild(makeKey('⌫', 'BACKSPACE', 'kbd-key-wide'));
      }
      el.appendChild(rowEl);
    });
  }

  function makeKey(label, keyName, extraClass = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `kbd-key ${extraClass}`.trim();
    b.setAttribute('data-key', keyName);
    const state = keyStates[keyName];
    if (state) b.setAttribute('data-state', state);
    b.textContent = label;
    b.addEventListener('click', () => {
      if (typeof onKey === 'function') onKey(keyName);
    });
    return b;
  }

  build();

  function applyRow(word, colors) {
    const w = String(word || '').toUpperCase();
    for (let i = 0; i < w.length; i++) {
      const L = w[i];
      const newState = colorToState(colors?.[i]);
      if (!newState) continue;
      const prev = keyStates[L];
      if (!prev || priority[newState] > priority[prev]) {
        keyStates[L] = newState;
        const btn = el.querySelector(`[data-key="${L}"]`);
        if (btn) btn.setAttribute('data-state', newState);
      }
    }
  }

  function reset() {
    for (const k of Object.keys(keyStates)) delete keyStates[k];
    build();
  }

  function setOnKey(fn) { onKey = fn; }

  return { element: el, applyRow, reset, setOnKey };
}

function colorToState(color) {
  switch (color) {
    case 'green':  return 'correct';
    case 'yellow': return 'present';
    case 'gray':   return 'absent';
    default:       return null;
  }
}

/**
 * 在 document 上監聽實體鍵盤,將事件轉成 onKey(keyName) 呼叫。
 * 回傳 detach() 用於解除綁定。
 */
export function attachPhysicalKeyboard(onKey) {
  function handler(e) {
    // 若使用者正在填表單(input / textarea),不要攔
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    let name = null;
    if (e.key === 'Enter') name = 'ENTER';
    else if (e.key === 'Backspace') name = 'BACKSPACE';
    else if (/^[a-zA-Z]$/.test(e.key)) name = e.key.toUpperCase();
    if (name) {
      e.preventDefault();
      if (typeof onKey === 'function') onKey(name);
    }
  }
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
