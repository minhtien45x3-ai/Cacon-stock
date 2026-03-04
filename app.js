// CACON STOCK — UI mock giống mẫu ảnh (HTML/CSS/JS thuần)

// ---------------- State ----------------
const state = {
  capital: 2000000000,
  n: 5,
  journal: [
    { id: 1, date: '2026-03-01', ticker: 'FPT', setup: 'NỀN GIÁ PHẲNG', qty: 2000, buy: 135000, sell: 156000 },
    { id: 2, date: '2026-02-15', ticker: 'TCB', setup: 'MÔ HÌNH 2 ĐÁY', qty: 10000, buy: 42000, sell: 48000 },
    { id: 3, date: '2026-03-02', ticker: 'CTR', setup: 'CỐC TAY CẦM', qty: 1250, buy: 125000, sell: 0 },
    { id: 4, date: '2026-02-28', ticker: 'HPG', setup: 'VCP', qty: 5000, buy: 28000, sell: 26500 }
  ],
  radar: [
    { ticker: 'FPT', rs: 95, setup: 'NỀN GIÁ PHẲNG', note: '"CHỜ VƯỢT ĐỈNH LỊCH SỬ."' },
    { ticker: 'CTR', rs: 92, setup: 'CỐC TAY CẦM', note: '"CHỜ PIVOT 145."' },
    { ticker: 'VGI', rs: 88, setup: 'NỀN GIÁ PHẲNG', note: '"TÍCH LŨY CHẶT CHẼ."' }
  ],
  patterns: ['CỐC TAY CẦM','NỀN GIÁ PHẲNG','MÔ HÌNH VCP','MÔ HÌNH 2 ĐÁY','CHIẾC LÁ CỜ'],
  library: [
    { title: 'HỆ THỐNG CANSLIM', sub: 'bí quyết chọn siêu cổ phiếu tăng trưởng bền vững.' },
    { title: 'ĐIỂM PIVOT LÀ GÌ?', sub: 'vùng kháng cự yếu nhất để mua an toàn.' }
  ],
  charts: {}
};

// ---------------- Utils ----------------
function fmtVND(num){
  const n = Number(num || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}
function pnlOf(t){
  if (!t.sell || t.sell <= 0) return 0;
  const buyVal = t.qty * t.buy;
  const sellVal = t.qty * t.sell;
  return (sellVal - buyVal) - (sellVal * 0.003); // phí giả lập 0.3%
}
function monthKey(dateStr){
  const d = new Date(dateStr);
  return `${d.getMonth()+1}/${d.getFullYear()}`;
}

// ---------------- Tabs ----------------
function setTab(tab){
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');

  // refresh charts in visible tab
  if (tab === 'overview') {
    state.charts.equity?.update();
    state.charts.allocation?.update();
  }
  if (tab === 'market') {
    state.charts.sentiment?.update();
  }
}
function bindTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });
}

// ---------------- Charts ----------------
function initCharts(){
  // Equity
  const eq = document.getElementById('chart-equity');
  if (eq) {
    const ctx = eq.getContext('2d');
    state.charts.equity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          data: [2000000000, 2020000000, 2043988000],
          borderColor: 'rgba(16,185,129,0.95)',
          backgroundColor: 'rgba(16,185,129,0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.22,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(16,185,129,0.95)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtVND(c.raw) + '₫' } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'rgba(229,231,235,0.45)', font: { weight: '800' } } },
          y: { display: false }
        }
      }
    });
  }

  // Allocation
  const al = document.getElementById('chart-allocation');
  if (al) {
    const ctx = al.getContext('2d');
    state.charts.allocation = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Tiền mặt', 'Cổ phiếu'],
        datasets: [{
          data: [100, 0],
          backgroundColor: ['rgba(59,130,246,0.95)', 'rgba(16,185,129,0.95)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${fmtVND(c.raw)}₫` } } }
      }
    });
  }

  // Sentiment gauge (semi donut)
  const se = document.getElementById('chart-sentiment');
  if (se) {
    const ctx = se.getContext('2d');
    state.charts.sentiment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [50, 50],
          backgroundColor: ['rgba(16,185,129,0.95)', 'rgba(255,255,255,0.10)'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
  }
}

// ---------------- Overview Render ----------------
function renderOverview(){
  const closed = state.journal.filter(t => t.sell && t.sell > 0);
  const open = state.journal.filter(t => !t.sell || t.sell <= 0);

  const totalPnl = closed.reduce((a,t)=> a + pnlOf(t), 0);
  const wins = closed.filter(t => pnlOf(t) > 0).length;
  const winrate = closed.length ? Math.round((wins/closed.length) * 100) : 0;

  document.getElementById('ov-balance').innerText = fmtVND(state.capital + totalPnl) + '₫';
  const pnlEl = document.getElementById('ov-pnl');
  pnlEl.innerText = (totalPnl >= 0 ? '+' : '') + fmtVND(totalPnl) + '₫';

  document.getElementById('ov-winrate').innerText = winrate + '%';
  document.getElementById('ov-holding').innerText = open.length;

  // monthly table
  const byMonth = {};
  closed.forEach(t => {
    const k = monthKey(t.date);
    if(!byMonth[k]) byMonth[k] = { total:0, win:0, loss:0, pnl:0 };
    byMonth[k].total += 1;
    const p = pnlOf(t);
    byMonth[k].pnl += p;
    if (p > 0) byMonth[k].win += 1;
    else if (p < 0) byMonth[k].loss += 1;
  });

  const months = Object.entries(byMonth).sort((a,b)=>{
    const [am, ay] = a[0].split('/').map(Number);
    const [bm, by] = b[0].split('/').map(Number);
    return (by*12+bm) - (ay*12+am);
  });

  const body = document.getElementById('ov-monthly-body');
  body.innerHTML = months.length ? months.map(([k,v]) => `
    <div class="t-row">
      <div>${k}</div>
      <div>${v.total}</div>
      <div class="text-emerald">${v.win}</div>
      <div class="text-rose">${v.loss}</div>
      <div class="text-right ${v.pnl>=0?'text-emerald':'text-rose'}">${v.pnl>=0?'+':''}${fmtVND(v.pnl)}₫</div>
    </div>
  `).join('') : `
    <div class="t-row"><div style="grid-column:1/-1; color:rgba(229,231,235,0.55); font-style:italic">Chưa có dữ liệu chốt lệnh.</div></div>
  `;

  // setup list
  const setupStats = {};
  closed.forEach(t => {
    const key = t.setup || 'KHÁC';
    if(!setupStats[key]) setupStats[key] = { win:0, total:0 };
    setupStats[key].total++;
    if (pnlOf(t) > 0) setupStats[key].win++;
  });

  const sorted = Object.entries(setupStats).sort((a,b)=>{
    const ar = a[1].total ? a[1].win/a[1].total : 0;
    const br = b[1].total ? b[1].win/b[1].total : 0;
    return br - ar;
  });

  const list = document.getElementById('ov-setup-list');
  list.innerHTML = sorted.length ? sorted.map(([name, s]) => {
    const wr = Math.round((s.win/s.total)*100);
    return `
      <div class="pill">
        <div class="pill-name">${name}</div>
        <div class="pill-val">${wr}%</div>
      </div>
    `;
  }).join('') : `<div class="pill"><div class="pill-name">CHƯA CÓ DỮ LIỆU</div><div class="pill-val">0%</div></div>`;

  // allocation: open positions invested
  const invested = open.reduce((a,t)=> a + (t.qty * t.buy), 0);
  const cash = Math.max(0, state.capital - invested);
  if (state.charts.allocation) {
    state.charts.allocation.data.datasets[0].data = [cash, invested];
    state.charts.allocation.update();
  }
}

// ---------------- Market Logic ----------------
function updateDist(){
  const inp = document.getElementById('mk-dist');
  const v = Math.max(0, Math.min(10, parseInt(inp.value || '0', 10)));
  inp.value = v;

  const title = document.getElementById('mk-dist-title');
  const desc = document.getElementById('mk-dist-desc');
  const box = document.getElementById('mk-dist-status');

  if (v <= 2) {
    title.innerText = 'XU HƯỚNG TĂNG';
    desc.innerText = 'THỊ TRƯỜNG CHUNG ỔN ĐỊNH.';
    box.style.background = 'rgba(16,185,129,0.10)';
    box.style.borderColor = 'rgba(16,185,129,0.22)';
    title.style.color = 'rgba(16,185,129,0.95)';
  } else if (v === 3) {
    title.innerText = 'CẨN TRỌNG';
    desc.innerText = 'GIẢM MARGIN - BẢO VỆ TÀI KHOẢN.';
    box.style.background = 'rgba(245,158,11,0.10)';
    box.style.borderColor = 'rgba(245,158,11,0.25)';
    title.style.color = 'rgba(245,158,11,0.95)';
  } else if (v === 4) {
    title.innerText = 'RỦI RO CAO';
    desc.innerText = 'GIẢM TỶ TRỌNG DANH MỤC.';
    box.style.background = 'rgba(251,146,60,0.12)';
    box.style.borderColor = 'rgba(251,146,60,0.25)';
    title.style.color = 'rgba(251,146,60,0.95)';
  } else {
    title.innerText = 'CẢNH BÁO';
    desc.innerText = 'ƯU TIÊN PHÒNG THỦ - HẠ TỶ TRỌNG.';
    box.style.background = 'rgba(244,63,94,0.12)';
    box.style.borderColor = 'rgba(244,63,94,0.28)';
    title.style.color = 'rgba(251,113,133,0.95)';
  }
}

function updateSentiment(val){
  const v = Math.max(0, Math.min(100, parseInt(val,10)));
  document.getElementById('mk-sent-val').innerText = v;

  let label = 'TRUNG LẬP';
  let color = 'rgba(16,185,129,0.95)';
  if (v <= 30) { label='SỢ HÃI'; color='rgba(251,113,133,0.95)'; }
  else if (v <= 45) { label='CẨN TRỌNG'; color='rgba(245,158,11,0.95)'; }
  else if (v >= 75) { label='THAM LAM'; color='rgba(59,130,246,0.95)'; }
  document.getElementById('mk-sent-label').innerText = label;

  if (state.charts.sentiment) {
    state.charts.sentiment.data.datasets[0].data = [v, 100 - v];
    state.charts.sentiment.data.datasets[0].backgroundColor = [color, 'rgba(255,255,255,0.10)'];
    state.charts.sentiment.update();
  }
}

// ---------------- Radar / Patterns / Library ----------------
function renderRadar(){
  const wrap = document.getElementById('radar-cards');
  wrap.innerHTML = state.radar.map(r => `
    <div class="card radar-card">
      <div class="top">
        <div class="radar-ticker">${r.ticker}</div>
        <div class="radar-rs">RS:${r.rs}</div>
      </div>
      <div class="radar-setup">${r.setup}</div>
      <div class="radar-note">${r.note}</div>
    </div>
  `).join('');
}
function renderPatterns(){
  const grid = document.getElementById('patterns-grid');
  grid.innerHTML = state.patterns.map(name => `
    <div class="card pattern-card">
      <div class="eye">👁</div>
      <div class="pattern-thumb"></div>
      <div class="pattern-name">${name}</div>
    </div>
  `).join('');
}
function renderLibrary(){
  const grid = document.getElementById('lib-grid');
  grid.innerHTML = state.library.map(i => `
    <div class="card lib-card">
      <div class="lib-thumb"></div>
      <div class="lib-title">${i.title}</div>
      <div class="lib-sub">${i.sub}</div>
    </div>
  `).join('');
}

// ---------------- Capital Logic ----------------
function updateCapital(){
  const total = parseFloat(document.getElementById('cap-total').value || '0');
  const n = Math.max(1, parseInt(document.getElementById('cap-n').value || '1', 10));
  const riskPct = Math.max(0, parseFloat(document.getElementById('cap-risk').value || '0')) / 100;
  const buy = parseFloat(document.getElementById('cap-buy').value || '0');
  const sl = parseFloat(document.getElementById('cap-sl').value || '0');

  state.capital = total;
  state.n = n;

  const per = total / n;
  document.getElementById('cap-per-stock').innerText = fmtVND(per) + '₫';

  let shares = 0, riskAmt = 0, valueAmt = 0;
  if (buy > 0 && sl > 0 && buy > sl) {
    const maxRisk = total * riskPct;
    const riskPerShare = buy - sl;
    const sharesByRisk = Math.floor(maxRisk / riskPerShare);
    const sharesByCap = Math.floor(per / buy);
    shares = Math.max(0, Math.min(sharesByRisk, sharesByCap));
    riskAmt = shares * riskPerShare;
    valueAmt = shares * buy;
  }

  document.getElementById('cap-shares').innerText = fmtVND(shares) + ' CP';
  document.getElementById('cap-risk-amt').innerText = 'RỦI RO: ' + fmtVND(riskAmt) + '₫';
  document.getElementById('cap-value-amt').innerText = 'TRỊ GIÁ: ' + fmtVND(valueAmt) + '₫';

  renderOverview();
}

// ---------------- Journal ----------------
function renderJournal(){
  const rows = document.getElementById('jl-rows');
  const totalEl = document.getElementById('jl-total');

  let totalPnl = 0;
  rows.innerHTML = state.journal.map(t => {
    const p = pnlOf(t);
    totalPnl += p;
    const isClosed = t.sell && t.sell > 0;
    const pnlCls = isClosed ? (p >= 0 ? 'pnl-pos' : 'pnl-neg') : '';
    const pnlText = isClosed ? ((p>=0?'+':'') + fmtVND(p)) : '0';
    const warnRed = (isClosed && p < 0) ? 'red' : '';
    return `
      <div class="jr jr-row">
        <div style="color:rgba(229,231,235,0.45); font-weight:900">${t.date}</div>
        <div style="font-weight:900">${t.ticker}</div>
        <div style="opacity:0.55">-</div>
        <div style="font-weight:900">${t.setup}</div>
        <div class="badge-sl">SL</div>
        <div>${fmtVND(t.buy)}</div>
        <div>${t.sell>0?fmtVND(t.sell):'0'}</div>
        <div class="${pnlCls}">${pnlText}</div>
        <div><span class="pill-warn ${warnRed}">⚠</span></div>
        <div style="display:flex; gap:10px; justify-content:flex-start">
          <button class="icon-btn" title="Sửa" onclick="editTrade(${t.id})">✎</button>
          <button class="icon-btn" title="Xóa" onclick="deleteTrade(${t.id})">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  totalEl.innerText = (totalPnl >= 0 ? '+' : '') + fmtVND(totalPnl) + '₫';
}

// ---------------- Journal Modal ----------------
function openModal(){
  const modal = document.getElementById('trade-modal');
  modal.classList.remove('hidden');

  const d = new Date();
  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  document.getElementById('m-date').value = ds;
  document.getElementById('m-ticker').value = '';
  document.getElementById('m-qty').value = '';
  document.getElementById('m-buy').value = '';
  document.getElementById('m-sell').value = '';
  modal.dataset.editing = '';
}
function closeModal(){ document.getElementById('trade-modal').classList.add('hidden'); }
function saveModal(){
  const modal = document.getElementById('trade-modal');
  const idEditing = modal.dataset.editing;

  const date = document.getElementById('m-date').value;
  const ticker = (document.getElementById('m-ticker').value || '').toUpperCase().trim();
  const setup = document.getElementById('m-setup').value;
  const qty = parseFloat(document.getElementById('m-qty').value || '0');
  const buy = parseFloat(document.getElementById('m-buy').value || '0');
  const sell = parseFloat(document.getElementById('m-sell').value || '0');

  if (!ticker || !qty || !buy) { alert('Vui lòng nhập Mã, SL, Giá vốn'); return; }

  if (idEditing) {
    const idx = state.journal.findIndex(t => String(t.id) === String(idEditing));
    if (idx >= 0) state.journal[idx] = { ...state.journal[idx], date, ticker, setup, qty, buy, sell };
  } else {
    state.journal.unshift({ id: Date.now(), date, ticker, setup, qty, buy, sell });
  }

  closeModal();
  renderJournal();
  renderOverview();
}
window.deleteTrade = function(id){
  if (!confirm('Xóa lệnh này?')) return;
  state.journal = state.journal.filter(t => t.id !== id);
  renderJournal();
  renderOverview();
};
window.editTrade = function(id){
  const t = state.journal.find(x => x.id === id);
  if (!t) return;
  const modal = document.getElementById('trade-modal');
  modal.classList.remove('hidden');
  modal.dataset.editing = String(id);

  document.getElementById('m-date').value = t.date;
  document.getElementById('m-ticker').value = t.ticker;
  document.getElementById('m-setup').value = t.setup;
  document.getElementById('m-qty').value = t.qty;
  document.getElementById('m-buy').value = t.buy;
  document.getElementById('m-sell').value = t.sell || 0;
};

// ---------------- Breathing 4-7-8 ----------------
let breathTimer = null;
async function startBreathing(){
  const ring = document.getElementById('breath-ring');
  const stateEl = document.getElementById('breath-state');
  const countEl = document.getElementById('breath-count');
  const btn = document.getElementById('btn-breath');

  if (breathTimer) return;
  btn.disabled = true; btn.style.opacity = '0.7';

  async function phase(name, seconds, scale){
    stateEl.innerText = name;
    ring.style.transform = `scale(${scale})`;
    ring.style.boxShadow = scale > 1 ? '0 0 0 14px rgba(245,158,11,0.12)' : '0 0 0 10px rgba(245,158,11,0.10)';
    for (let i = seconds; i >= 1; i--){
      countEl.innerText = String(i);
      await new Promise(r => { breathTimer = setTimeout(r, 1000); });
    }
  }

  try{
    await phase('HÍT VÀO', 4, 1.12);
    await phase('NÍN THỞ', 7, 1.12);
    await phase('THỞ RA', 8, 0.96);
    stateEl.innerText = 'READY';
    countEl.innerText = '0';
  } finally {
    clearTimeout(breathTimer); breathTimer = null;
    btn.disabled = false; btn.style.opacity = '1';
  }
}

// ---------------- Init ----------------
document.addEventListener('DOMContentLoaded', () => {
  bindTabs();
  initCharts();

  renderRadar();
  renderPatterns();
  renderLibrary();

  renderJournal();
  renderOverview();

  // market listeners
  document.getElementById('mk-dist').addEventListener('input', updateDist);
  updateDist();

  document.getElementById('mk-sent-select').addEventListener('change', (e)=> updateSentiment(e.target.value));
  updateSentiment(document.getElementById('mk-sent-select').value);

  // capital listeners
  ['cap-total','cap-n','cap-risk','cap-buy','cap-sl'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateCapital);
  });
  updateCapital();

  // journal modal
  document.getElementById('btn-add-trade').addEventListener('click', openModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.querySelector('#trade-modal .modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('btn-save').addEventListener('click', saveModal);

  // breathing
  document.getElementById('btn-breath').addEventListener('click', startBreathing);

  // coach
  document.getElementById('btn-diagnose').addEventListener('click', () => {
    alert('Demo: sẽ bổ sung AI chẩn đoán (kỷ luật, winrate theo setup, drawdown...) ở bước tiếp theo.');
  });

  setTab('overview');
});
