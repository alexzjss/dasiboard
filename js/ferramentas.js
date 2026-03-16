// ===== FERRAMENTAS =====

let currentTool = null;

// Pomodoro state
let pomodoroTimer = null;
let pomodoroState = 'idle'; // idle | focus | break | longbreak
let pomodoroSecondsLeft = 0;
let pomodoroCyclesDone = 0;
let pomodoroConfig = { focus: 25, shortBreak: 5, longBreak: 15, cycles: 4 };

// Stopwatch state
let stopwatchTimer = null;
let stopwatchMs = 0;
let stopwatchLaps = [];
let stopwatchRunning = false;

function openTool(name) {
  currentTool = name;
  const grid = document.getElementById('tools-selector-grid');
  const panel = document.getElementById('tool-panel');
  const title = document.getElementById('tool-panel-title');
  const content = document.getElementById('tool-panel-content');

  // highlight selected card
  document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`[data-tool="${name}"]`);
  if (card) card.classList.add('active');

  grid.style.display = 'none';
  panel.classList.remove('hidden');

  const toolMeta = {
    pomodoro:     { label: '🍅 Pomodoro' },
    notas:        { label: '📝 Notas Rápidas' },
    checklist:    { label: '✅ Checklist' },
    sorteio:      { label: '🎲 Sorteio' },
    calculadora:  { label: '🧮 Média de Notas' },
    stopwatch:    { label: '⏱️ Cronômetro' },
    conversor:    { label: '🔄 Conversor de Unidades' },
    citacoes:     { label: '📖 Gerador de Citação ABNT' },
    plagio:       { label: '🔍 Checklist Anti-Plágio' },
    flashcard:    { label: '🃏 Flashcards' },
  };
  title.textContent = toolMeta[name]?.label || name;

  const renderers = {
    pomodoro:    renderPomodoro,
    notas:       renderNotas,
    checklist:   renderChecklist,
    sorteio:     renderSorteio,
    calculadora: renderCalculadora,
    stopwatch:   renderStopwatch,
    conversor:   renderConversor,
    citacoes:    renderCitacoes,
    plagio:      renderPlagio,
    flashcard:   renderFlashcard,
  };

  content.innerHTML = '';
  renderers[name]?.(content);
}

function closeTool() {
  stopAllTimers();
  currentTool = null;
  document.getElementById('tools-selector-grid').style.display = '';
  document.getElementById('tool-panel').classList.add('hidden');
  document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('active'));
}

function stopAllTimers() {
  if (pomodoroTimer) { clearInterval(pomodoroTimer); pomodoroTimer = null; }
  if (stopwatchTimer) { clearInterval(stopwatchTimer); stopwatchTimer = null; }
  stopwatchRunning = false;
}

// ============================
// 🍅 POMODORO
// ============================
function renderPomodoro(container) {
  pomodoroState = 'idle';
  pomodoroCyclesDone = 0;
  pomodoroSecondsLeft = pomodoroConfig.focus * 60;

  container.innerHTML = `
    <div class="pomo-wrap">
      <!-- Config panel -->
      <div class="pomo-config card">
        <div class="card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Configuração
        </div>
        <div class="pomo-config-grid">
          <label class="pomo-label">
            Foco (min)
            <input type="number" id="pomo-focus" class="pomo-input" value="${pomodoroConfig.focus}" min="1" max="90" onchange="pomoCfgChange()">
          </label>
          <label class="pomo-label">
            Pausa curta (min)
            <input type="number" id="pomo-short" class="pomo-input" value="${pomodoroConfig.shortBreak}" min="1" max="30" onchange="pomoCfgChange()">
          </label>
          <label class="pomo-label">
            Pausa longa (min)
            <input type="number" id="pomo-long" class="pomo-input" value="${pomodoroConfig.longBreak}" min="1" max="60" onchange="pomoCfgChange()">
          </label>
          <label class="pomo-label">
            Ciclos até pausa longa
            <input type="number" id="pomo-cycles" class="pomo-input" value="${pomodoroConfig.cycles}" min="1" max="10" onchange="pomoCfgChange()">
          </label>
        </div>
      </div>

      <!-- Timer display -->
      <div class="pomo-timer-wrap">
        <div class="pomo-ring-wrap">
          <svg class="pomo-ring" viewBox="0 0 200 200">
            <circle class="pomo-ring-bg" cx="100" cy="100" r="88"/>
            <circle class="pomo-ring-fill" id="pomo-ring-fill" cx="100" cy="100" r="88"
              stroke-dasharray="553" stroke-dashoffset="0"/>
          </svg>
          <div class="pomo-inner">
            <div class="pomo-phase" id="pomo-phase">Pronto</div>
            <div class="pomo-time" id="pomo-time">${formatPomoTime(pomodoroConfig.focus * 60)}</div>
            <div class="pomo-cycles-done" id="pomo-cycles-done">Ciclo 0 / ${pomodoroConfig.cycles}</div>
          </div>
        </div>

        <div class="pomo-controls">
          <button class="btn btn-primary pomo-btn" id="pomo-start-btn" onclick="pomodoroToggle()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Iniciar
          </button>
          <button class="btn btn-ghost pomo-btn" onclick="pomodoroReset()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.33"/></svg>
            Reiniciar
          </button>
          <button class="btn btn-ghost pomo-btn" onclick="pomodoroSkip()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            Pular
          </button>
        </div>

        <!-- Cycle dots -->
        <div class="pomo-dots" id="pomo-dots"></div>
      </div>
    </div>
  `;

  updatePomoDots();
}

function pomoCfgChange() {
  pomodoroConfig.focus      = parseInt(document.getElementById('pomo-focus')?.value) || 25;
  pomodoroConfig.shortBreak = parseInt(document.getElementById('pomo-short')?.value) || 5;
  pomodoroConfig.longBreak  = parseInt(document.getElementById('pomo-long')?.value) || 15;
  pomodoroConfig.cycles     = parseInt(document.getElementById('pomo-cycles')?.value) || 4;

  if (pomodoroState === 'idle') {
    pomodoroSecondsLeft = pomodoroConfig.focus * 60;
    updatePomoDisplay();
  }
  updatePomoDots();
}

function pomodoroToggle() {
  if (pomodoroState === 'idle') {
    pomodoroState = 'focus';
    pomodoroSecondsLeft = pomodoroConfig.focus * 60;
  }

  const btn = document.getElementById('pomo-start-btn');
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Retomar`;
  } else {
    pomodoroTimer = setInterval(pomodoroTick, 1000);
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
  }
}

function pomodoroTick() {
  pomodoroSecondsLeft--;
  updatePomoDisplay();

  if (pomodoroSecondsLeft <= 0) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;

    // Beep notification
    playBeep();

    if (pomodoroState === 'focus') {
      pomodoroCyclesDone++;
      updatePomoDots();
      if (pomodoroCyclesDone % pomodoroConfig.cycles === 0) {
        pomodoroState = 'longbreak';
        pomodoroSecondsLeft = pomodoroConfig.longBreak * 60;
      } else {
        pomodoroState = 'break';
        pomodoroSecondsLeft = pomodoroConfig.shortBreak * 60;
      }
    } else {
      pomodoroState = 'focus';
      pomodoroSecondsLeft = pomodoroConfig.focus * 60;
    }

    updatePomoDisplay();
    // Auto-start next phase
    pomodoroTimer = setInterval(pomodoroTick, 1000);
    const btn = document.getElementById('pomo-start-btn');
    if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
  }
}

function pomodoroReset() {
  clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  pomodoroState = 'idle';
  pomodoroCyclesDone = 0;
  pomodoroSecondsLeft = pomodoroConfig.focus * 60;
  updatePomoDisplay();
  updatePomoDots();
  const btn = document.getElementById('pomo-start-btn');
  if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar`;
}

function pomodoroSkip() {
  clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  if (pomodoroState === 'focus') {
    pomodoroCyclesDone++;
    updatePomoDots();
    pomodoroState = (pomodoroCyclesDone % pomodoroConfig.cycles === 0) ? 'longbreak' : 'break';
    pomodoroSecondsLeft = pomodoroState === 'longbreak' ? pomodoroConfig.longBreak * 60 : pomodoroConfig.shortBreak * 60;
  } else {
    pomodoroState = 'focus';
    pomodoroSecondsLeft = pomodoroConfig.focus * 60;
  }
  updatePomoDisplay();
  const btn = document.getElementById('pomo-start-btn');
  if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar`;
}

function updatePomoDisplay() {
  const timeEl = document.getElementById('pomo-time');
  const phaseEl = document.getElementById('pomo-phase');
  const cyclesEl = document.getElementById('pomo-cycles-done');
  const ring = document.getElementById('pomo-ring-fill');

  if (!timeEl) return;

  const phases = { idle: 'Pronto', focus: '🍅 Foco', break: '☕ Pausa', longbreak: '🌿 Pausa Longa' };
  const phaseColors = { idle: 'var(--primary)', focus: 'var(--danger)', break: 'var(--success)', longbreak: 'var(--info)' };
  const totalSeconds = {
    idle: pomodoroConfig.focus * 60,
    focus: pomodoroConfig.focus * 60,
    break: pomodoroConfig.shortBreak * 60,
    longbreak: pomodoroConfig.longBreak * 60
  }[pomodoroState];

  timeEl.textContent = formatPomoTime(pomodoroSecondsLeft);
  if (phaseEl) { phaseEl.textContent = phases[pomodoroState]; phaseEl.style.color = phaseColors[pomodoroState]; }
  if (cyclesEl) cyclesEl.textContent = `Ciclo ${pomodoroCyclesDone} / ${pomodoroConfig.cycles}`;

  if (ring) {
    const circumference = 553;
    const progress = pomodoroSecondsLeft / totalSeconds;
    ring.style.strokeDashoffset = circumference * (1 - progress);
    ring.style.stroke = phaseColors[pomodoroState];
  }
}

function updatePomoDots() {
  const dots = document.getElementById('pomo-dots');
  if (!dots) return;
  dots.innerHTML = Array.from({ length: pomodoroConfig.cycles }, (_, i) =>
    `<div class="pomo-dot ${i < pomodoroCyclesDone % pomodoroConfig.cycles || (pomodoroCyclesDone > 0 && i < pomodoroConfig.cycles && pomodoroCyclesDone % pomodoroConfig.cycles === 0 && pomodoroState !== 'focus') ? 'done' : ''}"></div>`
  ).join('');
}

function formatPomoTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch(e) {}
}

// ============================
// 📝 NOTAS RÁPIDAS
// ============================
function renderNotas(container) {
  const saved = localStorage.getItem('dasi-notas') || '';
  container.innerHTML = `
    <div class="notas-wrap">
      <div class="notas-toolbar">
        <span class="notas-count" id="notas-count">${saved.length} caracteres</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost" onclick="notasClear()" title="Limpar notas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Limpar
          </button>
          <button class="btn btn-primary" onclick="notasCopy()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar
          </button>
        </div>
      </div>
      <textarea class="notas-textarea" id="notas-textarea" placeholder="Digite suas anotações aqui... Salvo automaticamente no navegador."
        oninput="notasSave(this)">${saved}</textarea>
    </div>
  `;
}

function notasSave(el) {
  localStorage.setItem('dasi-notas', el.value);
  const c = document.getElementById('notas-count');
  if (c) c.textContent = el.value.length + ' caracteres';
}

function notasClear() {
  if (!confirm('Limpar todas as notas?')) return;
  localStorage.removeItem('dasi-notas');
  const ta = document.getElementById('notas-textarea');
  if (ta) { ta.value = ''; notasSave(ta); }
}

function notasCopy() {
  const ta = document.getElementById('notas-textarea');
  if (!ta) return;
  navigator.clipboard.writeText(ta.value).then(() => {
    showToast('Notas copiadas!');
  });
}

// ============================
// ✅ CHECKLIST
// ============================
let checklistItems = JSON.parse(localStorage.getItem('dasi-checklist') || '[]');

function renderChecklist(container) {
  container.innerHTML = `
    <div class="checklist-wrap">
      <div class="checklist-add">
        <input type="text" id="checklist-input" class="pomo-input" placeholder="Nova tarefa... (Enter para adicionar)"
          onkeydown="if(event.key==='Enter') checklistAdd()" style="flex:1;font-size:14px;">
        <button class="btn btn-primary" onclick="checklistAdd()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar
        </button>
      </div>
      <div class="checklist-progress-bar-wrap">
        <div class="checklist-progress-bar" id="checklist-progress"></div>
      </div>
      <div class="checklist-stats" id="checklist-stats"></div>
      <div class="checklist-list" id="checklist-list"></div>
      <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
        <button class="btn btn-ghost" onclick="checklistClearDone()">Remover concluídas</button>
        <button class="btn btn-ghost" onclick="checklistClearAll()">Limpar tudo</button>
      </div>
    </div>
  `;
  renderChecklistItems();
}

function renderChecklistItems() {
  const list = document.getElementById('checklist-list');
  const progress = document.getElementById('checklist-progress');
  const stats = document.getElementById('checklist-stats');
  if (!list) return;

  const done = checklistItems.filter(i => i.done).length;
  const total = checklistItems.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (progress) progress.style.width = pct + '%';
  if (stats) stats.textContent = total ? `${done} de ${total} concluída${done !== 1 ? 's' : ''} (${pct}%)` : 'Nenhuma tarefa adicionada';

  if (!total) { list.innerHTML = '<div class="no-events-msg">Nenhuma tarefa ainda.</div>'; return; }

  list.innerHTML = checklistItems.map((item, i) => `
    <div class="checklist-item ${item.done ? 'done' : ''}" id="cli-${i}">
      <button class="checklist-check" onclick="checklistToggle(${i})">
        ${item.done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>
      <span class="checklist-text">${escapeHtml(item.text)}</span>
      <button class="checklist-del" onclick="checklistRemove(${i})" title="Remover">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}

function checklistAdd() {
  const inp = document.getElementById('checklist-input');
  const text = inp?.value.trim();
  if (!text) return;
  checklistItems.push({ text, done: false });
  checklistSave();
  inp.value = '';
  renderChecklistItems();
}

function checklistToggle(i) {
  checklistItems[i].done = !checklistItems[i].done;
  checklistSave();
  renderChecklistItems();
}

function checklistRemove(i) {
  checklistItems.splice(i, 1);
  checklistSave();
  renderChecklistItems();
}

function checklistClearDone() {
  checklistItems = checklistItems.filter(i => !i.done);
  checklistSave();
  renderChecklistItems();
}

function checklistClearAll() {
  if (!confirm('Limpar toda a checklist?')) return;
  checklistItems = [];
  checklistSave();
  renderChecklistItems();
}

function checklistSave() {
  localStorage.setItem('dasi-checklist', JSON.stringify(checklistItems));
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================
// 🎲 SORTEIO
// ============================
function renderSorteio(container) {
  container.innerHTML = `
    <div class="sorteio-wrap">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">Lista de participantes</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Um por linha. Pode ser nomes, disciplinas, temas — qualquer coisa.</p>
        <textarea class="notas-textarea" id="sorteio-lista" placeholder="Ana&#10;Bruno&#10;Carlos&#10;Diana&#10;..." style="height:140px;"></textarea>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">Opções</div>
        <div class="pomo-config-grid">
          <label class="pomo-label">
            Quantidade a sortear
            <input type="number" id="sorteio-qtd" class="pomo-input" value="1" min="1">
          </label>
          <label class="pomo-label">
            Modo
            <select id="sorteio-modo" class="pomo-input">
              <option value="individual">Nomes individuais</option>
              <option value="grupos">Dividir em grupos</option>
            </select>
          </label>
        </div>
        <button class="btn btn-primary" style="margin-top:16px;width:100%;" onclick="executarSorteio()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><circle cx="18" cy="18" r="3"/><line x1="18" y1="15" x2="18" y2="15.01"/></svg>
          🎲 Sortear!
        </button>
      </div>

      <div id="sorteio-resultado" class="sorteio-resultado hidden"></div>
    </div>
  `;
}

function executarSorteio() {
  const listaRaw = document.getElementById('sorteio-lista')?.value || '';
  const lista = listaRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const qtd = parseInt(document.getElementById('sorteio-qtd')?.value) || 1;
  const modo = document.getElementById('sorteio-modo')?.value;
  const res = document.getElementById('sorteio-resultado');

  if (!lista.length) { showToast('Adicione itens na lista!'); return; }

  res.classList.remove('hidden');
  res.style.animation = 'none';
  void res.offsetWidth;
  res.style.animation = '';

  if (modo === 'grupos') {
    const shuffled = [...lista].sort(() => Math.random() - 0.5);
    const grupos = [];
    const size = Math.ceil(shuffled.length / qtd);
    for (let i = 0; i < qtd; i++) {
      grupos.push(shuffled.slice(i * size, (i + 1) * size));
    }
    res.innerHTML = `
      <div class="card-title" style="margin-bottom:16px;">🎯 Grupos formados</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
        ${grupos.map((g, i) => `
          <div class="sorteio-grupo-card">
            <div class="sorteio-grupo-label">Grupo ${i + 1}</div>
            ${g.map(n => `<div class="sorteio-nome">${escapeHtml(n)}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    const real = Math.min(qtd, lista.length);
    const sorteados = [...lista].sort(() => Math.random() - 0.5).slice(0, real);
    res.innerHTML = `
      <div class="card-title" style="margin-bottom:16px;">🎯 ${real === 1 ? 'Sorteado' : 'Sorteados'}</div>
      <div class="sorteio-nomes">
        ${sorteados.map((n, i) => `
          <div class="sorteio-nome-big" style="animation-delay:${i * 0.08}s">${escapeHtml(n)}</div>
        `).join('')}
      </div>
    `;
  }
}

// ============================
// 🧮 CALCULADORA DE MÉDIAS
// ============================
let calcDisciplinas = JSON.parse(localStorage.getItem('dasi-calc') || '[]');

function renderCalculadora(container) {
  container.innerHTML = `
    <div class="calc-wrap">
      <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
        <input type="text" id="calc-nome" class="pomo-input" placeholder="Nome da disciplina" style="flex:1;min-width:140px;">
        <button class="btn btn-primary" onclick="calcAdd()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar
        </button>
        <button class="btn btn-ghost" onclick="calcClear()">Limpar</button>
      </div>
      <div id="calc-list"></div>
      <div id="calc-summary"></div>
    </div>
  `;
  renderCalcList();
}

function renderCalcList() {
  const list = document.getElementById('calc-list');
  const summary = document.getElementById('calc-summary');
  if (!list) return;

  if (!calcDisciplinas.length) {
    list.innerHTML = '<div class="no-events-msg">Nenhuma disciplina adicionada.</div>';
    if (summary) summary.innerHTML = '';
    return;
  }

  list.innerHTML = calcDisciplinas.map((d, i) => `
    <div class="calc-item card" style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-weight:600;font-size:15px;">${escapeHtml(d.nome)}</div>
        <button class="checklist-del" onclick="calcRemove(${i})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="calc-notas-grid">
        ${d.notas.map((n, j) => `
          <div class="calc-nota-row">
            <input type="text" class="pomo-input" placeholder="Avaliação ${j+1}" value="${escapeHtml(n.label)}"
              style="flex:1;" oninput="calcUpdateLabel(${i},${j},this.value)">
            <input type="number" class="pomo-input calc-nota-input" placeholder="Nota" value="${n.nota !== '' ? n.nota : ''}"
              min="0" max="10" step="0.1" oninput="calcUpdateNota(${i},${j},this.value)">
            <input type="number" class="pomo-input calc-peso-input" placeholder="Peso" value="${n.peso !== '' ? n.peso : ''}"
              min="0" step="0.1" oninput="calcUpdatePeso(${i},${j},this.value)">
            <button class="checklist-del" onclick="calcRemoveNota(${i},${j})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-ghost" style="margin-top:10px;font-size:12px;" onclick="calcAddNota(${i})">+ Adicionar nota</button>
      <div class="calc-media ${calcGetMedia(d) >= 5 ? 'aprovado' : calcGetMedia(d) < 0 ? '' : 'reprovado'}" id="calc-media-${i}">
        ${calcGetMedia(d) >= 0 ? `Média: <strong>${calcGetMedia(d).toFixed(2)}</strong> — ${calcGetMedia(d) >= 5 ? '✅ Aprovado' : '❌ Reprovado'}` : 'Insira notas e pesos'}
      </div>
    </div>
  `).join('');

  // Summary
  const mediaGeral = calcDisciplinas.map(d => calcGetMedia(d)).filter(m => m >= 0);
  if (mediaGeral.length) {
    const avg = mediaGeral.reduce((a, b) => a + b, 0) / mediaGeral.length;
    if (summary) summary.innerHTML = `
      <div class="card" style="text-align:center;padding:20px;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Média Geral</div>
        <div style="font-family:var(--font-display);font-size:42px;font-weight:800;color:${avg >= 5 ? 'var(--success)' : 'var(--danger)'}">${avg.toFixed(2)}</div>
      </div>
    `;
  } else if (summary) summary.innerHTML = '';
}

function calcGetMedia(d) {
  const valid = d.notas.filter(n => n.nota !== '' && n.peso !== '');
  if (!valid.length) return -1;
  const totalPeso = valid.reduce((a, n) => a + parseFloat(n.peso), 0);
  if (!totalPeso) return -1;
  const soma = valid.reduce((a, n) => a + parseFloat(n.nota) * parseFloat(n.peso), 0);
  return soma / totalPeso;
}

function calcAdd() {
  const nome = document.getElementById('calc-nome')?.value.trim();
  if (!nome) return;
  calcDisciplinas.push({ nome, notas: [{ label: 'P1', nota: '', peso: '1' }, { label: 'P2', nota: '', peso: '1' }] });
  calcSave();
  document.getElementById('calc-nome').value = '';
  renderCalcList();
}

function calcRemove(i) { calcDisciplinas.splice(i, 1); calcSave(); renderCalcList(); }
function calcAddNota(i) { calcDisciplinas[i].notas.push({ label: `Av ${calcDisciplinas[i].notas.length + 1}`, nota: '', peso: '1' }); calcSave(); renderCalcList(); }
function calcRemoveNota(i, j) { calcDisciplinas[i].notas.splice(j, 1); calcSave(); renderCalcList(); }
function calcUpdateLabel(i, j, v) { calcDisciplinas[i].notas[j].label = v; calcSave(); }
function calcUpdateNota(i, j, v) { calcDisciplinas[i].notas[j].nota = v; calcSave(); renderCalcList(); }
function calcUpdatePeso(i, j, v) { calcDisciplinas[i].notas[j].peso = v; calcSave(); renderCalcList(); }
function calcClear() { if (!confirm('Limpar tudo?')) return; calcDisciplinas = []; calcSave(); renderCalcList(); }
function calcSave() { localStorage.setItem('dasi-calc', JSON.stringify(calcDisciplinas)); }

// ============================
// ⏱️ CRONÔMETRO
// ============================
function renderStopwatch(container) {
  stopwatchMs = 0; stopwatchLaps = []; stopwatchRunning = false;
  clearInterval(stopwatchTimer);

  container.innerHTML = `
    <div class="stopwatch-wrap">
      <div class="stopwatch-display" id="sw-display">00:00.000</div>
      <div class="pomo-controls">
        <button class="btn btn-primary pomo-btn" id="sw-start-btn" onclick="swToggle()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Iniciar
        </button>
        <button class="btn btn-ghost pomo-btn" onclick="swLap()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Volta
        </button>
        <button class="btn btn-ghost pomo-btn" onclick="swReset()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.33"/></svg>
          Zerar
        </button>
      </div>
      <div class="sw-laps" id="sw-laps"></div>
    </div>
  `;
}

function swToggle() {
  const btn = document.getElementById('sw-start-btn');
  if (stopwatchRunning) {
    clearInterval(stopwatchTimer);
    stopwatchRunning = false;
    if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Retomar`;
  } else {
    const start = Date.now() - stopwatchMs;
    stopwatchTimer = setInterval(() => {
      stopwatchMs = Date.now() - start;
      const d = document.getElementById('sw-display');
      if (d) d.textContent = formatSw(stopwatchMs);
    }, 30);
    stopwatchRunning = true;
    if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
  }
}

function swLap() {
  if (!stopwatchRunning && stopwatchMs === 0) return;
  stopwatchLaps.push(stopwatchMs);
  const laps = document.getElementById('sw-laps');
  if (laps) {
    const prev = stopwatchLaps.length > 1 ? stopwatchLaps[stopwatchLaps.length - 2] : 0;
    const delta = stopwatchMs - prev;
    laps.innerHTML = stopwatchLaps.map((l, i) => {
      const p = i > 0 ? stopwatchLaps[i - 1] : 0;
      return `<div class="sw-lap-item"><span class="sw-lap-num">Volta ${i + 1}</span><span class="sw-lap-delta">+${formatSw(l - p)}</span><span>${formatSw(l)}</span></div>`;
    }).reverse().join('');
  }
}

function swReset() {
  clearInterval(stopwatchTimer); stopwatchRunning = false; stopwatchMs = 0; stopwatchLaps = [];
  const d = document.getElementById('sw-display'); if (d) d.textContent = '00:00.000';
  const laps = document.getElementById('sw-laps'); if (laps) laps.innerHTML = '';
  const btn = document.getElementById('sw-start-btn');
  if (btn) btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar`;
}

function formatSw(ms) {
  const m = Math.floor(ms / 60000).toString().padStart(2, '0');
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const ms3 = (ms % 1000).toString().padStart(3, '0');
  return `${m}:${s}.${ms3}`;
}

// =====================================================================
// NOVA FERRAMENTA: CONVERSOR DE UNIDADES
// =====================================================================
function renderConversor(container) {
  const cats = {
    comprimento: { label:'Comprimento', units:{ m:1, km:1000, cm:0.01, mm:0.001, mi:1609.34, ft:0.3048, in:0.0254 } },
    massa:       { label:'Massa',       units:{ kg:1, g:0.001, mg:0.000001, lb:0.453592, oz:0.0283495, t:1000 } },
    temperatura: { label:'Temperatura', special:true },
    dados:       { label:'Dados',       units:{ B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 } },
    velocidade:  { label:'Velocidade',  units:{ 'm/s':1, 'km/h':0.277778, 'mph':0.44704, 'knot':0.514444 } },
    tempo:       { label:'Tempo',       units:{ s:1, min:60, h:3600, d:86400, semana:604800 } },
    area:        { label:'Área',        units:{ 'm²':1, 'km²':1e6, 'cm²':0.0001, ha:10000, 'ft²':0.092903 } },
  };
  container.innerHTML = `
    <div class="tool-section">
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
        ${Object.entries(cats).map(([k,v]) => `<button class="btn btn-ghost btn-sm conv-cat-btn" data-cat="${k}" onclick="convSelectCat('${k}')">${v.label}</button>`).join('')}
      </div>
      <div id="conv-body"><div class="no-events-msg">Selecione uma categoria acima</div></div>
    </div>`;
  window._convCats = cats;
}
function convSelectCat(cat) {
  document.querySelectorAll('.conv-cat-btn').forEach(b => { b.classList.toggle('btn-primary', b.dataset.cat===cat); b.classList.toggle('btn-ghost', b.dataset.cat!==cat); });
  const body = document.getElementById('conv-body');
  const data = window._convCats[cat];
  if (!data) return;
  if (data.special && cat==='temperatura') {
    body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="add-event-field"><label class="add-event-label">Celsius (°C)</label><input type="number" id="conv-C" class="kanban-input" style="width:100%" placeholder="0" oninput="convTemp('C')"></div>
      <div class="add-event-field"><label class="add-event-label">Fahrenheit (°F)</label><input type="number" id="conv-F" class="kanban-input" style="width:100%" placeholder="32" oninput="convTemp('F')"></div>
      <div class="add-event-field"><label class="add-event-label">Kelvin (K)</label><input type="number" id="conv-K" class="kanban-input" style="width:100%" placeholder="273.15" oninput="convTemp('K')"></div>
      <div class="add-event-field"><label class="add-event-label">Rankine (°R)</label><input type="number" id="conv-R" class="kanban-input" style="width:100%" placeholder="491.67" oninput="convTemp('R')"></div>
    </div>`; return;
  }
  const units = Object.keys(data.units);
  body.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:12px">
    <div class="add-event-field"><label class="add-event-label">Valor</label><input type="number" id="conv-val" class="kanban-input" style="width:100%" placeholder="0" oninput="convCalc()"></div>
    <div class="add-event-field"><label class="add-event-label">De</label><select id="conv-from" class="kanban-select" onchange="convCalc()">${units.map(u=>`<option>${u}</option>`).join('')}</select></div>
    <div class="add-event-field"><label class="add-event-label">Para</label><select id="conv-to" class="kanban-select" onchange="convCalc()">${units.map((u,i)=>`<option ${i===1?'selected':''}>${u}</option>`).join('')}</select></div>
  </div>
  <div id="conv-result" style="font-family:var(--font-display);font-size:26px;font-weight:800;color:var(--primary);text-align:center;padding:18px;background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:12px;margin-top:14px;min-height:64px;display:flex;align-items:center;justify-content:center">—</div>`;
  window._convCat = cat;
}
function convCalc() {
  const val = parseFloat(document.getElementById('conv-val')?.value);
  const from = document.getElementById('conv-from')?.value;
  const to = document.getElementById('conv-to')?.value;
  const res = document.getElementById('conv-result');
  if (!res) return;
  if (isNaN(val)) { res.textContent='—'; return; }
  const units = window._convCats[window._convCat]?.units;
  if (!units) return;
  const result = (val * units[from]) / units[to];
  const fmt = Math.abs(result)<0.001||Math.abs(result)>1e9 ? result.toExponential(4) : parseFloat(result.toPrecision(8)).toString();
  res.innerHTML = `<span style="font-size:13px;color:var(--text-muted);margin-right:6px">${val} ${from} =</span><strong>${fmt} ${to}</strong>`;
}
function convTemp(src) {
  const v = parseFloat(document.getElementById(`conv-${src}`)?.value);
  if (isNaN(v)) return;
  let C = src==='C'?v:src==='F'?(v-32)*5/9:src==='K'?v-273.15:(v-491.67)*5/9;
  Object.entries({C,F:C*9/5+32,K:C+273.15,R:(C+273.15)*9/5}).forEach(([k,val])=>{ if(k!==src){const el=document.getElementById(`conv-${k}`);if(el)el.value=parseFloat(val.toFixed(4));} });
}

// =====================================================================
// NOVA FERRAMENTA: GERADOR DE CITAÇÃO ABNT
// =====================================================================
function renderCitacoes(container) {
  container.innerHTML = `<div class="tool-section">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
      ${['livro','artigo','site','tcc'].map(t=>`<button class="btn btn-ghost btn-sm abnt-type-btn" data-t="${t}" onclick="abntSelect('${t}')">${{livro:'📚 Livro',artigo:'📄 Artigo',site:'🌐 Site',tcc:'🎓 TCC'}[t]}</button>`).join('')}
    </div>
    <div id="abnt-fields"><div class="no-events-msg">Selecione o tipo de fonte acima</div></div>
    <div id="abnt-result" style="display:none;margin-top:18px;padding:16px;background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:12px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Referência ABNT NBR 6023</div>
      <div id="abnt-output" style="font-size:13.5px;line-height:1.8;color:var(--text)"></div>
      <button class="btn btn-ghost btn-sm" style="margin-top:10px" onclick="abntCopy()">📋 Copiar</button>
    </div>
  </div>`;
}
function abntSelect(type) {
  document.querySelectorAll('.abnt-type-btn').forEach(b=>{b.classList.toggle('btn-primary',b.dataset.t===type);b.classList.toggle('btn-ghost',b.dataset.t!==type);});
  window._abntType = type;
  const schemas = {
    livro:[{id:'autor',label:'Autor(es)',ph:'SOBRENOME, Nome'},{id:'titulo',label:'Título',ph:'Título do Livro'},{id:'edicao',label:'Edição',ph:'3. ed.'},{id:'local',label:'Cidade',ph:'São Paulo'},{id:'editora',label:'Editora',ph:'Atlas'},{id:'ano',label:'Ano',ph:'2023'}],
    artigo:[{id:'autor',label:'Autor(es)',ph:'SOBRENOME, Nome'},{id:'titulo',label:'Título do artigo',ph:'Título'},{id:'revista',label:'Periódico',ph:'Revista de SI'},{id:'local',label:'Cidade',ph:'São Paulo'},{id:'vol',label:'Volume',ph:'v. 10'},{id:'num',label:'Número',ph:'n. 2'},{id:'pag',label:'Páginas',ph:'p. 15-30'},{id:'ano',label:'Ano',ph:'2024'}],
    site:[{id:'autor',label:'Autor/Organização',ph:'SILVA, João'},{id:'titulo',label:'Título da página',ph:'Nome da página'},{id:'site',label:'Nome do site',ph:'USP Online'},{id:'url',label:'URL',ph:'https://...'},{id:'acesso',label:'Data de acesso',ph:'10 mar. 2025'}],
    tcc:[{id:'autor',label:'Autor',ph:'SOBRENOME, Nome'},{id:'titulo',label:'Título',ph:'Título do trabalho'},{id:'tipo',label:'Tipo',ph:'TCC'},{id:'grau',label:'Grau',ph:'Bacharel em SI'},{id:'inst',label:'Instituição',ph:'Universidade de São Paulo'},{id:'local',label:'Cidade',ph:'São Paulo'},{id:'ano',label:'Ano',ph:'2025'}],
  };
  const schema = schemas[type]||[];
  document.getElementById('abnt-fields').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${schema.map(f=>`<div class="add-event-field" style="${f.id==='titulo'||f.id==='url'?'grid-column:1/-1':''}"><label class="add-event-label">${f.label}</label><input type="text" id="abnt-${f.id}" class="kanban-input" style="width:100%" placeholder="${f.ph}" oninput="abntGenerate()"></div>`).join('')}
    </div>
    <button class="btn btn-primary" onclick="abntGenerate()" style="width:100%;justify-content:center;margin-top:10px">Gerar referência</button>`;
}
function abntGenerate() {
  const g = id => document.getElementById(`abnt-${id}`)?.value?.trim()||'';
  const type = window._abntType; let ref='';
  if(type==='livro'){const ed=g('edicao')?` ${g('edicao')}.`:'';ref=`${g('autor')||'AUTOR'}. <strong>${g('titulo')||'TÍTULO'}</strong>.${ed} ${g('local')||'LOCAL'}: ${g('editora')||'EDITORA'}, ${g('ano')||'ANO'}.`;}
  else if(type==='artigo'){ref=`${g('autor')||'AUTOR'}. ${g('titulo')||'TÍTULO'}. <strong>${g('revista')||'PERIÓDICO'}</strong>, ${g('local')}, ${g('vol')}, ${g('num')}, ${g('pag')}, ${g('ano')||'ANO'}.`;}
  else if(type==='site'){ref=`${g('autor')||'AUTOR'}. <strong>${g('titulo')||'TÍTULO'}</strong>. ${g('site')?g('site')+', ':''}Disponível em: ${g('url')||'URL'}. Acesso em: ${g('acesso')||'DATA'}.`;}
  else if(type==='tcc'){ref=`${g('autor')||'AUTOR'}. <strong>${g('titulo')||'TÍTULO'}</strong>. ${g('ano')||'ANO'}. ${g('tipo')||'TCC'} (${g('grau')||'Graduação'}) — ${g('inst')||'INSTITUIÇÃO'}, ${g('local')}, ${g('ano')||'ANO'}.`;}
  if(!ref)return;
  const res=document.getElementById('abnt-result'); const out=document.getElementById('abnt-output');
  if(res)res.style.display=''; if(out)out.innerHTML=ref;
}
function abntCopy() {
  const out=document.getElementById('abnt-output');
  if(!out)return;
  navigator.clipboard.writeText(out.innerText).then(()=>showToast('Referência copiada!'));
}

// =====================================================================
// NOVA FERRAMENTA: CHECKLIST ANTI-PLÁGIO
// =====================================================================
function renderPlagio(container) {
  const cats = [
    {cat:'Citações',checks:['Toda citação direta está entre aspas e com (AUTOR, ANO, p. XX)','Citações longas (>3 linhas) estão em bloco recuado sem aspas','Citações indiretas (paráfrases) têm autor e ano indicados','Nenhum trecho copiado sem atribuição de fonte']},
    {cat:'Referências',checks:['Todas as fontes citadas estão na lista de referências','Todas as referências seguem ABNT NBR 6023','Sites têm URL e data de acesso','Não há fontes nas referências não citadas no texto']},
    {cat:'Imagens & Tabelas',checks:['Imagens têm fonte indicada abaixo','Tabelas têm título acima e fonte abaixo','Gráficos adaptados indicam "Adaptado de: ..."']},
    {cat:'Integridade',checks:['O trabalho foi escrito com suas próprias palavras','Ideias de outros foram parafrasadas corretamente','Não houve reutilização de trabalhos anteriores sem permissão','Uso de IA (se houver) foi declarado conforme exigência da instituição','O arquivo foi verificado em ferramenta anti-plágio (Turnitin etc.)']},
  ];
  const total = cats.reduce((a,c)=>a+c.checks.length,0);
  let html = `<div style="display:flex;flex-direction:column;gap:18px">`;
  cats.forEach((cat,ci)=>{
    html+=`<div><div style="font-family:var(--font-mono);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--primary);margin-bottom:10px">${cat.cat}</div><div style="display:flex;flex-direction:column;gap:7px">
      ${cat.checks.map((c,i)=>`<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:10px 12px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass-tint);transition:.15s">
        <input type="checkbox" id="plag-${ci}-${i}" style="margin-top:2px;accent-color:var(--primary);flex-shrink:0;width:15px;height:15px" onchange="plagProgress(${total})">
        <span style="font-size:13px;line-height:1.5;color:var(--text)">${c}</span></label>`).join('')}
    </div></div>`;
  });
  html+=`</div><div style="margin-top:20px;padding:14px 18px;border-radius:12px;background:var(--glass-tint);border:1px solid var(--glass-border)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">Progresso</span>
      <span id="plag-count" style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--primary)">0/${total}</span>
    </div>
    <div style="height:8px;border-radius:100px;background:var(--glass-border);overflow:hidden"><div id="plag-bar" style="height:100%;border-radius:100px;background:linear-gradient(90deg,var(--primary),var(--secondary));width:0%;transition:.4s cubic-bezier(.34,1.56,.64,1)"></div></div>
    <div id="plag-msg" style="font-size:12px;color:var(--text-muted);margin-top:8px">Marque cada item conforme você revisa o trabalho.</div>
  </div>`;
  container.innerHTML = html;
}
function plagProgress(total) {
  const checked = document.querySelectorAll('[id^="plag-"]:checked').length;
  const pct = Math.round(checked/total*100);
  const bar=document.getElementById('plag-bar'), count=document.getElementById('plag-count'), msg=document.getElementById('plag-msg');
  if(bar)bar.style.width=pct+'%';
  if(count)count.textContent=`${checked}/${total}`;
  if(msg){
    if(pct===100){msg.textContent='✅ Seu trabalho está em conformidade com as boas práticas acadêmicas!';msg.style.color='var(--success)';}
    else if(pct>=70){msg.textContent=`${pct}% completo — quase lá!`;msg.style.color='var(--warning)';}
    else{msg.textContent=`${pct}% completo — continue revisando.`;msg.style.color='var(--text-muted)';}
  }
}

// =====================================================================
// NOVA FERRAMENTA: FLASHCARDS
// =====================================================================
let fcCards=[], fcIndex=0, fcFlipped=false, fcSession={correct:0,wrong:0,skipped:0};

function renderFlashcard(container) {
  fcCards=JSON.parse(localStorage.getItem('dasiboard_fc')||'[]');
  fcIndex=0; fcFlipped=false; fcSession={correct:0,wrong:0,skipped:0};
  container.innerHTML=`<div class="tool-section" style="display:flex;flex-direction:column;gap:16px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="add-event-field"><label class="add-event-label">Frente (pergunta)</label><textarea id="fc-front" class="kanban-input" rows="2" style="width:100%;resize:none" placeholder="O que é um Sistema de Informação?"></textarea></div>
      <div class="add-event-field"><label class="add-event-label">Verso (resposta)</label><textarea id="fc-back" class="kanban-input" rows="2" style="width:100%;resize:none" placeholder="Sistema que coleta, processa e dissemina informação..."></textarea></div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="fcAddCard()" style="flex:1;justify-content:center">+ Adicionar card</button>
      <button class="btn btn-ghost btn-sm" onclick="fcClearAll()" title="Apagar todos">🗑</button>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--glass-tint);border:1px solid var(--glass-border);border-radius:10px">
      <span id="fc-deck-count" style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">${fcCards.length} cards</span>
      <button class="btn btn-primary btn-sm" onclick="fcStartSession()" id="fc-start-btn" ${fcCards.length===0?'disabled':''}>▶ Estudar</button>
    </div>
    <div id="fc-study-area" style="display:none;flex-direction:column;align-items:center;gap:14px">
      <div id="fc-card" onclick="fcFlip()" style="width:100%;min-height:160px;border-radius:16px;background:var(--bg-card);border:1.5px solid var(--glass-border);backdrop-filter:blur(24px);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:28px 24px;text-align:center;font-size:16px;line-height:1.6;color:var(--text);position:relative;overflow:hidden;transition:transform .2s cubic-bezier(.34,1.56,.64,1)">
        <div style="position:absolute;top:10px;left:14px;font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px" id="fc-side-label">Frente</div>
        <span id="fc-card-text"></span>
      </div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)" id="fc-progress-label"></div>
      <div style="display:flex;gap:8px;width:100%">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="fcAnswer('wrong')">✗ Errei</button>
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="fcAnswer('skip')">⟳ Pular</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="fcAnswer('correct')">✓ Acertei</button>
      </div>
      <div style="display:flex;gap:16px;font-family:var(--font-mono);font-size:11px">
        <span style="color:var(--success)">✓ <span id="fc-correct">0</span></span>
        <span style="color:var(--danger)">✗ <span id="fc-wrong">0</span></span>
        <span style="color:var(--text-dim)">⟳ <span id="fc-skipped">0</span></span>
      </div>
    </div>
  </div>`;
}
function fcAddCard() {
  const front=document.getElementById('fc-front')?.value.trim(), back=document.getElementById('fc-back')?.value.trim();
  if(!front||!back){showToast('Preencha frente e verso');return;}
  fcCards.push({front,back}); localStorage.setItem('dasiboard_fc',JSON.stringify(fcCards));
  document.getElementById('fc-front').value=''; document.getElementById('fc-back').value='';
  const el=document.getElementById('fc-deck-count'); if(el)el.textContent=`${fcCards.length} cards`;
  const btn=document.getElementById('fc-start-btn'); if(btn)btn.disabled=false;
  showToast('Card adicionado!');
}
function fcStartSession() {
  if(!fcCards.length)return;
  fcIndex=0; fcFlipped=false; fcSession={correct:0,wrong:0,skipped:0};
  for(let i=fcCards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[fcCards[i],fcCards[j]]=[fcCards[j],fcCards[i]];}
  document.getElementById('fc-study-area').style.display='flex'; fcShowCard();
}
function fcShowCard() {
  if(fcIndex>=fcCards.length){fcEndSession();return;}
  const card=fcCards[fcIndex]; fcFlipped=false;
  const el=document.getElementById('fc-card-text'), lbl=document.getElementById('fc-side-label'), prog=document.getElementById('fc-progress-label');
  if(el)el.textContent=card.front; if(lbl){lbl.textContent='Frente — clique para revelar';lbl.style.color='var(--primary)';}
  if(prog)prog.textContent=`Card ${fcIndex+1} de ${fcCards.length}`;
  const cardEl=document.getElementById('fc-card'); if(cardEl)cardEl.style.borderColor='var(--glass-border)';
}
function fcFlip() {
  if(fcIndex>=fcCards.length)return;
  const card=fcCards[fcIndex]; fcFlipped=!fcFlipped;
  const el=document.getElementById('fc-card-text'), lbl=document.getElementById('fc-side-label'), cardEl=document.getElementById('fc-card');
  if(fcFlipped){
    if(el)el.textContent=card.back; if(lbl){lbl.textContent='Verso (resposta)';lbl.style.color='var(--success)';}
    if(cardEl){cardEl.style.transform='scale(1.02)';cardEl.style.borderColor='var(--success)';setTimeout(()=>{if(cardEl)cardEl.style.transform='';},200);}
  } else {
    if(el)el.textContent=card.front; if(lbl){lbl.textContent='Frente — clique para revelar';lbl.style.color='var(--primary)';}
    if(cardEl)cardEl.style.borderColor='var(--glass-border)';
  }
}
function fcAnswer(type) {
  if(type==='correct')fcSession.correct++; else if(type==='wrong')fcSession.wrong++; else fcSession.skipped++;
  fcIndex++;
  document.getElementById('fc-correct').textContent=fcSession.correct;
  document.getElementById('fc-wrong').textContent=fcSession.wrong;
  document.getElementById('fc-skipped').textContent=fcSession.skipped;
  fcShowCard();
}
function fcEndSession() {
  const {correct,wrong,skipped}=fcSession, total=correct+wrong+skipped, pct=Math.round(correct/total*100);
  const el=document.getElementById('fc-card');
  if(el)el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:12px">
    <div style="font-size:40px">${pct>=80?'🏆':pct>=50?'👍':'💪'}</div>
    <div style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--primary)">${pct}% de acertos</div>
    <div style="font-size:13px;color:var(--text-muted)">${correct} acertos · ${wrong} erros · ${skipped} pulados</div>
    <button class="btn btn-primary" onclick="fcStartSession()" style="margin-top:8px">Repetir baralho</button>
  </div>`;
}
function fcClearAll() {
  if(!confirm('Apagar todos os flashcards?'))return;
  fcCards=[]; localStorage.removeItem('dasiboard_fc');
  renderFlashcard(document.getElementById('tool-panel-content'));
  showToast('Flashcards apagados.');
}
