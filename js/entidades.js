// ===== ENTIDADES =====

let entidadesData = [];
let entidadeAtiva = null;
let entidadeNewsletterAberta = null;

async function initEntidades() {
  if (!entidadesData.length) {
    const data = await fetchJSON('./data/entidades.json');
    entidadesData = data?.entidades || [];
  window._entidadesData = entidadesData;
  }
  renderEntidadesHub();
}

// ===== HUB — grid de todas as entidades =====
function renderEntidadesHub() {
  const container = document.getElementById('entidades-hub');
  if (!container) return;

  // Show hub, hide detail
  document.getElementById('entidades-hub').style.display = '';
  const detail = document.getElementById('entidade-detalhe');
  if (detail) detail.style.display = 'none';

  entidadeAtiva = null;
  updateEntidadesBackBtn();

  container.innerHTML = `
    <div class="entidades-intro anim-fade-up stagger-1">
      <p>Entidades estudantis, ligas, grupos e programas do curso de SI — USP/EACH.</p>
    </div>
    <div class="entidades-grid anim-fade-up stagger-2">
      ${entidadesData.map((e, i) => `
        <button class="entidade-card anim-fade-up" style="animation-delay:${i*0.05}s;--e-cor:${e.cor};--e-cor2:${e.corSecundaria}" onclick="openEntidade('${e.id}')">
          <div class="entidade-card-shine"></div>
          <div class="entidade-card-glow"></div>
          <div class="entidade-card-top">
            <span class="entidade-emoji">${e.emoji}</span>
            <span class="entidade-tipo-badge" style="background:${e.cor}22;color:${e.cor};border-color:${e.cor}44">${e.tipo}</span>
          </div>
          <div class="entidade-card-nome">${e.nome}</div>
          <div class="entidade-card-desc">${e.descricao.slice(0, 110)}${e.descricao.length > 110 ? '…' : ''}</div>
          <div class="entidade-card-footer">
            <span class="entidade-eventos-count">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${e.eventos.length} evento${e.eventos.length !== 1 ? 's' : ''}
            </span>
            <span class="entidade-card-arrow">→</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

// ===== DETALHE de uma entidade =====
function openEntidade(id) {
  const entidade = entidadesData.find(e => e.id === id);
  if (!entidade) return;

  entidadeAtiva = entidade;
  updateEntidadesBackBtn();

  document.getElementById('entidades-hub').style.display = 'none';
  const detail = document.getElementById('entidade-detalhe');
  if (!detail) return;
  detail.style.display = '';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const proximosEventos = entidade.eventos
    .filter(ev => parseDate(ev.data) >= today)
    .sort((a, b) => parseDate(a.data) - parseDate(b.data));
  const passados = entidade.eventos
    .filter(ev => parseDate(ev.data) < today)
    .sort((a, b) => parseDate(b.data) - parseDate(a.data));

  detail.innerHTML = `
    <!-- Hero da entidade -->
    <div class="entidade-hero anim-fade-up" style="--e-cor:${entidade.cor};--e-cor2:${entidade.corSecundaria}">
      <div class="entidade-hero-glow"></div>
      <div class="entidade-hero-shine"></div>
      <div class="entidade-hero-content">
        <div class="entidade-hero-top">
          <span class="entidade-hero-emoji">${entidade.emoji}</span>
          <span class="entidade-tipo-badge-lg" style="background:${entidade.cor}22;color:${entidade.cor};border-color:${entidade.cor}44">${entidade.tipo}</span>
        </div>
        <h2 class="entidade-hero-nome">${entidade.nome}</h2>
        <p class="entidade-hero-nomeCompleto">${entidade.nomeCompleto}</p>
        <p class="entidade-hero-desc">${entidade.descricao}</p>
        <div class="entidade-hero-actions">
          ${entidade.links.map(l => `
            <a href="${l.url}" target="_blank" rel="noopener" class="entidade-link-btn" style="--e-cor:${entidade.cor}">
              ${linkIconSvg(l.icone)}
              ${l.label}
            </a>
          `).join('')}
          ${entidade.contato ? `
            <a href="mailto:${entidade.contato}" class="entidade-link-btn" style="--e-cor:${entidade.cor}">
              ${linkIconSvg('mail')}
              ${entidade.contato}
            </a>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Destaques numéricos -->
    <div class="entidade-destaques anim-fade-up stagger-1">
      ${entidade.destaques.map(d => `
        <div class="entidade-destaque-card" style="--e-cor:${entidade.cor}">
          <div class="entidade-destaque-card-shine"></div>
          <div class="entidade-destaque-icon">${d.icone}</div>
          <div class="entidade-destaque-val" style="background:linear-gradient(135deg,${entidade.cor},${entidade.corSecundaria});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${d.valor}</div>
          <div class="entidade-destaque-lbl">${d.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- Grid: eventos + newsletter -->
    <div class="entidade-body-grid anim-fade-up stagger-2">

      <!-- Coluna eventos -->
      <div class="entidade-col">
        <div class="section-title" style="--e-cor:${entidade.cor}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${entidade.cor}" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Próximos eventos
        </div>

        ${proximosEventos.length ? `
          <div class="event-list">
            ${proximosEventos.map((ev, i) => {
              const d = parseDate(ev.data);
              const diffDays = Math.ceil((d - today) / 86400000);
              const urgencia = diffDays === 0 ? 'hoje' : diffDays <= 3 ? 'em breve' : null;
              return `
                <div class="event-item entidade-event-item" style="--e-cor:${entidade.cor};animation-delay:${i*0.05}s">
                  <div class="event-date-badge entidade-date-badge" style="background:${entidade.cor}18;border-color:${entidade.cor}35">
                    <span class="day" style="color:${entidade.cor}">${String(d.getDate()).padStart(2,'0')}</span>
                    <span class="month">${MONTH_NAMES_SHORT[d.getMonth()]}</span>
                  </div>
                  <div class="event-info">
                    <div class="event-title">
                      ${ev.titulo}
                      ${urgencia ? `<span class="entidade-urgencia" style="background:${entidade.cor}22;color:${entidade.cor}">${urgencia}</span>` : ''}
                    </div>
                    <div class="event-desc">${ev.descricao && ev.descricao !== 'NA' ? ev.descricao : ''}</div>
                  </div>
                  ${entidadeEventBadge(ev.tipo)}
                </div>
              `;
            }).join('')}
          </div>
        ` : `<div class="no-events-msg">Nenhum evento próximo.</div>`}

        ${passados.length ? `
          <details class="entidade-passados" style="margin-top:16px">
            <summary style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);cursor:pointer;letter-spacing:.5px;user-select:none">
              ${passados.length} evento${passados.length > 1 ? 's' : ''} passado${passados.length > 1 ? 's' : ''}
            </summary>
            <div class="event-list" style="margin-top:10px;opacity:.65">
              ${passados.map(ev => {
                const d = parseDate(ev.data);
                return `
                  <div class="event-item" style="filter:grayscale(.3)">
                    <div class="event-date-badge">
                      <span class="day">${String(d.getDate()).padStart(2,'0')}</span>
                      <span class="month">${MONTH_NAMES_SHORT[d.getMonth()]}</span>
                    </div>
                    <div class="event-info">
                      <div class="event-title">${ev.titulo}</div>
                      <div class="event-desc">${ev.descricao && ev.descricao !== 'NA' ? ev.descricao : ''}</div>
                    </div>
                    ${entidadeEventBadge(ev.tipo)}
                  </div>
                `;
              }).join('')}
            </div>
          </details>
        ` : ''}
      </div>

      <!-- Coluna newsletter -->
      <div class="entidade-col">
        <div class="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${entidade.cor}" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Newsletter
        </div>

        ${entidade.newsletter.length ? `
          <!-- Featured -->
          <div class="entidade-nl-featured" style="--e-cor:${entidade.cor};--e-cor2:${entidade.corSecundaria}" onclick="abrirEntidadeNewsletter('${entidade.id}', 0)">
            <div class="entidade-nl-featured-shine"></div>
            <div class="entidade-nl-featured-glow"></div>
            <div style="position:relative;z-index:3">
              <div class="newsletter-date" style="color:${entidade.cor}">${formatDate(entidade.newsletter[0].data)}</div>
              <div class="newsletter-title">${entidade.newsletter[0].titulo}</div>
              <div class="newsletter-summary">${entidade.newsletter[0].resumo}</div>
              <span class="entidade-nl-read-btn" style="color:${entidade.cor}">Ler completo →</span>
            </div>
          </div>

          <!-- Archive -->
          ${entidade.newsletter.length > 1 ? `
            <div class="section-title" style="margin-top:20px">Edições anteriores</div>
            <div class="newsletter-list">
              ${entidade.newsletter.slice(1).map((nl, i) => `
                <div class="newsletter-item" onclick="abrirEntidadeNewsletter('${entidade.id}', ${i+1})">
                  <div class="newsletter-item-date">${formatDateShort(nl.data)}</div>
                  <div class="newsletter-item-title">${nl.titulo}</div>
                  <svg class="newsletter-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              `).join('')}
            </div>
          ` : ''}
        ` : `<div class="no-events-msg">Nenhuma newsletter publicada.</div>`}
      </div>

    </div>
  `;

  // Scroll to top of page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateEntidadesBackBtn() {
  const btn = document.getElementById('entidades-back-btn');
  if (!btn) return;
  if (entidadeAtiva) {
    btn.style.display = 'flex';
    btn.onclick = () => { entidadeAtiva = null; renderEntidadesHub(); };
  } else {
    btn.style.display = 'none';
  }
}

// ===== NEWSLETTER MODAL DA ENTIDADE =====
function abrirEntidadeNewsletter(entidadeId, nlIndex) {
  const entidade = entidadesData.find(e => e.id === entidadeId);
  if (!entidade || !entidade.newsletter[nlIndex]) return;

  const nl = entidade.newsletter[nlIndex];

  // Reuse existing modal
  const modal = document.getElementById('newsletter-modal');
  const dateEl = document.getElementById('modal-date');
  const titleEl = document.getElementById('modal-title');
  const contentEl = document.getElementById('modal-content');

  if (dateEl) dateEl.textContent = formatDate(nl.data) + ' · ' + entidade.nome;
  if (titleEl) titleEl.textContent = nl.titulo;
  if (contentEl) contentEl.textContent = nl.conteudo;

  modal?.classList.remove('hidden');
}

// ===== HELPERS =====
function entidadeEventBadge(tipo) {
  const map = {
    prova: `<span class="badge badge-red">Prova</span>`,
    entrega: `<span class="badge badge-yellow">Entrega</span>`,
    evento: `<span class="badge badge-green">Evento</span>`,
    apresentacao: `<span class="badge badge-blue">Apresentação</span>`,
    deadline: `<span class="badge badge-yellow">Deadline</span>`,
  };
  return map[tipo] || `<span class="badge badge-purple">${tipo || 'Evento'}</span>`;
}

function linkIconSvg(tipo) {
  const icons = {
    instagram: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
    linkedin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    github: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    globe: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    mail: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  };
  return icons[tipo] || icons.globe;
}
