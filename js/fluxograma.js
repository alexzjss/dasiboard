// ===== FLUXOGRAMA CURRICULAR — DaSIboard =====
// Grade de Sistemas de Informação — EACH/USP
// Dados baseados em https://each.uspnet.usp.br/si/assets/html/subjects.html

const FLUX_KEY = 'dasiboard_fluxograma_v1';

// ── Dados das disciplinas por semestre ────────────────────────────────────────
const FLUXO_DATA = [
  {
    sem: 1, label: '1º Sem', cor: '#7c3aed',
    disciplinas: [
      { id: 'ACH2001', abrev: 'IP',     nome: 'Introdução à Programação',                       tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2014', abrev: 'FSI',    nome: 'Fundamentos de Sistemas de Informação',           tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH0021', abrev: 'TADI',   nome: 'Tratamento e Análise de Dados e Informações',     tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH0041', abrev: 'RP I',   nome: 'Resolução de Problemas I',                        tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2011', abrev: 'CALC I', nome: 'Cálculo I',                                       tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH0141', abrev: 'SMD',    nome: 'Sociedade, Multiculturalismo e Direitos',          tipo: 'ciclobasico', cr: 4 },
    ]
  },
  {
    sem: 2, label: '2º Sem', cor: '#2563eb',
    disciplinas: [
      { id: 'ACH2002', abrev: 'IAA',    nome: 'Introdução à Análise de Algoritmos',              tipo: 'obrigatoria', cr: 4, prereq: ['ACH2001'] },
      { id: 'ACH2012', abrev: 'CALC II',nome: 'Cálculo II',                                       tipo: 'obrigatoria', cr: 4, prereq: ['ACH2011'] },
      { id: 'ACH2013', abrev: 'MD I',   nome: 'Matemática Discreta I',                           tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2023', abrev: 'AED I',  nome: 'Algoritmos e Estruturas de Dados I',              tipo: 'obrigatoria', cr: 4, prereq: ['ACH2001'] },
      { id: 'ACH2033', abrev: 'MVGA',   nome: 'Matrizes, Vetores e Geometria Analítica',         tipo: 'obrigatoria', cr: 4 },
    ]
  },
  {
    sem: 3, label: '3º Sem', cor: '#0891b2',
    disciplinas: [
      { id: 'ACH2003', abrev: 'COO',    nome: 'Computação Orientada a Objetos',                  tipo: 'obrigatoria', cr: 4, prereq: ['ACH2023'] },
      { id: 'ACH2024', abrev: 'AED II', nome: 'Algoritmos e Estruturas de Dados II',             tipo: 'obrigatoria', cr: 4, prereq: ['ACH2023'] },
      { id: 'ACH2034', abrev: 'OAC I',  nome: 'Organização e Arquitetura de Computadores I',     tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2063', abrev: 'IAEC',   nome: 'Introdução à Administração e Economia',           tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2053', abrev: 'IE',     nome: 'Introdução à Estatística',                        tipo: 'obrigatoria', cr: 4 },
    ]
  },
  {
    sem: 4, label: '4º Sem', cor: '#059669',
    disciplinas: [
      { id: 'ACH2004', abrev: 'BD I',   nome: 'Banco de Dados I',                               tipo: 'obrigatoria', cr: 4, prereq: ['ACH2003'] },
      { id: 'ACH2036', abrev: 'MQAM',   nome: 'Métodos Quantitativos p/ Análise Multivariada',  tipo: 'obrigatoria', cr: 4, prereq: ['ACH2053'] },
      { id: 'ACH2055', abrev: 'OAC II', nome: 'Organização e Arquitetura de Computadores II',   tipo: 'obrigatoria', cr: 4, prereq: ['ACH2034'] },
      { id: 'ACH2026', abrev: 'RC',     nome: 'Redes de Computadores',                          tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2044', abrev: 'SO',     nome: 'Sistemas Operacionais',                          tipo: 'obrigatoria', cr: 4, prereq: ['ACH2034'] },
    ]
  },
  {
    sem: 5, label: '5º Sem', cor: '#d97706',
    disciplinas: [
      { id: 'ACH2005', abrev: 'IHC',    nome: 'Interface Humano-Computador',                    tipo: 'obrigatoria', cr: 4, prereq: ['ACH2003'] },
      { id: 'ACH2016', abrev: 'IA',     nome: 'Inteligência Artificial',                        tipo: 'obrigatoria', cr: 4, prereq: ['ACH2024', 'ACH2053'] },
      { id: 'ACH2025', abrev: 'BD II',  nome: 'Banco de Dados II',                              tipo: 'obrigatoria', cr: 4, prereq: ['ACH2004'] },
      { id: 'ACH2043', abrev: 'ITC',    nome: 'Introdução à Teoria da Computação',              tipo: 'obrigatoria', cr: 4, prereq: ['ACH2013'] },
      { id: 'ACH2147', abrev: 'DSID',   nome: 'Desenvolvimento de Sistemas Distribuídos',       tipo: 'obrigatoria', cr: 4, prereq: ['ACH2004', 'ACH2026'] },
    ]
  },
  {
    sem: 6, label: '6º Sem', cor: '#dc2626',
    disciplinas: [
      { id: 'ACH2006', abrev: 'ESI',    nome: 'Engenharia de Sistemas de Informação',           tipo: 'obrigatoria', cr: 4, prereq: ['ACH2005', 'ACH2147'] },
      { id: 'ACH0042', abrev: 'RP II',  nome: 'Resolução de Problemas II',                      tipo: 'obrigatoria', cr: 4, prereq: ['ACH0041'] },
      { id: 'ACH2027', abrev: 'GPTI',   nome: 'Gestão de Projetos de TI',                       tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH2008', abrev: 'EI',     nome: 'Empreendedorismo em Informática',                tipo: 'obrigatoria', cr: 4 },
      { id: 'ACH0102', abrev: 'PETC',   nome: 'Psicologia, Educação e Temas Contemporâneos',    tipo: 'ciclobasico', cr: 4 },
      { id: 'ACH0162', abrev: 'ALC',    nome: 'Arte, Literatura e Cultura',                     tipo: 'ciclobasico', cr: 4 },
    ]
  },
  {
    sem: 7, label: '7º Sem', cor: '#9333ea',
    disciplinas: [
      { id: 'ACH2017', abrev: 'PSG I',  nome: 'Projeto Supervisionado ou de Graduação I',       tipo: 'obrigatoria', cr: 4, prereq: ['ACH2006'] },
      { id: 'ACH0111', abrev: 'CN',     nome: 'Ciências da Natureza',                           tipo: 'ciclobasico', cr: 4 },
      { id: 'OPT7A',   abrev: 'OPT',   nome: 'Optativa Eletiva A',                             tipo: 'optativa',    cr: 4 },
      { id: 'OPT7B',   abrev: 'OPT',   nome: 'Optativa Eletiva B',                             tipo: 'optativa',    cr: 4 },
    ]
  },
  {
    sem: 8, label: '8º Sem', cor: '#be185d',
    disciplinas: [
      { id: 'ACH2018', abrev: 'PSG II', nome: 'Projeto Supervisionado ou de Graduação II',      tipo: 'obrigatoria', cr: 4, prereq: ['ACH2017'] },
      { id: 'ACH0142', abrev: 'SMC',    nome: 'Sociedade, Meio Ambiente e Cidadania',           tipo: 'ciclobasico', cr: 4 },
      { id: 'OPT8A',   abrev: 'OPT',   nome: 'Optativa Eletiva C',                             tipo: 'optativa',    cr: 4 },
      { id: 'OPT8B',   abrev: 'OPT',   nome: 'Optativa Eletiva D',                             tipo: 'optativa',    cr: 4 },
    ]
  }
];

// ── Persistência ──────────────────────────────────────────────────────────────
function fluxLoad() {
  try {
    const s = localStorage.getItem(FLUX_KEY);
    return s ? JSON.parse(s) : {};
  } catch(e) { return {}; }
}

function fluxSave(state) {
  try { localStorage.setItem(FLUX_KEY, JSON.stringify(state)); } catch(e) {}
}

function fluxToggle(id) {
  const state = fluxLoad();
  state[id] = !state[id];
  fluxSave(state);
  renderFluxograma();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function fluxStats(state) {
  let total = 0, done = 0, crTotal = 0, crDone = 0;
  FLUXO_DATA.forEach(sem => sem.disciplinas.forEach(d => {
    if (d.tipo === 'optativa') return;
    total++;
    crTotal += d.cr || 0;
    if (state[d.id]) { done++; crDone += d.cr || 0; }
  }));
  return { total, done, crTotal, crDone };
}

function fluxSemDone(state, sem) {
  return sem.disciplinas.filter(d => d.tipo !== 'optativa').every(d => state[d.id]);
}

function fluxPrereqMet(state, disc) {
  if (!disc.prereq || disc.prereq.length === 0) return true;
  return disc.prereq.every(p => state[p]);
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderFluxograma() {
  const container = document.getElementById('fluxograma-content');
  if (!container) return;
  const state = fluxLoad();
  const stats = fluxStats(state);
  const pct = stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div style="margin-bottom:24px">
      <!-- Progress overview -->
      <div class="gpa-overview" style="margin-bottom:16px">
        <div class="gpa-big-card">
          <div class="gpa-big-num" style="font-size:32px">${stats.done}/${stats.total}</div>
          <div class="gpa-big-label">Obrigatórias concluídas</div>
        </div>
        <div class="gpa-big-card">
          <div class="gpa-big-num" style="font-size:32px">${pct}%</div>
          <div class="gpa-big-label">Progresso no curso</div>
        </div>
        <div class="gpa-big-card">
          <div class="gpa-big-num" style="font-size:32px">${stats.crDone}</div>
          <div class="gpa-big-label">Créditos concluídos</div>
        </div>
      </div>

      <!-- Master progress bar -->
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:6px">
          <span>Progresso geral do curso</span>
          <span>${stats.crDone} / ${stats.crTotal} créditos</span>
        </div>
        <div style="height:10px;background:var(--glass-tint);border-radius:5px;overflow:hidden;border:1px solid var(--glass-border)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),#7c3aed);border-radius:5px;transition:width .6s ease"></div>
        </div>
      </div>

      <!-- Legend -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;font-size:12px">
        <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:var(--success);flex-shrink:0"></span>Concluída</span>
        <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:var(--primary);flex-shrink:0"></span>Desbloqueada</span>
        <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:var(--glass-tint);border:1px solid var(--glass-border);flex-shrink:0"></span>Bloqueada (faltam pré-req)</span>
        <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:3px;background:transparent;border:2px dashed var(--text-dim);flex-shrink:0"></span>Ciclo básico / Optativa</span>
      </div>

      <!-- Fluxograma grid -->
      <div class="fluxo-grid">
        ${FLUXO_DATA.map(sem => renderFluxoSem(sem, state)).join('')}
      </div>

      <p style="font-size:11px;color:var(--text-dim);margin-top:16px;text-align:center">
        Clique em uma disciplina para marcar como concluída. Pré-requisitos são verificados automaticamente.
        As optativas (OPT) são apenas indicativas.
      </p>
    </div>
  `;
}

function renderFluxoSem(sem, state) {
  const semDone = fluxSemDone(state, sem);
  const semPct = (() => {
    const discs = sem.disciplinas.filter(d => d.tipo !== 'optativa');
    if (!discs.length) return 0;
    return Math.round((discs.filter(d => state[d.id]).length / discs.length) * 100);
  })();

  return `
    <div class="fluxo-sem-col">
      <div class="fluxo-sem-header" style="border-color:${sem.cor};${semDone?'background:'+sem.cor+'22':''}">
        <span class="fluxo-sem-label" style="color:${sem.cor}">${sem.label}</span>
        <span class="fluxo-sem-pct" style="color:${semDone?sem.cor:'var(--text-dim)'}">${semPct}%</span>
      </div>
      <div class="fluxo-sem-bar" style="background:var(--glass-border)">
        <div style="height:100%;width:${semPct}%;background:${sem.cor};transition:width .5s ease;border-radius:2px"></div>
      </div>
      <div class="fluxo-disc-list">
        ${sem.disciplinas.map(d => renderFluxoDisc(d, state, sem.cor)).join('')}
      </div>
    </div>
  `;
}

function renderFluxoDisc(d, state, semCor) {
  const done = !!state[d.id];
  const prereqOk = fluxPrereqMet(state, d);
  const isOpt = d.tipo === 'optativa' || d.tipo === 'ciclobasico';
  const blocked = !done && !prereqOk && !isOpt;

  const bg = done      ? 'var(--success)'     :
             blocked   ? 'var(--glass-tint)'  :
             isOpt     ? 'transparent'        : 'var(--primary)';

  const textColor = done      ? '#fff'              :
                    blocked   ? 'var(--text-dim)'   :
                    isOpt     ? 'var(--text-muted)' : '#fff';

  const border = isOpt && !done ? `2px dashed var(--text-dim)` :
                 done           ? `1px solid var(--success)` :
                 blocked        ? `1px solid var(--glass-border)` :
                                  `1px solid var(--primary)`;

  const cursor = blocked ? 'not-allowed' : 'pointer';
  const opacity = blocked ? '0.55' : '1';

  const prereqNote = blocked && d.prereq ? `Requer: ${d.prereq.join(', ')}` : '';

  const jupiterUrl = d.id.startsWith('OPT') ? '#' :
    `https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis=${d.id}`;

  return `
    <div class="fluxo-disc ${done?'done':''} ${blocked?'blocked':''} ${isOpt?'opt':''}"
      style="background:${bg};color:${textColor};border:${border};cursor:${cursor};opacity:${opacity}"
      onclick="${blocked ? '' : `fluxToggle('${d.id}')`}"
      title="${d.nome}${prereqNote ? ' — ' + prereqNote : ''}">
      <div style="display:flex;align-items:center;gap:6px;width:100%">
        <span class="fluxo-disc-check">${done ? '✓' : blocked ? '🔒' : isOpt ? '◇' : '○'}</span>
        <div style="flex:1;min-width:0">
          <div class="fluxo-disc-abrev">${d.abrev}</div>
          <div class="fluxo-disc-nome">${d.nome}</div>
        </div>
        ${!d.id.startsWith('OPT') ? `
          <a href="${jupiterUrl}" target="_blank" rel="noopener"
            onclick="event.stopPropagation()"
            style="font-size:10px;color:${done||(!blocked&&!isOpt)?'rgba(255,255,255,0.7)':'var(--text-dim)'};text-decoration:none;flex-shrink:0"
            title="Ver no JupiterWeb">↗</a>
        ` : ''}
      </div>
    </div>
  `;
}

// ── CSS styles (injected once) ────────────────────────────────────────────────
function fluxInjectStyles() {
  if (document.getElementById('fluxo-styles')) return;
  const style = document.createElement('style');
  style.id = 'fluxo-styles';
  style.textContent = `
    .fluxo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      align-items: start;
    }
    .fluxo-sem-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .fluxo-sem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid;
      margin-bottom: 2px;
      transition: background .3s;
    }
    .fluxo-sem-label { font-size: 12px; font-weight: 700; }
    .fluxo-sem-pct   { font-size: 11px; font-family: var(--font-mono); }
    .fluxo-sem-bar   { height: 3px; border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
    .fluxo-disc-list { display: flex; flex-direction: column; gap: 5px; }
    .fluxo-disc {
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      transition: transform .12s, opacity .2s, background .2s;
      user-select: none;
    }
    .fluxo-disc:hover:not(.blocked) { transform: translateY(-1px); }
    .fluxo-disc-check { font-size: 12px; flex-shrink: 0; }
    .fluxo-disc-abrev { font-size: 11px; font-weight: 700; line-height: 1.2; }
    .fluxo-disc-nome  { font-size: 10px; opacity: .8; line-height: 1.3; margin-top: 1px;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 700px) {
      .fluxo-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .fluxo-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initFluxograma() {
  fluxInjectStyles();
  renderFluxograma();
}
