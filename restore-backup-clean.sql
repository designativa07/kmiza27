-- =====================================================
-- 🔧 RESTAURAÇÃO LIMPA DO BACKUP DA VPS - PGADMIN
-- =====================================================
-- Este script prepara o banco para receber o backup da VPS

-- CONECTAR COMO SUPERUSUÁRIO POSTGRES E EXECUTAR:

-- Desconectar todos os usuários do banco
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity 
WHERE datname = 'kmiza27_dev' AND pid <> pg_backend_pid();

-- Apagar o banco atual
DROP DATABASE IF EXISTS kmiza27_dev;

-- Criar banco limpo
CREATE DATABASE kmiza27_dev WITH OWNER = admin;

-- =====================================================
-- 📋 VERIFICAÇÃO
-- =====================================================

-- Verificar se o banco foi criado
SELECT datname, datowner::regrole as owner 
FROM pg_database 
WHERE datname = 'kmiza27_dev';

-- =====================================================
-- 🚀 PRÓXIMOS PASSOS
-- =====================================================

/*
APÓS EXECUTAR ESTE SCRIPT:

1. FECHE esta janela de query
2. CONECTE-SE ao banco kmiza27_dev:
   - No Object Explorer, clique com botão direito em kmiza27_dev
   - Selecione "Connect Database"
   
3. RESTAURE o backup:
   - Clique com botão direito em kmiza27_dev
   - Selecione "Restore..."
   - Em "Filename" selecione seu arquivo de backup
   - Em "Options" marque "Clean before restore"
   - Clique em "Restore"

OU

4. EXECUTE o backup via Query Tool:
   - Conecte ao banco kmiza27_dev
   - Abra Query Tool
   - Cole o conteúdo do arquivo de backup
   - Execute
*/ 