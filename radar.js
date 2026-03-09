import { assets, getData, saveData } from '../core/storage.js';
import { escapeHtml, fileToDataUrl, uid } from '../core/utils.js';
import { fillSetupOptions, openModal, closeModal } from '../core/dom.js';

export function getRadarBadge(status) {
  if (status === 'Sẵn sàng') return 'badge-green';
  if (status === 'Chờ nến tuần') return 'badge-amber';
  return 'badge-blue';
}

export function renderRadar(data) {
  ['nearBuy', 'watch', 'longTerm'].forEach(type => {
    const wrap = document.getElementById(`radar-${type}`);
    const items = data.radar.filter(r => r.type === type).sort((a,b) => Number(b.score) - Number(a.score));
    wrap.innerHTML = items.map(item => `
      <div class="radar-card p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-white text-2xl font-black">${escapeHtml(item.ticker)}</div>
            <div class="text-slate-400 text-sm mt-1">${escapeHtml(item.setup)} · Điểm ${item.score}</div>
          </div>
          <span class="badge ${getRadarBadge(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <img src="${item.image || assets.fallbackRadar}" alt="${escapeHtml(item.ticker)}" class="radar-thumb w-full h-40 object-cover" />
        <div class="text-sm text-slate-300 leading-7">${escapeHtml(item.notes || '')}</div>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="text-sm text-slate-400">${item.pivot ? `Pivot: ${item.pivot}` : 'Theo dõi theo nến tuần'}</div>
          <div class="radar-actions text-sm">
            <button class="link-btn" data-action="view-radar" data-image="${item.image || assets.fallbackRadar}">Xem chart</button>
            <button class="link-btn" data-action="edit-radar" data-id="${item.id}">Sửa</button>
            <button class="link-btn danger" data-action="delete-radar" data-id="${item.id}">Xóa</button>
            ${type !== 'nearBuy' ? `<button class="link-btn" data-action="move-radar" data-id="${item.id}" data-type="nearBuy">Chuyển gần mua</button>` : ''}
            ${type !== 'watch' ? `<button class="link-btn" data-action="move-radar" data-id="${item.id}" data-type="watch">Chuyển theo dõi</button>` : ''}
            ${type !== 'longTerm' ? `<button class="link-btn" data-action="move-radar" data-id="${item.id}" data-type="longTerm">Chuyển dài hạn</button>` : ''}
          </div>
        </div>
      </div>
    `).join('') || '<div class="text-slate-400">Chưa có mã.</div>';
  });
}

export function openRadarModal(id = null, forcedType = null) {
  const data = getData();
  const form = document.getElementById('radar-form');
  form.reset();
  fillSetupOptions(form.querySelector('select[name="setup"]'), data.patterns);
  document.getElementById('radar-modal-title').textContent = id ? 'Sửa mã Radar' : 'Thêm mã Radar';

  if (id) {
    const item = data.radar.find(r => r.id === id);
    if (!item) return;
    Object.keys(item).forEach(key => {
      if (form.elements[key]) form.elements[key].value = item[key];
    });
  } else {
    form.elements.id.value = '';
    form.elements.type.value = forcedType || 'watch';
  }
  openModal('radar-modal');
}

export function deleteRadar(id, renderApp) {
  if (!confirm('Xóa mã radar này?')) return;
  const data = getData();
  data.radar = data.radar.filter(r => r.id !== id);
  saveData(data);
  renderApp();
}

export function moveRadar(id, type, renderApp) {
  const data = getData();
  const item = data.radar.find(r => r.id === id);
  if (!item) return;
  item.type = type;
  item.status = type === 'longTerm' ? 'Chờ nến tuần' : type === 'nearBuy' ? 'Sẵn sàng' : 'Đang theo dõi';
  saveData(data);
  renderApp();
}

export function bindRadarEvents(renderApp, showImage) {
  document.querySelectorAll('.radar-new').forEach(btn => {
    btn.addEventListener('click', () => openRadarModal(null, btn.dataset.type));
  });

  ['nearBuy', 'watch', 'longTerm'].forEach(type => {
    document.getElementById(`radar-${type}`).addEventListener('click', event => {
      const btn = event.target.closest('[data-action]');
      if (!btn) return;
      const { action, id, image, type: nextType } = btn.dataset;
      if (action === 'view-radar') showImage(image);
      if (action === 'edit-radar') openRadarModal(id);
      if (action === 'delete-radar') deleteRadar(id, renderApp);
      if (action === 'move-radar') moveRadar(id, nextType, renderApp);
    });
  });

  document.getElementById('radar-form').addEventListener('submit', async event => {
    event.preventDefault();
    const data = getData();
    const fd = new FormData(event.target);
    const id = fd.get('id') || uid();
    const existing = data.radar.find(r => r.id === id);
    const file = event.target.elements.image.files[0];
    const image = file ? await fileToDataUrl(file) : (existing?.image || assets.fallbackRadar);
    const item = {
      id,
      type: fd.get('type') || 'watch',
      ticker: String(fd.get('ticker')).toUpperCase().trim(),
      setup: fd.get('setup'),
      status: fd.get('status'),
      score: Number(fd.get('score')),
      pivot: Number(fd.get('pivot') || 0),
      notes: String(fd.get('notes') || ''),
      image
    };
    const index = data.radar.findIndex(r => r.id === id);
    if (index >= 0) data.radar[index] = item;
    else data.radar.push(item);
    saveData(data);
    closeModal('radar-modal');
    renderApp();
  });
}