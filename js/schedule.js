// ===== SCHEDULE MODULE (refactored for semester+turma) =====

let scheduleData = null;
let scheduleActiveSem = '1';
let scheduleActiveTurma = '02';

async function initSchedule() {
  if (!scheduleData) {
    const data = await fetchJSON('./data/schedule.json');
    scheduleData = data || null;
  }
  if (!scheduleData) {
    document.getElementById('schedule-grid').innerHTML = '<div class="empty-state"><p>Erro ao carregar horários.</p></div>';
    return;
  }
  renderSemesterTabs();
  renderTurmaTabs();
  renderScheduleGrid();
}

function renderSemesterTabs() {
  const el = document.getElementById('semester-buttons');
  if (!el || !scheduleData) return;
  el.innerHTML = scheduleData.semesters.map(sem => `
    <button class="sem-btn ${scheduleActiveSem === sem.id ? 'active' : ''}"
      onclick="selectSemester('${sem.id}')">
      ${sem.label}
    </button>
  `).join('');
}

function renderTurmaTabs() {
  const hdr = document.getElementById('schedule-turma-header');
  if (!hdr || !scheduleData) return;

  // Find which turmas are available for this semester
  const semInfo = scheduleData.semesters.find(s => s.id === scheduleActiveSem);
  const turmas = semInfo?.turmas || Object.keys(scheduleData.turmas);

  hdr.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Turma:</span>
      ${turmas.map(t => {
        const info = scheduleData.turmas[t];
        return `<button class="sem-btn ${scheduleActiveTurma === t ? 'active' : ''}"
          onclick="selectTurma('${t}')" style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;opacity:.7">${info?.periodo || t}</span>
          ${t}
        </button>`;
      }).join('')}
    </div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);padding:4px 8px;border-radius:var(--radius-sm);background:var(--glass-tint);border:1px solid var(--glass-border)">
      ${scheduleData.turmas[scheduleActiveTurma]?.label || scheduleActiveTurma}
    </div>
  `;
}

function selectSemester(semId) {
  scheduleActiveSem = semId;
  // Make sure current turma is available
  const semInfo = scheduleData.semesters.find(s => s.id === semId);
  if (semInfo?.turmas && !semInfo.turmas.includes(scheduleActiveTurma)) {
    scheduleActiveTurma = semInfo.turmas[0];
  }
  renderSemesterTabs();
  renderTurmaTabs();
  renderScheduleGrid();
}

function selectTurma(turma) {
  scheduleActiveTurma = turma;
  renderTurmaTabs();
  renderScheduleGrid();
}

function renderScheduleGrid() {
  const grid = document.getElementById('schedule-grid');
  if (!grid || !scheduleData) return;

  const key = `${scheduleActiveSem}_${scheduleActiveTurma}`;
  const courses = scheduleData.schedule[key];

  if (!courses || courses.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>Nenhuma disciplina cadastrada para esta combinação.</p></div>`;
    return;
  }

  // Group by tipo: ciclobasico first, then especifica
  const cb = courses.filter(c => c.tipo === 'ciclobasico');
  const esp = courses.filter(c => c.tipo !== 'ciclobasico');

  const dayOrder = ['Segunda','Terça','Quarta','Quinta','Sexta'];
  const sortFn = (a,b) => {
    const da = dayOrder.indexOf(a.day), db = dayOrder.indexOf(b.day);
    if (da !== db) return da - db;
    return (a.time||'').localeCompare(b.time||'');
  };

  let html = '';

  if (cb.length) {
    html += `
      <div class="schedule-section-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Ciclo Básico
      </div>`;
    html += cb.sort(sortFn).map(c => buildCourseCard(c, 'cb')).join('');
  }

  if (esp.length) {
    html += `
      <div class="schedule-section-label" style="${cb.length ? 'margin-top:20px' : ''}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        Disciplinas de SI
      </div>`;
    html += esp.sort(sortFn).map(c => buildCourseCard(c, 'si')).join('');
  }

  grid.innerHTML = html;

  // Stagger animation
  grid.querySelectorAll('.course-card').forEach((card, i) => {
    card.classList.add('anim-fade-up');
    card.style.animationDelay = `${i * 0.04}s`;
  });
}

function buildCourseCard(c, tipo) {
  const colorIndex = hashStringToColor(c.code || c.course);
  const dayAbbr = {'Segunda':'Seg','Terça':'Ter','Quarta':'Qua','Quinta':'Qui','Sexta':'Sex'}[c.day] || c.day;

  // Extra time slots
  const extraHtml = (c.extra || []).filter(e => e && !e.includes('?')).map(e =>
    `<div class="course-meta-item" style="opacity:.65">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${e}
    </div>`
  ).join('');

  // Jupiter link (only for SI-specific)
  const jupLink = tipo === 'si' && c.code ?
    `<a class="course-link-hint" href="https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=${c.code}" target="_blank" rel="noopener">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      JupiterWeb
    </a>` : '';

  return `<div class="course-card anim-fade-up">
    <div class="course-color-bar" style="background:${colorIndex}"></div>
    <div class="course-card-body">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">
          <span class="course-code">${c.code || ''}</span>
          ${tipo === 'cb' ? '<span class="course-cb-badge">Ciclo Básico</span>' : ''}
        </div>
        <div class="course-name">${c.course}</div>
        <div class="course-meta" style="margin-top:6px;flex-wrap:wrap;gap:8px">
          ${c.day && c.day !== '?' ? `<div class="course-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${c.day}
          </div>` : ''}
          ${c.time ? `<div class="course-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${c.time}
          </div>` : ''}
          ${extraHtml}
          ${c.professor && c.professor !== '—' ? `<div class="course-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${c.professor}
          </div>` : ''}
          ${c.room && c.room !== '—' ? `<div class="course-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${c.room}
          </div>` : ''}
          ${(c.extra_rooms||[]).map(er => `<div class="course-meta-item" style="opacity:.6">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${er}
          </div>`).join('')}
        </div>
      </div>
      ${jupLink}
    </div>
  </div>`;
}
