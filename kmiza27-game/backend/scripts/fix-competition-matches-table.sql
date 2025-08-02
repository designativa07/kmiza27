-- Corrigir estrutura da tabela game_competition_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'game_competition_matches'
) as table_exists;

-- 2. Adicionar coluna round_number se não existir
ALTER TABLE game_competition_matches 
ADD COLUMN IF NOT EXISTS round_number INTEGER;

-- 3. Adicionar coluna home_team_name se não existir
ALTER TABLE game_competition_matches 
ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255);

-- 4. Adicionar coluna away_team_name se não existir
ALTER TABLE game_competition_matches 
ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255);

-- 5. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_competition_matches'
ORDER BY ordinal_position;

-- 6. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_competition_matches_round 
ON game_competition_matches(competition_id, round_number);

-- 7. Verificar se a correção foi aplicada
SELECT 'Tabela game_competition_matches corrigida com sucesso!' as status; 