// --- DATABASE & STATE ---
let state = {
    totalCapital: 2000000000,
    journal: JSON.parse(localStorage.getItem('j_v9')) || [
        { date: '2026-03-01', ticker: 'FPT', setup: 'CỐC TAY CẦM', vol: 1000, buy: 135000, sell: 156000, img: null }
    ],
    wiki: JSON.parse(localStorage.getItem('w_v9')) || [
        { id: 1, title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', checklist: ['Đáy tròn', 'Tay cầm thắt chặt', 'Pivot vol lớn'] }
    ],
    radar: JSON.parse(localStorage.getItem('r_v9')) || [],
    library: [
        { title: 'HỆ THỐNG CANSLIM', desc: 'Chọn siêu cổ phiếu tăng trưởng bền vững.', content: 'C-A-N-S-L-I-M: William O\'Neil methodology.' }
    ],
    charts: {},
    tempImg: null
};

window.onload = function() {
    lucide.createIcons();
    initCharts();
    initSentimentGauge();
    updateUI();
    
    // Checklist logic
    document.addEventListener('change', e => {
        if(e.target.classList.contains('trade-check')) {
            const all = Array.from(document.querySelectorAll('.trade-check')).every(c => c.checked);
            const btn = document.getElementById('btn-save-trade');
            btn.disabled = !all; btn.classList.toggle('opacity-50', !all);
        }
    });
};

function updateUI() {
    calculateStats();
    renderJournal();
    renderWikiGrid();
    renderAnalysisMenu();
    renderLibrary();
    populateSelects();
    updateMarketStatus();
}

// --- ANALYSIS & SLIDER ---
function handleSlider(v) { document.getElementById('slider-overlay').style.width = v + '%'; }

function previewRealChart(e) {
    const r = new FileReader(); r.onload = () => {
        document.getElementById('ana-real-img').src = r.result;
        state.tempImg = r.result;
        document.getElementById('ana-empty-hint').classList.add('hidden');
        document.getElementById('btn-transfer').classList.remove('hidden');
    }; r.readAsDataURL(e.target.files[0]);
}

function transferToJournal() {
    switchTab('journal');
    openModal('modal-trade');
    document.getElementById('trade-img-status').innerText = "ẢNH ĐÃ CÓ (TỪ PHÂN TÍCH)";
}

// --- TOTAL STATS (LINKED) ---
function calculateStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy) * curr.vol, 0);
    const winRate = closed.length ? Math.round((closed.filter(t => t.sell > t.buy).length / closed.length) * 100) : 0;
    
    document.getElementById('dash-balance').innerText = (state.totalCapital + totalPnL).toLocaleString() + 'Đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString() + 'Đ';
    document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#10b981' : '#f43f5e';
    document.getElementById('dash-winrate').innerText = winRate + '%';
    document.getElementById('dash-holding').innerText = state.journal.filter(t => t.sell == 0).length;

    // Monthly & Setup rank logic
    renderMonthlyStats(closed);
    renderSetupRanking(closed);
}

function renderMonthlyStats(closed) {
    const stats = {};
    closed.forEach(t => {
        const month = t.date.substring(0, 7);
        if(!stats[month]) stats[month] = { count: 0, pnl: 0 };
        stats[month].count++; stats[month].pnl += (t.sell - t.buy) * t.vol;
    });
    document.getElementById('stats-monthly-body').innerHTML = Object.entries(stats).map(([m,v]) => `
        <tr class="border-b border-white/5 uppercase font-bold">
            <td class="p-4 font-mono">${m}</td><td class="p-4 text-center">${v.count} LỆNH</td>
            <td class="p-4 text-right font-black ${v.pnl>=0?'text-emerald-400':'text-rose-400'}">${v.pnl.toLocaleString()}Đ</td>
        </tr>`).join('');
}

function renderSetupRanking(closed) {
    const sMap = {};
    closed.forEach(t => {
        if(!sMap[t.setup]) sMap[t.setup] = { w: 0, t: 0 };
        sMap[t.setup].t++; if(t.sell > t.buy) sMap[t.setup].w++;
    });
    const ranked = Object.entries(sMap).map(([k,v]) => ({ name: k, wr: Math.round((v.w/v.t)*100) })).sort((a,b) => b.wr - a.wr);
    document.getElementById('stats-setup-body').innerHTML = ranked.map(s => `
        <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-black uppercase"><span>${s.name}</span><span class="text-emerald-400">${s.wr}%</span></div>
            <div class="h-1 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width: ${s.wr}%"></div></div>
        </div>`).join('');
}

// --- CAPITAL ---
function calcRisk() {
    const total = parseFloat(document.getElementById('v-total').value) || 0;
    const n = parseFloat(document.getElementById('v-n').value) || 1;
    const riskPct = parseFloat(document.getElementById('c-risk').value) || 0;
    const buy = parseFloat(document.getElementById('c-buy').value) || 0;
    const sl = parseFloat(document.getElementById('c-sl').value) || 0;

    document.getElementById('v-per-stock').innerText = (total / n).toLocaleString() + 'Đ';
    const riskAmt = total * (riskPct / 100);
    if(buy > sl) {
        document.getElementById('c-vol-res').innerText = Math.floor(riskAmt / (buy - sl)).toLocaleString() + ' CP';
    }
}

// --- COMMON HELPERS ---
function switchTab(id) { document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden')); document.getElementById('tab-' + id).classList.remove('hidden'); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById('btn-' + id).classList.add('active'); if(id === 'dashboard') calculateStats(); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function zoomImage(src) { document.getElementById('zoom-img').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

// Charts Init... (Giống bản trước)
function initCharts() {
    state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), { type: 'doughnut', data: { labels: ['TIỀN MẶT', 'CỔ PHIẾU'], datasets: [{ data: [100, 0], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, cutout: '80%', plugins: { legend: { position: 'bottom' } } } });
}
function initSentimentGauge() {
    state.charts.sentiment = new Chart(document.getElementById('sentimentGauge').getContext('2d'), { type: 'doughnut', data: { datasets: [{ data: [50, 50], backgroundColor: ['#10b981', 'rgba(255,255,255,0.05)'], circumference: 180, rotation: 270, borderWidth: 0 }] }, options: { responsive: true, cutout: '85%', plugins: { tooltip: { enabled: false } } } });
}