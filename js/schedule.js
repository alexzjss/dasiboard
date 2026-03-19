// ===== SCHEDULE MODULE — DaSIboard =====

let scheduleInitialized = false;
let scheduleData = null;
let selectedSemester = null;
let selectedTurma = null;

const DAY_ORDER = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TIPO_LABELS = {
  especifica: { label: 'Específica SI', color: 'var(--primary)' },
  ciclobasico: { label: 'Ciclo Básico', color: 'var(--info)' },
  optativa: { label: 'Optativa', color: 'var(--success)' },
  default: { label: 'Disciplina', color: 'var(--text-muted)' }
};

async function initSchedule() {
  if (scheduleInitialized && scheduleData) {
    renderSchedulePage();
    return;
  }

  const grid = document.getElementById('schedule-grid');
  if (grid) grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Carregando grade...</div>';

  try {
    scheduleData = await fetchJSON('./data/schedule.json');
    if (!scheduleData) throw new Error('Dados não encontrados');
    scheduleInitialized = true;

    // Selecionar semestre e turma padrão
    const semesters = scheduleData.semesters || [];
    if (semesters.length > 0) {
      selectedSemester = semesters[0].id;
      const firstTurmas = semesters[0].turmas || [];
      selectedTurma = firstTurmas.length > 0 ? firstTurmas[0] : null;
    }

    renderSchedulePage();
  } catch (e) {
    console.error('[DaSIboard] Erro ao carregar horários:', e);
    if (grid) grid.innerHTML = '<div class="no-events-msg">Não foi possível carregar os horários. Tente novamente.</div>';
  }
}

function renderSchedulePage() {
  renderSemesterButtons();
  renderTurmaHeader();
  renderScheduleGrid();
}

function renderSemesterButtons() {
  const container = document.getElementById('semester-buttons');
  if (!container || !scheduleData) return;

  const semesters = scheduleData.semesters || [];
  container.innerHTML = semesters.map(sem => {
    const isActive = sem.id === selectedSemester;
    return `<button class="semester-btn ${isActive ? 'active' : ''}" onclick="selectSemester('${sem.id}')">${sem.label}</button>`;
  }).join('');
}

function selectSemester(semId) {
  selectedSemester = semId;
  const semesters = scheduleData.semesters || [];
  const sem = semesters.find(s => s.id === semId);
  if (sem && sem.turmas && sem.turmas.length > 0) {
    selectedTurma = sem.turmas[0];
  } else {
    selectedTurma = null;
  }
  renderSemesterButtons();
  renderTurmaHeader();
  renderScheduleGrid();
}

function selectTurma(turmaId) {
  selectedTurma = turmaId;
  renderTurmaHeader();
  renderScheduleGrid();
}

function renderTurmaHeader() {
  const container = document.getElementById('schedule-turma-header');
  if (!container || !scheduleData) { if (container) container.innerHTML = ''; return; }

  const semesters = scheduleData.semesters || [];
  const sem = semesters.find(s => s.id === selectedSemester);
  if (!sem) { container.innerHTML = ''; return; }

  const turmasInfo = scheduleData.turmas || {};
  const turmas = sem.turmas || [];

  container.innerHTML = turmas.map(tId => {
    const info = turmasInfo[tId] || {};
    const isActive = tId === selectedTurma;
    return `<button class="turma-btn ${isActive ? 'active' : ''}" onclick="selectTurma('${tId}')">
      ${info.label || ('Turma ' + tId)}
      ${info.periodo ? `<span class="turma-periodo">${info.periodo}</span>` : ''}
    </button>`;
  }).join('');
}

function renderScheduleGrid() {
  const container = document.getElementById('schedule-grid');
  if (!container || !scheduleData) return;

  if (!selectedSemester || !selectedTurma) {
    container.innerHTML = '<div class="no-events-msg">Selecione um semestre e turma para ver a grade.</div>';
    return;
  }

  const key = `${selectedSemester}_${selectedTurma}`;
  const courses = (scheduleData.schedule || {})[key];

  if (!courses || courses.length === 0) {
    container.innerHTML = `<div class="no-events-msg">Nenhuma disciplina cadastrada para ${key.replace('_', ' – Turma ')}.</div>`;
    return;
  }

  // Agrupar por dia
  const byDay = {};
  DAY_ORDER.forEach(d => byDay[d] = []);
  courses.forEach(c => {
    const day = c.day || c.dia || '';
    if (byDay[day]) byDay[day].push(c);
    else {
      byDay[day] = byDay[day] || [];
      byDay[day].push(c);
    }
  });

  const activeDays = DAY_ORDER.filter(d => byDay[d] && byDay[d].length > 0);

  if (activeDays.length === 0) {
    container.innerHTML = '<div class="no-events-msg">Nenhuma aula nesta turma.</div>';
    return;
  }

  container.innerHTML = activeDays.map(day => {
    const classes = byDay[day].sort((a, b) => {
      const ta = parseTimeRange(a.time || `${a.inicio}-${a.fim}`).start;
      const tb = parseTimeRange(b.time || `${b.inicio}-${b.fim}`).start;
      return ta - tb;
    });

    return `
      <div class="schedule-day-col">
        <div class="schedule-day-header">${day}</div>
        ${classes.map(c => renderCourseCard(c)).join('')}
      </div>`;
  }).join('');
}

function renderCourseCard(c) {
  const time = c.time || (c.inicio && c.fim ? `${c.inicio}–${c.fim}` : '');
  const tipo = c.tipo || 'default';
  const tipoInfo = TIPO_LABELS[tipo] || TIPO_LABELS.default;
  const extras = Array.isArray(c.extra) && c.extra.length > 0
    ? `<div class="schedule-extra">${c.extra.map(e => `<span>+ ${e}</span>`).join('')}</div>` : '';
  const jupLink = c.code
    ? `<a class="schedule-jupiter-link" href="https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=${c.code}" target="_blank" rel="noopener" title="Ver no JupiterWeb">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${c.code}
       </a>` : '';

  return `
    <div class="schedule-course-card" data-tipo="${tipo}">
      <div class="schedule-course-time">${time}</div>
      <div class="schedule-course-name">${escapeHTML(c.course || c.codigo || '')}</div>
      ${c.professor ? `<div class="schedule-course-prof">${escapeHTML(c.professor)}</div>` : ''}
      ${c.room ? `<div class="schedule-course-room">📍 ${escapeHTML(c.room)}</div>` : ''}
      ${extras}
      <div class="schedule-course-footer">
        <span class="schedule-tipo-badge" style="color:${tipoInfo.color};background:${tipoInfo.color}18;border:1px solid ${tipoInfo.color}30">${tipoInfo.label}</span>
        ${jupLink}
      </div>
    </div>`;
}
