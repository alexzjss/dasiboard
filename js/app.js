// ===== APP MAIN — DaSIboard v2 =====

let eventsData = [];
let scheduleDataAll = null;

// ===== THEME SYSTEM =====
const THEMES = [
  { key: 'padrao',      label: 'Padrão' },
  { key: 'super',       label: 'Super' },
  { key: 'hypado',      label: 'Hypado' },
  { key: 'omni',        label: 'Omni' },
  { key: 'minas',       label: 'Minas' },
  { key: 'd20',         label: 'D20' },
  { key: 'grifinho',    label: 'Grifinho' },
  { key: 'bidu',        label: 'Bidu' },
  { key: 'laboratorio', label: 'Laboratório' },
  { key: 'sintetizado', label: 'Sintetizado' },
  { key: 'masacote',    label: 'Masacote' },
  { key: 'grace',       label: 'Grace' },
];
let currentThemeIndex = 0;
let themeFullRotations = 0;

function cycleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
  if (currentThemeIndex === 0) {
    themeFullRotations++;
    if (themeFullRotations >= 2) { triggerMoonEasterEgg(); themeFullRotations = 0; }
  }
  applyTheme(THEMES[currentThemeIndex]);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme.key);
  const dot = document.getElementById('theme-dot');
  const label = document.getElementById('theme-label');
  if (label) label.textContent = theme.label;
  if (dot) { dot.style.animation = 'none'; void dot.offsetWidth; dot.style.animation = ''; }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bgMap = { padrao:'#07070c',super:'#050a14',hypado:'#080600',omni:'#060606',minas:'#060908',d20:'#020614',grifinho:'#f4f0ff',bidu:'#fff8f0',laboratorio:'#fff0f7',sintetizado:'#f0f6ff',masacote:'#fffce8',grace:'#fff4eb' };
    meta.setAttribute('content', bgMap[theme.key] || '#07070c');
  }
  localStorage.setItem('dasitheme', theme.key);
}

function loadSavedTheme() {
  const saved = localStorage.getItem('dasitheme');
  if (saved) { const idx = THEMES.findIndex(t => t.key === saved); if (idx >= 0) { currentThemeIndex = idx; applyTheme(THEMES[idx]); return; } }
  applyTheme(THEMES[0]);
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
  if (page === 'calendar') initCalendar();
  if (page === 'schedule') initSchedule();
  if (page === 'newsletter') initNewsletter();
  if (page === 'docentes') initDocentes();
  if (page === 'estudos') initEstudos();
  if (page === 'ferramentas') closeTool?.();
  if (page === 'notas-gpa') initGPA?.();
  if (page === 'kanban') { initKanban?.(); }
  if (page === 'entidades') initEntidades?.();
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
async function initHome() {
  renderHeroGreeting();
  const data = await fetchJSON('./data/events.json');
  eventsData = data || [];
  const schData = await fetchJSON('./data/schedule.json');
  scheduleDataAll = schData || {};
  renderUpcomingEvents();
  renderHomeNewsletter();
  renderNextClass();
  renderCountdown();
  updateStatEvents();
  updateHomeKanbanPeek();
  updateStatTasks();
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
  Object.entries(scheduleDataAll).forEach(([sem, courses]) => courses.forEach(c => allClasses.push({ ...c, semester: sem })));
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

function renderCountdown() {
  const container = document.getElementById('countdown-card');
  if (!container) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = eventsData.filter(e => parseDate(e.date) >= today).sort((a,b) => parseDate(a.date) - parseDate(b.date));
  if (!upcoming.length) { container.innerHTML = `<div class="countdown-past">Nenhum evento próximo.</div>`; return; }
  const next = upcoming[0];
  const nextDate = parseDate(next.date);
  const diffMs = nextDate - today;
  const diffDays = Math.ceil(diffMs / 86400000);
  container.innerHTML = `
    <div class="countdown-event-name">${next.title}</div>
    <div class="countdown-units">
      <div class="countdown-unit">
        <div class="countdown-num">${String(diffDays).padStart(2,'0')}</div>
        <div class="countdown-lbl">${diffDays === 1 ? 'Dia' : 'Dias'}</div>
      </div>
    </div>
    <div class="countdown-event-type" style="margin-top:12px">${typeToLabel(next.type)}</div>
    <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-dim);margin-top:8px">${formatDate(next.date)}</div>
  `;
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events');
  if (!container) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = eventsData.filter(e => parseDate(e.date) >= today).sort((a,b) => parseDate(a.date) - parseDate(b.date)).slice(0, 6);
  if (!upcoming.length) { container.innerHTML = `<div class="no-events-msg">Nenhum evento próximo.</div>`; return; }
  container.innerHTML = upcoming.map((ev, i) => {
    const d = parseDate(ev.date);
    const day = String(d.getDate()).padStart(2,'0');
    const month = MONTH_NAMES_SHORT[d.getMonth()];
    return `<div class="event-item anim-fade-up" style="animation-delay:${i*0.06}s">
      <div class="event-date-badge"><span class="day">${day}</span><span class="month">${month}</span></div>
      <div class="event-info">
        <div class="event-title">${ev.title}</div>
        <div class="event-desc">${ev.description && ev.description !== 'NA' ? ev.description : ''}</div>
      </div>
      ${typeToLabel(ev.type)}
    </div>`;
  }).join('');
}

function typeToLabel(type) {
  const map = { prova:`<span class="badge badge-red">Prova</span>`,entrega:`<span class="badge badge-yellow">Entrega</span>`,evento:`<span class="badge badge-green">Evento</span>`,apresentacao:`<span class="badge badge-blue">Apresentação</span>`,deadline:`<span class="badge badge-yellow">Deadline</span>` };
  return map[type] || `<span class="badge badge-purple">${type||'Evento'}</span>`;
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
    if (e.key === 'Escape') { closeNewsletterModal?.(); fecharEstudosModal?.(); closeKanbanModal?.(); closeSearch?.(); }
  });
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  createSidebarOverlay();
  const hash = window.location.hash.replace('#','') || 'home';
  navigateTo(hash);
  initHome();
  initModals();
  updateTime();
  setInterval(updateTime, 1000);
  setInterval(renderHeroGreeting, 60000);
  window.addEventListener('popstate', () => { navigateTo(window.location.hash.replace('#','') || 'home'); });
});
