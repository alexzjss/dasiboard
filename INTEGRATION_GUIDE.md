<!-- INSTRUÇÃO: Como integrar autenticação no index.html -->

<!-- 
  ═══════════════════════════════════════════════════════════════════════
  COMO PROTEGER O INDEX.HTML COM AUTENTICAÇÃO
  ═══════════════════════════════════════════════════════════════════════

  OPÇÃO 1: Proteção Básica (Recomendada)
  ───────────────────────────────────────
  
  Adicione estas duas linhas DENTRO da tag <head> do index.html,
  ANTES de outras scripts:

  <script src="/js/auth-client.js"></script>
  <script src="/js/page-protector.js"></script>

  Assim, qualquer acesso ao index.html sem estar logado 
  será redirecionado automático para /login.html


  ═══════════════════════════════════════════════════════════════════════

  OPÇÃO 2: Proteção com Customização
  ────────────────────────────────────

  Se você quer customizar o comportamento, adicione este código 
  DENTRO da tag <body>, ANTES do fechamento</body>:

  ```html
  <script src="/js/auth-client.js"></script>
  <script>
    (async function() {
      // Proteger página
      const isAuthenticated = await auth.protectPage('/login.html');
      
      if (isAuthenticated) {
        // Página foi liberada, usuário está autenticado
        
        // 1. Exibir nome do usuário
        const user = await auth.getCurrentUser();
        if (user.success) {
          const userElement = document.querySelector('.user-name');
          if (userElement) {
            userElement.textContent = user.data.name;
          }
        }
        
        // 2. Adicionar botão de logout
        const logoutBtn = document.querySelector('#logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.logout();
            window.location.href = '/login.html';
          });
        }
      }
    })();
  </script>
  ```


  ═══════════════════════════════════════════════════════════════════════

  OPÇÃO 3: Sem Proteção (Para Requisições Autenticadas)
  ────────────────────────────────────────────────────────

  Se você quer que a página seja pública mas usar dados autenticados:

  ```html
  <script src="/js/auth-client.js"></script>
  <script>
    (async function() {
      // Não redirecionar, apenas tentar obter dados se logado
      const token = auth.getToken();
      
      if (token) {
        // Usuário logado
        const user = await auth.getCurrentUser();
        const history = await auth.getLoginHistory();
      } else {
        // Usuário não logado
        console.log('Usuário não autenticado');
      }
    })();
  </script>
  ```


  ═══════════════════════════════════════════════════════════════════════

  EXEMPLOS DE INTEGRAÇÃO PRÁTICA
  ────────────────────────────────

  ### Exemplo 1: Botão de Logout na navbar
  
  <button id="logout-btn" style="cursor: pointer;">
    Logout
  </button>

  <script src="/js/auth-client.js"></script>
  <script>
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await auth.logout();
      window.location.href = '/login.html';
    });
  </script>


  ### Exemplo 2: Exibir nome do usuário

  <span id="user-name"></span>

  <script src="/js/auth-client.js"></script>
  <script>
    (async function() {
      const result = await auth.getCurrentUser();
      if (result.success) {
        document.getElementById('user-name').textContent = `Olá, ${result.data.name}!`;
      }
    })();
  </script>


  ### Exemplo 3: Dashboard personalizado por usuário

  <div id="user-dashboard"></div>

  <script src="/js/auth-client.js"></script>
  <script>
    (async function() {
      const isAuthenticated = await auth.protectPage();
      
      if (isAuthenticated) {
        const user = await auth.getCurrentUser();
        const history = await auth.getLoginHistory(5);
        
        const dashboard = document.getElementById('user-dashboard');
        dashboard.innerHTML = \`
          <h1>Bem-vindo, \${user.data.name}!</h1>
          <p>Email: \${user.data.email}</p>
          <p>Total de acessos: \${history.data.length}</p>
        \`;
      }
    })();
  </script>


  ### Exemplo 4: Fazer requisição autenticada

  <script src="/js/auth-client.js"></script>
  <script>
    (async function() {
      if (!auth.isAuthenticated()) {
        return;
      }
      
      try {
        const response = await auth.fetchAuthenticated('/api/seu-endpoint');
        const data = await response.json();
        console.log('Dados:', data);
      } catch (error) {
        console.error('Erro:', error);
      }
    })();
  </script>


  ═══════════════════════════════════════════════════════════════════════

  MÉTODOS DISPONÍVEIS NO OBJETO auth
  ──────────────────────────────────

  auth.getToken()                    → Retorna JWT token
  auth.getSessionId()                → Retorna ID da sessão
  auth.setSession(token, sessionId)  → Salva sessão
  auth.clearSession()                → Remove sessão
  auth.isAuthenticated()             → Verifica se logado (true/false)
  
  auth.login(email, password)        → Fazer login
  auth.logout()                      → Fazer logout
  auth.register(name, email, pwd)    → Registrar novo usuário
  auth.getCurrentUser()              → Dados do usuário logado
  auth.verifyToken()                 → Verificar validade do token
  auth.getLoginHistory(limit)        → Histórico de logins
  auth.logoutAllSessions()           → Logout de todas as sessões
  auth.fetchAuthenticated(url, opts) → Requisição autenticada
  auth.protectPage(redirectUrl)      → Proteger página com redireção


  ═══════════════════════════════════════════════════════════════════════

  FLUXO RECOMENDADO
  ──────────────────

  1. Adicione os dois scripts no <head>:
     <script src="/js/auth-client.js"></script>
     <script src="/js/page-protector.js"></script>

  2. A página será automaticamente protegida

  3. Na navbar/menu, adicione botão de logout:
     <button id="logout-btn">Sair</button>

  4. (OPCIONAL) Exiba dados do usuário em elemento com ID:
     <span id="user-name"></span>

  5. O page-protector.js vai:
     ✓ Redirecionar se não autenticado
     ✓ Exibir nome em #user-name (se existe)
     ✓ Adicionar listener no #logout-btn (se existe)
     ✓ Registrar histórico de login

  ═══════════════════════════════════════════════════════════════════════

  TESTANDO A INTEGRAÇÃO
  ──────────────────────

  1. Inicie o servidor: npm start
  2. Vá para: http://localhost:3000/cadastro.html
  3. Crie uma conta
  4. Faça login
  5. Você deve ser redirecionado para / (index.html)
  6. Se não estiver autenticado, será redirecionado para login

  ═══════════════════════════════════════════════════════════════════════

  NOTAS IMPORTANTES
  ──────────────────

  • O token é salvo em localStorage, persiste entre abas
  • O token expira em 7 dias (configurável em .env)
  • Feche o navegador não faz logout automático
  • O "Lembrar-me" no login salva apenas o email
  • Sempre valide do lado do servidor também!

  ═══════════════════════════════════════════════════════════════════════
-->

<!-- EXEMPLO BÁSICO PRONTO PARA USAR -->

<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - DaSIboard</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/animations.css">
  
  <!-- Scripts de autenticação - ORDEM IMPORTANTE! -->
  <script src="/js/auth-client.js"></script>
  <script src="/js/page-protector.js"></script>
  
  <style>
    .dashboard-header {
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      margin: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .dashboard-user-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .dashboard-buttons {
      display: flex;
      gap: 12px;
    }
    
    .btn {
      padding: 10px 20px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition);
    }
    
    .btn:hover {
      background: var(--highlight);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="bg-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>

  <div class="dashboard-header">
    <div class="dashboard-user-info">
      <h1>Bem-vindo ao DaSIboard</h1>
      <span id="user-name" style="color: var(--secondary);"></span>
    </div>
    <div class="dashboard-buttons">
      <button id="show-history-btn" class="btn">Histórico</button>
      <button id="logout-btn" class="btn" style="background: var(--danger);">Logout</button>
    </div>
  </div>

  <div style="padding: 20px; color: var(--text);">
    <p>📊 Sistema de autenticação está funcionando!</p>
    <p>Token será expires em 7 dias ou ao fazer logout.</p>
    <p>Verifique o console (F12) para mais informações.</p>
  </div>
</body>
</html>
