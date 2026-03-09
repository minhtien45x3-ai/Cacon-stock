import { updateState } from '../core/state.js';
import { uid } from '../core/utils.js';

export function renderPatterns(state) {
  return `
    <section class="panel">
      <div class="section-title">Thư viện mẫu hình</div>
      <h2 class="big-title">Ví dụ mẫu đã nạp sẵn và liên kết sang tab Phân tích</h2>
      <div class="pattern-grid">
        ${state.patterns.map(p => `
          <div class="card-mini">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
              <strong style="font-size:24px">${p.name}</strong>
              <span class="small">${p.conditions.length} điều kiện</span>
            </div>
            <img class="pattern-image" src="${p.image}" alt="${p.name}" style="margin:12px 0" />
            ${p.conditions.map(c => `<div class="small" style="margin:6px 0">• ${c}</div>`).join('')}
          </div>
        `).join('')}
      </div>
      <div class="form-row" style="margin-top:18px">
        <input id="pattern-name" class="input" placeholder="Tên mẫu mới" value="Tight Flag" />
        <input id="pattern-c1" class="input" placeholder="Điều kiện 1" value="Pha tăng mạnh trước đó" />
        <input id="pattern-c2" class="input" placeholder="Điều kiện 2" value="Lá cờ ngắn, vol cạn" />
        <input id="pattern-c3" class="input" placeholder="Điều kiện 3" value="Breakout khỏi cờ" />
      </div>
      <div class="actions"><button id="add-pattern" class="ui-btn ui-btn-green">Thêm ví dụ mẫu hình</button></div>
    </section>
  `;
}

export function bindPatterns(onChange) {
  document.getElementById('add-pattern')?.addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value;
    const conditions = ['pattern-c1','pattern-c2','pattern-c3'].map(id => document.getElementById(id).value).filter(Boolean);
    updateState(s => { s.patterns.push({ id: uid(), name, conditions, image: 'assets/images/mau_hinh.png' }); });
    onChange();
  });
}
