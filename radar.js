export function renderRadar(state) {
  const blocks = [
    ['Cổ phiếu gần điểm mua theo mẫu hình', state.radar.nearBuy],
    ['Cổ phiếu theo dõi', state.radar.watchlist],
    ['Cổ phiếu dài hạn - mua tại nến tuần', state.radar.longTerm]
  ];
  return `
    <section class="radar-grid">
      ${blocks.map(([title, arr]) => `
        <div class="panel radar-col">
          <div>
            <div class="section-title">Radar</div>
            <h2 class="big-title">${title}</h2>
          </div>
          ${arr.map(item => `
            <div class="card-mini">
              <div style="display:flex;justify-content:space-between"><strong>${item.ticker}</strong><span class="small">${item.setup}</span></div>
              <div class="small" style="margin:6px 0">${item.status}</div>
              <div class="small">${item.note}</div>
              <img class="pattern-image" style="height:150px;margin-top:12px" src="${item.image}" alt="${item.ticker}" />
            </div>
          `).join('')}
        </div>
      `).join('')}
    </section>
  `;
}
