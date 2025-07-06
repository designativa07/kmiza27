-- =====================================================
-- 🔧 CRIAÇÃO DO USUÁRIO ADMIN PARA KMIZA27
-- =====================================================
-- Este script cria o usuário admin com permissões completas

-- 1. Criar o usuário admin (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'password';
        RAISE NOTICE 'Usuário admin criado com sucesso';
    ELSE
        RAISE NOTICE 'Usuário admin já existe';
    END IF;
END
$$;

-- 2. Conceder privilégios de superusuário
ALTER USER admin WITH SUPERUSER CREATEDB CREATEROLE;

-- 3. Criar o banco kmiza27_dev se não existir
SELECT 'CREATE DATABASE kmiza27_dev WITH OWNER = admin' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kmiza27_dev')\gexec

-- 4. Conceder todos os privilégios no banco
GRANT ALL PRIVILEGES ON DATABASE kmiza27_dev TO admin;

-- 5. Conectar ao banco kmiza27_dev e conceder privilégios no schema
\c kmiza27_dev;

-- 6. Conceder privilégios no schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;

-- 7. Conceder privilégios em todas as tabelas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- 8. Conceder privilégios em todas as sequências
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- 9. Configurar privilégios padrão para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;

-- 10. Configurar privilégios padrão para sequências futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;

-- =====================================================
-- 📋 VERIFICAÇÃO
-- =====================================================

-- Verificar se o usuário foi criado corretamente
SELECT usename, usesuper, usecreatedb, usecanlogin FROM pg_user WHERE usename = 'admin';

-- Verificar se o banco foi criado
SELECT datname, datdba FROM pg_database WHERE datname = 'kmiza27_dev';

RAISE NOTICE 'Usuário admin configurado com sucesso para o banco kmiza27_dev'; 