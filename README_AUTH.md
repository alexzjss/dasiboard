# 🎯 DaSIboard - Painel de Controle com Sistema de Autenticação

Uma plataforma moderna de dashboard com sistema completo de **autenticação e autorização** usando **Node.js**, **Express**, **SQLite** e **JWT**.

## ✨ Características

### 🎨 Frontend Moderno
- Design **Liquid Glass** com tema escuro sofisticado
- Múltiplas paletas de cores temáticas (Padrão, Super, Hypado, Omni, etc)
- Animações suaves e transições fluidas
- Interface responsiva (mobile-friendly)
- 100% customizável com CSS variables

### 🔐 Autenticação Robusta
- Registro com validação de senha forte
- Login com token JWT
- Gerenciamento de sessões
- Histórico de logins
- Logout remoto
- Regeneração de senhas com hash seguro (bcryptjs)

### 💾 Banco de Dados
- SQLite para persistência de dados
- Tabelas de usuários, sessões e histórico de login
- Índices otimizados para performance
- Backup automático

### 🛡️ Segurança
- CORS configurado
- Validação de entrada (express-validator)
- Senhas com hash seguro
- Tokens com expiração
- Rate limiting pronto para implementação

---

## 📦 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/dasiboard.git
cd dasiboard
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar ambiente (opcional)

O arquivo `.env` já vem pré-configurado. Para produção:

```bash
# Editar .env
JWT_SECRET=sua_chave_ultra_secreta_aqui
NODE_ENV=production
PORT=3000
```

### 4. Iniciar servidor

```bash
npm start
```

O servidor estará disponível em: **http://localhost:3000**

---

## 🚀 Uso Rápido

### Acessar aplicação

- **Login**: http://localhost:3000/login.html
- **Cadastro**: http://localhost:3000/cadastro.html
- **Dashboard**: http://localhost:3000/ (requer login)

### Fluxo de uso

1. **Novo usuário** → Clique em "Cadastre-se" → Preencha formulário
2. **Validação** → Sistema valida força de senha (requisitos mostrados em tempo real)
3. **Login** → Volte e faça login com credenciais
4. **Token** → Receba JWT token válido por 7 dias
5. **Sessão** → Token armazenado em `localStorage`

---

## 📚 Documentação Completa

Para detalhes completos sobre APIs, estrutura de banco de dados e exemplos de integração, veja:

📖 **[AUTH_API_DOCS.md](./AUTH_API_DOCS.md)**

---

## 🗂️ Estrutura do Projeto

```
dasiboard/
├── index.html                 # Dashboard (não precisa de login para dev)
├── login.html                 # Tela de login
├── cadastro.html              # Tela de cadastro
├── server.js                  # Servidor principal Express
├── server-routes.js           # Rotas de autenticação
├── package.json               # Dependências Node.js
├── .env                       # Variáveis de ambiente
├── .gitignore                 # Arquivo de ignorância Git
├── css/
│   ├── style.css              # Estilos principais (Liquid Glass)
│   └── animations.css         # Animações reutilizáveis
├── js/
│   ├── app.js                 # Lógica principal do dashboard
│   ├── auth-client.js         # ✨ Cliente de autenticação
│   ├── auth-middleware.js     # Middleware de autenticação
│   ├── auth-utils.js          # Funções auxiliares de autenticação
│   ├── calendar.js            # Gerenciador de calendário
│   ├── docentes.js            # Gestão de docentes
│   ├── ... (outros módulos)
├── db/
│   ├── database.js            # Configuração SQLite
│   └── dasiboard.db           # Banco de dados (gerado)
├── data/                      # Dados estáticos JSON
└── assets/                    # Imagens e recursos
```

---

## 🔧 Configuração Detalhada

### Variáveis de Ambiente (`.env`)

```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=chave_secreta_aqui
JWT_EXPIRE=7d

# Banco de dados
DB_PATH=./db/dasiboard.db

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Requisitos de Senha

Senhas devem conter:
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra MAIÚSCULA
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número (0-9)
- ✅ Pelo menos 1 caractere especial (!@#$%^&*)

---

## 🔌 Integração Frontend

Inclua o cliente de autenticação nas suas páginas:

```html
<script src="/js/auth-client.js"></script>
```

### Exemplo de uso

```javascript
// Proteger página
await auth.protectPage('/login.html');

// Obter usuário atual
const result = await auth.getCurrentUser();
if (result.success) {
  console.log('Usuário:', result.data.name);
}

// Fazer logout
await auth.logout();
```

---

## 📊 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/register` | Registrar novo usuário |
| POST | `/api/login` | Fazer login |
| POST | `/api/logout` | Fazer logout |
| GET | `/api/me` | Obter usuário atual |
| POST | `/api/verify` | Verificar token |
| GET | `/api/login-history` | Histórico de logins |

Ver [AUTH_API_DOCS.md](./AUTH_API_DOCS.md) para detalhes completos.

---

## 🎨 Temas Visuais

O DaSIboard inclui múltiplas paletas de cores:

- 🟣 **Padrão** (Roxo/Violeta)
- 🔴 **Super** (Vermelho Superman)
- 🟠 **Hypado** (Laranja/Roxo)
- 🟢 **Omni** (Verde neon)
- 🌸 **Minas** (Rosa/Verde)
- 🟣 **D20** (Roxo místico)
- ⚪ **Grifinho** (Claro/Roxa)
- 🟤 **Bidu** (Laranja quente)
- 💗 **Laboratório** (Rosa pastel)
- 🔵 **Sintetizado** (Azul)
- 🔴 **Masacote** (Vermelho vibrante)
- ✨ **Grace** (Purpura moderno)

---

## 🐛 Debugging

Ativar modo desenvolvimento:

```env
NODE_ENV=development
```

Todos os logs aparecerão no console do servidor.

---

## 📱 Responsividade

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

---

## 🚀 Deploy Recomendado

### Heroku

1. Criar `Procfile`:
   ```
   web: npm start
   ```

2. Deploy:
   ```bash
   git push heroku main
   ```

### DigitalOcean / AWS

1. SSH no servidor
2. Git clone
3. `npm install`
4. Configurar `.env`
5. PM2 ou Systemd para manter serviço ativo

---

## 🔄 Ciclo de Desenvolvimento

```bash
# Desenvolvimento com auto-reload (requer nodemon)
npm install --save-dev nodemon
npm run dev

# Produção
npm start

# Limpar banco de dados (cria novo)
rm db/dasiboard.db && npm start
```

---

## 🤝 Contribuindo

1. Fork o proyecto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob licença MIT. Veja [LICENSE](./LICENSE) para detalhes.

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'sqlite3'"

```bash
npm install sqlite3 --save
```

### Erro: "Port 3000 is already in use"

```bash
# Mudar porta no .env
PORT=3001
```

### Banco de dados corrompido

```bash
# Deletar e recriar
rm db/dasiboard.db
npm start
```

---

## 📞 Suporte

- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/dasiboard/issues)
- 📧 Email: seu@email.com
- 🌐 Website: https://seu-website.com

---

## 🗓️ Roadmap

- [ ] Autenticação via Google/GitHub
- [ ] Verificação de email
- [ ] Recuperação de senha
- [ ] 2FA (Two-Factor Authentication)
- [ ] Rate limiting
- [ ] Refresh tokens automáticos
- [ ] Dashboard admin
- [ ] Logs de auditoria

---

**Versão:** 1.0.0  
**Última atualização:** 17 de março de 2025  
**Desenvolvedor:** GitHub Copilot

---

Feito com ❤️ e ☕
