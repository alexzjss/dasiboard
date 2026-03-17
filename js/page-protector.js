/**
 * Protetor de Página - Exemplo de Uso
 * 
 * Inclua este arquivo ANTES de outras scripts na sua página protegida.
 * Ele vai redirecionar para login se não estiver autenticado.
 */

(async function() {
    // Aguardar que auth-client.js seja carregado
    const maxAttempts = 10;
    let attempts = 0;

    while (!window.auth && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.auth) {
        console.error('⚠️ auth-client.js não foi carregado');
        window.location.href = '/login.html';
        return;
    }

    // Proteger página - redirecionar se não autenticado
    const isProtected = await window.auth.protectPage('/login.html');

    if (isProtected) {
        console.log('✓ Página protegida - Usuário autenticado');

        // Exemplo: Exibir informações do usuário
        const userResult = await window.auth.getCurrentUser();
        if (userResult.success) {
            console.log(`Bem-vindo, ${userResult.data.name}!`);
            document.title = `${userResult.data.name} - DaSIboard`;

            // Exemplo: Atualizar UI com dados do usuário
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = userResult.data.name;
            }
        }

        // Exemplo: Adicionar botão de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const result = await window.auth.logout();
                if (result.success) {
                    window.location.href = '/login.html';
                } else {
                    alert('Erro ao fazer logout: ' + result.error);
                }
            });
        }

        // Exemplo: Exibir histórico de login
        const historyBtn = document.getElementById('show-history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const result = await window.auth.getLoginHistory(5);
                if (result.success) {
                    console.table(result.data);
                    alert('Histórico de login exibido no console');
                } else {
                    alert('Erro ao obter histórico: ' + result.error);
                }
            });
        }
    } else {
        console.log('❌ Redirecionando para login...');
    }
})();
