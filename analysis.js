import { assets, getData, saveData } from '../core/storage.js';
import { escapeHtml, fileToDataUrl } from '../core/utils.js';

export function renderAnalysis(data, stats) {
  const select = document.getElementById('analysis-pattern-select');
  select.innerHTML = data.patterns.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  const selected = data.patterns.find(p => p.id === data.analysis.selectedPatternId) || data.patterns[0];
  if (!selected) {
    document.getElementById('analysis-checklist').innerHTML = '<div class="text-slate-400">Chưa có mẫu hình để phân tích.</div>';
    document.getElementById('analysis-stats').innerHTML = '';
    return;
  }
  select.value = selected.id;
  const checklistState = data.analysis.checklistState[selected.id] || {};
  document.getElementById('analysis-pattern-image').src = selected.image || assets.fallbackPattern;
  document.getElementById('analysis-current-image').src = data.analysis.currentImage || assets.fallbackAnalysis;
  document.getElementById('analysis-checklist').innerHTML = selected.conditions.map((condition, idx) => `
    <label class="check-row">
      <input type="checkbox" ${checklistState[idx] ? 'checked' : ''} data-action="toggle-check" data-pattern="${selected.id}" data-index="${idx}" />
      <span class="text-slate-100 leading-7">${escapeHtml(condition)}</span>
    </label>
  `).join('');

  const setupStats = stats.setupRanking.find(s => s.name === selected.name) || { count: 0, winrate: 0 };
  const checkedCount = Object.values(checklistState).filter(Boolean).length;
  document.getElementById('analysis-stats').innerHTML = `
    <div class="stat-chip"><div class="text-slate-400 text-sm">Mẫu đang chọn</div><div class="text-white font-black text-2xl mt-1">${escapeHtml(selected.name)}</div></div>
    <div class="stat-chip"><div class="text-slate-400 text-sm">Số giao dịch</div><div class="text-white font-black text-2xl mt-1">${setupStats.count}</div></div>
    <div class="stat-chip"><div class="text-slate-400 text-sm">Winrate</div><div class="text-emerald-300 font-black text-2xl mt-1">${setupStats.winrate.toFixed(0)}%</div></div>
    <div class="stat-chip"><div class="text-slate-400 text-sm">Checklist đạt</div><div class="text-white font-black text-2xl mt-1">${checkedCount}/${selected.conditions.length}</div></div>
  `;
}

export function toggleAnalysisCheck(patternId, idx, checked, renderApp) {
  const data = getData();
  if (!data.analysis.checklistState[patternId]) data.analysis.checklistState[patternId] = {};
  data.analysis.checklistState[patternId][idx] = checked;
  saveData(data);
  renderApp();
}

export function bindAnalysisEvents(renderApp) {
  document.getElementById('analysis-pattern-select').addEventListener('change', e => {
    const data = getData();
    data.analysis.selectedPatternId = e.target.value;
    saveData(data);
    renderApp();
  });

  document.getElementById('analysis-checklist').addEventListener('change', e => {
    const checkbox = e.target.closest('[data-action="toggle-check"]');
    if (!checkbox) return;
    toggleAnalysisCheck(checkbox.dataset.pattern, checkbox.dataset.index, checkbox.checked, renderApp);
  });

  document.getElementById('analysis-upload').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const data = getData();
    data.analysis.currentImage = await fileToDataUrl(file);
    saveData(data);
    renderApp();
    e.target.value = '';
  });

  document.getElementById('analysis-clear').addEventListener('click', () => {
    const data = getData();
    data.analysis.currentImage = assets.fallbackAnalysis;
    saveData(data);
    renderApp();
  });
}