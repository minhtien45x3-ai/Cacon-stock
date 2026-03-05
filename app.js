// DATABASE MẪU & LƯU TRỮ
let state = {
    totalCap: 2000000000,
    journal: JSON.parse(localStorage.getItem('cacon_journal')) || [
        { id: 1, date: '2026-03-01', ticker: 'FPT', setup: 'CỐC TAY CẦM', vol: 1000, buy: 135000, sell: 156000 },
        { id: 2, date: '2026-03-02', ticker: 'MWG', setup: 'NỀN GIÁ PHẲNG', vol: 2000, buy: 62000, sell: 0 }, // Đang nắm giữ
        { id: 3, date: '2026-02-15', ticker: 'TCB', setup: 'MÔ HÌNH VCP', vol: 5000, buy: 42000, sell: 40000 }
    ],
    wiki: [
        { id: 'cup', title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', desc: 'Đáy tròn, tay cầm rủ bỏ vol thấp.' },
        { id: 'flat', title: 'NỀN GIÁ PHẲNG', img: 'https://i.imgur.com/vHpxX9M.png', desc: 'Tích lũy đi ngang > 5 tuần.' },
        { id: 'vcp', title: 'MÔ HÌNH VCP', img: 'https://i.imgur.com/S8WAnwX.png', desc: 'Độ biến động thu hẹp dần.' }
    ],
    charts: {}
};

window.onload = function() {
    lucide.createIcons();
    initCharts();
    updateUI();
};

function updateUI() {
    renderJournal();
    renderWiki();
    renderAnalysisMenu();
    calculateStats();
    populateSelects();
    localStorage.setItem('cacon_journal', JSON.stringify(state.journal));
}

// TÍNH TOÁN TỔNG QUAN (LIÊN KẾT NHẬT KÝ)
function calculateStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const holding = state.journal.filter(t => t.sell === 0);
    
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy) * curr.vol, 0);
    const wins = closed.filter(t => t.sell > t.buy).length;
    
    // Cập nhật số liệu Header
    document.getElementById('dash-balance').innerText = (state.totalCap + totalPnL).toLocaleString() + 'đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString() + 'đ';
    document.getElementById('dash-winrate').innerText = closed.length ? Math.round((wins/closed.length)*100) + '%' : '0%';
    document.getElementById('dash-holding').innerText = holding.length;
    document.getElementById('journal-pnl-sum').innerText = totalPnL.toLocaleString() + 'đ';

    // Cập nhật biểu đồ Equity (Tài sản)
    let runCap = state.totalCap;
    state.charts.equity.data.labels = closed.map(t => t.date);
    state.charts.equity.data.datasets[0].data = closed.map(t => {
        runCap += (t.sell - t.buy) * curr.vol;
        return runCap;
    });
    state.charts.equity.update();

    // Biểu đồ Allocation
    const investVal = holding.reduce((acc, curr) => acc + (curr.buy * curr.vol), 0);
    state.charts.allocation.data.datasets[0].data = [state.totalCap - investVal, investVal];
    state.charts.allocation.update();
}

// NHẬT KÝ
function renderJournal() {
    const list = document.getElementById('journal-list');
    list.innerHTML = state.journal.map(t => {
        const pnl = t.sell > 0 ? (t.sell - t.buy) * t.vol : 0;
        const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
        return `
            <tr>
                <td class="p-5 font-mono">${t.date}</td>
                <td class="p-5 font-black text-blue-400">${t.ticker}</td>
                <td class="p-5">${t.setup}</td>
                <td class="p-5 text-right font-mono">${t.vol.toLocaleString()}</td>
                <td class="p-5 text-right font-mono">${t.buy.toLocaleString()}</td>
                <td class="p-5 text-right font-mono">${t.sell > 0 ? t.sell.toLocaleString() : '---'}</td>
                <td class="p-5 text-right font-black ${pnlClass}">${t.sell > 0 ? pnl.toLocaleString() : 'HOLDING'}</td>
                <td class="p-5 text-center"><button onclick="deleteTrade(${t.id})" class="text-rose-500 hover:scale-110 transition">X</button></td>
            </tr>
        `;
    }).join('');
}

// MẪU HÌNH (WIKI)
function renderWiki() {
    document.getElementById('wiki-grid').innerHTML = state.wiki.map(w => `
        <div class="glass-panel p-6 space-y-4">
            <img src="${w.img}" class="w-full h-32 object-cover rounded-2xl">
            <h4 class="font-black text-emerald-400">${w.title}</h4>
            <p class="text-[10px] text-slate-400 lowercase italic">"${w.desc}"</p>
        </div>
    `).join('');
}

// PHÂN TÍCH (MENU)
function renderAnalysisMenu() {
    document.getElementById('analysis-menu').innerHTML = state.wiki.map(w => `
        <button onclick="selectAnalysis('${w.id}')" class="w-full p-4 text-[10px] font-black text-left border border-white/5 rounded-xl hover:bg-emerald-500/10 transition">
            ${w.title}
        </button>
    `).join('');
}

function selectAnalysis(id) {
    const pattern = state.wiki.find(w => w.id === id);
    document.getElementById('ana-standard-img').src = pattern.img;
    document.getElementById('ana-empty-hint').classList.add('hidden');
}

// TIỆN ÍCH
function handleSlider(v) { document.getElementById('slider-overlay').style.width = v + '%'; }
function switchTab(id) { 
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + id).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function saveTrade() {
    const newTrade = {
        id: Date.now(),
        date: document.getElementById('trade-date').value,
        ticker: document.getElementById('trade-ticker').value.toUpperCase(),
        setup: document.getElementById('trade-setup').value,
        vol: parseInt(document.getElementById('trade-vol').value),
        buy: parseInt(document.getElementById('trade-buy').value),
        sell: parseInt(document.getElementById('trade-sell').value) || 0
    };
    state.journal.push(newTrade);
    closeModal('modal-trade');
    updateUI();
}

function deleteTrade(id) {
    state.journal = state.journal.filter(t => t.id !== id);
    updateUI();
}

function populateSelects() {
    const setupSelect = document.getElementById('trade-setup');
    setupSelect.innerHTML = state.wiki.map(w => `<option value="${w.title}">${w.title}</option>`).join('');
}

function previewRealChart(e) {
    const reader = new FileReader();
    reader.onload = () => { document.getElementById('ana-real-img').src = reader.result; };
    reader.readAsDataURL(e.target.files[0]);
}

function initCharts() {
    state.charts.equity = new Chart(document.getElementById('equityChart').getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Tài sản', data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.05)', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    state.charts.allocation = new Chart(document.getElementById('allocationChart').getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Tiền mặt', 'Cổ phiếu'], datasets: [{ data: [100, 0], backgroundColor: ['#1e293b', '#10b981'], borderWidth: 0 }] },
        options: { responsive: true, cutout: '80%', plugins: { legend: { display: false } } }
    });
}