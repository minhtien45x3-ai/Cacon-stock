import { state } from './core/state.js';
import { seedSampleData, exportState, importState } from './core/storage.js';
import { renderDashboard, mountDashboard } from './modules/dashboard.js';
import { renderMarket, bindMarket } from './modules/market.js';
import { renderJournal, bindJournal } from './modules/journal.js';
import { renderAnalysis, bindAnalysis } from './modules/analysis.js';
import { renderPatterns, bindPatterns } from './modules/patterns.js';
import { renderRadar, bindRadar } from './modules/radar.js';
import { renderNotes, bindNotes } from './modules/notes.js';

const tabs = [
  { id: 'dashboard', label: 'Tổng quan', render: renderDashboard, bind: mountDashboard },
  { id: 'market', label: 'Thị trường', render: renderMarket, bind: bindMarket },
  { id: 'journal', label: 'Nhật ký', render: renderJournal, bind: bindJournal },
  { id: 'analysis', label: 'Phân tích', render: renderAnalysis, bind: bindAnalysis },
  { id: 'patterns', label: 'Mẫu hình', render: renderPatterns, bind: bindPatterns },
  { id: 'radar', label: 'Radar', render: renderRadar, bind: bindRadar },
  { id: 'notes', label: 'Tâm lý & Thư viện', render: renderNotes, bind: bindNotes }
];

let activeTab = localStorage.getItem('cacon-active-tab') || 'dashboard';

function renderTabs() {
  const root = document.getElementById('tabs');
  root.innerHTML = tabs.map(t => `<button class="tab-btn ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('');
  root.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    localStorage.setItem('cacon-active-tab', activeTab);
    renderApp();
  }));
}

function renderApp() {
  renderTabs();
  const current = tabs.find(t => t.id === activeTab) || tabs[0];
  document.getElementById('app').innerHTML = current.render(state);
  current.bind?.(renderApp, state);
}

document.getElementById('seed-btn').addEventListener('click', () => {
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, seedSampleData());
  renderApp();
});
document.getElementById('export-btn').addEventListener('click', () => exportState(state));
document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const imported = await importState(file);
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, imported);
  renderApp();
});

renderApp();
