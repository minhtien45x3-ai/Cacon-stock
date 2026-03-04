// Data Store
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
  updateSentiment(); // đồng bộ gauge với slider ngay từ đầu
});

function initDate() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateInput = document.getElementById('form-date');
  if (dateInput) dateInput.value = dateStr;
}

// --- Navigation ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('block');
    el.classList.add('hidden');
  });

  const target = document.getElementById('tab-' + tabId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('block');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'dashboard') {
    if (state.charts.equity) state.charts.equity.update();
    if (state.charts.allocation) state.charts.allocation.update();
  }
}

// --- Calculation & Updates ---
function updateSystemCapital() {
  const capVal = document.getElementById('config-capital')?.value;
  const countVal = document.getElementById('config-stock-count')?.value;

  if (capVal) state.capital = parseFloat(capVal);
  if (countVal) state.stockCount = parseInt(countVal, 10);

  updateDashboard();
  calculatePosition();
  alert("Đã cập nhật cấu hình vốn.");
}

function calculatePosition() {
  const riskPct = (parseFloat(document.getElementById('calc-risk-coeff')?.value) || 0) / 100;
  const buyP = parseFloat(document.getElementById('calc-buy-price')?.value);
  const slP = parseFloat(document.getElementById('calc-sl-price')?.value);

  const resVol = document.getElementById('calc-result-volume');
  const resVal = document.getElementById('calc-result-value');
  const panel = document.getElementById('calc-result-panel');

  if (!resVol || !resVal || !panel) return;

  if (!buyP || !slP || buyP <= slP) {
    resVol.innerText = "0 CP";
    resVal.innerText = "Kiểm tra lại giá mua và cắt lỗ.";
    panel.classList.remove('hidden');
    return;
  }

  // Phân bổ vốn cho 1 mã = Vốn / N
  const capitalPerTrade = state.capital / state.stockCount;
  // Rủi ro cho phép trên tổng vốn
  const maxRiskAmount = state.capital * riskPct;

  const riskPerShare = buyP - slP;
  const sharesBasedOnRisk = Math.floor(maxRiskAmount / riskPerShare);
  const sharesBasedOnCapital = Math.floor(capitalPerTrade / buyP);

  // Không mua vượt quá số vốn phân bổ cho 1 mã
  const finalShares = Math.max(0, Math.min(sharesBasedOnRisk, sharesBasedOnCapital));
  const tradeValue = finalShares * buyP;
  const actualRisk = finalShares * riskPerShare;

  resVol.innerText = formatNum(finalShares) + " CP";
  resVal.innerText = `Giá trị: ${formatNum(tradeValue)}đ (Rủi ro: ${formatNum(actualRisk)}đ)`;
  panel.classList.remove('hidden');
}

// --- Journal CRUD ---
function addTrade() {
  const date = document.getElementById('form-date')?.value;
  const tickerRaw = document.getElementById('form-ticker')?.value || '';
  const ticker = tickerRaw.toUpperCase().trim();
  const setup = document.getElementById('form-setup')?.value;
  const qty = parseFloat(document.getElementById('form-qty')?.value);
  const buyPrice = parseFloat(document.getElementById('form-buy')?.value);
  const sellPrice = parseFloat(document.getElementById('form-sell')?.value) || 0;

  if (!ticker || !qty || !buyPrice) return alert("Vui lòng nhập Mã, Số lượng và Giá vốn.");

  let pnl = 0;
  if (sellPrice > 0) {
    const buyVal = qty * buyPrice;
    const sellVal = qty * sellPrice;
    pnl = (sellVal - buyVal) - (sellVal * 0.003); // Tạm tính phí
  }

  state.journal.unshift({ id: Date.now(), date, ticker, setup, qty, buyPrice, sellPrice, pnl });

  // Clear fields
  const t = document.getElementById('form-ticker'); if (t) t.value = '';
  const q = document.getElementById('form-qty'); if (q) q.value = '';
  const b = document.getElementById('form-buy'); if (b) b.value = '';
  const s = document.getElementById('form-sell'); if (s) s.value = '';

  updateDashboard();
}

function deleteTrade(id) {
  if (confirm("Chắc chắn xóa giao dịch này?")) {
    state.journal = state.journal.filter(t => t.id !== id);
    updateDashboard();
  }
}

function formatNum(num) {
  return (parseFloat(num) || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}

function renderJournalTable() {
  const tbody = document.getElementById('journal-table-body');
  if (!tbody) return;

  tbody.innerHTML = state.journal.map(t => {
    const isClosed = t.sellPrice > 0;
    const pnlClass = t.pnl > 0 ? 'text-emerald-600' : (t.pnl < 0 ? 'text-rose-600' : 'text-stone-500');
    const pnlText = isClosed ? formatNum(t.pnl) : '---';
    const pnlSign = (t.pnl > 0 && isClosed) ? '+' : '';

    return `
      <tr class="hover:bg-stone-50 transition">
        <td class="p-4 border-b border-stone-100 text-stone-500 font-mono">${t.date}</td>
        <td class="p-4 border-b border-stone-100 font-black text-stone-800">${t.ticker}</td>
        <td class="p-4 border-b border-stone-100 text-stone-600 uppercase text-[10px] font-bold">${t.setup}</td>
        <td class="p-4 border-b border-stone-100 text-right font-mono">${formatNum(t.qty)}</td>
        <td class="p-4 border-b border-stone-100 text-right font-mono">${formatNum(t.buyPrice)}</td>
        <td class="p-4 border-b border-stone-100 text-right font-mono">${isClosed ? formatNum(t.sellPrice) : '<span class="text-blue-500 text-[10px] font-bold uppercase">Giữ</span>'}</td>
        <td class="p-4 border-b border-stone-100 text-right font-mono font-bold ${pnlClass}">${pnlSign}${pnlText}</td>
        <td class="p-4 border-b border-stone-100 text-center">
          <button onclick="deleteTrade(${t.id})" class="text-stone-400 hover:text-rose-500 transition">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  const total = document.getElementById('total-trades-count');
  if (total) total.innerText = `${state.journal.length} Lệnh`;
}

// --- Core Updates ---
function updateDashboard() {
  const closed = state.journal.filter(t => t.sellPrice > 0);
  const open = state.journal.filter(t => t.sellPrice === 0);

  const totalPnL = closed.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
  const wins = closed.filter(t => t.pnl > 0).length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;

  const bal = document.getElementById('dash-balance');
  if (bal) bal.innerText = formatNum(state.capital + totalPnL) + 'đ';

  const pnlEl = document.getElementById('dash-pnl');
  if (pnlEl) {
    pnlEl.innerText = (totalPnL >= 0 ? '+' : '') + formatNum(totalPnL) + 'đ';
    pnlEl.className = `text-xl md:text-2xl font-mono font-black mt-1 ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
  }

  const wr = document.getElementById('dash-winrate');
  if (wr) wr.innerText = winRate + '%';

  const hold = document.getElementById('dash-holding');
  if (hold) hold.innerText = open.length;

  updateAllocationData(open);
  renderJournalTable();
}

function updateAllocationData(openTrades) {
  if (!state.charts.allocation) return;
  const invested = openTrades.reduce((acc, curr) => acc + (curr.qty * curr.buyPrice), 0);
  const currentTotal = state.capital; // Simplified
  const cash = Math.max(0, currentTotal - invested);

  state.charts.allocation.data.datasets[0].data = [cash, invested];
  state.charts.allocation.update();
}

// --- Market Logic ---
function evaluateMarketRisk() {
  const days = parseInt(document.getElementById('market-dist-days')?.value, 10) || 0;
  const status = document.getElementById('dist-status');
  const action = document.getElementById('dist-action');
  const card = document.getElementById('dist-card');

  if (!status || !action || !card) return;

  if (days <= 2) {
    status.innerText = "XU HƯỚNG TĂNG";
    status.className = "text-lg font-black text-emerald-600 uppercase tracking-tight";
    action.innerText = "Giữ nguyên quy mô giao dịch bình thường.";
    card.style.borderTopColor = "#10b981";
  } else if (days === 3) {
    status.innerText = "CẨN TRỌNG";
    status.className = "text-lg font-black text-amber-600 uppercase tracking-tight";
    action.innerText = "GIẢM MARGIN - Bảo vệ tài khoản.";
    card.style.borderTopColor = "#f59e0b";
  } else if (days === 4) {
    status.innerText = "RỦI RO CAO";
    status.className = "text-lg font-black text-orange-600 uppercase tracking-tight";
    action.innerText = "Giảm tỷ trọng danh mục.";
    card.style.borderTopColor = "#f97316";
  } else if (days === 5) {
    status.innerText = "CẢNH BÁO ĐỎ";
    status.className = "text-lg font-black text-rose-600 uppercase tracking-tight";
    action.innerText = "Hạ tỷ trọng gấp. Giữ tối đa 50% CP.";
    card.style.borderTopColor = "#f43f5e";
  } else {
    status.innerText = "NGUY HIỂM CỰC ĐỘ";
    status.className = "text-lg font-black text-rose-700 uppercase tracking-tight";
    action.innerText = "ĐƯA VỀ 100% TIỀN MẶT - ĐỨNG NGOÀI!";
    card.style.borderTopColor = "#e11d48";
  }
}

function updateSentiment() {
  const slider = document.getElementById('sentiment-slider');
  const display = document.getElementById('sentiment-val-display');
  if (!slider || !display) return;

  const val = parseInt(slider.value, 10);
  display.innerText = val;

  let color = "#10b981"; // emerald
  if (val <= 30) color = "#f43f5e"; // rose
  else if (val <= 45) color = "#f59e0b"; // amber
  else if (val >= 75) color = "#3b82f6"; // blue

  if (state.charts.sentiment) {
    state.charts.sentiment.data.datasets[0].data = [val, 100 - val];
    state.charts.sentiment.data.datasets[0].backgroundColor = [color, '#f5f5f4'];
    state.charts.sentiment.update();
  }
}

// --- Charts Initialization ---
function initCharts() {
  // Equity Mock Data
  const equityCanvas = document.getElementById('equity-chart');
  if (equityCanvas) {
    const ctxE = equityCanvas.getContext('2d');
    state.charts.equity = new Chart(ctxE, {
      type: 'line',
      data: {
        labels: ['T1', 'T2', 'T3'],
        datasets: [{
          data: [2000000000, 2026000000, 2054710000],
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return formatNum(c.raw) + 'đ'; } } }
        },
        scales: { y: { display: false }, x: { grid: { display: false } } }
      }
    });
  }

  // Allocation Doughnut
  const allocCanvas = document.getElementById('allocation-chart');
  if (allocCanvas) {
    const ctxA = allocCanvas.getContext('2d');
    state.charts.allocation = new Chart(ctxA, {
      type: 'doughnut',
      data: {
        labels: ['Tiền mặt', 'Cổ phiếu'],
        datasets: [{ data: [100, 0], backgroundColor: ['#e7e5e4', '#0ea5e9'], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 10, family: 'Inter' } }
          }
        }
      }
    });
  }

  // Sentiment Gauge
  const sentiCanvas = document.getElementById('sentiment-gauge');
  if (sentiCanvas) {
    const ctxS = sentiCanvas.getContext('2d');
    state.charts.sentiment = new Chart(ctxS, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [50, 50],
          backgroundColor: ['#10b981', '#f5f5f4'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: { tooltip: { enabled: false } },
        animation: { duration: 500 }
      }
    });
  }
}

// Expose functions globally (để onclick trong HTML gọi được)
window.switchTab = switchTab;
window.updateSystemCapital = updateSystemCapital;
window.calculatePosition = calculatePosition;
window.addTrade = addTrade;
window.deleteTrade = deleteTrade;
window.evaluateMarketRisk = evaluateMarketRisk;
window.updateSentiment = updateSentiment;
