let state = {
    totalCapital: 2000000000,
    journal: JSON.parse(localStorage.getItem('j_v5')) || [],
    wiki: JSON.parse(localStorage.getItem('wiki_v4')) || [{ id: 1, title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', checklist: [] }],
    radar: JSON.parse(localStorage.getItem('r_v5')) || [],
    charts: {},
    tempImg: null
};

window.onload = function() {
    lucide.createIcons();
    initCharts();
    initSentimentGauge();
    updateUI();
    calcCap();
    updateMarketStatus();
    
    document.addEventListener('change', e => {
        if(e.target.classList.contains('trade-check')) {
            const checks = document.querySelectorAll('.trade-check');
            const btn = document.getElementById('btn-save-trade');
            const all = Array.from(checks).every(c => c.checked);
            btn.disabled = !all;
            btn.classList.toggle('opacity-50', !all);
            btn.classList.toggle('cursor-not-allowed', !all);
        }
    });
};

function updateUI() {
    calculateStats();
    renderJournal();
    renderPortfolio();
    renderRadar();
    populateSelects();
    renderWikiGrid();
}

function calculateStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy) * curr.vol, 0);
    const winRate = closed.length ? Math.round((closed.filter(t => t.sell > t.buy).length / closed.length) * 100) : 0;
    
    document.getElementById('dash-balance').innerText = (state.totalCapital + totalPnL).toLocaleString() + 'Đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString() + 'Đ';
    document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#10b981' : '#f43f5e';
    document.getElementById('dash-winrate').innerText = winRate + '%';
    document.getElementById('dash-holding').innerText = state.journal.filter(t => t.sell == 0).length;
    document.getElementById('journal-pnl-sum').innerText = totalPnL.toLocaleString() + 'Đ';

    let run = state.totalCapital;
    state.charts.equity.data.labels = closed.map(t => t.date);
    state.charts.equity.data.datasets[0].data = closed.map(t => { run += (t.sell - t.buy) * t.vol; return run; });
    state.charts.equity.update();

    const invested = state.journal.filter(t => t.sell == 0).reduce((acc, curr) => acc + (curr.buy * curr.vol), 0);
    state.charts.allocation.data.datasets[0].data = [state.totalCapital - invested, invested];
    state.charts.allocation.update();
}

function renderPortfolio() {
    const holdings = {};
    state.journal.forEach(t => {
        if(!holdings[t.ticker]) holdings[t.ticker] = { ticker: t.ticker, vol: 0, cost: 0 };
        holdings[t.ticker].vol += (t.sell > 0 ? 0 : t.vol);
        holdings[t.ticker].cost += (t.sell > 0 ? 0 : t.buy * t.vol);
    });
    const list = Object.values(holdings).filter(h => h.vol > 0);
    let totalStockVal = 0;
    document.getElementById('portfolio-list').innerHTML = list.map(h => {
        const avg = h.cost / h.vol;
        totalStockVal += h.cost;
        const weight = (h.cost / state.totalCapital * 100).toFixed(1);
        return `<tr><td class="p-5 font-black text-emerald-400">${h.ticker}</td><td class="p-5 text-right font-mono">${h.vol.toLocaleString()}</td><td class="p-5 text-right font-mono">${avg.toLocaleString()}</td><td class="p-5 text-right font-mono">${h.cost.toLocaleString()}</td><td class="p-5 text-right font-black text-blue-400">${weight}%</td><td class="p-5 text-center"><span class="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px]">ACTIVE</span></td></tr>`;
    }).join('');
    const cashPct = Math.round(((state.totalCapital - totalStockVal) / state.totalCapital) * 100);
    document.getElementById('port-ratio').innerText = `${cashPct}% CASH | ${100-cashPct}% STOCK`;
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
        document.getElementById('val-c-size').innerText = size.toLocaleString() + ' CP';
        document.getElementById('val-c-risk-sum').innerText = `LỖ TỐI ĐA: ${riskAmt.toLocaleString()}Đ (${riskPct}%) | TRỊ GIÁ: ${(size * buy).toLocaleString()}Đ`;
    }
}

function handleFile(e) {
    const reader = new FileReader();
    reader.onload = () => state.tempImg = reader.result;
    reader.readAsDataURL(e.target.files[0]);
}

function saveTrade() {
    const trade = { date: document.getElementById('trade-date').value, ticker: document.getElementById('trade-ticker').value.toUpperCase(), setup: document.getElementById('trade-setup').value, vol: parseFloat(document.getElementById('trade-vol').value) || 0, buy: parseFloat(document.getElementById('trade-buy').value) || 0, sell: parseFloat(document.getElementById('trade-sell').value) || 0, img: state.tempImg };
    state.journal.push(trade);
    localStorage.setItem('j_v5', JSON.stringify(state.journal));
    state.tempImg = null;
    closeModal('modal-trade');
    updateUI();
}

function renderJournal() {
    document.getElementById('journal-list').innerHTML = state.journal.map((t, idx) => {
        const pnl = t.sell > 0 ? (t.sell - t.buy) * t.vol : 0;
        return `<tr class="hover:bg-white/5 transition border-b border-white/5"><td class="p-5 font-mono text-slate-500">${t.date}</td><td class="p-5 font-black text-white text-sm">${t.ticker}</td><td class="p-5 text-center">${t.img ? `<img src="${t.img}" class="w-8 h-8 rounded-lg mx-auto cursor-zoom-in" onclick="zoomImage('${t.img}')">` : '-'}</td><td class="p-5 text-slate-400 text-[10px] font-bold">${t.setup}</td><td class="p-5 text-right font-mono font-bold">${t.vol.toLocaleString()}</td><td class="p-5 text-right font-mono font-bold">${t.buy.toLocaleString()}</td><td class="p-5 text-right font-mono font-bold">${t.sell ? t.sell.toLocaleString() : '-'}</td><td class="p-5 text-right font-mono font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${t.sell ? pnl.toLocaleString() : '-'}</td><td class="p-5 text-center"><button onclick="deleteTrade(${idx})"><i data-lucide="trash-2" class="w-4 h-4 text-rose-500"></i></button></td></tr>`;
    }).join('');
    lucide.createIcons();
}

// ... (Các hàm charts, radar, Wiki zoom ảnh giữ nguyên logic đã tối ưu) ...
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function zoomImage(src) { document.getElementById('zoom-img').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

function initCharts() {
    state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), { type: 'doughnut', data: { labels: ['CASH', 'STOCK'], datasets: [{ data: [100, 0], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, cutout: '80%', plugins: { legend: { position: 'bottom' } } } });
}
function initSentimentGauge() {
    state.charts.sentiment = new Chart(document.getElementById('sentimentGauge').getContext('2d'), { type: 'doughnut', data: { datasets: [{ data: [50, 50], backgroundColor: ['#10b981', 'rgba(255,255,255,0.05)'], circumference: 180, rotation: 270, borderWidth: 0 }] }, options: { responsive: true, cutout: '85%', plugins: { tooltip: { enabled: false } } } });
}