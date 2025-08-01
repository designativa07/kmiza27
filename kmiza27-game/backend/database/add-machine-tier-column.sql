-- Script para adicionar coluna machine_tier à tabela game_teams
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna machine_tier
ALTER TABLE game_teams 
ADD COLUMN IF NOT EXISTS machine_tier INTEGER;

-- 2. Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_teams' 
AND column_name = 'machine_tier';

-- 3. Atualizar times existentes da máquina (se houver)
UPDATE game_teams 
SET machine_tier = 4 
WHERE team_type = 'machine' 
AND machine_tier IS NULL;

-- 4. Verificar resultado
SELECT name, team_type, machine_tier 
FROM game_teams 
WHERE team_type = 'machine' 
ORDER BY machine_tier, name; 