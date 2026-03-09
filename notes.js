import { getData, saveData } from '../core/storage.js';

export function renderNotes(data) {
  document.getElementById('mindset-notes').value = data.notes.mindset || '';
  document.getElementById('library-notes').value = data.notes.library || '';
}

export function bindNotesEvents() {
  document.getElementById('mindset-notes').addEventListener('change', e => {
    const data = getData();
    data.notes.mindset = e.target.value;
    saveData(data);
  });
  document.getElementById('library-notes').addEventListener('change', e => {
    const data = getData();
    data.notes.library = e.target.value;
    saveData(data);
  });
}