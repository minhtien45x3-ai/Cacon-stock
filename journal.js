import { money, uid } from '../core/utils.js';
import { updateState } from '../core/state.js';

let editingId = null;
let filterSetup = 'ALL';

function calcTrade({ buy, sell, qty }) {
  const pnl = (Number(sell || 0) - Number(buy || 0)) * Number(qty || 0);
  const risk = Math.max(Number(buy || 0) * 0.07 * Number(qty || 0), 1);
  const r = pnl / risk;
  return { pnl: Math.round(pnl), r: Number(r.toFixed(2)) };
}

export function renderJournal(currentState) {
  const setups = [...new Set(currentState.patterns.map(p => p.name))];
  const filtered = filterSetup === 'ALL' ? currentState.journal : currentState.journal.filter(t => t.setup === filterSetup);
  const latest = currentState.journal[0];
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Nhật ký giao dịch</div>
        <h2 class="big-title">Thêm / sửa / xóa lệnh và lọc theo setup</h2>
        <div class="form-grid-6">
          <input id="trade-date" class="input" type="date" value="2026-03-08" />
          <input id="trade-ticker" class="input" placeholder="Mã CP" value="VCI" />
          <select id="trade-setup">${setups.map(s => `<option>${s}</option>`).join('')}</select>
          <input id="trade-buy" class="input" type="number" step="0.1" value="35.2" placeholder="Điểm mua" />
          <input id="trade-sell" class="input" type="number" step="0.1" value="37.4" placeholder="Điểm bán" />
          <input id="trade-qty" class="input" type="number" value="1000" placeholder="KL" />
        </div>
        <textarea id="trade-note" class="input" placeholder="Ghi chú lệnh">Ví dụ lệnh mới để kiểm tra liên kết với Dashboard và Phân tích.</textarea>
        <div class="actions" style="margin-top:12px">
          <button id="save-trade" class="ui-btn ui-btn-green">Lưu lệnh</button>
          <button id="reset-trade" class="ui-btn">Làm mới form</button>
          <select id="filter-setup" class="compact-select"><option value="ALL">Tất cả setup</option>${setups.map(s => `<option ${filterSetup===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="table-wrap" style="margin-top:16px">
          <table>
            <thead><tr><th>Ngày</th><th>Mã</th><th>Setup</th><th>Mua</th><th>Bán</th><th>KL</th><th>R</th><th>PnL</th><th>Thao tác</th></tr></thead>
            <tbody>
              ${filtered.map(t => `<tr>
                <td>${t.date}</td>
                <td><strong>${t.ticker}</strong></td>
                <td>${t.setup}</td>
                <td>${t.buy ?? ''}</td>
                <td>${t.sell ?? ''}</td>
                <td>${t.qty ?? ''}</td>
                <td class="${t.r >= 0 ? 'success' : 'loss'}">${t.r ?? ''}</td>
                <td class="${t.pnl >= 0 ? 'success' : 'loss'}">${money(t.pnl)}</td>
                <td>
                  <div class="row-actions">
                    <button class="tiny-btn" data-edit="${t.id}">Sửa</button>
                    <button class="tiny-btn danger" data-del="${t.id}">Xóa</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="section-title">Lệnh gần nhất</div>
        <h2 class="big-title">Khung bên phải luôn có dữ liệu</h2>
        ${latest ? `<div class="card-mini">
          <div class="small">Mã</div><div class="value" style="font-size:34px;font-weight:900">${latest.ticker}</div>
          <div class="small">Setup: ${latest.setup}</div>
          <div class="small">PnL: ${money(latest.pnl)}</div>
          <div class="small">R: ${latest.r}</div>
          <div class="small">Ghi chú: ${latest.note}</div>
        </div>` : ''}
        <img class="module-image" style="margin-top:16px" src="assets/images/nhat_ky.png" alt="Nhật ký" />
        <div class="link-note">journal.js lưu lệnh vào state + storage. dashboard.js và analysis.js đọc lại cùng dữ liệu nên KPI đổi ngay.</div>
      </div>
    </section>
  `;
}

export function bindJournal(onChange, state) {
  document.getElementById('save-trade')?.addEventListener('click', () => {
    const payload = {
      date: document.getElementById('trade-date').value,
      ticker: document.getElementById('trade-ticker').value.toUpperCase(),
      setup: document.getElementById('trade-setup').value,
      buy: Number(document.getElementById('trade-buy').value || 0),
      sell: Number(document.getElementById('trade-sell').value || 0),
      qty: Number(document.getElementById('trade-qty').value || 0),
      note: document.getElementById('trade-note').value.trim()
    };
    const computed = calcTrade(payload);
    updateState(s => {
      if (editingId) {
        const idx = s.journal.findIndex(t => t.id === editingId);
        if (idx >= 0) s.journal[idx] = { ...s.journal[idx], ...payload, ...computed };
      } else {
        s.journal.unshift({ id: uid(), ...payload, ...computed });
      }
    });
    editingId = null;
    onChange();
  });

  document.getElementById('reset-trade')?.addEventListener('click', () => {
    editingId = null;
    onChange();
  });

  document.getElementById('filter-setup')?.addEventListener('change', e => {
    filterSetup = e.target.value;
    onChange();
  });

  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const trade = state.journal.find(t => String(t.id) === btn.dataset.edit);
    if (!trade) return;
    editingId = trade.id;
    document.getElementById('trade-date').value = trade.date;
    document.getElementById('trade-ticker').value = trade.ticker;
    document.getElementById('trade-setup').value = trade.setup;
    document.getElementById('trade-buy').value = trade.buy ?? 0;
    document.getElementById('trade-sell').value = trade.sell ?? 0;
    document.getElementById('trade-qty').value = trade.qty ?? 0;
    document.getElementById('trade-note').value = trade.note ?? '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    const id = Number(btn.dataset.del);
    updateState(s => { s.journal = s.journal.filter(t => t.id !== id); });
    if (editingId === id) editingId = null;
    onChange();
  }));
}
