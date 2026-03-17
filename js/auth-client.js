/**
 * Sistema de Autenticação Cliente
 * Funções auxiliares para gerenciar autenticação no frontend
 */

class AuthManager {
    constructor(config = {}) {
        this.tokenKey = config.tokenKey || 'token';
        this.sessionIdKey = config.sessionIdKey || 'sessionId';
        this.apiBaseUrl = config.apiBaseUrl || '';
    }

    /**
     * Obter token de autenticação
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Obter session ID
     */
    getSessionId() {
        return localStorage.getItem(this.sessionIdKey);
    }

    /**
     * Definir token e session ID
     */
    setSession(token, sessionId) {
        localStorage.setItem(this.tokenKey, token);
        if (sessionId) {
            localStorage.setItem(this.sessionIdKey, sessionId);
        }
    }

    /**
     * Limpar sessão
     */
    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.sessionIdKey);
    }

    /**
     * Verificar se usuário está autenticado
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Fazer login
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setSession(data.token, data.sessionId);
                return { success: true, data };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Fazer logout
     */
    async logout() {
        try {
            const token = this.getToken();
            if (!token) {
                this.clearSession();
                return { success: true };
            }

            const response = await fetch(`${this.apiBaseUrl}/api/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            this.clearSession();

            if (response.ok) {
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.message };
            }
        } catch (error) {
            this.clearSession();
            return { success: true }; // Limpar mesmo se falhar
        }
    }

    /**
     * Registrar novo usuário
     */
    async register(name, email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter dados do usuário atual
     */
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, error: 'Não autenticado' };
            }

            const response = await fetch(`${this.apiBaseUrl}/api/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.user };
            } else {
                if (response.status === 401) {
                    this.clearSession();
                }
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar validade do token
     */
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) {
                return { valid: false };
            }

            const response = await fetch(`${this.apiBaseUrl}/api/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return { valid: true };
            } else {
                this.clearSession();
                return { valid: false };
            }
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Obter histórico de login
     */
    async getLoginHistory(limit = 10) {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, error: 'Não autenticado' };
            }

            const response = await fetch(`${this.apiBaseUrl}/api/login-history?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.history };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Fazer logout de todas as sessões
     */
    async logoutAllSessions() {
        try {
            const token = this.getToken();
            if (!token) {
                this.clearSession();
                return { success: true };
            }

            const response = await fetch(`${this.apiBaseUrl}/api/logout-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            this.clearSession();

            if (response.ok) {
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.message };
            }
        } catch (error) {
            this.clearSession();
            return { success: true };
        }
    }

    /**
     * Fazer requisição autenticada
     */
    async fetchAuthenticated(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('Não autenticado');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.clearSession();
            throw new Error('Sessão expirada');
        }

        return response;
    }

    /**
     * Proteger página - redirecionar se não autenticado
     */
    async protectPage(redirectUrl = '/login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }

        // Verificar validade do token
        const verification = await this.verifyToken();
        if (!verification.valid) {
            window.location.href = redirectUrl;
            return false;
        }

        return true;
    }
}

// Exportar para uso global
window.AuthManager = AuthManager;

// Criar instância global
window.auth = new AuthManager();
