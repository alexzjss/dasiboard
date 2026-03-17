╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🚀 GUIA RÁPIDO - DaSIboard com Autenticação               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📋 PASSO A PASSO - COMECE AQUI

═══════════════════════════════════════════════════════════════

1️⃣  INSTALAR DEPENDÊNCIAS

    npm install

    ⏳ Isso vai instalar:
    • express (servidor web)
    • sqlite3 (banco de dados)
    • bcryptjs (criptografia de senha)
    • jsonwebtoken (autenticação)
    • cors (segurança)
    • express-validator (validação)

═══════════════════════════════════════════════════════════════

2️⃣  VER CONFIGURAÇÃO (OPCIONAL)

    .env já vem pré-configurado com valores padrão
    
    Para produção, edite:
    
    JWT_SECRET=sua_chave_super_secreta
    NODE_ENV=production
    PORT=3000

═══════════════════════════════════════════════════════════════

3️⃣  INICIAR SERVIDOR

    npm start
    
    Você verá:
    
    ╔════════════════════════════════════════╗
    ║  🚀 DaSIboard Auth Server              ║
    ║  Server rodando em: http://localhost:3000 ║
    ║  Ambiente: development                 ║
    ║  Banco de dados: ./db/dasiboard.db    ║
    ╚════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════

4️⃣  TESTAR NO NAVEGADOR

    📍 Login:       http://localhost:3000/login.html
    📍 Cadastro:    http://localhost:3000/cadastro.html
    📍 Dashboard:   http://localhost:3000/

═══════════════════════════════════════════════════════════════

5️⃣  CRIAR CONTA DE TESTE

    1. Vá para: http://localhost:3000/cadastro.html
    2. Preencha o formulário:
       • Nome: João Silva
       • Email: joao@teste.com
       • Senha: Senha@123 (cumpre todos os requisitos)
       • Confirmar Senha: Senha@123
    3. Clique "Criar Conta"
    4. Será redirecionado para login

═══════════════════════════════════════════════════════════════

6️⃣  FAZER LOGIN

    1. Email: joao@teste.com
    2. Senha: Senha@123
    3. Clique "Entrar"
    4. Token será salvo e você verá o dashboard

═══════════════════════════════════════════════════════════════

🧪 TESTAR APIS (OPCIONAL)

    Em outro terminal, enquanto o servidor está rodando:
    
    node test-api.js
    
    Isso vai testar todos os endpoints automáticamente.

═══════════════════════════════════════════════════════════════

📚 DOCUMENTAÇÃO

    📖 Guia Completo:        AUTH_API_DOCS.md
    📖 Readme Geral:         README_AUTH.md
    📊 Queries SQL:          db/queries.sql
    ⚙️  Variáveis Ambiente:  .env.example

═══════════════════════════════════════════════════════════════

🛠️  COMANDOS ÚTEIS

    # Ver logs em tempo real
    npm start

    # Com auto-reload (primeiro instalar nodemon)
    npm install --save-dev nodemon
    npm run dev

    # Testar APIs
    node test-api.js

    # Deletar banco e recriar
    rm db/dasiboard.db && npm start

═══════════════════════════════════════════════════════════════

🔒 REQUISITOS DE SENHA

    A senha deve conter:
    ✅ Mínimo 8 caracteres
    ✅ Letra MAIÚSCULA
    ✅ Letra minúscula
    ✅ Número (0-9)
    ✅ Caractere especial (!@#$%^&*)

    ✓ Exemplo de senha forte: Senha@123

═══════════════════════════════════════════════════════════════

🔑 O QUE ACONTECE QUANDO FAÇO LOGIN?

    1. Email e senha são enviados para /api/login
    2. Servidor valida credenciais
    3. Se OK, gera JWT token válido por 7 dias
    4. Token é salvo em localStorage do navegador
    5. Sessão criada no banco de dados
    6. Histórico de login registrado

═══════════════════════════════════════════════════════════════

💾 ONDE FICAM OS DADOS?

    Banco de dados SQLite:  db/dasiboard.db
    
    Tabelas criadas:
    • users         → Informações dos usuários
    • sessions      → Sessões ativas
    • login_history → Histórico de acessos

═══════════════════════════════════════════════════════════════

🐛 PROBLEMAS COMUNS

    ❌ "Cannot find module 'sqlite3'"
    ✓ Solução: npm install sqlite3

    ❌ "Port 3000 already in use"
    ✓ Solução: Editar PORT no .env para 3001

    ❌ "Banco de dados corrompido"
    ✓ Solução: rm db/dasiboard.db && npm start

═══════════════════════════════════════════════════════════════

🔄 FLUXO DE AUTENTICAÇÃO

    Usuário não logado
         ↓
    Clica em "Cadastro" → Cria conta com email/senha forte
         ↓
    Vai para "Login" → Insere email/senha
         ↓
    Sistema valida → Gera JWT token
         ↓
    Token salvo → localStorage
         ↓
    Sessão criada → Banco de dados
         ↓
    ✓ Usuário autenticado → Acessa dashboard

═══════════════════════════════════════════════════════════════

🎨 PERSONALIZAÇÕES

    Estilos:        css/style.css
    Animações:      css/animations.css
    Cliente Auth:   js/auth-client.js
    Rotas API:      server-routes.js

═══════════════════════════════════════════════════════════════

📞 PRECISA DE AJUDA?

    1. Verifique AUTH_API_DOCS.md
    2. Verifique os exemplos em js/auth-client.js
    3. Rode node test-api.js para diagnosticar
    4. Veja os logs no console do servidor

═══════════════════════════════════════════════════════════════

✨ PRÓXIMOS PASSOS

    1. ✓ Sistema de autenticação funcional
    2. → Adicionar página de perfil
    3. → Implementar recuperação de senha
    4. → Adicionar 2FA (autenticação dupla)
    5. → Dashboard de admin com gerenciar usuários

═══════════════════════════════════════════════════════════════

🎉 PRONTO! Seu sistema de autenticação está rodando!

    Bora começar → http://localhost:3000/cadastro.html

═══════════════════════════════════════════════════════════════

Desenvolvido com ❤️ e ☕
