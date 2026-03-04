// --- DATABASE ---
let state = {
    totalCapital: 2043988000,
    journal: JSON.parse(localStorage.getItem('journal')) || [],
    wiki: JSON.parse(localStorage.getItem('wiki')) || [
        { id: '1', title: 'CỐC TAY CẦM', img: 'https://i.imgur.com/K7MvL1s.png', checklist: ['Xu hướng > 30%', 'Đáy cốc tròn', 'Tay cầm chặt', 'Pivot vol lớn'] }
    ],
    radar: JSON.parse(localStorage.getItem('radar')) || [],
    editingWikiId: null,
    charts: {}
};

// --- INITIALIZATION ---
window.onload = function() {
    lucide.createIcons();
    initCharts();
    updateUI();
    updateMarketStatus();
};

function updateUI() {
    renderWikiGrid();
    renderAnalysisMenu();
    populateSetupSelect();
    calculateStats();
    renderRadar();
}

// --- LIGHTBOX (ZOOM IMAGE) ---
function zoomImage(src) {
    if(!src) return;
    const modal = document.getElementById('modal-zoom');
    document.getElementById('zoom-img').src = src;
    modal.classList.remove('hidden');
}

// --- WIKI MANAGEMENT ---
function renderWikiGrid() {
    const grid = document.getElementById('wiki-grid');
    grid.innerHTML = state.wiki.map(item => `
        <div class="glass-panel p-2 relative group overflow-hidden animate-in">
            <div class="w-full h-48 rounded-[24px] bg-black/40 overflow-hidden mb-4 cursor-zoom-in">
                <img src="${item.img}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" onclick="zoomImage(this.src)">
            </div>
            <div class="p-4 flex justify-between items-center">
                <p class="font-black text-xs uppercase text-emerald-400">${item.title}</p>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onclick="editWiki(${item.id})" class="text-blue-400"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deleteWiki(${item.id})" class="text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function openWikiModal() {
    state.editingWikiId = null;
    document.getElementById('wiki-modal-title').innerText = "TẠO MẪU HÌNH MỚI";
    document.getElementById('wiki-name').value = "";
    document.getElementById('wiki-preview-img').classList.add('hidden');
    document.getElementById('wiki-conditions').value = "";
    document.getElementById('modal-wiki').classList.remove('hidden');
}

function previewWikiImg(event) {
    const reader = new FileReader();
    reader.onload = () => {
        const preview = document.getElementById('wiki-preview-img');
        preview.src = reader.result; preview.classList.remove('hidden');
    };
    reader.readAsDataURL(event.target.files[0]);
}

document.getElementById('btn-save-wiki').onclick = function() {
    const name = document.getElementById('wiki-name').value;
    const img = document.getElementById('wiki-preview-img').src;
    const conditions = document.getElementById('wiki-conditions').value.split('\n').filter(l => l.trim() !== "");

    if(!name || !img) return alert("Vui lòng điền đủ tên và chèn ảnh!");

    if(state.editingWikiId) {
        const idx = state.wiki.findIndex(x => x.id == state.editingWikiId);
        state.wiki[idx] = { ...state.wiki[idx], title: name, img, checklist: conditions };
    } else {
        state.wiki.push({ id: Date.now(), title: name, img, checklist: conditions });
    }
    localStorage.setItem('wiki', JSON.stringify(state.wiki));
    closeModal('modal-wiki');
    updateUI();
};

function editWiki(id) {
    const item = state.wiki.find(x => x.id == id);
    state.editingWikiId = id;
    document.getElementById('wiki-modal-title').innerText = "CHỈNH SỬA MẪU HÌNH";
    document.getElementById('wiki-name').value = item.title;
    document.getElementById('wiki-preview-img').src = item.img;
    document.getElementById('wiki-preview-img').classList.remove('hidden');
    document.getElementById('wiki-conditions').value = item.checklist.join('\n');
    document.getElementById('modal-wiki').classList.remove('hidden');
}

function deleteWiki(id) {
    if(confirm("Xóa mẫu hình này?")) {
        state.wiki = state.wiki.filter(x => x.id != id);
        localStorage.setItem('wiki', JSON.stringify(state.wiki));
        updateUI();
    }
}

// --- ANALYSIS CONNECTIVITY ---
function renderAnalysisMenu() {
    const menu = document.getElementById('analysis-menu');
    menu.innerHTML = state.wiki.map(item => `
        <button onclick="loadAnalysis('${item.id}')" class="w-full flex items-center gap-3 p-3 rounded-2xl bg-black/20 hover:bg-emerald-500/10 border border-white/5 transition text-left">
            <img src="${item.img}" class="w-8 h-8 rounded-lg object-cover">
            <p class="text-[10px] font-black text-slate-400 uppercase leading-tight">${item.title}</p>
        </button>
    `).join('');
}

function loadAnalysis(id) {
    const item = state.wiki.find(x => x.id == id);
    const img = document.getElementById('ana-standard-img');
    img.src = item.img; img.classList.remove('hidden');
    document.getElementById('ana-checklist').innerHTML = item.checklist.map(c => `
        <label class="flex items-center gap-2 text-[10px] text-slate-400 group cursor-pointer">
            <input type="checkbox" class="accent-emerald-500"> <span>${c}</span>
        </label>
    `).join('');
}

function previewRealChart(event) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.getElementById('ana-real-img');
        img.src = reader.result; img.classList.remove('hidden');
        document.getElementById('ana-upload-btn').classList.add('hidden');
    };
    reader.readAsDataURL(event.target.files[0]);
}

// --- MARKET LOGIC ---
function updateMarketStatus() {
    const days = parseInt(document.getElementById('market-dist-days').value) || 0;
    const box = document.getElementById('dist-alert-box');
    const title = document.getElementById('dist-alert-title');
    const desc = document.getElementById('dist-alert-desc');

    if (days <= 2) {
        title.innerText = "XU HƯỚNG TĂNG"; desc.innerText = "Thị trường bình thường.";
        box.className = "mt-4 p-6 rounded-2xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    } else if (days === 3) {
        title.innerText = "RỦI RO"; desc.innerText = "Hạ tỷ trọng Margin.";
        box.className = "mt-4 p-6 rounded-2xl text-center bg-amber-500/10 border border-amber-500/20 text-amber-400";
    } else if (days === 4) {
        title.innerText = "NGUY CƠ CAO"; desc.innerText = "Hạ 50% tiền mặt.";
        box.className = "mt-4 p-6 rounded-2xl text-center bg-orange-500/10 border border-orange-500/20 text-orange-400";
    } else {
        title.innerText = "NGUY HIỂM"; desc.innerText = "ĐƯA VỀ 100% TIỀN MẶT.";
        box.className = "mt-4 p-6 rounded-2xl text-center bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse";
    }
}

// --- DASHBOARD & JOURNAL ---
function calculateStats() {
    const closed = state.journal.filter(t => t.sell > 0);
    const totalPnL = closed.reduce((acc, curr) => acc + (curr.sell - curr.buy), 0);
    const wins = closed.filter(t => t.sell > t.buy).length;
    const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;

    document.getElementById('dash-balance').innerText = (state.totalCapital + totalPnL).toLocaleString() + 'đ';
    document.getElementById('dash-pnl').innerText = (totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString() + 'đ';
    document.getElementById('dash-pnl').style.color = totalPnL >= 0 ? '#10b981' : '#f43f5e';
    document.getElementById('dash-winrate').innerText = winRate + '%';
    document.getElementById('dash-holding').innerText = state.journal.filter(t => t.sell == 0).length;
    document.getElementById('journal-total-pnl').innerText = totalPnL.toLocaleString() + 'đ';

    updateEquityChart(closed);
    updateMonthlyStats(closed);
    updateSetupRanking(closed);
    renderJournalTable();
}

function updateMonthlyStats(closed) {
    const stats = {};
    closed.forEach(t => {
        const month = t.date.substring(0, 7);
        if(!stats[month]) stats[month] = { count: 0, pnl: 0 };
        stats[month].count++; stats[month].pnl += (t.sell - t.buy);
    });
    document.getElementById('dash-monthly-stats').innerHTML = Object.entries(stats).map(([m,v]) => `
        <tr class="border-b border-white/5">
            <td class="py-3 font-mono">${m}</td>
            <td class="py-3 text-center">${v.count}</td>
            <td class="py-3 text-right font-bold ${v.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${v.pnl.toLocaleString()}đ</td>
        </tr>
    `).join('');
}

function updateSetupRanking(closed) {
    const stats = {};
    closed.forEach(t => {
        if(!stats[t.setup]) stats[t.setup] = { win: 0, total: 0 };
        stats[t.setup].total++;
        if(t.sell > t.buy) stats[t.setup].win++;
    });
    const ranked = Object.entries(stats).map(([name,v]) => ({ name, wr: Math.round((v.win/v.total)*100) })).sort((a,b) => b.wr - a.wr);
    document.getElementById('dash-setup-rank').innerHTML = ranked.map(s => `
        <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-slate-300">${s.name}</span>
            <div class="flex items-center gap-2">
                <div class="w-24 h-1 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width: ${s.wr}%"></div></div>
                <span class="font-mono text-emerald-400">${s.wr}%</span>
            </div>
        </div>
    `).join('');
}

// --- COMMON HELPERS ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
    if(tabId === 'dashboard') Object.values(state.charts).forEach(c => c.update());
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function saveTrade() {
    const trade = {
        date: document.getElementById('trade-date').value,
        ticker: document.getElementById('trade-ticker').value.toUpperCase(),
        setup: document.getElementById('trade-setup').value,
        buy: parseFloat(document.getElementById('trade-buy').value),
        sell: parseFloat(document.getElementById('trade-sell').value) || 0
    };
    state.journal.push(trade);
    localStorage.setItem('journal', JSON.stringify(state.journal));
    updateUI(); closeModal('modal-trade');
}

function renderJournalTable() {
    document.getElementById('journal-table-body').innerHTML = state.journal.map((t, idx) => `
        <tr class="hover:bg-white/5 transition border-b border-white/5">
            <td class="p-5 font-mono text-slate-500">${t.date}</td>
            <td class="p-5 font-black uppercase">${t.ticker}</td>
            <td class="p-5 text-slate-400 font-bold uppercase text-[10px]">${t.setup}</td>
            <td class="p-5 text-right font-mono">${t.buy.toLocaleString()}</td>
            <td class="p-5 text-right font-mono">${t.sell ? t.sell.toLocaleString() : '-'}</td>
            <td class="p-5 text-right font-mono ${t.sell - t.buy >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                ${t.sell ? (t.sell - t.buy).toLocaleString() : '-'}
            </td>
            <td class="p-5 text-center"><button onclick="deleteTrade(${idx})"><i data-lucide="trash-2" class="w-4 h-4 text-rose-500"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function deleteTrade(idx) {
    if(confirm("Xóa lệnh?")) {
        state.journal.splice(idx, 1);
        localStorage.setItem('journal', JSON.stringify(state.journal));
        updateUI();
    }
}

function populateSetupSelect() {
    const s = document.getElementById('trade-setup');
    if(s) s.innerHTML = state.wiki.map(w => `<option value="${w.title}">${w.title}</option>`).join('');
}

function initCharts() {
    const ctxE = document.getElementById('equityChart').getContext('2d');
    state.charts.equity = new Chart(ctxE, {
        type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.1)' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function updateEquityChart(closed) {
    if(!state.charts.equity) return;
    const labels = closed.map(t => t.date);
    let runningPnL = state.totalCapital;
    const data = closed.map(t => {
        runningPnL += (t.sell - t.buy);
        return runningPnL;
    });
    state.charts.equity.data.labels = labels;
    state.charts.equity.data.datasets[0].data = data;
    state.charts.equity.update();
}