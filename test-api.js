#!/usr/bin/env node

/**
 * Script de teste para APIs de autenticação
 * Use: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';
let testResults = [];

class Colors {
    static reset = '\x1b[0m';
    static green = '\x1b[32m';
    static red = '\x1b[31m';
    static yellow = '\x1b[33m';
    static blue = '\x1b[34m';
    static cyan = '\x1b[36m';
}

async function test(name, fn) {
    try {
        console.log(`\n${Colors.blue}🧪 ${name}${Colors.reset}`);
        await fn();
        console.log(`${Colors.green}✓ Passou${Colors.reset}`);
        testResults.push({ name, status: 'passou' });
    } catch (error) {
        console.log(`${Colors.red}✗ Falhou: ${error.message}${Colors.reset}`);
        testResults.push({ name, status: 'falhou', error: error.message });
    }
}

async function request(method, path, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    if (global.token) {
        options.headers.Authorization = `Bearer ${global.token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message}`);
    }

    return data;
}

async function runTests() {
    console.log(`
╔════════════════════════════════════════╗
║  DaSIboard - Teste de API             ║
╠════════════════════════════════════════╣
║  Base URL: ${BASE_URL.padEnd(37)}║
╚════════════════════════════════════════╝
    `);

    // 1. Health Check
    await test('Health Check', async () => {
        const data = await request('GET', '/api/health');
        if (data.status !== 'ok') throw new Error('Status não é ok');
    });

    // 2. Registrar novo usuário
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Senha@123456';
    const testName = 'Usuário Teste';

    await test('POST /api/register - Registrar novo usuário', async () => {
        const data = await request('POST', '/api/register', {
            name: testName,
            email: testEmail,
            password: testPassword
        });
        if (!data.user.id) throw new Error('Usuário não recebeu ID');
        global.userId = data.user.id;
    });

    // 3. Tentar registrar com email duplicado
    await test('POST /api/register - Rejeitar email duplicado', async () => {
        try {
            await request('POST', '/api/register', {
                name: 'Outro Nome',
                email: testEmail,
                password: testPassword
            });
            throw new Error('Deveria ter rejeitado email duplicado');
        } catch (error) {
            if (!error.message.includes('HTTP')) throw error;
        }
    });

    // 4. Registrar com senha fraca
    await test('POST /api/register - Rejeitar senha fraca', async () => {
        try {
            await request('POST', '/api/register', {
                name: 'Outro Nome',
                email: `teste_${Date.now()}@example.com`,
                password: 'fraca'
            });
            throw new Error('Deveria ter rejeitado senha fraca');
        } catch (error) {
            if (!error.message.includes('HTTP')) throw error;
        }
    });

    // 5. Fazer login
    await test('POST /api/login - Login com credenciais corretas', async () => {
        const data = await request('POST', '/api/login', {
            email: testEmail,
            password: testPassword
        });
        if (!data.token) throw new Error('Token não retornado');
        if (!data.sessionId) throw new Error('Session ID não retornado');
        global.token = data.token;
        global.sessionId = data.sessionId;
    });

    // 6. Login com senha incorreta
    await test('POST /api/login - Rejeitar senha incorreta', async () => {
        try {
            await request('POST', '/api/login', {
                email: testEmail,
                password: 'SenhaErrada@123'
            });
            throw new Error('Deveria ter rejeitado senha incorreta');
        } catch (error) {
            if (!error.message.includes('HTTP')) throw error;
        }
    });

    // 7. Obter usuário atual
    await test('GET /api/me - Obter usuário autenticado', async () => {
        const data = await request('GET', '/api/me');
        if (data.user.email !== testEmail) throw new Error('Email não corresponde');
    });

    // 8. Verificar token
    await test('POST /api/verify - Verificar validade do token', async () => {
        const data = await request('POST', '/api/verify');
        if (!data.user) throw new Error('Usuário não retornado');
    });

    // 9. Obter histórico de login
    await test('GET /api/login-history - Obter histórico de logins', async () => {
        const data = await request('GET', '/api/login-history?limit=5');
        if (!Array.isArray(data.history)) throw new Error('Histórico não é array');
    });

    // 10. Fazer logout
    await test('POST /api/logout - Fazer logout', async () => {
        const data = await request('POST', '/api/logout');
        if (!data.message) throw new Error('Resposta vazia do logout');
    });

    // 11. Verificar se token foi invalidado
    await test('POST /api/verify - Verificar token invalidado', async () => {
        try {
            await request('POST', '/api/verify');
            throw new Error('Deveria ter rejeitado token invalidado');
        } catch (error) {
            if (!error.message.includes('HTTP')) throw error;
        }
    });

    // Nova sessão para testes finais
    console.log(`\n${Colors.cyan}➜ Criando nova sessão para testes finais...${Colors.reset}`);
    const loginData = await request('POST', '/api/login', {
        email: testEmail,
        password: testPassword
    });
    global.token = loginData.token;
    global.sessionId = loginData.sessionId;

    // 12. Logout de todas as sessões
    await test('POST /api/logout-all - Logout de todas as sessões', async () => {
        const data = await request('POST', '/api/logout-all');
        if (!data.message) throw new Error('Resposta vazia');
    });

    // Resumo
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passou').length;
    const failedTests = totalTests - passedTests;

    console.log(`
╔════════════════════════════════════════╗
║  📊 Resumo dos Testes                  ║
╠════════════════════════════════════════╣
║  Total: ${totalTests.toString().padEnd(3)}                             ║
║  ${Colors.green}Passou: ${passedTests.toString()}${Colors.reset}                             ║
║  ${Colors.red}Falhou: ${failedTests.toString()}${Colors.reset}                              ║
╠════════════════════════════════════════╣
    `);

    if (failedTests === 0) {
        console.log(`║  ${Colors.green}✓ Todos os testes passaram!${Colors.reset}         ║`);
    } else {
        console.log(`║  ${Colors.red}✗ Alguns testes falharam${Colors.reset}           ║`);
    }

    console.log('╚════════════════════════════════════════╝\n');

    // Detalhes dos testes
    console.log(`${Colors.cyan}📝 Detalhes:${Colors.reset}\n`);
    testResults.forEach((result, index) => {
        const icon = result.status === 'passou' ? `${Colors.green}✓${Colors.reset}` : `${Colors.red}✗${Colors.reset}`;
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`  ${icon} ${index + 1}. ${result.name}${error}`);
    });

    process.exit(failedTests === 0 ? 0 : 1);
}

// Executar testes
runTests().catch(error => {
    console.error(`\n${Colors.red}❌ Erro fatal: ${error.message}${Colors.reset}\n`);
    process.exit(1);
});
