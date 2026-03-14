// ===== APP MAIN =====

let eventsData = [];
let scheduleDataAll = null;

// ===== THEME SYSTEM =====
const THEMES = [
  { key: 'padrao', label: 'Padrão' },
  { key: 'super',  label: 'Super' },
  { key: 'hypado', label: 'Hypado' },
  { key: 'omni',   label: 'Omni' },
];

let currentThemeIndex = 0;
let themeFullRotations = 0;

function cycleTheme() {
  const prevIndex = currentThemeIndex;
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;

  // Track full rotations (returning to theme 0)
  if (currentThemeIndex === 0) {
    themeFullRotations++;
    if (themeFullRotations >= 2) {
      triggerMoonEasterEgg();
      themeFullRotations = 0;
    }
  }

  applyTheme(THEMES[currentThemeIndex]);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme.key);
  const dot = document.getElementById('theme-dot');
  const label = document.getElementById('theme-label');
  if (dot) dot.style.animation = 'none';
  if (label) label.textContent = theme.label;
  // Re-trigger dot animation
  setTimeout(() => {
    if (dot) dot.style.animation = '';
  }, 10);
  localStorage.setItem('dasitheme', theme.key);
}

function triggerMoonEasterEgg() {
  const moon = document.getElementById('moon-egg');
  if (!moon) return;
  moon.classList.remove('flying');
  void moon.offsetWidth; // reflow to restart anim
  moon.classList.add('flying');
  setTimeout(() => moon.classList.remove('flying'), 1500);
}

function loadSavedTheme() {
  const saved = localStorage.getItem('dasitheme');
  if (saved) {
    const idx = THEMES.findIndex(t => t.key === saved);
    if (idx >= 0) {
      currentThemeIndex = idx;
      applyTheme(THEMES[idx]);
      return;
    }
  }
  applyTheme(THEMES[0]);
}

// ===== ROUTING =====
function navigateTo(page) {
  // Deactivate all
  els('.page').forEach(p => p.classList.remove('active'));
  els('.nav-link').forEach(l => l.classList.remove('active'));

  // Activate target
  const pageEl = el(`#${page}-page`);
  const navEl = el(`[data-page="${page}"]`);

  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  // Close mobile nav
  el('.navbar-nav').classList.remove('mobile-open');
  el('.hamburger').classList.remove('open');

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load page data
  if (page === 'calendar') initCalendar();
  if (page === 'schedule') initSchedule();
  if (page === 'newsletter') initNewsletter();
  if (page === 'docentes') initDocentes();
  if (page === 'estudos') initEstudos();

  // Update URL hash
  history.pushState(null, '', `#${page}`);
}

// ===== HOME PAGE =====
async function initHome() {
  // Load events
  const data = await fetchJSON('./data/events.json');
  eventsData = data || [];

  // Load schedule for stats only
  const schData = await fetchJSON('./data/schedule.json');
  scheduleDataAll = schData || {};

  renderUpcomingEvents();
  renderHomeNewsletter();
  renderStats();
}

function renderStats() {
  const semCount = el('#stat-semesters');
  const eventCount = el('#stat-events');
  const courseCount = el('#stat-courses');

  if (semCount) semCount.textContent = '8';

  if (eventCount && eventsData) {
    const today = new Date();
    const upcoming = eventsData.filter(e => parseDate(e.date) >= today);
    eventCount.textContent = upcoming.length;
  }

  if (courseCount && scheduleDataAll) {
    let total = 0;
    Object.values(scheduleDataAll).forEach(arr => total += arr.length);
    courseCount.textContent = total;
  }
}

function renderNextClass() {
  const container = el('#next-class-info');
  if (!container || !scheduleDataAll) return;

  const now = new Date();
  const currentDayName = DAY_NAMES_FULL[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Flatten all classes
  let allClasses = [];
  Object.entries(scheduleDataAll).forEach(([sem, courses]) => {
    courses.forEach(c => allClasses.push({ ...c, semester: sem }));
  });

  // Find current or next class today
  const todayClasses = allClasses.filter(c => c.day === currentDayName);
  const { start: nowStart, end: nowEnd } = { start: nowMinutes, end: nowMinutes };

  // Check if there's a class happening NOW
  const currentClass = todayClasses.find(c => {
    const { start, end } = parseTimeRange(c.time);
    return nowMinutes >= start && nowMinutes <= end;
  });

  // Find next class today
  const nextToday = todayClasses
    .filter(c => parseTimeRange(c.time).start > nowMinutes)
    .sort((a, b) => parseTimeRange(a.time).start - parseTimeRange(b.time).start)[0];

  const targetClass = currentClass || nextToday;

  if (targetClass) {
    const isNow = !!currentClass;
    container.innerHTML = `
      <div class="next-class-label">
        ${isNow ? '🎓 Aula em andamento' : '⏰ Próxima aula hoje'}
      </div>
      <div class="next-class-name">${targetClass.course}</div>
      <div class="next-class-meta">
        <div class="next-class-meta-item">
          ${svgIcon('clock')}
          ${targetClass.time}
        </div>
        <div class="next-class-meta-item">
          ${svgIcon('calendar')}
          ${targetClass.day}
        </div>
        ${targetClass.professor !== '—' ? `
        <div class="next-class-meta-item">
          ${svgIcon('user')}
          ${targetClass.professor}
        </div>` : ''}
        ${targetClass.room !== '—' ? `
        <div class="next-class-meta-item">
          ${svgIcon('map-pin')}
          ${targetClass.room}
        </div>` : ''}
        <div class="next-class-meta-item">
          ${svgIcon('layers')}
          ${targetClass.semester}º semestre
        </div>
      </div>
    `;
  } else {
    // Find next class in the week
    const daysOrder = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const todayIdx = daysOrder.indexOf(currentDayName);

    let found = null;
    let foundDay = null;
    for (let i = 1; i <= 7 && !found; i++) {
      const nextDayName = daysOrder[(todayIdx + i) % 7];
      const candidates = allClasses
        .filter(c => c.day === nextDayName)
        .sort((a, b) => parseTimeRange(a.time).start - parseTimeRange(b.time).start);
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
        </div>
      `;
    } else {
      container.innerHTML = `<div class="no-events-msg">Nenhuma aula cadastrada.</div>`;
    }
  }
}

function renderUpcomingEvents() {
  const container = el('#upcoming-events');
  if (!container) return;

  const today = new Date();
  today.setHours(0,0,0,0);

  const upcoming = eventsData
    .filter(e => parseDate(e.date) >= today)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .slice(0, 5);

  if (!upcoming.length) {
    container.innerHTML = `<div class="no-events-msg">Nenhum evento próximo.</div>`;
    return;
  }

  container.innerHTML = upcoming.map((ev, i) => {
    const d = parseDate(ev.date);
    const day = d.getDate();
    const month = MONTH_NAMES_SHORT[d.getMonth()];
    const typeBadge = typeToLabel(ev.type);

    return `
      <div class="event-item anim-fade-up" style="animation-delay: ${i*0.07}s">
        <div class="event-date-badge">
          <span class="day">${String(day).padStart(2,'0')}</span>
          <span class="month">${month}</span>
        </div>
        <div class="event-info">
          <div class="event-title">${ev.title}</div>
          <div class="event-desc">${ev.description || ''}</div>
        </div>
        ${typeBadge}
      </div>
    `;
  }).join('');
}

function typeToLabel(type) {
  const map = {
    prova: `<span class="badge badge-red">Prova</span>`,
    entrega: `<span class="badge badge-yellow">Entrega</span>`,
    evento: `<span class="badge badge-green">Evento</span>`,
    apresentacao: `<span class="badge badge-blue">Apresentação</span>`,
  };
  return map[type] || `<span class="badge badge-purple">${type || 'Evento'}</span>`;
}

function svgIcon(name) {
  const icons = {
    clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'map-pin': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    layers: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    book: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    home: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    bell: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    grid: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    mail: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    event: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  };
  return icons[name] || '';
}

// ===== HAMBURGER =====
function toggleMobileNav() {
  const nav = el('.navbar-nav');
  const ham = el('.hamburger');
  nav.classList.toggle('mobile-open');
  ham.classList.toggle('open');
}

// ===== MODAL close on overlay click =====
function initModal() {
  const overlay = el('#newsletter-modal');
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeNewsletterModal();
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeNewsletterModal();
      fecharEstudosModal();
    }
  });
}

// ===== CURRENT TIME DISPLAY =====
function updateTime() {
  const timeEl = el('#current-time');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  loadSavedTheme();

  // Check URL hash for initial page
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash);

  // Init home data
  initHome();

  // Modal setup
  initModal();
  initEstudosModal();

  // Clock
  updateTime();
  setInterval(updateTime, 1000);

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const page = window.location.hash.replace('#', '') || 'home';
    navigateTo(page);
  });
});
