-- =====================================================
-- 📖 CRIAÇÃO DE USUÁRIO SOMENTE LEITURA - KMIZA27 DB
-- =====================================================
-- Este script cria um usuário com permissões apenas de leitura
-- para o banco de dados kmiza27

-- 1. Criar o usuário (substitua 'senha_segura' por uma senha forte)
CREATE USER kmiza27_readonly WITH PASSWORD 'sua_senha_aqui_123!';

-- 2. Conceder permissão de conexão ao banco
GRANT CONNECT ON DATABASE kmiza27 TO kmiza27_readonly;

-- 3. Conectar ao banco kmiza27 para configurar permissões de schema
\c kmiza27;

-- 4. Conceder permissão de uso do schema public
GRANT USAGE ON SCHEMA public TO kmiza27_readonly;

-- 5. Conceder permissão de SELECT em todas as tabelas existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO kmiza27_readonly;

-- 6. Conceder permissão de SELECT em todas as sequências (para IDs auto-incremento)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO kmiza27_readonly;

-- 7. Configurar permissões padrão para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO kmiza27_readonly;

-- 8. Configurar permissões padrão para sequências futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON SEQUENCES TO kmiza27_readonly;

-- =====================================================
-- 📋 VERIFICAÇÃO DAS PERMISSÕES
-- =====================================================

-- Verificar se o usuário foi criado
SELECT usename, usesuper, usecreatedb, usecanlogin 
FROM pg_user 
WHERE usename = 'kmiza27_readonly';

-- Verificar permissões do usuário no banco
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.role_table_grants 
WHERE grantee = 'kmiza27_readonly'
ORDER BY table_name;

-- =====================================================
-- 🔧 COMANDOS PARA REMOÇÃO (SE NECESSÁRIO)
-- =====================================================

-- Para remover o usuário (descomente se necessário):
-- REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM kmiza27_readonly;
-- REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM kmiza27_readonly;
-- REVOKE USAGE ON SCHEMA public FROM kmiza27_readonly;
-- REVOKE CONNECT ON DATABASE kmiza27 FROM kmiza27_readonly;
-- DROP USER kmiza27_readonly;

-- =====================================================
-- 📝 INFORMAÇÕES DE CONEXÃO
-- =====================================================

/*
Para conectar com o usuário readonly:

Host: h4xd66.easypanel.host (ou localhost se local)
Port: 5432
Database: kmiza27
Username: kmiza27_readonly
Password: sua_senha_aqui_123!

String de conexão:
postgresql://kmiza27_readonly:sua_senha_aqui_123!@h4xd66.easypanel.host:5432/kmiza27

Exemplo de teste de conexão:
psql -h h4xd66.easypanel.host -p 5432 -U kmiza27_readonly -d kmiza27

Permissões do usuário:
✅ SELECT em todas as tabelas
✅ SELECT em todas as sequências  
✅ Conexão ao banco kmiza27
❌ INSERT, UPDATE, DELETE (bloqueado)
❌ CREATE, DROP, ALTER (bloqueado)
❌ Permissões administrativas (bloqueado)
*/ 