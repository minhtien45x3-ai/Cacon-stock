export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function currency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} đ`;
}

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

export function fileToDataUrl(file) {
  if (!file) return Promise.resolve(null);
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}