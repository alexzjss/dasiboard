import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Verify token and attach user to request
export async function verifyToken(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDatabase();

        // Check if session is still active
        const session = await db.get(
            'SELECT * FROM sessions WHERE token = ? AND is_active = 1',
            [token]
        );

        if (!session) {
            return res.status(401).json({ message: 'Sessão expirada' });
        }

        // Check if token has expired
        if (new Date() > new Date(session.expires_at)) {
            await db.run('UPDATE sessions SET is_active = 0 WHERE id = ?', [session.id]);
            return res.status(401).json({ message: 'Token expirado' });
        }

        req.user = decoded;
        req.sessionId = session.id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(401).json({ message: 'Token inválido' });
    }
}

// Create JWT token
export function createToken(userData) {
    return jwt.sign(
        {
            id: userData.id,
            email: userData.email,
            name: userData.name
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
}

// Validate token
export function validateToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}
