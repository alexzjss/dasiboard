// ===== SEARCH MODULE — DaSIboard =====

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('global-search-input');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  if (input) { input.value = ''; input.focus(); }
  renderSearchHint();
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function closeSearchIfOutside(event) {
  const box = document.querySelector('.search-box');
  if (box && !box.contains(event.target)) closeSearch();
}

function renderSearchHint() {
  const results = document.getElementById('search-results');
  if (results) results.innerHTML = '<div class="search-hint">Digite para buscar em todo o dashboard</div>';
}

function runGlobalSearch(query) {
  const results = document.getElementById('search-results');
  if (!results) return;

  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) { renderSearchHint(); return; }

  const hits = [];

  // ── Eventos ──────────────────────────────────────────────────────────────
  if (typeof eventsData !== 'undefined' && Array.isArray(eventsData)) {
    eventsData.forEach(ev => {
      if ((ev.title || '').toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q)) {
        hits.push({
          icon: '📅',
          title: ev.title,
          sub: formatDate(ev.date),
          action: `navigateTo('calendar');setTimeout(()=>{if(typeof renderCalendar==='function'){calSelectedDate='${ev.date}';renderCalendar();renderCalendarSidebar('${ev.date}',getFilteredEvents('${ev.date}'));}},150)`
        });
      }
    });
  }

  // ── Docentes ─────────────────────────────────────────────────────────────
  if (typeof DOCENTES_DATA !== 'undefined' && Array.isArray(DOCENTES_DATA)) {
    DOCENTES_DATA.forEach(d => {
      if ((d.name || '').toLowerCase().includes(q) || (d.areas || '').toLowerCase().includes(q)) {
        hits.push({
          icon: '👩‍🏫',
          title: d.name,
          sub: d.areas ? d.areas.substring(0, 60) + '…' : 'Docente SI-USP',
          action: `navigateTo('docentes');setTimeout(()=>{const inp=document.getElementById('docentes-search');if(inp){inp.value='${escapeHTML(d.name)}';filterDocentes('${escapeHTML(d.name)}');}},150)`
        });
      }
    });
  }

  // ── Páginas / seções ─────────────────────────────────────────────────────
  const pages = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'calendar', label: 'Calendário', icon: '📅' },
    { key: 'schedule', label: 'Horários', icon: '🗓️' },
    { key: 'kanban', label: 'Kanban', icon: '📋' },
    { key: 'newsletter', label: 'Newsletter', icon: '📰' },
    { key: 'docentes', label: 'Docentes', icon: '👩‍🏫' },
    { key: 'estudos', label: 'Estudos', icon: '📚' },
    { key: 'entidades', label: 'Entidades', icon: '🏛️' },
    { key: 'notas-gpa', label: 'Notas & GPA', icon: '📊' },
    { key: 'faltas', label: 'Faltas', icon: '📆' },
    { key: 'ferramentas', label: 'Ferramentas', icon: '🛠️' },
    { key: 'leetcode', label: 'Desafios', icon: '💻' }
  ];
  pages.forEach(p => {
    if (p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)) {
      hits.push({
        icon: p.icon,
        title: p.label,
        sub: 'Ir para a seção',
        action: `navigateTo('${p.key}')`
      });
    }
  });

  if (hits.length === 0) {
    results.innerHTML = `<div class="search-hint">Nenhum resultado para "<strong>${escapeHTML(query)}</strong>"</div>`;
    return;
  }

  const limited = hits.slice(0, 8);
  results.innerHTML = limited.map(h => `
    <button class="search-result-item" onclick="closeSearch();${h.action}">
      <span class="search-result-icon">${h.icon}</span>
      <span class="search-result-text">
        <span class="search-result-title">${escapeHTML(h.title)}</span>
        <span class="search-result-sub">${escapeHTML(h.sub)}</span>
      </span>
    </button>`).join('');
}

// Fechar com Escape (complementa o handler global do app.js)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    openSearch();
  }
});
