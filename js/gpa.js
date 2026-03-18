// ===== NOTAS & GPA =====
const GPA_KEY = 'dasiboard_gpa_v2';

const DEFAULT_SEMESTERS = [
  { id:'s1', label:'1º Semestre', collapsed:false, disciplines:[
    {id:'d1_1',name:'Tratamento e Análise de Dados e Informações',credits:4,grade:null},
    {id:'d1_2',name:'Resolução de Problemas I',credits:4,grade:null},
    {id:'d1_3',name:'Introdução à Programação',credits:4,grade:null},
    {id:'d1_4',name:'Cálculo I',credits:4,grade:null},
    {id:'d1_5',name:'Fundamentos de Sistemas de Informação',credits:4,grade:null},
  ]},
  { id:'s2', label:'2º Semestre', collapsed:true, disciplines:[
    {id:'d2_1',name:'Introdução à Análise de Algoritmos',credits:4,grade:null},
    {id:'d2_2',name:'Cálculo II',credits:4,grade:null},
    {id:'d2_3',name:'Matemática Discreta I',credits:4,grade:null},
    {id:'d2_4',name:'Algoritmos e Estruturas de Dados I',credits:4,grade:null},
    {id:'d2_5',name:'Matrizes, Vetores e Geometria Analítica',credits:4,grade:null},
  ]},
  { id:'s3', label:'3º Semestre', collapsed:true, disciplines:[
    {id:'d3_1',name:'Computação Orientada a Objetos',credits:4,grade:null},
    {id:'d3_2',name:'Algoritmos e Estruturas de Dados II',credits:4,grade:null},
    {id:'d3_3',name:'Organização e Arquitetura de Computadores I',credits:4,grade:null},
    {id:'d3_4',name:'Introdução à Estatística',credits:4,grade:null},
    {id:'d3_5',name:'Introdução à Administração e Economia para Computação',credits:4,grade:null},
  ]},
];

let gpaData = null;

async function gpaLoadDefaults() {
  // Load real disciplines from schedule data
  try {
    const data = await fetchJSON('./data/gpa_defaults.json');
    if (data && data.semesters) return data.semesters;
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_SEMESTERS));
}

function gpaLoad() {
  try {
    const saved = localStorage.getItem(GPA_KEY);
    gpaData = saved ? JSON.parse(saved) : { semesters: JSON.parse(JSON.stringify(DEFAULT_SEMESTERS)) };
  } catch(e) { gpaData = { semesters: JSON.parse(JSON.stringify(DEFAULT_SEMESTERS)) }; }
  if (!gpaData.semesters) gpaData.semesters = JSON.parse(JSON.stringify(DEFAULT_SEMESTERS));
}

function gpaSave() { try { localStorage.setItem(GPA_KEY, JSON.stringify(gpaData)); } catch(e) {} }

function calcSemAvg(sem) {
  const graded = sem.disciplines.filter(d => d.grade !== null && d.grade !== '' && !isNaN(parseFloat(d.grade)));
  if (!graded.length) return null;
  const tw = graded.reduce((s,d) => s+(d.credits||1), 0);
  return graded.reduce((s,d) => s+parseFloat(d.grade)*(d.credits||1), 0) / tw;
}

function calcGlobalGPA() {
  let tw = 0, ws = 0;
  gpaData.semesters.forEach(sem => sem.disciplines.forEach(d => {
    if (d.grade !== null && d.grade !== '' && !isNaN(parseFloat(d.grade))) { tw += (d.credits||1); ws += parseFloat(d.grade)*(d.credits||1); }
  }));
  return tw === 0 ? null : ws/tw;
}

function gradeStatus(g) {
  if (g === null || g === '') return '';
  const v = parseFloat(g); if (isNaN(v)) return '';
  if (v >= 5) return 'aprovado'; if (v >= 3) return 'recuperacao'; return 'reprovado';
}

function escGPA(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderGPA() {
  const container = document.getElementById('gpa-content');
  if (!container) return;
  gpaLoad();

  const gpa = calcGlobalGPA();
  const gpaStr = gpa !== null ? gpa.toFixed(2) : '—';
  const gpaStatus = gradeStatus(gpa);

  let totalD=0, gradedC=0, approvedC=0;
  gpaData.semesters.forEach(sem => sem.disciplines.forEach(d => {
    totalD++;
    if (d.grade !== null && d.grade !== '' && !isNaN(parseFloat(d.grade))) { gradedC++; if (parseFloat(d.grade)>=5) approvedC++; }
  }));

  const statusLabel = {'aprovado':'✓ Aprovado','recuperacao':'⚠ Recuperação','reprovado':'✕ Reprovado'};

  container.innerHTML = `
    <div class="gpa-overview">
      <div class="gpa-big-card">
        <div class="gpa-big-num">${gpaStr}</div>
        <div class="gpa-big-label">Média Geral (GPA)</div>
        ${gpa !== null ? `<div class="gpa-status-pill gpa-status-${gpaStatus}">${statusLabel[gpaStatus]||''}</div>` : ''}
      </div>
      <div class="gpa-big-card">
        <div class="gpa-big-num" style="font-size:38px">${gradedC}/${totalD}</div>
        <div class="gpa-big-label">Disciplinas com nota</div>
      </div>
      <div class="gpa-big-card">
        <div class="gpa-big-num" style="font-size:38px">${approvedC}</div>
        <div class="gpa-big-label">Aprovações registradas</div>
      </div>
    </div>
    ${buildGPAChart()}
    <div class="gpa-semesters" id="gpa-semesters">
      ${gpaData.semesters.map(sem => buildSemBlock(sem)).join('')}
    </div>
    <div class="gpa-actions-row">
      <button class="gpa-add-semester-btn" onclick="gpaAddSemester()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar semestre
      </button>
      <button class="gpa-restore-btn" onclick="gpaOpenRestoreModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5.5"/></svg>
        Restaurar padrão
      </button>
    </div>
  `;

  const statEl = document.getElementById('stat-gpa');
  if (statEl) statEl.textContent = gpa !== null ? gpa.toFixed(2) : '—';
}

function buildGPAChart() {
  const avgs = gpaData.semesters.map(s => ({label:s.label,avg:calcSemAvg(s)})).filter(s=>s.avg!==null);
  if (avgs.length < 2) return '';
  const W=580,H=120,pL=32,pR=16,pT=10,pB=28,cW=W-pL-pR,cH=H-pT-pB;
  const pts = avgs.map((s,i) => ({ x:pL+(i/(avgs.length-1))*cW, y:pT+(1-s.avg/10)*cH, avg:s.avg, label:s.label }));
  const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${pT+cH} ${pts.map(p=>`L${p.x},${p.y}`).join(' ')} L${pts[pts.length-1].x},${pT+cH} Z`;
  const grid = [3,5,7,10].map(v => { const y=pT+(1-v/10)*cH; return `<line x1="${pL}" y1="${y}" x2="${W-pR}" y2="${y}" stroke="var(--glass-border)" stroke-width="1" stroke-dasharray="4 4"/><text x="${pL-4}" y="${y+3.5}" text-anchor="end" font-family="var(--font-mono)" font-size="9" fill="var(--text-dim)">${v}</text>`; }).join('');
  const dots = pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="2.5"/><text x="${p.x}" y="${p.y-9}" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--text-muted)">${p.avg.toFixed(1)}</text>`).join('');
  const labels = pts.map(p=>`<text x="${p.x}" y="${H-3}" text-anchor="middle" font-family="var(--font-mono)" font-size="9" fill="var(--text-dim)">${p.label.replace('º Semestre','º')}</text>`).join('');
  return `<div class="gpa-chart-wrap">
    <div class="section-title" style="margin-bottom:12px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Evolução de médias
    </div>
    <div class="card" style="padding:18px">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
        <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
        ${grid}<path d="${area}" fill="url(#ag)"/>
        <polyline points="${polyline}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}${labels}
      </svg>
    </div>
  </div>`;
}

function buildSemBlock(sem) {
  const avg = calcSemAvg(sem);
  const avgStr = avg !== null ? avg.toFixed(2) : '—';
  const avgClass = avg !== null ? gradeStatus(avg) : '';
  return `<div class="gpa-semester-block" id="gpa-sem-${sem.id}">
    <div class="gpa-semester-header" onclick="gpaToggleSem('${sem.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform:rotate(${sem.collapsed?'-90deg':'0deg'});transition:transform .2s ease;color:var(--text-dim)"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="gpa-semester-title">${escGPA(sem.label)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="gpa-semester-avg ${avgClass}">Média: ${avgStr}</span>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();gpaDeleteSemester('${sem.id}')" style="padding:3px 8px;font-size:11px;opacity:.5" title="Remover semestre">✕</button>
      </div>
    </div>
    <div class="gpa-semester-body ${sem.collapsed?'collapsed':''}" id="gpa-body-${sem.id}">
      ${sem.disciplines.map(d => buildDiscRow(sem.id, d)).join('')}
      <button class="gpa-add-btn" onclick="gpaAddDiscipline('${sem.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar disciplina
      </button>
    </div>
  </div>`;
}

function buildDiscRow(semId, d) {
  const st = gradeStatus(d.grade);
  const pct = d.grade !== null ? Math.min(100,(parseFloat(d.grade)/10)*100) : 0;
  const barColor = st==='aprovado'?'var(--success)':st==='reprovado'?'var(--danger)':st==='recuperacao'?'var(--warning)':'var(--primary)';
  return `<div class="gpa-discipline-row" id="gpa-disc-${d.id}">
    <div class="gpa-discipline-name">${escGPA(d.name)}</div>
    <div class="gpa-bar-wrap"><div class="gpa-bar-fill" id="bar-${d.id}" style="width:${pct}%;background:${pct?barColor:'transparent'}"></div></div>
    <span class="gpa-discipline-credits">${d.credits}cr</span>
    <input type="number" min="0" max="10" step="0.1" class="gpa-note-input ${st}" id="inp-${d.id}" value="${d.grade!==null&&d.grade!==''?d.grade:''}" placeholder="—" onchange="gpaUpdateGrade('${semId}','${d.id}',this.value)" title="${escGPA(d.name)}"/>
    <button class="kanban-action-btn delete" onclick="gpaDeleteDiscipline('${semId}','${d.id}')" title="Remover">🗑</button>
  </div>`;
}

function gpaToggleSem(semId) {
  const sem = gpaData.semesters.find(s=>s.id===semId); if (!sem) return;
  sem.collapsed = !sem.collapsed; gpaSave();
  const body = document.getElementById(`gpa-body-${semId}`);
  if (body) body.classList.toggle('collapsed', sem.collapsed);
  const arrow = document.querySelector(`#gpa-sem-${semId} .gpa-semester-header svg`);
  if (arrow) arrow.style.transform = `rotate(${sem.collapsed?'-90deg':'0deg'})`;
}

function gpaUpdateGrade(semId, discId, value) {
  const sem = gpaData.semesters.find(s=>s.id===semId); if (!sem) return;
  const disc = sem.disciplines.find(d=>d.id===discId); if (!disc) return;
  const v = String(value).trim();
  disc.grade = v===''? null : Math.min(10,Math.max(0,parseFloat(v)||0));
  gpaSave();

  // Update bar
  const bar = document.getElementById(`bar-${discId}`);
  const inp = document.getElementById(`inp-${discId}`);
  const st = gradeStatus(disc.grade);
  const pct = disc.grade !== null ? Math.min(100,(disc.grade/10)*100) : 0;
  const barColor = st==='aprovado'?'var(--success)':st==='reprovado'?'var(--danger)':st==='recuperacao'?'var(--warning)':'var(--primary)';
  if (bar) { bar.style.width=pct+'%'; bar.style.background=pct?barColor:'transparent'; }
  if (inp) inp.className = `gpa-note-input ${st}`;

  // Update semester avg
  const avg = calcSemAvg(sem);
  const avgEl = document.querySelector(`#gpa-sem-${semId} .gpa-semester-avg`);
  if (avgEl) { avgEl.textContent=`Média: ${avg!==null?avg.toFixed(2):'—'}`; avgEl.className=`gpa-semester-avg ${avg!==null?gradeStatus(avg):''}`; }

  // Update global
  const gpa = calcGlobalGPA();
  const gpaEl = document.querySelector('.gpa-big-num');
  if (gpaEl) gpaEl.textContent = gpa!==null?gpa.toFixed(2):'—';
  const statusEl = document.querySelector('.gpa-status-pill');
  if (statusEl && gpa!==null) {
    const s=gradeStatus(gpa);
    const l={'aprovado':'✓ Aprovado','recuperacao':'⚠ Recuperação','reprovado':'✕ Reprovado'};
    statusEl.textContent=l[s]||''; statusEl.className=`gpa-status-pill gpa-status-${s}`;
  }
  const statEl = document.getElementById('stat-gpa');
  if (statEl) statEl.textContent = gpa!==null?gpa.toFixed(2):'—';
}

function gpaAddDiscipline(semId) {
  const name = prompt('Nome da disciplina:'); if (!name||!name.trim()) return;
  const credStr = prompt('Créditos (padrão: 4):', '4');
  const credits = parseInt(credStr)||4;
  const sem = gpaData.semesters.find(s=>s.id===semId); if (!sem) return;
  sem.disciplines.push({ id:`d_${Date.now()}`, name:name.trim(), credits, grade:null });
  gpaSave(); renderGPA(); showToast('Disciplina adicionada!');
}

function gpaDeleteDiscipline(semId, discId) {
  if (!confirm('Remover esta disciplina?')) return;
  const sem = gpaData.semesters.find(s=>s.id===semId); if (!sem) return;
  sem.disciplines = sem.disciplines.filter(d=>d.id!==discId);
  gpaSave(); renderGPA(); showToast('Disciplina removida.');
}

function gpaAddSemester() {
  const n = gpaData.semesters.length+1;
  gpaData.semesters.push({ id:`s_${Date.now()}`, label:`${n}º Semestre`, collapsed:false, disciplines:[] });
  gpaSave(); renderGPA(); showToast('Semestre adicionado!');
}

function gpaDeleteSemester(semId) {
  if (!confirm('Remover este semestre e todas as notas?')) return;
  gpaData.semesters = gpaData.semesters.filter(s=>s.id!==semId);
  gpaSave(); renderGPA(); showToast('Semestre removido.');
}

async function initGPA() {
  gpaLoad();
  // On first use, if no saved data, load real discipline names
  if (!localStorage.getItem(GPA_KEY)) {
    const defaults = await gpaLoadDefaults();
    gpaData = { semesters: defaults };
    gpaSave();
  }
  renderGPA();
  // Show and init fluxograma section
  const fluxTitle = document.getElementById('fluxograma-section-title');
  if (fluxTitle) fluxTitle.style.display = '';
  if (typeof initFluxograma === 'function') initFluxograma();
}

// ===== RESTORE MODAL =====
async function gpaOpenRestoreModal() {
  const defaults = await gpaLoadDefaults();

  document.getElementById('gpa-restore-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'gpa-restore-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;z-index:9999';

  const semRows = defaults.map((sem, i) => {
    const saved = gpaData.semesters.find(s => s.id === sem.id);
    const hasGrades = saved && saved.disciplines.some(d => d.grade !== null && d.grade !== '');
    return `
      <div class="gpa-restore-row" id="restore-row-${sem.id}">
        <div class="gpa-restore-row-info">
          <span class="gpa-restore-sem-label">${escGPA(sem.label)}</span>
          <span class="gpa-restore-disc-count">${sem.disciplines.length} disciplina${sem.disciplines.length !== 1 ? 's' : ''}</span>
          ${hasGrades ? '<span class="gpa-restore-warn">⚠ tem notas salvas</span>' : ''}
        </div>
        <button class="gpa-restore-one-btn" onclick="gpaRestoreOneSemester('${sem.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5.5"/></svg>
          Restaurar
        </button>
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="modal-box" style="max-width:480px;width:100%">
      <button class="modal-close" onclick="document.getElementById('gpa-restore-overlay').remove()">&#215;</button>
      <div style="margin-bottom:18px">
        <h2 style="font-size:17px;font-weight:700;margin-bottom:4px">Restaurar semestres padrão</h2>
        <p style="font-size:13px;color:var(--text-muted)">Restaure um semestre específico ou todos de uma vez. As disciplinas voltam ao padrão do curso — <strong>notas serão apagadas</strong>.</p>
      </div>
      <div class="gpa-restore-list">${semRows}</div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--glass-border);display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('gpa-restore-overlay').remove()">Cancelar</button>
        <button class="gpa-restore-all-btn" onclick="gpaRestoreAllSemesters()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5.5"/></svg>
          Restaurar todos os 8 semestres
        </button>
      </div>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function gpaRestoreOneSemester(semId) {
  const defaults = await gpaLoadDefaults();
  const def = defaults.find(s => s.id === semId);
  if (!def) return;

  const saved = gpaData.semesters.find(s => s.id === semId);
  const hasGrades = saved && saved.disciplines.some(d => d.grade !== null && d.grade !== '');
  if (hasGrades && !confirm(`Restaurar "${def.label}"? As notas salvas serão apagadas.`)) return;

  const restored = JSON.parse(JSON.stringify(def));
  // preserve grades if user didn't confirm wipe (already confirmed above if hasGrades)
  const idx = gpaData.semesters.findIndex(s => s.id === semId);
  if (idx >= 0) {
    restored.collapsed = gpaData.semesters[idx].collapsed;
    gpaData.semesters[idx] = restored;
  } else {
    gpaData.semesters.push(restored);
  }

  gpaSave();
  document.getElementById('gpa-restore-overlay')?.remove();
  renderGPA();
  showToast(`${def.label} restaurado para o padrão!`);
}

async function gpaRestoreAllSemesters() {
  const hasAnyGrade = gpaData.semesters.some(s => s.disciplines.some(d => d.grade !== null && d.grade !== ''));
  if (hasAnyGrade && !confirm('Restaurar TODOS os 8 semestres? Todas as notas salvas serão apagadas.')) return;

  const defaults = await gpaLoadDefaults();
  gpaData.semesters = JSON.parse(JSON.stringify(defaults));
  gpaSave();
  document.getElementById('gpa-restore-overlay')?.remove();
  renderGPA();
  showToast('Todos os semestres restaurados para o padrão do curso!');
}
