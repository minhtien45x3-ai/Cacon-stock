import { sampleData } from '../data/sample-data.js';
const KEY = 'cacon-stock-v10.2';

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return structuredClone(sampleData);
  try { return JSON.parse(raw); } catch { return structuredClone(sampleData); }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function seedSampleData() {
  const cloned = structuredClone(sampleData);
  saveState(cloned);
  return cloned;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cacon-stock-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importState(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  saveState(parsed);
  return parsed;
}
