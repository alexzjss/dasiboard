import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeDatabase, closeDatabase } from './db/database.js';
import authRoutes from './server-routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('./'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile('./index.html', { root: __dirname });
});

app.get('/login', (req, res) => {
    res.sendFile('./login.html', { root: __dirname });
});

app.get('/cadastro', (req, res) => {
    res.sendFile('./cadastro.html', { root: __dirname });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { error: err })
    });
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();

        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║  🚀 DaSIboard Auth Server              ║
╠════════════════════════════════════════╣
║  Server rodando em: http://localhost:${PORT} ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                 ║
║  Banco de dados: ${process.env.DB_PATH || './db/dasiboard.db'}    ║
╚════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n\n╔════════════════════════════════════════╗');
    console.log('║  Encerrando servidor...                ║');
    console.log('╚════════════════════════════════════════╝');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n\n╔════════════════════════════════════════╗');
    console.log('║  Encerrando servidor...                ║');
    console.log('╚════════════════════════════════════════╝');
    await closeDatabase();
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
});
