export function renderAnalysis(state) {
  const pattern = state.patterns[0];
  const tradesForPattern = state.journal.filter(t => t.setup === pattern.name);
  const win = tradesForPattern.filter(t => t.pnl > 0).length;
  const winrate = tradesForPattern.length ? Math.round(win / tradesForPattern.length * 100) : 0;
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Checklist hệ thống</div>
        <h2 class="big-title">${pattern.name} và dữ liệu mẫu đang liên kết</h2>
        ${pattern.conditions.map((c, i) => `<div class="list-card"><div><strong>Điều kiện ${i+1}</strong><div class="small">${c}</div></div><div>☑</div></div>`).join('')}
        <div class="link-note">analysis.js lấy điều kiện từ patterns.js và lấy thống kê hiệu quả từ journal.js.</div>
      </div>
      <div class="panel">
        <div class="section-title">So sánh biểu đồ hiện tại</div>
        <h2 class="big-title">Mẫu chuẩn và thống kê theo setup</h2>
        <img class="pattern-image side-image" src="${pattern.image}" alt="Mẫu chuẩn" />
        <div class="card-mini" style="margin-top:16px">
          <div><strong>Số giao dịch:</strong> ${tradesForPattern.length}</div>
          <div><strong>Winrate:</strong> ${winrate}%</div>
          <div><strong>Mẫu đang đọc từ file:</strong> patterns.js</div>
        </div>
      </div>
    </section>
  `;
}
