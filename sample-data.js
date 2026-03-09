export const sampleData = {
  market: { distributionDays: 3 },
  analysis: { selectedPatternId: 'vcp', currentChart: 'assets/images/phan_tich.png' },
  journal: [
    { id: 1, date: '2026-03-01', ticker: 'FPT', setup: 'VCP', buy: 127.5, sell: 138.2, qty: 1000, r: 2.1, pnl: 10700, note: 'Breakout nền chặt với volume tăng.' },
    { id: 2, date: '2026-02-17', ticker: 'DGC', setup: 'Cup with Handle', buy: 121, sell: 133.8, qty: 900, r: 2, pnl: 11520, note: 'Tay cầm ngắn, RS tăng.' },
    { id: 3, date: '2026-02-03', ticker: 'CTD', setup: 'VCP', buy: 92.4, sell: 101.5, qty: 800, r: 2.4, pnl: 7280, note: 'Siết nền tốt, breakout đẹp.' },
    { id: 4, date: '2026-01-21', ticker: 'MWG', setup: '3C', buy: 68.2, sell: 65, qty: 1500, r: -1.2, pnl: -4800, note: 'Vào sớm trước pivot.' }
  ],
  patterns: [
    {
      id: 'vcp', name: 'VCP',
      conditions: [
        'Xu hướng trước đó tăng rõ',
        'Biên độ co hẹp dần',
        'Khối lượng giảm dần khi siết nền',
        'Breakout cùng volume tăng mạnh',
        'RS gần đỉnh mới'
      ],
      image: 'assets/images/mau_hinh.png'
    },
    {
      id: 'cwh', name: 'Cup with Handle',
      conditions: [
        'Nền cốc tối thiểu 7 tuần',
        'Tay cầm ngắn, khô vol',
        'Đỉnh phải tiệm cận đỉnh trái',
        'Điểm mua tại pivot tay cầm',
        'Tránh tay cầm quá sâu'
      ],
      image: 'assets/images/mau_hinh.png'
    },
    {
      id: '3c', name: '3C',
      conditions: [
        'Cú tăng trước đó mạnh và rõ',
        'Co hẹp - cạn cung - cất cánh',
        'Nền ngắn, thanh khoản thu hẹp',
        'Điểm mua khi vượt đỉnh gần nhất'
      ],
      image: 'assets/images/mau_hinh.png'
    }
  ],
  radar: {
    nearBuy: [
      { id: 1, ticker: 'VCI', setup: 'VCP', status: 'Cách pivot 2.1%', weekly: false, note: 'Canh breakout 38.5', image: 'assets/images/radar.png' },
      { id: 2, ticker: 'CTR', setup: '3C', status: 'Cách pivot 1.4%', weekly: false, note: 'Siết biên hẹp 8 phiên', image: 'assets/images/radar.png' }
    ],
    watchlist: [
      { id: 3, ticker: 'HPG', setup: 'Nền giá phẳng', status: 'Theo dõi KQKD', weekly: false, note: 'Đợi vol xác nhận', image: 'assets/images/radar.png' }
    ],
    longTerm: [
      { id: 4, ticker: 'FPT', setup: 'Dài hạn nến tuần', status: 'Giữ trên MA10 tuần', weekly: true, note: 'Mua khi nến tuần xác nhận', image: 'assets/images/radar.png' }
    ]
  },
  psychology: [
    { id: 1, date: '2026-03-05', mood: 'Bình tĩnh', note: 'Tuân thủ điểm mua, không FOMO.' }
  ],
  library: [
    { id: 1, title: 'Nguyên tắc chọn cổ phiếu dẫn dắt', content: 'EPS tăng, doanh thu tăng, nền giá chặt, thanh khoản cao.' }
  ]
};
