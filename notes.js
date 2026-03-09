export function renderNotes(state) {
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Tâm lý</div>
        <h2 class="big-title">Nhật ký cảm xúc giao dịch</h2>
        ${state.psychology.map(x => `<div class="list-card"><div><strong>${x.date}</strong><div class="small">${x.mood}</div></div><div class="small">${x.note}</div></div>`).join('')}
        <img class="module-image" style="margin-top:16px" src="assets/images/tam_ly.png" alt="Tâm lý" />
      </div>
      <div class="panel">
        <div class="section-title">Thư viện</div>
        <h2 class="big-title">Ghi chú kiến thức</h2>
        ${state.library.map(x => `<div class="card-mini"><strong>${x.title}</strong><div class="small" style="margin-top:8px">${x.content}</div></div>`).join('')}
        <img class="module-image" style="margin-top:16px" src="assets/images/thu_vien.png" alt="Thư viện" />
      </div>
    </section>
  `;
}
