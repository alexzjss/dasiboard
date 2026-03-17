// ===== ENTIDADES =====

let entidadesData = [];
let entidadeAtiva = null;

async function initEntidades() {
  if (!entidadesData.length) {
    const data = await fetchJSON('./data/entidades.json');
    entidadesData = data ? (data.entidades || []) : [];
    window._entidadesData = entidadesData;
  }
  await mergeCalendarEventsIntoEntidades();
  renderEntidadesHub();
}

// ===== HUB =====
function renderEntidadesHub() {
  const hub = document.getElementById('entidades-hub');
  const detail = document.getElementById('entidade-detalhe');
  if (!hub) return;

  hub.style.display = 'block';
  if (detail) detail.style.display = 'none';
  entidadeAtiva = null;
  syncBackBtn();

  var cards = '';
  for (var i = 0; i < entidadesData.length; i++) {
    var e = entidadesData[i];
    cards += buildHubCard(e, i);
  }

  hub.innerHTML =
    '<p class="entidades-intro anim-fade-up stagger-1">Entidades estudantis, ligas, grupos e programas do curso de SI — USP/EACH.</p>' +
    '<div class="entidades-grid anim-fade-up stagger-2">' + cards + '</div>';
}

function buildHubCard(e, i) {
  var delay = (i * 0.05) + 's';
  var evCount = e.eventos ? e.eventos.length : 0;
  var evLabel = evCount === 1 ? '1 evento' : evCount + ' eventos';
  return '<button class="entidade-card anim-fade-up"' +
    ' style="animation-delay:' + delay + ';--e-cor:' + e.cor + ';--e-cor2:' + e.corSecundaria + '"' +
    ' onclick="openEntidade(\'' + e.id + '\')">' +
    '<div class="entidade-card-shine"></div>' +
    '<div class="entidade-card-glow"></div>' +
    '<div class="entidade-card-top">' +
      '<span class="entidade-emoji">' + e.emoji + '</span>' +
      '<span class="entidade-tipo-badge" style="background:' + hexAlpha(e.cor, 0.13) + ';color:' + e.cor + ';border-color:' + hexAlpha(e.cor, 0.3) + '">' + e.tipo + '</span>' +
    '</div>' +
    '<div class="entidade-card-nome">' + esc(e.nome) + '</div>' +
    '<div class="entidade-card-desc">' + esc(e.descricao.slice(0, 115)) + (e.descricao.length > 115 ? '…' : '') + '</div>' +
    '<div class="entidade-card-footer">' +
      '<span class="entidade-eventos-count">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
        evLabel +
      '</span>' +
      '<span class="entidade-card-arrow" style="color:' + e.cor + '">→</span>' +
    '</div>' +
  '</button>';
}

// ===== DETALHE =====
function openEntidade(id) {
  var e = null;
  for (var i = 0; i < entidadesData.length; i++) {
    if (entidadesData[i].id === id) { e = entidadesData[i]; break; }
  }
  if (!e) return;

  entidadeAtiva = e;
  syncBackBtn();

  // Track visit for pac-man easter egg
  if (typeof trackEntityVisit === 'function') trackEntityVisit(id);

  var hub = document.getElementById('entidades-hub');
  var detail = document.getElementById('entidade-detalhe');
  if (!detail) return;

  if (hub) hub.style.display = 'none';
  detail.style.display = 'block';

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var proximos = [];
  var passados = [];
  var eventos = e.eventos || [];
  for (var j = 0; j < eventos.length; j++) {
    var ev = eventos[j];
    if (parseDate(ev.data) >= today) proximos.push(ev);
    else passados.push(ev);
  }
  proximos.sort(function(a, b) { return parseDate(a.data) - parseDate(b.data); });
  passados.sort(function(a, b) { return parseDate(b.data) - parseDate(a.data); });

  detail.innerHTML =
    buildHero(e) +
    buildDestaques(e) +
    buildBodyGrid(e, proximos, passados, today);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildHero(e) {
  var links = '';
  for (var i = 0; i < e.links.length; i++) {
    var l = e.links[i];
    links += '<a href="' + esc(l.url) + '" target="_blank" rel="noopener" class="entidade-link-btn" style="--e-cor:' + e.cor + '">' +
      linkIcon(l.icone) + ' ' + esc(l.label) +
    '</a>';
  }
  if (e.contato) {
    links += '<a href="mailto:' + esc(e.contato) + '" class="entidade-link-btn" style="--e-cor:' + e.cor + '">' +
      linkIcon('mail') + ' ' + esc(e.contato) +
    '</a>';
  }
  return '<div class="entidade-hero anim-fade-up" style="--e-cor:' + e.cor + ';border-color:' + hexAlpha(e.cor, 0.35) + ';box-shadow:inset 0 1px 0 var(--glass-specular),0 0 0 1px ' + hexAlpha(e.cor, 0.18) + ',0 16px 48px rgba(0,0,0,.25)">' +
    '<div class="entidade-hero-glow" style="background:radial-gradient(ellipse,' + hexAlpha(e.cor, 0.22) + ' 0%,transparent 70%)"></div>' +
    '<div class="entidade-hero-shine"></div>' +
    '<div class="entidade-hero-content">' +
      '<div class="entidade-hero-top">' +
        '<span class="entidade-hero-emoji" style="filter:drop-shadow(0 0 12px ' + hexAlpha(e.cor, 0.5) + ')">' + e.emoji + '</span>' +
        '<span class="entidade-tipo-badge-lg" style="background:' + hexAlpha(e.cor, 0.13) + ';color:' + e.cor + ';border-color:' + hexAlpha(e.cor, 0.3) + '">' + esc(e.tipo) + '</span>' +
      '</div>' +
      '<h2 class="entidade-hero-nome">' + esc(e.nome) + '</h2>' +
      '<p class="entidade-hero-nomeCompleto">' + esc(e.nomeCompleto) + '</p>' +
      '<p class="entidade-hero-desc">' + esc(e.descricao) + '</p>' +
      '<div class="entidade-hero-actions">' + links + '</div>' +
    '</div>' +
  '</div>';
}

function buildDestaques(e) {
  var cards = '';
  for (var i = 0; i < e.destaques.length; i++) {
    var d = e.destaques[i];
    cards += '<div class="entidade-destaque-card" style="--e-cor:' + e.cor + ';border-color:' + hexAlpha(e.cor, 0.25) + '">' +
      '<div class="entidade-destaque-card-shine"></div>' +
      '<div class="entidade-destaque-icon">' + d.icone + '</div>' +
      '<div class="entidade-destaque-val" style="background:linear-gradient(135deg,' + e.cor + ',' + e.corSecundaria + ');-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">' + esc(d.valor) + '</div>' +
      '<div class="entidade-destaque-lbl">' + esc(d.label) + '</div>' +
    '</div>';
  }
  return '<div class="entidade-destaques anim-fade-up stagger-1">' + cards + '</div>';
}

function buildBodyGrid(e, proximos, passados, today) {
  return '<div class="entidade-body-grid anim-fade-up stagger-2">' +
    buildEventosCol(e, proximos, passados, today) +
    buildNewsletterCol(e) +
  '</div>';
}

function buildEventosCol(e, proximos, passados, today) {
  var evHtml = '';
  if (proximos.length === 0) {
    evHtml = '<div class="no-events-msg">Nenhum evento próximo.</div>';
  } else {
    evHtml = '<div class="event-list">';
    for (var i = 0; i < proximos.length; i++) {
      var ev = proximos[i];
      var d = parseDate(ev.data);
      var diffDays = Math.ceil((d - today) / 86400000);
      var urgencia = diffDays === 0 ? 'hoje' : diffDays <= 3 ? 'em breve' : '';
      var desc = (ev.descricao && ev.descricao !== 'NA') ? esc(ev.descricao) : '';
      evHtml +=
        '<div class="event-item entidade-event-item anim-fade-up" style="animation-delay:' + (i*0.05) + 's">' +
          '<div class="event-date-badge" style="background:' + hexAlpha(e.cor, 0.12) + ';border-color:' + hexAlpha(e.cor, 0.3) + '">' +
            '<span class="day" style="color:' + e.cor + '">' + String(d.getDate()).padStart(2,'0') + '</span>' +
            '<span class="month">' + MONTH_NAMES_SHORT[d.getMonth()] + '</span>' +
          '</div>' +
          '<div class="event-info">' +
            '<div class="event-title">' + esc(ev.titulo) +
              (urgencia ? ' <span class="entidade-urgencia" style="background:' + hexAlpha(e.cor, 0.18) + ';color:' + e.cor + '">' + urgencia + '</span>' : '') +
            '</div>' +
            (desc ? '<div class="event-desc">' + desc + '</div>' : '') +
          '</div>' +
          eventBadge(ev.tipo) +
        '</div>';
    }
    evHtml += '</div>';
  }

  var passadosHtml = '';
  if (passados.length > 0) {
    var pLabel = passados.length + ' evento' + (passados.length > 1 ? 's' : '') + ' passado' + (passados.length > 1 ? 's' : '');
    var pItems = '';
    for (var j = 0; j < passados.length; j++) {
      var pev = passados[j];
      var pd = parseDate(pev.data);
      var pdesc = (pev.descricao && pev.descricao !== 'NA') ? esc(pev.descricao) : '';
      pItems +=
        '<div class="event-item" style="filter:grayscale(.3)">' +
          '<div class="event-date-badge"><span class="day">' + String(pd.getDate()).padStart(2,'0') + '</span><span class="month">' + MONTH_NAMES_SHORT[pd.getMonth()] + '</span></div>' +
          '<div class="event-info"><div class="event-title">' + esc(pev.titulo) + '</div>' + (pdesc ? '<div class="event-desc">' + pdesc + '</div>' : '') + '</div>' +
          eventBadge(pev.tipo) +
        '</div>';
    }
    passadosHtml = '<details class="entidade-passados" style="margin-top:16px">' +
      '<summary style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);cursor:pointer;letter-spacing:.5px;user-select:none;list-style:none">' + pLabel + '</summary>' +
      '<div class="event-list" style="margin-top:10px;opacity:.65">' + pItems + '</div>' +
    '</details>';
  }

  return '<div class="entidade-col">' +
    '<div class="section-title">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + e.cor + '" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
      ' Próximos eventos' +
    '</div>' +
    evHtml + passadosHtml +
  '</div>';
}

function buildNewsletterCol(e) {
  var nl = e.newsletter || [];
  var nlHtml = '';

  if (nl.length === 0) {
    nlHtml = '<div class="no-events-msg">Nenhuma newsletter publicada.</div>';
  } else {
    // Featured
    nlHtml +=
      '<div class="entidade-nl-featured" style="--e-cor:' + e.cor + ';border-color:' + hexAlpha(e.cor, 0.3) + '" onclick="abrirEntidadeNL(\'' + e.id + '\', 0)">' +
        '<div class="entidade-nl-featured-shine"></div>' +
        '<div class="entidade-nl-featured-glow" style="background:radial-gradient(ellipse,' + hexAlpha(e.cor, 0.15) + ' 0%,transparent 70%)"></div>' +
        '<div style="position:relative;z-index:3">' +
          '<div class="newsletter-date" style="color:' + e.cor + '">' + formatDate(nl[0].data) + '</div>' +
          '<div class="newsletter-title">' + esc(nl[0].titulo) + '</div>' +
          '<div class="newsletter-summary">' + esc(nl[0].resumo) + '</div>' +
          '<span class="entidade-nl-read-btn" style="color:' + e.cor + '">Ler completo →</span>' +
        '</div>' +
      '</div>';

    // Archive
    if (nl.length > 1) {
      nlHtml += '<div class="section-title" style="margin-top:20px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> Edições anteriores</div>' +
        '<div class="newsletter-list">';
      for (var i = 1; i < nl.length; i++) {
        nlHtml +=
          '<div class="newsletter-item" onclick="abrirEntidadeNL(\'' + e.id + '\', ' + i + ')">' +
            '<div class="newsletter-item-date">' + formatDateShort(nl[i].data) + '</div>' +
            '<div class="newsletter-item-title">' + esc(nl[i].titulo) + '</div>' +
            '<svg class="newsletter-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</div>';
      }
      nlHtml += '</div>';
    }
  }

  return '<div class="entidade-col">' +
    '<div class="section-title">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + e.cor + '" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
      ' Newsletter' +
    '</div>' +
    nlHtml +
  '</div>';
}

// ===== NEWSLETTER MODAL =====
function abrirEntidadeNL(entidadeId, nlIndex) {
  var e = null;
  for (var i = 0; i < entidadesData.length; i++) {
    if (entidadesData[i].id === entidadeId) { e = entidadesData[i]; break; }
  }
  if (!e || !e.newsletter[nlIndex]) return;
  var nl = e.newsletter[nlIndex];

  var modal = document.getElementById('newsletter-modal');
  var dateEl = document.getElementById('modal-date');
  var titleEl = document.getElementById('modal-title');
  var contentEl = document.getElementById('modal-content');

  if (dateEl) dateEl.textContent = formatDate(nl.data) + ' · ' + e.nome;
  if (titleEl) titleEl.textContent = nl.titulo;
  if (contentEl) contentEl.textContent = nl.conteudo;
  if (modal) modal.classList.remove('hidden');
}

// ===== BACK BUTTON =====
function syncBackBtn() {
  var btn = document.getElementById('entidades-back-btn');
  if (!btn) return;
  btn.style.display = entidadeAtiva ? 'flex' : 'none';
}

// ===== HELPERS =====
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Convert hex color + alpha to rgba string — avoids color-mix()
function hexAlpha(hex, alpha) {
  var h = hex.replace('#','');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var r = parseInt(h.slice(0,2), 16);
  var g = parseInt(h.slice(2,4), 16);
  var b = parseInt(h.slice(4,6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function eventBadge(tipo) {
  var map = {
    prova:'<span class="badge badge-red">Prova</span>',
    entrega:'<span class="badge badge-yellow">Entrega</span>',
    evento:'<span class="badge badge-green">Evento</span>',
    apresentacao:'<span class="badge badge-blue">Apresentação</span>',
    deadline:'<span class="badge badge-yellow">Deadline</span>',
  };
  return map[tipo] || '<span class="badge badge-purple">' + esc(tipo || 'Evento') + '</span>';
}

function linkIcon(tipo) {
  var icons = {
    instagram: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    linkedin:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    github:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    globe:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    mail:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  };
  return icons[tipo] || icons.globe;
}

// ===== MERGE CALENDAR EVENTS INTO ENTIDADE =====
// Called after both data sources load to inject calendar events into entity data
async function mergeCalendarEventsIntoEntidades() {
  const evData = await ghLoadAllEvents();
  if (!evData?.length || !entidadesData.length) return;
  evData.forEach(ev => {
    if (!ev.entidade) return;
    const ent = entidadesData.find(e => e.id === ev.entidade);
    if (!ent) return;
    // Avoid duplicates (events already defined in entidades.json)
    const exists = ent.eventos.some(e => e.titulo === ev.title && e.data === ev.date);
    if (!exists) {
      ent.eventos.push({ data: ev.date, titulo: ev.title, descricao: ev.description || '', tipo: ev.type });
    }
  });
}
