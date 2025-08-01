-- Script para adicionar coluna age à tabela youth_players
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna age
ALTER TABLE youth_players 
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 18;

-- 2. Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'youth_players' 
AND column_name = 'age';

-- 3. Atualizar jogadores existentes com idade padrão (se necessário)
UPDATE youth_players 
SET age = 18 + (random() * 12)::INTEGER 
WHERE age IS NULL;

-- 4. Verificar resultado
SELECT name, position, age 
FROM youth_players 
ORDER BY age DESC 
LIMIT 10; 