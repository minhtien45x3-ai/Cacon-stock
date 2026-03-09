import { assets, getData, saveData } from '../core/storage.js';
import { fileToDataUrl, escapeHtml, uid } from '../core/utils.js';
import { openModal, closeModal } from '../core/dom.js';

export function renderPatternList(data) {
  const keyword = (document.getElementById('pattern-search').value || '').toLowerCase().trim();
  const list = data.patterns.filter(p => p.name.toLowerCase().includes(keyword));
  const wrap = document.getElementById('pattern-list');

  wrap.innerHTML = list.map(p => `
    <div class="pattern-card p-4 space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-white text-2xl font-black">${escapeHtml(p.name)}</div>
          <div class="text-slate-400 text-sm mt-1">${p.conditions.length} điều kiện chuẩn</div>
        </div>
        <div class="flex gap-3 text-lg">
          <button class="link-btn" data-action="edit-pattern" data-id="${p.id}">Sửa</button>
          <button class="link-btn danger" data-action="delete-pattern" data-id="${p.id}">Xóa</button>
        </div>
      </div>
      <div class="relative">
        <img src="${p.image || assets.fallbackPattern}" alt="${escapeHtml(p.name)}" class="w-full h-64 object-cover rounded-2xl" />
        <button class="btn btn-secondary absolute bottom-3 right-3 !py-2 !px-3" data-action="view-pattern" data-image="${p.image || assets.fallbackPattern}">Xem lớn</button>
      </div>
      <div class="space-y-2 text-slate-300 leading-7">
        ${p.conditions.map(c => `<div>• ${escapeHtml(c)}</div>`).join('')}
      </div>
    </div>
  `).join('') || '<div class="text-slate-400">Chưa có mẫu hình nào.</div>';
}

export function openPatternModal(id = null) {
  const data = getData();
  const form = document.getElementById('pattern-form');
  form.reset();
  document.getElementById('pattern-modal-title').textContent = id ? 'Sửa mẫu hình' : 'Thêm mẫu hình';
  if (id) {
    const p = data.patterns.find(x => x.id === id);
    if (!p) return;
    form.elements.id.value = p.id;
    form.elements.name.value = p.name;
    form.elements.conditions.value = p.conditions.join('\n');
  }
  openModal('pattern-modal');
}

export function deletePattern(id, renderApp) {
  if (!confirm('Xóa mẫu hình này?')) return;
  const data = getData();
  data.patterns = data.patterns.filter(p => p.id !== id);
  if (data.analysis.selectedPatternId === id) data.analysis.selectedPatternId = data.patterns[0]?.id || null;
  saveData(data);
  renderApp();
}

export function bindPatternEvents(renderApp, showImage) {
  document.getElementById('new-pattern-btn').addEventListener('click', () => openPatternModal());
  document.getElementById('pattern-search').addEventListener('input', () => renderPatternList(getData()));

  document.getElementById('pattern-list').addEventListener('click', event => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, image } = btn.dataset;
    if (action === 'edit-pattern') openPatternModal(id);
    if (action === 'delete-pattern') deletePattern(id, renderApp);
    if (action === 'view-pattern') showImage(image);
  });

  document.getElementById('pattern-form').addEventListener('submit', async event => {
    event.preventDefault();
    const data = getData();
    const fd = new FormData(event.target);
    const id = fd.get('id') || uid();
    const existing = data.patterns.find(p => p.id === id);
    const file = event.target.elements.image.files[0];
    const image = file ? await fileToDataUrl(file) : (existing?.image || assets.fallbackPattern);
    const pattern = {
      id,
      name: String(fd.get('name')).trim(),
      image,
      conditions: String(fd.get('conditions')).split('\n').map(x => x.trim()).filter(Boolean)
    };
    const index = data.patterns.findIndex(p => p.id === id);
    if (index >= 0) data.patterns[index] = pattern;
    else data.patterns.push(pattern);
    if (!data.analysis.selectedPatternId) data.analysis.selectedPatternId = pattern.id;
    saveData(data);
    closeModal('pattern-modal');
    renderApp();
  });
}