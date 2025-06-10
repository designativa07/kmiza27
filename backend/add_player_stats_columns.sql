-- Adicionar colunas de estatísticas de jogadores na tabela matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS home_team_player_stats JSONB,
ADD COLUMN IF NOT EXISTS away_team_player_stats JSONB;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name IN ('home_team_player_stats', 'away_team_player_stats'); 