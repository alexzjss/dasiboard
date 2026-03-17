// ===== GITHUB EVENTS INTEGRATION =====
//
// ESTRATÉGIA DE EVENTOS:
//
// Cada PR proposto pelo usuário cria uma branch e modifica o events.json
// diretamente, adicionando o novo evento ao array e ordenando por data.
// Após o merge, o evento aparece imediatamente para TODOS os usuários
// sem necessidade de token GitHub.
//
// Conflitos de merge simultâneo são improváveis em uso normal, mas se
// ocorrerem, o GitHub sinalizará no PR para resolução manual.

const GH_OWNER      = 'alexzjss';
const GH_REPO       = 'dasiboard';
const GH_BRANCH     = 'main';
const GH_EVENTS_PATH       = 'data/events.json';
const GH_PENDING_DIR       = 'data/events-pending';
const GH_API_BASE   = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`;
const GH_TOKEN_KEY  = 'dasiboard_gh_token';

// ── Token management ──────────────────────────────────────────────────────────
function ghGetToken()       { return localStorage.getItem(GH_TOKEN_KEY) || ''; }
function ghSaveToken(token) { token ? localStorage.setItem(GH_TOKEN_KEY, token.trim()) : localStorage.removeItem(GH_TOKEN_KEY); }
function ghHasToken()       { return !!ghGetToken(); }

// ── Low-level helper ──────────────────────────────────────────────────────────
function ghHeaders(withAuth = true) {
  const h = {
    'Accept':               'application/vnd.github+json',
    'Content-Type':         'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (withAuth) h['Authorization'] = `Bearer ${ghGetToken()}`;
  return h;
}

async function ghFetch(path, options = {}, withAuth = true) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  const res = await fetch(`${GH_API_BASE}${path}`, {
    headers: ghHeaders(withAuth),
    signal: ctrl.signal,
    ...options
  }).finally(() => clearTimeout(t));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(
    new Error(data.message || `GitHub API error ${res.status}`),
    { status: res.status, data }
  );
  return data;
}

// ── Leitura do events.json principal ─────────────────────────────────────────
// ── Decodificação UTF-8 segura de base64 ────────────────────────────────────
// atob() nativo quebra com acentos (é, ç, ã). Usa TextDecoder para UTF-8 real.
function ghBase64Decode(b64) {
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

// ── Codificação UTF-8 segura para base64 ─────────────────────────────────────
function ghBase64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

// ── Leitura do events.json (fetch local, sem API, sem auth) ──────────────────
// Lê diretamente do arquivo local para que a home funcione sem token.
// Eventos pendentes (via PR mergeado) são carregados só se houver token.
async function ghGetMainEvents() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('./data/events.json', { signal: ctrl.signal, cache: 'no-cache' })
      .finally(() => clearTimeout(t));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('[DaSIboard] Falha ao carregar events.json:', e.name === 'AbortError' ? 'timeout' : e.message);
    return [];
  }
}

// ── Leitura dos eventos pendentes (pasta events-pending/) ─────────────────────
async function ghGetPendingEvents() {
  if (!ghHasToken()) return []; // sem token não tenta — rate limit severo
  try {
    const items = await ghFetch(`/contents/${GH_PENDING_DIR}?ref=${GH_BRANCH}&t=${Date.now()}`);
    if (!Array.isArray(items)) return [];
    const jsonFiles = items.filter(f => f.name.endsWith('.json') && f.type === 'file');
    const results = await Promise.allSettled(
      jsonFiles.map(f => fetch(f.download_url + '?t=' + Date.now()).then(r => r.json()).catch(() => null))
    );
    return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  } catch (e) {
    if (e.status === 404) return [];
    console.warn('[DaSIboard] Pendentes indisponíveis:', e.message);
    return [];
  }
}

// ── Carregar todos os eventos ─────────────────────────────────────────────────
async function ghLoadAllEvents() {
  const [main, pending] = await Promise.all([ghGetMainEvents(), ghGetPendingEvents()]);
  const seen = new Set(main.map(e => `${e.date}|${e.title}`));
  const extras = pending.filter(e => e && !seen.has(`${e.date}|${e.title}`));
  return [...main, ...extras].sort((a, b) => a.date.localeCompare(b.date));
}

// ── SHA do commit HEAD da main ────────────────────────────────────────────────
async function ghGetMainHeadSha() {
  const data = await ghFetch(`/git/ref/heads/${GH_BRANCH}`);
  return data.object.sha;
}

// ── Criar branch ──────────────────────────────────────────────────────────────
async function ghCreateBranch(branchName, fromSha) {
  return ghFetch('/git/refs', {
    method: 'POST',
    body:   JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha })
  });
}

// ── Commitar o evento diretamente no events.json da branch ──────────────────
// Lê o events.json atual da main, adiciona o novo evento e commita.
// Após o merge do PR, o evento já está no events.json e aparece para TODOS
// os usuários, sem precisar de token ou pasta events-pending.
async function ghCommitEventFile(branchName, filename, eventData, commitMsg) {
  // Lê o events.json atual para obter SHA e conteúdo
  const fileData = await ghFetch(`/contents/${GH_EVENTS_PATH}?ref=${GH_BRANCH}`);
  const currentSha = fileData.sha;
  const currentEvents = JSON.parse(ghBase64Decode(fileData.content));

  // Adiciona o novo evento e ordena por data
  const updated = [...currentEvents, eventData].sort((a, b) => a.date.localeCompare(b.date));
  const content = ghBase64Encode(JSON.stringify(updated, null, 2));

  return ghFetch(`/contents/${GH_EVENTS_PATH}`, {
    method: 'PUT',
    body:   JSON.stringify({ message: commitMsg, content, branch: branchName, sha: currentSha })
  });
}

// ── Abrir Pull Request ────────────────────────────────────────────────────────
async function ghOpenPR(branchName, ev) {
  const typeLabels = {
    evento: '📅 Evento', entrega: '📝 Entrega', prova: '📋 Prova',
    deadline: '⏰ Deadline', apresentacao: '🎤 Apresentação'
  };
  const rows = [
    `| **Título** | ${ev.title} |`,
    `| **Data** | ${ev.date} |`,
    `| **Tipo** | ${typeLabels[ev.type] || ev.type} |`,
    `| **Descrição** | ${ev.description || '—'} |`,
    ev.turmas?.length ? `| **Turmas** | ${ev.turmas.join(', ')} |` : null,
    ev.entidade       ? `| **Entidade** | ${ev.entidade} |`        : null,
  ].filter(Boolean).join('\n');

  const body = [
    `## Novo evento proposto via DaSIboard`,
    ``,
    `| Campo | Valor |`,
    `|---|---|`,
    rows,
    ``,
    `> Aberto automaticamente pelo DaSIboard.`,
    `> Ao fazer merge, o evento será adicionado diretamente ao \`data/events.json\``,
    `> Após o merge, o evento é adicionado ao events.json e aparece para todos os usuários.`,
  ].join('\n');

  return ghFetch('/pulls', {
    method: 'POST',
    body:   JSON.stringify({
      title: `[Evento] ${ev.title} — ${ev.date}`,
      head:  branchName,
      base:  GH_BRANCH,
      body
    })
  });
}

// ── Gerar ID único para o arquivo do evento ───────────────────────────────────
function ghEventFilename(ev) {
  const slug = ev.title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${ev.date}-${slug}-${Date.now()}.json`;
}

// ── Verificar duplicatas (events.json + pendentes) ────────────────────────────
async function ghCheckDuplicate(newEvent) {
  const all = await ghLoadAllEvents();
  return all.some(e => e.title === newEvent.title && e.date === newEvent.date);
}

// ── Função principal: propor evento via PR ────────────────────────────────────
//
// Por que isso elimina completamente o problema de conflito:
//
//   Cada PR adiciona UM arquivo novo e único em data/events-pending/.
//   O events.json principal NUNCA é modificado pelos PRs.
//
//   Cenário: PR-A adiciona events-pending/2026-04-01-evento-a-111.json
//            PR-B adiciona events-pending/2026-04-01-evento-b-222.json
//
//   Merge do PR-A → arquivo A criado na main.
//   Merge do PR-B → arquivo B criado na main. O arquivo A não é tocado.
//
//   Resultado: ambos os arquivos existem na main. O frontend carrega os dois.
//   Não há conflito possível porque cada PR toca um arquivo diferente.
//
async function ghProposePRForEvent(newEvent) {
  // 1. Verificar duplicata
  const isDup = await ghCheckDuplicate(newEvent);
  if (isDup) throw new Error('Evento duplicado: já existe um evento com este título e data.');

  // 2. Nome de branch único
  const slug = newEvent.title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const branchName = `event/${slug}-${Date.now()}`;

  // 3. Criar branch a partir do HEAD da main
  const headSha = await ghGetMainHeadSha();
  await ghCreateBranch(branchName, headSha);

  // 4. Commitar o evento diretamente no events.json da nova branch
  const commitMsg = `[DaSIboard] Adicionar evento: ${newEvent.title} (${newEvent.date})`;
  await ghCommitEventFile(branchName, null, newEvent, commitMsg);

  // 5. Abrir PR
  newEvent._filename = null; // manter compatibilidade com ghOpenPR
  const pr = await ghOpenPR(branchName, newEvent);
  return { prUrl: pr.html_url, prNumber: pr.number, branchName };
}

// ── Modal: formulário de proposta de evento ───────────────────────────────────
function openAddEventModal(prefillDate = '') {
  if (!ghHasToken()) { openGhTokenModal(() => openAddEventModal(prefillDate)); return; }

  document.getElementById('add-event-overlay')?.remove();

  const today   = new Date().toISOString().split('T')[0];
  const overlay = document.createElement('div');
  overlay.id        = 'add-event-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:500px" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeAddEventModal()">×</button>
      <div class="modal-date" id="add-event-gh-status"></div>
      <h2 class="modal-title">Propor Evento</h2>

      <div style="display:flex;flex-direction:column;gap:13px;position:relative;z-index:1">

        <div class="add-event-field">
          <label class="add-event-label">Título <span class="add-event-required">*</span></label>
          <input type="text" id="aev-title" class="kanban-input" style="width:100%"
            placeholder="Ex: Prova de Cálculo" maxlength="80" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="add-event-field">
            <label class="add-event-label">Data <span class="add-event-required">*</span></label>
            <input type="date" id="aev-date" class="kanban-input" style="width:100%"
              value="${prefillDate || today}" />
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
          <textarea id="aev-desc" class="kanban-input" rows="2"
            style="width:100%;resize:vertical;line-height:1.5"
            placeholder="Detalhes opcionais do evento…" maxlength="200"></textarea>
        </div>

        <div class="add-event-field">
          <label class="add-event-label">Turmas (opcional)</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
            ${['2026102','2026104','2026194'].map(t => `
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;
                            font-family:var(--font-mono);font-size:11.5px;color:var(--text-muted)">
                <input type="checkbox" value="${t}" class="aev-turma-cb"
                  style="accent-color:var(--primary);width:14px;height:14px" />
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
          <button id="aev-submit-btn" class="btn btn-primary"
            style="flex:1;justify-content:center" onclick="submitAddEvent()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Abrir Pull Request
          </button>
          <button class="btn btn-ghost" style="flex:1;justify-content:center"
            onclick="closeAddEventModal()">Cancelar</button>
        </div>

        <div class="add-event-gh-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          O evento será enviado como Pull Request e precisará de aprovação antes de aparecer no calendário.
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
  const title    = document.getElementById('aev-title')?.value?.trim();
  const date     = document.getElementById('aev-date')?.value;
  const type     = document.getElementById('aev-type')?.value;
  const desc     = document.getElementById('aev-desc')?.value?.trim();
  const entidade = document.getElementById('aev-entidade')?.value;
  const turmas   = [...document.querySelectorAll('.aev-turma-cb:checked')].map(c => c.value);

  if (!title) { setAddEventStatus('Por favor, preencha o título.', 'error'); return; }
  if (!date)  { setAddEventStatus('Por favor, selecione a data.', 'error'); return; }

  const btn = document.getElementById('aev-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px"></div> Criando PR…';
  }

  setAddEventStatus('Verificando duplicatas e criando PR…', 'info');

  const newEvent = { date, title, description: desc || 'NA', type };
  if (turmas.length) newEvent.turmas   = turmas;
  if (entidade)      newEvent.entidade = entidade;

  try {
    const { prUrl, prNumber } = await ghProposePRForEvent(newEvent);

    setAddEventStatus(`✓ Pull Request #${prNumber} aberto com sucesso!`, 'success');

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Ver PR #${prNumber} no GitHub
      `;
      btn.onclick = () => window.open(prUrl, '_blank', 'noopener');
    }

    showToast(`PR #${prNumber} aberto — aguardando aprovação.`);

  } catch (e) {
    const msg = e.message || 'Erro desconhecido.';
    setAddEventStatus('✗ ' + msg, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Tentar novamente
      `;
      btn.onclick = submitAddEvent;
    }
  }
}

function setAddEventStatus(msg, type) {
  const el = document.getElementById('add-event-gh-status');
  if (!el) return;
  const colors = { error: 'var(--danger)', success: 'var(--success)', info: 'var(--primary)' };
  el.textContent = msg;
  el.style.color  = colors[type] || 'var(--text-muted)';
}

// ── Modal de configuração do token ────────────────────────────────────────────
function openGhTokenModal(onSaved) {
  document.getElementById('gh-token-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'gh-token-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:480px" onclick="event.stopPropagation()">
      <button class="modal-close"
        onclick="document.getElementById('gh-token-overlay').remove()">×</button>
      <div class="modal-date" style="color:var(--primary)">Configuração GitHub</div>
      <h2 class="modal-title" style="font-size:18px;margin-bottom:8px">Token de Acesso GitHub</h2>
      <p style="font-size:13px;color:var(--text-muted);line-height:1.65;
                margin-bottom:18px;position:relative;z-index:1">
        Para propor eventos via Pull Request, você precisa de um
        <strong>Personal Access Token (PAT)</strong> do GitHub com as permissões
        <code style="background:var(--glass-tint);padding:1px 5px;border-radius:4px;
                     font-size:11px">contents:write</code> e
        <code style="background:var(--glass-tint);padding:1px 5px;border-radius:4px;
                     font-size:11px">pull_requests:write</code>.<br><br>
        O token é armazenado <strong>apenas localmente</strong> no seu navegador.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;position:relative;z-index:1">
        <input type="password" id="gh-token-input" class="kanban-input"
          style="width:100%;font-family:var(--font-mono);font-size:12px"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value="${ghGetToken()}" />
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" style="flex:1;justify-content:center"
            onclick="saveGhToken('${onSaved ? 'with_callback' : ''}')">
            Salvar token
          </button>
          <a href="https://github.com/settings/tokens/new?scopes=repo&description=DaSIboard"
            target="_blank" rel="noopener"
            class="btn btn-ghost" style="flex:1;justify-content:center;text-decoration:none">
            Criar token
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <div id="gh-token-status"
          style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);min-height:16px">
        </div>
        ${ghGetToken()
          ? `<button class="btn btn-danger btn-sm" style="width:fit-content"
               onclick="ghRemoveToken()">Remover token salvo</button>`
          : ''}
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  if (onSaved) overlay._onSaved = onSaved;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('gh-token-input')?.focus(), 50);
}

function saveGhToken(hasCallback) {
  const val      = document.getElementById('gh-token-input')?.value?.trim();
  const statusEl = document.getElementById('gh-token-status');
  if (!val) {
    if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.textContent = 'Por favor, cole o token.'; }
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
