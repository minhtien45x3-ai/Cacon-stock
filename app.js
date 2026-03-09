const STORAGE_KEY = 'cacon_stock_pro_v82';
let state = {
  initialCapital: 500000000,
  market: { distDays: 2 },
  trades: [],
  patterns: [],
  radarItems: [],
  libraryNotes: '',
  analysisUploadImage: '',
  mindset: [
    { title: 'Trước giao dịch', text: 'Có xu hướng thị trường thuận lợi, mã thuộc nhóm dẫn dắt, điểm mua rõ ràng, khối lượng phù hợp.' },
    { title: 'Trong giao dịch', text: 'Không FOMO, không bình quân giá xuống, chỉ tăng vị thế khi cổ phiếu xác nhận đúng.' },
    { title: 'Sau giao dịch', text: 'Review lỗi, ghi lại cảm xúc, xác định liệu tuân thủ hệ thống hay giao dịch theo cảm tính.' }
  ]
};
let equityChart, monthlyChart, radarChart;
let currentPatternImage = '';
let patternSearchTerm = '';


const defaultPatterns = [
  { id:'p_vcp', name: 'VCP', image:'assets/mau hinh.png', conditions: ['Xu hướng trước đó tăng rõ', 'Biên độ co hẹp dần', 'Khối lượng giảm dần khi siết nền', 'Breakout cùng volume tăng mạnh', 'RS gần đỉnh mới'] },
  { id:'p_cwh', name: 'Cup with Handle', image:'assets/Phan tich.png', conditions: ['Nền cốc tối thiểu 7 tuần', 'Tay cầm ngắn, khối lượng khô', 'Đỉnh phải tiệm cận đỉnh trái', 'Điểm mua tại pivot tay cầm', 'Không có áp lực phân phối lớn'] },
  { id:'p_3c', name: '3C', image:'assets/Phan tich.png', conditions: ['Có nền giá rõ ràng', 'Biên độ thu hẹp liên tục', 'Khối lượng cạn ở vùng đáy nền', 'Breakout có lực cầu xác nhận'] },
  { id:'p_bob', name: 'Base on Base', image:'assets/Phan tich.png', conditions: ['Nền thứ hai nằm trên nền thứ nhất', 'Không bị phân phối nặng', 'MA20/50 nâng đỡ giá', 'Điểm mua gần pivot nền mới'] }
];

const demoTrades = [
  { id:'t1', date:'2026-01-07', ticker:'FPT', setup:'VCP', entry:127.5, exit:138.2, size:1000, r:2.1, grade:'A', note:'Breakout khỏi nền siết chặt, volume bùng nổ.' },
  { id:'t2', date:'2026-01-21', ticker:'MWG', setup:'3C', entry:68.2, exit:65.0, size:1500, r:-1.2, grade:'B', note:'Mua sớm hơn pivot, thị trường chưa đồng thuận.' },
  { id:'t3', date:'2026-02-03', ticker:'CTD', setup:'VCP', entry:92.4, exit:101.5, size:800, r:2.4, grade:'A+', note:'Nền chặt, RS mạnh, nhóm xây dựng dẫn sóng.' },
  { id:'t4', date:'2026-02-17', ticker:'DGC', setup:'Cup with Handle', entry:121.0, exit:133.8, size:900, r:2.0, grade:'A', note:'Tay cầm đẹp, volume cạn trước breakout.' },
  { id:'t5', date:'2026-03-01', ticker:'HHV', setup:'Base on Base', entry:18.8, exit:17.9, size:5000, r:-0.8, grade:'C', note:'Thị trường yếu, breakout thất bại.' }
].map(t => ({...t, pnl: calcPnl(t)}));

const demoRadar = [
  { ticker:'FPT', scores:[9,8,9,8,7,9] },
  { ticker:'CTD', scores:[8,8,7,8,8,8] }
];

function calcPnl(trade){
  return Number(((trade.exit - trade.entry) * trade.size).toFixed(0));
}

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      state.patterns = parsed.patterns?.length ? parsed.patterns.map((p,idx)=>({image:'assets/mau hinh.png', id:p.id || `p_${idx}_${Date.now()}`, ...p})) : defaultPatterns;
      state.analysisUploadImage = parsed.analysisUploadImage || '';
      return;
    }
  } catch(e) {}
  state.patterns = defaultPatterns;
  state.trades = demoTrades;
  state.radarItems = demoRadar;
  state.libraryNotes = 'Checklist review tuần:\n- Chỉ giao dịch khi thị trường 1-2 ngày phân phối\n- Chụp ảnh chart trước và sau lệnh\n- Review lệnh sai do mua sớm';
  saveState();
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value){
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(value);
}

function getMarketStatus(days){
  const d = Number(days);
  if(d <= 2) return { title:'Thị trường bình thường', note:'Có thể giao dịch theo cổ phiếu dẫn dắt, ưu tiên cổ phiếu mạnh hơn thị trường.', cls:'status-normal' };
  if(d === 3) return { title:'Có rủi ro - Hạ tỷ trọng margin', note:'Bắt đầu thận trọng, giảm đòn bẩy, siết điểm mua chặt hơn.', cls:'status-warn' };
  if(d === 4) return { title:'Nguy cơ cao - 50% tiền mặt', note:'Ưu tiên bảo toàn vốn, chỉ giữ những mã thật sự mạnh.', cls:'status-risk' };
  return { title:'Phòng thủ - 100% tiền mặt', note:'5-6 ngày phân phối: giảm mạnh rủi ro, chờ xu hướng xác nhận lại.', cls:'status-risk' };
}

function getTradeStats(){
  const trades = [...state.trades].sort((a,b)=>a.date.localeCompare(b.date));
  const pnl = trades.reduce((s,t)=>s + calcPnl(t), 0);
  const wins = trades.filter(t => calcPnl(t) > 0).length;
  const equity = state.initialCapital + pnl;
  const winrate = trades.length ? (wins / trades.length) * 100 : 0;
  return { trades, pnl, wins, equity, winrate };
}

function renderTicker(){
  const stats = getTradeStats();
  const market = getMarketStatus(state.market.distDays);
  const items = [
    `Vốn hiện tại: ${formatCurrency(stats.equity)}`,
    `Lãi/Lỗ ròng: ${formatCurrency(stats.pnl)}`,
    `Win rate: ${stats.winrate.toFixed(1)}%`,
    `Khuyến nghị thị trường: ${market.title}`,
    `Số lệnh: ${state.trades.length}`,
    `Mẫu hình hiệu quả cao nhất: ${getSetupRanking()[0]?.name || 'Chưa có dữ liệu'}`
  ];
  const doubled = [...items, ...items];
  document.getElementById('ticker-track').innerHTML = doubled.map(text => `<span class="ticker-item">${text}</span>`).join('');
}

function renderOverview(){
  const stats = getTradeStats();
  const market = getMarketStatus(state.market.distDays);
  document.getElementById('metric-equity').textContent = formatCurrency(stats.equity);
  document.getElementById('metric-pnl').textContent = formatCurrency(stats.pnl);
  document.getElementById('metric-winrate').textContent = `${stats.winrate.toFixed(1)}%`;
  document.getElementById('metric-market').textContent = market.title;
  document.getElementById('metric-pnl').className = `metric-value ${stats.pnl >= 0 ? 'text-positive' : 'text-negative'}`;
  document.getElementById('metric-market-note').textContent = market.note;

  const recent = [...state.trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('recent-trades').innerHTML = recent.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.ticker}</td>
      <td>${t.setup}</td>
      <td>${Number(t.r || 0).toFixed(1)}</td>
      <td class="${calcPnl(t)>=0?'text-positive':'text-negative'}">${formatCurrency(calcPnl(t))}</td>
    </tr>
  `).join('');

  renderSetupRanking();
  renderEquityChart();
  renderMonthlyChart();
}

function getSetupRanking(){
  const map = {};
  state.trades.forEach(t => {
    if(!map[t.setup]) map[t.setup] = { name:t.setup, total:0, wins:0, pnl:0 };
    map[t.setup].total += 1;
    const pnl = calcPnl(t);
    if(pnl > 0) map[t.setup].wins += 1;
    map[t.setup].pnl += pnl;
  });
  return Object.values(map).map(item => ({
    ...item,
    winrate: item.total ? item.wins / item.total * 100 : 0
  })).sort((a,b)=> b.winrate - a.winrate || b.pnl - a.pnl);
}

function renderSetupRanking(){
  const list = getSetupRanking();
  document.getElementById('setup-ranking').innerHTML = list.length ? list.map((item, idx) => `
    <div class="ranking-item">
      <div class="ranking-top"><span>#${idx+1} ${item.name}</span><span>${item.winrate.toFixed(1)}%</span></div>
      <div class="progress"><span style="width:${Math.max(item.winrate, 6)}%"></span></div>
      <div class="footer-sub">${item.wins}/${item.total} lệnh thắng · ${formatCurrency(item.pnl)}</div>
    </div>
  `).join('') : '<div class="ranking-item">Chưa có dữ liệu mẫu hình.</div>';
}

function renderEquityChart(){
  const { trades } = getTradeStats();
  let running = state.initialCapital;
  const labels = [];
  const data = [];
  trades.forEach(t => {
    running += calcPnl(t);
    labels.push(`${t.date} · ${t.ticker}`);
    data.push(running);
  });
  const ctx = document.getElementById('equityChart');
  if(equityChart) equityChart.destroy();
  equityChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'Vốn', data, tension:0.35, fill:true, borderWidth:2 }] },
    options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#8da2c0' } }, y:{ ticks:{ color:'#8da2c0', callback:(v)=> new Intl.NumberFormat('vi-VN').format(v) } } } }
  });
}

function renderMonthlyChart(){
  const grouped = {};
  state.trades.forEach(t => {
    const month = t.date.slice(0,7);
    if(!grouped[month]) grouped[month] = { count:0, pnl:0 };
    grouped[month].count += 1;
    grouped[month].pnl += calcPnl(t);
  });
  const labels = Object.keys(grouped).sort();
  const countData = labels.map(m => grouped[m].count);
  const pnlData = labels.map(m => grouped[m].pnl);
  const ctx = document.getElementById('monthlyChart');
  if(monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    data:{ labels, datasets:[
      { type:'bar', label:'Số lệnh', data:countData },
      { type:'line', label:'PnL', data:pnlData, tension:.3, yAxisID:'y1' }
    ]},
    options:{ plugins:{ legend:{ labels:{ color:'#d5e1f2' } } }, scales:{ x:{ ticks:{ color:'#8da2c0' } }, y:{ ticks:{ color:'#8da2c0' }, beginAtZero:true }, y1:{ position:'right', ticks:{ color:'#8da2c0', callback:v=>new Intl.NumberFormat('vi-VN').format(v) }, grid:{ drawOnChartArea:false } } } }
  });
}

function renderMarket(){
  document.getElementById('dist-days-input').value = state.market.distDays;
  const status = getMarketStatus(state.market.distDays);
  document.getElementById('market-status-card').className = `market-status-card ${status.cls}`;
  document.getElementById('market-status-card').innerHTML = `<h4>${status.title}</h4><p class="footer-sub">${status.note}</p>`;
}

function openTradeModal(trade = null){
  document.getElementById('trade-modal').classList.remove('hidden');
  document.getElementById('trade-form').reset();
  document.getElementById('trade-id').value = trade?.id || '';
  document.getElementById('trade-date').value = trade?.date || new Date().toISOString().slice(0,10);
  document.getElementById('trade-ticker').value = trade?.ticker || '';
  document.getElementById('trade-setup').value = trade?.setup || '';
  document.getElementById('trade-size').value = trade?.size || '';
  document.getElementById('trade-entry').value = trade?.entry || '';
  document.getElementById('trade-exit').value = trade?.exit || '';
  document.getElementById('trade-r').value = trade?.r ?? '';
  document.getElementById('trade-grade').value = trade?.grade || 'A';
  document.getElementById('trade-note').value = trade?.note || '';
}

function closeTradeModal(){ document.getElementById('trade-modal').classList.add('hidden'); }

function renderJournal(){
  const rows = [...state.trades].sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('journal-table-body').innerHTML = rows.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.ticker}</td>
      <td>${t.setup}</td>
      <td>${t.entry}</td>
      <td>${t.exit}</td>
      <td>${t.size}</td>
      <td>${Number(t.r || 0).toFixed(1)}</td>
      <td class="${calcPnl(t)>=0?'text-positive':'text-negative'}">${formatCurrency(calcPnl(t))}</td>
      <td>
        <button class="action-link" onclick="editTrade('${t.id}')">Sửa</button>
        <button class="action-link" onclick="deleteTrade('${t.id}')">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function editTrade(id){
  const trade = state.trades.find(t => t.id === id);
  if(trade) openTradeModal(trade);
}
window.editTrade = editTrade;

function deleteTrade(id){
  state.trades = state.trades.filter(t => t.id !== id);
  persistAndRefresh();
}
window.deleteTrade = deleteTrade;

function renderAnalysis(){
  const select = document.getElementById('analysis-pattern-select');
  select.innerHTML = state.patterns.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');
  const idx = Number(select.value || 0);
  const pattern = state.patterns[idx] || state.patterns[0];
  document.getElementById('analysis-checklist').innerHTML = pattern.conditions.map((c, i) => `
    <label class="check-item"><input type="checkbox"> Điều kiện ${i+1}: ${c}</label>
  `).join('');
  const patternImage = pattern?.image || 'assets/mau hinh.png';
  document.getElementById('analysis-pattern-image').src = patternImage;
  currentPatternImage = patternImage;
  const wrap = document.getElementById('analysis-preview-wrap');
  if(state.analysisUploadImage){
    wrap.className = 'compare-frame compare-frame-xl clickable-frame';
    wrap.innerHTML = `<img src="${state.analysisUploadImage}" class="compare-image compare-image-xl" id="analysis-upload-preview" alt="Chart upload">`;
  } else {
    wrap.className = 'preview-empty compare-frame compare-frame-xl';
    wrap.innerHTML = 'Chưa có ảnh tải lên';
  }
}

function renderPatterns(){
  const keyword = patternSearchTerm.trim().toLowerCase();
  const filtered = state.patterns.filter(p => !keyword || p.name.toLowerCase().includes(keyword) || p.conditions.join(' ').toLowerCase().includes(keyword));
  document.getElementById('pattern-list').innerHTML = filtered.length ? filtered.map((p) => {
    const idx = state.patterns.findIndex(x => x.id === p.id);
    const safeName = p.name.replace(/'/g, '&#39;');
    return `
    <div class="pattern-item">
      <div class="section-head between">
        <div>
          <h4>${p.name}</h4>
          <p class="footer-sub">${p.conditions.length} điều kiện chuẩn</p>
        </div>
        <div class="pattern-actions"><button class="action-link" onclick="editPattern(${idx})">Sửa</button><button class="action-link" onclick="removePattern(${idx})">Xóa</button></div>
      </div>
      ${p.image ? `<div class="pattern-thumb-wrap"><img src="${p.image}" class="pattern-thumb" alt="${p.name}"><button class="action-link" onclick="openImageViewer('${p.image}', '${safeName}')">Xem lớn</button></div>` : ''}<ul>${p.conditions.map(c=>`<li>${c}</li>`).join('')}</ul>
    </div>`;
  }).join('') : '<div class="pattern-item">Không tìm thấy mẫu hình phù hợp.</div>';
}

function openPatternModal(pattern = null, idx = ''){
  document.getElementById('pattern-modal').classList.remove('hidden');
  document.getElementById('pattern-id').value = idx;
  document.getElementById('pattern-name').value = pattern?.name || '';
  document.getElementById('pattern-conditions').value = pattern?.conditions?.join('\n') || '';
  currentPatternImage = pattern?.image || '';
  document.getElementById('pattern-image-preview').innerHTML = currentPatternImage ? `<img src="${currentPatternImage}" class="compare-image compare-image-large" alt="Ảnh mẫu hình">` : 'Chưa có ảnh mẫu';
}
function closePatternModal(){ document.getElementById('pattern-modal').classList.add('hidden'); }

function openImageViewer(src, title='Ảnh biểu đồ'){
  if(!src) return;
  document.getElementById('image-viewer-img').src = src;
  document.getElementById('image-viewer-title').textContent = title;
  document.getElementById('image-viewer-modal').classList.remove('hidden');
}
window.openImageViewer = openImageViewer;
function closeImageViewer(){ document.getElementById('image-viewer-modal').classList.add('hidden'); }
function editPattern(idx){ const pattern = state.patterns[idx]; if(pattern) openPatternModal(pattern, idx); }
function removePattern(idx){ state.patterns.splice(idx,1); persistAndRefresh(); }
window.editPattern = editPattern;
window.removePattern = removePattern;

function renderRadarForms(){
  const wrap = document.getElementById('radar-form-list');
  wrap.innerHTML = state.radarItems.map((item, idx) => `
    <div class="radar-row">
      <input class="ticker-input" value="${item.ticker}" onchange="updateRadarTicker(${idx}, this.value)">
      ${item.scores.map((score, sIdx)=>`<input class="score-input" type="number" min="1" max="10" value="${score}" onchange="updateRadarScore(${idx}, ${sIdx}, this.value)">`).join('')}
      <button class="action-link" onclick="removeRadar(${idx})">Xóa</button>
    </div>
  `).join('');
}
function updateRadarTicker(idx, value){ state.radarItems[idx].ticker = value.toUpperCase(); saveState(); renderRadarChart(); }
function updateRadarScore(idx, scoreIdx, value){ state.radarItems[idx].scores[scoreIdx] = Number(value); saveState(); renderRadarChart(); }
function removeRadar(idx){ state.radarItems.splice(idx,1); persistAndRefresh(); }
window.updateRadarTicker = updateRadarTicker; window.updateRadarScore = updateRadarScore; window.removeRadar = removeRadar;

function renderRadarChart(){
  const ctx = document.getElementById('radarChart');
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type:'radar',
    data:{
      labels:['Xu hướng', 'Thanh khoản', 'Siết nền', 'RS', 'Volume breakout', 'Tâm lý cầm hàng'],
      datasets: state.radarItems.map((item, idx) => ({ label:item.ticker, data:item.scores, borderWidth:2 }))
    },
    options:{ scales:{ r:{ min:0, max:10, ticks:{ display:false }, pointLabels:{ color:'#d5e1f2' }, grid:{ color:'rgba(255,255,255,.1)' }, angleLines:{ color:'rgba(255,255,255,.1)' } } }, plugins:{ legend:{ labels:{ color:'#d5e1f2' } } } }
  });
}

function renderLibrary(){ document.getElementById('library-notes').value = state.libraryNotes || ''; }
function renderMindset(){
  document.getElementById('mindset-grid').innerHTML = state.mindset.map(item => `
    <div class="mindset-item">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

function persistAndRefresh(){ saveState(); renderAll(); }
function renderAll(){ renderTicker(); renderOverview(); renderMarket(); renderJournal(); renderPatterns(); renderRadarForms(); renderRadarChart(); renderAnalysis(); renderLibrary(); renderMindset(); }

function switchTab(tab){
  document.querySelectorAll('.tab-panel').forEach(el=>el.classList.add('hidden'));
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===tab));
  const titleMap = { overview:'Tổng quan', market:'Thị trường', journal:'Nhật ký', analysis:'Phân tích hệ thống', patterns:'Mẫu hình', radar:'Radar', library:'Thư viện', mindset:'Tâm lý' };
  document.getElementById('page-title').textContent = titleMap[tab] || 'CaCon Stock';
}

function bindEvents(){
  document.getElementById('nav-list').addEventListener('click', (e)=>{
    const btn = e.target.closest('.nav-item');
    if(btn) switchTab(btn.dataset.tab);
  });
  document.getElementById('save-market-btn').addEventListener('click', ()=>{
    state.market.distDays = Number(document.getElementById('dist-days-input').value || 0);
    persistAndRefresh();
  });
  document.getElementById('add-trade-btn').addEventListener('click', ()=>openTradeModal());
  document.getElementById('add-trade-top-btn').addEventListener('click', ()=>{ switchTab('journal'); openTradeModal(); });
  document.getElementById('close-trade-modal').addEventListener('click', closeTradeModal);
  document.getElementById('cancel-trade-btn').addEventListener('click', closeTradeModal);
  document.getElementById('trade-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const trade = {
      id: document.getElementById('trade-id').value || `t_${Date.now()}`,
      date: document.getElementById('trade-date').value,
      ticker: document.getElementById('trade-ticker').value.toUpperCase(),
      setup: document.getElementById('trade-setup').value,
      size: Number(document.getElementById('trade-size').value),
      entry: Number(document.getElementById('trade-entry').value),
      exit: Number(document.getElementById('trade-exit').value),
      r: Number(document.getElementById('trade-r').value || 0),
      grade: document.getElementById('trade-grade').value,
      note: document.getElementById('trade-note').value
    };
    trade.pnl = calcPnl(trade);
    const idx = state.trades.findIndex(t => t.id === trade.id);
    if(idx >= 0) state.trades[idx] = trade; else state.trades.push(trade);
    closeTradeModal();
    persistAndRefresh();
  });
  document.getElementById('analysis-pattern-select').addEventListener('change', renderAnalysis);
  document.getElementById('analysis-upload').addEventListener('change', (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.analysisUploadImage = reader.result;
      saveState();
      renderAnalysis();
      lucide.createIcons();
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('analysis-clear-btn').addEventListener('click', ()=>{
    state.analysisUploadImage = '';
    saveState();
    renderAnalysis();
  });
  document.getElementById('open-pattern-fullscreen').addEventListener('click', ()=>{
    const img = document.getElementById('analysis-pattern-image');
    openImageViewer(img?.src || '', 'Mẫu chuẩn');
  });
  document.getElementById('open-upload-fullscreen').addEventListener('click', ()=>{
    if(state.analysisUploadImage) openImageViewer(state.analysisUploadImage, 'Biểu đồ hiện tại');
  });
  document.getElementById('add-pattern-btn').addEventListener('click', ()=> openPatternModal());
  document.getElementById('pattern-search').addEventListener('input', (e)=>{ patternSearchTerm = e.target.value || ''; renderPatterns(); });
  document.getElementById('close-pattern-modal').addEventListener('click', closePatternModal);
  document.getElementById('cancel-pattern-btn').addEventListener('click', closePatternModal);
  document.getElementById('pattern-image-upload').addEventListener('change', (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentPatternImage = reader.result;
      document.getElementById('pattern-image-preview').innerHTML = `<img src="${reader.result}" class="compare-image compare-image-large" alt="Ảnh mẫu hình">`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('pattern-replace-image-btn').addEventListener('click', ()=> document.getElementById('pattern-image-upload').click());
  document.getElementById('pattern-remove-image-btn').addEventListener('click', ()=>{
    currentPatternImage = '';
    document.getElementById('pattern-image-preview').innerHTML = 'Chưa có ảnh mẫu';
  });
  document.getElementById('pattern-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const idx = document.getElementById('pattern-id').value;
    const pattern = {
      id: idx !== '' && state.patterns[idx]?.id ? state.patterns[idx].id : `p_${Date.now()}`,
      name: document.getElementById('pattern-name').value.trim(),
      image: currentPatternImage || 'assets/mau hinh.png',
      conditions: document.getElementById('pattern-conditions').value.split('\n').map(s=>s.trim()).filter(Boolean)
    };
    if(!pattern.conditions.length) pattern.conditions = ['Thêm điều kiện chi tiết sau'];
    if(idx !== '') state.patterns[Number(idx)] = pattern; else state.patterns.push(pattern);
    closePatternModal();
    persistAndRefresh();
  });
  document.getElementById('add-radar-btn').addEventListener('click', ()=>{
    state.radarItems.push({ ticker:`NEW${state.radarItems.length+1}`, scores:[5,5,5,5,5,5] });
    persistAndRefresh();
  });
  document.getElementById('save-library-btn').addEventListener('click', ()=>{
    state.libraryNotes = document.getElementById('library-notes').value;
    saveState();
    alert('Đã lưu ghi chú thư viện.');
  });
  document.getElementById('seed-demo-btn').addEventListener('click', ()=>{
    state.trades = demoTrades;
    state.patterns = defaultPatterns;
    state.radarItems = demoRadar;
    state.market.distDays = 2;
    state.analysisUploadImage = '';
    persistAndRefresh();
  });
  document.getElementById('close-image-viewer').addEventListener('click', closeImageViewer);
  document.getElementById('image-viewer-close').addEventListener('click', closeImageViewer);
  document.addEventListener('click', (e)=>{
    const frame = e.target.closest('.clickable-frame');
    if(!frame) return;
    if(frame.querySelector('#analysis-pattern-image')) openImageViewer(document.getElementById('analysis-pattern-image').src, 'Mẫu chuẩn');
    if(frame.querySelector('#analysis-upload-preview')) openImageViewer(state.analysisUploadImage, 'Biểu đồ hiện tại');
  });
}

function init(){
  loadState();
  bindEvents();
  renderAll();
  lucide.createIcons();
  switchTab('overview');
}

document.addEventListener('DOMContentLoaded', init);
