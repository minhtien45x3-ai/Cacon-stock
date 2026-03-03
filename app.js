// app.js
let journalData = [];

window.onload = () => { lucide.createIcons(); };

// Auth Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-modal').classList.add('hidden');
        await checkAdminRole(user.uid);
        loadUserJournal(user.uid);
        if (userRole === 'admin') loadAdminDashboard();
        loadGlobalMarket();
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
    }
});

async function handleLogin() {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    await auth.signInWithEmailAndPassword(e, p);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
}

function loadUserJournal(uid) {
    db.collection("journal").where("userId", "==", uid).orderBy("date", "desc")
      .onSnapshot(snap => {
          journalData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderJournal();
      });
}

function renderJournal() {
    const body = document.getElementById('journal-body');
    body.innerHTML = journalData.map(t => `
        <tr class="border-b border-white/5">
            <td class="p-5 font-mono text-[10px]">${t.date}</td>
            <td class="p-5 font-black text-white">${t.ticker}</td>
            <td class="p-5">${t.setup}</td>
            <td class="p-5 text-right font-mono ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${t.pnl.toLocaleString()}đ</td>
            <td class="p-5 text-center"><button onclick="deleteEntry('${t.id}')" class="text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function toggleChat() { document.getElementById('chat-container').classList.toggle('hidden'); if(!document.getElementById('chat-container').classList.contains('hidden')) loadChat(); }

async function sendChatMessage() {
    const inp = document.getElementById('chat-input');
    if (!inp.value.trim()) return;
    await db.collection("messages").add({
        text: inp.value,
        sender: currentUser.email.split('@')[0],
        role: userRole,
        uid: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    inp.value = '';
}

function loadChat() {
    db.collection("messages").orderBy("timestamp", "asc").limitToLast(30).onSnapshot(snap => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = snap.docs.map(doc => {
            const m = doc.data();
            const isMe = m.uid === currentUser.uid;
            return `<div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[8px] text-slate-500 uppercase">${m.sender} ${m.role==='admin'?'🚀':''}</span>
                <div class="px-3 py-2 rounded-xl text-[11px] ${isMe?'bg-emerald-600':'bg-white/10'}">${m.text}</div>
            </div>`;
        }).join('');
        box.scrollTop = box.scrollHeight;
    });
}

async function updateGlobalMarketSettings() {
    const days = document.getElementById('market-dist-days').value;
    await db.collection("settings").doc("market").set({ distDays: days, updatedBy: currentUser.email });
    alert("Đã cập nhật!");
}

function loadGlobalMarket() {
    db.collection("settings").doc("market").onSnapshot(doc => {
        if(doc.exists) document.getElementById('market-dist-days').value = doc.data().distDays;
    });
}