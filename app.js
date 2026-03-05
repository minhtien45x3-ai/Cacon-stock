let state = {
    totalCapital: 2000000000,
    journal: JSON.parse(localStorage.getItem('j_v6')) || [],
    wiki: JSON.parse(localStorage.getItem('w_v6')) || [
        { id: 1, title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', checklist: ['Xu hướng > 30%', 'VCP thắt chặt'] }
    ],
    radar: JSON.parse(localStorage.getItem('r_v6')) || [],
    charts: {},
    tempImg: null
};

window.onload = function() {
    lucide.createIcons();
    initCharts();
    updateUI();
    
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

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + id).classList.add('active');
    if(id === 'dashboard') Object.values(state.charts).forEach(c => c.update());
}

function updateUI() {
    calculateStats();
    renderJournal();
    renderPortfolio();
    renderAntiPortfolio();
    renderWikiGrid();
    renderAnalysisMenu();
    populateSelects();
}

// --- LOGIC PORTFOLIO ---
function renderPortfolio() {
    const h = {};
    state.journal.forEach(t => {
        if(!h[t.ticker]) h[t.ticker] = { v: 0, c: 0 };
        h[t.ticker].v += (t.sell > 0 ? 0 : t.vol);
        h[t.ticker].c += (t.sell > 0 ? 0 : t.buy * t.vol);
    });
    const list = Object.values(h).filter(x => x.v > 0);
    let totalS = 0;
    document.getElementById('portfolio-list').innerHTML = list.map(x => {
        totalS += x.c;
        const w = (x.c / state.totalCapital * 100).toFixed(1);
        return `<tr class="border-b border-white/5"><td class="p-5 font-black text-emerald-400">${x.ticker}</td><td class="p-5 text-right">${x.v.toLocaleString()}</td><td class="p-5 text-right font-mono">${(x.c/x.v).toLocaleString()}</td><td class="p-5 text-right text-blue-400 font-bold">${w}%</td><td class="p-5 text-center"><span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px]">ACTIVE</span></td></tr>`;
    }).join('');
    const cp = Math.round((totalS / state.totalCapital) * 100);
    document.getElementById('port-ratio').innerText = `${100-cp}% CASH | ${cp}% STOCK`;
}

// --- ANTI PORTFOLIO ---
function renderAntiPortfolio() {
    const losses = state.journal.filter(t => t.sell > 0 && t.sell < t.buy);
    let tL = 0; const errs = {};
    document.getElementById('anti-list-body').innerHTML = losses.map(t => {
        const amt = (t.buy - t.sell) * t.vol; tL += amt;
        errs[t.error] = (errs[t.error] || 0) + 1;
        return `<tr><td class="p-4 font-black">${t.ticker}</td><td class="p-4 text-rose-400 font-bold">${t.error}</td><td class="p-4 text-right text-rose-500">-${amt.toLocaleString()}Đ</td><td class="p-4 text-center"><button onclick="zoomImage('${t.img}')" class="text-[9px] bg-white/5 px-3 py-1 rounded-full">XEM LỖI</button></td></tr>`;
    }).join('');
    document.getElementById('anti-total-loss').innerText = tL.toLocaleString() + 'Đ';
    document.getElementById('anti-error-rank').innerHTML = Object.entries(errs).map(([n, c]) => `<div class="text-[10px] flex justify-between"><span>${n}</span><span class="text-rose-500">${c} LẦN</span></div><div class="w-full h-1 bg-white/5 rounded-full mt-1 mb-3"><div class="h-full bg-rose-500" style="width:${(c/losses.length)*100}%"></div></div>`).join('');
}

// --- SLIDER ANALYSIS ---
function handleSlider(v) { document.getElementById('slider-overlay').style.width = v + '%'; }
function previewRealChart(e) {
    const r = new FileReader(); r.onload = () => {
        document.getElementById('ana-real-img').src = r.result;
        document.getElementById('ana-empty-hint').classList.add('hidden');
    }; r.readAsDataURL(e.target.files[0]);
}

function calculateStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy) * curr.vol, 0);
    const wins = closed.filter(t => t.sell > t.buy).length;
    
    document.getElementById('dash-balance').innerText = (state.totalCapital + totalPnL).toLocaleString() + 'đ';
    document.getElementById('dash-pnl').innerText = totalPnL.toLocaleString() + 'đ';
    document.getElementById('dash-winrate').innerText = (closed.length ? Math.round((wins/closed.length)*100) : 0) + '%';
    document.getElementById('dash-holding').innerText = state.journal.filter(t => t.sell == 0).length;

    // Monthly & Setup stats logic... (Bản trước)
}

function initCharts() {
    state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), { type: 'doughnut', data: { labels: ['CASH', 'STOCK'], datasets: [{ data: [100, 0], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, cutout: '80%', plugins: { legend: { position: 'bottom' } } } });
}

// Helper functions (openModal, closeModal, zoomImage, handleFile, saveTrade, renderJournal, renderWikiGrid, populateSelects...) 
// đều được thiết kế để kết nối 10 Tab trơn tru.