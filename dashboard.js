import { INITIAL_CAPITAL } from '../core/storage.js';
import { currency } from '../core/utils.js';
import { appState } from '../core/state.js';

export function calculateTrade(trade) {
  const pnl = (Number(trade.sell) - Number(trade.buy)) * Number(trade.qty);
  const percent = Number(trade.buy) ? ((Number(trade.sell) - Number(trade.buy)) / Number(trade.buy)) * 100 : 0;
  return { ...trade, pnl, percent };
}

export function getMarketMessage(days) {
  const d = Number(days || 0);
  if (d <= 2) return { status: 'Thị trường bình thường', guidance: 'Có thể giao dịch bình thường, ưu tiên cổ phiếu dẫn dắt và setup chuẩn.', color: 'green' };
  if (d === 3) return { status: 'Thị trường có rủi ro', guidance: 'Hạ tỷ trọng margin, chỉ giữ các mã khỏe nhất và giao dịch chọn lọc.', color: 'amber' };
  if (d === 4) return { status: 'Nguy cơ cao', guidance: 'Đưa danh mục về tối thiểu 50% tiền mặt, tránh mở vị thế lớn mới.', color: 'rose' };
  return { status: 'Phòng thủ tối đa', guidance: '5-6 ngày phân phối: ưu tiên 100% tiền mặt hoặc giữ tỷ trọng rất thấp.', color: 'rose' };
}

export function getStats(data) {
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

export function renderMarquee(data, stats) {
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

export function renderMetrics(data, stats) {
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

export function renderEquityChart(stats) {
  const ctx = document.getElementById('equityChart');
  const labels = stats.equitySeries.length ? stats.equitySeries.map(x => x.date) : ['Khởi điểm'];
  const values = stats.equitySeries.length ? stats.equitySeries.map(x => x.capital) : [INITIAL_CAPITAL];
  if (appState.equityChart) appState.equityChart.destroy();
  appState.equityChart = new Chart(ctx, {
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

export function renderSetupRanking(stats) {
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

export function renderMonthStats(stats) {
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