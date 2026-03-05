let state = {
    totalCap: 2000000000,
    journal: JSON.parse(localStorage.getItem('j_v7')) || [
        { date: '2026-03-01', ticker: 'FPT', setup: 'CỐC TAY CẦM', vol: 1000, buy: 135000, sell: 156000, error: 'ĐÚNG KỶ LUẬT', img: 'https://images.unsplash.com/photo-1611974717482-58fce473656c?w=100' },
        { date: '2026-02-15', ticker: 'MWG', setup: 'NỀN GIÁ PHẲNG', vol: 2000, buy: 62000, sell: 58000, error: 'FOMO', img: null }
    ],
    wiki: JSON.parse(localStorage.getItem('w_v7')) || [
        { id: 'cup', title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', checklist: ['Xu hướng > 30%', 'VCP thắt chặt', 'Vol cạn kiệt tay cầm'] },
        { id: 'flat', title: 'NỀN GIÁ PHẲNG', img: 'https://images.unsplash.com/photo-1611974717482-58fce473656c?w=400', checklist: ['Tích lũy > 5 tuần', 'Biên độ < 15%'] }
    ],
    radar: JSON.parse(localStorage.getItem('r_v7')) || [],
    charts: {},
    tempImg: null
};

window.onload = function() {
    lucide.createIcons();
    initCharts();
    initSentimentGauge();
    updateUI();
    calcCap();
    
    document.addEventListener('change', e => {
        if(e.target.classList.contains('trade-check')) {
            const all = Array.from(document.querySelectorAll('.trade-check')).every(c => c.checked);
            const btn = document.getElementById('btn-save-trade');
            btn.disabled = !all; btn.classList.toggle('opacity-50', !all);
        }
    });
};

function updateUI() {
    calculateJournalStats();
    renderJournal();
    renderPortfolio();
    renderAntiPortfolio();
    renderWikiGrid();
    renderAnalysisMenu();
    updateMarketStatus();
    renderRadar();
    populateSelects();
}

function calculateJournalStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy) * curr.vol, 0);
    const wins = closed.filter(t => t.sell > t.buy).length;
    
    document.getElementById('dash-balance').innerText = (state.totalCap + totalPnL).toLocaleString() + 'Đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString() + 'Đ';
    document.getElementById('dash-winrate').innerText = (closed.length ? Math.round((wins/closed.length)*100) : 0) + '%';
    document.getElementById('dash-holding').innerText = state.journal.filter(t => t.sell == 0).length;

    // Monthly Table
    const monthly = {};
    closed.forEach(t => {
        const m = t.date.substring(0, 7);
        if(!monthly[m]) monthly[m] = { count: 0, win: 0, pnl: 0 };
        monthly[m].count++; monthly[m].pnl += (t.sell - t.buy) * t.vol;
        if(t.sell > t.buy) monthly[m].win++;
    });
    document.getElementById('stats-monthly-body').innerHTML = Object.entries(monthly).map(([m,v]) => `
        <tr class="border-b border-white/5"><td class="p-4 font-mono font-bold">${m}</td><td class="p-4 text-center">${v.count} LỆNH</td><td class="p-4 text-center text-emerald-400">${v.win}</td><td class="p-4 text-center text-rose-400">${v.count-v.win}</td><td class="p-4 text-right font-black ${v.pnl>=0?'text-emerald-400':'text-rose-400'}">${v.pnl.toLocaleString()}Đ</td></tr>
    `).join('');

    // Setup Stats
    const setups = {};
    closed.forEach(t => {
        if(!setups[t.setup]) setups[t.setup] = { win: 0, total: 0 };
        setups[t.setup].total++; if(t.sell > t.buy) setups[t.setup].win++;
    });
    document.getElementById('stats-setup-body').innerHTML = Object.entries(setups).map(([k,v]) => {
        const wr = Math.round((v.win/v.total)*100);
        return `<div><div class="flex justify-between text-[10px] mb-1"><span>${k}</span><span class="text-emerald-400 font-mono">${wr}%</span></div><div class="h-1 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width:${wr}%"></div></div></div>`;
    }).join('');

    let run = state.totalCap;
    state.charts.equity.data.labels = closed.map(t => t.date);
    state.charts.equity.data.datasets[0].data = closed.map(t => { run += (t.sell - t.buy) * t.vol; return run; });
    state.charts.equity.update();

    const invested = state.journal.filter(t => t.sell == 0).reduce((acc, curr) => acc + (curr.buy * curr.vol), 0);
    state.charts.allocation.data.datasets[0].data = [state.totalCap - invested, invested];
    state.charts.allocation.update();
}

function renderPortfolio() {
    const h = {};
    state.journal.forEach(t => {
        if(!h[t.ticker]) h[t.ticker] = { ticker: t.ticker, vol: 0, cost: 0 };
        h[t.ticker].vol += (t.sell > 0 ? 0 : t.vol);
        h[t.ticker].cost += (t.sell > 0 ? 0 : t.buy * t.vol);
    });
    const list = Object.values(h).filter(x => x.vol > 0);
    let totalStock = 0;
    document.getElementById('portfolio-list').innerHTML = list.map(x => {
        totalStock += x.cost;
        return `<tr class="border-b border-white/5"><td class="p-5 font-black text-emerald-400">${x.ticker}</td><td class="p-5 text-right font-mono">${x.vol.toLocaleString()}</td><td class="p-5 text-right font-mono">${(x.cost/x.vol).toLocaleString()}</td><td class="p-5 text-right font-black text-blue-400">${(x.cost/state.totalCap*100).toFixed(1)}%</td><td class="p-5 text-center"><span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px]">ACTIVE</span></td></tr>`;
    }).join('');
    const cashPct = Math.round(((state.totalCap - totalStock) / state.totalCap) * 100);
    document.getElementById('port-ratio').innerText = `${cashPct}% CASH | ${100-cashPct}% STOCK`;
}

function renderAntiPortfolio() {
    const losses = state.journal.filter(t => t.sell > 0 && t.sell < t.buy);
    let totalL = 0; const errs = {};
    document.getElementById('anti-list-body').innerHTML = losses.map(t => {
        const amt = (t.buy - t.sell) * t.vol; totalL += amt;
        errs[t.error] = (errs[t.error] || 0) + 1;
        return `<tr class="hover:bg-rose-500/5 transition"><td class="p-4 font-black">${t.ticker}</td><td class="p-4 text-rose-400 font-bold uppercase text-[9px]">${t.error}</td><td class="p-4 text-right text-rose-500 font-mono">-${amt.toLocaleString()}Đ</td><td class="p-4 text-center"><button onclick="zoomImage('${t.img}')" class="text-[9px] bg-white/5 px-3 py-1 rounded-full">XEM LỖI</button></td></tr>`;
    }).join('');
    document.getElementById('anti-total-loss').innerText = totalL.toLocaleString() + 'Đ';
    document.getElementById('anti-error-rank').innerHTML = Object.entries(errs).map(([n, c]) => `<div class="text-[10px] flex justify-between"><span>${n}</span><span class="text-rose-500">${c} LẦN</span></div><div class="w-full h-1 bg-white/5 rounded-full mt-1 mb-3"><div class="h-full bg-rose-500" style="width:${(c/losses.length)*100}%"></div></div>`).join('');
}

function calcCap() {
    const total = parseFloat(document.getElementById('inp-v-total').value) || 0;
    const n = parseFloat(document.getElementById('inp-v-n').value) || 1;
    const riskPct = parseFloat(document.getElementById('inp-c-risk').value) || 0;
    const buy = parseFloat(document.getElementById('inp-c-buy').value) || 0;
    const sl = parseFloat(document.getElementById('inp-c-sl').value) || 0;
    document.getElementById('val-v-per-stock').innerText = (total / n).toLocaleString() + 'Đ';
    const riskAmt = total * (riskPct / 100);
    const riskPerShare = buy - sl;
    if(riskPerShare > 0) {
        const size = Math.floor(riskAmt / riskPerShare);
        const finalSize = Math.min(size, Math.floor((total/n)/buy));
        document.getElementById('val-c-size').innerText = finalSize.toLocaleString() + ' CP';
        document.getElementById('val-c-risk-sum').innerText = `LỖ TỐI ĐA: ${(finalSize*riskPerShare).toLocaleString()}Đ (${riskPct}%) | GIÁ TRỊ: ${(finalSize*buy).toLocaleString()}Đ`;
    }
}

// Slider & Switch Tab & Modals... (Giống bản trước nhưng tích hợp render Wiki)
function handleSlider(v) { document.getElementById('slider-overlay').style.width = v + '%'; }
function previewRealChart(e) { const r = new FileReader(); r.onload = () => { document.getElementById('ana-real-img').src = r.result; document.getElementById('ana-empty-hint').classList.add('hidden'); }; r.readAsDataURL(e.target.files[0]); }
function switchTab(id) { document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden')); document.getElementById('tab-' + id).classList.remove('hidden'); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById('btn-' + id).classList.add('active'); if(id === 'dashboard') Object.values(state.charts).forEach(c => c.update()); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function zoomImage(src) { if(!src) return; document.getElementById('zoom-img').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

// Radar
function saveRadar() {
    state.radar.push({ cat: document.getElementById('radar-cat').value, ticker: document.getElementById('radar-ticker').value.toUpperCase(), setup: document.getElementById('radar-setup').value, rs: document.getElementById('radar-rs').value, note: document.getElementById('radar-note').value });
    localStorage.setItem('r_v7', JSON.stringify(state.radar));
    closeModal('modal-radar'); updateUI();
}
function renderRadar() {
    const cats = ['near', 'watch', 'long'];
    cats.forEach(c => {
        const grid = document.getElementById('radar-' + c);
        grid.innerHTML = state.radar.filter(r => r.cat === c).map(item => `<div class="glass-panel p-6 space-y-3 animate-in"><div class="flex justify-between items-start"><h2 class="text-2xl font-black font-mono tracking-tighter">${item.ticker}</h2><span class="bg-white/5 text-slate-500 text-[9px] px-2 py-1 rounded">RS: ${item.rs}</span></div>${item.cat==='near'?`<p class="text-[9px] text-emerald-400 font-bold uppercase">${item.setup}</p>`:''}<p class="text-[10px] text-slate-500 italic lowercase">"${item.note}"</p></div>`).join('');
    });
}

function initCharts() {
    state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), { type: 'line', data: { labels: ['T1', 'T2', 'T3'], datasets: [{ data: [2000000000, 2050000000, 2120000000], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), { type: 'doughnut', data: { labels: ['CASH', 'STOCK'], datasets: [{ data: [70, 30], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, cutout: '85%', plugins: { legend: { position: 'bottom' } } } });
    state.charts.sentiment = new Chart(document.getElementById('sentimentGauge').getContext('2d'), { type: 'doughnut', data: { datasets: [{ data: [50, 50], backgroundColor: ['#10b981', 'rgba(255,255,255,0.05)'], circumference: 180, rotation: 270, borderWidth: 0 }] }, options: { responsive: true, cutout: '85%', plugins: { tooltip: { enabled: false } } } });
}
// Các hàm render Wiki, AnalysisMenu và populateSelect tương tự bản trước...