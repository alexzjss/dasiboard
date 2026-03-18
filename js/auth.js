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

  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  // ===== LOGIN =====
  async login(email, password) {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      this.currentUser = result.user;
      await this.loadUserProfile();
      this.updateAuthUI();
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // ===== SIGNUP =====
  async signup(email, password, displayName) {
    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = result.user;

      await user.updateProfile({
        displayName: displayName,
        photoURL: null
      });

      // Criar documento do usuário no Firestore
      await firebase.firestore().collection('users').doc(user.uid).set({
        email: email,
        displayName: displayName,
        photoURL: null,
        createdAt: new Date(),
        bio: '',
        universidade: 'USP',
        curso: 'Sistemas de Informação'
      });

      this.currentUser = user;
      this.updateAuthUI();
      return { success: true, user: user };
    } catch (error) {
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
      if (doc.exists) {
        return doc.data();
      }
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
      // Atualizar displayName e photoURL no Firebase Auth
      if (data.displayName) {
        await this.currentUser.updateProfile({
          displayName: data.displayName,
          photoURL: data.photoURL || this.currentUser.photoURL
        });
      }

      // Atualizar documento no Firestore
      await firebase.firestore().collection('users').doc(this.currentUser.uid).update({
        displayName: data.displayName || this.currentUser.displayName,
        photoURL: data.photoURL || this.currentUser.photoURL,
        bio: data.bio || '',
        curso: data.curso || 'Sistemas de Informação'
      });

      // Recarregar usuário
      await this.currentUser.reload();
      this.updateAuthUI();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== UPLOAD FOTO DE PERFIL =====
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

  // ===== FORMATAR MENSAGENS DE ERRO =====
  getErrorMessage(code) {
    const errors = {
      'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
      'auth/email-already-in-use': 'Este email já está registrado.',
      'auth/invalid-email': 'Email inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/account-exists-with-different-credential': 'Email já associado a outra conta.'
    };
    return errors[code] || 'Erro de autenticação. Tente novamente.';
  }

  // ===== ATUALIZAR UI =====
  updateAuthUI() {
    const updateButton = (btn, icon, isTopbar = false) => {
      if (!btn || !icon) return;
      
      if (this.isAuthenticated()) {
        btn.dataset.state = 'authenticated';
        const initial = this.currentUser.displayName?.[0]?.toUpperCase() || this.currentUser.email?.[0]?.toUpperCase() || '?';
        
        // Mostrar apenas a inicial
        icon.innerHTML = initial;
        icon.style.fontSize = isTopbar ? '16px' : '14px';
        icon.style.fontWeight = '700';
        icon.style.color = 'inherit';
        
        btn.title = `${this.currentUser.displayName || 'Usuário'}`;
      } else {
        btn.dataset.state = 'guest';
        
        // Mostrar SVG (filled para melhor visibilidade)
        icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
        
        btn.title = 'Fazer login';
      }
    };

    // Topbar
    const profileBtn = document.getElementById('profile-btn');
    const profileIcon = document.getElementById('profile-icon');
    updateButton(profileBtn, profileIcon, true);

    // Sidebar Header
    const sidebarHeaderProfileBtn = document.getElementById('sidebar-header-profile-btn');
    const sidebarHeaderProfileIcon = document.getElementById('sidebar-header-profile-icon');
    updateButton(sidebarHeaderProfileBtn, sidebarHeaderProfileIcon, true);
  }
}

// Instância global
const authManager = new AuthManager();

// Inicializar na página
document.addEventListener('DOMContentLoaded', () => {
  authManager.init().then(user => {
    // Verificar se está em página que precisa de autenticação
    const requiredAuth = ['profile.html', 'dashboard.html'].some(page => window.location.pathname.includes(page));
    
    if (requiredAuth && !user) {
      window.location.href = 'login.html';
    }
  });
});
