import { updateState } from '../core/state.js';

export function renderAnalysis(state) {
  const selectedId = state.analysis?.selectedPatternId || state.patterns[0]?.id;
  const pattern = state.patterns.find(p => p.id === selectedId) || state.patterns[0];
  const tradesForPattern = state.journal.filter(t => t.setup === pattern?.name);
  const win = tradesForPattern.filter(t => t.pnl > 0).length;
  const winrate = tradesForPattern.length ? Math.round(win / tradesForPattern.length * 100) : 0;
  const avgR = tradesForPattern.length ? (tradesForPattern.reduce((s, t) => s + Number(t.r || 0), 0) / tradesForPattern.length).toFixed(2) : '0.00';
  return `
    <section class="grid grid-analysis">
      <div class="panel">
        <div class="section-title">Checklist hệ thống</div>
        <h2 class="big-title">Chọn mẫu hình để hiện điều kiện kiểm tra</h2>
        <div class="actions" style="margin-bottom:16px">
          <select id="analysis-pattern-select" class="compact-select">${state.patterns.map(p => `<option value="${p.id}" ${p.id===selectedId?'selected':''}>${p.name}</option>`).join('')}</select>
        </div>
        ${pattern ? pattern.conditions.map((c, i) => `<div class="list-card"><div><strong>Điều kiện ${i+1}</strong><div class="small">${c}</div></div><label><input type="checkbox" /> </label></div>`).join('') : '<div class="small">Chưa có mẫu hình</div>'}
        <div class="link-note">analysis.js đọc điều kiện từ patterns.js và đọc kết quả giao dịch từ journal.js.</div>
      </div>
      <div class="panel">
        <div class="section-title">So sánh biểu đồ hiện tại</div>
        <h2 class="big-title">Ảnh mẫu lớn + chart hiện tại + popup xem lớn</h2>
        <div class="compare-grid">
          <div>
            <div class="small" style="margin-bottom:8px">Mẫu chuẩn</div>
            <img class="pattern-image compare-image" src="${pattern?.image || 'assets/images/mau_hinh.png'}" alt="Mẫu chuẩn" data-popup="${pattern?.image || 'assets/images/mau_hinh.png'}" />
          </div>
          <div>
            <div class="small" style="margin-bottom:8px">Biểu đồ hiện tại</div>
            <img class="pattern-image compare-image" src="${state.analysis?.currentChart || 'assets/images/phan_tich.png'}" alt="Chart hiện tại" data-popup="${state.analysis?.currentChart || 'assets/images/phan_tich.png'}" />
            <div class="actions" style="margin-top:10px">
              <label class="ui-btn" for="analysis-chart-file">Chèn ảnh</label>
              <input id="analysis-chart-file" type="file" accept="image/*" hidden />
            </div>
          </div>
        </div>
        <div class="grid grid-3" style="margin-top:16px">
          <div class="card-mini"><div class="small">Số giao dịch</div><strong>${tradesForPattern.length}</strong></div>
          <div class="card-mini"><div class="small">Winrate</div><strong>${winrate}%</strong></div>
          <div class="card-mini"><div class="small">R trung bình</div><strong>${avgR}</strong></div>
        </div>
      </div>
    </section>
  `;
}

export function bindAnalysis(onChange) {
  document.getElementById('analysis-pattern-select')?.addEventListener('change', e => {
    updateState(s => {
      s.analysis ||= {};
      s.analysis.selectedPatternId = e.target.value;
    });
    onChange();
  });

  document.getElementById('analysis-chart-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const src = await fileToDataUrl(file);
    updateState(s => {
      s.analysis ||= {};
      s.analysis.currentChart = src;
    });
    onChange();
  });

  document.querySelectorAll('[data-popup]').forEach(img => img.addEventListener('click', () => openImagePopup(img.dataset.popup)));
}

function fileToDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
function openImagePopup(src) {
  const box = document.createElement('div');
  box.className = 'image-popup';
  box.innerHTML = `<div class="popup-card"><button class="popup-close">×</button><img src="${src}" alt="preview" /></div>`;
  document.body.appendChild(box);
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('popup-close')) box.remove(); });
}
