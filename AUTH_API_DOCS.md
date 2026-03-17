# 🔐 DaSIboard - Sistema de Autenticação

Sistema completo de autenticação e autorização usando **Node.js**, **Express**, **SQLite** e **JWT**.

## 📋 Requisitos

- Node.js 16+ 
- npm ou yarn
- Sqlite3

## 🚀 Instalação Rápida

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com valores padrão. Para produção, altere:

```env
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

### 3. Iniciar servidor

```bash
npm start
```

O servidor está rodando em `http://localhost:3000`

## 📚 Documentação de APIs

### URLs das interfaces

- **Login**: `http://localhost:3000/login.html`
- **Cadastro**: `http://localhost:3000/cadastro.html`
- **Dashboard**: `http://localhost:3000/index.html` (requer autenticação)

---

## 🔑 Endpoints de Autenticação

### 1️⃣ Registrar Novo Usuário

**Endpoint:** `POST /api/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "Senha@123"
}
```

**Response (201):**
```json
{
  "message": "Usuário cadastrado com sucesso",
  "user": {
    "id": "uuid-aqui",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Requisitos de Senha:**
- ✅ Mínimo 8 caracteres
- ✅ Letra maiúscula
- ✅ Letra minúscula
- ✅ Número
- ✅ Caractere especial (!@#$%^&*...)

---

### 2️⃣ Fazer Login

**Endpoint:** `POST /api/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "joao@example.com",
  "password": "Senha@123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGc...",
  "sessionId": "uuid-aqui",
  "user": {
    "id": "uuid-aqui",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2025-03-16T10:30:00Z",
    "lastLogin": "2025-03-17T14:20:00Z"
  }
}
```

---

### 3️⃣ Obter Usuário Atual

**Endpoint:** `GET /api/me`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "message": "Usuário recuperado com sucesso",
  "user": {
    "id": "uuid-aqui",
    "name": "João Silva",
    "email": "joao@example.com",
    "created_at": "2025-03-16T10:30:00Z",
    "last_login": "2025-03-17T14:20:00Z"
  }
}
```

---

### 4️⃣ Verificar Token

**Endpoint:** `POST /api/verify`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "message": "Token válido",
  "user": {
    "id": "uuid-aqui",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

---

### 5️⃣ Fazer Logout

**Endpoint:** `POST /api/logout`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### 6️⃣ Logout de Todas as Sessões

**Endpoint:** `POST /api/logout-all`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "message": "Logout em todas as sessões realizado com sucesso"
}
```

---

### 7️⃣ Histórico de Logins

**Endpoint:** `GET /api/login-history?limit=10`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
- `limit` (opcional): número de registros a retornar (padrão: 10)

**Response (200):**
```json
{
  "message": "Histórico de login recuperado",
  "history": [
    {
      "id": "uuid-aqui",
      "user_id": "uuid-aqui",
      "login_at": "2025-03-17T14:20:00Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "success": 1
    }
  ]
}
```

---

### Health Check

**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-03-17T14:20:00Z"
}
```

---

## 🛡️ Recursos de Segurança

✅ **Senhas com hash seguro** - Usando bcryptjs com salt rounds = 10
✅ **JWT para autorização** - Tokens com expiração configurável
✅ **Gerenciamento de sessões** - Controle com banco de dados
✅ **Validação de entrada** - Express-validator middleware
✅ **CORS ativado** - Proteção contra requisições não autorizadas
✅ **Histórico de login** - Rastreamento de acessos
✅ **Logout remoto** - Invalidação de tokens no servidor
✅ **Força de senha** - Requisitos de complexidade obrigatórios

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `users`
```sql
- id: UUID (PRIMARY KEY)
- name: TEXT
- email: TEXT (UNIQUE)
- password_hash: TEXT
- created_at: DATETIME
- updated_at: DATETIME
- last_login: DATETIME
- is_active: BOOLEAN
```

### Tabela: `sessions`
```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY)
- token: TEXT
- created_at: DATETIME
- expires_at: DATETIME
- is_active: BOOLEAN
```

### Tabela: `login_history`
```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY)
- login_at: DATETIME
- ip_address: TEXT
- user_agent: TEXT
- success: BOOLEAN
```

---

## 💾 Storages do Frontend

A aplicação usa `localStorage` para armazenar:

- `token`: JWT token de autenticação
- `rememberEmail`: Email do usuário (se "Lembrar-me" foi marcado)

---

## 🛠️ Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | 3000 | Porta do servidor |
| `NODE_ENV` | development | Ambiente (development/production) |
| `JWT_SECRET` | *valore padrão* | Chave secreta para JWT |
| `JWT_EXPIRE` | 7d | Expiração do token |
| `DB_PATH` | ./db/dasiboard.db | Caminho do banco SQLite |
| `CORS_ORIGIN` | http://localhost:3000 | Origem CORS permitida |

---

## 📊 Telas Incluídas

### 1. **login.html**
- Campo de email e senha
- Toggle para mostrar/esconder senha
- Opção "Lembrar-me"
- Link para cadastro
- Validações em tempo real
- Feedback visual de erros/sucessos

### 2. **cadastro.html**
- Campos: Nome, Email, Senha, Confirmar Senha
- Validação de força de senha com indicador visual
- 5 requisitos obrigatórios mostrados
- Senhas sincronizadas
- Link para login

---

## 🚦 Tratamento de Erros

Todos os endpoints retornam mensagens de erro claras:

```json
{
  "message": "Descrição do erro"
}
```

**Códigos de status HTTP:**
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro na validação
- `401` - Não autenticado/Credenciais inválidas
- `404` - Não encontrado
- `500` - Erro do servidor

---

## 📝 Exemplo de Integração Frontend

```javascript
// Login
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    password: 'Senha@123' 
  })
});

const data = await response.json();
if (response.ok) {
  localStorage.setItem('token', data.token);
  window.location.href = '/index.html';
}

// Usar token
const userResponse = await fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```

---

## 🐛 Debugging

Para ativar logs detalhados, ajuste o arquivo `.env`:

```env
NODE_ENV=development
```

Os logs aparecerão no console do servidor para cada requisição.

---

## 📖 Próximos Passos

- [ ] Implementar refresh tokens
- [ ] Adicionar 2FA (autenticação em duas fatores)
- [ ] Implementar recuperação de senha
- [ ] Adicionar verificação de email
- [ ] Rate limiting por IP
- [ ] Dashboard de gerenciamento de usuários

---

## 📞 Suporte

Para dúvidas ou problemas, crie um issue no repositório.

---

**Versão:** 1.0.0  
**Última atualização:** 17 de março de 2025
