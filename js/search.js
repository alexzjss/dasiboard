// ===== GLOBAL SEARCH =====

let searchEventsCache = [];
let searchDocentesCache = [];
let searchEstudosCache = [];

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  setTimeout(() => {
    const inp = document.getElementById('global-search-input');
    if (inp) { inp.value = ''; inp.focus(); }
    document.getElementById('search-results').innerHTML = '<div class="search-hint">Digite para buscar em todo o dashboard</div>';
  }, 50);
}

function closeSearch() {
  document.getElementById('search-overlay')?.classList.add('hidden');
}

function closeSearchIfOutside(event) {
  if (event.target === document.getElementById('search-overlay')) closeSearch();
}

async function ensureSearchCaches() {
  if (searchEventsCache.length === 0) {
    const data = await fetchJSON('./data/events.json');
    searchEventsCache = data || [];
  }
  if (searchEstudosCache.length === 0) {
    const data = await fetchJSON('./data/estudos/estudos.json');
    searchEstudosCache = data || [];
  }
  // Docentes are loaded separately from the docentes module
  if (window._docentesData) searchDocentesCache = window._docentesData;
}

async function runGlobalSearch(query) {
  const q = (query || '').trim().toLowerCase();
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;

  if (q.length < 2) {
    resultsEl.innerHTML = '<div class="search-hint">Digite ao menos 2 caracteres</div>';
    return;
  }

  await ensureSearchCaches();

  const results = [];

  // Search events
  searchEventsCache.forEach(ev => {
    if (
      (ev.title || '').toLowerCase().includes(q) ||
      (ev.description || '').toLowerCase().includes(q)
    ) {
      results.push({
        type: 'event',
        icon: '📅',
        title: ev.title,
        sub: formatDateShort(ev.date) + ' · ' + typeToLabelText(ev.type),
        action: () => { navigateTo('calendar'); closeSearch(); },
        badge: typeToLabelText(ev.type),
        badgeColor: typeToBadgeColor(ev.type),
      });
    }
  });

  // Search estudos
  searchEstudosCache.forEach(e => {
    if (
      (e.titulo || '').toLowerCase().includes(q) ||
      (e.descricao || '').toLowerCase().includes(q) ||
      (e.area || '').toLowerCase().includes(q) ||
      (e.disciplina || '').toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'estudo',
        icon: '📚',
        title: e.titulo,
        sub: e.area + ' · ' + e.tipo,
        action: () => { navigateTo('estudos'); closeSearch(); },
        badge: e.area,
        badgeColor: '#60a5fa',
      });
    }
  });

  // Search docentes
  searchDocentesCache.forEach(d => {
    if (
      (d.nome || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.areas || '').toLowerCase().includes(q)
    ) {
      results.push({
        type: 'docente',
        icon: '👤',
        title: d.nome,
        sub: d.areas || d.email || '',
        action: () => { navigateTo('docentes'); closeSearch(); },
        badge: 'Docente',
        badgeColor: '#a78bfa',
      });
    }
  });

  // Search entidades
  if (window._entidadesData) {
    window._entidadesData.forEach(e => {
      if (
        (e.nome || '').toLowerCase().includes(q) ||
        (e.nomeCompleto || '').toLowerCase().includes(q) ||
        (e.tipo || '').toLowerCase().includes(q) ||
        (e.descricao || '').toLowerCase().includes(q)
      ) {
        results.push({
          type: 'entidade',
          icon: e.emoji || '🏛️',
          title: e.nome,
          sub: e.tipo + ' · ' + e.nomeCompleto.slice(0, 50),
          action: () => { navigateTo('entidades'); setTimeout(() => openEntidade(e.id), 100); closeSearch(); },
          badge: e.tipo,
          badgeColor: e.cor,
        });
      }
    });
  }

  // Search pages
  const pages = [
    { name: 'Home', page: 'home', icon: '🏠', sub: 'Página principal' },
    { name: 'Calendário', page: 'calendar', icon: '📅', sub: 'Eventos e datas' },
    { name: 'Horários', page: 'schedule', icon: '🗂', sub: 'Grade horária' },
    { name: 'Kanban', page: 'kanban', icon: '📋', sub: 'Quadro de tarefas' },
    { name: 'Notas & GPA', page: 'notas-gpa', icon: '📈', sub: 'Média acadêmica' },
    { name: 'Newsletter', page: 'newsletter', icon: '✉️', sub: 'Notícias do curso' },
    { name: 'Docentes', page: 'docentes', icon: '👥', sub: 'Professores' },
    { name: 'Estudos', page: 'estudos', icon: '📖', sub: 'Materiais' },
    { name: 'Entidades', page: 'entidades', icon: '🏛️', sub: 'DASI, Síntese Jr., GRACE...' },
    { name: 'Ferramentas', page: 'ferramentas', icon: '🔧', sub: 'Pomodoro, notas, etc.' },
  ];
  pages.forEach(p => {
    if (p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) {
      results.push({
        type: 'page',
        icon: p.icon,
        title: p.name,
        sub: p.sub,
        action: () => { navigateTo(p.page); closeSearch(); },
        badge: 'Página',
        badgeColor: 'var(--text-dim)',
      });
    }
  });

  if (results.length === 0) {
    resultsEl.innerHTML = `<div class="search-no-results">Nenhum resultado para "<strong>${escapeHtmlSearch(q)}</strong>"</div>`;
    return;
  }

  // Group by type
  const grouped = {};
  const typeOrder = ['page', 'event', 'estudo', 'docente', 'entidade'];
  const typeLabels = { page: 'Páginas', event: 'Eventos', estudo: 'Materiais de estudo', docente: 'Docentes', entidade: 'Entidades' };
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  let html = '';
  typeOrder.forEach(type => {
    if (!grouped[type] || grouped[type].length === 0) return;
    html += `<div class="search-result-group">
      <div class="search-result-group-label">${typeLabels[type] || type}</div>
      ${grouped[type].slice(0, 5).map((r, i) => `
        <div class="search-result-item" onclick="searchResultClick(${results.indexOf(r)})" data-result-idx="${results.indexOf(r)}">
          <div class="search-result-icon">${r.icon}</div>
          <div class="search-result-text">
            <div class="search-result-title">${highlightMatch(r.title, q)}</div>
            <div class="search-result-sub">${escapeHtmlSearch(r.sub)}</div>
          </div>
          ${r.badge ? `<span class="search-result-badge" style="background:${r.badgeColor}22;color:${r.badgeColor};border:1px solid ${r.badgeColor}44">${r.badge}</span>` : ''}
        </div>
      `).join('')}
    </div>`;
  });

  resultsEl.innerHTML = html;

  // Store actions for click handlers
  window._searchResults = results;
}

function searchResultClick(idx) {
  if (window._searchResults && window._searchResults[idx]) {
    window._searchResults[idx].action();
  }
}

function highlightMatch(text, query) {
  if (!text || !query) return escapeHtmlSearch(text);
  const escaped = escapeHtmlSearch(text);
  const escapedQ = escapeHtmlSearch(query);
  const regex = new RegExp(`(${escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark style="background:var(--glow);color:var(--text);border-radius:2px;padding:0 2px">$1</mark>');
}

function escapeHtmlSearch(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function typeToLabelText(type) {
  const map = { prova: 'Prova', entrega: 'Entrega', evento: 'Evento', apresentacao: 'Apresentação', deadline: 'Deadline' };
  return map[type] || 'Evento';
}

function typeToBadgeColor(type) {
  const map = { prova: '#f87171', entrega: '#fbbf24', evento: '#34d399', apresentacao: '#60a5fa', deadline: '#fb923c' };
  return map[type] || '#a78bfa';
}

// Keyboard shortcut: Ctrl+K or Cmd+K to open search
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') closeSearch();
});
