const state = {
    quotes: [],
    activeCategory: '',
    chatOpen: false,
};

function apiUrl(path) {
    const base = (CONFIG?.BACKEND_URL || '').replace(/\/$/, '');
    return `${base}${path}`;
}

function setError(message = '') {
    const el = document.getElementById('errorMsg');
    if (!el) return;
    el.textContent = message;
}

function setHealthCard(id, ok, detail) {
    const card = document.getElementById(id);
    if (!card) return;

    const dot = card.querySelector('.h-dot');
    const text = card.querySelector('.h-detail');

    if (dot) {
        dot.classList.remove('ok', 'error');
        dot.classList.add(ok ? 'ok' : 'error');
    }

    if (text) {
        text.textContent = detail;
    }
}

function updateMainQuote(quote) {
    const textEl = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    const categoryEl = document.getElementById('quoteCategory');

    if (!quote) {
        textEl.textContent = 'Nincs elérhető idézet';
        authorEl.textContent = '';
        categoryEl.style.display = 'none';
        return;
    }

    textEl.textContent = quote.text || '—';
    authorEl.textContent = quote.author ? `— ${quote.author}` : '';

    if (quote.category) {
        categoryEl.style.display = 'inline-block';
        categoryEl.textContent = quote.category;
    } else {
        categoryEl.style.display = 'none';
    }
}

function renderQuotesGrid() {
    const grid = document.getElementById('quotesGrid');
    if (!grid) return;

    const items = state.activeCategory
        ? state.quotes.filter((q) => q.category === state.activeCategory)
        : state.quotes;

    if (!items.length) {
        grid.innerHTML = '<div class="quote-item"><div class="qi-text">Nincs találat.</div></div>';
        return;
    }

    grid.innerHTML = items
        .map((q) => `
            <div class="quote-item">
                <div class="qi-text">“${q.text || ''}”</div>
                <div class="qi-author">— ${q.author || 'Ismeretlen'}</div>
                <span class="qi-cat">${q.category || 'egyéb'}</span>
            </div>
        `)
        .join('');
}

async function loadAllQuotes() {
    const response = await fetch(apiUrl('/quotes'));
    if (!response.ok) {
        throw new Error('Nem sikerült lekérni az idézeteket.');
    }

    const payload = await response.json();
    state.quotes = Array.isArray(payload.quotes) ? payload.quotes : [];
    renderQuotesGrid();
}

async function loadRandomQuote() {
    try {
        setError('');
        const response = await fetch(apiUrl('/quotes/random'));
        if (!response.ok) {
            throw new Error('Nem sikerült random idézetet kérni.');
        }

        const quote = await response.json();
        updateMainQuote(quote);
    } catch (error) {
        updateMainQuote(null);
        setError(error.message || 'Hiba történt az idézet lekérésekor.');
    }
}

function filterCategory(button) {
    const category = button?.dataset?.cat ?? '';
    state.activeCategory = category;

    document.querySelectorAll('.btn[data-cat]').forEach((btn) => {
        btn.classList.toggle('active', btn === button);
    });

    renderQuotesGrid();
}

function appendChatMessage(text, role) {
    const wrap = document.getElementById('chatMessages');
    if (!wrap) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.textContent = text;
    wrap.appendChild(msg);
    wrap.scrollTop = wrap.scrollHeight;
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');
    const message = (input?.value || '').trim();
    if (!message) return;

    input.value = '';
    appendChatMessage(message, 'user');

    try {
        sendBtn.disabled = true;
        const response = await fetch(apiUrl('/chat'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload?.error || 'A chat szolgáltatás nem elérhető.');
        }

        appendChatMessage(payload.reply || 'Nincs válasz.', 'ai');
    } catch (error) {
        appendChatMessage(error.message || 'Hiba történt a chat során.', 'ai');
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (!win) return;

    state.chatOpen = !state.chatOpen;
    win.classList.toggle('open', state.chatOpen);
}

async function checkHealth() {
    setHealthCard('health-vm', true, 'Frontend betöltve (IIS)');

    const backendUrl = (CONFIG?.BACKEND_URL || '').trim();
    if (!backendUrl || backendUrl.includes('XXXXXXXXXX')) {
        setHealthCard('health-app', false, 'BACKEND_URL nincs beállítva');
        setHealthCard('health-db', false, 'Backend nem elérhető');
        setHealthCard('health-ai', false, 'Backend nem elérhető');
        setError('Állítsd be a js/config.js fájlban a BACKEND_URL értékét az App Service URL-re.');
        return;
    }

    try {
        const response = await fetch(apiUrl('/health'));
        if (!response.ok) {
            throw new Error('A health endpoint hibát adott vissza.');
        }

        const data = await response.json();
        setHealthCard('health-app', data.app === 'ok', data.app === 'ok' ? 'API működik' : 'API hiba');
        setHealthCard('health-db', data.db === 'ok', data.db === 'ok' ? 'MySQL elérhető' : 'MySQL hiba');
        setHealthCard('health-ai', data.openai === 'ok', data.openai === 'ok' ? 'OpenAI elérhető' : 'OpenAI hiba');
    } catch (error) {
        setHealthCard('health-app', false, 'App Service nem elérhető');
        setHealthCard('health-db', false, 'Nincs backend kapcsolat');
        setHealthCard('health-ai', false, 'Nincs backend kapcsolat');
        setError(error.message || 'Nem sikerült kapcsolódni a backendhez.');
    }
}

async function initialize() {
    try {
        await loadAllQuotes();
        await loadRandomQuote();
    } catch (error) {
        setError(error.message || 'Hiba történt az inicializáláskor.');
    } finally {
        await checkHealth();
    }
}

window.loadRandomQuote = loadRandomQuote;
window.filterCategory = filterCategory;
window.sendChat = sendChat;
window.toggleChat = toggleChat;
window.checkHealth = checkHealth;

document.addEventListener('DOMContentLoaded', initialize);
