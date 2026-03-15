// ===== GITHUB EVENTS INTEGRATION =====
// Allows adding events directly to the repository via GitHub Contents API.
// Multiple users can safely add events: SHA-based conflict detection retries automatically.

const GH_OWNER   = 'alexzjss';
const GH_REPO    = 'dasiboard';
const GH_BRANCH  = 'main';
const GH_PATH    = 'data/events.json';
const GH_API     = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
const GH_TOKEN_KEY = 'dasiboard_gh_token';

// ── Token management ──────────────────────────────────────────────────────
function ghGetToken() {
  return localStorage.getItem(GH_TOKEN_KEY) || '';
}
function ghSaveToken(token) {
  if (token) localStorage.setItem(GH_TOKEN_KEY, token.trim());
  else localStorage.removeItem(GH_TOKEN_KEY);
}
function ghHasToken() {
  return !!ghGetToken();
}

// ── GitHub API helpers ────────────────────────────────────────────────────
async function ghGetFile() {
  const res = await fetch(GH_API + `?ref=${GH_BRANCH}&t=${Date.now()}`, {
    headers: {
      'Authorization': `Bearer ${ghGetToken()}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { sha: data.sha, events: JSON.parse(content) };
}

async function ghPutFile(events, sha, commitMsg) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(events, null, 2))));
  const res = await fetch(GH_API, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ghGetToken()}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      message: commitMsg,
      content,
      sha,
      branch: GH_BRANCH
    })
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

// ── Core: add event with automatic conflict retry ─────────────────────────
async function ghAddEvent(newEvent, maxRetries = 4) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      // 1. GET current state
      const { sha, events } = await ghGetFile();

      // 2. Check for duplicate (same title + date)
      const dup = events.find(e => e.title === newEvent.title && e.date === newEvent.date);
      if (dup) throw new Error('duplicate');

      // 3. Add and sort by date
      events.push(newEvent);
      events.sort((a, b) => a.date.localeCompare(b.date));

      // 4. Commit
      const msg = `[DaSIboard] Adicionar evento: ${newEvent.title} (${newEvent.date})`;
      const result = await ghPutFile(events, sha, msg);

      if (result.ok) return { success: true, events };

      // SHA conflict → retry
      if (result.status === 409 || result.status === 422) {
        const wait = 400 + Math.random() * 400 * attempt;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      // Auth or other hard error
      const errMsg = result.data?.message || `HTTP ${result.status}`;
      throw new Error(errMsg);

    } catch (e) {
      if (e.message === 'duplicate') throw new Error('Evento duplicado: já existe um evento com este título e data.');
      if (attempt >= maxRetries) throw e;
      const wait = 500 * attempt;
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw new Error('Não foi possível salvar o evento após várias tentativas. Tente novamente.');
}

// ── Modal: add event form ──────────────────────────────────────────────────
function openAddEventModal(prefillDate = '') {
  if (!ghHasToken()) {
    openGhTokenModal(() => openAddEventModal(prefillDate));
    return;
  }

  const existing = document.getElementById('add-event-overlay');
  if (existing) existing.remove();

  const today = new Date().toISOString().split('T')[0];
  const overlay = document.createElement('div');
  overlay.id = 'add-event-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:500px" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeAddEventModal()">×</button>
      <div class="modal-date" id="add-event-gh-status"></div>
      <h2 class="modal-title">Adicionar Evento</h2>

      <div style="display:flex;flex-direction:column;gap:13px;position:relative;z-index:1">

        <div class="add-event-field">
          <label class="add-event-label">Título <span class="add-event-required">*</span></label>
          <input type="text" id="aev-title" class="kanban-input" style="width:100%" placeholder="Ex: Prova de Cálculo" maxlength="80" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="add-event-field">
            <label class="add-event-label">Data <span class="add-event-required">*</span></label>
            <input type="date" id="aev-date" class="kanban-input" style="width:100%" value="${prefillDate || today}" />
          </div>
          <div class="add-event-field">
            <label class="add-event-label">Tipo <span class="add-event-required">*</span></label>
            <select id="aev-type" class="kanban-select" style="width:100%">
              <option value="evento">📅 Evento</option>
              <option value="entrega">📝 Entrega</option>
              <option value="prova">📋 Prova</option>
              <option value="deadline">⏰ Deadline</option>
              <option value="apresentacao">🎤 Apresentação</option>
            </select>
          </div>
        </div>

        <div class="add-event-field">
          <label class="add-event-label">Descrição</label>
          <textarea id="aev-desc" class="kanban-input" rows="2" style="width:100%;resize:vertical;line-height:1.5" placeholder="Detalhes opcionais do evento…" maxlength="200"></textarea>
        </div>

        <div class="add-event-field">
          <label class="add-event-label">Turmas (opcional)</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
            ${['2026102','2026104','2026194'].map(t => `
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-family:var(--font-mono);font-size:11.5px;color:var(--text-muted)">
                <input type="checkbox" value="${t}" class="aev-turma-cb" style="accent-color:var(--primary);width:14px;height:14px" />
                ${t}
              </label>`).join('')}
          </div>
        </div>

        <div class="add-event-field">
          <label class="add-event-label">Entidade (opcional)</label>
          <select id="aev-entidade" class="kanban-select" style="width:100%">
            <option value="">— Nenhuma —</option>
            <option value="dasi">🎓 DASI</option>
            <option value="semana-si">🚀 Semana de SI</option>
            <option value="grace">💜 GRACE</option>
            <option value="each-in-the-shell">🐚 Each in the Shell</option>
            <option value="hype">⚡ Hype</option>
            <option value="codelab">💻 CodeLab</option>
            <option value="lab-das-minas">🔬 Lab das Minas</option>
            <option value="conway">🧮 Conway</option>
            <option value="pet-si">🏅 PET-SI</option>
            <option value="sintese-jr">💼 Síntese Jr.</option>
          </select>
        </div>

        <div style="display:flex;gap:10px;padding-top:4px">
          <button id="aev-submit-btn" class="btn btn-primary" style="flex:1;justify-content:center" onclick="submitAddEvent()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Salvar no repositório
          </button>
          <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closeAddEventModal()">Cancelar</button>
        </div>

        <div class="add-event-gh-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          O evento será salvo diretamente no repositório GitHub e ficará disponível para todos.
        </div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAddEventModal(); });
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('aev-title')?.focus(), 50);
}

function closeAddEventModal() {
  document.getElementById('add-event-overlay')?.remove();
}

async function submitAddEvent() {
  const title   = document.getElementById('aev-title')?.value?.trim();
  const date    = document.getElementById('aev-date')?.value;
  const type    = document.getElementById('aev-type')?.value;
  const desc    = document.getElementById('aev-desc')?.value?.trim();
  const entidade = document.getElementById('aev-entidade')?.value;
  const turmas  = [...document.querySelectorAll('.aev-turma-cb:checked')].map(c => c.value);

  if (!title) { setAddEventStatus('Por favor, preencha o título.', 'error'); return; }
  if (!date)  { setAddEventStatus('Por favor, selecione a data.', 'error'); return; }

  const btn = document.getElementById('aev-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px"></div> Salvando…'; }

  setAddEventStatus('Conectando ao repositório…', 'info');

  const newEvent = { date, title, description: desc || 'NA', type };
  if (turmas.length) newEvent.turmas = turmas;
  if (entidade)      newEvent.entidade = entidade;

  try {
    const { events } = await ghAddEvent(newEvent);

    setAddEventStatus('✓ Evento adicionado com sucesso!', 'success');

    // Update local calendar without reload
    calEvents = events;
    if (typeof renderCalendar === 'function') {
      renderCalendar();
      if (calSelectedDate) renderCalendarSidebar(calSelectedDate, getFilteredEvents(calSelectedDate));
    }
    if (typeof eventsData !== 'undefined') eventsData = events;
    if (typeof renderUpcomingEvents === 'function') renderUpcomingEvents();
    if (typeof updateStatEvents === 'function') updateStatEvents();
    if (typeof renderCountdown === 'function') renderCountdown();

    setTimeout(closeAddEventModal, 1400);
    showToast('Evento salvo no repositório!');

  } catch (e) {
    const msg = e.message || 'Erro desconhecido.';
    setAddEventStatus('✗ ' + msg, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Tentar novamente';
    }
  }
}

function setAddEventStatus(msg, type) {
  const el = document.getElementById('add-event-gh-status');
  if (!el) return;
  const colors = { error: 'var(--danger)', success: 'var(--success)', info: 'var(--primary)' };
  el.textContent = msg;
  el.style.color = colors[type] || 'var(--text-muted)';
}

// ── Token setup modal ──────────────────────────────────────────────────────
function openGhTokenModal(onSaved) {
  const existing = document.getElementById('gh-token-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'gh-token-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:480px" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="document.getElementById('gh-token-overlay').remove()">×</button>
      <div class="modal-date" style="color:var(--primary)">Configuração GitHub</div>
      <h2 class="modal-title" style="font-size:18px;margin-bottom:8px">Token de Acesso GitHub</h2>
      <p style="font-size:13px;color:var(--text-muted);line-height:1.65;margin-bottom:18px;position:relative;z-index:1">
        Para salvar eventos no repositório, você precisa de um <strong>Personal Access Token (PAT)</strong> do GitHub com permissão <code style="background:var(--glass-tint);padding:1px 5px;border-radius:4px;font-size:11px">contents:write</code>.<br><br>
        O token é armazenado <strong>apenas localmente</strong> no seu navegador e enviado somente para a API do GitHub.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;position:relative;z-index:1">
        <input type="password" id="gh-token-input" class="kanban-input" style="width:100%;font-family:var(--font-mono);font-size:12px"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value="${ghGetToken()}" />
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="saveGhToken('${onSaved ? 'with_callback' : ''}')">
            Salvar token
          </button>
          <a href="https://github.com/settings/tokens/new?scopes=repo&description=DaSIboard" target="_blank" rel="noopener"
            class="btn btn-ghost" style="flex:1;justify-content:center;text-decoration:none">
            Criar token
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        <div id="gh-token-status" style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);min-height:16px"></div>
        ${ghGetToken() ? `<button class="btn btn-danger btn-sm" style="width:fit-content" onclick="ghRemoveToken()">Remover token salvo</button>` : ''}
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Store callback for after save
  if (onSaved) overlay._onSaved = onSaved;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('gh-token-input')?.focus(), 50);
}

function saveGhToken(hasCallback) {
  const val = document.getElementById('gh-token-input')?.value?.trim();
  const statusEl = document.getElementById('gh-token-status');
  if (!val) {
    if (statusEl) statusEl.style.color = 'var(--danger)', statusEl.textContent = 'Por favor, cole o token.';
    return;
  }
  ghSaveToken(val);
  if (statusEl) { statusEl.style.color = 'var(--success)'; statusEl.textContent = '✓ Token salvo!'; }
  setTimeout(() => {
    const overlay = document.getElementById('gh-token-overlay');
    if (overlay?._onSaved && hasCallback === 'with_callback') overlay._onSaved();
    overlay?.remove();
  }, 700);
}

function ghRemoveToken() {
  ghSaveToken('');
  document.getElementById('gh-token-overlay')?.remove();
  showToast('Token removido.');
}
