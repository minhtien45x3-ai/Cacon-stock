import { getData, saveData } from '../core/storage.js';
import { currency, escapeHtml } from '../core/utils.js';
import { fillSetupOptions, openModal, closeModal } from '../core/dom.js';

export function renderJournal(data, stats) {
  const filterEl = document.getElementById('journal-filter-setup');
  const previousFilter = filterEl.value || 'all';
  fillSetupOptions(filterEl, data.patterns, true);
  filterEl.value = Array.from(filterEl.options).some(o => o.value === previousFilter) ? previousFilter : 'all';
  const selected = filterEl.value;

  const trades = stats.trades
    .slice()
    .sort((a,b) => b.date.localeCompare(a.date))
    .filter(t => selected === 'all' || t.setup === selected);

  const body = document.getElementById('journal-body');
  body.innerHTML = trades.map(t => `
    <tr>
      <td>${t.date}</td>
      <td class="font-black text-white">${escapeHtml(t.ticker)}</td>
      <td>${escapeHtml(t.setup)}</td>
      <td class="text-right">${t.buy}</td>
      <td class="text-right">${t.sell}</td>
      <td class="text-right">${Number(t.qty).toLocaleString('vi-VN')}</td>
      <td class="text-right">${Number(t.rMultiple).toFixed(1)}</td>
      <td class="text-right ${t.pnl >= 0 ? 'trade-pnl-pos' : 'trade-pnl-neg'}">${currency(t.pnl)}</td>
      <td class="text-right">
        <button class="link-btn" data-action="edit-trade" data-id="${t.id}">Sửa</button>
        <button class="link-btn danger ml-2" data-action="delete-trade" data-id="${t.id}">Xóa</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="9" class="py-6 text-center text-slate-400">Chưa có giao dịch.</td></tr>';

  const latest = trades[0] || stats.trades.slice().sort((a,b) => b.date.localeCompare(a.date))[0];
  document.getElementById('journal-side').innerHTML = latest ? `
    <div class="space-y-4">
      <div class="subpanel p-4">
        <div class="text-sm text-slate-400">Mã</div>
        <div class="text-3xl font-black text-white">${escapeHtml(latest.ticker)}</div>
        <div class="mt-2 badge ${latest.pnl >= 0 ? 'badge-green' : 'badge-rose'}">${escapeHtml(latest.setup)}</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="stat-chip"><div class="text-slate-400 text-sm">Ngày</div><div class="text-white font-black mt-1">${latest.date}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">PnL</div><div class="${latest.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-black mt-1">${currency(latest.pnl)}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">R</div><div class="text-white font-black mt-1">${Number(latest.rMultiple).toFixed(1)}</div></div>
        <div class="stat-chip"><div class="text-slate-400 text-sm">Biên lợi nhuận</div><div class="text-white font-black mt-1">${latest.percent.toFixed(1)}%</div></div>
      </div>
      <div class="subpanel p-4">
        <div class="text-slate-400 text-sm">Ghi chú</div>
        <div class="text-white mt-2 leading-7">${escapeHtml(latest.notes || 'Không có ghi chú')}</div>
      </div>
    </div>
  ` : '<div class="text-slate-400">Chưa có dữ liệu nhật ký.</div>';
}

export function openTradeModal(id = null) {
  const data = getData();
  const form = document.getElementById('trade-form');
  form.reset();
  fillSetupOptions(form.querySelector('select[name="setup"]'), data.patterns);
  document.getElementById('trade-modal-title').textContent = id ? 'Sửa lệnh' : 'Thêm lệnh';

  if (id) {
    const trade = data.trades.find(t => t.id === id);
    if (!trade) return;
    Object.keys(trade).forEach(key => {
      if (form.elements[key]) form.elements[key].value = trade[key];
    });
  } else {
    form.elements.id.value = '';
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }
  openModal('trade-modal');
}

export function deleteTrade(id, renderApp) {
  if (!confirm('Xóa lệnh này?')) return;
  const data = getData();
  data.trades = data.trades.filter(t => t.id !== id);
  saveData(data);
  renderApp();
}

export function bindJournalEvents(renderApp) {
  document.getElementById('journal-filter-setup').addEventListener('change', renderApp);
  document.getElementById('new-trade-btn').addEventListener('click', () => openTradeModal());

  document.getElementById('journal-body').addEventListener('click', event => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit-trade') openTradeModal(id);
    if (action === 'delete-trade') deleteTrade(id, renderApp);
  });

  document.getElementById('trade-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = getData();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    const trade = {
      id: payload.id || Math.random().toString(36).slice(2, 10),
      date: payload.date,
      ticker: payload.ticker.toUpperCase().trim(),
      setup: payload.setup,
      buy: Number(payload.buy),
      sell: Number(payload.sell),
      qty: Number(payload.qty),
      rMultiple: Number(payload.rMultiple),
      notes: payload.notes || ''
    };
    const index = data.trades.findIndex(t => t.id === trade.id);
    if (index >= 0) data.trades[index] = trade;
    else data.trades.push(trade);
    saveData(data);
    closeModal('trade-modal');
    renderApp();
  });
}