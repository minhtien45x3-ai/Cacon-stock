import { uid, deepClone } from './utils.js';

export const STORAGE_KEY = 'cacon-stock-v10';
export const INITIAL_CAPITAL = 500000000;
export const assets = {
  fallbackPattern: 'assets/mau-hinh.png',
  fallbackAnalysis: 'assets/phan-tich.png',
  fallbackRadar: 'assets/radar.png'
};

export const sampleData = {
  market: { distDays: 2 },
  notes: {
    mindset: 'Giữ nguyên tắc cắt lỗ nhanh. Không mua đuổi khi cổ phiếu cách pivot quá xa. Chỉ nâng tỷ trọng khi thị trường xác nhận.',
    library: 'Minervini: ưu tiên cổ phiếu tăng trưởng mạnh, doanh thu - lợi nhuận cải thiện, RS cao và nền giá chặt. Kết hợp liên thị trường để xác nhận nhóm dẫn dắt.'
  },
  patterns: [
    {
      id: uid(),
      name: 'VCP',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Xu hướng trước đó tăng rõ',
        'Biên độ co hẹp dần',
        'Khối lượng giảm dần khi siết nền',
        'Breakout cùng volume tăng mạnh',
        'RS gần đỉnh mới'
      ]
    },
    {
      id: uid(),
      name: 'Cup with Handle',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Nền cốc tối thiểu 7 tuần',
        'Tay cầm ngắn, khối lượng khô',
        'Đỉnh phải tiệm cận đỉnh trái',
        'Điểm mua tại pivot tay cầm',
        'Không mua khi tay cầm quá sâu'
      ]
    },
    {
      id: uid(),
      name: '3C',
      image: 'assets/mau-hinh.png',
      conditions: [
        'Cú co thứ 3 chặt hơn 2 cú đầu',
        'Volume cạn dần',
        'Giá giữ EMA 10/20',
        'Break khỏi vùng nén cuối',
        'Thị trường chung ủng hộ'
      ]
    }
  ],
  trades: [
    { id: uid(), date: '2026-01-07', ticker: 'FPT', setup: 'VCP', buy: 127.5, sell: 138.2, qty: 1000, rMultiple: 2.1, notes: 'Nền siết chặt, breakout vol lớn.' },
    { id: uid(), date: '2026-01-21', ticker: 'MWG', setup: '3C', buy: 68.2, sell: 65.0, qty: 1500, rMultiple: -1.2, notes: 'Mua sớm khi thị trường chưa đồng thuận.' },
    { id: uid(), date: '2026-02-03', ticker: 'CTD', setup: 'VCP', buy: 92.4, sell: 101.5, qty: 800, rMultiple: 2.4, notes: 'Nền đẹp 6 tuần, RS vượt trội.' },
    { id: uid(), date: '2026-02-17', ticker: 'DGC', setup: 'Cup with Handle', buy: 121.0, sell: 133.8, qty: 900, rMultiple: 2.0, notes: 'Tay cầm cạn vol, nhóm ngành mạnh.' },
    { id: uid(), date: '2026-03-02', ticker: 'HPG', setup: 'VCP', buy: 31.6, sell: 33.9, qty: 4000, rMultiple: 1.6, notes: 'RS cải thiện, nền thứ hai.' }
  ],
  analysis: {
    selectedPatternId: null,
    currentImage: 'assets/phan-tich.png',
    checklistState: {}
  },
  radar: [
    { id: uid(), type: 'nearBuy', ticker: 'VCI', setup: 'VCP', status: 'Sẵn sàng', score: 84, pivot: 42.5, notes: 'Siết 5 tuần, chờ vượt pivot với vol tăng.', image: 'assets/radar.png' },
    { id: uid(), type: 'nearBuy', ticker: 'KDH', setup: 'Cup with Handle', status: 'Đang theo dõi', score: 77, pivot: 39.2, notes: 'Tay cầm ngắn, dòng tiền quay lại BĐS.', image: 'assets/radar.png' },
    { id: uid(), type: 'watch', ticker: 'CTR', setup: '3C', status: 'Đang theo dõi', score: 73, pivot: 116.8, notes: 'Nền giá đẹp nhưng cần thị trường xác nhận thêm.', image: 'assets/radar.png' },
    { id: uid(), type: 'watch', ticker: 'ACB', setup: 'VCP', status: 'Đang theo dõi', score: 69, pivot: 29.4, notes: 'Ngành ngân hàng cải thiện tương đối.', image: 'assets/radar.png' },
    { id: uid(), type: 'longTerm', ticker: 'FPT', setup: 'VCP', status: 'Chờ nến tuần', score: 90, pivot: 0, notes: 'Cổ phiếu dài hạn, ưu tiên mua ở nến tuần xác nhận tiếp diễn xu hướng lớn.', image: 'assets/radar.png' },
    { id: uid(), type: 'longTerm', ticker: 'DGC', setup: 'Cup with Handle', status: 'Chờ nến tuần', score: 88, pivot: 0, notes: 'Giữ theo khung tuần, chỉ gia tăng khi có nến tuần xác nhận.', image: 'assets/radar.png' }
  ]
};

export function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = deepClone(sampleData);
    data.analysis.selectedPatternId = data.patterns[0]?.id || null;
    saveData(data);
    return data;
  }
  const data = JSON.parse(raw);
  if (!data.analysis) data.analysis = deepClone(sampleData.analysis);
  if (!data.notes) data.notes = deepClone(sampleData.notes);
  if (!data.market) data.market = { distDays: 0 };
  if (!data.patterns) data.patterns = [];
  if (!data.trades) data.trades = [];
  if (!data.radar) data.radar = [];
  if (!data.analysis.selectedPatternId && data.patterns[0]) data.analysis.selectedPatternId = data.patterns[0].id;
  return data;
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetToSample() {
  const data = deepClone(sampleData);
  data.analysis.selectedPatternId = data.patterns[0]?.id || null;
  saveData(data);
}