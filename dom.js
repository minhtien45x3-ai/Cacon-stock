import { escapeHtml } from './utils.js';

export function fillSetupOptions(selectEl, patterns, includeAll = false) {
  const options = patterns.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
  selectEl.innerHTML = (includeAll ? '<option value="all">Tất cả setup</option>' : '') + options;
}

export function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

export function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

export function initModalClosers() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
}

export function showImage(src) {
  document.getElementById('viewer-image').src = src;
  openModal('image-viewer');
}