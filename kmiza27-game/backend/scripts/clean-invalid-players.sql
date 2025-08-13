-- =====================================================
-- LIMPAR JOGADORES INVÁLIDOS DA BASE DE DADOS
-- Execute este SQL no Supabase Studio
-- =====================================================

-- 1. VERIFICAR JOGADORES COM NOME NULL OU VAZIO
SELECT 
    'game_players' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as sem_nome,
    COUNT(CASE WHEN name = '' THEN 1 END) as nome_vazio,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as com_nome
FROM game_players

UNION ALL

SELECT 
    'youth_players' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as sem_nome,
    COUNT(CASE WHEN name = '' THEN 1 END) as nome_vazio,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as com_nome
FROM youth_players;

-- 2. MOSTRAR JOGADORES INVÁLIDOS (APENAS PARA VERIFICAÇÃO)
SELECT 
    'game_players' as tabela,
    id,
    name,
    position,
    team_id
FROM game_players 
WHERE name IS NULL OR name = ''

UNION ALL

SELECT 
    'youth_players' as tabela,
    id,
    name,
    position,
    team_id
FROM youth_players 
WHERE name IS NULL OR name = '';

-- 3. ATUALIZAR JOGADORES COM NOME VAZIO PARA NOME PADRÃO (OPCIONAL)
-- Descomente as linhas abaixo se quiser corrigir em vez de deletar

/*
UPDATE game_players 
SET name = CONCAT('Jogador ', id::text)
WHERE name IS NULL OR name = '';

UPDATE youth_players 
SET name = CONCAT('Jogador Base ', id::text)
WHERE name IS NULL OR name = '';
*/

-- 4. DELETAR JOGADORES INVÁLIDOS (CUIDADO!)
-- Descomente as linhas abaixo se quiser deletar jogadores inválidos

/*
DELETE FROM game_players 
WHERE name IS NULL OR name = '';

DELETE FROM youth_players 
WHERE name IS NULL OR name = '';
*/

-- 5. VERIFICAR RESULTADO FINAL
SELECT 
    'game_players' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as sem_nome,
    COUNT(CASE WHEN name = '' THEN 1 END) as nome_vazio,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as com_nome
FROM game_players

UNION ALL

SELECT 
    'youth_players' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as sem_nome,
    COUNT(CASE WHEN name = '' THEN 1 END) as nome_vazio,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as com_nome
FROM youth_players;
