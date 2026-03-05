/* =========================================================
   CACON STOCK PRO (linked tabs + demo data + full functions)
   - Market → affects checklist + dashboard label
   - Wiki → Analysis menu + Journal setup dropdown
   - Radar → one-click create Trade + stats
   - Journal → Dashboard charts + Capital auto fill
   Data persisted in localStorage (v10 keys)
========================================================= */

const LS = {
  STATE: 'cacon_state_v10',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtVND = (n) => (Number(n || 0)).toLocaleString('vi-VN') + 'Đ';
const safeNum = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

let state = loadState();

/* ------------------------ BOOT ------------------------ */
window.onload = function () {
  lucide.createIcons();
  initCharts();
  initSentimentGauge();

  // enable save trade only when checklist all checked
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('trade-check')) {
      const all = Array.from(document.querySelectorAll('.trade-check')).every((c) => c.checked);
      const btn = document.getElementById('btn-save-trade');
      btn.disabled = !all;
      btn.classList.toggle('opacity-50', !all);
    }
  });

  // first render
  updateUI();

  // keep market status text inside trade modal
  updateMarketStatus(false);
};

/* --------------------- STATE I/O ---------------------- */
function defaultState() {
  return {
    version: 10,
    totalCapital: 2000000000,

    market: {
      distDays: 2,
      sentiment: 50,
      sectors: 'BANK, CÔNG NGHỆ, CHỨNG KHOÁN',
      updatedAt: Date.now(),
    },

    // trade schema:
    // { id, date, ticker, setup, vol, buy, sell, sl, riskPct, img, notes, createdAt }
    journal: [],

    // wiki schema:
    // { id, title, img, checklist:[...], createdAt }
    wiki: [],

    // radar schema:
    // { id, ticker, setup, price, pivot, score, createdAt }
    radar: [],

    // library schema:
    // { id, title, desc, content, createdAt }
    library: [
      {
        id: uid(),
        title: 'HỆ THỐNG CANSLIM',
        desc: 'Chọn siêu cổ phiếu tăng trưởng bền vững.',
        content: 'C-A-N-S-L-I-M: bộ tiêu chí của William O’Neil, kết hợp tăng trưởng + dòng tiền + thị trường chung.',
        createdAt: Date.now(),
      },
      {
        id: uid(),
        title: 'MINERVINI – SEPA',
        desc: 'Kỷ luật – điểm mua chuẩn – quản trị rủi ro.',
        content: 'Tập trung nền giá chặt, sức mạnh giá, volume, market timing, vào lệnh tại pivot và thoát theo nguyên tắc.',
        createdAt: Date.now(),
      }
    ],

    analysis: {
      selectedWikiId: null,
      tempImg: null,
      checklistTicks: {}, // { wikiId: boolean[] }
    },

    psychology: {
      habits: { plan: false, stop: false, journal: false, sleep: false },
      note: '',
      updatedAt: Date.now(),
    },

    charts: {}, // runtime only
    ui: {
      radarSort: 'score',
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS.STATE);
    if (!raw) {
      const s = defaultState();
      // seed demo on first run so every tab has numbers
      seedDemoInto(s);
      localStorage.setItem(LS.STATE, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw);
    // migrate lightly
    const merged = { ...defaultState(), ...parsed };
    merged.market = { ...defaultState().market, ...(parsed.market || {}) };
    merged.analysis = { ...defaultState().analysis, ...(parsed.analysis || {}) };
    merged.psychology = { ...defaultState().psychology, ...(parsed.psychology || {}) };
    merged.ui = { ...defaultState().ui, ...(parsed.ui || {}) };
    merged.library = Array.isArray(parsed.library) ? parsed.library : defaultState().library;
    merged.wiki = Array.isArray(parsed.wiki) ? parsed.wiki : [];
    merged.journal = Array.isArray(parsed.journal) ? parsed.journal : [];
    merged.radar = Array.isArray(parsed.radar) ? parsed.radar : [];
    // ensure demo minimal
    if (merged.wiki.length === 0 || merged.journal.length === 0) seedDemoInto(merged);
    return merged;
  } catch (e) {
    const s = defaultState();
    seedDemoInto(s);
    localStorage.setItem(LS.STATE, JSON.stringify(s));
    return s;
  }
}

function saveState() {
  const copy = structuredClone(state);
  // remove runtime-only charts from persisted state
  copy.charts = {};
  localStorage.setItem(LS.STATE, JSON.stringify(copy));
}

/* ------------------------ DEMO ------------------------ */
function seedDemo(force = false) {
  if (!force && (state.journal.length > 0 || state.wiki.length > 0)) {
    toast('Đã có dữ liệu. Bấm DEMO lần nữa để ghi đè.');
    return;
  }
  seedDemoInto(state, true);
  saveState();
  updateUI();
  toast('Đã nạp DEMO để mỗi tab có số liệu minh hoạ.');
}

function seedDemoInto(s, overwrite = false) {
  if (overwrite) {
    s.journal = [];
    s.wiki = [];
    s.radar = [];
  }
  if (s.wiki.length === 0) {
    s.wiki = [
      {
        id: uid(),
        title: 'CỐC TAY CẦM',
        img: 'https://i.imgur.com/K7MvL1s.png',
        checklist: ['ĐÁY TRÒN (6–15 TUẦN)', 'TAY CẦM THẮT CHẶT (1–5 TUẦN)', 'BREAK PIVOT + VOL > AVG', 'MARKET THUẬN', 'SL 7–8%'],
        createdAt: Date.now(),
      },
      {
        id: uid(),
        title: 'VCP',
        img: 'https://i.imgur.com/Qq9G1bD.png',
        checklist: ['CO HẸP BIÊN ĐỘ (3–5 ĐỢT)', 'VOLUME KHÔ CẠN', 'NỀN CHẶT', 'BREAKOUT VOL', 'RELATIVE STRENGTH'],
        createdAt: Date.now(),
      },
      {
        id: uid(),
        title: 'NỀN PHẲNG (FLAT BASE)',
        img: 'https://i.imgur.com/7o2RjZf.png',
        checklist: ['BIÊN ĐỘ <= 15%', 'TỐI THIỂU 5 TUẦN', 'VOL GIẢM DẦN', 'PIVOT RÕ', 'MARKET OK'],
        createdAt: Date.now(),
      },
    ];
  }

  if (s.journal.length === 0) {
    const w1 = s.wiki[0]?.title || 'CỐC TAY CẦM';
    const w2 = s.wiki[1]?.title || 'VCP';
    const w3 = s.wiki[2]?.title || 'NỀN PHẲNG';

    s.journal = [
      { id: uid(), date: '2026-01-10', ticker: 'FPT', setup: w1, vol: 1000, buy: 118000, sell: 132000, sl: 110000, riskPct: 2, img: null, notes: 'break pivot vol tăng', createdAt: Date.now() - 1000000 },
      { id: uid(), date: '2026-01-28', ticker: 'MWG', setup: w3, vol: 800, buy: 46500, sell: 43800, sl: 43000, riskPct: 2, img: null, notes: 'market yếu → cắt lỗ đúng', createdAt: Date.now() - 900000 },
      { id: uid(), date: '2026-02-12', ticker: 'VCB', setup: w2, vol: 600, buy: 92500, sell: 101000, sl: 88000, riskPct: 1.5, img: null, notes: 'nền chặt, vol khô', createdAt: Date.now() - 800000 },
      { id: uid(), date: '2026-02-25', ticker: 'HPG', setup: w3, vol: 1500, buy: 28300, sell: 0, sl: 26800, riskPct: 2, img: null, notes: 'đang nắm giữ', createdAt: Date.now() - 700000 },
      { id: uid(), date: '2026-03-01', ticker: 'SSI', setup: w2, vol: 1200, buy: 36500, sell: 0, sl: 34500, riskPct: 2, img: null, notes: 'đang nắm giữ', createdAt: Date.now() - 600000 },
    ];
  }

  if (s.radar.length === 0) {
    const w1 = s.wiki[0]?.title || 'CỐC TAY CẦM';
    const w2 = s.wiki[1]?.title || 'VCP';
    s.radar = [
      { id: uid(), ticker: 'FPT', setup: w1, price: 134000, pivot: 136000, score: 82, createdAt: Date.now() },
      { id: uid(), ticker: 'VCB', setup: w2, price: 100500, pivot: 101200, score: 79, createdAt: Date.now() },
      { id: uid(), ticker: 'CTG', setup: w2, price: 41200, pivot: 42000, score: 74, createdAt: Date.now() },
    ];
  }
}

/* ------------------------- UI ------------------------- */
function updateUI() {
  // sync inputs with state
  hydrateMarketInputs();
  hydratePsyInputs();

  populateSelects();
  renderWikiGrid();
  renderAnalysisMenu();
  renderLibrary();
  renderRadar();
  renderJournal();

  calculateStats(); // also refresh dashboard
  updateMarketStatus(false);
  updateSentiment(state.market.sentiment, false);
  updatePsychologyUI();

  calcRisk(); // keep numbers in capital
}

function toast(msg) {
  // minimal toast: use console + alert fallback
  console.log('[CACON]', msg);
}

/* --------------------- TAB & MODAL --------------------- */
function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + id);
  if (btn) btn.classList.add('active');

  if (id === 'dashboard') calculateStats();
  if (id === 'radar') renderRadar();
  if (id === 'analysis') renderAnalysis();
  if (id === 'psychology') updatePsychologyUI();
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
function zoomImage(src) {
  const img = document.getElementById('zoom-img');
  img.src = src;
  openModal('modal-zoom');
}

/* ------------------------ CHARTS ------------------------ */
function initCharts() {
  state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'rgba(148,163,184,0.8)', font: { size: 10, weight: 800 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: 'rgba(148,163,184,0.8)', font: { size: 10, weight: 800 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
  });

  state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['TIỀN MẶT', 'CỔ PHIẾU'], datasets: [{ data: [100, 0], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] },
    options: { responsive: true, cutout: '80%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(148,163,184,0.8)', font: { size: 10, weight: 900 } } } } },
  });
}

function initSentimentGauge() {
  state.charts.sentiment = new Chart(document.getElementById('sentimentGauge').getContext('2d'), {
    type: 'doughnut',
    data: { datasets: [{ data: [50, 50], backgroundColor: ['#10b981', 'rgba(255,255,255,0.05)'], circumference: 180, rotation: 270, borderWidth: 0 }] },
    options: { responsive: true, cutout: '85%', plugins: { tooltip: { enabled: false }, legend: { display: false } } },
  });
}

function rebuildCharts() {
  calculateStats();
  toast('Đã refresh chart.');
}

/* -------------------- DASHBOARD STATS ------------------- */
function calculateStats() {
  const closed = state.journal.filter((t) => safeNum(t.sell) > 0);
  const open = state.journal.filter((t) => safeNum(t.sell) === 0);

  const totalPnL = closed.reduce((acc, t) => acc + (safeNum(t.sell) - safeNum(t.buy)) * safeNum(t.vol), 0);
  const win = closed.filter((t) => safeNum(t.sell) > safeNum(t.buy)).length;
  const winRate = closed.length ? Math.round((win / closed.length) * 100) : 0;

  // Approx R-multiple if SL exists:
  const avgR = closed.length
    ? closed.reduce((acc, t) => {
        const risk = Math.max(1, (safeNum(t.buy) - safeNum(t.sl)));
        const r = (safeNum(t.sell) - safeNum(t.buy)) / risk;
        return acc + (Number.isFinite(r) ? r : 0);
      }, 0) / closed.length
    : 0;

  // allocation (stock value = cost basis for open)
  const stockValue = open.reduce((acc, t) => acc + safeNum(t.buy) * safeNum(t.vol), 0);
  const cash = Math.max(0, safeNum(state.totalCapital) - stockValue + totalPnL); // simplified cash model
  const total = Math.max(1, cash + stockValue);

  // dashboard cards
  setText('dash-balance', fmtVND(safeNum(state.totalCapital) + totalPnL));
  setText('dash-pnl', (totalPnL >= 0 ? '+' : '') + fmtVND(totalPnL).replace('Đ', '') + 'Đ');
  document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#10b981' : '#f43f5e';
  setText('dash-winrate', winRate + '%');
  setText('dash-holding', open.length);

  setText('dash-sub-capital', 'VỐN GỐC: ' + fmtVND(state.totalCapital));
  setText('dash-sub-closed', 'LỆNH ĐÓNG: ' + closed.length);
  setText('dash-sub-avg', 'AVG R: ' + avgR.toFixed(2) + 'R');
  setText('dash-sub-market', 'MARKET: ' + marketLabel());

  setText('dash-cash', fmtVND(cash));
  setText('dash-stock', fmtVND(stockValue));

  // monthly & setup rank tables
  renderMonthlyStats(closed);
  renderSetupRanking(closed);

  // charts
  renderEquityCurve(closed);
  renderAllocationChart(cash, stockValue);
}

function renderMonthlyStats(closed) {
  const stats = {};
  closed.forEach((t) => {
    const month = (t.date || '').slice(0, 7) || '—';
    if (!stats[month]) stats[month] = { count: 0, pnl: 0 };
    stats[month].count += 1;
    stats[month].pnl += (safeNum(t.sell) - safeNum(t.buy)) * safeNum(t.vol);
  });

  const rows = Object.entries(stats)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([m, v]) => {
      const pnlClass = v.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
      return `
        <tr class="border-b border-white/5 uppercase font-bold">
          <td class="p-4 font-mono">${m}</td>
          <td class="p-4 text-center">${v.count} LỆNH</td>
          <td class="p-4 text-right font-black ${pnlClass}">${fmtVND(v.pnl)}</td>
        </tr>`;
    })
    .join('');

  document.getElementById('stats-monthly-body').innerHTML = rows || `<tr><td class="p-4 text-slate-500">CHƯA CÓ DỮ LIỆU</td></tr>`;
}

function renderSetupRanking(closed) {
  const sMap = {};
  closed.forEach((t) => {
    const k = t.setup || '—';
    if (!sMap[k]) sMap[k] = { w: 0, t: 0 };
    sMap[k].t++;
    if (safeNum(t.sell) > safeNum(t.buy)) sMap[k].w++;
  });

  const ranked = Object.entries(sMap)
    .map(([name, v]) => ({ name, wr: v.t ? Math.round((v.w / v.t) * 100) : 0 }))
    .sort((a, b) => b.wr - a.wr);

  document.getElementById('stats-setup-body').innerHTML =
    ranked
      .map(
        (s) => `
        <div class="space-y-1">
          <div class="flex justify-between text-[10px] font-black uppercase">
            <span>${escapeHtml(s.name)}</span>
            <span class="text-emerald-400">${s.wr}%</span>
          </div>
          <div class="h-1 bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500" style="width:${s.wr}%"></div>
          </div>
        </div>`
      )
      .join('') || `<p class="text-slate-500 text-xs">CHƯA CÓ DỮ LIỆU</p>`;
}

function renderEquityCurve(closed) {
  // equity curve over time from closed trades sorted by date
  const sorted = [...closed].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  let cum = 0;
  const labels = [];
  const data = [];

  sorted.forEach((t) => {
    cum += (safeNum(t.sell) - safeNum(t.buy)) * safeNum(t.vol);
    labels.push((t.date || '').slice(5)); // MM-DD
    data.push(safeNum(state.totalCapital) + cum);
  });

  // if no closed trades → show 1 point
  if (labels.length === 0) {
    labels.push('—');
    data.push(safeNum(state.totalCapital));
  }

  state.charts.equity.data.labels = labels;
  state.charts.equity.data.datasets[0].data = data;
  state.charts.equity.update();
}

function renderAllocationChart(cash, stockValue) {
  const total = Math.max(1, cash + stockValue);
  const cashPct = Math.round((cash / total) * 100);
  const stockPct = 100 - cashPct;

  state.charts.allocation.data.datasets[0].data = [cashPct, stockPct];
  state.charts.allocation.update();
}

/* ------------------------- MARKET ------------------------- */
function hydrateMarketInputs() {
  const d = document.getElementById('market-dist-days');
  const s = document.getElementById('market-sectors');

  if (d) d.value = state.market.distDays ?? 0;
  if (s) s.value = state.market.sectors ?? '';
}

function saveMarketSectors() {
  state.market.sectors = (document.getElementById('market-sectors')?.value || '').toUpperCase();
  state.market.updatedAt = Date.now();
  saveState();
}

function suggestLeaders() {
  const preset = 'BANK, CHỨNG KHOÁN, CÔNG NGHỆ, BĐS KCN';
  const el = document.getElementById('market-sectors');
  if (el) el.value = preset;
  saveMarketSectors();
  toast('Đã gợi ý ngành dẫn dắt.');
}

function updateMarketStatus(persist = true) {
  const dist = safeNum(document.getElementById('market-dist-days')?.value ?? state.market.distDays);
  state.market.distDays = dist;

  const box = document.getElementById('dist-alert-box');
  const title = document.getElementById('dist-alert-title');
  const desc = document.getElementById('dist-alert-desc');

  // mapping per your rules
  let t = 'BÌNH THƯỜNG';
  let d = '1–2 ngày phân phối: vẫn có thể giải ngân chọn lọc.';
  let cls = 'bg-emerald-500/10 border border-emerald-500/20';

  if (dist <= 2) {
    t = 'BÌNH THƯỜNG';
    d = '1–2 ngày phân phối: ưu tiên cổ phiếu leader, tránh mua đuổi.';
    cls = 'bg-emerald-500/10 border border-emerald-500/20';
  } else if (dist === 3) {
    t = 'RỦI RO: HẠ MARGIN';
    d = '3 ngày phân phối: siết tiêu chuẩn vào lệnh, giảm margin.';
    cls = 'bg-amber-500/10 border border-amber-500/20';
  } else if (dist === 4) {
    t = 'NGUY CƠ CAO: 50% TIỀN MẶT';
    d = '4 ngày phân phối: ưu tiên phòng thủ, hạ tỷ trọng.';
    cls = 'bg-rose-500/10 border border-rose-500/20';
  } else if (dist >= 5) {
    t = 'CẢNH BÁO: 100% TIỀN MẶT';
    d = '5–6+ ngày phân phối: phòng thủ mạnh, hạn chế mở vị thế mới.';
    cls = 'bg-rose-500/15 border border-rose-500/25';
  }

  if (box) box.className = `mt-4 p-6 rounded-3xl ${cls}`;
  if (title) title.innerText = t;
  if (desc) desc.innerText = d;

  // update analysis + trade modal helper labels
  setText('ana-market', marketLabel());
  setText('dash-sub-market', 'MARKET: ' + marketLabel());
  setText('trade-market-status', marketLabel());

  if (persist) {
    state.market.updatedAt = Date.now();
    saveState();
    calculateStats();
  }
}

function marketLabel() {
  const dist = safeNum(state.market.distDays);
  if (dist <= 2) return 'BÌNH THƯỜNG';
  if (dist === 3) return 'RỦI RO (HẠ MARGIN)';
  if (dist === 4) return 'NGUY CƠ CAO (50% CASH)';
  return 'PHÒNG THỦ (100% CASH)';
}

function pushMarketToJournal() {
  openModal('modal-trade');
  primeTradeModal();
  toast('Đã áp dụng Market Filter vào modal lệnh.');
}

function updateSentiment(val, persist = true) {
  const v = Math.max(0, Math.min(100, safeNum(val)));
  state.market.sentiment = v;

  // gauge
  const a = v;
  const b = 100 - v;
  state.charts.sentiment.data.datasets[0].data = [a, b];
  state.charts.sentiment.update();

  setText('gauge-val', String(v));

  let label = 'TRUNG LẬP';
  if (v <= 25) label = 'SỢ HÃI';
  else if (v >= 75) label = 'THAM LAM';
  setText('gauge-label', label);

  if (persist) {
    state.market.updatedAt = Date.now();
    saveState();
  }
}

/* ------------------------- WIKI ------------------------- */
function populateSelects() {
  // trade setup dropdown
  const tradeSel = document.getElementById('trade-setup');
  const radarSel = document.getElementById('radar-setup');

  const options = state.wiki
    .map((w) => `<option value="${escapeAttr(w.title)}">${escapeHtml(w.title)}</option>`)
    .join('');

  if (tradeSel) tradeSel.innerHTML = options;
  if (radarSel) radarSel.innerHTML = options;
}

function renderWikiGrid() {
  const grid = document.getElementById('wiki-grid');
  if (!grid) return;

  grid.innerHTML = state.wiki
    .map((w) => {
      const list = (w.checklist || []).slice(0, 4).map((c) => `<li class="text-[10px] text-slate-300 font-bold">• ${escapeHtml(c)}</li>`).join('');
      return `
        <div class="glass-panel p-5 hover:border-emerald-500/20 transition cursor-pointer" onclick="openWikiInAnalysis('${w.id}')">
          <div class="aspect-video rounded-2xl overflow-hidden bg-black/30 border border-white/5">
            <img src="${escapeAttr(w.img || '')}" onerror="this.style.display='none'" class="w-full h-full object-cover">
          </div>
          <div class="mt-4 flex items-center justify-between">
            <p class="text-xs font-black text-emerald-300 tracking-widest">${escapeHtml(w.title)}</p>
            <div class="flex gap-2">
              <button class="btn-chip" onclick="event.stopPropagation(); editWiki('${w.id}')">SỬA</button>
              <button class="btn-chip" onclick="event.stopPropagation(); deleteWiki('${w.id}')">XOÁ</button>
            </div>
          </div>
          <ul class="mt-3 space-y-1">${list}</ul>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <button class="btn-chip" onclick="event.stopPropagation(); openWikiInAnalysis('${w.id}')">PHÂN TÍCH</button>
            <button class="btn-chip" onclick="event.stopPropagation(); openModal('modal-trade'); primeTradeModal({setup:'${escapeAttr(w.title)}'});">TẠO LỆNH</button>
          </div>
        </div>`;
    })
    .join('');
}

function openWikiInAnalysis(wikiId) {
  state.analysis.selectedWikiId = wikiId;
  saveState();
  switchTab('analysis');
  renderAnalysis();
}

function saveWiki() {
  const title = (document.getElementById('wiki-title')?.value || '').trim().toUpperCase();
  const img = (document.getElementById('wiki-img')?.value || '').trim();
  const checklistRaw = (document.getElementById('wiki-checklist')?.value || '').trim();

  if (!title) return alert('Nhập tên mẫu hình.');

  const checklist = checklistRaw
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

  state.wiki.unshift({
    id: uid(),
    title,
    img: img || '',
    checklist: checklist.length ? checklist : ['PIVOT RÕ', 'VOL HỖ TRỢ', 'MARKET OK'],
    createdAt: Date.now(),
  });

  // reset fields
  document.getElementById('wiki-title').value = '';
  document.getElementById('wiki-img').value = '';
  document.getElementById('wiki-checklist').value = '';

  closeModal('modal-wiki');
  saveState();
  updateUI();
  toast('Đã lưu mẫu hình mới.');
}

function editWiki(id) {
  const w = state.wiki.find((x) => x.id === id);
  if (!w) return;
  openModal('modal-wiki');
  document.getElementById('wiki-title').value = w.title || '';
  document.getElementById('wiki-img').value = w.img || '';
  document.getElementById('wiki-checklist').value = (w.checklist || []).join('\n');

  // overwrite save action temporarily
  const old = window.saveWiki;
  window.saveWiki = function () {
    w.title = (document.getElementById('wiki-title')?.value || '').trim().toUpperCase();
    w.img = (document.getElementById('wiki-img')?.value || '').trim();
    w.checklist = (document.getElementById('wiki-checklist')?.value || '')
      .split('\n').map((x) => x.trim()).filter(Boolean);

    // restore
    window.saveWiki = old;

    document.getElementById('wiki-title').value = '';
    document.getElementById('wiki-img').value = '';
    document.getElementById('wiki-checklist').value = '';

    closeModal('modal-wiki');
    saveState();
    updateUI();
    toast('Đã cập nhật mẫu hình.');
  };
}

function deleteWiki(id) {
  if (!confirm('Xoá mẫu hình này?')) return;
  state.wiki = state.wiki.filter((x) => x.id !== id);
  if (state.analysis.selectedWikiId === id) state.analysis.selectedWikiId = null;
  saveState();
  updateUI();
}

/* ------------------------ ANALYSIS ------------------------ */
function renderAnalysisMenu() {
  const menu = document.getElementById('analysis-menu');
  if (!menu) return;

  menu.innerHTML = state.wiki
    .map((w) => {
      const active = state.analysis.selectedWikiId === w.id;
      return `
        <button class="w-full text-left px-4 py-3 rounded-2xl border border-white/5 ${active ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/20 hover:bg-white/5'}"
                onclick="openWikiInAnalysis('${w.id}')">
          <div class="text-[10px] text-slate-400 font-black tracking-widest">MẪU</div>
          <div class="text-xs font-black mt-1">${escapeHtml(w.title)}</div>
        </button>`;
    })
    .join('');
}

function renderAnalysis() {
  const selected = state.wiki.find((w) => w.id === state.analysis.selectedWikiId) || state.wiki[0];
  if (!selected) return;

  state.analysis.selectedWikiId = selected.id;

  // set standard img
  const std = document.getElementById('ana-standard-img');
  if (std) std.src = selected.img || '';

  // set selected label
  setText('ana-selected', selected.title || '—');

  // checklist
  const wrap = document.getElementById('ana-checklist');
  if (wrap) {
    const ticks = state.analysis.checklistTicks[selected.id] || new Array((selected.checklist || []).length).fill(false);
    wrap.innerHTML = (selected.checklist || [])
      .map((c, i) => {
        const checked = !!ticks[i];
        return `
          <label class="flex items-start gap-3 p-4 rounded-2xl bg-black/30 border border-white/5 cursor-pointer">
            <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleAnalysisCheck('${selected.id}', ${i}, this.checked)" class="trade-check mt-1">
            <span class="text-[10px] text-slate-200 font-bold">${escapeHtml(c)}</span>
          </label>`;
      })
      .join('');
  }

  // ready label
  const hasReal = !!state.analysis.tempImg;
  const allChecked = (() => {
    const arr = state.analysis.checklistTicks[selected.id] || [];
    return (selected.checklist || []).length ? (arr.filter(Boolean).length === (selected.checklist || []).length) : false;
  })();

  setText('ana-ready', hasReal && allChecked ? 'YES' : 'NO');

  // show transfer button if hasReal
  const btn = document.getElementById('btn-transfer');
  if (btn) btn.classList.toggle('hidden', !hasReal);

  saveState();
  renderAnalysisMenu();
}

function toggleAnalysisCheck(wikiId, idx, checked) {
  const selected = state.wiki.find((w) => w.id === wikiId);
  if (!selected) return;

  const arr = state.analysis.checklistTicks[wikiId] || new Array((selected.checklist || []).length).fill(false);
  arr[idx] = checked;
  state.analysis.checklistTicks[wikiId] = arr;

  saveState();
  renderAnalysis();
}

function handleSlider(v) {
  document.getElementById('slider-overlay').style.width = v + '%';
}

function previewRealChart(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const r = new FileReader();
  r.onload = () => {
    document.getElementById('ana-real-img').src = r.result;
    state.analysis.tempImg = r.result;
    document.getElementById('ana-empty-hint').classList.add('hidden');
    document.getElementById('btn-transfer').classList.remove('hidden');
    saveState();
    renderAnalysis();
  };
  r.readAsDataURL(file);
}

function resetAnalysis() {
  state.analysis.tempImg = null;
  document.getElementById('ana-real-img').src = '';
  document.getElementById('ana-empty-hint').classList.remove('hidden');
  document.getElementById('btn-transfer').classList.add('hidden');
  saveState();
  renderAnalysis();
}

function transferToJournal() {
  // open trade modal, prefill setup + img from analysis
  switchTab('journal');
  openModal('modal-trade');
  const selected = state.wiki.find((w) => w.id === state.analysis.selectedWikiId) || state.wiki[0];
  primeTradeModal({
    setup: selected?.title,
    img: state.analysis.tempImg,
  });
  toast('Đã chuyển thông tin từ Phân Tích → Nhật Ký.');
}

/* ------------------------ JOURNAL ------------------------ */
function primeTradeModal(prefill = {}) {
  // default values
  document.getElementById('trade-date').value = prefill.date || todayISO();
  document.getElementById('trade-ticker').value = (prefill.ticker || '').toUpperCase();

  // setup select
  if (prefill.setup) {
    const sel = document.getElementById('trade-setup');
    if (sel) sel.value = prefill.setup;
  }

  document.getElementById('trade-vol').value = prefill.vol ?? '';
  document.getElementById('trade-buy').value = prefill.buy ?? '';
  document.getElementById('trade-sell').value = prefill.sell ?? '';
  document.getElementById('trade-sl').value = prefill.sl ?? '';
  document.getElementById('trade-riskpct').value = prefill.riskPct ?? 2;

  // image
  if (prefill.img) {
    state._tradeTempImg = prefill.img;
    setText('trade-img-status', 'ẢNH ĐÃ CÓ');
  } else {
    state._tradeTempImg = null;
    setText('trade-img-status', 'CHƯA CÓ');
  }

  // market status
  setText('trade-market-status', marketLabel());

  // reset checklist
  document.querySelectorAll('.trade-check').forEach((c) => (c.checked = false));
  const btn = document.getElementById('btn-save-trade');
  btn.disabled = true;
  btn.classList.add('opacity-50');

  // hint
  setText('trade-tip', `MARKET: ${marketLabel()} | Ngành: ${(state.market.sectors || '—')}`);
}

function attachTradeImage() {
  document.getElementById('trade-img')?.click();
}
function onTradeImgPicked(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    state._tradeTempImg = r.result;
    setText('trade-img-status', 'ẢNH ĐÃ CÓ');
  };
  r.readAsDataURL(file);
}

function saveTrade() {
  const date = document.getElementById('trade-date').value || todayISO();
  const ticker = (document.getElementById('trade-ticker').value || '').trim().toUpperCase();
  const setup = document.getElementById('trade-setup').value || '—';
  const vol = safeNum(document.getElementById('trade-vol').value);
  const buy = safeNum(document.getElementById('trade-buy').value);
  const sell = safeNum(document.getElementById('trade-sell').value);
  const sl = safeNum(document.getElementById('trade-sl').value);
  const riskPct = safeNum(document.getElementById('trade-riskpct').value) || 2;

  if (!ticker) return alert('Nhập mã cổ phiếu.');
  if (!vol || !buy) return alert('Nhập khối lượng và giá mua.');

  const trade = {
    id: uid(),
    date,
    ticker,
    setup,
    vol,
    buy,
    sell: sell > 0 ? sell : 0,
    sl: sl || 0,
    riskPct,
    img: state._tradeTempImg || null,
    notes: '',
    createdAt: Date.now(),
    marketSnapshot: {
      distDays: state.market.distDays,
      sentiment: state.market.sentiment,
      sectors: state.market.sectors,
      label: marketLabel(),
    },
  };

  state.journal.unshift(trade);

  // clean temp img only for trade modal (keep analysis tempImg separate)
  state._tradeTempImg = null;

  saveState();
  closeModal('modal-trade');
  updateUI();
  toast('Đã lưu lệnh.');
}

function renderJournal() {
  const body = document.getElementById('journal-list');
  if (!body) return;

  const closed = state.journal.filter((t) => safeNum(t.sell) > 0);
  const totalPnL = closed.reduce((acc, t) => acc + (safeNum(t.sell) - safeNum(t.buy)) * safeNum(t.vol), 0);

  setText('journal-pnl-sum', fmtVND(totalPnL));
  setText('journal-sub', `TÍNH TỪ ${closed.length} LỆNH ĐÓNG`);

  // summary cards
  setText('j-count', state.journal.length);
  setText('j-closed', closed.length);
  setText('j-open', state.journal.length - closed.length);

  // avg % for closed trades
  const avgPct =
    closed.length
      ? closed.reduce((acc, t) => acc + ((safeNum(t.sell) - safeNum(t.buy)) / Math.max(1, safeNum(t.buy))) * 100, 0) / closed.length
      : 0;
  setText('j-avg', (avgPct >= 0 ? '+' : '') + avgPct.toFixed(1) + '%');

  body.innerHTML = state.journal
    .map((t) => {
      const pnl = safeNum(t.sell) > 0 ? (safeNum(t.sell) - safeNum(t.buy)) * safeNum(t.vol) : 0;
      const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
      const isOpen = safeNum(t.sell) === 0;

      return `
        <tr class="uppercase font-bold">
          <td class="p-5 text-slate-300 font-mono">${escapeHtml(t.date || '—')}</td>
          <td class="p-5">${escapeHtml(t.ticker || '—')}</td>
          <td class="p-5 text-center">
            ${t.img ? `<button class="btn-chip" onclick="zoomImage('${escapeAttr(t.img)}')">XEM</button>` : `<span class="text-slate-600">—</span>`}
          </td>
          <td class="p-5">
            <div class="flex items-center justify-between gap-2">
              <span>${escapeHtml(t.setup || '—')}</span>
              <button class="btn-chip" onclick="openSetupFromJournal('${escapeAttr(t.setup || '')}')">PHÂN TÍCH</button>
            </div>
            <div class="text-[10px] text-slate-500 mt-1">
              MARKET: ${escapeHtml(t.marketSnapshot?.label || '—')}
            </div>
          </td>
          <td class="p-5 text-right font-mono">${safeNum(t.vol).toLocaleString('vi-VN')}</td>
          <td class="p-5 text-right font-mono">
            <div>${safeNum(t.buy).toLocaleString('vi-VN')}</div>
            <div class="text-slate-400">${isOpen ? '—' : safeNum(t.sell).toLocaleString('vi-VN')}</div>
          </td>
          <td class="p-5 text-right font-black ${isOpen ? 'text-slate-600' : pnlClass}">
            ${isOpen ? 'OPEN' : fmtVND(pnl)}
          </td>
          <td class="p-5">
            <div class="flex justify-center gap-2">
              <button class="btn-chip" onclick="editTrade('${t.id}')">SỬA</button>
              <button class="btn-chip" onclick="closeTrade('${t.id}')">${isOpen ? 'ĐÓNG' : 'MỞ LẠI'}</button>
              <button class="btn-chip" onclick="deleteTrade('${t.id}')">XOÁ</button>
            </div>
          </td>
        </tr>`;
    })
    .join('');

  // keep dashboard fresh
  calculateStats();
}

function openSetupFromJournal(setupTitle) {
  const w = state.wiki.find((x) => (x.title || '') === setupTitle);
  if (w) openWikiInAnalysis(w.id);
  else switchTab('analysis');
}

function deleteTrade(id) {
  if (!confirm('Xoá lệnh này?')) return;
  state.journal = state.journal.filter((t) => t.id !== id);
  saveState();
  updateUI();
}

function closeTrade(id) {
  const t = state.journal.find((x) => x.id === id);
  if (!t) return;

  if (safeNum(t.sell) === 0) {
    const p = prompt(`Nhập GIÁ BÁN để đóng lệnh ${t.ticker}:`, String(t.buy));
    const sell = safeNum(p);
    if (!sell) return;
    t.sell = sell;
  } else {
    // reopen
    if (!confirm('Đưa lệnh về trạng thái OPEN (sell=0)?')) return;
    t.sell = 0;
  }
  saveState();
  updateUI();
}

function editTrade(id) {
  const t = state.journal.find((x) => x.id === id);
  if (!t) return;

  openModal('modal-trade');
  // prefill modal
  primeTradeModal({
    date: t.date,
    ticker: t.ticker,
    setup: t.setup,
    vol: t.vol,
    buy: t.buy,
    sell: t.sell,
    sl: t.sl,
    riskPct: t.riskPct,
    img: t.img,
  });

  // overwrite save handler temporarily
  const old = window.saveTrade;
  window.saveTrade = function () {
    t.date = document.getElementById('trade-date').value || t.date;
    t.ticker = (document.getElementById('trade-ticker').value || t.ticker).trim().toUpperCase();
    t.setup = document.getElementById('trade-setup').value || t.setup;
    t.vol = safeNum(document.getElementById('trade-vol').value) || t.vol;
    t.buy = safeNum(document.getElementById('trade-buy').value) || t.buy;
    t.sell = safeNum(document.getElementById('trade-sell').value) || 0;
    t.sl = safeNum(document.getElementById('trade-sl').value) || 0;
    t.riskPct = safeNum(document.getElementById('trade-riskpct').value) || t.riskPct;
    t.img = state._tradeTempImg || t.img || null;

    // restore
    window.saveTrade = old;
    state._tradeTempImg = null;

    saveState();
    closeModal('modal-trade');
    updateUI();
    toast('Đã cập nhật lệnh.');
  };
}

function exportJournal() {
  const data = JSON.stringify(state.journal, null, 2);
  navigator.clipboard?.writeText(data);
  alert('Đã copy JSON vào clipboard (nếu trình duyệt cho phép).');
}

/* ------------------------- RADAR ------------------------- */
function autoImportFromJournal() {
  const tickers = [...new Set(state.journal.map((t) => (t.ticker || '').toUpperCase()).filter(Boolean))];
  const exist = new Set(state.radar.map((r) => r.ticker));
  const setupFallback = state.wiki[0]?.title || '—';

  tickers.forEach((tk) => {
    if (exist.has(tk)) return;
    state.radar.unshift({
      id: uid(),
      ticker: tk,
      setup: setupFallback,
      price: 0,
      pivot: 0,
      score: 60,
      createdAt: Date.now(),
    });
  });

  saveState();
  renderRadar();
  toast('Đã import mã từ Nhật Ký → Radar.');
}

function addRadar() {
  const ticker = (document.getElementById('radar-ticker').value || '').trim().toUpperCase();
  const price = safeNum(document.getElementById('radar-price').value);
  const pivot = safeNum(document.getElementById('radar-pivot').value);
  const setup = document.getElementById('radar-setup').value || '—';
  const score = Math.max(0, Math.min(100, safeNum(document.getElementById('radar-score').value)));

  if (!ticker) return alert('Nhập mã.');
  if (state.radar.some((x) => x.ticker === ticker)) return alert('Mã đã tồn tại trong radar.');

  state.radar.unshift({ id: uid(), ticker, setup, price, pivot, score: score || 60, createdAt: Date.now() });

  // reset
  document.getElementById('radar-ticker').value = '';
  document.getElementById('radar-price').value = '';
  document.getElementById('radar-pivot').value = '';
  document.getElementById('radar-score').value = '';

  saveState();
  renderRadar();
}

function sortRadar(mode) {
  state.ui.radarSort = mode;
  saveState();
  renderRadar();
}

function renderRadar() {
  const body = document.getElementById('radar-body');
  if (!body) return;

  let list = [...state.radar];

  if (state.ui.radarSort === 'score') {
    list.sort((a, b) => safeNum(b.score) - safeNum(a.score));
  } else if (state.ui.radarSort === 'nearPivot') {
    list.sort((a, b) => Math.abs(pctToPivot(a)) - Math.abs(pctToPivot(b)));
  }

  const nearCount = list.filter((r) => Math.abs(pctToPivot(r)) <= 2 && safeNum(r.pivot) > 0 && safeNum(r.price) > 0).length;
  const topScore = list.length ? safeNum(list[0].score) : 0;

  setText('radar-count', list.length);
  setText('radar-near', nearCount);
  setText('radar-top', topScore);

  body.innerHTML = list
    .map((r) => {
      const pct = pctToPivot(r);
      const pctClass = Math.abs(pct) <= 2 ? 'text-emerald-400' : 'text-slate-300';
      return `
        <tr class="uppercase font-bold">
          <td class="p-4">${escapeHtml(r.ticker)}</td>
          <td class="p-4">${escapeHtml(r.setup || '—')}</td>
          <td class="p-4 text-right font-mono">${safeNum(r.price).toLocaleString('vi-VN')}</td>
          <td class="p-4 text-right font-mono">${safeNum(r.pivot).toLocaleString('vi-VN')}</td>
          <td class="p-4 text-right font-mono ${pctClass}">${Number.isFinite(pct) ? (pct > 0 ? '+' : '') + pct.toFixed(1) + '%' : '—'}</td>
          <td class="p-4 text-center font-mono">${safeNum(r.score)}</td>
          <td class="p-4 text-center">
            <div class="flex justify-center gap-2">
              <button class="btn-chip" onclick="radarToAnalysis('${r.id}')">PHÂN TÍCH</button>
              <button class="btn-chip" onclick="radarToTrade('${r.id}')">TẠO LỆNH</button>
              <button class="btn-chip" onclick="deleteRadar('${r.id}')">XOÁ</button>
            </div>
          </td>
        </tr>`;
    })
    .join('');
}

function pctToPivot(r) {
  const p = safeNum(r.price);
  const pv = safeNum(r.pivot);
  if (!p || !pv) return Number.NaN;
  return ((p - pv) / pv) * 100;
}

function radarToAnalysis(id) {
  const r = state.radar.find((x) => x.id === id);
  if (!r) return;
  const w = state.wiki.find((x) => x.title === r.setup) || state.wiki[0];
  if (w) openWikiInAnalysis(w.id);
  else switchTab('analysis');
}

function radarToTrade(id) {
  const r = state.radar.find((x) => x.id === id);
  if (!r) return;
  openModal('modal-trade');
  primeTradeModal({
    ticker: r.ticker,
    setup: r.setup,
    buy: r.price || '',
    riskPct: 2,
  });
  toast('Radar → Nhật ký: đã prefill ticker/setup/giá.');
}

function deleteRadar(id) {
  if (!confirm('Xoá mã khỏi radar?')) return;
  state.radar = state.radar.filter((x) => x.id !== id);
  saveState();
  renderRadar();
}

/* ------------------------- CAPITAL ------------------------- */
function calcRisk() {
  const total = safeNum(document.getElementById('v-total')?.value ?? state.totalCapital);
  const n = Math.max(1, safeNum(document.getElementById('v-n')?.value ?? 1));
  const riskPct = safeNum(document.getElementById('c-risk')?.value ?? 0);
  const buy = safeNum(document.getElementById('c-buy')?.value ?? 0);
  const sl = safeNum(document.getElementById('c-sl')?.value ?? 0);

  // sync capital to state if user edits
  state.totalCapital = total;

  setText('v-per-stock', fmtVND(total / n));
  const riskAmt = total * (riskPct / 100);
  setText('cap-risk-amt', 'RỦI RO TIỀN: ' + fmtVND(riskAmt));

  if (buy > sl && buy > 0 && sl > 0) {
    setText('c-vol-res', Math.floor(riskAmt / (buy - sl)).toLocaleString('vi-VN') + ' CP');
  } else {
    setText('c-vol-res', '0 CP');
  }

  saveState();
}

function pullFromLastTrade() {
  const last = state.journal[0];
  if (!last) return alert('Chưa có lệnh.');
  document.getElementById('c-buy').value = last.buy || '';
  document.getElementById('c-sl').value = last.sl || '';
  calcRisk();
  toast('Đã lấy giá mua/SL từ lệnh gần nhất.');
}

function pushTradeToCapital() {
  const buy = document.getElementById('trade-buy').value;
  const sl = document.getElementById('trade-sl').value;
  const riskPct = document.getElementById('trade-riskpct').value || 2;

  document.getElementById('c-buy').value = buy;
  document.getElementById('c-sl').value = sl;
  document.getElementById('c-risk').value = riskPct;

  switchTab('capital');
  calcRisk();
  toast('Đã đẩy Buy/SL/Risk% sang tab Vốn.');
}

/* ------------------------- LIBRARY ------------------------- */
function renderLibrary() {
  const grid = document.getElementById('library-grid');
  if (!grid) return;

  grid.innerHTML = state.library
    .map(
      (x) => `
      <div class="glass-panel p-6 border border-white/5">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-sky-300">${escapeHtml(x.title)}</h3>
          <button class="btn-chip" onclick="deleteLibrary('${x.id}')">XOÁ</button>
        </div>
        <p class="text-[10px] text-slate-400 mt-2 font-bold">${escapeHtml(x.desc || '')}</p>
        <p class="text-[11px] text-slate-200 mt-4 font-bold normal-case">${escapeHtml(x.content || '')}</p>
      </div>`
    )
    .join('');
}

function addLibraryNote() {
  const title = prompt('Tiêu đề ghi chú:', 'GHI CHÚ');
  if (!title) return;
  const content = prompt('Nội dung:', '…');
  state.library.unshift({
    id: uid(),
    title: String(title).toUpperCase(),
    desc: 'Ghi chú cá nhân',
    content: content || '',
    createdAt: Date.now(),
  });
  saveState();
  renderLibrary();
}

function deleteLibrary(id) {
  if (!confirm('Xoá ghi chú?')) return;
  state.library = state.library.filter((x) => x.id !== id);
  saveState();
  renderLibrary();
}

/* ----------------------- PSYCHOLOGY ---------------------- */
function hydratePsyInputs() {
  const note = document.getElementById('psy-note');
  if (note) note.value = state.psychology.note || '';
}
function toggleHabit(key) {
  state.psychology.habits[key] = !state.psychology.habits[key];
  state.psychology.updatedAt = Date.now();
  saveState();
  updatePsychologyUI();
}
function savePsyNote() {
  state.psychology.note = document.getElementById('psy-note')?.value || '';
  state.psychology.updatedAt = Date.now();
  saveState();
  toast('Đã lưu nhật ký tâm lý.');
}
function updatePsychologyUI() {
  // score from 4 habits
  const h = state.psychology.habits || {};
  const score = (Number(!!h.plan) + Number(!!h.stop) + Number(!!h.journal) + Number(!!h.sleep)) / 4 * 100;
  setText('psy-score', Math.round(score));
  setText('psy-msg', score >= 75 ? 'TỐT' : score >= 50 ? 'TRUNG LẬP' : 'CẦN SIẾT KỶ LUẬT');

  // streak: count last closed W/L chain
  const closed = state.journal.filter((t) => safeNum(t.sell) > 0);
  const last = closed[0];
  setText('psy-last', last ? ((safeNum(last.sell) > safeNum(last.buy)) ? 'WIN' : 'LOSS') : '—');

  let streak = 0;
  for (const t of closed) {
    if (safeNum(t.sell) > safeNum(t.buy)) streak++;
    else break;
  }
  setText('psy-streak', streak);

  // tip
  let tip = 'GIỮ KỶ LUẬT';
  if (safeNum(state.market.distDays) >= 5) tip = 'THỊ TRƯỜNG XẤU: GIẢM GIAO DỊCH';
  else if (score < 50) tip = 'NGHỈ 1 NGÀY + ÔN CHECKLIST';
  else if (streak >= 3) tip = 'CẨN THẬN TỰ TIN QUÁ MỨC';
  setText('psy-tip', tip);
}

/* ------------------------- RESET ------------------------- */
function hardReset() {
  if (!confirm('RESET toàn bộ dữ liệu (localStorage)?')) return;
  localStorage.removeItem(LS.STATE);
  state = loadState();
  updateUI();
  toast('Đã reset.');
}

/* ------------------------- HELPERS ------------------------ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = String(value);
}
function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function escapeAttr(str) {
  return escapeHtml(str).replaceAll('\n', ' ');
}