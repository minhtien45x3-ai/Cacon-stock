import { money, bestPattern, marketRecommendation } from '../core/utils.js';

export function renderDashboard(state) {
  const trades = Array.isArray(state.journal) ? state.journal : [];
  const win = trades.filter(x => Number(x.pnl) > 0).length;
  const totalPnl = trades.reduce((s, x) => s + Number(x.pnl || 0), 500000000);
  const market = marketRecommendation(Number(state?.market?.distributionDays || 0));
  const patternRank = rankPatterns(trades);

  return `
    <section class="hero">
      <div class="panel banner"><div class="marquee">Khuyến nghị thị trường: ${market.text} • Số lệnh: ${trades.length} • Mẫu hình hiệu quả nhất: ${bestPattern(trades)} • Vốn hiện tại: ${money(totalPnl)}</div></div>
      <div class="panel">
        <div class="section-title">Liên kết file</div>
        <div class="small">dashboard.js tự đọc dữ liệu từ journal, market và patterns qua state dùng chung.</div>
        <div class="link-note">Sửa nhật ký, mẫu hình hoặc ngày phân phối ở tab khác → tab Tổng quan tự cập nhật.</div>
      </div>
    </section>

    <section class="grid grid-4" style="margin-bottom:20px">
      <div class="panel stat"><div class="kpi-label">Khuyến nghị thị trường</div><div class="value" style="font-size:32px">${market.text}</div></div>
      <div class="panel stat"><div class="kpi-label">Ngày phân phối</div><div class="value">${state?.market?.distributionDays ?? 0}</div></div>
      <div class="panel stat"><div class="kpi-label">Số lệnh</div><div class="value">${trades.length}</div></div>
      <div class="panel stat"><div class="kpi-label">Winrate</div><div class="value">${trades.length ? Math.round((win / trades.length) * 100) : 0}%</div></div>
    </section>

    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Tổng quan</div>
        <h2 class="big-title">Đường cong vốn và hiệu suất theo tháng</h2>
        <canvas id="equity-chart" height="120"></canvas>
        <div id="chart-fallback" class="small" style="display:none;margin-top:12px">Không tải được Chart.js, nhưng dữ liệu mẫu đã có sẵn.</div>
      </div>
      <div class="panel">
        <div class="section-title">Xếp hạng mẫu hình</div>
        <h2 class="big-title">Tỷ lệ thắng từ cao xuống thấp</h2>
        ${patternRank.map((row, i) => `<div class="list-card"><div><strong>${i + 1}. ${row.name}</strong><div class="small">${row.total} giao dịch</div></div><div><strong>${row.winrate}%</strong></div></div>`).join('')}
      </div>
    </section>
  `;
}

export function mountDashboard() {
  const ctx = document.getElementById('equity-chart');
  if (!ctx) return;
  if (typeof window.Chart === 'undefined') {
    const fallback = document.getElementById('chart-fallback');
    if (fallback) fallback.style.display = 'block';
    return;
  }
  const raw = JSON.parse(localStorage.getItem('cacon-stock-v10.4') || '{}');
  const monthly = aggregateMonthly(Array.isArray(raw.journal) ? raw.journal : []);
  new window.Chart(ctx, {
    type: 'line',
    data: { labels: monthly.map(x => x.month), datasets: [{ label: 'PnL tháng', data: monthly.map(x => x.pnl), borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.15)', tension: .35, fill: true }] },
    options: { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } }
  });
}

function aggregateMonthly(trades) {
  const map = new Map();
  trades.forEach(t => {
    const month = String(t.date || '').slice(0, 7) || 'Không rõ';
    map.set(month, (map.get(month) || 0) + Number(t.pnl || 0));
  });
  return [...map.entries()].map(([month, pnl]) => ({ month, pnl }));
}

function rankPatterns(trades) {
  const map = {};
  trades.forEach(t => {
    const key = t.setup || 'Khác';
    map[key] ||= { win: 0, total: 0 };
    map[key].total++;
    if (Number(t.pnl) > 0) map[key].win++;
  });
  return Object.entries(map)
    .map(([name, v]) => ({ name, total: v.total, winrate: Math.round((v.win / v.total) * 100) }))
    .sort((a, b) => b.winrate - a.winrate);
}
