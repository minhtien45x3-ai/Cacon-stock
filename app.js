
function bindTabEvents() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const activate = (tab) => {
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    panes.forEach(pane => pane.classList.toggle('active', pane.id === `tab-${tab}`));
    localStorage.setItem('cacon-active-tab', tab);
  };
  buttons.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tab)));
  activate(localStorage.getItem('cacon-active-tab') || 'dashboard');
}
import { getData, saveData, resetToSample } from './core/storage.js';
import { initModalClosers, showImage } from './core/dom.js';
import { renderMarquee, renderMetrics, renderEquityChart, renderSetupRanking, renderMonthStats, getStats } from './modules/dashboard.js';
import { renderJournal, bindJournalEvents, openTradeModal } from './modules/journal.js';
import { renderPatternList, bindPatternEvents, openPatternModal } from './modules/patterns.js';
import { renderAnalysis, bindAnalysisEvents } from './modules/analysis.js';
import { renderRadar, bindRadarEvents, openRadarModal } from './modules/radar.js';
import { renderNotes, bindNotesEvents } from './modules/notes.js';
import { bindMarketEvents } from './modules/market.js';

function renderApp() {
  const data = getData();
  const stats = getStats(data);
  renderMarquee(data, stats);
  renderMetrics(data, stats);
  renderEquityChart(stats);
  renderSetupRanking(stats);
  renderMonthStats(stats);
  renderJournal(data, stats);
  renderPatternList(data);
  renderAnalysis(data, stats);
  renderRadar(data);
  renderNotes(data);
  lucide.createIcons();
}

function bindGlobalEvents() {
  bindTabEvents();
  initModalClosers();
  bindJournalEvents(renderApp);
  bindPatternEvents(renderApp, showImage);
  bindAnalysisEvents(renderApp);
  bindRadarEvents(renderApp, showImage);
  bindNotesEvents();
  bindMarketEvents(renderApp);

  document.getElementById('seed-btn').addEventListener('click', () => {
    if (!confirm('Ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu?')) return;
    resetToSample();
    renderApp();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cacon-stock-v10-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      saveData(data);
      renderApp();
      alert('Đã nhập dữ liệu thành công.');
    } catch {
      alert('File JSON không hợp lệ.');
    }
    e.target.value = '';
  });
}

window.showImage = showImage;
window.openTradeModal = openTradeModal;
window.openPatternModal = openPatternModal;
window.openRadarModal = openRadarModal;

bindGlobalEvents();
renderApp();