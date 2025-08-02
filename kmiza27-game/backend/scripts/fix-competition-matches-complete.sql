-- 🔧 CORREÇÃO COMPLETA DA TABELA game_competition_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'game_competition_matches'
) as table_exists;

-- 2. Adicionar coluna round_number se não existir
ALTER TABLE game_competition_matches 
ADD COLUMN IF NOT EXISTS round_number INTEGER;

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_competition_matches' 
AND column_name = 'round_number';

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_competition_matches_round 
ON game_competition_matches(competition_id, round_number);

-- 5. Verificar estrutura completa da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_competition_matches'
ORDER BY ordinal_position;

-- 6. Testar inserção de uma partida de exemplo
-- (comentado para não inserir dados de teste)
/*
INSERT INTO game_competition_matches (
  competition_id,
  home_team_id,
  away_team_id,
  home_team_name,
  away_team_name,
  match_date,
  round_number,
  status
) VALUES (
  (SELECT id FROM game_competitions LIMIT 1),
  (SELECT id FROM game_teams LIMIT 1),
  (SELECT id FROM game_teams LIMIT 1 OFFSET 1),
  'Time Casa',
  'Time Visitante',
  NOW(),
  1,
  'scheduled'
);
*/

-- 7. Verificar se a correção foi aplicada
SELECT 'Tabela game_competition_matches corrigida com sucesso!' as status; 