// ===== ESTUDOS MODULE =====

let estudosData = [];
let estudosFiltrados = [];
let estudosFiltroArea = 'todos';
let estudosFiltroTipo = 'todos';
let estudosBusca = '';
let estudoModalAberto = null;

async function initEstudos() {
  const container = el('#estudos-grid');
  if (!container) return;

  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Carregando estudos...</div>`;

  const data = await fetchJSON('./data/estudos/estudos.json');
  estudosData = data || [];

  renderEstudosFiltros();
  aplicarFiltrosEstudos();
}

// ===== FILTROS =====

function renderEstudosFiltros() {
  // Áreas únicas
  const areas = ['todos', ...new Set(estudosData.map(e => e.area))].sort((a, b) => a === 'todos' ? -1 : a.localeCompare(b));
  // Tipos únicos
  const tiposMap = { documento: 'Documento', link: 'Link', curso: 'Curso' };

  const areaContainer = el('#estudos-filter-area');
  if (areaContainer) {
    areaContainer.innerHTML = areas.map(a => `
      <button class="estudos-filter-btn ${a === estudosFiltroArea ? 'active' : ''}"
        data-area="${a}"
        onclick="setFiltroEstudoArea('${a}')">
        ${a === 'todos' ? 'Todas as áreas' : a}
      </button>
    `).join('');
  }

  const tipoContainer = el('#estudos-filter-tipo');
  if (tipoContainer) {
    tipoContainer.innerHTML = ['todos', 'documento', 'link', 'curso'].map(t => `
      <button class="estudos-filter-btn ${t === estudosFiltroTipo ? 'active' : ''}"
        data-tipo="${t}"
        onclick="setFiltroEstudoTipo('${t}')">
        ${t === 'todos' ? 'Todos os tipos' : tiposMap[t] || t}
      </button>
    `).join('');
  }
}

function setFiltroEstudoArea(area) {
  estudosFiltroArea = area;
  els('#estudos-filter-area .estudos-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.area === area);
  });
  aplicarFiltrosEstudos();
}

function setFiltroEstudoTipo(tipo) {
  estudosFiltroTipo = tipo;
  els('#estudos-filter-tipo .estudos-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tipo === tipo);
  });
  aplicarFiltrosEstudos();
}

function buscarEstudos(valor) {
  estudosBusca = valor.toLowerCase().trim();
  aplicarFiltrosEstudos();
}

function aplicarFiltrosEstudos() {
  let resultado = [...estudosData];

  if (estudosFiltroArea !== 'todos') {
    resultado = resultado.filter(e => e.area === estudosFiltroArea);
  }

  if (estudosFiltroTipo !== 'todos') {
    resultado = resultado.filter(e => e.tipo === estudosFiltroTipo);
  }

  if (estudosBusca) {
    resultado = resultado.filter(e =>
      e.titulo.toLowerCase().includes(estudosBusca) ||
      (e.descricao || '').toLowerCase().includes(estudosBusca) ||
      (e.area || '').toLowerCase().includes(estudosBusca) ||
      (e.disciplina || '').toLowerCase().includes(estudosBusca) ||
      (e.criadoPor || '').toLowerCase().includes(estudosBusca) ||
      (e.enviadoPor || '').toLowerCase().includes(estudosBusca) ||
      (e.tags || []).some(t => t.toLowerCase().includes(estudosBusca))
    );
  }

  // Destaques primeiro
  resultado.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));

  estudosFiltrados = resultado;
  renderEstudosGrid();
  renderEstudosCount();
}

// ===== RENDER GRID =====

function renderEstudosGrid() {
  const container = el('#estudos-grid');
  if (!container) return;

  if (!estudosFiltrados.length) {
    container.innerHTML = `
      <div class="estudos-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <p>Nenhum conteúdo encontrado.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = estudosFiltrados.map((estudo, i) => renderEstudoCard(estudo, i)).join('');
}

function renderEstudosCount() {
  const el2 = el('#estudos-count');
  if (el2) {
    el2.textContent = `${estudosFiltrados.length} conteúdo${estudosFiltrados.length !== 1 ? 's' : ''} encontrado${estudosFiltrados.length !== 1 ? 's' : ''}`;
  }
}

function renderEstudoCard(estudo, index) {
  const tipoInfo = getTipoInfo(estudo.tipo);
  const destaqueMark = estudo.destaque ? `<span class="estudo-destaque-badge">⭐ Destaque</span>` : '';

  const totalModulos = estudo.modulos ? estudo.modulos.length : 0;
  const modulosConcluidos = estudo.modulos ? estudo.modulos.filter(m => m.concluido).length : 0;
  const progressoPct = totalModulos > 0 ? Math.round((modulosConcluidos / totalModulos) * 100) : null;

  const tags = (estudo.tags || []).slice(0, 3).map(t =>
    `<span class="estudo-tag">${t}</span>`
  ).join('');

  const metaItems = [
    estudo.disciplina ? `<span class="estudo-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>${estudo.disciplina}</span>` : '',
    estudo.semestre ? `<span class="estudo-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>${estudo.semestre}º sem.</span>` : '',
    estudo.criadoPor ? `<span class="estudo-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${estudo.criadoPor}</span>` : '',
  ].filter(Boolean).join('');

  const progressoHTML = progressoPct !== null ? `
    <div class="estudo-progresso">
      <div class="estudo-progresso-info">
        <span>${modulosConcluidos}/${totalModulos} módulos</span>
        <span>${progressoPct}%</span>
      </div>
      <div class="estudo-progresso-bar">
        <div class="estudo-progresso-fill" style="width: ${progressoPct}%"></div>
      </div>
    </div>
  ` : '';

  const countHTML = estudo.tipo === 'curso' && estudo.modulos
    ? `<span class="estudo-count-badge">${estudo.modulos.length} módulos</span>`
    : estudo.tipo === 'documento' && estudo.anexos && estudo.anexos.length
    ? `<span class="estudo-count-badge">${estudo.anexos.length} anexo${estudo.anexos.length > 1 ? 's' : ''}</span>`
    : estudo.tipo === 'link' && estudo.links && estudo.links.length
    ? `<span class="estudo-count-badge">${estudo.links.length} link${estudo.links.length > 1 ? 's' : ''}</span>`
    : '';

  return `
    <div class="estudo-card anim-fade-up" style="animation-delay: ${index * 0.05}s" onclick="abrirEstudoModal(${estudo.id})">
      <div class="estudo-card-header">
        <div class="estudo-tipo-badge estudo-tipo-${estudo.tipo}">
          ${tipoInfo.icon}
          ${tipoInfo.label}
        </div>
        <div class="estudo-header-right">
          ${countHTML}
          ${destaqueMark}
        </div>
      </div>

      <div class="estudo-area">${estudo.area}</div>
      <h3 class="estudo-titulo">${estudo.titulo}</h3>
      <p class="estudo-descricao">${estudo.descricao || ''}</p>

      ${progressoHTML}

      <div class="estudo-meta">${metaItems}</div>

      <div class="estudo-footer">
        <div class="estudo-tags">${tags}</div>
        <div class="estudo-data">${formatDateShort(estudo.dataEnvio)}</div>
      </div>
    </div>
  `;
}

function getTipoInfo(tipo) {
  const map = {
    documento: {
      label: 'Documento',
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    },
    link: {
      label: 'Link',
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    },
    curso: {
      label: 'Curso',
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    },
  };
  return map[tipo] || { label: tipo, icon: '' };
}

// ===== MODAL =====

function abrirEstudoModal(id) {
  const estudo = estudosData.find(e => e.id === id);
  if (!estudo) return;

  estudoModalAberto = estudo;
  const modal = el('#estudos-modal');
  const content = el('#estudos-modal-content');
  if (!modal || !content) return;

  const tipoInfo = getTipoInfo(estudo.tipo);

  const progressoHTML = estudo.modulos ? renderModalProgresso(estudo) : '';
  const modulosHTML = estudo.modulos ? renderModalModulos(estudo) : '';
  const anexosHTML = estudo.anexos && estudo.anexos.length ? renderModalAnexos(estudo.anexos) : '';
  const linksHTML = estudo.links && estudo.links.length ? renderModalLinks(estudo.links) : '';

  content.innerHTML = `
    <div class="estudos-modal-header">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
        <div class="estudo-tipo-badge estudo-tipo-${estudo.tipo}">${tipoInfo.icon} ${tipoInfo.label}</div>
        <span class="estudos-modal-area">${estudo.area}</span>
        ${estudo.destaque ? `<span class="estudo-destaque-badge">⭐ Destaque</span>` : ''}
      </div>
      <h2 class="estudos-modal-titulo">${estudo.titulo}</h2>
      <p class="estudos-modal-desc">${estudo.descricao || ''}</p>

      <div class="estudos-modal-meta">
        ${estudo.disciplina ? `<div class="estudos-modal-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>${estudo.disciplina}</span></div>` : ''}
        ${estudo.semestre ? `<div class="estudos-modal-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg><span>${estudo.semestre}º semestre</span></div>` : ''}
        ${estudo.criadoPor ? `<div class="estudos-modal-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Criado por ${estudo.criadoPor}</span></div>` : ''}
        ${estudo.enviadoPor ? `<div class="estudos-modal-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Enviado por ${estudo.enviadoPor}</span></div>` : ''}
        ${estudo.dataEnvio ? `<div class="estudos-modal-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${formatDate(estudo.dataEnvio)}</span></div>` : ''}
      </div>

      ${(estudo.tags || []).length ? `
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;">
          ${estudo.tags.map(t => `<span class="estudo-tag">${t}</span>`).join('')}
        </div>
      ` : ''}
    </div>

    ${progressoHTML}
    ${modulosHTML}
    ${linksHTML}
    ${anexosHTML}
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function renderModalProgresso(estudo) {
  const total = estudo.modulos.length;
  const concluidos = estudo.modulos.filter(m => m.concluido).length;
  const pct = Math.round((concluidos / total) * 100);
  return `
    <div class="estudos-modal-section">
      <div class="estudos-modal-section-title">Progresso do curso</div>
      <div class="estudo-progresso" style="margin-top:8px;">
        <div class="estudo-progresso-info">
          <span>${concluidos} de ${total} módulos concluídos</span>
          <span style="color: var(--secondary); font-weight: 600;">${pct}%</span>
        </div>
        <div class="estudo-progresso-bar" style="height: 8px;">
          <div class="estudo-progresso-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderModalModulos(estudo) {
  return `
    <div class="estudos-modal-section">
      <div class="estudos-modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        Módulos
      </div>
      <div class="estudos-modulos-list">
        ${estudo.modulos.map((m, i) => `
          <div class="estudos-modulo-item ${m.concluido ? 'concluido' : ''}">
            <div class="estudos-modulo-check">
              ${m.concluido
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<span class="estudos-modulo-num">${i + 1}</span>`
              }
            </div>
            <div class="estudos-modulo-body">
              <div class="estudos-modulo-titulo">${m.titulo}</div>
              ${m.descricao ? `<div class="estudos-modulo-desc">${m.descricao}</div>` : ''}
              <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
                ${(m.links || []).map(l => `
                  <a href="${l.url}" target="_blank" rel="noopener" class="estudo-recurso-link">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    ${l.titulo}
                  </a>
                `).join('')}
                ${(m.anexos || []).map(a => `
                  <a href="${a.caminho}" target="_blank" rel="noopener" class="estudo-recurso-link">
                    ${getAnexoIcon(a.tipo)}
                    ${a.nome}
                    <span style="opacity:0.6; font-size:10px;">${a.tamanho}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderModalLinks(links) {
  return `
    <div class="estudos-modal-section">
      <div class="estudos-modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Links
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        ${links.map(l => `
          <a href="${l.url}" target="_blank" rel="noopener" class="estudos-link-item">
            <div class="estudos-link-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:14px; color:var(--text);">${l.titulo}</div>
              <div style="font-size:11px; color:var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:var(--font-mono);">${l.url}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; color:var(--text-dim)"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderModalAnexos(anexos) {
  return `
    <div class="estudos-modal-section">
      <div class="estudos-modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        Anexos
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        ${anexos.map(a => `
          <a href="${a.caminho}" target="_blank" rel="noopener" class="estudos-anexo-item">
            <div class="estudos-anexo-icon">${getAnexoIcon(a.tipo)}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:14px; color:var(--text);">${a.nome}</div>
              <div style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">${a.tamanho}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; color:var(--text-dim)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function getAnexoIcon(tipo) {
  if (tipo === 'pdf') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  if (tipo === 'imagem') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

function fecharEstudosModal() {
  const modal = el('#estudos-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  estudoModalAberto = null;
}

function initEstudosModal() {
  const overlay = el('#estudos-modal');
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) fecharEstudosModal();
  });
}
