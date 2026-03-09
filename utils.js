export const money = n => `${Number(n || 0).toLocaleString('vi-VN')} đ`;
export const pct = n => `${Number(n || 0).toFixed(1)}%`;
export const uid = () => Date.now() + Math.floor(Math.random() * 1000);
export function marketRecommendation(days) {
  if (days <= 2) return { text: 'Thị trường bình thường', cls: 'normal' };
  if (days === 3) return { text: 'Có rủi ro, hạ margin', cls: 'warn' };
  if (days === 4) return { text: 'Nguy cơ cao, 50% tiền mặt', cls: 'warn' };
  return { text: 'Rất rủi ro, ưu tiên 100% tiền mặt', cls: 'risk' };
}
export function bestPattern(journal) {
  const map = new Map();
  journal.forEach(t => {
    const item = map.get(t.setup) || { win: 0, total: 0 };
    item.total += 1;
    if (t.pnl > 0) item.win += 1;
    map.set(t.setup, item);
  });
  const ranked = [...map.entries()].map(([name, v]) => ({ name, rate: v.total ? v.win / v.total : 0, total: v.total }));
  ranked.sort((a, b) => b.rate - a.rate || b.total - a.total);
  return ranked[0]?.name || '-';
}
