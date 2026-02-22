const BASE = CONFIG.BACKEND_URL.replace(/\/$/, '');

let currentCategory = '';

async function api(path, opts = {}) {
    const res = await fetch(BASE + path, opts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

// ── Quotes ────────────────────────────────────────────────────────────────

async function loadRandomQuote() {
    const textEl   = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    const errorEl  = document.getElementById('errorMsg');
    errorEl.textContent = '';
    textEl.textContent  = 'Betöltés...';
    authorEl.textContent = '';

    try {
        const path = currentCategory
            ? `/quotes/random?category=${currentCategory}`
            : '/quotes/random';
        const q = await api(path);
        textEl.textContent   = q.text;
        authorEl.textContent = '— ' + q.author;
    } catch (e) {
        errorEl.textContent = 'Nem sikerült betölteni az idézetet. Ellenőrizd a backend URL-t.';
    }
}

async function filterCategory(btn) {
    document.querySelectorAll('.controls .btn-secondary').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    await loadRandomQuote();
    if (document.getElementById('quotesCollapsible').open) {
        await loadAllQuotes();
    }
}

async function loadAllQuotes() {
    const grid = document.getElementById('quotesGrid');
    grid.innerHTML = '<p style="color:var(--muted);padding:1rem">Betöltés...</p>';
    try {
        const path = currentCategory ? `/quotes?category=${currentCategory}` : '/quotes';
        const data = await api(path);
        grid.innerHTML = data.quotes.map(q => `
            <div class="quote-item">
                <div class="qi-text">"${q.text}"</div>
                <div class="qi-author">— ${q.author}</div>
                <span class="qi-cat">${q.category}</span>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p style="color:#f85149;padding:1rem">Hiba a betöltés során.</p>';
    }
}

document.getElementById('quotesCollapsible').addEventListener('toggle', function () {
    if (this.open) loadAllQuotes();
});

// ── Health ────────────────────────────────────────────────────────────────

function setHealth(id, status, detail) {
    const card = document.getElementById(id);
    if (!card) return;
    const dot    = card.querySelector('.h-dot');
    const detEl  = card.querySelector('.h-detail');
    dot.className = 'h-dot ' + (status === 'ok' ? 'ok' : status === 'checking' ? '' : 'error');
    detEl.textContent = detail;
}

async function checkHealth() {
    ['health-vm','health-app','health-db','health-ai'].forEach(id =>
        setHealth(id, 'checking', 'Ellenőrzés...')
    );
    setHealth('health-vm', 'ok', 'Fut – ez az oldal is itt van');

    try {
        const d = await api('/health');
        setHealth('health-app', d.app    === 'ok' ? 'ok' : 'error', d.app    === 'ok' ? 'Elérhető' : 'Nem elérhető');
        setHealth('health-db',  d.db     === 'ok' ? 'ok' : 'error', d.db     === 'ok' ? 'Kapcsolódva' : 'Kapcsolódási hiba');
        setHealth('health-ai',  d.openai === 'ok' ? 'ok' : 'error', d.openai === 'ok' ? 'Elérhető' : 'Nem elérhető');
    } catch {
        ['health-app','health-db','health-ai'].forEach(id =>
            setHealth(id, 'error', 'Nem elérhető')
        );
    }
}

// ── Chat ──────────────────────────────────────────────────────────────────

function toggleChat() {
    const win = document.getElementById('chatWindow');
    win.classList.toggle('open');
}

function addMsg(text, role) {
    const c = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = 'chat-msg ' + role;
    d.innerHTML = text;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
    return d;
}

async function sendChat() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    addMsg(msg, 'user');
    const t = addMsg('<em>Gondolkodom...</em>', 'ai');
    try {
        const data = await api('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        t.innerHTML = data.reply.replace(/\n/g, '<br>');
    } catch {
        t.innerHTML = '❌ Nem sikerült kapcsolódni az AI-hoz.';
    }
}

// ── Init ──────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
    loadRandomQuote();
    checkHealth();
});
