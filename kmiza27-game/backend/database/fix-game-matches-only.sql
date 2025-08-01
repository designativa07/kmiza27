-- Script mínimo para corrigir apenas game_matches
-- Este é o principal causador do erro de foreign key
-- Criado em: 2025-01-30

-- Remover constraints existentes
ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;

ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_home_team_id_fkey 
FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;

ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_away_team_id_fkey 
FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;

-- Verificar se funcionou
SELECT '✅ Constraints de game_matches corrigidas com sucesso!' as status; 