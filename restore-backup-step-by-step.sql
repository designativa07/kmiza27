-- =====================================================
-- 🔧 RESTAURAÇÃO LIMPA - PASSO A PASSO
-- =====================================================

-- EXECUTE CADA COMANDO SEPARADAMENTE (UM POR VEZ)

-- =====================================================
-- PASSO 1: DESCONECTAR USUÁRIOS
-- =====================================================
-- Copie e execute este comando primeiro:

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity 
WHERE datname = 'kmiza27_dev' AND pid <> pg_backend_pid();

-- =====================================================
-- PASSO 2: APAGAR O BANCO
-- =====================================================
-- Copie e execute este comando (SOZINHO):

DROP DATABASE IF EXISTS kmiza27_dev;

-- =====================================================
-- PASSO 3: CRIAR BANCO LIMPO
-- =====================================================
-- Copie e execute este comando:

CREATE DATABASE kmiza27_dev WITH OWNER = admin;

-- =====================================================
-- PASSO 4: VERIFICAR
-- =====================================================
-- Copie e execute este comando para verificar:

SELECT datname, datowner::regrole as owner 
FROM pg_database 
WHERE datname = 'kmiza27_dev'; 