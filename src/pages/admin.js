// Page: 管理後台 #/admin
//
// - 整體統計(總人數 / 本月活躍)
// - 各身分人數(大學部 / 碩士 / 博士 / 教職員)
// - 各班級人數
// - 全部使用者列表(含本月分數,可下載 CSV)
// - 月份切換
//
// 安全:RPC 端檢查 students.role = 'admin',否則回 forbidden。

import { getAdminOverview, getAdminUserList } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatMonthZh } from '../utils.js';

// 活動期間月份
const AVAILABLE_MONTHS = [
  { value: '2026-04-01', label: '4 月(試營運)' },
  { value: '2026-05-01', label: '5 月' },
  { value: '2026-06-01', label: '6 月' }
];

// 預設選當月
function defaultMonth() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  if (m === 4) return '2026-04-01';
  if (m === 5) return '2026-05-01';
  if (m === 6) return '2026-06-01';
  return '2026-05-01'; // 活動外預設 5 月
}

let _selectedMonth = defaultMonth();

export async function render(container /* , params */) {
  container.innerHTML = '';
  container.appendChild(createSpinner('載入後台中…'));

  let overview, userList;
  try {
    [overview, userList] = await Promise.all([
      getAdminOverview(),
      getAdminUserList(_selectedMonth)
    ]);
  } catch (e) {
    console.error('[admin] load failed:', e);
    container.innerHTML = `
      <section class="card text-center" style="margin:2rem auto;max-width:480px;">
        <h2>載入後台失敗</h2>
        <p class="form-error">${escapeHtml(e?.message || String(e))}</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  // 權限檢查
  if (overview?.error === 'forbidden' || userList?.error === 'forbidden') {
    container.innerHTML = `
      <section class="card text-center" style="margin:2rem auto;max-width:480px;">
        <h2>無權限</h2>
        <p class="text-muted">這是管理員專用頁面。</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  renderDashboard(container, overview, userList);
}

function renderDashboard(container, overview, userList) {
  const { total_users, by_role_category = [], by_class = [] } = overview;
  const users = userList.users || [];
  const month = userList.month;
  const activeCount = users.filter((u) => u.attend_days > 0).length;

  container.innerHTML = `
    <section>
      <h2 class="page-title">管理後台</h2>

      <div class="admin-cards">
        <div class="admin-card">
          <div class="admin-card-label">總註冊人數</div>
          <div class="admin-card-value">${total_users}</div>
        </div>
        <div class="admin-card">
          <div class="admin-card-label">${escapeHtml(formatMonthZh(month))}活躍</div>
          <div class="admin-card-value">${activeCount}</div>
        </div>
      </div>

      <div class="admin-section">
        <h3>各身分人數</h3>
        ${renderMiniTable(['身分', '人數'], by_role_category.map(r => [r.label, r.count]))}
      </div>

      <div class="admin-section">
        <h3>各班級 / 身分</h3>
        ${renderMiniTable(['班級', '人數'], by_class.map(c => [c.class_name, c.count]))}
      </div>

      <div class="admin-section">
        <h3>使用者列表</h3>
        <div class="admin-toolbar">
          <label>月份:
            <select id="month-select">
              ${AVAILABLE_MONTHS.map(m => `
                <option value="${m.value}" ${m.value === _selectedMonth ? 'selected' : ''}>${m.label}</option>
              `).join('')}
            </select>
          </label>
          <button type="button" class="btn btn-secondary" id="csv-btn">📥 下載 CSV</button>
        </div>
        <p class="text-muted" style="font-size:0.8125rem;margin:0.5rem 0;">
          按本月總分排序。分數 = sum(attempts.score)。
        </p>
        <div class="table-scroll">
          <table class="rank-table admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>姓名</th>
                <th>班級</th>
                <th>Email</th>
                <th>學號</th>
                <th>分數</th>
                <th>出席</th>
                <th>答對</th>
                <th>答錯</th>
                <th>平均</th>
                <th>註冊</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0
                ? `<tr><td colspan="11" class="text-muted text-center" style="padding:1rem;">本月尚無資料</td></tr>`
                : users.map((u, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${escapeHtml(u.name)}</td>
                    <td>${escapeHtml(u.class_name || '—')}</td>
                    <td><small>${escapeHtml(u.email)}</small></td>
                    <td><small>${escapeHtml(u.student_id || '—')}</small></td>
                    <td><strong>${u.total_score}</strong></td>
                    <td>${u.attend_days}</td>
                    <td>${u.solved_count}</td>
                    <td>${u.failed_count}</td>
                    <td>${u.avg_guess_count ?? '—'}</td>
                    <td><small>${escapeHtml(u.created_at?.slice(0, 10) || '')}</small></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <p style="margin-top:1.5rem;text-align:center;">
        <a href="#/">回首頁</a> · <a href="#/leaderboard">公開排行榜</a>
      </p>
    </section>
  `;

  // 月份切換
  container.querySelector('#month-select').addEventListener('change', async (e) => {
    _selectedMonth = e.target.value;
    container.innerHTML = '';
    container.appendChild(createSpinner('載入中…'));
    await render(container);
  });

  // CSV 下載
  container.querySelector('#csv-btn').addEventListener('click', () => {
    if (users.length === 0) {
      showToast('本月沒有資料可下載', { type: 'info' });
      return;
    }
    downloadCsv(`chemwordle-${month}.csv`, users);
    showToast('CSV 已下載');
  });
}

function renderMiniTable(headers, rows) {
  if (rows.length === 0) {
    return `<p class="text-muted">尚無資料</p>`;
  }
  return `
    <table class="rank-table" style="max-width:280px;">
      <thead>
        <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>${r.map((v, i) => `<td${i === r.length - 1 ? ' style="text-align:right;"' : ''}>${escapeHtml(String(v))}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function downloadCsv(filename, rows) {
  const fields = [
    ['name', '姓名'],
    ['class_name', '班級'],
    ['email', 'Email'],
    ['student_id', '學號'],
    ['role_category', '身分類別'],
    ['total_score', '本月分數'],
    ['attend_days', '出席天數'],
    ['solved_count', '答對次數'],
    ['failed_count', '答錯次數'],
    ['avg_guess_count', '平均猜測次數'],
    ['created_at', '註冊時間']
  ];
  const headerLine = fields.map(([, label]) => label).join(',');
  const dataLines = rows.map(r => fields.map(([key]) => {
    const v = r[key] ?? '';
    return `"${String(v).replaceAll('"', '""')}"`;
  }).join(','));
  const csv = [headerLine, ...dataLines].join('\n');
  // BOM 讓 Excel 認得 UTF-8
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}
