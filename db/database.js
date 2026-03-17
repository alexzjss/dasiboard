import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || './db/dasiboard.db';

// Ensure db directory exists
const dbDir = dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

export async function initializeDatabase() {
    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        await db.exec('PRAGMA foreign_keys = ON');
        console.log('✓ Banco de dados SQLite conectado');

        // Create users table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        `);

        // Create sessions table for token management
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create login history table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS login_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                success BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create indexes for better performance
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
            CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
        `);

        console.log('✓ Tabelas do banco de dados criadas/verificadas');
        return db;
    } catch (error) {
        console.error('✗ Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}

export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

export async function closeDatabase() {
    if (db) {
        await db.close();
        console.log('✓ Banco de dados fechado');
    }
}
