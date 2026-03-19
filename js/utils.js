// ===== UTILS — DaSIboard =====
// Funções utilitárias globais usadas por todos os módulos

// ── Seletor de elemento ──────────────────────────────────────────────────────
function el(selector) {
  return document.querySelector(selector);
}

// ── Seletor de múltiplos elementos ──────────────────────────────────────────
function els(selector) {
  return document.querySelectorAll(selector);
}

// ── Nomes de meses em português (para calendario e entidades) ────────────────
const MONTH_NAMES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const MONTH_NAMES_SHORT = [
  'jan','fev','mar','abr','mai','jun',
  'jul','ago','set','out','nov','dez'
];

// ── Metadados das entidades (id → { cor, emoji, nome }) ─────────────────────
// Espelha os dados de data/entidades.json para uso nos módulos de calendário
const ENTIDADE_META = {
  'dasi':           { cor: '#7c3aed', emoji: '🎓', nome: 'DASI' },
  'semana-si':      { cor: '#0ea5e9', emoji: '🚀', nome: 'Semana de SI' },
  'grace':          { cor: '#ec4899', emoji: '💜', nome: 'GRACE USP' },
  'each-in-the-shell': { cor: '#10b981', emoji: '🐚', nome: 'EiTS' },
  'hype':           { cor: '#f97316', emoji: '⚡', nome: 'Hype' },
  'codelab':        { cor: '#6366f1', emoji: '💻', nome: 'CodeLab' },
  'lab-das-minas':  { cor: '#d946ef', emoji: '🔬', nome: 'Lab das Minas' },
  'conway':         { cor: '#14b8a6', emoji: '🧮', nome: 'Conway' },
  'pet-si':         { cor: '#f59e0b', emoji: '🏅', nome: 'PET-SI' },
  'sintese-jr':     { cor: '#ef4444', emoji: '💼', nome: 'Síntese Jr.' },
};

// ── Gerar cor determinística a partir de uma string ─────────────────────────
function hashStringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 60, 55);
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── Converter cor hex + alpha para rgba ─────────────────────────────────────
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(128,128,128,${alpha})`;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Fetch JSON com cache e fallback ─────────────────────────────────────────
async function fetchJSON(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[DaSIboard] fetchJSON falhou:', url, e.message);
    return null;
  }
}

// ── Nomes de dias da semana ──────────────────────────────────────────────────
const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Parsear data "YYYY-MM-DD" como local (sem fuso) ──────────────────────────
function parseDate(str) {
  if (!str) return new Date(NaN);
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ── Formatar data por extenso: "12 de março de 2026" ────────────────────────
function formatDate(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Formatar data curta: "12 mar" ────────────────────────────────────────────
function formatDateShort(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
}

// ── Parsear intervalo de horário "HH:MM-HH:MM" → { start, end } em minutos ──
function parseTimeRange(timeStr) {
  if (!timeStr) return { start: 0, end: 0 };
  const parts = String(timeStr).split('-');
  const toMin = (t) => {
    const [h, m] = t.trim().split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return { start: toMin(parts[0] || '0:0'), end: toMin(parts[1] || '0:0') };
}

// ── Saudação por hora do dia ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ── Escapar HTML ─────────────────────────────────────────────────────────────
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
