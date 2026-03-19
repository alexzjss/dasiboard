// ===== APP MAIN — DaSIboard v2 =====

let eventsData = [];
let scheduleDataAll = null;

// ===== THEME SYSTEM =====
// dark=true, light=false
const THEMES = [
  { key: 'padrao',       label: 'Padrão',        dark: true  },
  { key: 'super',        label: 'Super',          dark: true  },
  { key: 'hackerman',    label: 'Hackerman',      dark: true  },
  { key: 'sith',         label: 'Sith',           dark: true  },
  { key: 'gatilho',      label: 'Gatilho do Tempo', dark: true },
  { key: 'hypado',       label: 'Hypado',         dark: true  },
  { key: 'omni',         label: 'Omni',           dark: true  },
  { key: 'minas',        label: 'Minas',          dark: true  },
  { key: 'd20',          label: 'D20',            dark: true  },
  { key: 'grifinho',     label: 'Grifinho',       dark: false },
  { key: 'bidu',         label: 'Bidu',           dark: false },
  { key: 'mamaco',       label: 'Mamaco',         dark: false },
  { key: 'jedi',         label: 'Jedi',           dark: false },
  { key: 'ocean',        label: 'Ocean Breeze',   dark: false },
  { key: 'laboratorio',  label: 'Laboratório',    dark: false },
  { key: 'sintetizado',  label: 'Sintetizado',    dark: false },
  { key: 'masacote',     label: 'Masacote',       dark: false },
  { key: 'grace',        label: 'Grace',          dark: false },
];
let currentThemeIndex = 0;
let themeFullRotations = 0;

// Returns pool of themes for current mode
function getThemePool() {
  const isDark = THEMES[currentThemeIndex]?.dark !== false;
  return THEMES.filter(t => t.dark === isDark);
}

// Cycle only within current mode (dark or light)
function cycleTheme() {
  const isDark = THEMES[currentThemeIndex]?.dark !== false;
  const pool = THEMES.map((t, i) => ({ ...t, idx: i })).filter(t => t.dark === isDark);
  const posInPool = pool.findIndex(t => t.idx === currentThemeIndex);
  const nextInPool = pool[(posInPool + 1) % pool.length];
  currentThemeIndex = nextInPool.idx;

  // Easter egg: full rotation within dark pool
  if (posInPool + 1 >= pool.length) {
    themeFullRotations++;
    if (themeFullRotations >= 2) { triggerMoonEasterEgg(); themeFullRotations = 0; }
  }
  applyTheme(THEMES[currentThemeIndex]);
  renderThemeSwitch();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme.key);
  const dot = document.getElementById('theme-dot');
  const label = document.getElementById('theme-label');
  if (label) label.textContent = theme.label;
  if (dot) { dot.style.animation = 'none'; void dot.offsetWidth; dot.style.animation = ''; }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bgMap = { padrao:'#07070c',super:'#020c1a',hackerman:'#010a01',sith:'#0a0002',gatilho:'#050210',hypado:'#080600',omni:'#060606',minas:'#060908',d20:'#020614',grifinho:'#f4f0ff',bidu:'#fff8f0',mamaco:'#f5f0e0',jedi:'#f0f8f2',ocean:'#f0f8ff',laboratorio:'#fff0f7',sintetizado:'#f0f6ff',masacote:'#fffce8',grace:'#fff4eb' };
    meta.setAttribute('content', bgMap[theme.key] || '#07070c');
  }
  localStorage.setItem('dasitheme', theme.key);
  // Also save as last-used for this mode
  const modeKey = (theme.dark !== false) ? 'dasitheme_dark' : 'dasitheme_light';
  localStorage.setItem(modeKey, theme.key);

  // ── D20 THEME: inject videogame flavor ──
  if (theme.key === 'd20') {
    applyD20GameFlavor();
  } else {
    removeD20GameFlavor();
  }
}

// ===== D20 VIDEOGAME FLAVOR =====
const D20_GAME_LABELS = {
  // section-title text → [game emoji, game reference]
  'Próxima aula':        ['🎮', 'NEXT STAGE'],
  'Próximos eventos':    ['📅', 'QUEST LOG'],
  'Reflexão do dia':     ['💬', 'NPC DIALOG'],
  'Contagem regressiva': ['⏱️', 'TIME ATTACK'],
  'Tarefas pendentes':   ['⚔️', 'SIDE QUESTS'],
  'Última newsletter':   ['📜', 'LORE ENTRY'],
  'Filtros':             ['🎛️', 'SELECT CHAR'],
  'Evolução de médias':  ['📈', 'LEVEL UP'],
  'Minhas turmas':       ['🎓', 'GUILD HALL'],
  'Disciplinas':         ['📖', 'SKILL TREE'],
};

// Game quotes for the home hero eyebrow
const D20_GAME_QUOTES = [
  { text: "Praising the sun since 1106 A.D.", src: "Dark Souls" },
  { text: "It's dangerous to study alone!", src: "Zelda (adaptado)" },
  { text: "Do you know de wey of SI?", src: "Knuckles" },
  { text: "Every 60 seconds in Africa, a minute passes.", src: "Sonic" },
  { text: "Stay a while, and listen.", src: "Deckard Cain - Diablo" },
  { text: "The cake was a lie, but the diploma is real.", src: "Portal" },
  { text: "Fus Ro GPA!", src: "Skyrim" },
  { text: "You died. Retry? (Y/N)", src: "Hollow Knight" },
  { text: "Crash sensed danger ahead... and crashed anyway.", src: "Crash Bandicoot" },
  { text: "Wahoo! One more semestre!", src: "Mario" },
  { text: "Go for it, Sparda! - but first, study.", src: "Devil May Cry" },
  { text: "I was never the hero this course needed. But the one it got.", src: "God of War" },
  { text: "Gotta study fast.", src: "Sonic the Hedgehog" },
  { text: "Crikey! That's a lot de creditos!", src: "Crash Bandicoot" },
  { text: "Player 2 has joined the curso.", src: "Luigi" },
  { text: "The world record for procrastination is yours.", src: "Achievement Unlocked" },];

let _d20QuoteInterval = null;

function applyD20GameFlavor() {
  // Inject game labels into section titles
  document.querySelectorAll('.section-title').forEach(el => {
    const text = el.textContent.trim();
    const match = Object.keys(D20_GAME_LABELS).find(k => text.includes(k));
    if (match) {
      const [emoji, tag] = D20_GAME_LABELS[match];
      el.setAttribute('data-d20-orig', el.textContent);
      el.setAttribute('data-d20', emoji);
      // Add game tag badge after the title
      if (!el.querySelector('.d20-game-tag')) {
        const badge = document.createElement('span');
        badge.className = 'd20-game-tag';
        badge.textContent = tag;
        el.appendChild(badge);
      }
    }
  });

  // Add "PLAYER 1" badge to the hero greeting
  const greeting = document.getElementById('hero-greeting');
  if (greeting && !document.getElementById('d20-p1-badge')) {
    const p1 = document.createElement('span');
    p1.id = 'd20-p1-badge';
    p1.className = 'd20-p1-badge';
    p1.textContent = 'P1';
    greeting.parentElement?.appendChild(p1);
  }

  // Inject floating pixel decorations on the body
  if (!document.getElementById('d20-pixel-layer')) {
    const layer = document.createElement('div');
    layer.id = 'd20-pixel-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = [
      '<span class="d20-pixel" style="top:8vh;left:3%;font-size:18px;animation-delay:0s">⭐</span>',
      '<span class="d20-pixel" style="top:20vh;right:4%;font-size:14px;animation-delay:.8s">👾</span>',
      '<span class="d20-pixel" style="top:35vh;left:2%;font-size:16px;animation-delay:1.5s">🎮</span>',
      '<span class="d20-pixel" style="top:55vh;right:3%;font-size:13px;animation-delay:.4s">🍄</span>',
      '<span class="d20-pixel" style="top:70vh;left:4%;font-size:15px;animation-delay:2s">⚔️</span>',
      '<span class="d20-pixel" style="top:85vh;right:5%;font-size:12px;animation-delay:1.2s">💎</span>',
      '<span class="d20-pixel" style="top:15vh;left:90%;font-size:13px;animation-delay:.6s">🔴</span>',
      '<span class="d20-pixel" style="top:42vh;left:93%;font-size:16px;animation-delay:1.8s">🎲</span>',
    ].join('');
    document.body.appendChild(layer);
  }
}

function removeD20GameFlavor() {
  // Remove game tag badges
  document.querySelectorAll('.d20-game-tag').forEach(el => el.remove());
  document.querySelectorAll('[data-d20]').forEach(el => el.removeAttribute('data-d20'));
  // Remove P1 badge
  document.getElementById('d20-p1-badge')?.remove();
  // Remove pixel layer
  document.getElementById('d20-pixel-layer')?.remove();
}

// ===== DARK/LIGHT SWITCH =====
function setThemeMode(mode) {
  const current = THEMES[currentThemeIndex];
  const wantDark = mode === 'dark';
  if (wantDark === (current.dark !== false)) return; // already correct mode
  // Restore last used theme for this mode, or fall back to first
  const lastKey = localStorage.getItem('dasitheme_' + mode);
  const pool = THEMES.map((t, i) => ({ ...t, idx: i })).filter(t => t.dark === wantDark);
  const restored = lastKey ? pool.find(t => t.key === lastKey) : null;
  const target = restored || pool[0];
  currentThemeIndex = target.idx;
  applyTheme(THEMES[currentThemeIndex]);
  renderThemeSwitch();
}

function renderThemeSwitch() {
  const sw = document.getElementById('theme-mode-switch');
  if (!sw) return;

  const theme = THEMES[currentThemeIndex];
  const isDark = theme?.dark !== false;

  // Update mode toggle
  sw.setAttribute('data-mode', isDark ? 'dark' : 'light');
  const knob = sw.querySelector('.tsw-knob');
  const swLabel = sw.querySelector('.tsw-label');
  if (knob) knob.textContent = isDark ? '🌙' : '☀️';
  if (swLabel) swLabel.textContent = theme?.label || '—';

  // Update cycle button counter
  const pool = THEMES.filter(t => t.dark === isDark);
  const posInPool = pool.findIndex(t => t.key === theme?.key);
  const dot = document.getElementById('theme-dot');
  const cycleLabel = document.getElementById('theme-label');
  if (dot) { dot.style.animation = 'none'; void dot.offsetWidth; dot.style.animation = ''; }
  if (cycleLabel) cycleLabel.textContent = `${posInPool + 1}/${pool.length}`;
}

function loadSavedTheme() {
  const saved = localStorage.getItem('dasitheme');
  if (saved) {
    const idx = THEMES.findIndex(t => t.key === saved);
    if (idx >= 0) { currentThemeIndex = idx; applyTheme(THEMES[idx]); renderThemeSwitch(); return; }
  }
  applyTheme(THEMES[0]);
  renderThemeSwitch();
}

function triggerMoonEasterEgg() {
  const moon = document.getElementById('moon-egg');
  const text = document.getElementById('moon-to-the-moon-text');
  if (!moon) return;
  moon.classList.remove('flying'); void moon.offsetWidth; moon.classList.add('flying');
  if (text) { text.classList.remove('show'); void text.offsetWidth; setTimeout(() => { text.classList.add('show'); setTimeout(() => text.classList.remove('show'), 2700); }, 200); }
  setTimeout(() => moon.classList.remove('flying'), 2600);
}

// ===== ROUTING =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const pageEl = document.getElementById(`${page}-page`);
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('hamburger')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Re-apply D20 game flavor if active (section titles may have been re-rendered)
  if (document.documentElement.getAttribute('data-theme') === 'd20') {
    setTimeout(applyD20GameFlavor, 120);
  }
  if (page === 'calendar') initCalendar();
  if (page === 'schedule') initSchedule();
  if (page === 'newsletter') initNewsletter();
  if (page === 'docentes') initDocentes();
  if (page === 'estudos') { initEstudos(); estudosClickCount++; clearTimeout(estudosClickTimer); estudosClickTimer = setTimeout(()=>{ estudosClickCount=0; },2000); if (estudosClickCount >= 6) { estudosClickCount=0; triggerCaligrafiaEasterEgg(); } }
  if (page === 'ferramentas') closeTool?.();
  if (page === 'notas-gpa') initGPA?.();
  if (page === 'kanban') { initKanban?.(); }
  if (page === 'entidades') initEntidades?.();
  if (page === 'leetcode') initLeetcode?.();
  if (page === 'faltas') initFaltas?.();
  if (page === 'notas-gpa') { setTimeout(() => { const el = document.getElementById('fluxograma-section-title'); if (el) el.style.display=''; initFluxograma?.(); }, 80); }
  // Track easter egg navigation sequence
  if (typeof trackEggNavigation === 'function') trackEggNavigation(page);
  history.pushState(null, '', `#${page}`);
}

// ===== MOBILE SIDEBAR =====
function toggleMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar?.classList.toggle('mobile-open');
  hamburger?.classList.toggle('open');
  overlay?.classList.toggle('show');
}

function createSidebarOverlay() {
  if (document.getElementById('sidebar-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.className = 'sidebar-mobile-overlay';
  overlay.onclick = toggleMobileNav;
  document.body.appendChild(overlay);
}

// ===== HOME =====
// ===== QUOTES WIDGET =====
const FALLBACK_QUOTES = [
  { text: "A vida não examinada não vale a pena ser vivida.", author: "Sócrates", source: "Filosofia" },
  { text: "Eu penso, logo existo.", author: "René Descartes", source: "Filosofia" },
  { text: "O homem está condenado a ser livre.", author: "Jean-Paul Sartre", source: "Filosofia" },
  { text: "Tudo o que sabemos é uma gota; o que ignoramos é um oceano.", author: "Isaac Newton", source: "Filosofia" },
  { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein", source: "Ciência" },
  { text: "Não é o mais forte que sobrevive, mas o mais adaptável.", author: "Charles Darwin", source: "Ciência" },
  { text: "Ser ou não ser, eis a questão.", author: "William Shakespeare", source: "Hamlet" },
  { text: "É melhor ter amado e perdido do que nunca ter amado.", author: "Alfred Lord Tennyson", source: "In Memoriam" },
  { text: "Dois caminhos divergiram numa floresta, e eu... tomei o menos percorrido.", author: "Robert Frost", source: "The Road Not Taken" },
  { text: "Não chore porque acabou; sorria porque aconteceu.", author: "Gabriel García Márquez", source: "Literatura" },
  { text: "Quando você quiser desistir, lembre-se por que começou.", author: "Kobe Bryant", source: "Esporte" },
  { text: "O segredo é não correr atrás das borboletas. É cuidar do jardim para que elas venham até você.", author: "Mário Quintana", source: "Poesia" },
  { text: "Não podemos escolher o vento, mas podemos ajustar as velas.", author: "Dolly Parton", source: "Música" },
  { text: "A dificuldade é o que acorda o gênio.", author: "Nassim Nicholas Taleb", source: "Literatura" },
  { text: "Tudo passa, tudo é passageiro. O que permanece somos nós, a escolher o que fazer com o tempo que temos.", author: "J.R.R. Tolkien", source: "O Senhor dos Anéis" },
  { text: "Não temas a perfeição — jamais a alcançarás.", author: "Salvador Dalí", source: "Arte" },
  { text: "Com grandes poderes vêm grandes responsabilidades.", author: "Stan Lee", source: "Marvel Comics" },
  { text: "A vida é o que acontece enquanto você está ocupado fazendo outros planos.", author: "John Lennon", source: "Música" },
  { text: "No meio de cada dificuldade existe uma oportunidade.", author: "Albert Einstein", source: "Ciência" },
  { text: "Não é quem você é por dentro, mas o que você faz que te define.", author: "Bruce Wayne", source: "Batman Begins" },
  { text: "Que a Força esteja com você.", author: "Yoda", source: "Star Wars" },
  { text: "I am the danger.", author: "Walter White", source: "Breaking Bad" },
  { text: "Winter is coming.", author: "Ned Stark", source: "Game of Thrones" },
  { text: "O código limpo é simples e direto. Parece prosa bem escrita.", author: "Robert C. Martin", source: "Clean Code" },
  { text: "Qualquer tolo pode escrever código que um computador entenda. Bons programadores escrevem código que humanos entendam.", author: "Martin Fowler", source: "Refactoring" },
  { text: "Simplifique o complexo, não complique o simples.", author: "Bruno Munari", source: "Design" },
  { text: "Os dados superam a opinião.", author: "Jeff Bezos", source: "Gestão" },
  { text: "Move fast and break things.", author: "Mark Zuckerberg", source: "Silicon Valley" },
  { text: "Primeiro, resolva o problema. Depois, escreva o código.", author: "John Johnson", source: "Programação" },
];

async function fetchExternalQuote() {
  // quotable.io foi desativado em 2023 e zenquotes.io bloqueia CORS de browsers.
  // Ambas as APIs são inacessíveis no GitHub Pages (contexto HTTPS + CORS).
  // Retorna null diretamente para usar o fallback local sem delay.
  return null;
}

async function loadQuoteWidget() {
  const card = document.getElementById('quote-card');
  if (!card) return;
  card.innerHTML = '<div class="quote-loading"><div class="spinner"></div></div>';

  const getFallback = () => FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];

  // Timeout de segurança: se algo travar, força o fallback após 2s
  const safetyTimer = setTimeout(() => {
    if (card.querySelector('.spinner')) {
      const q = getFallback();
      renderQuote(card, q);
    }
  }, 2000);

  let quote = null;
  try { quote = await fetchExternalQuote(); } catch(e) {}
  clearTimeout(safetyTimer);

  if (!quote) quote = getFallback();
  renderQuote(card, quote);
}

function renderQuote(card, quote) {
  card.innerHTML =
    '<div class="quote-mark">"</div>' +
    '<blockquote class="quote-text">' + escQ(quote.text) + '</blockquote>' +
    '<div class="quote-meta">' +
      '<span class="quote-author">— ' + escQ(quote.author) + '</span>' +
      (quote.source ? '<span class="quote-source">' + escQ(quote.source) + '</span>' : '') +
    '</div>' +
    '<button class="quote-refresh-btn" onclick="loadQuoteWidget()" title="Nova frase">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' +
      'Nova frase' +
    '</button>';
}

function escQ(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function initHome() {
  renderHeroGreeting();

  // Carrega dados de eventos e horários com fallback explícito
  try { eventsData = await fetchJSON('./data/events.json').then(d => d || []); } catch(e) { eventsData = []; }
  try { const d = await fetchJSON('./data/schedule.json'); scheduleDataAll = d || {}; } catch(e) { scheduleDataAll = {}; }

  // Renderiza todos os widgets — cada um trata internamente o estado vazio
  try { renderUpcomingEvents(); } catch(e) {
    const c = document.getElementById('upcoming-events');
    if (c) c.innerHTML = '<div class="no-events-msg">Nenhum evento próximo.</div>';
  }
  try { renderHomeNewsletter(); } catch(e) {
    const c = document.getElementById('home-newsletter');
    if (c) c.innerHTML = '<div class="no-events-msg">Newsletter indisponível.</div>';
  }
  try { loadQuoteWidget(); } catch(e) {
    const c = document.getElementById('quote-card');
    if (c) {
      const q = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      c.innerHTML = '<div class="quote-mark">"</div><blockquote class="quote-text">' + escQ(q.text) + '</blockquote><div class="quote-meta"><span class="quote-author">— ' + escQ(q.author) + '</span></div>';
    }
  }
  try { renderNextClass(); } catch(e) {
    const c = document.getElementById('next-class-info');
    if (c) c.innerHTML = '<div class="no-events-msg">Nenhuma aula cadastrada.</div>';
  }
  try { renderCountdown(); } catch(e) {
    const c = document.getElementById('countdown-card');
    if (c) c.innerHTML = '<div class="countdown-past">Nenhum evento próximo.</div>';
  }
  try { updateStatEvents(); } catch(e) {}
  try { updateHomeKanbanPeek(); } catch(e) {}
  try { updateStatTasks(); } catch(e) {}
}

function renderHeroGreeting() {
  const greetEl = document.getElementById('hero-greeting');
  const dateEl = document.getElementById('hero-date-text');
  if (greetEl) greetEl.textContent = getGreeting();
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

function updateStatEvents() {
  const el = document.getElementById('stat-events');
  const sbEl = document.getElementById('sb-events-count');
  if (!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = eventsData.filter(e => parseDate(e.date) >= today);
  el.textContent = upcoming.length;
  if (sbEl) { sbEl.textContent = upcoming.length > 0 ? upcoming.length : ''; }
}

function renderNextClass() {
  const container = document.getElementById('next-class-info');
  if (!container || !scheduleDataAll) return;
  const now = new Date();
  const currentDayName = DAY_NAMES_FULL[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let allClasses = [];
  // schedule.json structure: { semesters:[...], turmas:[...], schedule: { "1_02": [...] } }
  const sch = scheduleDataAll.schedule || scheduleDataAll;
  Object.entries(sch).forEach(([key, courses]) => {
    if (!Array.isArray(courses)) return;
    const semNum = key.split('_')[0];
    courses.forEach(c => allClasses.push({ ...c, semester: semNum }));
  });
  const todayClasses = allClasses.filter(c => c.day === currentDayName);
  const currentClass = todayClasses.find(c => { const {start,end} = parseTimeRange(c.time); return nowMinutes >= start && nowMinutes <= end; });
  const nextToday = todayClasses.filter(c => parseTimeRange(c.time).start > nowMinutes).sort((a,b) => parseTimeRange(a.time).start - parseTimeRange(b.time).start)[0];
  const targetClass = currentClass || nextToday;
  if (targetClass) {
    const isNow = !!currentClass;
    container.innerHTML = `
      <div class="next-class-label">${isNow ? '🎓 Aula em andamento' : '⏰ Próxima aula hoje'}</div>
      <div class="next-class-name">${targetClass.course}</div>
      <div class="next-class-meta">
        <div class="next-class-meta-item">${svgIcon('clock')} ${targetClass.time}</div>
        <div class="next-class-meta-item">${svgIcon('calendar')} ${targetClass.day}</div>
        ${targetClass.professor !== '—' ? `<div class="next-class-meta-item">${svgIcon('user')} ${targetClass.professor}</div>` : ''}
        ${targetClass.room !== '—' ? `<div class="next-class-meta-item">${svgIcon('map-pin')} ${targetClass.room}</div>` : ''}
        <div class="next-class-meta-item">${svgIcon('layers')} ${targetClass.semester}º semestre</div>
      </div>`;
  } else {
    const daysOrder = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const todayIdx = daysOrder.indexOf(currentDayName);
    let found = null, foundDay = null;
    for (let i = 1; i <= 7 && !found; i++) {
      const nextDayName = daysOrder[(todayIdx + i) % 7];
      const candidates = allClasses.filter(c => c.day === nextDayName).sort((a,b) => parseTimeRange(a.time).start - parseTimeRange(b.time).start);
      if (candidates.length) { found = candidates[0]; foundDay = nextDayName; }
    }
    if (found) {
      container.innerHTML = `
        <div class="next-class-label">📅 Próxima aula</div>
        <div class="next-class-name">${found.course}</div>
        <div class="next-class-meta">
          <div class="next-class-meta-item">${svgIcon('calendar')} ${foundDay}</div>
          <div class="next-class-meta-item">${svgIcon('clock')} ${found.time}</div>
          ${found.room !== '—' ? `<div class="next-class-meta-item">${svgIcon('map-pin')} ${found.room}</div>` : ''}
          <div class="next-class-meta-item">${svgIcon('layers')} ${found.semester}º semestre</div>
        </div>`;
    } else {
      container.innerHTML = `<div class="no-events-msg">Nenhuma aula cadastrada.</div>`;
    }
  }
}




function svgIcon(name) {
  const icons = {
    clock:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    calendar:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    user:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'map-pin':`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    layers:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  };
  return icons[name] || '';
}

async function renderHomeNewsletter() {
  const container = document.getElementById('home-newsletter');
  if (!container) return;
  const data = await fetchJSON('./data/newsletter.json');
  if (!data || data.length === 0) { container.innerHTML = `<div class="no-events-msg">Nenhuma newsletter.</div>`; return; }
  const latest = data[0];
  container.innerHTML = `<div style="position:relative;z-index:1">
    <div class="newsletter-date">${formatDate(latest.date)}</div>
    <div style="font-family:var(--font-display);font-size:15px;font-weight:700;font-style:italic;color:var(--text);line-height:1.35;margin-bottom:8px">${latest.title}</div>
    <div style="font-size:12.5px;color:var(--text-muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${latest.summary||''}</div>
    <button class="btn btn-ghost btn-sm" style="margin-top:12px" onclick="navigateTo('newsletter')">Ver newsletter →</button>
  </div>`;
}

function initModals() {
  const overlay = document.getElementById('newsletter-modal');
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeNewsletterModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeNewsletterModal?.(); fecharEstudosModal?.(); closeKanbanModal?.(); closeSearch?.(); closeDevCard?.(); }
  });
}

// ===== DEV CARD =====
function openDevCard() {
  document.getElementById('dev-card-overlay')?.classList.remove('hidden');
}
function closeDevCard() {
  document.getElementById('dev-card-overlay')?.classList.add('hidden');
}

function updateTime() {
  const el = document.getElementById('current-time');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

function showToast(msg, duration = 2500) {
  let toast = document.querySelector('.dasi-toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'dasi-toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== ESTUDOS EASTER EGG =====
let estudosClickCount = 0;
let estudosClickTimer = null;

function triggerCaligrafiaEasterEgg() {
  if (document.getElementById('caligrafia-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'caligrafia-overlay';
  overlay.className = 'caligrafia-overlay';
  overlay.innerHTML = `
    <div class="caligrafia-box">
      <button class="caligrafia-close" onclick="document.getElementById('caligrafia-overlay').remove()">×</button>
      <div class="caligrafia-emoji">✍️</div>
      <div class="caligrafia-secret">— Aula Secreta Desbloqueada —</div>
      <div class="caligrafia-title">Aula de Caligrafia</div>
      <div class="caligrafia-desc">
        Parabéns! Você encontrou uma aula especial.<br>
        A arte da caligrafia é fundamental para qualquer estudante de SI — afinal, comunicação é tudo.
      </div>
      <a href="https://youtu.be/dQw4w9WgXcQ?si=b7kZlAuE7yX-D9lP" target="_blank" rel="noopener" class="caligrafia-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Assistir aula
      </a>
      <div class="caligrafia-fine-print">Clique 6x em Estudos para rever esta aula</div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(overlay);
}


// ===== INIT =====
// ===== LITE MODE =====
function toggleLiteMode() {
  const isLite = document.body.classList.toggle('lite-mode');
  localStorage.setItem('dasiLiteMode', isLite ? '1' : '0');
  renderLiteBtn();
}

function renderLiteBtn() {
  const btn = document.getElementById('lite-mode-btn');
  const status = document.getElementById('lite-status');
  if (!btn || !status) return;
  const isLite = document.body.classList.contains('lite-mode');
  btn.classList.toggle('active', isLite);
  status.textContent = isLite ? 'on' : 'off';
  btn.title = isLite ? 'Modo Leve ativado — clique para desativar' : 'Ativar Modo Leve (melhora performance em dispositivos lentos)';
}

function loadLiteMode() {
  if (localStorage.getItem('dasiLiteMode') === '1') {
    document.body.classList.add('lite-mode');
  }
  // Clean up the pre-paint attribute now that JS is loaded
  document.documentElement.removeAttribute('data-lite');
  renderLiteBtn();
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  renderThemeSwitch();
  loadLiteMode();
  createSidebarOverlay();
  const hash = window.location.hash.replace('#','') || 'home';
  navigateTo(hash);
  initHome();
  initModals();
  updateTime();

  // ── PWA Service Worker ──────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[DaSIboard] SW registrado:', reg.scope);
        // Solicita permissão de notificação após 4s para não assustar o usuário
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(() => {
            Notification.requestPermission().then(perm => {
              if (perm === 'granted') showToast('🔔 Notificações ativadas! Você será avisado sobre faltas e eventos.', 3500);
            });
          }, 4000);
        }
      })
      .catch(err => console.warn('[DaSIboard] SW falhou:', err));
  }
  setInterval(updateTime, 1000);
  setInterval(renderHeroGreeting, 60000);
  window.addEventListener('popstate', () => { navigateTo(window.location.hash.replace('#','') || 'home'); });
});

// ===== INTEGRAÇÕES E FUNÇÕES NOVAS =====

// ── Refresh global de dados de eventos ────────────────────────────────────────
// Atualiza eventsData e re-renderiza todos os widgets da home que dependem dele.
// Chamado após merge/aceite de PR ou manualmente.
async function refreshEventsData() {
  eventsData = await fetchJSON('./data/events.json').then(d => d || []);
  renderUpcomingEvents();
  renderCountdown();
  updateStatEvents();
  // Se o calendário já foi carregado, força recarregamento dele também
  if (typeof calEvents !== 'undefined' && calEvents.length > 0) {
    calEvents = eventsData;
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderCalendarSidebar === 'function' && typeof calSelectedDate !== 'undefined' && calSelectedDate) {
      renderCalendarSidebar(calSelectedDate, typeof getFilteredEvents === 'function' ? getFilteredEvents(calSelectedDate) : []);
    }
  }
  // Atualiza a busca se cache estiver ativo
  if (typeof searchEventsCache !== 'undefined') searchEventsCache = eventsData;
}

// ── Contagem de dias até um evento específico ─────────────────────────────────
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = parseDate(dateStr);
  const diff = Math.ceil((target - today) / 86400000);
  return diff;
}

// ── Badge de urgência baseado em dias restantes ───────────────────────────────
function urgencyBadge(dateStr) {
  const days = daysUntil(dateStr);
  if (days < 0)  return `<span class="badge badge-red" style="font-size:9px">Encerrado</span>`;
  if (days === 0) return `<span class="badge badge-red" style="font-size:9px">Hoje!</span>`;
  if (days <= 2) return `<span class="badge badge-yellow" style="font-size:9px">${days}d</span>`;
  if (days <= 7) return `<span class="badge badge-blue" style="font-size:9px">${days}d</span>`;
  return '';
}

// ── renderUpcomingEvents: agora com badge de urgência e clique para calendário ─
// Substitui a versão original com mais informação e interatividade.
function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events');
  if (!container) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = eventsData
    .filter(e => parseDate(e.date) >= today)
    .sort((a,b) => parseDate(a.date) - parseDate(b.date))
    .slice(0, 6);
  if (!upcoming.length) {
    container.innerHTML = `<div class="no-events-msg">Nenhum evento próximo.</div>`;
    return;
  }
  container.innerHTML = upcoming.map((ev, i) => {
    const d = parseDate(ev.date);
    const day = String(d.getDate()).padStart(2,'0');
    const month = MONTH_NAMES_SHORT[d.getMonth()];
    const urg = urgencyBadge(ev.date);
    const entBadge = (ev.entidade && typeof ENTIDADE_META !== 'undefined' && ENTIDADE_META[ev.entidade])
      ? `<span style="font-size:11px;color:${ENTIDADE_META[ev.entidade].cor}">${ENTIDADE_META[ev.entidade].emoji} ${ENTIDADE_META[ev.entidade].nome}</span>`
      : '';
    return `<div class="event-item anim-fade-up" style="animation-delay:${i*0.06}s;cursor:pointer"
      onclick="navigateTo('calendar');setTimeout(()=>{const y=${d.getFullYear()},m=${d.getMonth()};if(typeof calYear!=='undefined'){calYear=y;calMonth=m;calSelectedDate='${ev.date}';renderCalendar();renderCalendarSidebar('${ev.date}',getFilteredEvents('${ev.date}'));}},150)">
      <div class="event-date-badge"><span class="day">${day}</span><span class="month">${month}</span></div>
      <div class="event-info" style="flex:1;min-width:0">
        <div class="event-title">${ev.title}</div>
        <div class="event-desc" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${ev.description && ev.description !== 'NA' ? `<span>${ev.description}</span>` : ''}
          ${entBadge}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        ${typeToLabel(ev.type)}
        ${urg}
      </div>
    </div>`;
  }).join('');
}

// ── renderCountdown: multi-unidade (dias, horas, minutos) ─────────────────────
function renderCountdown() {
  const container = document.getElementById('countdown-card');
  if (!container) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = eventsData
    .filter(e => parseDate(e.date) >= today)
    .sort((a,b) => parseDate(a.date) - parseDate(b.date));
  if (!upcoming.length) {
    container.innerHTML = `<div class="countdown-past">Nenhum evento próximo.</div>`;
    return;
  }
  const next = upcoming[0];
  const nextDate = parseDate(next.date);
  const diffMs = nextDate - today;
  const diffDays = Math.ceil(diffMs / 86400000);

  // Múltiplos eventos próximos (próximos 3)
  const moreEvents = upcoming.slice(1, 3);
  const moreHtml = moreEvents.length
    ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--glass-border);display:flex;flex-direction:column;gap:6px;position:relative;z-index:2">
        <div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">Próximos</div>
        ${moreEvents.map(e => {
          const d2 = daysUntil(e.date);
          return `<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted)">
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);min-width:28px">${d2}d</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</span>
            ${typeToLabel(e.type)}
          </div>`;
        }).join('')}
      </div>`
    : '';

  container.innerHTML = `
    <div style="position:relative;z-index:2">
      <div class="countdown-event-name" onclick="navigateTo('calendar');setTimeout(()=>{if(typeof calYear!=='undefined'){const d=parseDate('${next.date}');calYear=d.getFullYear();calMonth=d.getMonth();calSelectedDate='${next.date}';renderCalendar();renderCalendarSidebar('${next.date}',getFilteredEvents('${next.date}'));}},150)" style="cursor:pointer">${next.title}</div>
      <div class="countdown-units">
        <div class="countdown-unit">
          <div class="countdown-num">${String(diffDays).padStart(2,'0')}</div>
          <div class="countdown-lbl">${diffDays === 1 ? 'Dia' : 'Dias'}</div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px;position:relative;z-index:2">
        ${typeToLabel(next.type)}
        ${urgencyBadge(next.date)}
      </div>
      <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-dim);margin-top:8px;position:relative;z-index:2">${formatDate(next.date)}</div>
    </div>
    ${moreHtml}
  `;
}

// ── Navegação com indicador de loading liquid glass ───────────────────────────
const _navOriginal = navigateTo;
window.navigateWithFeedback = function(page) {
  // Adiciona classe de transição na saída
  document.querySelectorAll('.page.active').forEach(p => {
    p.style.opacity = '0.6';
    p.style.transform = 'scale(0.99)';
    p.style.transition = 'opacity .15s, transform .15s';
  });
  setTimeout(() => {
    _navOriginal(page);
    document.querySelectorAll('.page.active').forEach(p => {
      p.style.opacity = '';
      p.style.transform = '';
    });
  }, 120);
};



// ── Badge dinâmico na sidebar para eventos de hoje ───────────────────────────
function updateTodayEventsBadge() {
  const badge = document.getElementById('sb-events-count');
  if (!badge) return;
  const todayKey = todayStr();
  const todayCount = eventsData.filter(e => e.date === todayKey).length;
  badge.textContent = todayCount > 0 ? todayCount : '';
}

// ── Integração sidebar: clique no badge de eventos vai para calendário no dia ──
(function patchSidebarEventsBadge() {
  const badge = document.getElementById('sb-events-count');
  if (badge && badge.parentElement) {
    badge.parentElement.addEventListener('click', (e) => {
      // Ao navegar para calendar, selecionar hoje
      if (typeof calYear !== 'undefined') {
        const now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        calSelectedDate = todayStr();
      }
    });
  }
})();

// ── Keyboard shortcut: G abre modal de proposta de evento ────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.key === 'h' || e.key === 'H') navigateTo('home');
  if (e.key === 'c' || e.key === 'C') navigateTo('calendar');
  if (e.key === 'k' || e.key === 'K') navigateTo('kanban');
});

// ── Tooltip de atalhos de teclado no footer da sidebar ───────────────────────
(function addKeyboardHints() {
  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;
  const hint = document.createElement('div');
  hint.style.cssText = 'font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:0 10px 4px;letter-spacing:.3px;line-height:1.7;';
  hint.innerHTML = '<kbd style="background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:3px;padding:0 4px;font-size:8.5px">H</kbd> Home &nbsp; <kbd style="background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:3px;padding:0 4px;font-size:8.5px">C</kbd> Calendário &nbsp; <kbd style="background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:3px;padding:0 4px;font-size:8.5px">G</kbd> + Evento';
  footer.appendChild(hint);
})();

// ===== AUTENTICAÇÃO & PERFIL =====
function handleProfileClick(origin = 'topbar') {
  const btn = document.getElementById(origin === 'sidebar' ? 'sidebar-header-profile-btn' : 'profile-btn');
  
  if (!btn) {
    console.error('Profile button not found', origin);
    return;
  }
  
  if (btn.dataset.state === 'guest') {
    // Se não logado, redireciona para login
    window.location.href = 'login.html';
  } else {
    // Se logado, abre menu específico
    toggleProfileMenu(origin);
  }
}

function toggleProfileMenu(origin = 'topbar') {
  const menu = origin === 'sidebar' 
    ? document.getElementById('profile-menu-sidebar')
    : document.getElementById('profile-menu-topbar');
  
  if (!menu) return;
  
  // Fechar outro menu se aberto
  const otherMenu = origin === 'sidebar' 
    ? document.getElementById('profile-menu-topbar')
    : document.getElementById('profile-menu-sidebar');
  if (otherMenu) otherMenu.classList.add('hidden');
  
  menu.classList.toggle('hidden');

  // Fechar ao clicar fora
  if (!menu.classList.contains('hidden')) {
    setTimeout(() => {
      document.addEventListener('click', (e) => closeProfileMenuOnClick(e, origin), true);
    }, 0);
  }
}

function closeProfileMenuOnClick(e, origin = 'topbar') {
  const menu = origin === 'sidebar' 
    ? document.getElementById('profile-menu-sidebar')
    : document.getElementById('profile-menu-topbar');
  const btn = origin === 'sidebar' 
    ? document.getElementById('sidebar-header-profile-btn')
    : document.getElementById('profile-btn');
  
  if (!menu.contains(e.target) && btn !== e.target && !btn.contains(e.target)) {
    menu.classList.add('hidden');
    document.removeEventListener('click', (e) => closeProfileMenuOnClick(e, origin), true);
  }
}

function closeProfileMenu(origin = 'both') {
  if (origin === 'sidebar' || origin === 'both') {
    const menuSidebar = document.getElementById('profile-menu-sidebar');
    if (menuSidebar) menuSidebar.classList.add('hidden');
  }
  if (origin === 'topbar' || origin === 'both') {
    const menuTopbar = document.getElementById('profile-menu-topbar');
    if (menuTopbar) menuTopbar.classList.add('hidden');
  }
}

function confirmLogout() {
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeLogoutModal() {
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) modal.classList.add('hidden');
}

function doLogout() {
  closeLogoutModal();
  authManager.logout().then(result => {
    if (result.success) {
      window.location.href = 'index.html';
    }
  });
}
