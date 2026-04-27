// 通用 Modal 元件
//
// 用法:
//   await showModal({ title: '昨日揭曉', body: '<p>...</p>' });
//
// - 點背景關閉 / 按 Esc 關閉 / 點「知道了」按鈕關閉
// - 呼叫後回傳 Promise,關閉才 resolve

export function showModal({ title, body, closeText = '知道了' } = {}) {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'modal-backdrop';
    root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" class="modal-title">${title || ''}</h2>
        <div class="modal-body">${body || ''}</div>
        <div class="modal-actions">
          <button type="button" class="btn" data-close>${closeText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      root.classList.remove('show');
      root.classList.add('fade-out');
      setTimeout(() => {
        root.remove();
        document.removeEventListener('keydown', onKeydown);
      }, 200);
      resolve();
    }
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    root.querySelector('[data-close]').addEventListener('click', close);
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    document.addEventListener('keydown', onKeydown);

    // force reflow 確保 transition 觸發
    void root.offsetWidth;
    root.classList.add('show');
    root.querySelector('[data-close]').focus();
  });
}
