// ===== CALENDAR MODULE =====

let calEvents = [];
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelectedDate = null;

// Active filters
let calActiveTypes = new Set(['prova', 'entrega', 'evento', 'apresentacao', 'deadline']);
let calActiveTurmas = new Set(); // empty = show all
let calAvailableTurmas = [];

const TYPE_LABELS = {
  prova:        'Prova',
  entrega:      'Entrega',
  evento:       'Evento',
  apresentacao: 'Apresentação',
  deadline:     'Deadline',
};

const TYPE_DOT_COLORS = {
  prova:        'var(--danger)',
  entrega:      'var(--warning)',
  evento:       'var(--success)',
  apresentacao: 'var(--info)',
  deadline:     '#fb923c',
};

async function initCalendar() {
  if (calEvents.length === 0) {
    const data = await fetchJSON('./data/events.json');
    calEvents = data || [];

    // Collect unique turmas referenced in events
    const turmaSet = new Set();
    calEvents.forEach(ev => {
      if (Array.isArray(ev.turmas)) ev.turmas.forEach(t => turmaSet.add(t));
    });
    calAvailableTurmas = [...turmaSet].sort();
  }

  renderCalendarFilters();
  renderCalendar();
  renderCalendarSidebar(null);
}

function getFilteredEvents(dateKey) {
  return calEvents.filter(ev => {
    if (ev.date !== dateKey) return false;
    if (!calActiveTypes.has(ev.type || 'default')) return false;
    if (calActiveTurmas.size > 0 && Array.isArray(ev.turmas) && ev.turmas.length > 0) {
      if (!ev.turmas.some(t => calActiveTurmas.has(t))) return false;
    }
    return true;
  });
}

function buildFilteredEventMap() {
  const map = {};
  calEvents.forEach(ev => {
    if (!calActiveTypes.has(ev.type || 'default')) return;
    if (calActiveTurmas.size > 0 && Array.isArray(ev.turmas) && ev.turmas.length > 0) {
      if (!ev.turmas.some(t => calActiveTurmas.has(t))) return;
    }
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  });
  return map;
}

function renderCalendar() {
  const grid = el('#cal-grid');
  const monthLabel = el('#cal-month-year');
  if (!grid || !monthLabel) return;

  monthLabel.textContent = `${MONTH_NAMES_PT[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const eventMap = buildFilteredEventMap();

  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';

    const isToday = dateKey === todayKey;
    const events = eventMap[dateKey] || [];

    if (isToday) dayEl.classList.add('today');
    if (events.length) dayEl.classList.add('has-events');
    if (dateKey === calSelectedDate) dayEl.classList.add('selected-day');

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = d;
    dayEl.appendChild(numEl);

    if (events.length) {
      const dotsEl = document.createElement('div');
      dotsEl.className = 'cal-event-dots';
      events.slice(0, 3).forEach(ev => {
        const dot = document.createElement('div');
        dot.className = `cal-event-dot tipo-${ev.type || 'default'}`;
        dotsEl.appendChild(dot);
      });
      dayEl.appendChild(dotsEl);
    }

    dayEl.addEventListener('click', () => {
      calSelectedDate = dateKey;
      els('.cal-day.selected-day').forEach(d => d.classList.remove('selected-day'));
      dayEl.classList.add('selected-day');
      renderCalendarSidebar(dateKey, getFilteredEvents(dateKey));
    });

    grid.appendChild(dayEl);
  }

  if (calSelectedDate) {
    renderCalendarSidebar(calSelectedDate, getFilteredEvents(calSelectedDate));
  }
}

function renderCalendarSidebar(dateKey, events = []) {
  const panel = el('#cal-selected-panel');
  if (!panel) return;

  if (!dateKey) {
    panel.innerHTML = `
      <div class="cal-selected-date">Selecione um dia</div>
      <div class="no-events-msg">Clique em um dia para ver eventos</div>
    `;
    return;
  }

  const [y, m, d] = dateKey.split('-').map(Number);
  const dateLabel = `${String(d).padStart(2,'0')} de ${MONTH_NAMES_PT[m-1]}`;

  panel.innerHTML = `
    <div class="cal-selected-date">${dateLabel}</div>
    <div class="cal-day-events" id="cal-day-events-list"></div>
  `;

  const list = el('#cal-day-events-list');

  if (!events.length) {
    list.innerHTML = `<div class="no-events-msg">Nenhum evento neste dia</div>`;
    return;
  }

  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = `cal-day-event-item tipo-${ev.type || 'default'} anim-fade-up`;

    let turmasBadgesHtml = '';
    if (Array.isArray(ev.turmas) && ev.turmas.length > 0) {
      const badges = ev.turmas.map(t => `<span class="cal-turma-badge">${t}</span>`).join('');
      turmasBadgesHtml = `<div class="cal-day-event-turmas">${badges}</div>`;
    }

    item.innerHTML = `
      <div class="cal-day-event-title">${ev.title}</div>
      ${ev.description && ev.description !== 'NA' ? `<div class="cal-day-event-desc">${ev.description}</div>` : ''}
      ${turmasBadgesHtml}
    `;
    list.appendChild(item);
  });
}

function renderCalendarFilters() {
  const panel = el('#cal-filters-panel');
  if (!panel) return;

  const typeButtons = Object.entries(TYPE_LABELS).map(([type, label]) => {
    const isActive = calActiveTypes.has(type);
    const color = TYPE_DOT_COLORS[type] || 'var(--text-muted)';
    return `<button class="cal-filter-btn ${isActive ? 'active' : ''}" data-type="${type}" onclick="calToggleTypeFilter('${type}')"><span class="filter-dot" style="background:${color}"></span>${label}</button>`;
  }).join('');

  let turmaSection = '';
  if (calAvailableTurmas.length > 0) {
    const turmaButtons = calAvailableTurmas.map(t => {
      const isActive = calActiveTurmas.has(t);
      return `<button class="cal-filter-btn ${isActive ? 'active' : ''}" data-turma="${t}" onclick="calToggleTurmaFilter('${t}')">${t}</button>`;
    }).join('');
    turmaSection = `
      <div class="cal-filters-title" style="margin-top:8px;">Turmas</div>
      <div class="cal-filter-group">${turmaButtons}</div>
    `;
  }

  panel.innerHTML = `
    <div class="cal-legend-title">Filtros</div>
    <div class="cal-filters-title">Tipo</div>
    <div class="cal-filter-group">${typeButtons}</div>
    ${turmaSection}
  `;
}

function calToggleTypeFilter(type) {
  if (calActiveTypes.has(type)) {
    if (calActiveTypes.size > 1) calActiveTypes.delete(type);
  } else {
    calActiveTypes.add(type);
  }
  renderCalendarFilters();
  renderCalendar();
}

function calToggleTurmaFilter(turma) {
  if (calActiveTurmas.has(turma)) {
    calActiveTurmas.delete(turma);
  } else {
    calActiveTurmas.add(turma);
  }
  renderCalendarFilters();
  renderCalendar();
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}
