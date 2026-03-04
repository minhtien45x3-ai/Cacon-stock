// State Management
let state = {
    capital: 2000000000,
    stockCount: 5,
    journal: [
        { id: 1, date: '2026-03-01', ticker: 'FPT', setup: 'Nền giá phẳng', qty: 2000, buyPrice: 130000, sellPrice: 145000, pnl: 29910000 },
        { id: 2, date: '2026-02-15', ticker: 'MWG', setup: 'Cốc tay cầm', qty: 5000, buyPrice: 62000, sellPrice: 58000, pnl: -20000000 },
        { id: 3, date: '2026-03-03', ticker: 'TCB', setup: 'VCP', qty: 10000, buyPrice: 42000, sellPrice: 0, pnl: 0 },
        { id: 4, date: '2026-02-20', ticker: 'DGC', setup: 'Nền giá phẳng', qty: 3000, buyPrice: 110000, sellPrice: 125000, pnl: 44800000 }
    ],
    charts: {}
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initCharts();
    updateDashboard();
    evaluateMarketRisk();
});

function initDate() {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const dateInput = document.getElementById('form-date');
    if (dateInput) dateInput.value = dateStr;
}

// Navigation Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('block');
        el.classList.add('hidden');
    });
    
    const target = document.getElementById('tab-' + tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block', 'animate-fade-in');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');

    // Trigger chart updates when switching to dashboard
    if (tabId === 'dashboard') {
        Object.values(state.charts).forEach(chart => chart.update());
    }
}

// Position Calculator Logic
function calculatePosition() {
    const riskPct = parseFloat(document.getElementById('calc-risk-coeff').value) / 100;
    const buyP = parseFloat(document.getElementById('calc-buy-price').value);
    const slP = parseFloat(document.getElementById('calc-sl-price').value);
    
    const resVol = document.getElementById('calc-result-volume');
    const resVal = document.getElementById('calc-result-value');

    if (!buyP || !slP || buyP <= slP) {
        alert("Kiểm tra lại giá mua và giá dừng lỗ!");
        return;
    }

    const capitalPerTrade = state.capital / state.stockCount;
    const maxRiskAmount = state.capital * riskPct;
    const riskPerShare = buyP - slP;

    let sharesBasedOnRisk = Math.floor(maxRiskAmount / riskPerShare);
    let sharesBasedOnCapital = Math.floor(capitalPerTrade / buyP);

    const finalShares = Math.min(sharesBasedOnRisk, sharesBasedOnCapital);
    const tradeValue = finalShares * buyP;

    resVol.innerText = formatNum(finalShares) + " CP";
    resVal.innerText = `Giá trị: ${formatNum(tradeValue)}đ (Rủi ro: ${formatNum(finalShares * riskPerShare)}đ)`;
    document.getElementById('calc-result-panel').classList.remove('hidden');
}

// System Config
function updateSystemCapital() {
    const cap = document.getElementById('config-capital').value;
    const count = document.getElementById('config-stock-count').value;
    if (cap) state.capital = parseFloat(cap);
    if (count) state.stockCount = parseInt(count);
    updateDashboard();
    alert("Đã cập nhật cấu hình hệ thống!");
}

// Journal Actions
function addTrade() {
    const ticker = document.getElementById('form-ticker').value.toUpperCase();
    const qty = parseFloat(document.getElementById('form-qty').value);
    const buyPrice = parseFloat(document.getElementById('form-buy').value);
    const sellPrice = parseFloat(document.getElementById('form-sell').value) || 0;

    if (!ticker || !qty || !buyPrice) return alert("Vui lòng điền đủ thông tin cơ bản!");

    let pnl = 0;
    if (sellPrice > 0) {
        pnl = (qty * sellPrice) - (qty * buyPrice);
        pnl -= (qty * sellPrice * 0.003); // Thuế phí ước tính
    }

    state.journal.unshift({
        id: Date.now(),
        date: document.getElementById('form-date').value,
        ticker,
        setup: document.getElementById('form-setup').value,
        qty,
        buyPrice,
        sellPrice,
        pnl
    });

    updateDashboard();
    // Clear inputs
    ['form-ticker', 'form-qty', 'form-buy', 'form-sell'].forEach(id => document.getElementById(id).value = '');
}

function deleteTrade(id) {
    if (confirm("Xóa giao dịch này?")) {
        state.journal = state.journal.filter(t => t.id !== id);
        updateDashboard();
    }
}

// UI Refresh
function updateDashboard() {
    const closed = state.journal.filter(t => t.sellPrice > 0);
    const open = state.journal.filter(t => t.sellPrice === 0);
    const totalPnL = closed.reduce((acc, curr) => acc + curr.pnl, 0);
    
    document.getElementById('dash-balance').innerText = formatNum(state.capital + totalPnL) + 'đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + formatNum(totalPnL) + 'đ';
    document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#059669' : '#e11d48';
    
    const winRate = closed.length ? Math.round((closed.filter(t => t.pnl > 0).length / closed.length) * 100) : 0;
    document.getElementById('dash-winrate').innerText = winRate + '%';
    document.getElementById('dash-holding').innerText = open.length;

    renderTable();
    updateAllocation(open);
}

function renderTable() {
    const tbody = document.getElementById('journal-table-body');
    tbody.innerHTML = state.journal.map(t => `
        <tr class="hover:bg-stone-50 transition">
            <td class="p-4 border-b font-mono">${t.date}</td>
            <td class="p-4 border-b font-black">${t.ticker}</td>
            <td class="p-4 border-b text-[10px] uppercase font-bold">${t.setup}</td>
            <td class="p-4 border-b text-right">${formatNum(t.qty)}</td>
            <td class="p-4 border-b text-right">${formatNum(t.buyPrice)}</td>
            <td class="p-4 border-b text-right">${t.sellPrice > 0 ? formatNum(t.sellPrice) : '<span class="text-blue-500">OPEN</span>'}</td>
            <td class="p-4 border-b text-right font-bold ${t.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${t.sellPrice > 0 ? formatNum(t.pnl) : '---'}</td>
            <td class="p-4 border-b text-center"><button onclick="deleteTrade(${t.id})">🗑️</button></td>
        </tr>
    `).join('');
    document.getElementById('total-trades-count').innerText = `${state.journal.length} Lệnh`;
}

// Market Risk & Sentiment
function evaluateMarketRisk() {
    const days = parseInt(document.getElementById('market-dist-days').value) || 0;
    const status = document.getElementById('dist-status');
    const action = document.getElementById('dist-action');
    const card = document.getElementById('dist-card');

    if (days <= 2) {
        status.innerText = "XU HƯỚNG TĂNG";
        status.className = "text-lg font-black text-emerald-600";
        action.innerText = "Duy trì quy mô bình thường.";
        card.style.borderTopColor = "#10b981";
    } else if (days >= 5) {
        status.innerText = "NGUY HIỂM CỰC ĐỘ";
        status.className = "text-lg font-black text-rose-600";
        action.innerText = "ĐƯA VỀ 100% TIỀN MẶT!";
        card.style.borderTopColor = "#e11d48";
    } else {
        status.innerText = "THẬN TRỌNG";
        status.className = "text-lg font-black text-amber-600";
        action.innerText = "Hạ margin, bảo vệ lợi nhuận.";
        card.style.borderTopColor = "#f59e0b";
    }
}

function updateSentiment() {
    const val = document.getElementById('sentiment-slider').value;
    document.getElementById('sentiment-val-display').innerText = val;
    if (state.charts.sentiment) {
        state.charts.sentiment.data.datasets[0].data = [val, 100 - val];
        state.charts.sentiment.update();
    }
}

// Chart Initializations
function initCharts() {
    const ctxE = document.getElementById('equity-chart').getContext('2d');
    state.charts.equity = new Chart(ctxE, {
        type: 'line',
        data: {
            labels: ['Khởi tạo', 'Tháng 1', 'Tháng 2', 'Hiện tại'],
            datasets: [{
                data: [2000000000, 2010000000, 1980000000, 2054710000],
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxA = document.getElementById('allocation-chart').getContext('2d');
    state.charts.allocation = new Chart(ctxA, {
        type: 'doughnut',
        data: {
            labels: ['Tiền mặt', 'Cổ phiếu'],
            datasets: [{ data: [100, 0], backgroundColor: ['#e7e5e4', '#0ea5e9'], borderWidth: 0 }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });

    const ctxS = document.getElementById('sentiment-gauge').getContext('2d');
    state.charts.sentiment = new Chart(ctxS, {
        type: 'doughnut',
        data: {
            datasets: [{ data: [50, 50], backgroundColor: ['#3b82f6', '#f5f5f4'], circumference: 180, rotation: 270 }]
        },
        options: { cutout: '80%', plugins: { tooltip: { enabled: false } } }
    });
}

function updateAllocation(openTrades) {
    if (!state.charts.allocation) return;
    const invested = openTrades.reduce((acc, curr) => acc + (curr.qty * curr.buyPrice), 0);
    const cash = Math.max(0, state.capital - invested);
    state.charts.allocation.data.datasets[0].data = [cash, invested];
    state.charts.allocation.update();
}

function formatNum(n) {
    return parseFloat(n).toLocaleString('vi-VN');
}