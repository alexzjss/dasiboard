// ===== CONTROLE DE FALTAS — DaSIboard =====
// Limite: 30% do total de aulas. Persiste em localStorage.

const FALTAS_KEY = 'dasiboard_faltas_v1';

// Estrutura: { disciplinas: [ { id, nome, code, totalAulas, faltas, aulas: [{data, obs}] } ] }
let faltasData = null;

// ── Persistência ──────────────────────────────────────────────────────────────
function faltasLoad() {
  try {
    const s = localStorage.getItem(FALTAS_KEY);
    faltasData = s ? JSON.parse(s) : { disciplinas: [] };
  } catch(e) { faltasData = { disciplinas: [] }; }
  if (!faltasData.disciplinas) faltasData.disciplinas = [];
}

function faltasSave() {
  try { localStorage.setItem(FALTAS_KEY, JSON.stringify(faltasData)); } catch(e) {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function faltasEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function faltasPct(disc) {
  if (!disc.totalAulas || disc.totalAulas === 0) return 0;
  return (disc.faltas / disc.totalAulas) * 100;
}

function faltasStatus(disc) {
  const pct = faltasPct(disc);
  if (pct >= 30) return 'reprovado';
  if (pct >= 20) return 'perigo';
  if (pct >= 10) return 'atencao';
  return 'ok';
}

function faltasStatusLabel(status) {
  return { ok: '✓ Seguro', atencao: '! Atenção', perigo: '⚠ Perigo', reprovado: '✕ Reprovado' }[status] || '';
}

function faltasStatusColor(status) {
  return { ok: 'var(--success)', atencao: 'var(--warning)', perigo: '#f97316', reprovado: 'var(--danger)' }[status] || 'var(--text-dim)';
}

// ── Importar disciplinas da grade horária (schedule) ─────────────────────────
async function faltasImportFromSchedule() {
  try {
    const data = await fetchJSON('./data/schedule.json');
    if (!data || !data.schedule) return;

    // Collect unique disciplines across all schedule slots
    const map = {};
    Object.values(data.schedule).forEach(courses => {
      courses.forEach(c => {
        if (!c.code) return;
        if (!map[c.code]) {
          map[c.code] = { code: c.code, nome: c.course, totalAulas: 0 };
        }
      });
    });

    // Ask user which semester/turma they're on to suggest aula count
    const newDiscs = Object.values(map).filter(d => !faltasData.disciplinas.find(x => x.code === d.code));
    return newDiscs;
  } catch(e) { return []; }
}

// ── Render principal ──────────────────────────────────────────────────────────
function renderFaltas() {
  const container = document.getElementById('faltas-content');
  if (!container) return;
  faltasLoad();

  const discs = faltasData.disciplinas;
  const total = discs.length;
  const emPerigo = discs.filter(d => faltasStatus(d) === 'perigo' || faltasStatus(d) === 'reprovado').length;
  const reprovados = discs.filter(d => faltasStatus(d) === 'reprovado').length;

  container.innerHTML = `
    <div class="faltas-overview">
      <div class="gpa-big-card">
        <div class="gpa-big-num" style="font-size:36px">${total}</div>
        <div class="gpa-big-label">Disciplinas monitoradas</div>
      </div>
      <div class="gpa-big-card">
        <div class="gpa-big-num" style="font-size:36px;color:${emPerigo>0?'var(--warning)':'var(--success)'}">${emPerigo}</div>
        <div class="gpa-big-label">Em situação de risco (≥20%)</div>
      </div>
      <div class="gpa-big-card">
        <div class="gpa-big-num" style="font-size:36px;color:${reprovados>0?'var(--danger)':'var(--success)'}">${reprovados}</div>
        <div class="gpa-big-label">Reprovados por falta (≥30%)</div>
      </div>
    </div>

    <div style="margin:24px 0 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="faltasOpenAddModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova disciplina
      </button>
      <button class="btn btn-ghost btn-sm" onclick="faltasImportModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Importar da grade
      </button>
      ${total > 0 ? `<span style="font-size:12px;color:var(--text-dim);margin-left:auto">Limite: 30% das aulas</span>` : ''}
    </div>

    ${total === 0 ? `
      <div class="empty-state" style="margin-top:40px">
        <div style="font-size:40px;margin-bottom:12px">📋</div>
        <p style="font-weight:600;margin-bottom:6px">Nenhuma disciplina ainda</p>
        <p style="color:var(--text-muted);font-size:13px">Adicione suas disciplinas para começar a controlar as faltas.<br>Você pode importar direto da grade horária.</p>
      </div>
    ` : `
      <div class="faltas-grid" id="faltas-grid">
        ${discs.map(d => buildFaltasCard(d)).join('')}
      </div>
    `}
  `;
}

function buildFaltasCard(d) {
  const pct = faltasPct(d);
  const status = faltasStatus(d);
  const color = faltasStatusColor(status);
  const label = faltasStatusLabel(status);
  const maxFaltas = d.totalAulas ? Math.floor(d.totalAulas * 0.30) : '?';
  const restantes = d.totalAulas ? Math.max(0, Math.floor(d.totalAulas * 0.30) - d.faltas) : '?';
  const pctDisplay = d.totalAulas ? pct.toFixed(1) : '—';
  const barPct = d.totalAulas ? Math.min(100, pct) : 0;

  // Danger zones on the bar: 10% = attention, 20% = danger, 30% = max
  const barColor = status === 'reprovado' ? 'var(--danger)' :
                   status === 'perigo'    ? '#f97316' :
                   status === 'atencao'   ? 'var(--warning)' : 'var(--success)';

  return `
    <div class="faltas-card ${status}" id="faltas-card-${d.id}">
      <div class="faltas-card-header">
        <div class="faltas-card-info">
          ${d.code ? `<span class="faltas-code">${faltasEsc(d.code)}</span>` : ''}
          <span class="faltas-nome">${faltasEsc(d.nome)}</span>
        </div>
        <div class="faltas-card-actions">
          <span class="faltas-status-pill" style="background:${color}22;color:${color};border:1px solid ${color}44">${label}</span>
          <button class="kanban-action-btn delete" onclick="faltasDeleteDisc('${d.id}')" title="Remover">🗑</button>
        </div>
      </div>

      <div class="faltas-bar-row">
        <div class="faltas-bar-bg">
          <div class="faltas-bar-fill" style="width:${barPct}%;background:${barColor};transition:width .5s ease"></div>
          <!-- Limiar 30% marker -->
          <div class="faltas-bar-marker" style="left:30%"></div>
        </div>
        <span class="faltas-pct-label" style="color:${color}">${pctDisplay}%</span>
      </div>

      <div class="faltas-stats-row">
        <div class="faltas-stat">
          <span class="faltas-stat-val" style="color:${color}">${d.faltas}</span>
          <span class="faltas-stat-lbl">Faltas</span>
        </div>
        <div class="faltas-stat">
          <span class="faltas-stat-val">${d.totalAulas || '—'}</span>
          <span class="faltas-stat-lbl">Total de aulas</span>
        </div>
        <div class="faltas-stat">
          <span class="faltas-stat-val">${maxFaltas}</span>
          <span class="faltas-stat-lbl">Limite (30%)</span>
        </div>
        <div class="faltas-stat">
          <span class="faltas-stat-val" style="color:${restantes === 0 ? 'var(--danger)' : 'var(--success)'}">${restantes}</span>
          <span class="faltas-stat-lbl">Ainda pode faltar</span>
        </div>
      </div>

      <div class="faltas-actions-row">
        <button class="btn btn-sm" style="background:var(--danger)22;color:var(--danger);border:1px solid var(--danger)33;flex:1" onclick="faltasAdd('${d.id}', 1)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar falta
        </button>
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="faltasAdd('${d.id}', -1)" ${d.faltas <= 0 ? 'disabled' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Desfazer
        </button>
        <button class="btn btn-ghost btn-sm" onclick="faltasOpenEditModal('${d.id}')" title="Editar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
        </button>
      </div>

      ${d.aulas && d.aulas.length > 0 ? `
        <details class="faltas-history" style="margin-top:10px">
          <summary style="font-size:12px;color:var(--text-dim);cursor:pointer;padding:4px 0">
            Histórico de faltas (${d.aulas.length})
          </summary>
          <div class="faltas-history-list">
            ${d.aulas.slice(-8).reverse().map(a => `
              <div class="faltas-history-item">
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">${a.data}</span>
                ${a.obs ? `<span style="font-size:11px;color:var(--text-muted)">${faltasEsc(a.obs)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </details>
      ` : ''}
    </div>
  `;
}

// ── Actions ───────────────────────────────────────────────────────────────────
function faltasAdd(id, delta) {
  faltasLoad();
  const d = faltasData.disciplinas.find(x => x.id === id);
  if (!d) return;
  d.faltas = Math.max(0, (d.faltas || 0) + delta);
  if (delta > 0) {
    if (!d.aulas) d.aulas = [];
    const today = new Date().toLocaleDateString('pt-BR');
    d.aulas.push({ data: today, obs: '' });
  } else if (delta < 0 && d.aulas && d.aulas.length > 0) {
    d.aulas.pop();
  }
  faltasSave();

  // Check and notify if crossing threshold
  const status = faltasStatus(d);
  if (delta > 0) {
    const pct = faltasPct(d);
    if (status === 'reprovado') {
      showToast(`⛔ ${d.nome}: você atingiu 30% de faltas! Reprovado por falta.`, 5000);
      faltasNotify(d, 'reprovado');
    } else if (status === 'perigo' && pct >= 20 && pct < 21) {
      showToast(`⚠️ ${d.nome}: 20% de faltas atingidas! Cuidado.`, 4000);
      faltasNotify(d, 'perigo');
    } else if (status === 'atencao' && pct >= 10 && pct < 11) {
      showToast(`! ${d.nome}: 10% de faltas. Fique atento.`, 3000);
    }
  }

  // Refresh card in place
  const card = document.getElementById(`faltas-card-${id}`);
  if (card) {
    const newCard = document.createElement('div');
    newCard.innerHTML = buildFaltasCard(d);
    card.replaceWith(newCard.firstElementChild);
  }

  // Refresh overview counters
  const discs = faltasData.disciplinas;
  const emPerigo = discs.filter(x => faltasStatus(x) === 'perigo' || faltasStatus(x) === 'reprovado').length;
  const reprovados = discs.filter(x => faltasStatus(x) === 'reprovado').length;
  const cards = document.querySelectorAll('.gpa-big-num');
  if (cards[1]) { cards[1].textContent = emPerigo; cards[1].style.color = emPerigo > 0 ? 'var(--warning)' : 'var(--success)'; }
  if (cards[2]) { cards[2].textContent = reprovados; cards[2].style.color = reprovados > 0 ? 'var(--danger)' : 'var(--success)'; }
}

function faltasDeleteDisc(id) {
  if (!confirm('Remover esta disciplina do controle de faltas?')) return;
  faltasLoad();
  faltasData.disciplinas = faltasData.disciplinas.filter(x => x.id !== id);
  faltasSave();
  renderFaltas();
  showToast('Disciplina removida.');
}

// ── Notificações push ─────────────────────────────────────────────────────────
function faltasNotify(disc, level) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const msgs = {
    reprovado: { title: '⛔ Reprovado por falta!', body: `${disc.nome}: você ultrapassou o limite de 30% de faltas.` },
    perigo:    { title: '⚠️ Faltas em zona de perigo', body: `${disc.nome}: 20% das aulas faltadas. Limite é 30%.` },
  };
  const m = msgs[level];
  if (!m) return;
  try {
    new Notification(m.title, { body: m.body, icon: './assets/logo-si.svg', tag: `faltas-${disc.id}-${level}` });
  } catch(e) {}
}

// ── Modal: Adicionar disciplina ───────────────────────────────────────────────
function faltasOpenAddModal(prefill) {
  document.getElementById('faltas-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'faltas-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;z-index:9999';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:420px;width:100%">
      <button class="modal-close" onclick="document.getElementById('faltas-modal-overlay').remove()">&#215;</button>
      <h2 style="font-size:17px;font-weight:700;margin-bottom:18px">Adicionar disciplina</h2>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Nome da disciplina *</label>
          <input id="faltas-inp-nome" type="text" class="gpa-note-input" style="width:100%;box-sizing:border-box"
            placeholder="Ex: Banco de Dados I" value="${faltasEsc(prefill?.nome||'')}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Código (opcional)</label>
          <input id="faltas-inp-code" type="text" class="gpa-note-input" style="width:100%;box-sizing:border-box"
            placeholder="Ex: ACH2004" value="${faltasEsc(prefill?.code||'')}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">
            Total de aulas no semestre *
            <span style="color:var(--text-muted);font-size:11px">(limite = 30% deste número)</span>
          </label>
          <input id="faltas-inp-total" type="number" min="1" max="200" class="gpa-note-input" style="width:100%;box-sizing:border-box"
            placeholder="Ex: 30" value="${prefill?.totalAulas||''}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Faltas já registradas</label>
          <input id="faltas-inp-faltas" type="number" min="0" class="gpa-note-input" style="width:100%;box-sizing:border-box"
            placeholder="0" value="${prefill?.faltas||0}" />
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--glass-border)">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('faltas-modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" onclick="faltasSaveFromModal()">Adicionar</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  document.getElementById('faltas-inp-nome')?.focus();
}

function faltasOpenEditModal(id) {
  faltasLoad();
  const d = faltasData.disciplinas.find(x => x.id === id);
  if (!d) return;
  document.getElementById('faltas-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'faltas-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;z-index:9999';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:420px;width:100%">
      <button class="modal-close" onclick="document.getElementById('faltas-modal-overlay').remove()">&#215;</button>
      <h2 style="font-size:17px;font-weight:700;margin-bottom:18px">Editar: ${faltasEsc(d.nome)}</h2>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Nome</label>
          <input id="faltas-edit-nome" type="text" class="gpa-note-input" style="width:100%;box-sizing:border-box" value="${faltasEsc(d.nome)}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Código</label>
          <input id="faltas-edit-code" type="text" class="gpa-note-input" style="width:100%;box-sizing:border-box" value="${faltasEsc(d.code||'')}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Total de aulas</label>
          <input id="faltas-edit-total" type="number" min="1" class="gpa-note-input" style="width:100%;box-sizing:border-box" value="${d.totalAulas||''}" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:4px">Faltas atuais</label>
          <input id="faltas-edit-faltas" type="number" min="0" class="gpa-note-input" style="width:100%;box-sizing:border-box" value="${d.faltas||0}" />
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--glass-border)">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('faltas-modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" onclick="faltasSaveEdit('${id}')">Salvar</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function faltasSaveFromModal() {
  const nome = document.getElementById('faltas-inp-nome')?.value?.trim();
  const code = document.getElementById('faltas-inp-code')?.value?.trim();
  const totalAulas = parseInt(document.getElementById('faltas-inp-total')?.value) || 0;
  const faltas = parseInt(document.getElementById('faltas-inp-faltas')?.value) || 0;
  if (!nome) { showToast('Informe o nome da disciplina.'); return; }
  if (!totalAulas) { showToast('Informe o total de aulas.'); return; }
  faltasLoad();
  const exists = code && faltasData.disciplinas.find(x => x.code === code);
  if (exists) { showToast('Disciplina com este código já existe.'); return; }
  faltasData.disciplinas.push({ id: `f_${Date.now()}`, nome, code, totalAulas, faltas, aulas: [] });
  faltasSave();
  document.getElementById('faltas-modal-overlay')?.remove();
  renderFaltas();
  showToast('Disciplina adicionada ao controle de faltas!');
}

function faltasSaveEdit(id) {
  faltasLoad();
  const d = faltasData.disciplinas.find(x => x.id === id);
  if (!d) return;
  d.nome = document.getElementById('faltas-edit-nome')?.value?.trim() || d.nome;
  d.code = document.getElementById('faltas-edit-code')?.value?.trim() || '';
  d.totalAulas = parseInt(document.getElementById('faltas-edit-total')?.value) || d.totalAulas;
  d.faltas = parseInt(document.getElementById('faltas-edit-faltas')?.value) || 0;
  faltasSave();
  document.getElementById('faltas-modal-overlay')?.remove();
  renderFaltas();
  showToast('Disciplina atualizada.');
}

// ── Modal: Importar da grade ──────────────────────────────────────────────────
async function faltasImportModal() {
  const candidates = await faltasImportFromSchedule();
  if (!candidates || candidates.length === 0) {
    showToast('Nenhuma disciplina nova encontrada na grade.');
    return;
  }
  document.getElementById('faltas-import-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'faltas-import-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;z-index:9999';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:500px;width:100%;max-height:80vh;overflow:auto">
      <button class="modal-close" onclick="document.getElementById('faltas-import-overlay').remove()">&#215;</button>
      <h2 style="font-size:17px;font-weight:700;margin-bottom:6px">Importar da grade horária</h2>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Selecione as disciplinas e defina o total de aulas de cada uma.</p>
      <div id="faltas-import-list" style="display:flex;flex-direction:column;gap:10px">
        ${candidates.map(c => `
          <div class="card" style="padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <input type="checkbox" id="chk-${c.code}" style="accent-color:var(--primary);width:16px;height:16px;flex-shrink:0">
            <div style="flex:1;min-width:150px">
              <span style="font-size:13px;font-weight:600">${faltasEsc(c.nome)}</span>
              ${c.code ? `<span style="font-size:11px;color:var(--text-dim);margin-left:6px">${faltasEsc(c.code)}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <label style="font-size:11px;color:var(--text-dim)">Aulas:</label>
              <input type="number" id="tot-${c.code}" min="1" max="200" value="30"
                style="width:60px;padding:4px 6px;font-size:12px;background:var(--bg-card);border:1px solid var(--glass-border);border-radius:var(--radius-sm);color:var(--text-main)">
            </div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('faltas-import-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" onclick="faltasConfirmImport(${JSON.stringify(candidates).replace(/"/g,'&quot;')})">Importar selecionadas</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function faltasConfirmImport(candidates) {
  faltasLoad();
  let count = 0;
  candidates.forEach(c => {
    const chk = document.getElementById(`chk-${c.code}`);
    if (!chk?.checked) return;
    const totalAulas = parseInt(document.getElementById(`tot-${c.code}`)?.value) || 30;
    if (faltasData.disciplinas.find(x => x.code === c.code)) return;
    faltasData.disciplinas.push({ id: `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, nome: c.nome, code: c.code, totalAulas, faltas: 0, aulas: [] });
    count++;
  });
  faltasSave();
  document.getElementById('faltas-import-overlay')?.remove();
  renderFaltas();
  showToast(`${count} disciplina(s) importada(s)!`);
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initFaltas() {
  faltasLoad();
  renderFaltas();
}
