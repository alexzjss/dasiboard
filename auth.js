// ===== AUTHENTICATION MODULE =====

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
  }

  init() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        this.currentUser = user;
        this.initialized = true;
        this.updateAuthUI();
        resolve(user);
      });
    });
  }

  getUser() { return this.currentUser; }
  isAuthenticated() { return this.currentUser !== null; }

  // ===== LOGIN =====
  async login(email, password) {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      this.currentUser = result.user;
      await this.loadUserProfile();
      this.updateAuthUI();
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // ===== SIGNUP =====
  async signup(email, password, displayName) {
    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = result.user;

      await user.updateProfile({ displayName: displayName, photoURL: null });

      // Criar doc no Firestore (não-bloqueante)
      try {
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: email,
          displayName: displayName,
          photoURL: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          bio: '',
          universidade: 'USP',
          curso: 'Sistemas de Informação'
        });
      } catch (fsErr) {
        console.warn('Firestore write failed (non-blocking):', fsErr);
      }

      this.currentUser = user;
      this.updateAuthUI();
      return { success: true, user: user };
    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // ===== LOGOUT =====
  async logout() {
    try {
      await firebase.auth().signOut();
      this.currentUser = null;
      this.updateAuthUI();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== CARREGAR PERFIL =====
  async loadUserProfile() {
    if (!this.currentUser) return null;
    try {
      const doc = await firebase.firestore().collection('users').doc(this.currentUser.uid).get();
      if (doc.exists) return doc.data();
      return null;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  }

  // ===== ATUALIZAR PERFIL =====
  async updateProfile(data) {
    if (!this.currentUser) return { success: false, error: 'Não autenticado' };
    try {
      if (data.displayName) {
        await this.currentUser.updateProfile({
          displayName: data.displayName,
          photoURL: data.photoURL || this.currentUser.photoURL
        });
      }
      try {
        await firebase.firestore().collection('users').doc(this.currentUser.uid).update({
          displayName: data.displayName || this.currentUser.displayName,
          photoURL: data.photoURL || this.currentUser.photoURL,
          bio: data.bio || '',
          curso: data.curso || 'Sistemas de Informação'
        });
      } catch (fsErr) {
        console.warn('Firestore update non-blocking:', fsErr);
      }
      await this.currentUser.reload();
      this.updateAuthUI();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== UPLOAD FOTO =====
  async uploadProfilePhoto(file) {
    if (!this.currentUser) return { success: false, error: 'Não autenticado' };
    try {
      const storageRef = firebase.storage().ref(`profiles/${this.currentUser.uid}/avatar`);
      await storageRef.put(file);
      const photoURL = await storageRef.getDownloadURL();
      await this.currentUser.updateProfile({ photoURL });
      await this.updateProfile({ photoURL });
      return { success: true, photoURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== MENSAGENS DE ERRO =====
  getErrorMessage(code) {
    const errors = {
      'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
      'auth/email-already-in-use': 'Este email já está registrado.',
      'auth/invalid-email': 'Email inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'Email ou senha incorretos.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/operation-not-allowed': 'Login por email/senha não está ativo. Ative no Firebase Console.',
      'auth/account-exists-with-different-credential': 'Email já associado a outra conta.',
      'auth/network-request-failed': 'Erro de rede. Verifique sua conexão.',
      'auth/requires-recent-login': 'Faça login novamente para continuar.'
    };
    return errors[code] || `Erro (${code}). Tente novamente.`;
  }

  // ===== ATUALIZAR UI DOS BOTÕES =====
  updateAuthUI() {
    const authenticated = this.isAuthenticated();
    const user = this.currentUser;

    const updateButton = (btnId, iconId) => {
      const btn = document.getElementById(btnId);
      const icon = document.getElementById(iconId);
      if (!btn || !icon) return;
      if (authenticated) {
        btn.dataset.state = 'authenticated';
        const initial = user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
        icon.innerHTML = initial;
        icon.style.fontSize = '16px';
        icon.style.fontWeight = '700';
        icon.style.color = 'inherit';
        btn.title = user.displayName || user.email || 'Meu perfil';
      } else {
        btn.dataset.state = 'guest';
        icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
        icon.style.fontSize = '';
        icon.style.fontWeight = '';
        btn.title = 'Fazer login';
      }
    };

    updateButton('profile-btn', 'profile-icon');
    updateButton('sidebar-header-profile-btn', 'sidebar-header-profile-icon');

    this._renderProfileMenus(authenticated, user);
  }

  // ===== RENDERIZAR MENUS DROPDOWN =====
  _renderProfileMenus(authenticated, user) {
    ['profile-menu-box-sidebar', 'profile-menu-box-topbar'].forEach(id => {
      const box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = '';

      if (authenticated) {
        // Cabeçalho com nome/email
        const header = document.createElement('div');
        header.style.cssText = 'padding:10px 14px 10px;border-bottom:1px solid var(--glass-border);margin-bottom:4px';
        header.innerHTML = `
          <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.displayName || 'Usuário'}</div>
          <div style="font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email || ''}</div>`;
        box.appendChild(header);

        // Ver perfil
        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'profile-menu-item profile-menu-profile';
        profileLink.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Ver perfil</span>`;
        box.appendChild(profileLink);

        // Encerrar sessão
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'profile-menu-item profile-menu-logout';
        logoutBtn.onclick = () => { closeProfileMenu('both'); confirmLogout(); };
        logoutBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Encerrar sessão</span>`;
        box.appendChild(logoutBtn);

      } else {
        // Iniciar sessão
        const loginBtn = document.createElement('button');
        loginBtn.className = 'profile-menu-item';
        loginBtn.style.cssText = 'font-weight:600;color:var(--primary)';
        loginBtn.onclick = () => { closeProfileMenu('both'); window.location.href = 'login.html'; };
        loginBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Iniciar sessão</span>`;
        box.appendChild(loginBtn);
      }
    });
  }
}

// Instância global
const authManager = new AuthManager();

document.addEventListener('DOMContentLoaded', () => {
  authManager.init().then(user => {
    const requiredAuth = ['profile.html', 'dashboard.html'].some(p => window.location.pathname.includes(p));
    if (requiredAuth && !user) window.location.href = 'login.html';
  });
});
