import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';

const SALT_ROUNDS = 10;

// Validate email format
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
export function validatePasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    return {
        isStrong: Object.values(requirements).every(req => req),
        requirements
    };
}

// Hash password
export async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Erro ao criptografar senha: ' + error.message);
    }
}

// Compare password
export async function comparePassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error('Erro ao comparar senha: ' + error.message);
    }
}

// Generate unique ID
export function generateId() {
    return uuidv4();
}

// Get user by email
export async function getUserByEmail(email) {
    const db = getDatabase();
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
}

// Get user by ID
export async function getUserById(id) {
    const db = getDatabase();
    return await db.get('SELECT id, name, email, created_at, last_login FROM users WHERE id = ?', [id]);
}

// Create new user
export async function createUser(name, email, password) {
    try {
        // Validate inputs
        if (!name || name.trim().length === 0) {
            throw new Error('Nome é obrigatório');
        }

        if (!validateEmail(email)) {
            throw new Error('Email inválido');
        }

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isStrong) {
            throw new Error('Senha não atende aos requisitos de segurança');
        }

        // Check if email already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            throw new Error('Email já cadastrado');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const userId = generateId();
        const db = getDatabase();

        await db.run(
            'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [userId, name, email, passwordHash]
        );

        return { id: userId, name, email };
    } catch (error) {
        throw error;
    }
}

// Create session
export async function createSession(userId, token, expiresIn = '7d') {
    try {
        const sessionId = generateId();
        const db = getDatabase();

        // Parse expiration time
        const expiresAt = new Date();
        if (expiresIn.includes('d')) {
            const days = parseInt(expiresIn);
            expiresAt.setDate(expiresAt.getDate() + days);
        } else if (expiresIn.includes('h')) {
            const hours = parseInt(expiresIn);
            expiresAt.setHours(expiresAt.getHours() + hours);
        } else {
            expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
        }

        await db.run(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, userId, token, expiresAt.toISOString()]
        );

        return sessionId;
    } catch (error) {
        throw new Error('Erro ao criar sessão: ' + error.message);
    }
}

// Record login
export async function recordLogin(userId, ipAddress = null, userAgent = null, success = true) {
    try {
        const loginId = generateId();
        const db = getDatabase();

        await db.run(
            'INSERT INTO login_history (id, user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?)',
            [loginId, userId, ipAddress, userAgent, success ? 1 : 0]
        );

        // Update last login
        if (success) {
            await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
        }
    } catch (error) {
        console.error('Erro ao registrar login:', error);
    }
}

// Logout user
export async function logoutUser(sessionId) {
    try {
        const db = getDatabase();
        await db.run('UPDATE sessions SET is_active = 0 WHERE id = ?', [sessionId]);
    } catch (error) {
        throw new Error('Erro ao fazer logout: ' + error.message);
    }
}

// Get user login history
export async function getUserLoginHistory(userId, limit = 10) {
    try {
        const db = getDatabase();
        return await db.all(
            'SELECT * FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT ?',
            [userId, limit]
        );
    } catch (error) {
        throw new Error('Erro ao obter histórico de login: ' + error.message);
    }
}

// Logout all sessions
export async function logoutAllSessions(userId) {
    try {
        const db = getDatabase();
        await db.run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [userId]);
    } catch (error) {
        throw new Error('Erro ao fazer logout em todas as sessões: ' + error.message);
    }
}
