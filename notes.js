import { updateState } from '../core/state.js';
import { uid } from '../core/utils.js';

export function renderNotes(state) {
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Tâm lý</div>
        <h2 class="big-title">Nhật ký cảm xúc giao dịch</h2>
        <div class="form-row">
          <input id="psy-date" class="input" type="date" value="2026-03-09" />
          <input id="psy-mood" class="input" placeholder="Tâm trạng" value="Kỷ luật" />
        </div>
        <textarea id="psy-note" class="input">Chỉ vào khi đủ điều kiện, không đuổi giá.</textarea>
        <div class="actions" style="margin-top:12px"><button id="add-psy" class="ui-btn ui-btn-green">Thêm ghi chú tâm lý</button></div>
        <div style="margin-top:16px">${state.psychology.map(x => `<div class="list-card"><div><strong>${x.date}</strong><div class="small">${x.mood}</div></div><div class="small">${x.note}</div></div>`).join('')}</div>
        <img class="module-image" style="margin-top:16px" src="assets/images/tam_ly.png" alt="Tâm lý" />
      </div>
      <div class="panel">
        <div class="section-title">Thư viện</div>
        <h2 class="big-title">Ghi chú kiến thức</h2>
        <div class="form-row">
          <input id="lib-title" class="input" placeholder="Tiêu đề" value="Checklist breakout chuẩn" />
        </div>
        <textarea id="lib-content" class="input">Nền chặt, vol khô, thị trường thuận, RS cao, breakout dứt khoát.</textarea>
        <div class="actions" style="margin-top:12px"><button id="add-lib" class="ui-btn ui-btn-green">Thêm ghi chú thư viện</button></div>
        <div style="margin-top:16px">${state.library.map(x => `<div class="card-mini" style="margin-bottom:12px"><strong>${x.title}</strong><div class="small" style="margin-top:8px">${x.content}</div></div>`).join('')}</div>
        <img class="module-image" style="margin-top:16px" src="assets/images/thu_vien.png" alt="Thư viện" />
      </div>
    </section>
  `;
}

export function bindNotes(onChange) {
  document.getElementById('add-psy')?.addEventListener('click', () => {
    updateState(s => { s.psychology.unshift({ id: uid(), date: document.getElementById('psy-date').value, mood: document.getElementById('psy-mood').value, note: document.getElementById('psy-note').value }); });
    onChange();
  });
  document.getElementById('add-lib')?.addEventListener('click', () => {
    updateState(s => { s.library.unshift({ id: uid(), title: document.getElementById('lib-title').value, content: document.getElementById('lib-content').value }); });
    onChange();
  });
}
