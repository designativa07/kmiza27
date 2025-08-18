-- =====================================================
-- MIGRAÇÃO: Adicionar colunas de série e tier
-- =====================================================

-- Adicionar coluna series
ALTER TABLE game_teams 
ADD COLUMN IF NOT EXISTS series VARCHAR(20) CHECK (series IN ('Série A', 'Série B', 'Série C', 'Série D'));

-- Adicionar coluna tier
ALTER TABLE game_teams 
ADD COLUMN IF NOT EXISTS tier INTEGER CHECK (tier >= 1 AND tier <= 4);

-- Adicionar coluna series_info (JSONB para informações detalhadas)
ALTER TABLE game_teams 
ADD COLUMN IF NOT EXISTS series_info JSONB DEFAULT '{}';

-- Adicionar comentários
COMMENT ON COLUMN game_teams.series IS 'Série atual do time (Série A, B, C ou D)';
COMMENT ON COLUMN game_teams.tier IS 'Nível hierárquico (1=A, 2=B, 3=C, 4=D)';
COMMENT ON COLUMN game_teams.series_info IS 'Informações detalhadas da série (promoção, rebaixamento, etc.)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_game_teams_series ON game_teams(series);
CREATE INDEX IF NOT EXISTS idx_game_teams_tier ON game_teams(tier);
CREATE INDEX IF NOT EXISTS idx_game_teams_series_tier ON game_teams(series, tier);

-- Atualizar times existentes com valores padrão
UPDATE game_teams 
SET 
  series = 'Série D',
  tier = 4,
  series_info = '{"name": "Série D", "tier": 4, "description": "Quarta Divisão", "promotion_spots": 4, "relegation_spots": 0}'
WHERE team_type = 'machine' AND series IS NULL;

-- Verificar resultado
SELECT 
  series,
  tier,
  COUNT(*) as times_count
FROM game_teams 
WHERE team_type = 'machine'
GROUP BY series, tier
ORDER BY tier;
