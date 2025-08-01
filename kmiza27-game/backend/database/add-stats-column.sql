-- Script para adicionar coluna stats à tabela game_matches
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna stats
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}';

-- 2. Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
AND column_name = 'stats';

-- 3. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position; 