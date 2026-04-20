// Loading spinner
//
// 用法:
//   const sp = createSpinner('載入中...');
//   container.appendChild(sp);
//   // ...
//   sp.remove();

export function createSpinner(label = '載入中...') {
  const el = document.createElement('div');
  el.className = 'spinner-wrap';
  el.innerHTML = `
    <div class="spinner" aria-hidden="true"></div>
    <span class="spinner-label">${label}</span>
  `;
  return el;
}
