const STORAGE_KEY = 'cacon-stock-v9';
const INITIAL_CAPITAL = 500000000;
let equityChart;

const assets = {
  fallbackPattern: 'assets/mau-hinh.png',
  fallbackAnalysis: 'assets/phan-tich.png'
};

const sampleData = {
  market: { distDays: 2 },
  notes: {
    mindset: 'Giữ nguyên tắc cắt lỗ nhanh. Không mua đuổi khi cổ phiếu cách pivot quá xa. Chỉ nâng tỷ trọng khi thị trường xác nhận.',
    library: 'Minervini: ưu tiên cổ phiếu tăng trưởng mạnh, doanh thu - lợi nhuận cải thiện, RS cao và nền giá chặt. Kết hợp liên thị trường để xác nhận nhóm dẫn dắt.'
  },
  patterns: [
    {
      id: uid(),
      name: 'VCP',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Xu hướng trước đó tăng rõ',
        'Biên độ co hẹp dần',
        'Khối lượng giảm dần khi siết nền',
        'Breakout cùng volume tăng mạnh',
        'RS gần đỉnh mới'
      ]
    },
    {
      id: uid(),
      name: 'Cup with Handle',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Nền cốc tối thiểu 7 tuần',
        'Tay cầm ngắn, khối lượng khô',
        'Đỉnh phải tiệm cận đỉnh trái',
        'Điểm mua tại pivot tay cầm',
        'Không mua khi tay cầm quá sâu'
      ]
    },
    {
      id: uid(),
      name: '3C',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Cú co thứ 3 chặt hơn 2 cú đầu',
        'Volume cạn dần',
        'Giá giữ EMA 10/20',
        'Break khỏi vùng nén cuối',
        'Thị trường chung ủng hộ'
      ]
    }
  ],
  trades: [
    { id: uid(), date: '2026-01-07', ticker: 'FPT', setup: 'VCP', buy: 127.5, sell: 138.2, qty: 1000, rMultiple: 2.1, notes: 'Nền siết chặt, breakout vol lớn.' },
    { id: uid(), date: '2026-01-21', ticker: 'MWG', setup: '3C', buy: 68.2, sell: 65.0, qty: 1500, rMultiple: -1.2, notes: 'Mua sớm khi thị trường chưa đồng thuận.' },
    { id: uid(), date: '2026-02-03', ticker: 'CTD', setup: 'VCP', buy: 92.4, sell: 101.5, qty: 800, rMultiple: 2.4, notes: 'Nền đẹp 6 tuần, RS vượt trội.' },
    { id: uid(), date: '2026-02-17', ticker: 'DGC', setup: 'Cup with Handle', buy: 121.0, sell: 133.8, qty: 900, rMultiple: 2.0, notes: 'Tay cầm cạn vol, nhóm ngành mạnh.' },
    { id: uid(), date: '2026-03-02', ticker: 'HPG', setup: 'VCP', buy: 31.6, sell: 33.9, qty: 4000, rMultiple: 1.6, notes: 'RS cải thiện, nền thứ hai.' }
  ],
  analysis: {
    selectedPatternId: null,
    currentImage: 'assets/phan-tich.png',
    checklistState: {}
  },
  radar: [
    { id: uid(), type: 'nearBuy', ticker: 'VCI', setup: 'VCP', status: 'Sẵn sàng', score: 84, pivot: 42.5, notes: 'Siết 5 tuần, chờ vượt pivot với vol tăng.', image: 'assets/radar.png' },
    { id: uid(), type: 'nearBuy', ticker: 'KDH', setup: 'Cup with Handle', status: 'Đang theo dõi', score: 77, pivot: 39.2, notes: 'Tay cầm ngắn, dòng tiền quay lại BĐS.', image: 'assets/radar.png' },
    { id: uid(), type: 'watch', ticker: 'CTR', setup: '3C', status: 'Đang theo dõi', score: 73, pivot: 116.8, notes: 'Nền giá đẹp nhưng cần thị trường xác nhận thêm.', image: 'assets/radar.png' },
    { id: uid(), type: 'watch', ticker: 'ACB', setup: 'VCP', status: 'Đang theo dõi', score: 69, pivot: 29.4, notes: 'Ngành ngân hàng cải thiện tương đối.', image: 'assets/radar.png' },
    { id: uid(), type: 'longTerm', ticker: 'FPT', setup: 'VCP', status: 'Chờ nến tuần', score: 90, pivot: 0, notes: 'Cổ phiếu dài hạn, ưu tiên mua ở nến tuần xác nhận tiếp diễn xu hướng lớn.', image: 'assets/radar.png' },
    { id: uid(), type: 'longTerm', ticker: 'DGC', setup: 'Cup with Handle', status: 'Chờ nến tuần', score: 88, pivot: 0, notes: 'Giữ theo khung tuần, chỉ gia tăng khi có nến tuần xác nhận.', image: 'assets/radar.png' }
  ]
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = deepClone(sampleData);
    data.analysis.selectedPatternId = data.patterns[0]?.id || null;
    saveData(data);
    return data;
  }
  const data = JSON.parse(raw);
  if (!data.analysis) data.analysis = deepClone(sampleData.analysis);
  if (!data.notes) data.notes = deepClone(sampleData.notes);
  if (!data.market) data.market = { distDays: 0 };
  if (!data.patterns) data.patterns = [];
  if (!data.trades) data.trades = [];
  if (!data.radar) data.radar = [];
  if (!data.analysis.selectedPatternId && data.patterns[0]) data.analysis.selectedPatternId = data.patterns[0].id;
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetToSample() {
  const data = deepClone(sampleData);
  data.analysis.selectedPatternId = data.patterns[0]?.id || null;
  saveData(data);
  renderApp();
}

function currency(value) {
  return `${Math.round(value).toLocaleString('vi-VN')} đ`;
}

function calculateTrade(trade) {
  const pnl = (Number(trade.sell) - Number(trade.buy)) * Number(trade.qty);
  const percent = Number(trade.buy) ? ((Number(trade.sell) - Number(trade.buy)) / Number(trade.buy)) * 100 : 0;
  return { ...trade, pnl, percent };
}

function getMarketMessage(days) {
  const d = Number(days || 0);
  if (d <= 2) return { status: 'Thị trường bình thường', guidance: 'Có thể giao dịch bình thường, ưu tiên cổ phiếu dẫn dắt và setup chuẩn.', color: 'green' };
  if (d === 3) return { status: 'Thị trường có rủi ro', guidance: 'Hạ tỷ trọng margin, chỉ giữ các mã khỏe nhất và giao dịch chọn lọc.', color: 'amber' };
  if (d === 4) return { status: 'Nguy cơ cao', guidance: 'Đưa danh mục về tối thiểu 50% tiền mặt, tránh mở vị thế lớn mới.', color: 'rose' };
  return { status: 'Phòng thủ tối đa', guidance: '5-6 ngày phân phối: ưu tiên 100% tiền mặt hoặc giữ tỷ trọng rất thấp.', color: 'rose' };
}

function getStats(data) {
  const trades = data.trades.map(calculateTrade).sort((a,b) => a.date.localeCompare(b.date));
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const currentCapital = INITIAL_CAPITAL + totalPnL;
  const wins = trades.filter(t => t.pnl > 0).length;
  const winrate = trades.length ? (wins / trades.length) * 100 : 0;
  const setupMap = {};
  trades.forEach(t => {
    if (!setupMap[t.setup]) setupMap[t.setup] = { count: 0, wins: 0, pnl: 0, rTotal: 0 };
    setupMap[t.setup].count += 1;
    if (t.pnl > 0) setupMap[t.setup].wins += 1;
    setupMap[t.setup].pnl += t.pnl;
    setupMap[t.setup].rTotal += Number(t.rMultiple || 0);
  });
  const setupRanking = Object.entries(setupMap).map(([name, s]) => ({
    name,
    count: s.count,
    winrate: s.count ? (s.wins / s.count) * 100 : 0,
    avgR: s.count ? s.rTotal / s.count : 0,
    pnl: s.pnl
  })).sort((a,b) => b.winrate - a.winrate || b.pnl - a.pnl);
  const bestSetup = setupRanking[0]?.name || '-';

  const months = {};
  let running = INITIAL_CAPITAL;
  const equitySeries = trades.map(t => {
    running += t.pnl;
    const month = t.date.slice(0, 7);
    if (!months[month]) months[month] = { count: 0, pnl: 0 };
    months[month].count += 1;
    months[month].pnl += t.pnl;
    return { date: t.date, capital: running };
  });

  return { trades, totalPnL, currentCapital, winrate, setupRanking, bestSetup, months, equitySeries };
}

function renderMarquee(data, stats) {
  const market = getMarketMessage(data.market.distDays);
  const items = [
    `Khuyến nghị thị trường: ${market.status}`,
    `Số lệnh: ${stats.trades.length}`,
    `Mẫu hình hiệu quả cao nhất: ${stats.bestSetup}`,
    `Vốn hiện tại: ${currency(stats.currentCapital)}`,
    `Lãi/Lỗ ròng: ${currency(stats.totalPnL)}`,
    `Winrate: ${stats.winrate.toFixed(1)}%`
  ];
  const repeated = items.concat(items);
  document.getElementById('market-marquee').innerHTML = repeated.map(item => `<div class="ticker-item"><span class="ticker-badge"></span><span>${item}</span></div>`).join('');
}

function renderMetrics(data, stats) {
  const market = getMarketMessage(data.market.distDays);
  document.getElementById('market-status').textContent = market.status;
  document.getElementById('dist-days-value').textContent = data.market.distDays;
  document.getElementById('trade-count').textContent = stats.trades.length;
  document.getElementById('winrate').textContent = `${stats.winrate.toFixed(1)}%`;
  document.getElementById('current-capital').textContent = currency(stats.currentCapital);
  document.getElementById('best-setup').textContent = stats.bestSetup;
  document.getElementById('dist-days-input').value = data.market.distDays;
  document.getElementById('market-guidance').textContent = market.guidance;
}

function renderEquityChart(stats) {
  const ctx = document.getElementById('equityChart');
  const labels = stats.equitySeries.length ? stats.equitySeries.map(x => x.date) : ['Khởi điểm'];
  const values = stats.equitySeries.length ? stats.equitySeries.map(x => x.capital) : [INITIAL_CAPITAL];
  if (equityChart) equityChart.destroy();
  equityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Vốn',
        data: values,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.15)',
        tension: 0.32,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8', callback: value => Number(value).toLocaleString('vi-VN') }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderSetupRanking(stats) {
  const wrap = document.getElementById('setup-ranking');
  if (!stats.setupRanking.length) {
    wrap.innerHTML = '<div class="text-slate-400">Chưa có dữ liệu.</div>';
    return;
  }
  wrap.innerHTML = stats.setupRanking.map((item, idx) => `
    <div class="pattern-card p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-white font-black text-lg">#${idx + 1} ${item.name}</div>
          <div class="text-slate-400 text-sm">${item.count} giao dịch · Avg R ${item.avgR.toFixed(2)}</div>
        </div>
        <div class="text-right">
          <div class="text-emerald-300 font-black text-xl">${item.winrate.toFixed(0)}%</div>
          <div class="text-slate-400 text-sm">${currency(item.pnl)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderMonthStats(stats) {
  const wrap = document.getElementById('month-stats');
  const entries = Object.entries(stats.months).sort((a,b) => b[0].localeCompare(a[0]));
  if (!entries.length) {
    wrap.innerHTML = '<div class="text-slate-400">Chưa có dữ liệu tháng.</div>';
    return;
  }
  wrap.innerHTML = entries.map(([month, info]) => `
    <div class="month-row p-4 flex items-center justify-between gap-3">
      <div>
        <div class="font-black text-white">${month}</div>
        <div class="text-slate-400 text-sm">${info.count} lệnh</div>
      </div>
      <div class="font-black ${info.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}">${currency(info.pnl)}</div>
    </div>
  `).join('');
}

function fillSetupOptions(selectEl, patterns, includeAll=false) {
  const options = patterns.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
  selectEl.innerHTML = (includeAll ? '<option value="all">Tất cả setup</option>' : '') + options;
}

function renderJournal(data, stats) {
  const filter = document.getElementById('journal-filter-setup').value || 'all';
  fillSetupOptions(document.getElementById('journal-filter-setup'), data.patterns, true);
  document.getElementById('journal-filter-setup').value = filter && Array.from(document.getElementById('journal-filter-setup').options).some(o => o.value === filter) ? filter : 'all';
  const selected = document.getElementById('journal-filter-setup').value;
  const trades = stats.trades.slice().sort((a,b) => b.date.localeCompare(a.date)).filter(t => selected === 'all' || t.setup === selected);
  const body = document.getElementById('journal-body');
  body.innerHTML = trades.map(t => `
    <tr>
      <td>${t.date}</td>
      <td class="font-black text-white">${escapeHtml(t.ticker)}</td>
      <td>${escapeHtml(t.setup)}</td>
      <td class="text-right">${t.buy}</td>
      <td class="text-right">${t.sell}</td>
      <td class="text-right">${Number(t.qty).toLocaleString('vi-VN')}</td>
      <td class="text-right">${Number(t.rMultiple).toFixed(1)}</td>
      <td class="text-right ${t.pnl >= 0 ? 'trade-pnl-pos' : 'trade-pnl-neg'}">${currency(t.pnl)}</td>
      <td class="text-right">
        <button class="link-btn" onclick="openTradeModal('${t.id}')">Sửa</button>
        <button class="link-btn danger ml-2" onclick="deleteTrade('${t.id}')">Xóa</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="9" class="py-6 text-center text-slate-400">Chưa có giao dịch.</td></tr>';

  const latest = trades[0] || stats.trades.slice().sort((a,b) => b.date.localeCompare(a.date))[0];
  document.getElementById('journal-side').innerHTML = latest ? `
    <div class="space-y-4">
      <div class="subpanel p-4">
        <div class="text-sm text-slate-400">Mã</div>
        <div class="text-3xl font-black text-white">${escapeHtml(latest.ticker)}</div>
        <div class="mt-2 badge ${latest.pnl >= 0 ? 'badge-green' : 'badge-rose'}">${escapeHtml(latest.setup)}</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="stat-chip"><div class="text-slate-400 text-sm">Ngày</div><div class="text-white font-black mt-1">${latest.date}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">PnL</div><div class="${latest.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-black mt-1">${currency(latest.pnl)}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">R</div><div class="text-white font-black mt-1">${Number(latest.rMultiple).toFixed(1)}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">Biên lợi nhuận</div><div class="text-white font-black mt-1">${latest.percent.toFixed(1)}%</div></div>
      </div>
      <div class="subpanel p-4">
        <div class="text-slate-400 text-sm">Ghi chú</div>
        <div class="text-white mt-2 leading-7">${escapeHtml(latest.notes || 'Không có ghi chú')}</div>
      </div>
    </div>
  ` : '<div class="text-slate-400">Chưa có dữ liệu nhật ký.</div>';
}

function renderPatternList(data) {
  const keyword = (document.getElementById('pattern-search').value || '').toLowerCase().trim();
  const list = data.patterns.filter(p => p.name.toLowerCase().includes(keyword));
  const wrap = document.getElementById('pattern-list');
  wrap.innerHTML = list.map(p => `
    <div class="pattern-card p-4 space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-white text-2xl font-black">${escapeHtml(p.name)}</div>
          <div class="text-slate-400 text-sm mt-1">${p.conditions.length} điều kiện chuẩn</div>
        </div>
        <div class="flex gap-2 text-sm font-bold">
          <button class="link-btn" onclick="openPatternModal('${p.id}')">Sửa</button>
          <button class="link-btn danger" onclick="deletePattern('${p.id}')">Xóa</button>
        </div>
      </div>
      <div class="relative">
        <img src="${p.image || assets.fallbackPattern}" alt="${escapeHtml(p.name)}" class="w-full h-64 object-cover" />
        <button class="btn btn-secondary absolute bottom-3 right-3 !py-2 !px-3 text-xs" onclick="showImage('${p.image || assets.fallbackPattern}')">Xem lớn</button>
      </div>
      <div class="space-y-2 text-slate-300 text-sm leading-7">
        ${p.conditions.slice(0,5).map(c => `<div>• ${escapeHtml(c)}</div>`).join('')}
      </div>
    </div>
  `).join('') || '<div class="text-slate-400">Không tìm thấy mẫu hình.</div>';
}

function renderAnalysis(data, stats) {
  const select = document.getElementById('analysis-pattern-select');
  select.innerHTML = data.patterns.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  if (!data.analysis.selectedPatternId && data.patterns[0]) data.analysis.selectedPatternId = data.patterns[0].id;
  select.value = data.analysis.selectedPatternId;
  const selected = data.patterns.find(p => p.id === data.analysis.selectedPatternId) || data.patterns[0];
  if (!selected) {
    document.getElementById('analysis-checklist').innerHTML = '<div class="text-slate-400">Chưa có mẫu hình.</div>';
    return;
  }
  const checks = data.analysis.checklistState[selected.id] || {};
  document.getElementById('analysis-checklist').innerHTML = selected.conditions.map((condition, idx) => `
    <label class="check-row">
      <input type="checkbox" ${checks[idx] ? 'checked' : ''} onchange="toggleAnalysisCheck('${selected.id}', ${idx}, this.checked)" />
      <span class="text-white font-semibold leading-7">Điều kiện ${idx + 1}: ${escapeHtml(condition)}</span>
    </label>
  `).join('');
  document.getElementById('analysis-pattern-image').src = selected.image || assets.fallbackPattern;
  document.getElementById('analysis-current-image').src = data.analysis.currentImage || assets.fallbackAnalysis;
  const setupStats = stats.setupRanking.find(s => s.name === selected.name) || { count: 0, winrate: 0, avgR: 0, pnl: 0 };
  const checkedCount = Object.values(checks).filter(Boolean).length;
  document.getElementById('analysis-stats').innerHTML = `
    <div class="stat-chip"><div class="text-slate-400 text-sm">Số giao dịch</div><div class="text-white font-black text-2xl mt-1">${setupStats.count}</div></div>
    <div class="stat-chip"><div class="text-slate-400 text-sm">Winrate</div><div class="text-emerald-300 font-black text-2xl mt-1">${setupStats.winrate.toFixed(0)}%</div></div>
    <div class="stat-chip"><div class="text-slate-400 text-sm">Checklist đạt</div><div class="text-white font-black text-2xl mt-1">${checkedCount}/${selected.conditions.length}</div></div>
  `;
}

function getRadarTypeLabel(type) {
  return type === 'nearBuy' ? 'Gần điểm mua' : type === 'watch' ? 'Theo dõi' : 'Dài hạn';
}

function getRadarBadge(status) {
  if (status === 'Sẵn sàng') return 'badge-green';
  if (status === 'Chờ nến tuần') return 'badge-amber';
  return 'badge-blue';
}

function renderRadar(data) {
  ['nearBuy', 'watch', 'longTerm'].forEach(type => {
    const wrap = document.getElementById(`radar-${type}`);
    const items = data.radar.filter(r => r.type === type).sort((a,b) => Number(b.score) - Number(a.score));
    wrap.innerHTML = items.map(item => `
      <div class="radar-card p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-white text-2xl font-black">${escapeHtml(item.ticker)}</div>
            <div class="text-slate-400 text-sm mt-1">${escapeHtml(item.setup)} · Điểm ${item.score}</div>
          </div>
          <span class="badge ${getRadarBadge(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <img src="${item.image || 'assets/radar.png'}" alt="${escapeHtml(item.ticker)}" class="radar-thumb w-full h-40 object-cover" />
        <div class="text-sm text-slate-300 leading-7">${escapeHtml(item.notes || '')}</div>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="text-sm text-slate-400">${item.pivot ? `Pivot: ${item.pivot}` : 'Theo dõi theo nến tuần'}</div>
          <div class="radar-actions text-sm">
            <button class="link-btn" onclick="showImage('${item.image || 'assets/radar.png'}')">Xem chart</button>
            <button class="link-btn" onclick="openRadarModal('${item.id}')">Sửa</button>
            <button class="link-btn danger" onclick="deleteRadar('${item.id}')">Xóa</button>
            ${type !== 'nearBuy' ? `<button class="link-btn" onclick="moveRadar('${item.id}','nearBuy')">Chuyển gần mua</button>` : ''}
            ${type !== 'watch' ? `<button class="link-btn" onclick="moveRadar('${item.id}','watch')">Chuyển theo dõi</button>` : ''}
            ${type !== 'longTerm' ? `<button class="link-btn" onclick="moveRadar('${item.id}','longTerm')">Chuyển dài hạn</button>` : ''}
          </div>
        </div>
      </div>
    `).join('') || '<div class="text-slate-400">Chưa có mã.</div>';
  });
}

function renderNotes(data) {
  document.getElementById('mindset-notes').value = data.notes.mindset || '';
  document.getElementById('library-notes').value = data.notes.library || '';
}

function renderApp() {
  const data = getData();
  const stats = getStats(data);
  renderMarquee(data, stats);
  renderMetrics(data, stats);
  renderEquityChart(stats);
  renderSetupRanking(stats);
  renderMonthStats(stats);
  renderJournal(data, stats);
  renderPatternList(data);
  renderAnalysis(data, stats);
  renderRadar(data);
  renderNotes(data);
  fillSetupOptions(document.querySelector('#trade-form select[name="setup"]'), data.patterns);
  fillSetupOptions(document.querySelector('#radar-form select[name="setup"]'), data.patterns);
  lucide.createIcons();
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));

function openTradeModal(id = null) {
  const data = getData();
  const form = document.getElementById('trade-form');
  form.reset();
  fillSetupOptions(form.querySelector('select[name="setup"]'), data.patterns);
  document.getElementById('trade-modal-title').textContent = id ? 'Sửa lệnh' : 'Thêm lệnh';
  if (id) {
    const trade = data.trades.find(t => t.id === id);
    if (!trade) return;
    Object.keys(trade).forEach(key => { if (form.elements[key]) form.elements[key].value = trade[key]; });
  } else {
    form.elements.id.value = '';
    form.elements.date.value = new Date().toISOString().slice(0,10);
  }
  openModal('trade-modal');
}

function deleteTrade(id) {
  if (!confirm('Xóa lệnh này?')) return;
  const data = getData();
  data.trades = data.trades.filter(t => t.id !== id);
  saveData(data);
  renderApp();
}

function openPatternModal(id = null) {
  const data = getData();
  const form = document.getElementById('pattern-form');
  form.reset();
  document.getElementById('pattern-modal-title').textContent = id ? 'Sửa mẫu hình' : 'Thêm mẫu hình';
  if (id) {
    const p = data.patterns.find(x => x.id === id);
    if (!p) return;
    form.elements.id.value = p.id;
    form.elements.name.value = p.name;
    form.elements.conditions.value = p.conditions.join('\n');
  }
  openModal('pattern-modal');
}

function deletePattern(id) {
  if (!confirm('Xóa mẫu hình này?')) return;
  const data = getData();
  data.patterns = data.patterns.filter(p => p.id !== id);
  data.trades = data.trades.filter(t => t.setup !== undefined);
  if (data.analysis.selectedPatternId === id) data.analysis.selectedPatternId = data.patterns[0]?.id || null;
  saveData(data);
  renderApp();
}

function openRadarModal(id = null, forcedType = null) {
  const data = getData();
  const form = document.getElementById('radar-form');
  form.reset();
  fillSetupOptions(form.querySelector('select[name="setup"]'), data.patterns);
  document.getElementById('radar-modal-title').textContent = id ? 'Sửa mã Radar' : 'Thêm mã Radar';
  if (id) {
    const item = data.radar.find(r => r.id === id);
    if (!item) return;
    Object.keys(item).forEach(key => { if (form.elements[key]) form.elements[key].value = item[key]; });
  } else {
    form.elements.id.value = '';
    form.elements.type.value = forcedType || 'watch';
  }
  openModal('radar-modal');
}

function deleteRadar(id) {
  if (!confirm('Xóa mã radar này?')) return;
  const data = getData();
  data.radar = data.radar.filter(r => r.id !== id);
  saveData(data);
  renderApp();
}

function moveRadar(id, type) {
  const data = getData();
  const item = data.radar.find(r => r.id === id);
  if (!item) return;
  item.type = type;
  item.status = type === 'longTerm' ? 'Chờ nến tuần' : type === 'nearBuy' ? 'Sẵn sàng' : 'Đang theo dõi';
  saveData(data);
  renderApp();
}

function toggleAnalysisCheck(patternId, idx, checked) {
  const data = getData();
  if (!data.analysis.checklistState[patternId]) data.analysis.checklistState[patternId] = {};
  data.analysis.checklistState[patternId][idx] = checked;
  saveData(data);
  renderApp();
}

function showImage(src) {
  document.getElementById('viewer-image').src = src;
  openModal('image-viewer');
}

async function fileToDataUrl(file) {
  if (!file) return null;
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

document.getElementById('trade-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = getData();
  const form = event.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  const trade = {
    id: payload.id || uid(),
    date: payload.date,
    ticker: payload.ticker.toUpperCase().trim(),
    setup: payload.setup,
    buy: Number(payload.buy),
    sell: Number(payload.sell),
    qty: Number(payload.qty),
    rMultiple: Number(payload.rMultiple),
    notes: payload.notes || ''
  };
  const index = data.trades.findIndex(t => t.id === trade.id);
  if (index >= 0) data.trades[index] = trade; else data.trades.push(trade);
  saveData(data);
  closeModal('trade-modal');
  renderApp();
});

document.getElementById('pattern-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = getData();
  const form = event.target;
  const fd = new FormData(form);
  const id = fd.get('id') || uid();
  const existing = data.patterns.find(p => p.id === id);
  const file = form.elements.image.files[0];
  const image = file ? await fileToDataUrl(file) : (existing?.image || assets.fallbackPattern);
  const pattern = {
    id,
    name: String(fd.get('name')).trim(),
    image,
    conditions: String(fd.get('conditions')).split('\n').map(x => x.trim()).filter(Boolean)
  };
  const index = data.patterns.findIndex(p => p.id === id);
  if (index >= 0) data.patterns[index] = pattern; else data.patterns.push(pattern);
  if (!data.analysis.selectedPatternId) data.analysis.selectedPatternId = pattern.id;
  saveData(data);
  closeModal('pattern-modal');
  renderApp();
});

document.getElementById('radar-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = getData();
  const form = event.target;
  const fd = new FormData(form);
  const id = fd.get('id') || uid();
  const existing = data.radar.find(r => r.id === id);
  const file = form.elements.image.files[0];
  const image = file ? await fileToDataUrl(file) : (existing?.image || 'assets/radar.png');
  const item = {
    id,
    type: fd.get('type') || 'watch',
    ticker: String(fd.get('ticker')).toUpperCase().trim(),
    setup: fd.get('setup'),
    status: fd.get('status'),
    score: Number(fd.get('score')),
    pivot: Number(fd.get('pivot') || 0),
    notes: String(fd.get('notes') || ''),
    image
  };
  const index = data.radar.findIndex(r => r.id === id);
  if (index >= 0) data.radar[index] = item; else data.radar.push(item);
  saveData(data);
  closeModal('radar-modal');
  renderApp();
});

document.getElementById('journal-filter-setup').addEventListener('change', renderApp);
document.getElementById('pattern-search').addEventListener('input', () => renderPatternList(getData()));
document.getElementById('analysis-pattern-select').addEventListener('change', e => {
  const data = getData();
  data.analysis.selectedPatternId = e.target.value;
  saveData(data);
  renderApp();
});
document.getElementById('analysis-upload').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const data = getData();
  data.analysis.currentImage = await fileToDataUrl(file);
  saveData(data);
  renderApp();
});
document.getElementById('analysis-clear').addEventListener('click', () => {
  const data = getData();
  data.analysis.currentImage = assets.fallbackAnalysis;
  saveData(data);
  renderApp();
});
document.getElementById('save-market-btn').addEventListener('click', () => {
  const data = getData();
  data.market.distDays = Number(document.getElementById('dist-days-input').value || 0);
  saveData(data);
  renderApp();
});
document.getElementById('seed-btn').addEventListener('click', () => {
  if (!confirm('Ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu?')) return;
  resetToSample();
});
document.getElementById('new-trade-btn').addEventListener('click', () => openTradeModal());
document.getElementById('new-pattern-btn').addEventListener('click', () => openPatternModal());
document.querySelectorAll('.radar-new').forEach(btn => btn.addEventListener('click', () => openRadarModal(null, btn.dataset.type)));
document.getElementById('mindset-notes').addEventListener('change', e => {
  const data = getData();
  data.notes.mindset = e.target.value;
  saveData(data);
});
document.getElementById('library-notes').addEventListener('change', e => {
  const data = getData();
  data.notes.library = e.target.value;
  saveData(data);
});
document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cacon-stock-v9-data.json';
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    saveData(data);
    renderApp();
    alert('Đã nhập dữ liệu thành công.');
  } catch {
    alert('File JSON không hợp lệ.');
  }
  e.target.value = '';
});

window.openTradeModal = openTradeModal;
window.deleteTrade = deleteTrade;
window.openPatternModal = openPatternModal;
window.deletePattern = deletePattern;
window.openRadarModal = openRadarModal;
window.deleteRadar = deleteRadar;
window.moveRadar = moveRadar;
window.toggleAnalysisCheck = toggleAnalysisCheck;
window.showImage = showImage;

renderApp();
lucide.createIcons();
