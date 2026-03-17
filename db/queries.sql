-- Script de Consultas Úteis para DaSIboard Auth

-- ====================================
-- TABELA USERS
-- ====================================

-- Listar todos os usuários
SELECT id, name, email, created_at, last_login, is_active FROM users;

-- Buscar usuário por email
SELECT * FROM users WHERE email = 'email@example.com';

-- Contar total de usuários
SELECT COUNT(*) as total_usuarios FROM users;

-- Usuários mais recentes
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Usuários inativos
SELECT * FROM users WHERE is_active = 0;

-- Usuários com último login
SELECT name, email, last_login FROM users WHERE last_login IS NOT NULL ORDER BY last_login DESC;

-- ====================================
-- TABELA SESSIONS
-- ====================================

-- Listar todas as sessões ativas
SELECT s.id, u.name, u.email, s.created_at, s.expires_at 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE s.is_active = 1;

-- Sessões expiradas
SELECT s.id, u.email, s.expires_at 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE s.is_active = 1 AND s.expires_at < datetime('now');

-- Sessões por usuário
SELECT COUNT(*) as total_sessions, u.name, u.email 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE s.is_active = 1 
GROUP BY s.user_id 
ORDER BY total_sessions DESC;

-- Limpar sessões expiradas
DELETE FROM sessions WHERE is_active = 1 AND expires_at < datetime('now');

-- ====================================
-- TABELA LOGIN_HISTORY
-- ====================================

-- Histórico de login recente
SELECT u.name, u.email, lh.login_at, lh.success, lh.ip_address 
FROM login_history lh 
JOIN users u ON lh.user_id = u.id 
ORDER BY lh.login_at DESC 
LIMIT 20;

-- Tentativas falhadas de login
SELECT u.name, u.email, lh.login_at, lh.ip_address 
FROM login_history lh 
JOIN users u ON lh.user_id = u.id 
WHERE lh.success = 0 
ORDER BY lh.login_at DESC 
LIMIT 10;

-- Logins por usuário (últimos 7 dias)
SELECT u.name, u.email, COUNT(*) as total_logins, COUNT(CASE WHEN lh.success = 0 THEN 1 END) as failed_logins
FROM login_history lh 
JOIN users u ON lh.user_id = u.id 
WHERE lh.login_at > datetime('now', '-7 days') 
GROUP BY u.id 
ORDER BY total_logins DESC;

-- ====================================
-- ESTATÍSTICAS
-- ====================================

-- Dashboard de estatísticas
SELECT 
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM users WHERE is_active = 1) as usuarios_ativos,
  (SELECT COUNT(*) FROM sessions WHERE is_active = 1) as sessoes_ativas,
  (SELECT COUNT(*) FROM login_history WHERE login_at > datetime('now', '-1 day')) as logins_hoje;

-- Atividade por hora
SELECT 
  strftime('%H', login_at) as hora,
  COUNT(*) as total_logins,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as sucessos,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as falhas
FROM login_history 
WHERE login_at > datetime('now', '-1 day')
GROUP BY strftime('%H', login_at)
ORDER BY hora;

-- Usuários mais ativos
SELECT 
  u.id,
  u.name, 
  u.email, 
  COUNT(*) as total_logins,
  MAX(lh.login_at) as ultimo_login
FROM login_history lh
JOIN users u ON lh.user_id = u.id
WHERE lh.success = 1
GROUP BY u.id
ORDER BY total_logins DESC
LIMIT 10;

-- ====================================
-- OPERAÇÕES DE MANUTENÇÃO
-- ====================================

-- Desativar usuário
UPDATE users SET is_active = 0 WHERE email = 'user@example.com';

-- Ativar usuário
UPDATE users SET is_active = 1 WHERE email = 'user@example.com';

-- Limpar sessões inativas de um usuário
DELETE FROM sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com') 
AND is_active = 0;

-- Deletar histórico de login antigo (> 90 dias)
DELETE FROM login_history 
WHERE login_at < datetime('now', '-90 days');

-- Resetar dados (CUIDADO!)
-- DELETE FROM login_history;
-- DELETE FROM sessions;
-- DELETE FROM users;
-- VACUUM;

-- ====================================
-- ANÁLISE DE SEGURANÇA
-- ====================================

-- IPs com múltiplas tentativas falhadas
SELECT 
  ip_address,
  COUNT(*) as total_tentativas,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM login_history
WHERE success = 0 AND login_at > datetime('now', '-24 hours')
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY total_tentativas DESC;

-- Usuários com login de múltiplos IPs
SELECT 
  u.name,
  u.email,
  COUNT(DISTINCT lh.ip_address) as ips_diferentes,
  COUNT(*) as total_logins
FROM login_history lh
JOIN users u ON lh.user_id = u.id
WHERE lh.success = 1 AND lh.login_at > datetime('now', '-7 days')
GROUP BY u.id
HAVING COUNT(DISTINCT lh.ip_address) > 1
ORDER BY ips_diferentes DESC;

-- ====================================
-- PRAGMA COMMANDS (info do banco)
-- ====================================

-- Ver informações da tabela users
PRAGMA table_info(users);

-- Ver informações da tabela sessions
PRAGMA table_info(sessions);

-- Ver informações da tabela login_history
PRAGMA table_info(login_history);

-- Ver todos os índices
PRAGMA index_list(users);
PRAGMA index_list(sessions);
PRAGMA index_list(login_history);

-- Verificar integridade do banco
PRAGMA integrity_check;
