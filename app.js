/* =========================
   TRADING JOURNAL PRO v3.1 (FULL TABS)
   - Full tab như bản cũ
   - Liên kết dữ liệu giữa tab:
     Journal -> Dashboard/System/Month chart
     Wiki -> Analysis/System/Journal setup
     Market -> Analysis ready + Capital/System tips + Radar market-fit gợi ý
     Radar -> click -> Analysis/Journal/Capital
   - Fix lỗi:
     + Chart center
     + Upload Analysis click được
     + Buttons edit/delete/reopen hoạt động
========================= */

const KEY = "TJ_PRO_V31_STATE";

const fmtVND = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "đ";
const fmtPct = (n) => (Number(n || 0)).toFixed(2) + "%";
const safeNum = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
const todayISO = () => new Date().toISOString().slice(0, 10);

let state = loadState();

/* Charts */
let equityChart, monthChart, sentimentChart, radarChart, sysTradesChart;

/* Modal editing */
let editingTradeId = null;
let editingWikiId = null;
let editingRadarId = null;

/* =========================
   BOOT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  initCharts();
  ensureDemoIfEmpty();
  hydrateAll();
  switchTab("dashboard");
  rebuildAll();
});

/* =========================
   STATE
========================= */
function defaultState(){
  return {
    settings: {
      marquee: "Kỷ luật > Cảm xúc • Cắt lỗ nhanh • Chỉ chọn kèo A+ • Market yếu thì giảm tỷ trọng • Không bình quân giá xuống • "
    },
    capital: {
      base: 2000000000,
      equityOverride: 2000000000,
      riskPct: 1
    },
    market: {
      distDays: 2,
      sentiment: 50,
      sectors: "BANK, CÔNG NGHỆ, CHỨNG KHOÁN"
    },
    analysis: {
      selectedWikiId: null,
      realImg: null
    },
    wiki: [],
    journal: [],
    radar: [] // watchlist scoring
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);
    const d = defaultState();
    return {
      ...d,
      ...s,
      settings: {...d.settings, ...(s.settings||{})},
      capital: {...d.capital, ...(s.capital||{})},
      market: {...d.market, ...(s.market||{})},
      analysis: {...d.analysis, ...(s.analysis||{})},
      wiki: Array.isArray(s.wiki) ? s.wiki : [],
      journal: Array.isArray(s.journal) ? s.journal : [],
      radar: Array.isArray(s.radar) ? s.radar : []
    };
  }catch(e){
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(KEY, JSON.stringify(state));
}

/* =========================
   DEMO
========================= */
function ensureDemoIfEmpty(){
  if(state.wiki.length === 0 || state.journal.length === 0 || state.radar.length === 0){
    seedDemo(false);
  }
  applySettingsUI();
}

function seedDemo(force=true){
  if(force){
    state = defaultState();
  }

  state.wiki = [
    {
      id: uid(),
      title: "CỐC TAY CẦM",
      img: "",
      checklist: [
        "ĐÁY TRÒN (6–15 TUẦN)",
        "TAY CẦM (1–5 TUẦN)",
        "VOL KHÔ CẠN TRƯỚC PIVOT",
        "BREAK PIVOT + VOL",
        "MARKET THUẬN + RS TĂNG"
      ],
      createdAt: Date.now()
    },
    {
      id: uid(),
      title: "VCP",
      img: "",
      checklist: [
        "CO HẸP (3–5 ĐỢT)",
        "VOL GIẢM DẦN",
        "BIÊN ĐỘ CHẶT",
        "BREAKOUT CÓ VOL",
        "CẮT LỖ NHANH"
      ],
      createdAt: Date.now()
    },
    {
      id: uid(),
      title: "NỀN PHẲNG",
      img: "",
      checklist: [
        "TỐI THIỂU 5 TUẦN",
        "BIÊN ĐỘ <= 15%",
        "VOL GIẢM",
        "PIVOT RÕ",
        "MARKET OK"
      ],
      createdAt: Date.now()
    }
  ];

  const setup1 = state.wiki[0].title;
  const setup2 = state.wiki[1].title;
  const setup3 = state.wiki[2].title;

  state.journal = [
    { id: uid(), date: "2026-01-10", ticker: "FPT", setup: setup1, vol: 1000, buy: 118000, sell: 132000, stop: 110000, notes: "break pivot vol tăng", img: null },
    { id: uid(), date: "2026-01-28", ticker: "MWG", setup: setup3, vol: 800,  buy: 46500,  sell: 43800,  stop: 43000,  notes: "market yếu → cắt lỗ đúng", img: null },
    { id: uid(), date: "2026-02-12", ticker: "VCB", setup: setup2, vol: 600,  buy: 92500,  sell: 101000, stop: 88000,  notes: "nền chặt, vol khô", img: null },
    { id: uid(), date: "2026-02-25", ticker: "HPG", setup: setup3, vol: 1500, buy: 28300,  sell: 0,      stop: 26800,  notes: "đang nắm giữ", img: null }
  ];

  // Radar demo
  state.radar = [
    { id: uid(), ticker:"FPT", setup: setup1, rs:82, vol:78, base:80, trend:75, marketfit:70, notes:"leader", createdAt:Date.now() },
    { id: uid(), ticker:"VCB", setup: setup2, rs:76, vol:66, base:72, trend:70, marketfit:65, notes:"bank mạnh", createdAt:Date.now() },
    { id: uid(), ticker:"HPG", setup: setup3, rs:60, vol:58, base:62, trend:55, marketfit:60, notes:"watch", createdAt:Date.now() }
  ];

  saveState();
  hydrateAll();
  rebuildAll();

  if(force) alert("Đã nạp DEMO.");
}

/* =========================
   NAV / TABS
========================= */
function switchTab(tab){
  document.querySelectorAll(".tab").forEach(el => el.classList.add("hidden"));
  const active = document.getElementById("tab-" + tab);
  if(active) active.classList.remove("hidden");

  document.querySelectorAll(".tabbtn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("btn-" + tab);
  if(btn) btn.classList.add("active");

  if(tab === "dashboard") rebuildAll();
  if(tab === "market") hydrateMarket();
  if(tab === "radar") renderRadar();
  if(tab === "system") renderSystem();
  if(tab === "analysis") renderAnalysis();
  if(tab === "capital") { hydrateCapital(); calcPosition(); }
  if(tab === "journal") renderJournal();
  if(tab === "wiki") renderWiki();
  if(tab === "settings") hydrateSettings();
}

/* =========================
   CHARTS INIT
========================= */
function initCharts(){
  equityChart = new Chart(document.getElementById("equityChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Equity", data: [], borderColor: "#10b981", fill: true, backgroundColor: "rgba(16,185,129,.08)", pointRadius: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(148,163,184,.9)", font: { size: 11, weight: "800" } } },
        y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(148,163,184,.9)", font: { size: 11, weight: "800" } } }
      }
    }
  });

  monthChart = new Chart(document.getElementById("monthChart"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "PNL tháng", data: [], backgroundColor: "rgba(59,130,246,.6)" }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(148,163,184,.9)", font: { size: 11, weight: "800" } } },
        y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(148,163,184,.9)", font: { size: 11, weight: "800" } } }
      }
    }
  });

  sentimentChart = new Chart(document.getElementById("sentimentChart"), {
    type: "doughnut",
    data: { labels: ["Sentiment", "Rest"], datasets: [{ data: [50, 50], backgroundColor: ["rgba(16,185,129,.9)", "rgba(255,255,255,.07)"], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "78%", plugins: { legend: { display: false }, tooltip: { enabled: false } } }
  });

  radarChart = new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
      labels: ["RS","VOL","BASE","TREND","MKT-FIT"],
      datasets: [{ label: "Score", data: [0,0,0,0,0], borderColor:"#10b981", backgroundColor:"rgba(16,185,129,.10)" }]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        r:{
          suggestedMin:0,
          suggestedMax:100,
          grid:{ color:"rgba(255,255,255,.08)" },
          angleLines:{ color:"rgba(255,255,255,.08)" },
          pointLabels:{ color:"rgba(226,232,240,.92)", font:{ size:11, weight:"800" } },
          ticks:{ display:false }
        }
      }
    }
  });

  sysTradesChart = new Chart(document.getElementById("sysTradesChart"), {
    type:"bar",
    data:{ labels:[], datasets:[
      { label:"Tổng lệnh", data:[], backgroundColor:"rgba(245,158,11,.55)" }
    ]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ grid:{ color:"rgba(255,255,255,.06)" }, ticks:{ color:"rgba(148,163,184,.9)", font:{ size:11, weight:"800" } } },
        y:{ grid:{ color:"rgba(255,255,255,.06)" }, ticks:{ color:"rgba(148,163,184,.9)", font:{ size:11, weight:"800" } } }
      }
    }
  });
}

/* =========================
   HYDRATE
========================= */
function hydrateAll(){
  applySettingsUI();
  hydrateMarket();
  hydrateCapital();
  fillSetupSelect();
  renderWiki();
  renderJournal();
  renderAnalysisMenu();
  renderAnalysis();
  renderRadar();
  renderSystem();
  hydrateSettings();
}

function fillSetupSelect(){
  const selTrade = document.getElementById("t-setup");
  const selRadar = document.getElementById("rm-setup");
  const sysPick = document.getElementById("sysPickSetup");

  const opts = state.wiki.map(w => `<option value="${escapeHtml(w.title)}">${escapeHtml(w.title)}</option>`).join("") || `<option value="—">—</option>`;

  if(selTrade){ selTrade.innerHTML = opts; }
  if(selRadar){ selRadar.innerHTML = opts; }
  if(sysPick){ sysPick.innerHTML = opts; }
}

/* =========================
   DASHBOARD
========================= */
function rebuildAll(){
  calculateDashboard();
  buildEquityChart();
  buildMonthChart();
  renderSystem(); // hệ thống luôn cập nhật
  renderRadar();  // radar cũng cập nhật
  renderCapitalTips();
}

function calculateDashboard(){
  const base = safeNum(state.capital.base);
  const trades = state.journal || [];

  const closed = trades.filter(t => safeNum(t.sell) > 0 && safeNum(t.buy) > 0);
  const open = trades.filter(t => !(safeNum(t.sell) > 0) && safeNum(t.buy) > 0);

  let pnl = 0;
  let wins = 0, losses = 0;
  let sumWin = 0, sumLoss = 0;
  let sumPct = 0;

  const sortedClosed = [...closed].sort((a,b)=> String(a.date).localeCompare(String(b.date)));

  let equity = base;
  let peak = base;
  let maxDD = 0;

  sortedClosed.forEach(t=>{
    const buy = safeNum(t.buy), sell = safeNum(t.sell), vol = safeNum(t.vol);
    const tradePnl = (sell - buy) * vol;
    pnl += tradePnl;

    const pct = buy > 0 ? ((sell - buy) / buy) * 100 : 0;
    sumPct += pct;

    if(tradePnl >= 0){ wins++; sumWin += tradePnl; }
    else { losses++; sumLoss += Math.abs(tradePnl); }

    equity += tradePnl;
    peak = Math.max(peak, equity);
    const dd = peak > 0 ? ((peak - equity)/peak)*100 : 0;
    maxDD = Math.max(maxDD, dd);
  });

  const totalClosed = closed.length;
  const winrate = totalClosed ? (wins/totalClosed)*100 : 0;
  const avgPct = totalClosed ? (sumPct/totalClosed) : 0;
  const avgWin = wins ? (sumWin/wins) : 0;
  const avgLoss = losses ? (sumLoss/losses) : 0;
  const lossRate = 100 - winrate;
  const expectancy = ((winrate/100)*avgWin) - ((lossRate/100)*avgLoss);
  const pf = sumLoss > 0 ? (sumWin / sumLoss) : (sumWin > 0 ? 99 : 0);
  const ept = totalClosed ? (pnl/totalClosed) : 0;

  setText("dash-equity", fmtVND(base + pnl));
  setText("dash-equity-sub", "Vốn gốc: " + fmtVND(base));
  setText("dash-pnl", fmtVND(pnl));
  setText("dash-pnl-sub", "Lệnh đóng: " + totalClosed);
  setText("dash-winrate", fmtPct(winrate));
  setText("dash-winrate-sub", "Avg %: " + fmtPct(avgPct));
  setText("dash-mdd", fmtPct(maxDD));
  setText("dash-mdd-sub", "Profit Factor: " + (Number.isFinite(pf) ? pf.toFixed(2) : "0.00"));

  setText("pro-expect", fmtVND(expectancy));
  setText("pro-pf", (Number.isFinite(pf) ? pf.toFixed(2) : "0.00"));
  setText("pro-avgwin", fmtVND(avgWin));
  setText("pro-avgloss", fmtVND(avgLoss));
  setText("pro-avgpct", fmtPct(avgPct));
  setText("pro-ept", fmtVND(ept));

  setText("j-total", trades.length);
  setText("j-closed", totalClosed);
  setText("j-open", open.length);
  setText("j-avgpct", fmtPct(avgPct));
}

function buildEquityChart(){
  const base = safeNum(state.capital.base);
  const closed = (state.journal||[])
    .filter(t => safeNum(t.sell) > 0 && safeNum(t.buy) > 0)
    .sort((a,b)=> String(a.date).localeCompare(String(b.date)));

  const labels = [];
  const data = [];

  let equity = base;
  labels.push("BASE");
  data.push(equity);

  closed.forEach(t=>{
    const buy = safeNum(t.buy), sell = safeNum(t.sell), vol = safeNum(t.vol);
    equity += (sell - buy) * vol;
    labels.push(String(t.date).slice(5));
    data.push(Math.round(equity));
  });

  equityChart.data.labels = labels;
  equityChart.data.datasets[0].data = data;
  equityChart.update();
}

function buildMonthChart(){
  const closed = (state.journal||[])
    .filter(t => safeNum(t.sell) > 0 && safeNum(t.buy) > 0);

  const map = new Map();
  closed.forEach(t=>{
    const ym = String(t.date||"").slice(0,7) || "NA";
    const pnl = (safeNum(t.sell)-safeNum(t.buy))*safeNum(t.vol);
    map.set(ym, (map.get(ym)||0) + pnl);
  });

  const labels = [...map.keys()].sort();
  const data = labels.map(k => Math.round(map.get(k)));

  monthChart.data.labels = labels.length ? labels : ["—"];
  monthChart.data.datasets[0].data = labels.length ? data : [0];
  monthChart.update();
}

/* =========================
   MARKET
========================= */
function hydrateMarket(){
  const dist = document.getElementById("m-dist");
  const sec = document.getElementById("m-sectors");
  if(dist) dist.value = state.market.distDays;
  if(sec) sec.value = state.market.sectors || "";
  updateMarket(false);
  setSentiment(state.market.sentiment, false);
}

function updateMarket(save){
  const dist = safeNum(document.getElementById("m-dist")?.value);
  const title = document.getElementById("m-title");
  const desc = document.getElementById("m-desc");

  let t="THỊ TRƯỜNG BÌNH THƯỜNG";
  let d="Có thể giao dịch nhưng vẫn ưu tiên kỷ luật.";

  if(dist <= 2){
    t="THỊ TRƯỜNG BÌNH THƯỜNG";
    d="Giữ tỷ trọng hợp lý. Ưu tiên leader & setup đẹp.";
  }else if(dist === 3){
    t="THỊ TRƯỜNG CÓ RỦI RO";
    d="Hạ margin. Chỉ chọn kèo A+ và giảm số lệnh.";
  }else if(dist === 4){
    t="NGUY CƠ CAO";
    d="Hạ tỷ trọng mạnh (gợi ý ~50% tiền mặt).";
  }else{
    t="BẢO TOÀN VỐN";
    d="Đưa về tiền mặt. Chờ market xác nhận uptrend.";
  }

  if(title) title.textContent = t;
  if(desc) desc.textContent = d;

  state.market.distDays = dist;
  if(save){ saveState(); rebuildAll(); }
}

function setSentiment(val, save){
  const v = safeNum(val);
  state.market.sentiment = v;
  const el = document.getElementById("m-sent-val");
  if(el) el.textContent = String(v);

  sentimentChart.data.datasets[0].data = [v, Math.max(0, 100-v)];
  sentimentChart.update();

  if(save){ saveState(); rebuildAll(); }
}

function saveMarketSectors(){
  state.market.sectors = document.getElementById("m-sectors")?.value || "";
  saveState();
}

function suggestSectors(){
  const list = ["BANK", "CÔNG NGHỆ", "CHỨNG KHOÁN", "BÁN LẺ", "KCN", "DẦU KHÍ"];
  state.market.sectors = list.sort(()=>Math.random()-0.5).slice(0,3).join(", ");
  saveState();
  hydrateMarket();
}

function marketLabel(dist){
  dist = safeNum(dist);
  if(dist <= 2) return "BÌNH THƯỜNG";
  if(dist === 3) return "RỦI RO";
  if(dist === 4) return "NGUY CƠ CAO";
  return "TIỀN MẶT";
}

function applyMarketToSystem(){
  alert("Market đã lưu. Hệ thống/Quản lý vốn/Radar sẽ dùng Market hiện tại.");
  rebuildAll();
  switchTab("system");
}

/* =========================
   ANALYSIS
========================= */
function renderAnalysisMenu(){
  const box = document.getElementById("ana-menu");
  if(!box) return;

  box.innerHTML = "";
  state.wiki.forEach(w=>{
    const div = document.createElement("div");
    div.className = "menuItem" + (state.analysis.selectedWikiId===w.id ? " active":"");
    div.innerHTML = `<div style="font-weight:900">${escapeHtml(w.title)}</div>
                     <div class="muted">Checklist: ${w.checklist?.length||0} ý</div>`;
    div.onclick = ()=>selectWikiForAnalysis(w.id);
    box.appendChild(div);
  });
}

function selectWikiForAnalysis(id){
  state.analysis.selectedWikiId = id;
  saveState();
  renderAnalysisMenu();
  renderAnalysis();
}

function triggerAnalysisUpload(){
  document.getElementById("ana-file")?.click();
}

function onAnalysisPicked(e){
  const f = e.target.files?.[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    state.analysis.realImg = r.result;
    saveState();
    renderAnalysis();
  };
  r.readAsDataURL(f);
}

function renderAnalysis(){
  renderAnalysisMenu();
  const selected = state.wiki.find(w=>w.id===state.analysis.selectedWikiId) || null;

  setText("ana-selected", selected ? selected.title : "—");
  setText("ana-market", marketLabel(state.market.distDays));

  const imgTemplate = document.getElementById("img-template");
  if(imgTemplate) imgTemplate.src = (selected?.img || "");

  const ck = document.getElementById("ana-checklist");
  if(ck){
    ck.innerHTML = "";
    const items = selected?.checklist || [];
    if(!items.length){
      ck.innerHTML = `<div class="muted">Chưa có checklist. Hãy tạo mẫu trong Wiki.</div>`;
    }else{
      items.forEach((text, idx)=>{
        const row = document.createElement("label");
        row.className = "ck";
        row.innerHTML = `<input type="checkbox" data-idx="${idx}">
                         <div>${escapeHtml(text)}</div>`;
        row.querySelector("input").addEventListener("change", updateAnalysisReady);
        ck.appendChild(row);
      });
    }
  }

  const imgReal = document.getElementById("img-real");
  const hint = document.getElementById("ana-hint");
  const slider = document.getElementById("slider");

  if(imgReal) imgReal.src = state.analysis.realImg || "";
  const hasReal = !!state.analysis.realImg;
  if(hint) hint.style.display = hasReal ? "none" : "flex";

  // FIX: slider không chặn click khi chưa có ảnh
  if(slider){
    if(hasReal) slider.classList.remove("disabled");
    else slider.classList.add("disabled");
  }

  moveSlider(50);
  updateAnalysisReady();
}

function moveSlider(val){
  const overlay = document.getElementById("overlay");
  if(!overlay) return;
  overlay.style.width = `${safeNum(val)}%`;
}

function updateAnalysisReady(){
  const selected = state.wiki.find(w=>w.id===state.analysis.selectedWikiId) || null;
  const checks = Array.from(document.querySelectorAll("#ana-checklist input[type=checkbox]"));
  const total = checks.length;
  const ticked = checks.filter(x=>x.checked).length;

  const checklistOK = total ? (ticked/total >= 0.7) : false;
  const marketOK = safeNum(state.market.distDays) <= 3;
  const ready = checklistOK && marketOK && !!state.analysis.realImg && !!selected;

  setText("ana-ready", ready ? "YES" : "NO");
}

function pushAnalysisToJournal(){
  const selected = state.wiki.find(w=>w.id===state.analysis.selectedWikiId) || null;
  if(!selected){
    alert("Bạn chưa chọn mẫu hình trong Wiki.");
    return;
  }
  openTradeModal();
  document.getElementById("t-setup").value = selected.title;
}

function resetAnalysis(){
  state.analysis.realImg = null;
  saveState();
  renderAnalysis();
}

/* =========================
   CAPITAL
========================= */
function hydrateCapital(){
  const eq = document.getElementById("cap-equity");
  const rp = document.getElementById("cap-riskpct");
  if(eq) eq.value = state.capital.equityOverride || state.capital.base;
  if(rp) rp.value = state.capital.riskPct ?? 1;
  renderCapitalTips();
}

function calcPosition(){
  const equity = safeNum(document.getElementById("cap-equity")?.value);
  const riskPct = safeNum(document.getElementById("cap-riskpct")?.value);
  const entry = safeNum(document.getElementById("cap-entry")?.value);
  const stop = safeNum(document.getElementById("cap-stop")?.value);

  state.capital.equityOverride = equity || state.capital.base;
  state.capital.riskPct = riskPct || 1;
  saveState();

  const riskMoney = equity * (riskPct/100);
  const slRange = Math.max(0, entry - stop);
  const shares = slRange > 0 ? Math.floor(riskMoney / slRange) : 0;
  const positionValue = shares * entry;

  setText("cap-riskmoney", fmtVND(riskMoney));
  setText("cap-slrange", slRange ? slRange.toLocaleString("vi-VN") : "0");
  setText("cap-shares", shares.toLocaleString("vi-VN") + " CP");
  setText("cap-position", fmtVND(positionValue));
}

function pullFromLastTrade(){
  const last = (state.journal||[]).slice().sort((a,b)=> String(b.date).localeCompare(String(a.date)))[0];
  if(!last){ alert("Chưa có lệnh nào."); return; }
  document.getElementById("cap-entry").value = safeNum(last.buy) || "";
  document.getElementById("cap-stop").value = safeNum(last.stop) || "";
  calcPosition();
}

function pushTradeToCapital(){
  const buy = safeNum(document.getElementById("t-buy")?.value);
  const stop = safeNum(document.getElementById("t-stop")?.value);
  if(buy) document.getElementById("cap-entry").value = buy;
  if(stop) document.getElementById("cap-stop").value = stop;
  switchTab("capital");
  calcPosition();
}

function copyPosition(){
  const text = [
    "RISK TIỀN: " + document.getElementById("cap-riskmoney").textContent,
    "SL RANGE: " + document.getElementById("cap-slrange").textContent,
    "KHỐI LƯỢNG: " + document.getElementById("cap-shares").textContent,
    "VỊ THẾ: " + document.getElementById("cap-position").textContent,
  ].join(" | ");
  navigator.clipboard?.writeText(text);
  alert("Đã copy kết quả.");
}

function renderCapitalTips(){
  const box = document.getElementById("cap-tips");
  if(!box) return;

  const dist = safeNum(state.market.distDays);
  const sent = safeNum(state.market.sentiment);

  const tips = [];
  tips.push(`Market: <b>${escapeHtml(marketLabel(dist))}</b>`);
  if(dist >= 5) tips.push("Ưu tiên <b>TIỀN MẶT</b>. Tránh mở lệnh mới.");
  else if(dist === 4) tips.push("Giảm tỷ trọng mạnh. Chỉ chọn <b>A+</b>.");
  else if(dist === 3) tips.push("Cẩn trọng. Giảm số lệnh & hạ margin.");
  else tips.push("Market ổn. Vẫn phải tuân thủ stop-loss.");

  if(sent >= 80) tips.push("Sentiment cao → dễ FOMO. Giữ kỷ luật điểm mua.");
  if(sent <= 25) tips.push("Sentiment thấp → chỉ mua leader thật sự + nền chặt.");

  // gợi ý theo setup top winrate
  const top = calcSetupStats().slice(0,1)[0];
  if(top) tips.push(`Setup hiệu quả nhất hiện tại: <b>${escapeHtml(top.setup)}</b> (Win ${top.winrate.toFixed(0)}%).`);

  tips.push("Quy tắc: <b>Rủi ro/lệnh 0.5–2%</b>, cắt lỗ nhanh, không bình quân giá xuống.");

  box.innerHTML = tips.map(t=>`<div class="tip">${t}</div>`).join("");
}

/* =========================
   JOURNAL
========================= */
function openTradeModal(tradeId=null){
  editingTradeId = tradeId;

  const m = document.getElementById("tradeModal");
  m.classList.remove("hidden");

  document.getElementById("t-date").value = todayISO();
  document.getElementById("t-ticker").value = "";
  fillSetupSelect();
  document.getElementById("t-vol").value = "";
  document.getElementById("t-buy").value = "";
  document.getElementById("t-sell").value = "0";
  document.getElementById("t-stop").value = "";
  document.getElementById("t-notes").value = "";
  document.getElementById("t-img-status").textContent = "CHƯA CÓ";
  document.getElementById("t-img-file").value = "";
  delete document.getElementById("tradeModal").dataset.tempImg;

  if(tradeId){
    const t = state.journal.find(x=>x.id===tradeId);
    if(t){
      document.getElementById("t-date").value = t.date || todayISO();
      document.getElementById("t-ticker").value = t.ticker || "";
      document.getElementById("t-setup").value = t.setup || (state.wiki[0]?.title || "—");
      document.getElementById("t-vol").value = safeNum(t.vol) || "";
      document.getElementById("t-buy").value = safeNum(t.buy) || "";
      document.getElementById("t-sell").value = safeNum(t.sell) || 0;
      document.getElementById("t-stop").value = safeNum(t.stop) || "";
      document.getElementById("t-notes").value = t.notes || "";
      document.getElementById("t-img-status").textContent = t.img ? "ĐÃ CÓ" : "CHƯA CÓ";
    }
  }
}

function closeTradeModal(){
  document.getElementById("tradeModal").classList.add("hidden");
  editingTradeId = null;
}

function attachTradeImage(){
  document.getElementById("t-img-file")?.click();
}

function onTradeImgPicked(e){
  const f = e.target.files?.[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    document.getElementById("tradeModal").dataset.tempImg = r.result;
    document.getElementById("t-img-status").textContent = "ĐÃ CHÈN";
  };
  r.readAsDataURL(f);
}

function saveTrade(){
  const date = document.getElementById("t-date").value || todayISO();
  const ticker = (document.getElementById("t-ticker").value || "").trim().toUpperCase();
  const setup = document.getElementById("t-setup").value || "—";
  const vol = safeNum(document.getElementById("t-vol").value);
  const buy = safeNum(document.getElementById("t-buy").value);
  const sell = safeNum(document.getElementById("t-sell").value);
  const stop = safeNum(document.getElementById("t-stop").value);
  const notes = (document.getElementById("t-notes").value || "").trim();

  if(!ticker || !vol || !buy){
    alert("Thiếu dữ liệu: Mã / Khối lượng / Giá mua.");
    return;
  }

  const tempImg = document.getElementById("tradeModal").dataset.tempImg || null;

  if(editingTradeId){
    const idx = state.journal.findIndex(x=>x.id===editingTradeId);
    if(idx>=0){
      const old = state.journal[idx];
      state.journal[idx] = { ...old, date, ticker, setup, vol, buy, sell, stop, notes, img: tempImg ? tempImg : old.img };
    }
  }else{
    state.journal.unshift({ id: uid(), date, ticker, setup, vol, buy, sell, stop, notes, img: tempImg || null });
  }

  delete document.getElementById("tradeModal").dataset.tempImg;

  // radar sync nhẹ: nếu mã chưa có radar thì auto add
  autoAddRadarFromTrade({ticker, setup});

  saveState();
  closeTradeModal();
  renderJournal();
  rebuildAll();
}

function renderJournal(){
  const body = document.getElementById("journalBody");
  if(!body) return;

  body.innerHTML = "";

  (state.journal||[]).forEach(t=>{
    const buy = safeNum(t.buy);
    const sell = safeNum(t.sell);
    const pct = (sell>0 && buy>0) ? ((sell-buy)/buy)*100 : 0;
    const status = (sell>0) ? "closed" : "open";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${escapeHtml(t.date||"")}</td>
      <td class="mono">${escapeHtml(t.ticker||"")}</td>
      <td>${escapeHtml(t.setup||"—")}</td>
      <td class="right mono">${safeNum(t.vol).toLocaleString("vi-VN")}</td>
      <td class="right mono">${buy.toLocaleString("vi-VN")}</td>
      <td class="right mono">${sell ? sell.toLocaleString("vi-VN") : "0"}</td>
      <td class="right mono">${sell>0 ? fmtPct(pct) : "—"}</td>
      <td class="center">
        ${t.img ? `<button class="btn chip" onclick="zoomImage('${t.id}')">Xem</button>` : `<span class="muted">—</span>`}
      </td>
      <td class="center">
        <span class="badge ${status}">${status==="closed" ? "ĐÓNG" : "MỞ"}</span>
      </td>
      <td class="center">
        <div class="row gap" style="justify-content:center">
          <button class="btn chip" onclick="editTrade('${t.id}')">Sửa</button>
          <button class="btn chip danger" onclick="deleteTrade('${t.id}')">Xóa</button>
          ${sell>0 ? `<button class="btn chip" onclick="reopenTrade('${t.id}')">Mở lại</button>` : `<button class="btn chip" onclick="closeTrade('${t.id}')">Đóng</button>`}
        </div>
      </td>
    `;
    body.appendChild(tr);
  });

  calculateDashboard();
}

function editTrade(id){ openTradeModal(id); }

function deleteTrade(id){
  if(!confirm("Xóa lệnh này?")) return;
  state.journal = (state.journal||[]).filter(x=>x.id!==id);
  saveState();
  renderJournal();
  rebuildAll();
}

function closeTrade(id){
  const t = state.journal.find(x=>x.id===id);
  if(!t) return;
  const sell = prompt("Nhập giá bán để đóng lệnh:", String(t.sell||0));
  if(sell === null) return;
  t.sell = safeNum(sell);
  saveState();
  renderJournal();
  rebuildAll();
}

function reopenTrade(id){
  const t = state.journal.find(x=>x.id===id);
  if(!t) return;
  t.sell = 0;
  saveState();
  renderJournal();
  rebuildAll();
}

function zoomImage(tradeId){
  const t = state.journal.find(x=>x.id===tradeId);
  if(!t || !t.img) return;
  document.getElementById("zoomImg").src = t.img;
  document.getElementById("zoomModal").classList.remove("hidden");
}

function closeZoom(){
  document.getElementById("zoomModal").classList.add("hidden");
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trading_journal_pro_v31.json";
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   WIKI
========================= */
function renderWiki(){
  const grid = document.getElementById("wikiGrid");
  if(!grid) return;

  grid.innerHTML = "";

  state.wiki.forEach(w=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row between">
        <div>
          <div class="sectionTitle">${escapeHtml(w.title)}</div>
          <div class="sectionSub">Checklist: ${(w.checklist||[]).length} ý</div>
        </div>
        <button class="btn chip" onclick="useWikiInAnalysis('${w.id}')">Phân tích</button>
      </div>

      <div class="mt muted">${escapeHtml((w.checklist||[]).slice(0,4).join(" • "))}${(w.checklist||[]).length>4 ? " ..." : ""}</div>

      <div class="row gap mt">
        <button class="btn chip" onclick="editWiki('${w.id}')">Sửa</button>
        <button class="btn chip danger" onclick="deleteWiki('${w.id}')">Xóa</button>
        ${w.img ? `<button class="btn chip" onclick="zoomWiki('${w.id}')">Xem ảnh</button>` : `<span class="muted">Chưa có ảnh</span>`}
      </div>
    `;
    grid.appendChild(card);
  });

  fillSetupSelect();
  renderAnalysisMenu();
  renderSystem();
}

function useWikiInAnalysis(id){
  state.analysis.selectedWikiId = id;
  saveState();
  switchTab("analysis");
  renderAnalysis();
}

function openWikiModal(id=null){
  editingWikiId = id;
  document.getElementById("wikiModal").classList.remove("hidden");

  document.getElementById("w-title").value = "";
  document.getElementById("w-checklist").value = "";
  document.getElementById("w-img-status").textContent = "CHƯA CÓ";
  document.getElementById("w-img-file").value = "";
  document.getElementById("wikiModal").dataset.tempImg = "";

  if(id){
    const w = state.wiki.find(x=>x.id===id);
    if(w){
      document.getElementById("w-title").value = w.title || "";
      document.getElementById("w-checklist").value = (w.checklist||[]).join("\n");
      document.getElementById("w-img-status").textContent = w.img ? "ĐÃ CÓ" : "CHƯA CÓ";
    }
  }
}

function closeWikiModal(){
  document.getElementById("wikiModal").classList.add("hidden");
  editingWikiId = null;
}

function attachWikiImage(){ document.getElementById("w-img-file")?.click(); }

function onWikiImgPicked(e){
  const f = e.target.files?.[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    document.getElementById("wikiModal").dataset.tempImg = r.result;
    document.getElementById("w-img-status").textContent = "ĐÃ CHÈN";
  };
  r.readAsDataURL(f);
}

function clearWikiImage(){
  document.getElementById("wikiModal").dataset.tempImg = "";
  document.getElementById("w-img-status").textContent = "CHƯA CÓ";
  const f = document.getElementById("w-img-file");
  if(f) f.value = "";
}

function saveWiki(){
  const title = (document.getElementById("w-title").value || "").trim().toUpperCase();
  const checklistRaw = (document.getElementById("w-checklist").value || "").trim();
  const checklist = checklistRaw ? checklistRaw.split("\n").map(x=>x.trim()).filter(Boolean) : [];

  if(!title){
    alert("Thiếu tên mẫu.");
    return;
  }

  const tempImg = document.getElementById("wikiModal").dataset.tempImg || "";

  if(editingWikiId){
    const idx = state.wiki.findIndex(x=>x.id===editingWikiId);
    if(idx>=0){
      const old = state.wiki[idx];
      state.wiki[idx] = { ...old, title, checklist, img: tempImg ? tempImg : old.img };
    }
  }else{
    state.wiki.unshift({ id: uid(), title, checklist, img: tempImg || "", createdAt: Date.now() });
  }

  document.getElementById("wikiModal").dataset.tempImg = "";

  saveState();
  closeWikiModal();
  renderWiki();
}

function editWiki(id){ openWikiModal(id); }

function deleteWiki(id){
  if(!confirm("Xóa mẫu hình này?")) return;
  state.wiki = (state.wiki||[]).filter(x=>x.id!==id);

  if(state.analysis.selectedWikiId === id){
    state.analysis.selectedWikiId = null;
  }

  saveState();
  renderWiki();
  renderAnalysis();
}

function zoomWiki(id){
  const w = state.wiki.find(x=>x.id===id);
  if(!w || !w.img) return;
  document.getElementById("zoomImg").src = w.img;
  document.getElementById("zoomModal").classList.remove("hidden");
}

/* =========================
   RADAR
========================= */
function scoreRadar(r){
  // Weighted score
  const rs = safeNum(r.rs), vol = safeNum(r.vol), base = safeNum(r.base), trend = safeNum(r.trend), mf = safeNum(r.marketfit);
  const w = { rs:.25, vol:.20, base:.25, trend:.15, mf:.15 };
  return Math.round(rs*w.rs + vol*w.vol + base*w.base + trend*w.trend + mf*w.mf);
}

function actionByScore(score){
  if(score >= 80) return "BREAKOUT";
  if(score >= 60) return "WATCH";
  if(score >= 40) return "EARLY";
  return "AVOID";
}

function renderRadar(){
  const body = document.getElementById("radarBody");
  if(!body) return;

  const list = (state.radar||[]).map(x => ({...x, score: scoreRadar(x)}));

  body.innerHTML = "";
  list.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${escapeHtml(r.ticker)}</td>
      <td>${escapeHtml(r.setup||"—")}</td>
      <td class="right mono">${r.score}</td>
      <td class="center"><span class="badge ${r.score>=60 ? "closed":"open"}">${escapeHtml(actionByScore(r.score))}</span></td>
      <td class="center">
        <div class="row gap" style="justify-content:center">
          <button class="btn chip" onclick="selectRadar('${r.id}')">Xem</button>
          <button class="btn chip" onclick="editRadar('${r.id}')">Sửa</button>
          <button class="btn chip danger" onclick="deleteRadar('${r.id}')">Xóa</button>
        </div>
      </td>
    `;
    body.appendChild(tr);
  });

  // auto select first
  if(list.length){
    if(!state.radarSelectedId || !state.radar.find(x=>x.id===state.radarSelectedId)){
      state.radarSelectedId = list[0].id;
    }
    selectRadar(state.radarSelectedId, false);
  }else{
    setText("r-selected","—");
    setText("r-score","0");
    setText("r-action","—");
    radarChart.data.datasets[0].data = [0,0,0,0,0];
    radarChart.update();
  }
}

function sortRadar(by){
  if(by === "score"){
    state.radar.sort((a,b)=> scoreRadar(b)-scoreRadar(a));
    saveState();
    renderRadar();
  }
}

function openRadarModal(id=null){
  editingRadarId = id;
  document.getElementById("radarModal").classList.remove("hidden");

  fillSetupSelect();
  document.getElementById("rm-ticker").value = "";
  document.getElementById("rm-notes").value = "";
  document.getElementById("rm-rs").value = 70;
  document.getElementById("rm-vol").value = 65;
  document.getElementById("rm-base").value = 75;
  document.getElementById("rm-trend").value = 60;
  document.getElementById("rm-marketfit").value = 70;

  if(id){
    const r = state.radar.find(x=>x.id===id);
    if(r){
      document.getElementById("rm-ticker").value = r.ticker || "";
      document.getElementById("rm-setup").value = r.setup || (state.wiki[0]?.title || "—");
      document.getElementById("rm-rs").value = safeNum(r.rs);
      document.getElementById("rm-vol").value = safeNum(r.vol);
      document.getElementById("rm-base").value = safeNum(r.base);
      document.getElementById("rm-trend").value = safeNum(r.trend);
      document.getElementById("rm-marketfit").value = safeNum(r.marketfit);
      document.getElementById("rm-notes").value = r.notes || "";
    }
  }
}

function closeRadarModal(){
  document.getElementById("radarModal").classList.add("hidden");
  editingRadarId = null;
}

function saveRadar(){
  const ticker = (document.getElementById("rm-ticker").value || "").trim().toUpperCase();
  const setup = document.getElementById("rm-setup").value || "—";
  if(!ticker){ alert("Thiếu mã."); return; }

  const data = {
    ticker,
    setup,
    rs: safeNum(document.getElementById("rm-rs").value),
    vol: safeNum(document.getElementById("rm-vol").value),
    base: safeNum(document.getElementById("rm-base").value),
    trend: safeNum(document.getElementById("rm-trend").value),
    marketfit: safeNum(document.getElementById("rm-marketfit").value),
    notes: (document.getElementById("rm-notes").value || "").trim()
  };

  if(editingRadarId){
    const idx = state.radar.findIndex(x=>x.id===editingRadarId);
    if(idx>=0){
      state.radar[idx] = { ...state.radar[idx], ...data };
    }
  }else{
    // tránh trùng ticker
    const exist = state.radar.find(x=>x.ticker===ticker);
    if(exist){
      exist.setup = data.setup;
      exist.rs = data.rs; exist.vol=data.vol; exist.base=data.base; exist.trend=data.trend; exist.marketfit=data.marketfit;
      exist.notes=data.notes;
    }else{
      state.radar.unshift({ id: uid(), ...data, createdAt: Date.now() });
    }
  }

  saveState();
  closeRadarModal();
  renderRadar();
}

function editRadar(id){ openRadarModal(id); }

function deleteRadar(id){
  if(!confirm("Xóa mã này khỏi radar?")) return;
  state.radar = state.radar.filter(x=>x.id!==id);
  saveState();
  renderRadar();
}

function selectRadar(id, save=true){
  state.radarSelectedId = id;
  const r = state.radar.find(x=>x.id===id);
  if(!r) return;

  const score = scoreRadar(r);
  setText("r-selected", r.ticker);
  setText("r-score", score);
  setText("r-action", actionByScore(score));

  radarChart.data.datasets[0].data = [safeNum(r.rs), safeNum(r.vol), safeNum(r.base), safeNum(r.trend), safeNum(r.marketfit)];
  radarChart.update();

  // đẩy sang capital (entry/stop người dùng tự nhập) -> chỉ gợi ý
  if(save){ saveState(); }
}

function syncRadarFromJournal(){
  const tickers = [...new Set((state.journal||[]).map(t=>String(t.ticker||"").toUpperCase()).filter(Boolean))];
  tickers.forEach(tk=>{
    if(!state.radar.find(r=>r.ticker===tk)){
      state.radar.push({ id: uid(), ticker: tk, setup: (state.wiki[0]?.title||"—"), rs:60, vol:60, base:60, trend:60, marketfit:60, notes:"sync from journal", createdAt: Date.now() });
    }
  });
  saveState();
  renderRadar();
  alert("Đã sync Radar từ Nhật ký.");
}

function autoAddRadarFromTrade(tr){
  const tk = String(tr.ticker||"").toUpperCase();
  if(!tk) return;
  if(!state.radar.find(r=>r.ticker===tk)){
    state.radar.unshift({ id: uid(), ticker: tk, setup: tr.setup||"—", rs:60, vol:60, base:60, trend:60, marketfit:60, notes:"auto from trade", createdAt: Date.now() });
  }
}

/* =========================
   SYSTEM
========================= */
function calcSetupStats(){
  const closed = (state.journal||[]).filter(t => safeNum(t.sell)>0 && safeNum(t.buy)>0);
  const map = new Map(); // setup -> stats

  closed.forEach(t=>{
    const setup = t.setup || "—";
    const buy = safeNum(t.buy), sell = safeNum(t.sell), vol = safeNum(t.vol);
    const pnl = (sell-buy)*vol;
    const pct = buy>0 ? ((sell-buy)/buy)*100 : 0;

    if(!map.has(setup)) map.set(setup, { setup, count:0, wins:0, pnl:0, sumPct:0 });
    const s = map.get(setup);
    s.count++;
    s.pnl += pnl;
    s.sumPct += pct;
    if(pnl >= 0) s.wins++;
  });

  const arr = [...map.values()].map(x=>{
    const winrate = x.count ? (x.wins/x.count)*100 : 0;
    const avgPct = x.count ? (x.sumPct/x.count) : 0;
    return { ...x, winrate, avgPct };
  });

  arr.sort((a,b)=> b.winrate - a.winrate || b.pnl - a.pnl);
  return arr;
}

function renderSystem(){
  // setup ranking table
  const tbody = document.getElementById("sysSetupBody");
  if(tbody){
    const stats = calcSetupStats();
    tbody.innerHTML = stats.length ? "" : `<tr><td colspan="5" class="muted">Chưa có lệnh đóng để thống kê.</td></tr>`;
    stats.forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(s.setup)}</td>
        <td class="right mono">${s.count}</td>
        <td class="right mono">${s.winrate.toFixed(0)}%</td>
        <td class="right mono">${s.avgPct.toFixed(2)}%</td>
        <td class="right mono">${fmtVND(s.pnl)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // trades per month chart
  const map = new Map(); // ym -> count
  (state.journal||[]).forEach(t=>{
    const ym = String(t.date||"").slice(0,7) || "NA";
    map.set(ym, (map.get(ym)||0) + 1);
  });
  const labels = [...map.keys()].sort();
  const data = labels.map(k=>map.get(k));
  if(sysTradesChart){
    sysTradesChart.data.labels = labels.length ? labels : ["—"];
    sysTradesChart.data.datasets[0].data = labels.length ? data : [0];
    sysTradesChart.update();
  }

  // tips
  const tipsBox = document.getElementById("sysTips");
  if(tipsBox){
    const dist = safeNum(state.market.distDays);
    const stats = calcSetupStats();
    const top = stats[0];
    const msg = [];
    msg.push(`Market: <b>${escapeHtml(marketLabel(dist))}</b> • Distribution: <b>${dist}</b>`);
    if(top) msg.push(`Setup mạnh nhất: <b>${escapeHtml(top.setup)}</b> (Win ${top.winrate.toFixed(0)}%, Avg ${top.avgPct.toFixed(1)}%).`);
    if(dist>=4) msg.push("Gợi ý: <b>giảm tần suất giao dịch</b>, ưu tiên bảo toàn vốn.");
    else msg.push("Gợi ý: chọn <b>A+</b>, chỉ mua khi market + setup đồng thuận.");
    tipsBox.innerHTML = msg.map(t=>`<div class="tip">${t}</div>`).join("");
  }

  // setup picker + checklist
  fillSetupSelect();
  renderSystemChecklist();
}

function renderSystemChecklist(){
  const sel = document.getElementById("sysPickSetup");
  const box = document.getElementById("sysChecklist");
  if(!sel || !box) return;

  const setupTitle = sel.value;
  const w = state.wiki.find(x=>x.title===setupTitle);

  box.innerHTML = "";
  const items = w?.checklist || [];
  if(!items.length){
    box.innerHTML = `<div class="muted">Chưa có checklist cho setup này. Hãy bổ sung trong Wiki.</div>`;
    return;
  }

  items.forEach(text=>{
    const row = document.createElement("div");
    row.className = "ck";
    row.innerHTML = `<input type="checkbox"><div>${escapeHtml(text)}</div>`;
    box.appendChild(row);
  });
}

/* =========================
   SETTINGS + IMPORT CSV/JSON
========================= */
function applySettingsUI(){
  const marquee = document.getElementById("marqueeText");
  if(marquee){
    const t = state.settings.marquee || "";
    marquee.textContent = t + t; // lặp để chạy mượt
  }
}

function hydrateSettings(){
  const base = document.getElementById("s-base");
  const risk = document.getElementById("s-risk");
  const marq = document.getElementById("s-marquee");

  if(base) base.value = safeNum(state.capital.base);
  if(risk) risk.value = safeNum(state.capital.riskPct);
  if(marq) marq.value = state.settings.marquee || "";
}

function saveSettings(){
  state.capital.base = safeNum(document.getElementById("s-base")?.value) || state.capital.base;
  state.capital.riskPct = safeNum(document.getElementById("s-risk")?.value) || state.capital.riskPct;
  state.settings.marquee = document.getElementById("s-marquee")?.value || state.settings.marquee;

  saveState();
  applySettingsUI();
  rebuildAll();
  alert("Đã lưu cài đặt.");
}

function triggerImport(){
  document.getElementById("importFile")?.click();
}

function onImportJSON(e){
  const f = e.target.files?.[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const data = JSON.parse(r.result);
      // merge soft
      const d = defaultState();
      state = {
        ...d,
        ...data,
        settings: {...d.settings, ...(data.settings||{})},
        capital: {...d.capital, ...(data.capital||{})},
        market: {...d.market, ...(data.market||{})},
        analysis: {...d.analysis, ...(data.analysis||{})},
        wiki: Array.isArray(data.wiki)?data.wiki:[],
        journal: Array.isArray(data.journal)?data.journal:[],
        radar: Array.isArray(data.radar)?data.radar:[]
      };
      saveState();
      hydrateAll();
      rebuildAll();
      alert("Import JSON thành công.");
    }catch(err){
      alert("File JSON lỗi.");
    }
  };
  r.readAsText(f);
}

function pasteCSVSample(){
  const box = document.getElementById("csvBox");
  if(!box) return;
  box.value =
`2026-03-01,FPT,VCP,1000,120000,0,114000,breakout
2026-03-02,VCB,NỀN PHẲNG,500,92000,98000,88000,ok
2026-03-03,MWG,CỐC TAY CẦM,800,47000,52000,44500,good`;
}

function clearCSV(){
  const box = document.getElementById("csvBox");
  if(box) box.value = "";
  setText("csvMsg","—");
}

function importCSV(){
  const raw = document.getElementById("csvBox")?.value || "";
  const msg = document.getElementById("csvMsg");
  if(!raw.trim()){
    if(msg) msg.textContent = "CSV trống.";
    return;
  }

  const lines = raw.split("\n").map(x=>x.trim()).filter(Boolean);
  let ok=0, fail=0;

  lines.forEach(line=>{
    const parts = line.split(",").map(x=>x.trim());
    if(parts.length < 7){ fail++; return; }

    const [date,ticker,setup,vol,buy,sell,stop,...rest] = parts;
    const notes = rest.join(",");

    const t = {
      id: uid(),
      date: date || todayISO(),
      ticker: (ticker||"").toUpperCase(),
      setup: setup || "—",
      vol: safeNum(vol),
      buy: safeNum(buy),
      sell: safeNum(sell),
      stop: safeNum(stop),
      notes: notes || "",
      img: null
    };

    if(!t.ticker || !t.vol || !t.buy){ fail++; return; }
    state.journal.unshift(t);
    autoAddRadarFromTrade(t);
    ok++;
  });

  saveState();
  rebuildAll();
  renderJournal();
  if(msg) msg.textContent = `IMPORT xong: OK ${ok} • FAIL ${fail}`;
}

/* =========================
   RESET
========================= */
function hardReset(){
  if(!confirm("RESET toàn bộ dữ liệu?")) return;
  localStorage.removeItem(KEY);
  state = defaultState();
  saveState();
  hydrateAll();
  rebuildAll();
  switchTab("dashboard");
}

/* =========================
   HELPERS
========================= */
function setText(id, txt){
  const el = document.getElementById(id);
  if(el) el.textContent = String(txt);
}
function escapeHtml(str){
  return String(str || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================
   Expose for onclick
========================= */
window.switchTab = switchTab;
window.seedDemo = seedDemo;
window.hardReset = hardReset;
window.rebuildAll = rebuildAll;

window.updateMarket = updateMarket;
window.setSentiment = setSentiment;
window.saveMarketSectors = saveMarketSectors;
window.suggestSectors = suggestSectors;
window.applyMarketToSystem = applyMarketToSystem;

window.triggerAnalysisUpload = triggerAnalysisUpload;
window.onAnalysisPicked = onAnalysisPicked;
window.moveSlider = moveSlider;
window.pushAnalysisToJournal = pushAnalysisToJournal;
window.resetAnalysis = resetAnalysis;

window.calcPosition = calcPosition;
window.pullFromLastTrade = pullFromLastTrade;
window.pushTradeToCapital = pushTradeToCapital;
window.copyPosition = copyPosition;

window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;
window.attachTradeImage = attachTradeImage;
window.onTradeImgPicked = onTradeImgPicked;
window.saveTrade = saveTrade;
window.editTrade = editTrade;
window.deleteTrade = deleteTrade;
window.closeTrade = closeTrade;
window.reopenTrade = reopenTrade;
window.zoomImage = zoomImage;
window.closeZoom = closeZoom;
window.exportJSON = exportJSON;

window.openWikiModal = openWikiModal;
window.closeWikiModal = closeWikiModal;
window.attachWikiImage = attachWikiImage;
window.onWikiImgPicked = onWikiImgPicked;
window.clearWikiImage = clearWikiImage;
window.saveWiki = saveWiki;
window.editWiki = editWiki;
window.deleteWiki = deleteWiki;
window.useWikiInAnalysis = useWikiInAnalysis;
window.zoomWiki = zoomWiki;

window.openRadarModal = openRadarModal;
window.closeRadarModal = closeRadarModal;
window.saveRadar = saveRadar;
window.editRadar = editRadar;
window.deleteRadar = deleteRadar;
window.selectRadar = selectRadar;
window.syncRadarFromJournal = syncRadarFromJournal;
window.sortRadar = sortRadar;

window.renderSystemChecklist = renderSystemChecklist;

window.saveSettings = saveSettings;
window.triggerImport = triggerImport;
window.onImportJSON = onImportJSON;
window.pasteCSVSample = pasteCSVSample;
window.importCSV = importCSV;
window.clearCSV = clearCSV;