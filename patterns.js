import { updateState } from '../core/state.js';
import { uid } from '../core/utils.js';

let editingId = null;

export function renderPatterns(state) {
  const editing = state.patterns.find(p => p.id === editingId);
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Thư viện mẫu hình</div>
        <h2 class="big-title">Thêm / sửa / xóa mẫu hình và upload ảnh</h2>
        <div class="form-row">
          <input id="pattern-name" class="input" placeholder="Tên mẫu" value="${editing?.name || 'Tight Flag'}" />
          <input id="pattern-c1" class="input" placeholder="Điều kiện 1" value="${editing?.conditions?.[0] || 'Pha tăng mạnh trước đó'}" />
          <input id="pattern-c2" class="input" placeholder="Điều kiện 2" value="${editing?.conditions?.[1] || 'Lá cờ ngắn, vol cạn'}" />
          <input id="pattern-c3" class="input" placeholder="Điều kiện 3" value="${editing?.conditions?.[2] || 'Breakout khỏi cờ'}" />
        </div>
        <div class="actions">
          <label class="ui-btn" for="pattern-image-file">Up ảnh mẫu</label>
          <input id="pattern-image-file" type="file" accept="image/*" hidden />
          <button id="save-pattern" class="ui-btn ui-btn-green">${editing ? 'Cập nhật mẫu' : 'Thêm mẫu mới'}</button>
          <button id="reset-pattern" class="ui-btn">Làm mới form</button>
        </div>
        <div id="pattern-upload-name" class="small" style="margin-top:8px">${editing?.image?.startsWith('data:') ? 'Đang dùng ảnh đã tải lên' : 'Đang dùng ảnh mặc định'}</div>
      </div>
      <div class="panel">
        <div class="section-title">Danh sách mẫu hình</div>
        <h2 class="big-title">Liên kết sang tab Phân tích</h2>
        <div class="pattern-grid single-col">
          ${state.patterns.map(p => `
            <div class="card-mini">
              <div class="head-inline"><strong style="font-size:22px">${p.name}</strong><span class="small">${p.conditions.length} điều kiện</span></div>
              <img class="pattern-image" src="${p.image}" alt="${p.name}" style="margin:12px 0" data-popup="${p.image}" />
              ${p.conditions.map(c => `<div class="small" style="margin:6px 0">• ${c}</div>`).join('')}
              <div class="row-actions" style="margin-top:12px">
                <button class="tiny-btn" data-edit-pattern="${p.id}">Sửa</button>
                <button class="tiny-btn danger" data-del-pattern="${p.id}">Xóa</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function bindPatterns(onChange, state) {
  let uploadedImage = null;

  document.getElementById('pattern-image-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    uploadedImage = await fileToDataUrl(file);
    document.getElementById('pattern-upload-name').textContent = `Đã chọn ảnh: ${file.name}`;
  });

  document.getElementById('save-pattern')?.addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value.trim();
    const conditions = ['pattern-c1','pattern-c2','pattern-c3'].map(id => document.getElementById(id).value.trim()).filter(Boolean);
    if (!name) return;
    updateState(s => {
      if (editingId) {
        const idx = s.patterns.findIndex(p => p.id === editingId);
        if (idx >= 0) s.patterns[idx] = { ...s.patterns[idx], name, conditions, image: uploadedImage || s.patterns[idx].image };
      } else {
        s.patterns.push({ id: uid().toString(), name, conditions, image: uploadedImage || 'assets/images/mau_hinh.png' });
      }
    });
    editingId = null;
    onChange();
  });

  document.getElementById('reset-pattern')?.addEventListener('click', () => {
    editingId = null;
    onChange();
  });

  document.querySelectorAll('[data-edit-pattern]').forEach(btn => btn.addEventListener('click', () => {
    editingId = btn.dataset.editPattern;
    onChange();
  }));

  document.querySelectorAll('[data-del-pattern]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.delPattern;
    updateState(s => {
      s.patterns = s.patterns.filter(p => p.id !== id);
      if (s.analysis?.selectedPatternId === id) s.analysis.selectedPatternId = s.patterns[0]?.id || null;
      s.journal = s.journal.map(t => ({ ...t, setup: t.setup === id ? (s.patterns[0]?.name || t.setup) : t.setup }));
    });
    if (editingId === id) editingId = null;
    onChange();
  }));

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
