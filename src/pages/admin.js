// Page: 管理後台 #/admin
//
// - 整體統計 / 各身分人數 / 各班級人數
// - 全部使用者列表(本月分數,可下載 CSV)
// - 月份切換 + 班級/身分篩選
// - 安全:RPC 端檢查 students.role = 'admin',否則回 forbidden

import { getAdminOverview, getAdminUserList, getAdminDailyAttendance, getAdminAwardList } from '../api.js';
import { createSpinner } from '../components/spinner.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatMonthZh } from '../utils.js';

const AVAILABLE_MONTHS = [
  { value: '2026-04-01', label: '4 月(試營運)' },
  { value: '2026-05-01', label: '5 月' },
  { value: '2026-06-01', label: '6 月' }
];

function defaultMonth() {
  const m = new Date().getMonth() + 1;
  if (m === 4) return '2026-04-01';
  if (m === 5) return '2026-05-01';
  if (m === 6) return '2026-06-01';
  return '2026-05-01';
}

// 模組級狀態(切換 filter 時不需重新打 RPC)
const _state = {
  overview: null,
  userList: null,
  dailyAttendance: null,
  awardList: null,
  month: defaultMonth(),
  filter: 'all', // 'all' / '化一甲' / '化三乙' / '碩士班' / '博士班' / '教職員'
  container: null
};

export async function render(container /* , params */) {
  _state.container = container;

  // 第一次或月份變動 → 載入
  if (!_state.userList || !_state.dailyAttendance || !_state.awardList) {
    container.innerHTML = '';
    container.appendChild(createSpinner('載入後台中…'));
    try {
      const [o, u, d, a] = await Promise.all([
        getAdminOverview(),
        getAdminUserList(_state.month),
        getAdminDailyAttendance(_state.month),
        getAdminAwardList(_state.month)
      ]);
      _state.overview = o;
      _state.userList = u;
      _state.dailyAttendance = d;
      _state.awardList = a;
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
  }

  if (_state.overview?.error === 'forbidden' || _state.userList?.error === 'forbidden' || _state.dailyAttendance?.error === 'forbidden' || _state.awardList?.error === 'forbidden') {
    container.innerHTML = `
      <section class="card text-center" style="margin:2rem auto;max-width:480px;">
        <h2>無權限</h2>
        <p class="text-muted">這是管理員專用頁面。</p>
        <a class="btn btn-secondary" href="#/">回首頁</a>
      </section>
    `;
    return;
  }

  renderDashboard();
}

function renderDashboard() {
  const { container, overview, userList, month, filter } = _state;
  const { total_users, by_role_category = [], by_class = [] } = overview;
  const allUsers = userList.users || [];
  const filteredUsers = applyFilter(allUsers, filter);
  const activeCount = allUsers.filter((u) => u.attend_days > 0).length;

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
        <h3>每日使用人數(${escapeHtml(formatMonthZh(month))})</h3>
        ${renderAttendanceCalendar(_state.dailyAttendance)}
      </div>

      ${renderAwardSection(_state.awardList, month)}

      <div class="admin-section">
        <h3>使用者列表</h3>
        <div class="admin-toolbar">
          <label>月份:
            <select id="month-select">
              ${AVAILABLE_MONTHS.map(m => `
                <option value="${m.value}" ${m.value === month ? 'selected' : ''}>${m.label}</option>
              `).join('')}
            </select>
          </label>
          <label>篩選:
            <select id="filter-select">
              <option value="all" ${filter === 'all' ? 'selected' : ''}>全部 (${allUsers.length})</option>
              <optgroup label="大學部">
                ${['化一甲','化一乙','化二甲','化二乙','化三甲','化三乙','化四甲','化四乙']
                  .map(c => {
                    const n = allUsers.filter(u => u.class_name === c).length;
                    return `<option value="${c}" ${filter === c ? 'selected' : ''}>${c} (${n})</option>`;
                  }).join('')}
              </optgroup>
              ${['碩士班', '博士班', '教職員'].map(c => {
                const n = allUsers.filter(u => u.class_name === c).length;
                return `<option value="${c}" ${filter === c ? 'selected' : ''}>${c} (${n})</option>`;
              }).join('')}
            </select>
          </label>
          <button type="button" class="btn btn-secondary" id="csv-btn">📥 下載 CSV</button>
        </div>
        <p class="text-muted" style="font-size:0.8125rem;margin:0.5rem 0;">
          顯示 ${filteredUsers.length} / ${allUsers.length} 人。按本月總分排序。CSV 下載依目前篩選。
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
              ${filteredUsers.length === 0
                ? `<tr><td colspan="11" class="text-muted text-center" style="padding:1rem;">${
                    filter === 'all' ? '本月尚無資料' : '此篩選條件下無人'
                  }</td></tr>`
                : filteredUsers.map((u, i) => `
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

  // 月份切換 → 重新載入(refetch)
  container.querySelector('#month-select').addEventListener('change', async (e) => {
    _state.month = e.target.value;
    _state.userList = null;          // 標記要重抓
    _state.dailyAttendance = null;
    _state.awardList = null;
    await render(container);
  });

  // 篩選切換 → 重畫(不 refetch)
  container.querySelector('#filter-select').addEventListener('change', (e) => {
    _state.filter = e.target.value;
    renderDashboard();
  });

  // CSV 下載
  container.querySelector('#csv-btn').addEventListener('click', () => {
    if (filteredUsers.length === 0) {
      showToast('目前篩選下沒有資料可下載', { type: 'info' });
      return;
    }
    const fileSuffix = filter === 'all' ? '' : '-' + filter;
    downloadCsv(`chemwordle-${month}${fileSuffix}.csv`, filteredUsers);
    showToast('CSV 已下載');
  });

  // 領獎名單下載
  const awardFullBtn = container.querySelector('#award-full-btn');
  if (awardFullBtn) {
    awardFullBtn.addEventListener('click', () => {
      const rows = awardFullRows(_state.awardList);
      if (rows.length === 0) {
        showToast('本月沒有人有領獎資格', { type: 'info' });
        return;
      }
      downloadCsv(`chemwordle-${month}-award-total.csv`, rows, AWARD_FULL_FIELDS);
      showToast(`已下載總名單 ${rows.length} 人`);
    });
  }
  const awardByClassBtn = container.querySelector('#award-byclass-btn');
  if (awardByClassBtn) {
    awardByClassBtn.addEventListener('click', () => {
      const rows = awardByClassRows(_state.awardList);
      if (rows.length === 0) {
        showToast('排除前十名後沒有人(可能全部都在 top 10)', { type: 'info' });
        return;
      }
      downloadCsv(`chemwordle-${month}-award-byclass.csv`, rows, AWARD_BYCLASS_FIELDS);
      showToast(`已下載班別名單 ${rows.length} 人`);
    });
  }
}

function applyFilter(users, filter) {
  if (filter === 'all') return users;
  return users.filter((u) => u.class_name === filter);
}

// ─────────────────────────────────────────────
// 領獎名單 section(2 個 CSV 下載按鈕)
// ─────────────────────────────────────────────
function renderAwardSection(awardList, month) {
  const rows = awardList?.rows || [];
  const fullCount = rows.length;
  const byClassCount = rows.filter(r => !r.olympic_rank || r.olympic_rank > 10).length;
  const sumCoupons = totalCoupons(rows);

  // 統計各種類的人數
  const fullAttendN = rows.filter(r => r.full_attendance).length;
  const participationN = rows.filter(r => r.participation).length;
  const topRankN = rows.filter(r => r.olympic_rank && r.olympic_rank <= 10).length;

  return `
    <div class="admin-section">
      <h3>領獎名單(${escapeHtml(formatMonthZh(month))})</h3>
      <p class="text-muted" style="font-size:0.8125rem;margin:0 0 0.5rem;">
        ${fullCount} 人有領券 ·
        全勤 ${fullAttendN} 人 · 參加 ${participationN} 人 · top 10 ${topRankN} 人 ·
        <strong>共需準備 ${sumCoupons} 張霜淇淋券</strong>
      </p>
      <div class="admin-toolbar">
        <button type="button" class="btn btn-secondary" id="award-full-btn">
          📥 總名單 CSV(${fullCount} 人)
        </button>
        <button type="button" class="btn btn-secondary" id="award-byclass-btn">
          📥 班別名單 CSV(排除前十,${byClassCount} 人)
        </button>
      </div>
      <p class="text-muted" style="font-size:0.75rem;margin:0.5rem 0 0;">
        ※ 結果跟著上面月份選單變。月底前統計都還可能變動,以結算後為準。
      </p>
    </div>
  `;
}

// ─────────────────────────────────────────────
// 月曆熱圖:每日使用人數
// ─────────────────────────────────────────────
function renderAttendanceCalendar(d) {
  if (!d || !d.month_start) return '<p class="text-muted">尚無資料</p>';

  // 把 days 陣列轉成 Map<'YYYY-MM-DD', {attempt_count, solved_count}>
  const byDate = new Map();
  (d.days || []).forEach(row => byDate.set(row.date, row));

  const monthStart = new Date(d.month_start + 'T00:00:00+08:00');
  const monthEnd = new Date(d.month_end + 'T00:00:00+08:00');
  const todayStr = d.today; // 'YYYY-MM-DD'(台灣時區)
  const daysInMonth = monthEnd.getDate();
  const leadingBlanks = monthStart.getDay(); // 0=Sun ... 6=Sat

  // 計算當月最大值,做動態 5 階熱度
  const maxCount = Math.max(0, ...(d.days || []).map(r => r.attempt_count || 0));

  // 統計區塊:當月有玩過的天數 + 累積完成人次 + 最高單日人次
  const activeDays = (d.days || []).length;
  const totalCompletions = (d.days || []).reduce((s, r) => s + (r.attempt_count || 0), 0);

  const cells = [];

  // 星期標頭
  const weekHead = ['日','一','二','三','四','五','六']
    .map(w => `<div class="cal-head">${w}</div>`).join('');

  // 月初前的空格
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push('<div class="cal-cell empty"></div>');
  }

  // 每一天
  for (let day = 1; day <= daysInMonth; day++) {
    const yyyy = monthStart.getFullYear();
    const mm = String(monthStart.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const row = byDate.get(key);
    const cnt = row?.attempt_count || 0;
    const solved = row?.solved_count || 0;
    const level = bucketLevel(cnt, maxCount);
    const isToday = key === todayStr;
    const tooltip = cnt > 0
      ? `${key}\n完成 ${cnt} 人,答對 ${solved} 人`
      : `${key}\n無人完成`;

    cells.push(`
      <div class="cal-cell level-${level} ${isToday ? 'is-today' : ''}" title="${escapeHtml(tooltip)}">
        <div class="cal-date">${day}</div>
        <div class="cal-count">${cnt > 0 ? cnt : ''}</div>
      </div>
    `);
  }

  return `
    <div class="cal-summary">
      <span><strong>${activeDays}</strong> / ${daysInMonth} 天有人玩</span>
      <span>累積完成 <strong>${totalCompletions}</strong> 人次</span>
      <span>單日高峰 <strong>${maxCount}</strong> 人</span>
    </div>
    <div class="attendance-cal">
      ${weekHead}
      ${cells.join('')}
    </div>
    <div class="cal-legend">
      少 <span class="cal-swatch level-0"></span>
      <span class="cal-swatch level-1"></span>
      <span class="cal-swatch level-2"></span>
      <span class="cal-swatch level-3"></span>
      <span class="cal-swatch level-4"></span>
      多
    </div>
  `;
}

// 5 階熱度:0(空)/1/2/3/4。依當月最大值動態切。
function bucketLevel(cnt, maxCount) {
  if (cnt === 0 || maxCount === 0) return 0;
  const ratio = cnt / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.50) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
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

const USER_LIST_FIELDS = [
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

function downloadCsv(filename, rows, fields = USER_LIST_FIELDS) {
  const headerLine = fields.map(([, label]) => label).join(',');
  const dataLines = rows.map(r => fields.map(([key]) => {
    const v = r[key] ?? '';
    return `"${String(v).replaceAll('"', '""')}"`;
  }).join(','));
  const csv = [headerLine, ...dataLines].join('\n');
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

// ─────────────────────────────────────────────
// 領獎名單下載(總名單 / 班別名單)
// ─────────────────────────────────────────────
const AWARD_FULL_FIELDS = [
  ['rank_position', '#'],
  ['name', '姓名'],
  ['class_name', '班級'],
  ['email', 'Email'],
  ['attend_days', '出席'],
  ['solved_count', '答對'],
  ['total_score', '分數'],
  ['full_attendance_mark', '全勤'],
  ['participation_mark', '參加'],
  ['month_rank_label', '月排'],
  ['rank_award', '排名券'],
  ['total_coupons', '共領']
];

const AWARD_BYCLASS_FIELDS = [
  ['class_name', '班級'],
  ['name', '姓名'],
  ['email', 'Email'],
  ['attend_days', '出席'],
  ['solved_count', '答對'],
  ['total_score', '分數'],
  ['full_attendance_mark', '全勤'],
  ['participation_mark', '參加'],
  ['total_coupons', '共領']
];

function decorate(r, i) {
  return {
    ...r,
    rank_position: i + 1,
    full_attendance_mark: r.full_attendance ? '✓' : '',
    participation_mark:   r.participation   ? '✓' : '',
    month_rank_label:     (r.olympic_rank && r.olympic_rank <= 10) ? `第 ${r.olympic_rank} 名` : ''
  };
}

function awardFullRows(awardList) {
  // RPC 已經 order by total_coupons desc, total_score desc, name 所以直接展開
  return (awardList?.rows || []).map(decorate);
}

function awardByClassRows(awardList) {
  return (awardList?.rows || [])
    .filter(r => !r.olympic_rank || r.olympic_rank > 10)
    .sort((a, b) => {
      const ca = a.class_name || '', cb = b.class_name || '';
      if (ca < cb) return -1;
      if (ca > cb) return 1;
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.attend_days !== a.attend_days) return b.attend_days - a.attend_days;
      return (a.name || '').localeCompare(b.name || '');
    })
    .map((r, i) => decorate(r, i));
}

function totalCoupons(rows) {
  return rows.reduce((s, r) => s + (r.total_coupons || 0), 0);
}
