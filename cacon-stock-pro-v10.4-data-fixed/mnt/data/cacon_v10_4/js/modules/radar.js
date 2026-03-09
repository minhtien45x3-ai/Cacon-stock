import { updateState } from '../core/state.js';
import { uid } from '../core/utils.js';

let editing = { group: null, id: null };
const groupLabels = {
  nearBuy: 'Cổ phiếu gần điểm mua theo mẫu hình',
  watchlist: 'Cổ phiếu theo dõi',
  longTerm: 'Cổ phiếu dài hạn - mua tại nến tuần'
};

export function renderRadar(state) {
  const current = editing.id ? state.radar[editing.group].find(x => x.id === editing.id) : null;
  return `
    <section class="panel" style="margin-bottom:20px">
      <div class="section-title">Radar</div>
      <h2 class="big-title">Thêm / sửa / xóa mã và chuyển giữa 3 mô-đun</h2>
      <div class="form-grid-5">
        <input id="radar-ticker" class="input" placeholder="Mã CP" value="${current?.ticker || 'SSI'}" />
        <input id="radar-setup" class="input" placeholder="Setup" value="${current?.setup || 'VCP'}" />
        <input id="radar-status" class="input" placeholder="Trạng thái" value="${current?.status || 'Cách pivot 1.8%'}" />
        <select id="radar-group" class="compact-select">${Object.entries(groupLabels).map(([k,v]) => `<option value="${k}" ${(current?editing.group:'nearBuy')===k?'selected':''}>${v}</option>`).join('')}</select>
        <label class="ui-btn" for="radar-image-file">Up chart</label>
        <input id="radar-image-file" type="file" accept="image/*" hidden />
      </div>
      <textarea id="radar-note" class="input" placeholder="Ghi chú">${current?.note || 'Theo dõi nền và volume.'}</textarea>
      <div class="actions" style="margin-top:12px">
        <button id="save-radar" class="ui-btn ui-btn-green">${current ? 'Cập nhật mã' : 'Thêm mã mới'}</button>
        <button id="reset-radar" class="ui-btn">Làm mới form</button>
      </div>
      <div id="radar-upload-name" class="small" style="margin-top:8px">${current?.image?.startsWith('data:') ? 'Đang dùng ảnh đã tải lên' : 'Đang dùng ảnh mặc định'}</div>
    </section>

    <section class="radar-grid-3">
      ${Object.entries(groupLabels).map(([group, title]) => `
        <div class="panel radar-col">
          <div>
            <div class="section-title">Radar</div>
            <h2 class="big-title">${title}</h2>
          </div>
          ${state.radar[group].map(item => `
            <div class="card-mini">
              <div class="head-inline"><strong>${item.ticker}</strong><span class="small">${item.setup}</span></div>
              <div class="small" style="margin:6px 0">${item.status}</div>
              <div class="small">${item.note}</div>
              <img class="pattern-image" style="height:160px;margin-top:12px" src="${item.image}" alt="${item.ticker}" data-popup="${item.image}" />
              <div class="row-actions wrap" style="margin-top:12px">
                <button class="tiny-btn" data-edit-radar="${group}|${item.id}">Sửa</button>
                <button class="tiny-btn danger" data-del-radar="${group}|${item.id}">Xóa</button>
                ${group !== 'nearBuy' ? `<button class="tiny-btn" data-move-radar="${group}|${item.id}|nearBuy">→ Gần điểm mua</button>` : ''}
                ${group !== 'watchlist' ? `<button class="tiny-btn" data-move-radar="${group}|${item.id}|watchlist">→ Theo dõi</button>` : ''}
                ${group !== 'longTerm' ? `<button class="tiny-btn" data-move-radar="${group}|${item.id}|longTerm">→ Dài hạn</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </section>
  `;
}

export function bindRadar(onChange, state) {
  let uploadedImage = null;

  document.getElementById('radar-image-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    uploadedImage = await fileToDataUrl(file);
    document.getElementById('radar-upload-name').textContent = `Đã chọn ảnh: ${file.name}`;
  });

  document.getElementById('save-radar')?.addEventListener('click', () => {
    const payload = {
      ticker: document.getElementById('radar-ticker').value.toUpperCase(),
      setup: document.getElementById('radar-setup').value.trim(),
      status: document.getElementById('radar-status').value.trim(),
      note: document.getElementById('radar-note').value.trim(),
      image: uploadedImage || currentImage(state) || 'assets/images/radar.png',
      weekly: document.getElementById('radar-group').value === 'longTerm'
    };
    const targetGroup = document.getElementById('radar-group').value;
    updateState(s => {
      if (editing.id) {
        const oldList = s.radar[editing.group];
        const idx = oldList.findIndex(x => x.id === editing.id);
        if (idx >= 0) {
          const item = { ...oldList[idx], ...payload };
          oldList.splice(idx, 1);
          s.radar[targetGroup].unshift(item);
        }
      } else {
        s.radar[targetGroup].unshift({ id: uid(), ...payload });
      }
    });
    editing = { group: null, id: null };
    onChange();
  });

  document.getElementById('reset-radar')?.addEventListener('click', () => {
    editing = { group: null, id: null };
    onChange();
  });

  document.querySelectorAll('[data-edit-radar]').forEach(btn => btn.addEventListener('click', () => {
    const [group, id] = btn.dataset.editRadar.split('|');
    editing = { group, id: Number(id) };
    onChange();
  }));

  document.querySelectorAll('[data-del-radar]').forEach(btn => btn.addEventListener('click', () => {
    const [group, id] = btn.dataset.delRadar.split('|');
    updateState(s => { s.radar[group] = s.radar[group].filter(x => x.id !== Number(id)); });
    if (editing.group === group && editing.id === Number(id)) editing = { group: null, id: null };
    onChange();
  }));

  document.querySelectorAll('[data-move-radar]').forEach(btn => btn.addEventListener('click', () => {
    const [from, id, to] = btn.dataset.moveRadar.split('|');
    updateState(s => {
      const idx = s.radar[from].findIndex(x => x.id === Number(id));
      if (idx >= 0) {
        const [item] = s.radar[from].splice(idx, 1);
        item.weekly = to === 'longTerm';
        s.radar[to].unshift(item);
      }
    });
    onChange();
  }));

  document.querySelectorAll('[data-popup]').forEach(img => img.addEventListener('click', () => openImagePopup(img.dataset.popup)));
}

function currentImage(state) {
  if (!editing.id) return null;
  return state.radar[editing.group].find(x => x.id === editing.id)?.image || null;
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
