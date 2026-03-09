import { getData, saveData } from '../core/storage.js';

export function bindMarketEvents(renderApp) {
  document.getElementById('save-market-btn').addEventListener('click', () => {
    const data = getData();
    data.market.distDays = Number(document.getElementById('dist-days-input').value || 0);
    saveData(data);
    renderApp();
  });
}