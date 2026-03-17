import express from 'express';
import { body, validationResult } from 'express-validator';
import {
    createUser,
    getUserByEmail,
    comparePassword,
    createSession,
    recordLogin,
    logoutUser,
    logoutAllSessions,
    getUserLoginHistory,
    getUserById
} from './js/auth-utils.js';
import { verifyToken, createToken } from './js/auth-middleware.js';

const router = express.Router();

// Register endpoint
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        // Create user
        const user = await createUser(name, email, password);

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(400).json({ message: error.message });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        // Find user
        const user = await getUserByEmail(email);
        if (!user) {
            // Record failed login attempt
            await recordLogin(null, req.ip, req.get('user-agent'), false);
            return res.status(401).json({ message: 'Email ou senha incorretos' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({ message: 'Usuário inativo' });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            // Record failed login attempt
            await recordLogin(user.id, req.ip, req.get('user-agent'), false);
            return res.status(401).json({ message: 'Email ou senha incorretos' });
        }

        // Create token
        const token = createToken(user);

        // Create session
        const sessionId = await createSession(user.id, token, process.env.JWT_EXPIRE || '7d');

        // Record successful login
        await recordLogin(user.id, req.ip, req.get('user-agent'), true);

        return res.status(200).json({
            message: 'Login realizado com sucesso',
            token,
            sessionId,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

// Logout endpoint
router.post('/logout', verifyToken, async (req, res) => {
    try {
        await logoutUser(req.sessionId);
        return res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Erro ao fazer logout' });
    }
});

// Logout all sessions endpoint
router.post('/logout-all', verifyToken, async (req, res) => {
    try {
        await logoutAllSessions(req.user.id);
        return res.status(200).json({ message: 'Logout em todas as sessões realizado com sucesso' });
    } catch (error) {
        console.error('Logout all error:', error);
        return res.status(500).json({ message: 'Erro ao fazer logout' });
    }
});

// Get current user endpoint
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        return res.status(200).json({
            message: 'Usuário recuperado com sucesso',
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: 'Erro ao recuperar usuário' });
    }
});

// Verify token endpoint
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        return res.status(200).json({
            message: 'Token válido',
            user
        });
    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ message: 'Erro ao verificar token' });
    }
});

// Get login history endpoint
router.get('/login-history', verifyToken, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const history = await getUserLoginHistory(req.user.id, limit);
        return res.status(200).json({
            message: 'Histórico de login recuperado',
            history
        });
    } catch (error) {
        console.error('Login history error:', error);
        return res.status(500).json({ message: 'Erro ao recuperar histórico' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
