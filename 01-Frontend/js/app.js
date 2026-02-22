const BASE = CONFIG.BACKEND_URL.replace(/\/$/, '');

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function dot(id, color) {
  const el = document.getElementById(id);
  if (el) el.querySelector('.dot').className = 'dot ' + color;
}

// ── Health ────────────────────────────────────────────────────────────────

async function checkHealth() {
  try {
    const d = await api('/health');
    dot('h-app', d.app    === 'ok' ? 'green' : 'red');
    dot('h-db',  d.db     === 'ok' ? 'green' : 'red');
    dot('h-ai',  d.openai === 'ok' ? 'green' : 'red');
  } catch {
    ['h-app','h-db','h-ai'].forEach(id => dot(id, 'red'));
  }
}

window.addEventListener('load', checkHealth);

// ── Quotes ────────────────────────────────────────────────────────────────

function renderQuote(q) {
  return `<blockquote>"${q.text}"</blockquote>
          <p class="author">— ${q.author}</p>
          <span class="tag">${q.category}</span>`;
}

async function getRandomQuote() {
  document.getElementById('quotes-list').classList.add('hidden');
  const box = document.getElementById('quote-box');
  box.classList.add('hidden');
  try {
    const q = await api('/quotes/random');
    box.innerHTML = renderQuote(q);
    box.classList.remove('hidden');
  } catch {
    alert('Nem sikerült betölteni az idézetet.');
  }
}

async function getAllQuotes() {
  document.getElementById('quote-box').classList.add('hidden');
  const list = document.getElementById('quotes-list');
  list.innerHTML = '<p style="color:var(--muted)">Betöltés…</p>';
  list.classList.remove('hidden');
  try {
    const { quotes } = await api('/quotes');
    list.innerHTML = quotes.map(q =>
      `<div class="quote-item">${renderQuote(q)}</div>`
    ).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--red)">Hiba: nem sikerült betölteni.</p>';
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────

function addMsg(text, role) {
  const c = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'msg ' + role;
  d.textContent = text;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
  return d;
}

async function sendChat() {
  const inp = document.getElementById('chat-input');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  addMsg(msg, 'user');
  const t = addMsg('⏳ Gondolkodom…', 'ai thinking');
  try {
    const { reply } = await api('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    t.textContent = reply;
    t.classList.remove('thinking');
  } catch {
    t.textContent = '❌ Nem sikerült kapcsolódni az AI-hoz.';
    t.classList.remove('thinking');
  }
}
