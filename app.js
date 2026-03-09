let currentUser = null;
let appMode = 'demo';
let equityChart = null;
let editingTradeId = null;
let editingPatternId = null;
let editingRadarId = null;

const STORAGE_KEY = 'cacon_stock_v85';
const defaultSamplePatternImage = 'Phan tich.png';
const defaultCurrentChartImage = 'nhat ky.png';

const SAMPLE_DATA = {
  market: { distDays: 2 },
  analysisCurrentImage: '',
  trades: [
    { id: uid(), date: '2026-01-07', ticker: 'FPT', setup: 'VCP', buy: 127.5, sell: 138.2, qty: 1000, r: 2.1, note: 'Breakout vượt pivot với volume tăng', pnl: 10700 },
    { id: uid(), date: '2026-01-21', ticker: 'MWG', setup: '3C', buy: 68.2, sell: 65.0, qty: 1500, r: -1.2, note: 'Bị gãy nền sau báo cáo', pnl: -4800 },
    { id: uid(), date: '2026-02-03', ticker: 'CTD', setup: 'VCP', buy: 92.4, sell: 101.5, qty: 800, r: 2.4, note: 'Co hẹp biên độ đẹp và RS cao', pnl: 7280 },
    { id: uid(), date: '2026-02-17', ticker: 'DGC', setup: 'Cup with Handle', buy: 121.0, sell: 133.8, qty: 900, r: 2.0, note: 'Tay cầm ngắn, volume khô', pnl: 11520 }
  ],
  patterns: [
    { id: uid(), name: 'VCP', image: '', conditions: ['Xu hướng trước đó tăng rõ', 'Biên độ co hẹp dần', 'Khối lượng giảm dần khi siết nền', 'Breakout cùng volume tăng mạnh', 'RS gần đỉnh mới'] },
    { id: uid(), name: 'Cup with Handle', image: '', conditions: ['Nền cốc tối thiểu 7 tuần', 'Tay cầm ngắn, khối lượng khô', 'Đỉnh phải tiệm cận đỉnh trái', 'Điểm mua tại pivot tay cầm', 'Không mua khi tay cầm quá sâu'] },
    { id: uid(), name: '3C', image: '', conditions: ['Có 3 lần siết nền liên tiếp', 'Biên độ dao động hẹp', 'Khối lượng co kiệt', 'Giá giữ trên EMA 20/50', 'Breakout khỏi đỉnh vùng siết'] }
  ],
  radar: [
    { id: uid(), ticker: 'CTD', group: 'nearBuy', setup: 'VCP', entry: '101-103', status: 'Cận điểm mua', timeframe: 'Daily', note: 'Chờ breakout vượt 103 với volume lớn', image: '' },
    { id: uid(), ticker: 'DGC', group: 'watchlist', setup: 'Cup with Handle', entry: '133-135', status: 'Theo dõi tay cầm', timeframe: 'Daily', note: 'Quan sát 2 phiên khô cung tiếp theo', image: '' },
    { id: uid(), ticker: 'FPT', group: 'longTerm', setup: 'Nến tuần', entry: 'Tích lũy mua từng phần', status: 'Dài hạn', timeframe: 'Weekly', note: 'Mua tại nến tuần sau khi xác nhận xu hướng lớn', image: '' }
  ]
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function cloneSample() {
  return JSON.parse(JSON.stringify(SAMPLE_DATA));
}

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const sample = cloneSample();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    return sample;
  }
  return JSON.parse(raw);
}

function setState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function saveAndRender(next) {
  setState(next);
  renderAll();
}

window.onload = () => {
  lucide.createIcons();
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      appMode = 'firebase';
      document.getElementById('login-modal').classList.add('hidden');
      renderAll();
    }
  });
  renderAll();
};

function enterDemoMode() {
  appMode = 'demo';
  document.getElementById('login-modal').classList.add('hidden');
  renderAll();
}

async function handleLogin() {
  const e = document.getElementById('login-email').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (!e || !p) return alert('Nhập email và mật khẩu.');
  try {
    await auth.signInWithEmailAndPassword(e, p);
    document.getElementById('login-modal').classList.add('hidden');
  } catch (error) {
    alert('Đăng nhập Firebase chưa thành công. Bạn có thể dùng chế độ demo để thao tác ngay.');
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + tabId).classList.add('active');
}

function seedSampleData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneSample()));
  renderAll();
}

function renderAll() {
  populateSetupOptions();
  renderSummary();
  renderHeadlineTicker();
  renderDashboard();
  renderMarket();
  renderJournal();
  renderAnalysis();
  renderPatterns();
  renderRadar();
  lucide.createIcons();
}

function getStats() {
  const state = getState();
  const trades = [...state.trades].sort((a, b) => a.date.localeCompare(b.date));
  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const currentCapital = 500000000 + totalPnl;
  const wins = trades.filter(t => Number(t.pnl) > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const bestPattern = calcPatternStats()[0]?.setup || '—';
  return { trades, totalPnl, currentCapital, wins, winRate, bestPattern, market: state.market };
}

function renderHeadlineTicker() {
  const stats = getStats();
  const marketText = marketAdvice(stats.market.distDays).title;
  const items = [
    `Khuyến nghị thị trường: ${marketText}`,
    `Số lệnh: ${stats.trades.length}`,
    `Mẫu hình hiệu quả cao nhất: ${stats.bestPattern}`,
    `Vốn hiện tại: ${money(stats.currentCapital)}`,
    `Lãi/Lỗ ròng: ${money(stats.totalPnl)}`,
    `Win rate: ${stats.winRate.toFixed(1)}%`
  ];
  document.getElementById('headline-ticker').innerHTML = items.concat(items).map(t => `<span>${t}</span>`).join('');
}

function renderSummary() {
  const stats = getStats();
  const state = getState();
  const cards = [
    ['Vốn hiện tại', money(stats.currentCapital), 'Tính từ vốn gốc 500 triệu'],
    ['Lãi/Lỗ ròng', money(stats.totalPnl), `${stats.trades.length} giao dịch đã ghi nhận`],
    ['Win rate', `${stats.winRate.toFixed(1)}%`, `${stats.wins}/${stats.trades.length || 0} lệnh thắng`],
    ['Mẫu hình top 1', stats.bestPattern, 'Xếp hạng theo tỷ lệ thắng'],
    ['Ngày phân phối', String(state.market.distDays), marketAdvice(state.market.distDays).title],
    ['Chế độ', appMode === 'firebase' ? 'Firebase' : 'Demo', 'Có thể deploy GitHub Pages']
  ];
  document.getElementById('summary-bar').innerHTML = cards.map(([label, value, sub]) => `
    <div class="glass-panel summary-card">
      <div class="summary-label">${label}</div>
      <div class="summary-value">${value}</div>
      <div class="summary-sub">${sub}</div>
    </div>`).join('');
}

function renderDashboard() {
  renderEquityChart();
  renderPatternRanking();
  renderMonthlyStats();
}

function renderEquityChart() {
  const { trades } = getStats();
  let cumulative = 500000000;
  const labels = [];
  const data = [];
  trades.forEach(t => {
    cumulative += Number(t.pnl || 0);
    labels.push(t.date);
    data.push(cumulative);
  });
  const canvas = document.getElementById('equity-chart');
  if (equityChart) equityChart.destroy();
  equityChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data, tension: 0.35, borderWidth: 3 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8', callback: value => money(value) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function calcPatternStats() {
  const trades = getState().trades;
  const grouped = {};
  trades.forEach(t => {
    const g = grouped[t.setup] ||= { setup: t.setup, count: 0, wins: 0, totalR: 0 };
    g.count += 1;
    if (Number(t.pnl) > 0) g.wins += 1;
    g.totalR += Number(t.r || 0);
  });
  return Object.values(grouped)
    .map(g => ({ ...g, winRate: g.count ? g.wins * 100 / g.count : 0, avgR: g.count ? g.totalR / g.count : 0 }))
    .sort((a,b) => b.winRate - a.winRate || b.avgR - a.avgR);
}

function renderPatternRanking() {
  const rows = calcPatternStats();
  document.getElementById('pattern-ranking').innerHTML = rows.map((r, idx) => `
    <div class="check-row p-4 flex items-center justify-between gap-3">
      <div><div class="text-xs text-slate-400">#${idx + 1}</div><div class="font-black text-white text-lg">${r.setup}</div></div>
      <div class="text-right"><div class="font-black text-emerald-400">${r.winRate.toFixed(1)}%</div><div class="text-sm text-slate-400">${r.count} lệnh · Avg R ${r.avgR.toFixed(2)}</div></div>
    </div>`).join('') || `<div class="text-slate-400">Chưa có dữ liệu.</div>`;
}

function renderMonthlyStats() {
  const grouped = {};
  getState().trades.forEach(t => {
    const month = t.date.slice(0, 7);
    const g = grouped[month] ||= { month, count: 0, pnl: 0 };
    g.count += 1;
    g.pnl += Number(t.pnl || 0);
  });
  const rows = Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  document.getElementById('monthly-stats').innerHTML = rows.map(r => `
    <div class="check-row p-4 flex items-center justify-between gap-3">
      <div><div class="font-black text-white">${r.month}</div><div class="text-sm text-slate-400">${r.count} giao dịch</div></div>
      <div class="font-black ${r.pnl >= 0 ? 'text-positive' : 'text-negative'}">${money(r.pnl)}</div>
    </div>`).join('');
}

function renderMarket() {
  const days = Number(getState().market.distDays || 0);
  document.getElementById('market-dist-days').value = days;
  const info = marketAdvice(days);
  document.getElementById('market-state-card').innerHTML = `
    <div class="text-2xl font-black text-white mb-2">${info.title}</div>
    <div class="text-slate-300">${info.desc}</div>`;
}

function saveMarket() {
  const state = getState();
  state.market.distDays = Number(document.getElementById('market-dist-days').value || 0);
  saveAndRender(state);
}

function marketAdvice(days) {
  if (days <= 2) return { title: 'Thị trường bình thường', desc: 'Có thể giữ vị thế theo kế hoạch, quản trị rủi ro như thông thường.' };
  if (days === 3) return { title: 'Có rủi ro - hạ tỷ trọng margin', desc: 'Giảm dùng margin, ưu tiên cổ phiếu mạnh nhất.' };
  if (days === 4) return { title: 'Nguy cơ cao - 50% tiền mặt', desc: 'Bảo vệ thành quả, giảm vị thế yếu và giữ tiền mặt.' };
  return { title: 'Phòng thủ - 100% tiền mặt', desc: 'Ưu tiên bảo toàn vốn, chỉ quan sát cơ hội mới.' };
}

function populateSetupOptions() {
  const patterns = getState().patterns;
  const options = [`<option value="all">Tất cả setup</option>`].concat(patterns.map(p => `<option value="${escapeHtml(p.name)}">${p.name}</option>`));
  const filter = document.getElementById('journal-setup-filter');
  if (filter) {
    const current = filter.value || 'all';
    filter.innerHTML = options.join('');
    filter.value = current;
  }
  const tradeSelect = document.getElementById('trade-setup');
  if (tradeSelect) tradeSelect.innerHTML = patterns.map(p => `<option value="${escapeHtml(p.name)}">${p.name}</option>`).join('');
  const analysisSelect = document.getElementById('analysis-pattern-select');
  if (analysisSelect) {
    const current = analysisSelect.value || patterns[0]?.name || '';
    analysisSelect.innerHTML = patterns.map(p => `<option value="${escapeHtml(p.name)}">${p.name}</option>`).join('');
    analysisSelect.value = patterns.some(p => p.name === current) ? current : patterns[0]?.name || '';
  }
  const radarSetup = document.getElementById('radar-setup');
  if (radarSetup) radarSetup.innerHTML = patterns.map(p => `<option value="${escapeHtml(p.name)}">${p.name}</option>`).join('') + `<option value="Nến tuần">Nến tuần</option>`;
}

function renderJournal() {
  const state = getState();
  const selectedSetup = document.getElementById('journal-setup-filter')?.value || 'all';
  const trades = [...state.trades].sort((a,b) => b.date.localeCompare(a.date)).filter(t => selectedSetup === 'all' || t.setup === selectedSetup);
  document.getElementById('journal-body').innerHTML = trades.map(t => `
    <tr>
      <td>${t.date}</td>
      <td class="font-black text-white">${t.ticker}</td>
      <td>${t.setup}</td>
      <td>${t.buy}</td>
      <td>${t.sell}</td>
      <td>${t.qty}</td>
      <td>${t.r}</td>
      <td class="${t.pnl >= 0 ? 'text-positive' : 'text-negative'} font-black">${money(t.pnl)}</td>
      <td>
        <button class="mini-btn" onclick="editTrade('${t.id}')">Sửa</button>
        <button class="mini-btn" onclick="deleteTrade('${t.id}')">Xóa</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="9" class="text-center text-slate-400">Chưa có lệnh.</td></tr>`;
  renderJournalDetail(trades[0] || state.trades.sort((a,b) => b.date.localeCompare(a.date))[0]);
}

function renderJournalDetail(trade) {
  const patterns = getState().patterns;
  const pattern = patterns.find(p => p.name === trade?.setup);
  const img = pattern?.image || defaultCurrentChartImage;
  if (!trade) {
    document.getElementById('journal-detail').innerHTML = `<div class="text-slate-400">Chưa có dữ liệu giao dịch.</div>`;
    return;
  }
  document.getElementById('journal-detail').innerHTML = `
    <div class="detail-box p-4">
      <div class="flex justify-between gap-3"><div><div class="text-sm text-slate-400">Mã</div><div class="text-3xl font-black text-white">${trade.ticker}</div></div><div class="badge badge-blue">${trade.setup}</div></div>
      <div class="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div><div class="text-slate-400">Ngày</div><div class="font-bold text-white">${trade.date}</div></div>
        <div><div class="text-slate-400">PnL</div><div class="font-bold ${trade.pnl >= 0 ? 'text-positive' : 'text-negative'}">${money(trade.pnl)}</div></div>
        <div><div class="text-slate-400">Điểm mua</div><div class="font-bold text-white">${trade.buy}</div></div>
        <div><div class="text-slate-400">Điểm bán</div><div class="font-bold text-white">${trade.sell}</div></div>
        <div><div class="text-slate-400">Khối lượng</div><div class="font-bold text-white">${trade.qty}</div></div>
        <div><div class="text-slate-400">R</div><div class="font-bold text-white">${trade.r}</div></div>
      </div>
      <div class="mt-4 text-sm text-slate-300">${trade.note || 'Không có ghi chú.'}</div>
    </div>
    <div class="pattern-thumb cursor-pointer" onclick="openImageModal('${img}')">${imageOrPlaceholder(img, 'Chart giao dịch')}</div>`;
}

function openTradeModal() {
  editingTradeId = null;
  document.getElementById('trade-modal-title').textContent = 'Thêm lệnh';
  document.getElementById('trade-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('trade-ticker').value = '';
  document.getElementById('trade-qty').value = '';
  document.getElementById('trade-buy').value = '';
  document.getElementById('trade-sell').value = '';
  document.getElementById('trade-risk').value = '';
  document.getElementById('trade-note').value = '';
  document.getElementById('trade-modal').classList.remove('hidden');
}

function editTrade(id) {
  const trade = getState().trades.find(t => t.id === id);
  if (!trade) return;
  editingTradeId = id;
  document.getElementById('trade-modal-title').textContent = 'Sửa lệnh';
  document.getElementById('trade-date').value = trade.date;
  document.getElementById('trade-ticker').value = trade.ticker;
  document.getElementById('trade-setup').value = trade.setup;
  document.getElementById('trade-qty').value = trade.qty;
  document.getElementById('trade-buy').value = trade.buy;
  document.getElementById('trade-sell').value = trade.sell;
  document.getElementById('trade-risk').value = trade.r;
  document.getElementById('trade-note').value = trade.note || '';
  document.getElementById('trade-modal').classList.remove('hidden');
}

function saveTrade() {
  const state = getState();
  const trade = {
    id: editingTradeId || uid(),
    date: document.getElementById('trade-date').value,
    ticker: document.getElementById('trade-ticker').value.trim().toUpperCase(),
    setup: document.getElementById('trade-setup').value,
    qty: Number(document.getElementById('trade-qty').value || 0),
    buy: Number(document.getElementById('trade-buy').value || 0),
    sell: Number(document.getElementById('trade-sell').value || 0),
    r: Number(document.getElementById('trade-risk').value || 0),
    note: document.getElementById('trade-note').value.trim()
  };
  trade.pnl = Math.round((trade.sell - trade.buy) * trade.qty);
  if (!trade.date || !trade.ticker) return alert('Nhập ngày và mã cổ phiếu.');
  const idx = state.trades.findIndex(t => t.id === trade.id);
  if (idx >= 0) state.trades[idx] = trade; else state.trades.push(trade);
  closeModal('trade-modal');
  saveAndRender(state);
}

function deleteTrade(id) {
  const state = getState();
  state.trades = state.trades.filter(t => t.id !== id);
  saveAndRender(state);
}

function renderAnalysis() {
  const state = getState();
  const selected = document.getElementById('analysis-pattern-select')?.value || state.patterns[0]?.name;
  const pattern = state.patterns.find(p => p.name === selected) || state.patterns[0];
  if (!pattern) return;
  document.getElementById('analysis-checklist').innerHTML = pattern.conditions.map((c, i) => `
    <label class="check-row p-4 flex items-center gap-3"><input type="checkbox"><span>${i + 1}. ${escapeHtml(c)}</span></label>`).join('');
  const relatedTrades = state.trades.filter(t => t.setup === pattern.name);
  const wins = relatedTrades.filter(t => t.pnl > 0).length;
  const avgR = relatedTrades.length ? relatedTrades.reduce((s, t) => s + Number(t.r || 0), 0) / relatedTrades.length : 0;
  document.getElementById('analysis-stats').innerHTML = `
    <div class="grid grid-cols-3 gap-3">
      <div class="stat-chip p-3"><div class="text-slate-400 text-xs">Số GD</div><div class="text-xl font-black text-white">${relatedTrades.length}</div></div>
      <div class="stat-chip p-3"><div class="text-slate-400 text-xs">Winrate</div><div class="text-xl font-black text-white">${relatedTrades.length ? (wins * 100 / relatedTrades.length).toFixed(1) : '0.0'}%</div></div>
      <div class="stat-chip p-3"><div class="text-slate-400 text-xs">Avg R</div><div class="text-xl font-black text-white">${avgR.toFixed(2)}</div></div>
    </div>`;
  document.getElementById('analysis-sample-card').innerHTML = clickableImageOrPlaceholder(pattern.image || defaultSamplePatternImage, 'Mẫu chuẩn');
  document.getElementById('analysis-current-card').innerHTML = clickableImageOrPlaceholder(state.analysisCurrentImage || defaultCurrentChartImage, 'Biểu đồ hiện tại');
}

function handleAnalysisCurrentUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  fileToDataUrl(file, (dataUrl) => {
    const state = getState();
    state.analysisCurrentImage = dataUrl;
    saveAndRender(state);
  });
}

function clearAnalysisCurrentImage() {
  const state = getState();
  state.analysisCurrentImage = '';
  saveAndRender(state);
}

function renderPatterns() {
  const state = getState();
  const q = (document.getElementById('pattern-search')?.value || '').trim().toLowerCase();
  const patterns = state.patterns.filter(p => p.name.toLowerCase().includes(q));
  document.getElementById('pattern-grid').innerHTML = patterns.map(p => `
    <div class="pattern-card">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div><div class="text-2xl font-black text-white">${p.name}</div><div class="text-slate-400 text-sm">${p.conditions.length} điều kiện chuẩn</div></div>
        <div class="flex gap-3"><button class="mini-btn" onclick="editPattern('${p.id}')">Sửa</button><button class="mini-btn" onclick="deletePattern('${p.id}')">Xóa</button></div>
      </div>
      <div class="pattern-thumb cursor-pointer" onclick="openImageModal('${p.image || defaultSamplePatternImage}')">${imageOrPlaceholder(p.image || defaultSamplePatternImage, p.name)}</div>
      <div class="mt-4 space-y-2 text-slate-300">${p.conditions.map(c => `<div>• ${escapeHtml(c)}</div>`).join('')}</div>
    </div>`).join('');
}

function openPatternModal() {
  editingPatternId = null;
  document.getElementById('pattern-modal-title').textContent = 'Thêm mẫu hình';
  document.getElementById('pattern-name').value = '';
  document.getElementById('pattern-conditions').value = '';
  document.getElementById('pattern-image-input').value = '';
  document.getElementById('pattern-modal').classList.remove('hidden');
}

function editPattern(id) {
  const p = getState().patterns.find(x => x.id === id);
  if (!p) return;
  editingPatternId = id;
  document.getElementById('pattern-modal-title').textContent = 'Sửa mẫu hình';
  document.getElementById('pattern-name').value = p.name;
  document.getElementById('pattern-conditions').value = p.conditions.join('\n');
  document.getElementById('pattern-image-input').value = '';
  document.getElementById('pattern-modal').classList.remove('hidden');
}

function clearPatternImageInput() {
  document.getElementById('pattern-image-input').value = '';
}

function savePattern() {
  const state = getState();
  const name = document.getElementById('pattern-name').value.trim();
  const conditions = document.getElementById('pattern-conditions').value.split('\n').map(x => x.trim()).filter(Boolean);
  const file = document.getElementById('pattern-image-input').files[0];
  if (!name || !conditions.length) return alert('Nhập tên mẫu và điều kiện.');
  const existing = editingPatternId ? state.patterns.find(p => p.id === editingPatternId) : null;
  const done = (image) => {
    const obj = { id: editingPatternId || uid(), name, conditions, image: image ?? existing?.image ?? '' };
    const idx = state.patterns.findIndex(p => p.id === obj.id);
    if (idx >= 0) state.patterns[idx] = obj; else state.patterns.push(obj);
    closeModal('pattern-modal');
    saveAndRender(state);
  };
  if (file) fileToDataUrl(file, done); else done();
}

function deletePattern(id) {
  const state = getState();
  state.patterns = state.patterns.filter(p => p.id !== id);
  saveAndRender(state);
}

function renderRadar() {
  const state = getState();
  ['nearBuy', 'watchlist', 'longTerm'].forEach(group => {
    const items = state.radar.filter(r => r.group === group);
    document.getElementById('radar-' + group).innerHTML = items.map(item => radarCard(item)).join('') || `<div class="text-slate-400">Chưa có mã.</div>`;
  });
}

function radarCard(item) {
  const badgeClass = item.group === 'nearBuy' ? 'badge-green' : item.group === 'watchlist' ? 'badge-yellow' : 'badge-blue';
  return `
    <div class="radar-card">
      <div class="flex items-start justify-between gap-2">
        <div><div class="text-2xl font-black text-white">${item.ticker}</div><div class="text-slate-400 text-sm">${item.setup} · ${item.timeframe}</div></div>
        <span class="badge ${badgeClass}">${item.status || 'Theo dõi'}</span>
      </div>
      <div class="mt-3 text-sm text-slate-300">Vùng mua: <strong class="text-white">${escapeHtml(item.entry || '—')}</strong></div>
      <div class="mt-2 text-sm text-slate-400">${escapeHtml(item.note || '')}</div>
      <div class="pattern-thumb mt-3 cursor-pointer" onclick="openImageModal('${item.image || defaultCurrentChartImage}')">${imageOrPlaceholder(item.image || defaultCurrentChartImage, item.ticker)}</div>
      <div class="radar-actions">
        ${item.group !== 'nearBuy' ? `<button class="mini-btn" onclick="moveRadarItem('${item.id}','nearBuy')">→ Gần điểm mua</button>` : ''}
        ${item.group !== 'watchlist' ? `<button class="mini-btn" onclick="moveRadarItem('${item.id}','watchlist')">→ Theo dõi</button>` : ''}
        ${item.group !== 'longTerm' ? `<button class="mini-btn" onclick="moveRadarItem('${item.id}','longTerm')">→ Dài hạn</button>` : ''}
        <button class="mini-btn" onclick="editRadarItem('${item.id}')">Sửa</button>
        <button class="mini-btn" onclick="deleteRadarItem('${item.id}')">Xóa</button>
      </div>
    </div>`;
}

function openRadarModal(group = 'watchlist') {
  editingRadarId = null;
  document.getElementById('radar-modal-title').textContent = 'Thêm mã Radar';
  document.getElementById('radar-ticker').value = '';
  document.getElementById('radar-group').value = group;
  document.getElementById('radar-entry').value = '';
  document.getElementById('radar-status').value = '';
  document.getElementById('radar-timeframe').value = group === 'longTerm' ? 'Weekly' : 'Daily';
  document.getElementById('radar-note').value = '';
  document.getElementById('radar-image-input').value = '';
  document.getElementById('radar-modal').classList.remove('hidden');
}

function editRadarItem(id) {
  const item = getState().radar.find(r => r.id === id);
  if (!item) return;
  editingRadarId = id;
  document.getElementById('radar-modal-title').textContent = 'Sửa mã Radar';
  document.getElementById('radar-ticker').value = item.ticker;
  document.getElementById('radar-group').value = item.group;
  document.getElementById('radar-setup').value = item.setup;
  document.getElementById('radar-entry').value = item.entry || '';
  document.getElementById('radar-status').value = item.status || '';
  document.getElementById('radar-timeframe').value = item.timeframe || '';
  document.getElementById('radar-note').value = item.note || '';
  document.getElementById('radar-image-input').value = '';
  document.getElementById('radar-modal').classList.remove('hidden');
}

function saveRadarItem() {
  const state = getState();
  const file = document.getElementById('radar-image-input').files[0];
  const current = editingRadarId ? state.radar.find(r => r.id === editingRadarId) : null;
  const obj = {
    id: editingRadarId || uid(),
    ticker: document.getElementById('radar-ticker').value.trim().toUpperCase(),
    group: document.getElementById('radar-group').value,
    setup: document.getElementById('radar-setup').value,
    entry: document.getElementById('radar-entry').value.trim(),
    status: document.getElementById('radar-status').value.trim(),
    timeframe: document.getElementById('radar-timeframe').value.trim(),
    note: document.getElementById('radar-note').value.trim(),
    image: current?.image || ''
  };
  if (!obj.ticker) return alert('Nhập mã cổ phiếu.');
  const done = (image) => {
    if (image) obj.image = image;
    const idx = state.radar.findIndex(r => r.id === obj.id);
    if (idx >= 0) state.radar[idx] = obj; else state.radar.push(obj);
    closeModal('radar-modal');
    saveAndRender(state);
  };
  if (file) fileToDataUrl(file, done); else done();
}

function deleteRadarItem(id) {
  const state = getState();
  state.radar = state.radar.filter(r => r.id !== id);
  saveAndRender(state);
}

function moveRadarItem(id, group) {
  const state = getState();
  const item = state.radar.find(r => r.id === id);
  if (!item) return;
  item.group = group;
  if (group === 'longTerm' && !item.timeframe) item.timeframe = 'Weekly';
  saveAndRender(state);
}

function triggerFile(id) {
  document.getElementById(id).click();
}

function openImageModal(src) {
  document.getElementById('image-modal-img').src = src;
  document.getElementById('image-modal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function fileToDataUrl(file, cb) {
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

function imageOrPlaceholder(src, alt) {
  return `<img src="${src}" alt="${escapeHtml(alt)}">`;
}

function clickableImageOrPlaceholder(src, alt) {
  return `<div class="w-full h-full cursor-pointer" onclick="openImageModal('${src}')">${imageOrPlaceholder(src, alt)}</div>`;
}

function money(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
