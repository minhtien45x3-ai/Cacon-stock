import { money, uid } from '../core/utils.js';
import { updateState, state } from '../core/state.js';

export function renderJournal(currentState) {
  const setups = [...new Set(currentState.patterns.map(p => p.name))];
  const latest = currentState.journal[0];
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Nhật ký giao dịch</div>
        <h2 class="big-title">Ví dụ mẫu đã liên kết với Dashboard</h2>
        <div class="form-row">
          <input id="trade-date" class="input" type="date" value="2026-03-08" />
          <input id="trade-ticker" class="input" placeholder="Mã CP" value="VCI" />
          <select id="trade-setup">${setups.map(s => `<option>${s}</option>`).join('')}</select>
          <input id="trade-pnl" class="input" type="number" value="6500" placeholder="PnL" />
        </div>
        <div class="actions"><button id="add-trade" class="ui-btn ui-btn-green">Thêm ví dụ lệnh</button></div>
        <div class="table-wrap" style="margin-top:16px">
          <table>
            <thead><tr><th>Ngày</th><th>Mã</th><th>Setup</th><th>PnL</th><th>Ghi chú</th></tr></thead>
            <tbody>
              ${currentState.journal.map(t => `<tr><td>${t.date}</td><td><strong>${t.ticker}</strong></td><td>${t.setup}</td><td class="${t.pnl >= 0 ? 'success' : 'loss'}">${money(t.pnl)}</td><td>${t.note || ''}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="section-title">Lệnh gần nhất</div>
        <h2 class="big-title">Khung bên phải đã có dữ liệu</h2>
        ${latest ? `<div class="card-mini"><div class="small">Mã</div><div class="value" style="font-size:34px;font-weight:900">${latest.ticker}</div><div class="small">Setup: ${latest.setup}</div><div class="small">PnL: ${money(latest.pnl)}</div><div class="small">Ghi chú: ${latest.note}</div></div>` : ''}
        <img class="module-image" style="margin-top:16px" src="assets/images/nhat_ky.png" alt="Nhật ký" />
        <div class="link-note">journal.js lưu lệnh mới vào storage.js, sau đó dashboard.js và analysis.js đều đọc lại dữ liệu này.</div>
      </div>
    </section>
  `;
}

export function bindJournal(onChange) {
  document.getElementById('add-trade')?.addEventListener('click', () => {
    const trade = {
      id: uid(),
      date: document.getElementById('trade-date').value,
      ticker: document.getElementById('trade-ticker').value.toUpperCase(),
      setup: document.getElementById('trade-setup').value,
      pnl: Number(document.getElementById('trade-pnl').value || 0),
      note: 'Ví dụ thêm nhanh để kiểm tra liên kết module.'
    };
    updateState(s => { s.journal.unshift(trade); });
    onChange();
  });
}
