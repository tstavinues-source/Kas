// ==========================================
// KAS APATO 404 - CORE SYSTEM & ADVANCED UI OVERRIDE
// VERSI: ULTIMATE & OPTIMIZED (1.3.1) - FINAL STABLE
// ==========================================

// --- 1. PENGURUSAN STATUS (STATE MANAGEMENT) ---
const appState = {
    viewMode: 'period', // Mod paparan: 'period', 'month', 'all'
    filters: {
        search: '',
        category: 'ALL',
        user: 'ALL'
    },
    rawData: [], // Cache data dari Firebase
    ai: {
        stagingItems: [] // Enkapsulasi untuk mengelakkan konflik pembolehubah global
    },
    isInitialLoad: true // Bendera untuk notifikasi muatan pertama
};

let globalItemsMap = {};
let itemToDelete = null;
let itemToEditId = null;

// --- 2. LOGIK TEMA BERGANDA (MULTI THEME) ---
const themes = ['theme-neo', 'theme-light', 'theme-synth'];
let currentThemeIndex = 0;

function applyTheme(index) {
    document.body.classList.remove(...themes);
    document.body.classList.add(themes[index]);
    localStorage.setItem('apato_theme', index);
}

function toggleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(currentThemeIndex);
}

// --- 3. FUNGSI UTILITI & PEMBANTU ---
function safeHideElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function safeShowElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

// Tampung (Polyfill) untuk roundRect (Baik pulih pepijat Safari/Pelayar Lama)
function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// --- 4. ENJIN SUNTIKAN ANTARA MUKA (UI INJECTION) ---
function injectAdvancedUI() {
    const mainContainer = document.querySelector('.max-w-md.mx-auto');
    const dashboard = document.querySelector('.neo-panel');
    const ledgerList = document.getElementById('ledger-list');

    if(!dashboard || !ledgerList) return; 
    if(document.getElementById('injected-ui-flag')) return; 

    // A. Bar Kemajuan & Penukar Mod (Progress Bar & Mode Toggle)
    const dashAddon = document.createElement('div');
    dashAddon.id = "injected-ui-flag";
    dashAddon.innerHTML = `
        <div class="mt-6 border-t border-theme-border pt-5 relative z-10">
            <div class="flex justify-between items-center text-[9px] font-tech text-theme-muted mb-2 uppercase tracking-widest font-bold">
                <span id="period-progress-text">PROGRES SIKLUS: 0%</span>
                <span id="period-days-left">0 HARI TERSISA</span>
            </div>
            <div class="w-full bg-theme-bg h-2 rounded-full overflow-hidden border border-theme-border shadow-inner">
                <div id="period-progress-bar" class="bg-theme-primary h-full transition-all duration-1000 shadow-[0_0_15px_var(--primary-color)] relative overflow-hidden" style="width: 0%">
                    <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
            
            <div class="flex gap-2 mt-5 p-1.5 bg-theme-glass rounded-xl border border-theme-border backdrop-blur-sm shadow-inner">
                <button onclick="changeViewMode('period')" id="btn-mode-period" class="flex-1 py-2.5 text-[9px] font-tech font-bold rounded-lg bg-theme-primary/20 text-theme-primary border border-theme-primary/30 transition-all uppercase shadow-sm">Siklus 16-15</button>
                <button onclick="changeViewMode('month')" id="btn-mode-month" class="flex-1 py-2.5 text-[9px] font-tech font-bold rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-all border border-transparent uppercase">Bulanan</button>
                <button onclick="changeViewMode('all')" id="btn-mode-all" class="flex-1 py-2.5 text-[9px] font-tech font-bold rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-all border border-transparent uppercase">All-Time</button>
            </div>
        </div>
    `;
    dashboard.appendChild(dashAddon);

    // B. Carta, Penjejak Keperluan Asas, & Penapis
    const controlPanel = document.createElement('div');
    controlPanel.className = "mb-8 space-y-4";
    controlPanel.innerHTML = `
        <!-- Carta Kanvas Tren 7 Hari -->
        <div class="neo-panel p-5 relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-theme-primary/10 rounded-full blur-xl"></div>
            <h3 class="font-tech text-[10px] text-theme-muted uppercase tracking-[0.2em] mb-4 flex justify-between font-bold">
                <span><i class="fa-solid fa-chart-line mr-2 text-theme-primary"></i> Tren Pengeluaran (7 Hari)</span>
            </h3>
            <canvas id="trendChart" class="w-full h-28 relative z-10"></canvas>
        </div>

        <!-- Penjejak Keperluan Asas (Tracker) -->
        <div class="neo-panel p-4 border-theme-primary/30 bg-theme-glass">
            <h3 class="font-tech text-[10px] text-theme-primary uppercase tracking-[0.2em] mb-4 border-b border-theme-border pb-3 font-bold flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></span> Riwayat Belanja Pokok
            </h3>
            <div class="grid grid-cols-3 gap-3 text-center">
                <div class="bg-theme-bg/50 backdrop-blur-md p-3 rounded-xl border border-theme-border shadow-inner hover:border-theme-primary/50 transition-colors">
                    <i class="fa-solid fa-bowl-rice text-theme-muted text-xl mb-2 drop-shadow-md"></i>
                    <p class="text-[9px] font-tech text-theme-muted tracking-widest uppercase font-bold">Beras</p>
                    <p class="text-[12px] font-jp font-black text-theme-text mt-1" id="track-beras">¥0</p>
                </div>
                <div class="bg-theme-bg/50 backdrop-blur-md p-3 rounded-xl border border-theme-border shadow-inner hover:border-theme-primary/50 transition-colors">
                    <i class="fa-solid fa-bottle-droplet text-theme-muted text-xl mb-2 drop-shadow-md"></i>
                    <p class="text-[9px] font-tech text-theme-muted tracking-widest uppercase font-bold">Minyak</p>
                    <p class="text-[12px] font-jp font-black text-theme-text mt-1" id="track-minyak">¥0</p>
                </div>
                <div class="bg-theme-bg/50 backdrop-blur-md p-3 rounded-xl border border-theme-border shadow-inner hover:border-theme-primary/50 transition-colors">
                    <i class="fa-solid fa-pump-soap text-theme-muted text-xl mb-2 drop-shadow-md"></i>
                    <p class="text-[9px] font-tech text-theme-muted tracking-widest uppercase font-bold">Sabun</p>
                    <p class="text-[12px] font-jp font-black text-theme-text mt-1" id="track-sabun">¥0</p>
                </div>
            </div>
        </div>

        <!-- Panel Carian & Penapis -->
        <div class="neo-panel p-4 border-theme-primary/30 bg-theme-glass">
            <div class="flex gap-3 mb-3">
                <div class="flex-1 relative group">
                    <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted text-[11px] group-focus-within:text-theme-primary transition-colors"></i>
                    <input type="text" id="filter-search" oninput="updateFilters('search', this.value)" class="w-full bg-theme-bg/80 border border-theme-border rounded-xl p-3 pl-9 text-[11px] font-sans text-theme-text placeholder-theme-muted outline-none focus:border-theme-primary transition-all shadow-inner" placeholder="Cari Log (Beras, Makan, dll)...">
                </div>
                <button onclick="exportCSV()" class="bg-theme-success/10 hover:bg-theme-success text-theme-success hover:text-white border border-theme-success/30 px-4 rounded-xl text-[12px] font-tech tracking-wider transition-all shadow-[0_4px_15px_rgba(22,163,74,0.1)] group" title="Export to CSV">
                    <i class="fa-solid fa-file-csv group-hover:scale-110 transition-transform"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <select id="filter-category" onchange="updateFilters('category', this.value)" class="w-full bg-theme-bg/80 border border-theme-border rounded-xl p-3 text-[10px] font-tech font-bold uppercase text-theme-text outline-none appearance-none cursor-pointer shadow-inner focus:border-theme-primary">
                        <option value="ALL">SEMUA KATEGORI</option>
                        <option value="Pendapatan">Pendapatan</option>
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Sabun & Pembersih">Pembersih</option>
                        <option value="Kebutuhan Harian">Keb. Harian</option>
                        <option value="Transportasi">Transportasi</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                    <i class="fa-solid fa-filter absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted text-[10px] pointer-events-none"></i>
                </div>
                <div class="relative">
                    <select id="filter-user" onchange="updateFilters('user', this.value)" class="w-full bg-theme-bg/80 border border-theme-border rounded-xl p-3 text-[10px] font-tech font-bold uppercase text-theme-text outline-none appearance-none cursor-pointer shadow-inner focus:border-theme-primary">
                        <option value="ALL">SEMUA OPERATOR</option>
                        <option value="Amry Galih N">Amry Galih N</option>
                        <option value="Fikri Muzaki">Fikri Muzaki</option>
                        <option value="Gungun G">Gungun G</option>
                        <option value="Saleh H">Saleh H</option>
                    </select>
                    <i class="fa-solid fa-users absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted text-[10px] pointer-events-none"></i>
                </div>
            </div>
        </div>
    `;
    mainContainer.insertBefore(controlPanel, ledgerList);
    
    checkPeriodNotification();
    updateProgressBar();
}

// --- 5. SISTEM KESELAMATAN ---
function openSettingsAuth() {
    const pwd = prompt("SYSTEM LOCKED. Enter Auth Code:");
    if (pwd === "99") {
        openModal('modal-settings');
    } else if (pwd !== null) {
        showToast("AKSES DITOLAK: KODE SALAH", true);
    }
}
function decodeSecure(encoded) { return atob(encoded); }

// --- 6. KESAN VISUAL & MODAL UI ---
function createParticles() {
    const box = document.getElementById('particle-box');
    if(!box) return;
    const petal = document.createElement('div');
    petal.className = 'particle';
    
    const pColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#00E5FF';
    const dColor = getComputedStyle(document.body).getPropertyValue('--danger-color').trim() || '#FF2A4D';
    const sColor = getComputedStyle(document.body).getPropertyValue('--success-color').trim() || '#00E676';
    const colors = [pColor, dColor, sColor, 'rgba(255,255,255,0.9)'];
    
    const selectedColor = colors[Math.floor(Math.random()*colors.length)];
    
    // Kesan Glitter Diperkuat
    petal.style.background = `linear-gradient(to bottom, transparent, ${selectedColor}, transparent)`;
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.height = (Math.random() * 15 + 5) + 'px'; 
    petal.style.width = (Math.random() * 2 + 1) + 'px'; 
    petal.style.opacity = Math.random() * 0.5 + 0.3; 
    petal.style.animationDuration = (Math.random() * 2.5 + 1.5) + 's'; 
    petal.style.boxShadow = `0 0 10px ${selectedColor}, 0 0 5px ${selectedColor}`; 
    
    box.appendChild(petal);
    setTimeout(() => petal.remove(), 4500);
}
// Masa dikurangkan agar lebih banyak zarah berkilau (glitter)
setInterval(createParticles, 100);

function showToast(msg, isError = false) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const icon = isError ? '<i class="fa-solid fa-triangle-exclamation text-theme-danger"></i>' : '<i class="fa-solid fa-check text-theme-primary"></i>';
    toast.className = `toast ${isError ? '!border-theme-danger' : ''}`;
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3400);
}

function openModal(id) {
    const m = document.getElementById(id);
    if(!m) return;
    m.style.display = 'flex';
    setTimeout(() => m.classList.add('show'), 10);
}

function closeModal(id) {
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.remove('show');
    setTimeout(() => m.style.display = 'none', 300);
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    if (el && el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if(icon) icon.style.transform = 'rotate(180deg)';
    } else if (el) {
        el.classList.add('hidden');
        if(icon) icon.style.transform = 'rotate(0deg)';
    }
}

function switchTab(tab) {
    const btnActive = "flex-1 bg-theme-primary/20 text-theme-primary border border-theme-primary/30 text-[10px] py-3 rounded-lg font-tech font-bold uppercase tracking-widest transition-all shadow-sm";
    const btnInactive = "flex-1 text-theme-muted hover:text-theme-text border border-transparent text-[10px] py-3 rounded-lg font-tech font-bold uppercase tracking-widest transition-all hover:bg-theme-bg";
    
    if(tab === 'arsip') {
        safeShowElement('archive-list');
        safeHideElement('log-list');
        if(document.getElementById('tab-arsip')) document.getElementById('tab-arsip').className = btnActive;
        if(document.getElementById('tab-log')) document.getElementById('tab-log').className = btnInactive;
    } else {
        safeHideElement('archive-list');
        safeShowElement('log-list');
        if(document.getElementById('tab-log')) document.getElementById('tab-log').className = btnActive;
        if(document.getElementById('tab-arsip')) document.getElementById('tab-arsip').className = btnInactive;
    }
}

function getCategoryStyle(cat) {
    const styles = {
        'Pendapatan': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
        'Makanan': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
        'Minuman': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
        'Sabun & Pembersih': 'text-teal-400 border-teal-400/30 bg-teal-400/10',
        'Kebutuhan Harian': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
        'Transportasi': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    };
    return styles[cat] || 'text-theme-muted border-theme-border bg-theme-bg';
}

function getCategoryIcon(cat) {
     const icons = {
        'Pendapatan': 'fa-money-bill-wave',
        'Makanan': 'fa-burger',
        'Minuman': 'fa-mug-hot',
        'Sabun & Pembersih': 'fa-pump-soap',
        'Kebutuhan Harian': 'fa-box',
        'Transportasi': 'fa-train',
    };
    return icons[cat] || 'fa-tag';
}

function formatDateHeader(ts) {
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2,'0')} / ${(d.getMonth()+1).toString().padStart(2,'0')} / ${d.getFullYear()}`;
}

// --- 7. FIREBASE & LOGIK TEMPOH (16-15) ---
const firebaseConfig = {
    apiKey: decodeSecure("QUl6YVN5QWlNQWc2X0NzWGFsNWdfRVhMYmdvUTM1Vklib1NSSjRB"),
    authDomain: decodeSecure("a2FzLWFjMjg5LmZpcmViYXNlYXBwLmNvbQ=="),
    databaseURL: decodeSecure("aHR0cHM6Ly9rYXMtYWMyODktZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"),
    projectId: decodeSecure("a2FzLWFjMjg5"),
    storageBucket: decodeSecure("a2FzLWFjMjg5LmZpcmViYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: decodeSecure("MzQxOTA3NTk5MzMx"),
    appId: decodeSecure("MTozNDE5MDc1OTkzMzE6d2ViOjM1ZjFkN2U2MzAxNDg5OWE0YWJhZDY=")
};

if(typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.database() : null;
const path = 'apato_404_ledger';
const logPath = 'apato_404_logs';

function getPeriodRange() {
    const now = new Date();
    let start, end;
    if (now.getDate() >= 16) {
        start = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 15, 23, 59, 59);
    } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 16, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
    }
    return { 
        start: start.getTime(), end: end.getTime(), 
        label: `Siklus: ${start.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}` 
    };
}

// --- 8. ENJIN DATA TERAS (CORE DATA ENGINE) ---
function loadData() {
    if(!db) return;
    
    if (appState.isInitialLoad) {
        showToast("MENYINKRONKAN DATABASE...", false);
    }

    db.ref(path).on('value', (snap) => {
        if (appState.isInitialLoad) {
            appState.isInitialLoad = false;
        }

        const data = snap.val();
        if (!data) {
            if(document.getElementById('total-saldo')) document.getElementById('total-saldo').innerText = "¥0";
            if(document.getElementById('item-count')) document.getElementById('item-count').innerText = "00";
            appState.rawData = [];
            return;
        }

        // Cache data global
        appState.rawData = Object.keys(data).map(k => ({id: k, ...data[k]})).sort((a,b) => b.ts - a.ts);
        
        // Simpan ke peta rujukan suntingan
        globalItemsMap = {};
        appState.rawData.forEach(item => globalItemsMap[item.id] = item);

        renderFilteredUI();
    });
}

function renderFilteredUI() {
    const list = document.getElementById('ledger-list');
    const archList = document.getElementById('archive-list');
    const totalEl = document.getElementById('total-saldo');
    
    if(!list) return;
    list.innerHTML = "";
    if(archList) archList.innerHTML = ""; 

    let accumulatedTotal = 0; // Baki kumulatif (tidak di-reset setiap bulan)
    let activeCount = 0;
    let currentActiveDate = "";
    let currentArchDate = "";

    // Had Pemaparan untuk mengoptimumkan memori DOM
    const MAX_RENDER = 150;
    let activeRenderedCount = 0;
    let archiveRenderedCount = 0;

    // Pemantau Keperluan Asas
    let sumBeras = 0, sumMinyak = 0, sumSabun = 0;

    // A. Penentuan Had Masa Paparan
    const now = new Date();
    let timeStart = 0, timeEnd = Infinity;
    
    if (appState.viewMode === 'period') {
        const p = getPeriodRange(); 
        timeStart = p.start; timeEnd = p.end;
        if(document.getElementById('active-period-label')) document.getElementById('active-period-label').innerText = p.label;
    } else if (appState.viewMode === 'month') {
        timeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime();
        timeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
        if(document.getElementById('active-period-label')) document.getElementById('active-period-label').innerText = `BULAN: ${now.toLocaleDateString('id-ID', {month:'long', year:'numeric'}).toUpperCase()}`;
    } else {
        if(document.getElementById('active-period-label')) document.getElementById('active-period-label').innerText = "DATA ALL-TIME";
    }

    // B. Pemasangan Data & Kiraan Baki
    appState.rawData.forEach(item => {
        // Semak penapis kategori & pengguna
        const matchCat = appState.filters.category === 'ALL' || item.category === appState.filters.category;
        const matchUser = appState.filters.user === 'ALL' || item.user === appState.filters.user;
        const isInc = item.type === 'masuk';

        // PENTING: Pengiraan Baki Kumulatif dibawa ke hadapan (Carry-over balance)
        // Baki dikira dari semua transaksi sejak mula SEHINGGA tarikh akhir tempoh semasa.
        if (item.ts <= timeEnd && matchCat && matchUser) {
            accumulatedTotal += isInc ? item.amt : -item.amt;
        }

        // Penapis carian teks
        const matchSearch = !appState.filters.search || item.desc.toLowerCase().includes(appState.filters.search.toLowerCase());
        
        // Jika tidak lulus penapis, jangan paparkan kad HTML
        if (!(matchSearch && matchCat && matchUser)) return;

        const isActive = item.ts >= timeStart && item.ts <= timeEnd; 
        
        const catStyle = getCategoryStyle(item.category || 'Lainnya');
        const catIcon = getCategoryIcon(item.category || 'Lainnya');
        const itemDateHeader = formatDateHeader(item.ts);

        const borderLight = isInc ? 'border-theme-success shadow-[0_0_15px_var(--success-color)]' : 'border-theme-danger shadow-[0_0_15px_var(--danger-color)]';
        const textValueColor = isInc ? 'text-transparent bg-clip-text bg-gradient-to-r from-theme-success to-green-400' : 'text-theme-text';

        // Hitung statistik penjejakan hanya untuk transaksi aktif
        if (isActive) {
            activeCount++;
            if (!isInc) {
                const d = item.desc.toUpperCase();
                if (d.includes('BERAS')) sumBeras += item.amt;
                if (d.includes('MINYAK')) sumMinyak += item.amt;
                if (d.includes('SABUN') || d.includes('CUCI') || d.includes('SUNLIGHT') || d.includes('DETERJEN')) sumSabun += item.amt;
            }
        }

        // ==========================================
        // BAIK PULIH PEPIJAT GPU (Scroll Patah-patah): 
        // Menggunakan 'bg-theme-panel rounded-2xl' untuk mengelakkan kesan blur yang membebankan HP.
        // ==========================================
        const cardHTML = `
            <div class="bg-theme-panel p-5 rounded-2xl flex justify-between items-center border border-theme-border border-l-4 ${borderLight} group relative overflow-hidden shadow-sm">
                <div class="flex-1 pr-3 relative z-10">
                    <div class="flex items-center gap-2 mb-2.5 flex-wrap">
                        <span class="font-tech text-[9px] bg-theme-bg text-theme-text px-2 py-1 rounded uppercase tracking-[0.1em] border border-theme-border font-bold shadow-sm">${item.user}</span>
                        <span class="font-tech text-[9px] ${catStyle} border px-2 py-1 rounded uppercase tracking-[0.1em] flex items-center gap-1.5 font-bold shadow-sm">
                            <i class="fa-solid ${catIcon}"></i> ${item.category || 'LAINNYA'}
                        </span>
                    </div>
                    <h4 class="font-sans text-[14px] font-bold text-theme-text uppercase tracking-tight leading-tight">${item.desc}</h4>
                    <p class="font-tech text-[10px] text-theme-muted uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5">
                        <i class="fa-regular fa-clock text-[8px]"></i> ${new Date(item.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false})}
                    </p>
                </div>
                <div class="flex flex-col items-end gap-2 relative z-10 pl-4 border-l border-theme-border/50 min-w-[80px]">
                    <span class="font-jp text-xl font-black ${textValueColor} tracking-tighter drop-shadow-sm">
                        ${isInc ? '+' : '-'}¥${item.amt.toLocaleString()}
                    </span>
                    <div class="flex gap-2 mt-1">
                        <button onclick="openEditModal('${item.id}')" class="text-theme-muted hover:text-theme-primary transition-all bg-theme-bg p-2 rounded-lg border border-transparent hover:border-theme-primary/30 shadow-sm"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="confirmDelete('${item.id}', '${item.desc}')" class="text-theme-muted hover:text-theme-danger transition-all bg-theme-bg p-2 rounded-lg border border-transparent hover:border-theme-danger/30 shadow-sm"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;

        // Logik Had Paparan Data
        if (isActive) {
            if (activeRenderedCount < MAX_RENDER) {
                if(currentActiveDate !== itemDateHeader) {
                    list.insertAdjacentHTML('beforeend', `<div class="date-divider">TANGGAL: ${itemDateHeader}</div>`);
                    currentActiveDate = itemDateHeader;
                }
                list.insertAdjacentHTML('beforeend', cardHTML);
                activeRenderedCount++;
            }
        } else if (archList && archiveRenderedCount < MAX_RENDER) {
            if(currentArchDate !== itemDateHeader) {
                archList.insertAdjacentHTML('beforeend', `<div class="date-divider">ARSIP: ${itemDateHeader}</div>`);
                currentArchDate = itemDateHeader;
            }
            archList.insertAdjacentHTML('beforeend', cardHTML);
            archiveRenderedCount++;
        }
    });

    if (activeRenderedCount >= MAX_RENDER) {
        list.insertAdjacentHTML('beforeend', `<div class="text-center text-[10px] font-tech text-theme-muted mt-6 border border-theme-border bg-theme-bg rounded-xl py-3 uppercase tracking-widest font-bold shadow-inner">Menampilkan ${MAX_RENDER} Data Terakhir</div>`);
    }
    
    if (archList && archiveRenderedCount >= MAX_RENDER) {
        archList.insertAdjacentHTML('beforeend', `<div class="text-center text-[10px] font-tech text-theme-muted mt-4 border border-theme-border bg-theme-bg rounded-xl py-3 uppercase tracking-widest font-bold shadow-inner">Menampilkan ${MAX_RENDER} Data Arsip Terakhir</div>`);
    }

    // Paparkan Baki Kumulatif
    if(totalEl) totalEl.innerText = (accumulatedTotal < 0 ? "-" : "") + "¥" + Math.abs(accumulatedTotal).toLocaleString();
    
    if(document.getElementById('item-count')) document.getElementById('item-count').innerText = activeCount < 10 ? "0"+activeCount : activeCount;
    if(document.getElementById('sync-time')) document.getElementById('sync-time').innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    
    // Kemas kini Penjejak (Tracker UI)
    if(document.getElementById('track-beras')) document.getElementById('track-beras').innerText = "¥" + sumBeras.toLocaleString();
    if(document.getElementById('track-minyak')) document.getElementById('track-minyak').innerText = "¥" + sumMinyak.toLocaleString();
    if(document.getElementById('track-sabun')) document.getElementById('track-sabun').innerText = "¥" + sumSabun.toLocaleString();

    drawChart(appState.rawData, timeStart, timeEnd);
}

// --- 9. CIRI-CIRI LANJUTAN (CARTA, PENAPIS, EKSPORT, KEMAJUAN) ---
function changeViewMode(mode) {
    appState.viewMode = mode;
    
    const activeClass = "flex-1 py-2.5 text-[9px] font-tech font-bold rounded-lg bg-theme-primary/20 text-theme-primary border border-theme-primary/30 transition-all uppercase shadow-sm".split(" ");
    const inactiveClass = "flex-1 py-2.5 text-[9px] font-tech font-bold rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-all border border-transparent uppercase".split(" ");
    
    ['period', 'month', 'all'].forEach(m => {
        const btn = document.getElementById(`btn-mode-${m}`);
        if(!btn) return;
        if(m === mode) {
            btn.className = ""; btn.classList.add(...activeClass);
        } else {
            btn.className = ""; btn.classList.add(...inactiveClass);
        }
    });
    
    renderFilteredUI();
    updateProgressBar();
}

// Lengah Carian (Debounce) untuk prestasi yang lebih lancar
let filterTimeout;
function updateFilters(key, value) {
    if (key === 'search') {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            appState.filters[key] = value;
            renderFilteredUI();
        }, 300);
    } else {
        appState.filters[key] = value;
        renderFilteredUI();
    }
}

function exportCSV() {
    if(appState.rawData.length === 0) return showToast("TIDAK ADA DATA UNTUK DIEXPORT", true);
    
    const now = new Date();
    let start = 0, end = Infinity;
    if (appState.viewMode === 'period') { const p = getPeriodRange(); start = p.start; end = p.end; }
    else if (appState.viewMode === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime(); }

    const dataToExport = appState.rawData.filter(item => {
        if (item.ts < start || item.ts > end) return false;
        if (appState.filters.category !== 'ALL' && item.category !== appState.filters.category) return false;
        if (appState.filters.user !== 'ALL' && item.user !== appState.filters.user) return false;
        if (appState.filters.search && !item.desc.toLowerCase().includes(appState.filters.search.toLowerCase())) return false;
        return true;
    });

    if (dataToExport.length === 0) {
        return showToast("TIDAK ADA DATA YANG LOLOS FILTER", true);
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TANGGAL,WAKTU,OPERATOR,KATEGORI,TIPE,DESKRIPSI,NOMINAL (JPY)\n";

    dataToExport.forEach(item => {
        const d = new Date(item.ts);
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const timeStr = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false});
        const desc = `"${item.desc.replace(/"/g, '""')}"`;
        csvContent += `${dateStr},${timeStr},${item.user},${item.category || 'Lainnya'},${item.type.toUpperCase()},${desc},${item.amt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `APATO_REPORT_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV BERHASIL DIUNDUH");
}

function drawChart(data, timeStart, timeEnd) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        setTimeout(() => drawChart(data, timeStart, timeEnd), 500);
        return;
    }
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 300; 
    const height = rect.height || 100;
    
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    const outData = [0,0,0,0,0,0,0];
    const today = new Date();
    today.setHours(23,59,59,999);
    
    data.forEach(item => {
        if(item.type !== 'keluar') return;
        if (appState.filters.category !== 'ALL' && item.category !== appState.filters.category) return;
        if (appState.filters.user !== 'ALL' && item.user !== appState.filters.user) return;
        if (appState.filters.search && !item.desc.toLowerCase().includes(appState.filters.search.toLowerCase())) return;

        const diffDays = Math.floor((today.getTime() - item.ts) / (1000 * 3600 * 24));
        if(diffDays >= 0 && diffDays < 7) {
            outData[6 - diffDays] += item.amt; 
        }
    });

    const maxVal = Math.max(...outData, 100); 
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--danger-color').trim() || '#FF2A4D';
    
    const padding = 10;
    const barWidth = (width - padding*2) / 7 - 6;
    
    outData.forEach((val, i) => {
        const barHeight = (val / maxVal) * (height - padding*2);
        const x = padding + i * (barWidth + 6);
        const y = height - padding - barHeight;
        
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = 0.4;
        if (i === 6) ctx.globalAlpha = 1.0; 
        
        drawRoundedRect(ctx, x, y, barWidth, barHeight, 6);
        ctx.fill();
        
        if (val > 0) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#9ca3af';
            ctx.font = "8px 'Space Grotesk'";
            ctx.textAlign = "center";
            ctx.fillText((val/1000).toFixed(1) + 'k', x + barWidth/2, y - 6);
        }
    });
}

function updateProgressBar() {
    const p = getPeriodRange();
    const now = new Date().getTime();
    
    const totalDuration = p.end - p.start;
    const elapsed = now - p.start;
    
    let percent = (elapsed / totalDuration) * 100;
    if(percent < 0) percent = 0;
    if(percent > 100) percent = 100;
    
    const daysLeft = Math.ceil((p.end - now) / (1000 * 3600 * 24));
    
    const bar = document.getElementById('period-progress-bar');
    if(bar) bar.style.width = `${percent}%`;
    const txt = document.getElementById('period-progress-text');
    if(txt) txt.innerText = `PROGRES SIKLUS: ${Math.round(percent)}%`;
    const dl = document.getElementById('period-days-left');
    if(dl) dl.innerText = `${daysLeft} HARI TERSISA`;
}

function checkPeriodNotification() {
    const today = new Date().getDate();
    const lastNotified = localStorage.getItem('apato_last_notif_date');
    const currentMonthStr = new Date().getMonth().toString();
    
    if (today === 16 && lastNotified !== currentMonthStr) {
        setTimeout(() => {
            showToast("SIKLUS AKUNTANSI BARU DIMULAI (16-15)", false);
            localStorage.setItem('apato_last_notif_date', currentMonthStr);
        }, 2000);
    }
}

// --- 10. OPERASI PANGKALAN DATA (CRUD) ---
function send(type) {
    const user = document.getElementById('input-user') ? document.getElementById('input-user').value : null;
    const ket = document.getElementById('input-ket') ? document.getElementById('input-ket').value : null;
    const nom = document.getElementById('input-nom') ? document.getElementById('input-nom').value : null;
    const category = document.getElementById('input-category') ? document.getElementById('input-category').value : null;
    
    if(!user || !ket || !nom) return showToast("PARAMETER TIDAK LENGKAP", true);

    if(db) db.ref(path).push({
        user, desc: ket.toUpperCase(), amt: parseInt(nom), type, category,
        ts: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        createLog(`MANUAL_${type.toUpperCase()}`, `[${category}] ${ket.toUpperCase()} (¥${nom})`, user);
        document.getElementById('input-ket').value = "";
        document.getElementById('input-nom').value = "";
        showToast("DATA BERHASIL DISIMPAN");
    });
}

function confirmDelete(id, desc) {
    itemToDelete = { id, desc };
    const confirmMsg = document.getElementById('confirm-msg');
    if(confirmMsg) confirmMsg.innerText = desc;
    openModal('modal-confirm');
}

const confirmYesBtn = document.getElementById('confirm-yes-btn');
if(confirmYesBtn) {
    confirmYesBtn.onclick = () => {
        if(itemToDelete && db) {
            db.ref(path).child(itemToDelete.id).remove().then(() => {
                const userNode = document.getElementById('input-user');
                const user = userNode && userNode.value ? userNode.value : "Sistem";
                createLog("SYS.DELETE", `Menghapus: ${itemToDelete.desc}`, user);
                showToast("DATA DIHAPUS");
                closeModal('modal-confirm');
                itemToDelete = null;
            });
        }
    };
}

function openEditModal(id) {
    const item = globalItemsMap[id];
    if(!item) return;

    itemToEditId = id;
    if(document.getElementById('edit-user')) document.getElementById('edit-user').value = item.user;
    if(document.getElementById('edit-type')) document.getElementById('edit-type').value = item.type;
    if(document.getElementById('edit-category')) document.getElementById('edit-category').value = item.category || 'Lainnya';
    if(document.getElementById('edit-ket')) document.getElementById('edit-ket').value = item.desc;
    if(document.getElementById('edit-nom')) document.getElementById('edit-nom').value = item.amt;
    openModal('modal-edit');
}

function saveEdit() {
    const item = globalItemsMap[itemToEditId];
    if(!item) return;

    const newUser = document.getElementById('edit-user') ? document.getElementById('edit-user').value : null;
    const newType = document.getElementById('edit-type') ? document.getElementById('edit-type').value : null;
    const newCat = document.getElementById('edit-category') ? document.getElementById('edit-category').value : null;
    const newDesc = document.getElementById('edit-ket') ? document.getElementById('edit-ket').value.toUpperCase() : null;
    const newAmt = document.getElementById('edit-nom') ? parseInt(document.getElementById('edit-nom').value) || 0 : 0;

    if(!newUser || !newDesc || !newAmt) return showToast("PARAMETER TIDAK LENGKAP", true);

    if(db) db.ref(path).child(itemToEditId).update({
        user: newUser,
        type: newType,
        category: newCat,
        desc: newDesc,
        amt: newAmt
    }).then(() => {
        createLog("SYS.EDIT", `Modifikasi: [${item.desc}] ke [${newDesc}] (¥${newAmt})`, newUser);
        showToast("DATA BERHASIL DIPERBARUI");
        closeModal('modal-edit');
    });
}

// --- 11. SISTEM LOG DAN REKOD ---
function createLog(action, detail, user) {
    if(db) db.ref(logPath).push({ action, detail, user: user || "SYS", ts: firebase.database.ServerValue.TIMESTAMP });
}

function loadLogs() {
    if(!db) return;
    db.ref(logPath).limitToLast(100).on('value', snap => {
        const logList = document.getElementById('log-list');
        if(!logList) return;
        
        const data = snap.val();
        if(!data) {
            logList.innerHTML = `<div class="text-center text-theme-muted text-xs py-8 font-tech font-bold tracking-widest">TIDAK ADA AKTIVITAS</div>`;
            return;
        }

        logList.innerHTML = "";
        let currentLogDate = "";
        const logs = Object.keys(data).map(k => data[k]).sort((a,b) => b.ts - a.ts);
        
        logs.forEach(l => {
            const logDateHeader = formatDateHeader(l.ts);
            if(currentLogDate !== logDateHeader) {
                logList.insertAdjacentHTML('beforeend', `<div class="date-divider text-[8px] mt-4">${logDateHeader}</div>`);
                currentLogDate = logDateHeader;
            }

            logList.innerHTML += `
                <div class="border-l-2 border-theme-primary pl-3 py-3 mb-3 bg-theme-glass rounded-r-xl border-y border-r border-theme-border shadow-sm">
                    <p class="font-tech text-[9px] text-theme-muted uppercase flex justify-between tracking-widest mb-1.5">
                        <span class="text-theme-primary font-bold">${l.action}</span>
                        <span><i class="fa-solid fa-user-astronaut text-theme-muted mr-1"></i> ${l.user}</span>
                    </p>
                    <p class="font-sans text-[11px] text-theme-text font-bold leading-tight">${l.detail}</p>
                    <p class="font-tech text-[8px] text-theme-muted mt-2 uppercase tracking-widest flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${new Date(l.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false})}</p>
                </div>
            `;
        });
    });
}

// --- 12. SISTEM AI & KECERDASAN BUATAN (GEMINI) ---
let apiConfig = { apiKey: '', status: 'unconfigured' };
const API_MODEL = 'gemini-2.5-flash';
const _b64Code = "QVEuQWI4Uk42TF9Pa1Z0RllqdE80TnR5bkVsRTRtSkhqbm5pWHVXZjNTOElTaEs1UlNTWEE=";

function decryptMasterKey() { 
    try {
        return atob(_b64Code);
    } catch(e) {
        console.warn("Gagal mendekripsi key lalai:", e);
        return '';
    }
}

function checkKeyType(key) {
    const warningBox = document.getElementById('api-warning-box');
    const prefixSpan = document.getElementById('detected-key-prefix');
    if (!key || !warningBox || !prefixSpan) { 
        if(warningBox) warningBox.classList.add('hidden'); 
        return; 
    }
    prefixSpan.innerText = key.substring(0, 7);
    warningBox.classList.remove('hidden');
}

function updateAPIStatus(status, logMsg = '') {
    apiConfig.status = status;
    const badge = document.getElementById('api-status-badge');
    if(!badge) return;
    
    if (status === 'valid') {
        badge.className = "text-[9px] bg-theme-success/20 text-theme-success border border-theme-success px-3 py-1 rounded-full uppercase tracking-[0.1em] shadow-inner";
        badge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> AKTIF`;
    } else if (status === 'saved') {
        badge.className = "text-[9px] bg-theme-primary/20 text-theme-primary border border-theme-primary px-3 py-1 rounded-full uppercase tracking-[0.1em] shadow-inner";
        badge.innerHTML = `<i class="fa-solid fa-floppy-disk mr-1"></i> TERSIMPAN`;
    } else if (status === 'invalid') {
        badge.className = "text-[9px] bg-theme-danger/20 text-theme-danger border border-theme-danger px-3 py-1 rounded-full uppercase tracking-[0.1em] shadow-inner";
        badge.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> ERROR`;
    } else if (status === 'testing') {
        badge.className = "text-[9px] bg-theme-muted/20 text-theme-muted border border-theme-border px-3 py-1 rounded-full uppercase tracking-[0.1em] shadow-inner";
        badge.innerHTML = `<i class="fa-solid fa-circle-notch mr-1 animate-spin"></i> LINKING`;
    }
}

// Delegasi Acara (Event Delegation) untuk menukar ikon mata pada Input Kata Laluan
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#toggle-key-btn');
    if (toggleBtn) {
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
            toggleBtn.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
        }
    }
});

const apiKeyInput = document.getElementById('api-key-input');
if(apiKeyInput) apiKeyInput.addEventListener('input', (e) => checkKeyType(e.target.value.trim()));

if(document.getElementById('btn-save-key')) {
    document.getElementById('btn-save-key').addEventListener('click', () => {
        const keyInput = document.getElementById('api-key-input');
        const key = keyInput ? keyInput.value.trim() : '';
        if (!key) return showToast("API KEY KOSONG", true);
        apiConfig.apiKey = key;
        sessionStorage.setItem('apato_gemini_key', key);
        checkKeyType(key);
        updateAPIStatus('saved');
        showToast("KEY BERHASIL DISIMPAN");
    });
}

if(document.getElementById('btn-test-key')) {
    document.getElementById('btn-test-key').addEventListener('click', async () => {
        const keyInput = document.getElementById('api-key-input');
        const key = keyInput ? keyInput.value.trim() : '';
        if (!key) return showToast("API KEY KOSONG", true);

        apiConfig.apiKey = key;
        updateAPIStatus('testing');
        
        const verifyUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const headers = { 'Content-Type': 'application/json' };
        
        try {
            const response = await fetch(verifyUrl, { headers: headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if ((data.models || []).some(m => m.name.includes(API_MODEL))) {
                updateAPIStatus('valid');
                showToast("SISTEM AI TERHUBUNG");
            }
        } catch (err) {
            updateAPIStatus('invalid');
            showToast("Verifikasi Gagal.", true);
        }
    });
}

function compressReceiptImage(base64Str, maxWidth = 1000, maxHeight = 1000, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width, height = img.height;
            if (width > maxWidth || height > maxHeight) {
                if (width > height) { height = Math.round((height * maxWidth) / width); width = maxWidth; } 
                else { width = Math.round((width * maxHeight) / height); height = maxHeight; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error("Gagal mengompres gambar."));
    });
}

async function fetchGeminiAPI(prompt, base64Image = null) {
    const keyInput = document.getElementById('api-key-input');
    const key = apiConfig.apiKey || (keyInput ? keyInput.value.trim() : '');
    if (!key) throw new Error("API KEY BELUM DIKONFIGURASI.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${key}`;
    const headers = { 'Content-Type': 'application/json' };
    
    let parts = [{ text: prompt }];
    if (base64Image) {
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
        parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
    }

    const payload = {
        contents: [{ role: "user", parts: parts }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    user: { type: "string" },
                    store: { type: "string" },
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                price: { type: "integer" },
                                category: { type: "string" },
                                type: { type: "string" }
                            },
                            required: ["name", "price", "category", "type"]
                        }
                    }
                },
                required: ["store", "items"]
            }
        }
    };

    let retries = 5; let delay = 1000;
    while(retries > 0) {
        try {
            const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            if(result.error) throw new Error(result.error.message);
            return JSON.parse(result.candidates[0].content.parts[0].text);
        } catch (e) {
            retries--;
            if(retries === 0) throw e;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
}

const AI_SYSTEM_PROMPT = `
Tugas: Ekstrak rincian keuangan (belanja / pendapatan).
Aturan Wajib:
1. TERJEMAHKAN nama barang ke Bahasa Indonesia lazim.
2. KATEGORI: 'Pendapatan', 'Makanan', 'Minuman', 'Sabun & Pembersih', 'Kebutuhan Harian', 'Transportasi', 'Lainnya'. (Pilih Pendapatan jika menerima uang).
3. JENIS TRANSAKSI (type): Identifikasi konteksnya. Jika user mendapat uang, iuran masuk, atau kembalian patungan, set type = 'masuk'. Jika user belanja, membayar, atau mengirim gambar struk, set type = 'keluar'.
4. PAJAK: Jika ada pajak (tax) terpisah di struk (type: keluar), BAGIKAN nilainya ke setiap barang proporsional. (Harga Akhir = Harga Asli + Proporsi Pajak).
`;

function handleChatEnter(e) { if(e.key === 'Enter') processTextAI(); }

async function processTextAI() {
    const keyInput = document.getElementById('api-key-input');
    const key = apiConfig.apiKey || (keyInput ? keyInput.value.trim() : '');
    if (!key) return showToast("API KEY BELUM DIKONFIGURASI", true);

    const input = document.getElementById('ai-chat-input');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;

    openModal('modal-ai');
    safeHideElement('upload-area');
    safeHideElement('ai-results');
    
    const loadingBox = document.getElementById('ai-loading');
    if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "MENERJEMAHKAN PERINTAH...";
    if(loadingBox) loadingBox.classList.remove('hidden');

    try {
        const data = await fetchGeminiAPI(`${AI_SYSTEM_PROMPT}\nInput Teks: "${text}"`);
        populateStagingArea(data);
        input.value = "";
    } catch (e) {
        showToast("GAGAL MEMPROSES DATA", true);
        closeModal('modal-ai');
    }
}

let recognizing = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if(recognition) {
    recognition.continuous = false; recognition.lang = 'id-ID'; recognition.interimResults = false;

    recognition.onstart = () => {
        recognizing = true;
        const btn = document.getElementById('mic-btn');
        if(btn) {
            btn.classList.add('text-theme-danger', 'animate-pulse');
            btn.classList.remove('text-theme-muted');
        }
        if(document.getElementById('ai-chat-input')) document.getElementById('ai-chat-input').placeholder = "MENDENGARKAN SUARA...";
    };

    recognition.onresult = (event) => {
        if(document.getElementById('ai-chat-input')) document.getElementById('ai-chat-input').value = event.results[0][0].transcript;
        processTextAI();
    };

    recognition.onerror = () => showToast("GAGAL MEREKAM SUARA", true);
    recognition.onend = () => {
        recognizing = false;
        const btn = document.getElementById('mic-btn');
        if(btn) {
            btn.classList.remove('text-theme-danger', 'animate-pulse');
            btn.classList.add('text-theme-muted');
        }
        if(document.getElementById('ai-chat-input')) document.getElementById('ai-chat-input').placeholder = "e.g. 'Makan siang 500¥'...";
    };
}

function toggleVoiceInput() {
    if(!recognition) return showToast("MODUL SUARA TIDAK DIDUKUNG BROWSER", true);
    if(recognizing) recognition.stop(); else recognition.start();
}

function processImageAI(event) {
    const keyInput = document.getElementById('api-key-input');
    const key = apiConfig.apiKey || (keyInput ? keyInput.value.trim() : '');
    if (!key) return showToast("API KEY BELUM DIKONFIGURASI.", true);

    const file = event.target.files[0];
    if(!file) return;

    openModal('modal-ai');
    const loadingBox = document.getElementById('ai-loading');
    if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "MENGOPTIMALKAN GAMBAR...";
    if(loadingBox) loadingBox.classList.remove('hidden');
    
    safeHideElement('ai-results');
    safeHideElement('upload-area');

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const compressedBase64 = await compressReceiptImage(e.target.result, 1000, 1000, 0.75);
            if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "MEMBACA STRUK DENGAN GEMINI...";
            const data = await fetchGeminiAPI(`${AI_SYSTEM_PROMPT}\nEkstrak dari gambar struk ini. Harga akhir wajib include bundle pajak proporsional.`, compressedBase64);
            populateStagingArea(data);
        } catch (err) {
            showToast("GAGAL MEMBACA STRUK", true);
            closeModal('modal-ai');
        } finally {
            event.target.value = ""; 
        }
    };
    reader.readAsDataURL(file);
}

function populateStagingArea(data) {
    safeHideElement('ai-loading');
    safeShowElement('ai-results');

    if(document.getElementById('ai-store-name')) document.getElementById('ai-store-name').value = data.store || "LOKASI_TIDAK_DIKETAHUI";
    const safeUser = data.user || "Anonim";
    
    const select = document.getElementById('ai-user');
    if(select) {
        Array.from(select.options).forEach(opt => {
            if(opt.value.toLowerCase().includes(safeUser.toLowerCase())) select.value = opt.value;
        });
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];
    appState.ai.stagingItems = rawItems.length > 0 ? rawItems : [{ name: "NULL_ITEM", price: 0, category: 'Lainnya', type: 'keluar' }];
    
    appState.ai.stagingItems = appState.ai.stagingItems.map((item, idx) => ({ 
        id: Date.now() + idx, 
        name: (item.name || "NAMA_BARANG").toUpperCase(), 
        price: typeof item.price === 'number' ? item.price : 0,
        category: item.category || 'Lainnya',
        type: item.type || 'keluar'
    }));
    renderStagingItems();
}

function renderStagingItems() {
    const list = document.getElementById('ai-items-list');
    if(!list) return;
    list.innerHTML = "";
    let netTotal = 0;

    appState.ai.stagingItems.forEach((item, index) => {
        if(item.type === 'masuk') netTotal += item.price;
        else netTotal -= item.price;

        const catStyle = getCategoryStyle(item.category);
        const typeStyle = item.type === 'masuk' ? 'text-theme-success border-theme-success/30 bg-theme-success/10' : 'text-theme-danger border-theme-danger/30 bg-theme-danger/10';
        
        let selectCatHTML = `<select onchange="updateStaging(${index}, 'category', this.value)" class="w-16 text-[8px] outline-none font-tech font-bold uppercase truncate cursor-pointer ${catStyle} border p-1.5 rounded-lg">`;
        const cats = ["Pendapatan", "Makanan", "Minuman", "Sabun & Pembersih", "Kebutuhan Harian", "Transportasi", "Lainnya"];
        cats.forEach(c => {
            const cShort = c === 'Sabun & Pembersih' ? 'Pembersih' : (c === 'Kebutuhan Harian' ? 'Harian' : c);
            selectCatHTML += `<option value="${c}" ${item.category === c ? 'selected' : ''}>${cShort}</option>`;
        });
        selectCatHTML += `</select>`;

        let selectTypeHTML = `<select onchange="updateStaging(${index}, 'type', this.value)" class="w-12 text-[8px] outline-none font-tech font-bold uppercase cursor-pointer ${typeStyle} border p-1.5 rounded-lg text-center">
            <option value="keluar" ${item.type === 'keluar' ? 'selected' : ''}>OUT</option>
            <option value="masuk" ${item.type === 'masuk' ? 'selected' : ''}>IN</option>
        </select>`;

        list.innerHTML += `
            <div class="flex gap-2 items-center bg-theme-glass p-2.5 rounded-xl border border-theme-border hover:border-theme-primary/50 transition-colors mb-2 shadow-sm">
                ${selectTypeHTML}
                ${selectCatHTML}
                <input type="text" value="${item.name}" onchange="updateStaging(${index}, 'name', this.value)" class="flex-1 text-[10px] font-sans font-bold uppercase border-none outline-none bg-transparent text-theme-text ml-1 placeholder-theme-muted">
                <span class="text-[12px] font-jp font-black ${item.type === 'masuk' ? 'text-theme-success' : 'text-theme-primary'}">¥</span>
                <input type="number" value="${item.price}" onchange="updateStaging(${index}, 'price', this.value)" class="w-16 text-xs font-sans font-black text-right border-none outline-none bg-transparent text-theme-text">
                <button onclick="removeStaging(${index})" class="text-theme-muted hover:text-theme-danger w-6 h-6 rounded-lg flex justify-center items-center font-bold transition-colors ml-1 bg-theme-bg"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });

    const totalEl = document.getElementById('ai-total-calc');
    if(totalEl) {
        totalEl.innerText = (netTotal > 0 ? "+" : "") + "¥" + Math.abs(netTotal).toLocaleString();
        if (netTotal > 0) totalEl.className = "font-jp text-3xl font-black text-theme-success tracking-tighter drop-shadow-md";
        else if (netTotal < 0) totalEl.className = "font-jp text-3xl font-black text-theme-danger tracking-tighter drop-shadow-md";
        else totalEl.className = "font-jp text-3xl font-black text-theme-text tracking-tighter drop-shadow-md";
    }
}

function updateStaging(index, field, value) {
    if(field === 'price') appState.ai.stagingItems[index][field] = parseInt(value) || 0;
    else if (field === 'name') appState.ai.stagingItems[index][field] = value.toUpperCase();
    else appState.ai.stagingItems[index][field] = value;
    renderStagingItems();
}

function removeStaging(index) {
    appState.ai.stagingItems.splice(index, 1);
    renderStagingItems();
}

function addManualItem() {
    appState.ai.stagingItems.push({ id: Date.now(), name: "NAMA_BARANG", price: 0, category: 'Lainnya', type: 'keluar' });
    renderStagingItems();
}

function saveAIToLedger() {
    const userNode = document.getElementById('ai-user');
    const user = userNode ? userNode.value : null;
    
    if(!user || user === 'Anonim') return showToast("PILIH OPERATOR", true);
    if(appState.ai.stagingItems.length === 0) return showToast("TIDAK ADA DATA UNTUK DISIMPAN", true);

    const storeNode = document.getElementById('ai-store-name');
    const storeName = storeNode ? storeNode.value : "Unknown";
    
    if(db) {
        const promises = appState.ai.stagingItems.map(item => {
            return db.ref(path).push({
                user, desc: `${storeName} - ${item.name}`.toUpperCase(), amt: item.price, type: item.type,
                category: item.category, ts: firebase.database.ServerValue.TIMESTAMP
            });
        });

        Promise.all(promises).then(() => {
            createLog("AI_EXTRACT", `Menyimpan ${appState.ai.stagingItems.length} item dari [${storeName}]`, user);
            showToast("DATA BERHASIL DISIMPAN");
            closeModal('modal-ai');
        });
    }
}

// --- 13. PEMULAAN SISTEM (INITIALIZATION BOOTSTRAP) ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Terapkan Tema yang disimpan
    const savedTheme = localStorage.getItem('apato_theme');
    if (savedTheme) {
        currentThemeIndex = parseInt(savedTheme);
        applyTheme(currentThemeIndex);
    }
    
    // 2. Setup AI API Key
    const savedKey = sessionStorage.getItem('apato_gemini_key');
    if (savedKey && document.getElementById('api-key-input')) {
        document.getElementById('api-key-input').value = savedKey;
        apiConfig.apiKey = savedKey;
        checkKeyType(savedKey);
        updateAPIStatus('saved', 'Kunci dimuat automatik dari sesi memori.');
    } else if (document.getElementById('api-key-input')) {
        const restoredKey = decryptMasterKey();
        document.getElementById('api-key-input').value = restoredKey;
        apiConfig.apiKey = restoredKey;
        checkKeyType(restoredKey);
        updateAPIStatus('saved', 'Kunci lalai (Base64) di-dekripsi & dimuat internal.');
    }

    // 3. Suntik Antara Muka Pengguna Lanjutan
    setTimeout(() => {
        injectAdvancedUI();
    }, 150);
});

// Pendaftaran Auth Firebase
if(auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const statusEl = document.getElementById('auth-status');
            if(statusEl) statusEl.innerText = "SISTEM TERHUBUNG";
            loadData();
            loadLogs();
        } else { 
            auth.signInAnonymously(); 
        }
    });
}