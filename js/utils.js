// ===== UTILS =====

const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTH_NAMES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAY_NAMES_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DAY_NAMES_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')} de ${MONTH_NAMES_PT[m-1]} de ${y}`;
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')} ${MONTH_NAMES_SHORT[m-1]}`;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getCurrentDayName() {
  return DAY_NAMES_FULL[new Date().getDay()];
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr || timeStr === '—') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function parseTimeRange(timeRange) {
  if (!timeRange || timeRange === '—') return { start: 0, end: 0 };
  const parts = timeRange.split('-');
  return {
    start: timeToMinutes(parts[0]),
    end: timeToMinutes(parts[1])
  };
}

// Color palette for courses (auto-assigned, deterministic)
const COURSE_COLORS = [
  '#7c3aed', '#a855f7', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#84cc16', '#14b8a6', '#0ea5e9', '#e11d48'
];

function getCourseColor(index) {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

// Hash string to color index
function hashStringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// JSON fetch cache to avoid redundant requests within a session
const _jsonCache = new Map();

async function fetchJSON(url) {
  const cacheKey = url.split('?')[0];
  if (_jsonCache.has(cacheKey)) return _jsonCache.get(cacheKey);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(cacheKey, { signal: ctrl.signal, cache: 'no-cache' }).finally(() => clearTimeout(t));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _jsonCache.set(cacheKey, data);
    return data;
  } catch (e) {
    console.warn(`Failed to fetch ${cacheKey}:`, e.name === 'AbortError' ? 'timeout' : e.message);
    return null;
  }
}

function el(selector, parent = document) {
  return parent.querySelector(selector);
}

function els(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

function staggerChildren(parent, cls = 'anim-fade-up') {
  const kids = parent.children;
  [...kids].forEach((child, i) => {
    child.classList.add(cls);
    child.style.animationDelay = `${i * 0.06}s`;
  });
}

function showLoadingIn(container) {
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Carregando...</div>`;
}

// ── Mapa de entidades (compartilhado entre calendar, app, entidades) ──────────
const ENTIDADE_META = {
  'dasi':             { nome:'DASI',             cor:'#7c3aed', emoji:'🎓' },
  'semana-si':        { nome:'Semana de SI',     cor:'#0ea5e9', emoji:'🚀' },
  'grace':            { nome:'GRACE',            cor:'#ec4899', emoji:'💜' },
  'each-in-the-shell':{ nome:'Each in the Shell',cor:'#10b981', emoji:'🐚' },
  'hype':             { nome:'Hype',             cor:'#f97316', emoji:'⚡' },
  'codelab':          { nome:'CodeLab',          cor:'#6366f1', emoji:'💻' },
  'lab-das-minas':    { nome:'Lab das Minas',    cor:'#d946ef', emoji:'🔬' },
  'conway':           { nome:'Conway',           cor:'#14b8a6', emoji:'🧮' },
  'pet-si':           { nome:'PET-SI',           cor:'#f59e0b', emoji:'🏅' },
  'sintese-jr':       { nome:'Síntese Jr.',      cor:'#ef4444', emoji:'💼' },
};

// ── typeToLabel compartilhado (evita duplicação entre app.js e outros) ─────────
function typeToLabel(type) {
  const map = {
    prova:        `<span class="badge badge-red">Prova</span>`,
    entrega:      `<span class="badge badge-yellow">Entrega</span>`,
    evento:       `<span class="badge badge-green">Evento</span>`,
    apresentacao: `<span class="badge badge-blue">Apresentação</span>`,
    deadline:     `<span class="badge badge-yellow">Deadline</span>`
  };
  return map[type] || `<span class="badge badge-purple">${type || 'Evento'}</span>`;
}
