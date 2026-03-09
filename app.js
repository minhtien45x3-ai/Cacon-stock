window.onload = () => { lucide.createIcons(); initializeStaticUI(); };

let equityChart;
let journalData = [];
let radarData = [];
let lastCurrentAnalysisImage = null;

const defaultPatterns = {
  VCP: [
    'Xu hướng trước đó tăng rõ',
    'Biên độ co hẹp dần qua từng nhịp',
    'Khối lượng giảm dần khi siết nền',
    'Breakout cùng volume tăng mạnh',
    'RS gần đỉnh mới'
  ],
  'Cup with Handle': [
    'Nền cốc tối thiểu 7 tuần',
    'Tay cầm ngắn, khối lượng khô',
    'Đỉnh phải tiệm cận đỉnh trái',
    'Điểm mua tại pivot tay cầm',
    'Ưu tiên cổ phiếu dẫn dắt ngành'
  ],
  '3C': [
    'Tăng mạnh giai đoạn 1',
    'Điều chỉnh nông và có kiểm soát',
    'Siết chặt ở vùng cao',
    'Khối lượng cạn kiệt trước điểm mua',
    'Mua khi phá nền kèm dòng tiền'
  ]
};

const sampleRadar = [
  { ticker: 'FPT', setup: 'VCP', module: 'nearBuy', note: 'Còn cách pivot 2.5%, nền chặt 6 tuần.', timeframe: 'Daily', score: 88, image: 'Radar.png' },
  { ticker: 'DGC', setup: 'Cup with Handle', module: 'watchlist', note: 'Tay cầm đang hoàn thiện, cần thêm volume.', timeframe: 'Daily', score: 75, image: 'Radar.png' },
  { ticker: 'MWG', setup: 'Weekly Trend', module: 'longTerm', note: 'Tích lũy trên MA10 tuần, ưu tiên mua tại nến tuần.', timeframe: 'Weekly', score: 82, image: 'Radar.png' }
];

const sampleTrades = [
  { date: '2026-02-17', ticker: 'DGC', setup: 'Cup with Handle', pnl: 11520, riskR: 2.0, entry: 121, exit: 133.8, qty: 900 },
  { date: '2026-02-03', ticker: 'CTD', setup: 'VCP', pnl: 7280, riskR: 2.4, entry: 92.4, exit: 101.5, qty: 800 },
  { date: '2026-01-21', ticker: 'MWG', setup: '3C', pnl: -4800, riskR: -1.2, entry: 68.2, exit: 65, qty: 1500 },
  { date: '2026-01-07', ticker: 'FPT', setup: 'VCP', pnl: 10700, riskR: 2.1, entry: 127.5, exit: 138.2, qty: 1000 }
];

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('login-modal').classList.add('hidden');
    await checkAdminRole(user.uid);
    loadUserJournal(user.uid);
    loadGlobalMarket();
    loadRadar(user.uid);
  } else {
    document.getElementById('login-modal').classList.remove('hidden');
    renderAll(sampleTrades, sampleRadar);
    applyMarketAdvice(0);
  }
});

function initializeStaticUI() {
  document.getElementById('analysis-upload').addEventListener('change', handleAnalysisImageUpload);
}

async function handleLogin() {
  const e = document.getElementById('login-email').value;
  const p = document.getElementById('login-pass').value;
  try {
    await auth.signInWithEmailAndPassword(e, p);
  } catch (error) {
    alert('Sai tài khoản hoặc chưa kích hoạt Email/Password trên Firebase!');
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + tabId).classList.add('active');
}

function loadUserJournal(uid) {
  db.collection('journal').where('userId', '==', uid).orderBy('date', 'desc').onSnapshot(snap => {
    journalData = snap.empty ? sampleTrades : snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAll(journalData, radarData.length ? radarData : sampleRadar);
  }, () => {
    journalData = sampleTrades;
    renderAll(journalData, radarData.length ? radarData : sampleRadar);
  });
}

function loadRadar(uid) {
  db.collection('radar').where('userId', '==', uid).onSnapshot(snap => {
    radarData = snap.empty ? sampleRadar : snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAll(journalData.length ? journalData : sampleTrades, radarData);
  }, () => {
    radarData = sampleRadar;
    renderAll(journalData.length ? journalData : sampleTrades, radarData);
  });
}

function renderAll(trades, radar) {
  journalData = trades;
  radarData = radar;
  renderJournalTable(trades);
  renderJournalSide(trades);
  renderDashboard(trades);
  renderAnalysis(trades);
  renderRadar(radar);
}

function renderJournalTable(trades) {
  const body = document.getElementById('journal-body');
  body.innerHTML = trades.map(t => `
    <tr class="border-b border-white/5">
      <td class="p-5 font-mono">${t.date || '-'}</td>
      <td class="p-5 font-black text-white">${t.ticker || '-'}</td>
      <td class="p-5">${t.setup || '-'}</td>
      <td class="p-5 text-right font-mono ${Number(t.pnl) >= 0 ? 'text-emerald-400':'text-rose-400'}">${formatMoney(t.pnl || 0)}</td>
    </tr>`).join('');
  const net = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const pnlEl = document.getElementById('journal-pnl-total');
  pnlEl.textContent = formatMoney(net);
  pnlEl.className = `text-2xl font-mono font-black ${net >= 0 ? 'text-emerald-400':'text-rose-400'}`;
}

function renderJournalSide(trades) {
  const latest = [...trades].sort((a,b) => String(b.date).localeCompare(String(a.date)))[0];
  const side = document.getElementById('journal-side-card');
  if (!latest) {
    side.innerHTML = '<div class="empty-state">Chưa có dữ liệu giao dịch.</div>';
    return;
  }
  side.innerHTML = `
    <div class="grid grid-cols-2 gap-3">
      <div class="mini-stat"><div>${latest.ticker || '-'}</div><span>Mã</span></div>
      <div class="mini-stat"><div>${latest.setup || '-'}</div><span>Setup</span></div>
    </div>
    <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
      <div class="flex justify-between"><span class="text-slate-400">Ngày</span><strong>${latest.date || '-'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">Điểm mua</span><strong>${latest.entry ?? '-'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">Điểm bán</span><strong>${latest.exit ?? '-'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">Khối lượng</span><strong>${latest.qty ?? '-'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">R</span><strong>${Number(latest.riskR || 0).toFixed(1)}R</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">PnL</span><strong class="${Number(latest.pnl)>=0?'text-emerald-400':'text-rose-400'}">${formatMoney(latest.pnl || 0)}</strong></div>
    </div>`;
}

function renderDashboard(trades) {
  const net = trades.reduce((s, t) => s + Number(t.pnl || 0), 500000000);
  const winCount = trades.filter(t => Number(t.pnl) > 0).length;
  const winRate = trades.length ? (winCount / trades.length) * 100 : 0;
  const best = getBestSetup(trades);
  document.getElementById('dash-balance').textContent = formatMoney(net);
  document.getElementById('dash-trades').textContent = String(trades.length);
  document.getElementById('dash-winrate').textContent = `${winRate.toFixed(1)}%`;
  document.getElementById('dash-best-setup').textContent = best.name;
  document.getElementById('summary-total-trades').textContent = String(trades.length);
  document.getElementById('summary-best-setup').textContent = best.name;
  document.getElementById('summary-net-pnl').textContent = formatMoney(trades.reduce((s, t) => s + Number(t.pnl || 0), 0));
  renderSetupRanking(trades);
  renderEquityChart(trades);
}

function renderSetupRanking(trades) {
  const container = document.getElementById('setup-ranking');
  const groups = aggregateBySetup(trades);
  const sorted = Object.entries(groups).sort((a, b) => b[1].winRate - a[1].winRate);
  container.innerHTML = sorted.map(([name, s], idx) => `
    <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3"><span class="status-badge ${idx===0?'status-success':'status-info'}">#${idx+1}</span><strong class="text-white">${name}</strong></div>
        <div class="text-sm font-black ${s.winRate >= 50 ? 'text-emerald-400':'text-amber-400'}">${s.winRate.toFixed(1)}%</div>
      </div>
      <div class="mt-2 text-sm text-slate-400">${s.total} lệnh · R TB ${s.avgR.toFixed(2)}R · PnL ${formatMoney(s.pnl)}</div>
    </div>`).join('');
}

function renderEquityChart(trades) {
  const ordered = [...trades].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let capital = 500000000;
  const labels = [];
  const points = [];
  ordered.forEach(t => {
    capital += Number(t.pnl || 0);
    labels.push(t.date || '-');
    points.push(capital);
  });
  const ctx = document.getElementById('equityChart');
  if (equityChart) equityChart.destroy();
  equityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Vốn', data: points, borderColor: '#10b981', tension: 0.35, fill: true, backgroundColor: 'rgba(16,185,129,.12)' }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { ticks: { color: '#94a3b8', callback: v => new Intl.NumberFormat('vi-VN').format(v) }, grid: { color: 'rgba(255,255,255,.05)' } }
      }
    }
  });
}

function renderAnalysis(trades) {
  const best = getBestSetup(trades);
  document.getElementById('analysis-setup-badge').textContent = best.name;
  document.getElementById('analysis-pattern-image').src = 'Phan tich.png';
  if (!lastCurrentAnalysisImage) document.getElementById('analysis-current-image').src = 'Phan tich.png';
  document.getElementById('analysis-checklist').innerHTML = (defaultPatterns[best.name] || defaultPatterns.VCP).map(item => `
    <div class="check-item"><span class="check-dot"></span><div><div class="font-bold text-white">${item}</div><div class="text-sm text-slate-400">Kiểm tra trước khi vào lệnh.</div></div></div>`).join('');
  document.getElementById('analysis-total').textContent = best.total;
  document.getElementById('analysis-winrate').textContent = `${best.winRate.toFixed(1)}%`;
  document.getElementById('analysis-ravg').textContent = `${best.avgR.toFixed(2)}R`;
}

function renderRadar(items) {
  const groups = {
    nearBuy: items.filter(x => x.module === 'nearBuy'),
    watchlist: items.filter(x => x.module === 'watchlist'),
    longTerm: items.filter(x => x.module === 'longTerm')
  };
  ['nearBuy','watchlist','longTerm'].forEach(module => {
    const box = document.getElementById(`radar-${module}`);
    if (!groups[module].length) {
      box.innerHTML = '<div class="empty-state">Chưa có mã trong mô-đun này.</div>';
      return;
    }
    box.innerHTML = groups[module].map(item => radarCard(item)).join('');
  });
  bindRadarActions();
}

function radarCard(item) {
  const uploadId = `upload-${item.ticker}`;
  return `
    <div class="radar-card" data-ticker="${item.ticker}">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-xl font-black text-white">${item.ticker}</div>
          <div class="text-sm text-slate-400">${item.setup || '-'} · ${item.timeframe || '-'}</div>
        </div>
        <span class="status-badge ${item.module === 'nearBuy' ? 'status-success' : item.module === 'watchlist' ? 'status-warning' : 'status-info'}">${item.score || 0} điểm</span>
      </div>
      <div class="mt-3 text-sm text-slate-300">${item.note || ''}</div>
      <img src="${item.image || 'Radar.png'}" alt="${item.ticker}">
      <div class="radar-actions">
        ${item.module !== 'nearBuy' ? `<button class="btn-small" onclick="moveRadarModule('${item.ticker}','nearBuy')">Chuyển gần điểm mua</button>` : ''}
        ${item.module !== 'watchlist' ? `<button class="btn-small" onclick="moveRadarModule('${item.ticker}','watchlist')">Chuyển theo dõi</button>` : ''}
        ${item.module !== 'longTerm' ? `<button class="btn-small" onclick="moveRadarModule('${item.ticker}','longTerm')">Chuyển dài hạn</button>` : ''}
        <label class="btn-small">Up chart<input id="${uploadId}" type="file" accept="image/*" class="hidden" onchange="uploadRadarImage('${item.ticker}', event)"></label>
      </div>
    </div>`;
}

function bindRadarActions() { lucide.createIcons(); }

function moveRadarModule(ticker, module) {
  radarData = radarData.map(item => item.ticker === ticker ? { ...item, module } : item);
  renderRadar(radarData);
  if (currentUser) {
    const target = radarData.find(x => x.ticker === ticker);
    db.collection('radar').where('userId', '==', currentUser.uid).where('ticker', '==', ticker).get().then(snap => {
      snap.forEach(doc => doc.ref.set({ ...target, userId: currentUser.uid }, { merge: true }));
    });
  }
}

function uploadRadarImage(ticker, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    radarData = radarData.map(item => item.ticker === ticker ? { ...item, image: result } : item);
    renderRadar(radarData);
    if (currentUser) {
      db.collection('radar').where('userId', '==', currentUser.uid).where('ticker', '==', ticker).get().then(snap => {
        snap.forEach(doc => doc.ref.set({ image: result }, { merge: true }));
      });
    }
  };
  reader.readAsDataURL(file);
}

function handleAnalysisImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    lastCurrentAnalysisImage = reader.result;
    document.getElementById('analysis-current-image').src = lastCurrentAnalysisImage;
    document.getElementById('analysis-current-caption').textContent = `Đã tải chart hiện tại: ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function toggleChat() {
  document.getElementById('chat-container').classList.toggle('hidden');
  if (!document.getElementById('chat-container').classList.contains('hidden')) loadChat();
}

async function sendChatMessage() {
  const inp = document.getElementById('chat-input');
  if (!inp.value.trim() || !currentUser) return;
  await db.collection('messages').add({
    text: inp.value,
    sender: currentUser.email.split('@')[0],
    role: userRole,
    uid: currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  inp.value = '';
}

function loadChat() {
  db.collection('messages').orderBy('timestamp', 'asc').limitToLast(20).onSnapshot(snap => {
    const box = document.getElementById('chat-messages');
    box.innerHTML = snap.docs.map(doc => {
      const m = doc.data();
      const isMe = currentUser && m.uid === currentUser.uid;
      return `<div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
        <span class="text-[8px] text-slate-500 uppercase">${m.sender} ${m.role === 'admin' ? '🚀' : ''}</span>
        <div class="px-3 py-2 rounded-xl text-[11px] ${isMe ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-200'}">${m.text}</div>
      </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  });
}

async function updateGlobalMarketSettings() {
  const days = Number(document.getElementById('market-dist-days').value || 0);
  await db.collection('settings').doc('market').set({ distDays: days, updatedBy: currentUser ? currentUser.email : 'demo' });
  applyMarketAdvice(days);
  alert('Đã cập nhật dữ liệu cho toàn hệ thống!');
}

function loadGlobalMarket() {
  db.collection('settings').doc('market').onSnapshot(doc => {
    const days = doc.exists ? Number(doc.data().distDays || 0) : 0;
    document.getElementById('market-dist-days').value = days;
    if (userRole !== 'admin') document.getElementById('market-dist-days').disabled = true;
    applyMarketAdvice(days);
  }, () => applyMarketAdvice(0));
}

function applyMarketAdvice(days) {
  let status = 'Thị trường bình thường';
  let note = '1-2 ngày phân phối: có thể giao dịch bình thường.';
  if (days === 3) {
    status = 'Thị trường có rủi ro - hạ tỷ trọng margin';
    note = 'Khi số ngày phân phối lên 3, ưu tiên giảm margin và siết quản trị rủi ro.';
  } else if (days === 4) {
    status = 'Nguy cơ cao - đưa 50% tiền mặt';
    note = 'Ưu tiên phòng thủ, chỉ giữ mã mạnh nhất.';
  } else if (days >= 5) {
    status = 'Rủi ro rất cao - 100% tiền mặt';
    note = '5-6 ngày phân phối: bảo toàn vốn, dừng mở vị thế mới.';
  }
  document.getElementById('market-advice').textContent = status;
  document.getElementById('market-note').textContent = note;
  document.getElementById('market-status-chip').textContent = status;
}

function aggregateBySetup(trades) {
  return trades.reduce((acc, t) => {
    const key = t.setup || 'Khác';
    acc[key] ||= { total: 0, win: 0, pnl: 0, sumR: 0, winRate: 0, avgR: 0 };
    acc[key].total += 1;
    if (Number(t.pnl) > 0) acc[key].win += 1;
    acc[key].pnl += Number(t.pnl || 0);
    acc[key].sumR += Number(t.riskR || 0);
    acc[key].winRate = (acc[key].win / acc[key].total) * 100;
    acc[key].avgR = acc[key].sumR / acc[key].total;
    return acc;
  }, {});
}

function getBestSetup(trades) {
  const groups = aggregateBySetup(trades);
  const entries = Object.entries(groups);
  if (!entries.length) return { name: 'Chưa có', total: 0, winRate: 0, avgR: 0 };
  const [name, stats] = entries.sort((a, b) => (b[1].winRate - a[1].winRate) || (b[1].pnl - a[1].pnl))[0];
  return { name, ...stats };
}

function formatMoney(v) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(v || 0))}đ`;
}
