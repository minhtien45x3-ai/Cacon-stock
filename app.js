// Data mẫu
const wikiData = [
    { title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png' },
    { title: 'NỀN GIÁ PHẲNG', img: 'https://images.unsplash.com/photo-1611974717482-58fce473656c?w=400&q=80' },
    { title: 'MÔ HÌNH VCP', img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80' },
    { title: 'MÔ HÌNH 2 ĐÁY', img: 'https://i.imgur.com/K7MvL1s.png' },
    { title: 'CHIẾC LÁ CỜ', img: 'https://i.imgur.com/K7MvL1s.png' }
];

const journalData = [
    { date: '2026-03-01', ticker: 'FPT', setup: 'NỀN GIÁ PHẲNG', buy: 135000, sell: 156000, pnl: 20532000, backtest: false },
    { date: '2026-02-15', ticker: 'TCB', setup: 'MÔ HÌNH 2 ĐÁY', buy: 42000, sell: 48000, pnl: 29856000, backtest: true },
    { date: '2026-03-02', ticker: 'CTR', setup: 'CỐC TAY CẦM', buy: 125000, sell: 0, pnl: 0, backtest: false },
    { date: '2026-02-28', ticker: 'HPG', setup: 'VCP', buy: 28000, sell: 26500, pnl: -6400000, backtest: false }
];

const radarData = [
    { ticker: 'FPT', rs: 95, setup: 'NỀN GIÁ PHẲNG', note: 'CHỜ VƯỢT ĐỈNH LỊCH SỬ.' },
    { ticker: 'CTR', rs: 92, setup: 'CỐC TAY CẦM', note: 'CHỜ PIVOT 145.' },
    { ticker: 'VGI', rs: 88, setup: 'NỀN GIÁ PHẲNG', note: 'TÍCH LŨY CHẶT CHẼ.' }
];

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDashboardCharts();
    initSentimentGauge();
    renderAll();
    setupCapitalLogic();
});

// Chuyển Tab
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
}

// Render dữ liệu
function renderAll() {
    // Wiki Grid
    const wikiGrid = document.getElementById('wiki-grid');
    wikiGrid.innerHTML = wikiData.map(item => `
        <div class="glass-panel p-2 relative group overflow-hidden">
            <div class="w-full h-48 rounded-[24px] bg-black/40 overflow-hidden mb-4">
                <img src="${item.img}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition">
            </div>
            <button class="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition">
                <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <p class="p-4 font-black text-xs uppercase">${item.title}</p>
        </div>
    `).join('');

    // Radar Grid
    const radarGrid = document.getElementById('radar-grid');
    radarGrid.innerHTML = radarData.map(item => `
        <div class="glass-panel p-8 space-y-4">
            <div class="flex justify-between items-start">
                <h2 class="text-2xl font-black font-mono">${item.ticker}</h2>
                <span class="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded">RS: ${item.rs}</span>
            </div>
            <p class="text-xs font-bold text-slate-400">${item.setup}</p>
            <p class="text-[10px] text-slate-500 italic">"${item.note}"</p>
        </div>
    `).join('');

    // Journal Table
    const journalList = document.getElementById('journal-list');
    journalList.innerHTML = journalData.map(item => `
        <tr class="hover:bg-white/5 transition">
            <td class="p-5 font-mono text-slate-500 text-[10px]">${item.date}</td>
            <td class="p-5 font-black uppercase text-sm">${item.ticker}</td>
            <td class="p-5 text-center text-slate-600">-</td>
            <td class="p-5 text-[10px] uppercase font-bold text-slate-400">${item.setup}</td>
            <td class="p-5 text-center text-rose-500 text-[10px] font-black">SL</td>
            <td class="p-5 text-right font-mono">${item.buy.toLocaleString()}</td>
            <td class="p-5 text-right font-mono">${item.sell ? item.sell.toLocaleString() : '0'}</td>
            <td class="p-5 text-right font-mono ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${item.pnl >= 0 ? '+' : ''}${item.pnl.toLocaleString()}</td>
            <td class="p-5 text-center">
                <div class="backtest-badge ${item.backtest ? 'active' : ''}"><i data-lucide="alert-triangle" class="w-3 h-3"></i></div>
            </td>
            <td class="p-5 text-center space-x-2">
                <button class="text-blue-500"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button class="text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');

    // Analysis Menu
    const anaMenu = document.getElementById('analysis-menu');
    anaMenu.innerHTML = wikiData.map(item => `
        <button onclick="selectAna('${item.img}')" class="w-full flex items-center gap-3 p-3 rounded-2xl bg-black/20 hover:bg-emerald-500/10 border border-white/5 transition">
            <img src="${item.img}" class="w-8 h-8 rounded-lg object-cover">
            <p class="text-[10px] font-black text-slate-400 uppercase text-left leading-tight">${item.title}</p>
        </button>
    `).join('');

    // Library Grid
    const libGrid = document.getElementById('library-grid');
    const libItems = [
        { title: 'HỆ THỐNG CANSLIM', desc: 'Bí quyết chọn siêu cổ phiếu tăng trưởng bền vững.', img: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80' },
        { title: 'ĐIỂM PIVOT LÀ GÌ?', desc: 'Vùng kháng cự yếu nhất để mua an toàn.', img: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80' }
    ];
    libGrid.innerHTML = libItems.map(item => `
        <div class="glass-panel p-6 space-y-4 group">
            <div class="w-full h-40 rounded-3xl overflow-hidden bg-black/40">
                <img src="${item.img}" class="w-full h-full object-cover">
            </div>
            <h4 class="font-black text-sm">${item.title}</h4>
            <p class="text-[10px] text-slate-500 italic">${item.desc}</p>
        </div>
    `).join('');

    lucide.createIcons();
}

function selectAna(img) {
    const anaImg = document.getElementById('ana-standard');
    anaImg.src = img;
    anaImg.classList.remove('hidden');
}

// Logic quản lý vốn
function setupCapitalLogic() {
    const inputs = ['inp-total-cap', 'inp-stock-n', 'inp-risk-pct', 'inp-buy-price', 'inp-sl-price'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const cap = parseFloat(document.getElementById('inp-total-cap').value) || 0;
            const n = parseFloat(document.getElementById('inp-stock-n').value) || 1;
            const riskPct = parseFloat(document.getElementById('inp-risk-pct').value) || 0;
            const buy = parseFloat(document.getElementById('inp-buy-price').value) || 0;
            const sl = parseFloat(document.getElementById('inp-sl-price').value) || 0;

            const capPerStock = cap / n;
            document.getElementById('val-cap-per-stock').innerText = capPerStock.toLocaleString() + "Đ";

            const riskAmt = cap * (riskPct / 100);
            const riskPerShare = buy - sl;
            
            if (riskPerShare > 0) {
                const size = Math.floor(riskAmt / riskPerShare);
                document.getElementById('val-position-size').innerText = size.toLocaleString() + " CP";
                document.getElementById('val-risk-summary').innerText = `RỦI RO: ${(size * riskPerShare).toLocaleString()}Đ | TRỊ GIÁ: ${(size * buy).toLocaleString()}Đ`;
            }
        });
    });
}

// Biểu đồ Dashboard
function initDashboardCharts() {
    new Chart(document.getElementById('equityChart'), {
        type: 'line',
        data: {
            labels: ['01', '05', '10', '15', '20', '25', '30'],
            datasets: [{
                data: [100, 110, 105, 120, 140, 135, 160],
                borderColor: '#10b981',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                }
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    new Chart(document.getElementById('allocationChart'), {
        type: 'doughnut',
        data: {
            labels: ['Tiền mặt', 'Cổ phiếu'],
            datasets: [{
                data: [20, 80],
                backgroundColor: ['#3b82f6', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

function initSentimentGauge() {
    new Chart(document.getElementById('sentimentGauge'), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [50, 50],
                backgroundColor: ['#10b981', 'rgba(255,255,255,0.05)'],
                circumference: 180,
                rotation: 270,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '85%',
            plugins: { tooltip: { enabled: false } }
        }
    });
}

// Logic hít thở
function startBreathing() {
    const circle = document.getElementById('breath-circle');
    const status = document.getElementById('breath-status');
    const timer = document.getElementById('breath-timer');
    
    let cycle = 0;
    const run = () => {
        // Hít vào 4s
        status.innerText = "HÍT VÀO";
        status.className = "text-4xl font-black text-emerald-400";
        circle.style.transform = "scale(1.5)";
        circle.style.borderColor = "#10b981";
        let t = 4;
        const h = setInterval(() => {
            timer.innerText = t--;
            if (t < 0) {
                clearInterval(h);
                // Nín 7s
                status.innerText = "NÍN THỞ";
                status.className = "text-4xl font-black text-amber-400";
                circle.style.borderColor = "#f59e0b";
                let t2 = 7;
                const n = setInterval(() => {
                    timer.innerText = t2--;
                    if (t2 < 0) {
                        clearInterval(n);
                        // Thở 8s
                        status.innerText = "THỞ RA";
                        status.className = "text-4xl font-black text-rose-400";
                        circle.style.transform = "scale(1)";
                        circle.style.borderColor = "#f43f5e";
                        let t3 = 8;
                        const th = setInterval(() => {
                            timer.innerText = t3--;
                            if (t3 < 0) {
                                clearInterval(th);
                                run();
                            }
                        }, 1000);
                    }
                }, 1000);
            }
        }, 1000);
    };
    run();
}