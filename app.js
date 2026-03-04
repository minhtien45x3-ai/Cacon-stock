// --- State & Config ---
let totalCapital = 2000000000;
let stockCount = 5;
let journalData = [
    { id: 1, date: '2026-03-01', ticker: 'FPT', setup: 'Nền giá phẳng', qty: 1000, buyPrice: 135000, sellPrice: 156000, pnl: 20532000 },
    { id: 2, date: '2026-02-15', ticker: 'TCB', setup: 'Mô hình 2 đáy', qty: 5000, buyPrice: 42000, sellPrice: 48000, pnl: 29856000 }
];

let charts = {};

// --- Initialization ---
window.onload = function() {
    lucide.createIcons();
    initCharts();
    updateCapital();
};

function formatNum(num) { 
    return parseFloat(num).toLocaleString('vi-VN', { maximumFractionDigits: 0 }); 
}

// --- Navigation ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');

    if(tabId === 'dashboard') Object.values(charts).forEach(c => c.update());
}

// --- Dashboard Logic ---
function updateUI() {
    const closed = journalData.filter(t => t.sellPrice > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + curr.pnl, 0);
    
    document.getElementById('dash-balance').innerText = formatNum(totalCapital + totalPnL) + 'đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + formatNum(totalPnL) + 'đ';
    document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#10b981' : '#f43f5e';
    
    const winRate = closed.length ? Math.round((closed.filter(t => t.pnl > 0).length / closed.length) * 100) : 0;
    document.getElementById('dash-winrate').innerText = winRate + '%';
    document.getElementById('dash-holding').innerText = journalData.filter(t => t.sellPrice === 0).length;

    updateAllocationChart();
}

// --- Calculation Logic ---
function updateCapital() {
    totalCapital = parseFloat(document.getElementById('config-capital').value) || 0;
    stockCount = parseInt(document.getElementById('config-stock-count').value) || 1;
    document.getElementById('cap-per-stock').innerText = formatNum(totalCapital / stockCount) + 'đ';
    updateUI();
}

function runCalculation() {
    const buyP = parseFloat(document.getElementById('calc-buy-price').value) || 0;
    const slP = parseFloat(document.getElementById('calc-sl-price').value) || 0;
    const riskPct = (parseFloat(document.getElementById('calc-risk-coeff').value) || 2) / 100;
    
    if(buyP > slP && buyP > 0) {
        const riskAmt = totalCapital * riskPct;
        const vol = Math.floor(riskAmt / (buyP - slP));
        const maxVolByCap = Math.floor((totalCapital / stockCount) / buyP);
        const finalVol = Math.min(vol, maxVolByCap);

        document.getElementById('calc-result-volume').innerText = formatNum(finalVol) + " CP";
        document.getElementById('calc-result-value').innerText = `Trị giá: ${formatNum(finalVol * buyP)}đ | Rủi ro thực: ${formatNum(finalVol * (buyP - slP))}đ`;
    }
}

// --- Market Warning ---
function updateDistWarning() {
    const days = parseInt(document.getElementById('market-dist-days').value) || 0;
    const box = document.getElementById('dist-alert-box');
    const title = document.getElementById('dist-alert-title');
    
    if (days <= 2) {
        title.innerText = "XU HƯỚNG TĂNG";
        box.className = "mt-4 p-5 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 text-center";
    } else if (days >= 5) {
        title.innerText = "NGUY HIỂM - 100% TIỀN MẶT";
        box.className = "mt-4 p-5 rounded-[24px] bg-rose-600/20 border border-rose-600/50 text-center animate-pulse";
    } else {
        title.innerText = "THẬN TRỌNG - GIẢM TỶ TRỌNG";
        box.className = "mt-4 p-5 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-center";
    }
}

// --- Charts ---
function initCharts() {
    const ctxE = document.getElementById('equity-chart').getContext('2d');
    charts.equity = new Chart(ctxE, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{
                data: [2000000000, 2050000000, 2100000000],
                borderColor: '#10b981',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.05)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxA = document.getElementById('allocation-chart').getContext('2d');
    charts.allocation = new Chart(ctxA, {
        type: 'doughnut',
        data: {
            labels: ['Tiền mặt', 'Cổ phiếu'],
            datasets: [{ data: [60, 40], backgroundColor: ['#3b82f6', '#10b981'], borderWidth: 0 }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
}

function updateAllocationChart() {
    if (!charts.allocation) return;
    const invested = journalData.filter(t => t.sellPrice === 0).reduce((acc, curr) => acc + (curr.qty * curr.buyPrice), 0);
    charts.allocation.data.datasets[0].data = [totalCapital - invested, invested];
    charts.allocation.update();
}

// --- Psychology: Breathing ---
let isBreathing = false;
function toggleBreathing() {
    const circle = document.getElementById('breathing-circle');
    const status = document.getElementById('breathing-status');
    const timer = document.getElementById('breathing-timer');
    const btn = document.getElementById('breath-toggle-btn');

    if(isBreathing) { location.reload(); return; }
    isBreathing = true;
    btn.innerText = "DỪNG LẠI";

    let step = 0;
    const stages = [
        { name: 'HÍT VÀO', time: 4, class: 'stage-inhale' },
        { name: 'NÍN THỞ', time: 7, class: 'stage-hold' },
        { name: 'THỞ RA', time: 8, class: 'stage-exhale' }
    ];

    const run = () => {
        const s = stages[step];
        status.innerText = s.name;
        circle.className = 'breathing-circle-outer ' + s.class;
        let t = s.time;
        timer.innerText = t;
        const interval = setInterval(() => {
            t--;
            timer.innerText = t;
            if(t <= 0) {
                clearInterval(interval);
                step = (step + 1) % 3;
                run();
            }
        }, 1000);
    };
    run();
}

// --- AI Coaching (Placeholder for environment) ---
async function getAICoachAdvice() {
    document.getElementById('ai-coach-text').innerText = "✨ AI: Hãy kiên nhẫn, thị trường đang tích lũy tốt. Giữ đúng kỷ luật cắt lỗ 7%.";
}