# ⚙️ LEIA-ME — Configuração do Firebase

Siga os passos abaixo para que o sistema de login funcione corretamente no DaSIboard.

---

## 1. Ativar autenticação por Email/Senha

No **Firebase Console** (https://console.firebase.google.com/):

1. Selecione o projeto `dasiboard-db`
2. No menu lateral, clique em **Build → Authentication**
3. Clique na aba **Sign-in method**
4. Clique em **Email/Password**
5. Ative a opção **Email/Password** (primeira chave)
6. Clique em **Save**

> ⚠️ Sem esse passo, todos os cadastros e logins retornam erro `auth/operation-not-allowed`.

---

## 2. Configurar domínios autorizados

Ainda em **Authentication → Settings → Authorized domains**:

Adicione os domínios onde o site estará hospedado, por exemplo:

- `localhost` (já deve estar lá)
- `alexzjss.github.io` (ou o domínio do seu GitHub Pages)
- Qualquer outro domínio customizado

> ⚠️ Sem isso, o Firebase pode bloquear requests vindos do seu domínio com erro de CORS ou `auth/unauthorized-domain`.

---

## 3. Criar regras do Firestore (opcional, mas recomendado)

Em **Build → Firestore Database → Rules**, configure:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Isso garante que cada usuário só acessa os próprios dados.

---

## 4. Criar regras do Storage (para foto de perfil)

Em **Build → Storage → Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Verificar credenciais do Firebase

O arquivo `js/firebase-config.js` já está preenchido com as credenciais do projeto.
Se precisar trocar de projeto, substitua os valores em:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 6. Correções aplicadas nesta versão

| Problema | Causa | Solução |
|---|---|---|
| Cadastro retornava erro de autenticação | SDK Firebase v9 (modular) incompatível com código v8 | Trocado para Firebase v8 compat CDN |
| Login não funcionava | Mesmo problema de versão | Idem |
| Sem `login.html` | Arquivo ausente | Criado `login.html` completo |
| Sem `profile.html` | Arquivo ausente | Criado `profile.html` completo |
| Ícone de perfil sem menu dinâmico | Menus eram estáticos no HTML | Menus agora são gerados dinamicamente por `auth.js` |
| "Sair" usava `confirm()` nativo | Sem modal customizado | Adicionado modal de confirmação com visual do DaSIboard |
| Menu não mostrava "Iniciar sessão" | Itens fixos no HTML | Menu renderizado dinamicamente conforme estado de auth |

---

## URLs do projeto

- **GitHub Pages**: https://alexzjss.github.io/dasiboard/
- **Firebase Console**: https://console.firebase.google.com/project/dasiboard-db
