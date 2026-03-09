import { money, bestPattern, marketRecommendation } from '../core/utils.js';

export function renderDashboard(state) {
  const trades = state.journal;
  const win = trades.filter(x => x.pnl > 0).length;
  const totalPnl = trades.reduce((s, x) => s + x.pnl, 500000000);
  const market = marketRecommendation(Number(state.market.distributionDays || 0));
  const monthly = aggregateMonthly(trades);
  const patternRank = rankPatterns(trades);

  return `
    <section class="hero">
      <div class="panel banner"><div class="marquee">Khuyến nghị thị trường: ${market.text} • Số lệnh: ${trades.length} • Mẫu hình hiệu quả nhất: ${bestPattern(trades)} • Vốn hiện tại: ${money(totalPnl)}</div></div>
      <div class="panel">
        <div class="section-title">Liên kết file</div>
        <div class="small">dashboard.js lấy dữ liệu từ journal.js và market.js qua state.js + storage.js.</div>
        <div class="link-note">Ví dụ: nhật ký thay đổi → dashboard tự cập nhật số lệnh, winrate, vốn và xếp hạng mẫu hình.</div>
      </div>
    </section>

    <section class="grid grid-4" style="margin-bottom:20px">
      <div class="panel stat"><div class="kpi-label">Khuyến nghị thị trường</div><div class="value" style="font-size:32px">${market.text}</div></div>
      <div class="panel stat"><div class="kpi-label">Ngày phân phối</div><div class="value">${state.market.distributionDays}</div></div>
      <div class="panel stat"><div class="kpi-label">Số lệnh</div><div class="value">${trades.length}</div></div>
      <div class="panel stat"><div class="kpi-label">Winrate</div><div class="value">${trades.length ? Math.round((win/trades.length)*100) : 0}%</div></div>
    </section>

    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Tổng quan</div>
        <h2 class="big-title">Đường cong vốn và hiệu suất theo tháng</h2>
        <canvas id="equity-chart" height="120"></canvas>
      </div>
      <div class="panel">
        <div class="section-title">Xếp hạng mẫu hình</div>
        <h2 class="big-title">Tỷ lệ thắng từ cao xuống thấp</h2>
        ${patternRank.map((row, i) => `<div class="list-card"><div><strong>${i+1}. ${row.name}</strong><div class="small">${row.total} giao dịch</div></div><div><strong>${row.winrate}%</strong></div></div>`).join('')}
      </div>
    </section>
  `;
}

export function mountDashboard(state) {
  const monthly = aggregateMonthly(state.journal);
  const ctx = document.getElementById('equity-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: { labels: monthly.map(x => x.month), datasets: [{ label: 'PnL tháng', data: monthly.map(x => x.pnl), borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.15)', tension: .35, fill: true }] },
    options: { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } }
  });
}

function aggregateMonthly(trades) {
  const map = new Map();
  trades.forEach(t => {
    const month = String(t.date).slice(0, 7);
    map.set(month, (map.get(month) || 0) + Number(t.pnl || 0));
  });
  return [...map.entries()].map(([month, pnl]) => ({ month, pnl }));
}
function rankPatterns(trades) {
  const map = {};
  trades.forEach(t => {
    map[t.setup] ||= { win: 0, total: 0 };
    map[t.setup].total++;
    if (t.pnl > 0) map[t.setup].win++;
  });
  return Object.entries(map).map(([name, v]) => ({ name, total: v.total, winrate: Math.round((v.win / v.total) * 100) })).sort((a,b)=>b.winrate-a.winrate);
}
