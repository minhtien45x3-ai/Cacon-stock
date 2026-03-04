// app.js
window.onload = () => {
    lucide.createIcons();
    loadGlobalData();
    loadJournalData();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
}

function loadGlobalData() {
    // Tải số ngày phân phối thị trường
    db.collection("settings").doc("market").onSnapshot(doc => {
        if(doc.exists) document.getElementById('market-dist-days').value = doc.data().distDays;
    });
}

function loadJournalData() {
    // Tải nhật ký chung cho tất cả mọi người
    db.collection("journal").orderBy("date", "desc").onSnapshot(snap => {
        const body = document.getElementById('journal-body');
        body.innerHTML = snap.docs.map(doc => {
            const t = doc.data();
            return `<tr class="border-b border-white/5">
                <td class="p-5 font-mono text-[10px]">${t.date}</td>
                <td class="p-5 font-black text-white">${t.ticker}</td>
                <td class="p-5 text-[10px]">${t.setup}</td>
                <td class="p-5 text-right font-mono">${(t.buyPrice || 0).toLocaleString()}</td>
                <td class="p-5 text-right font-mono text-emerald-400">${(t.pnl || 0).toLocaleString()}đ</td>
            </tr>`;
        }).join('');
    });
}

function toggleChat() {
    document.getElementById('chat-container').classList.toggle('hidden');
    if(!document.getElementById('chat-container').classList.contains('hidden')) loadChat();
}

async function sendChatMessage() {
    const inp = document.getElementById('chat-input');
    if (!inp.value.trim()) return;
    await db.collection("messages").add({
        text: inp.value,
        sender: "Thành viên",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    inp.value = '';
}

function loadChat() {
    db.collection("messages").orderBy("timestamp", "asc").limitToLast(20).onSnapshot(snap => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = snap.docs.map(doc => {
            const m = doc.data();
            return `<div class="flex flex-col items-start">
                <span class="text-[8px] text-slate-500 uppercase">${m.sender || 'Ẩn danh'}</span>
                <div class="px-3 py-2 rounded-xl text-[11px] bg-white/10 text-slate-200 border border-white/5">${m.text}</div>
            </div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
    });
}