-- =====================================================
-- ADICIONAR TABELA DE ESTATÍSTICAS DOS TIMES DA MÁQUINA
-- Para armazenar estatísticas em tempo real dos times da máquina
-- =====================================================

-- Tabela para estatísticas dos times da máquina por temporada
CREATE TABLE IF NOT EXISTS game_machine_team_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_machine_teams(id) ON DELETE CASCADE,
  
  -- Identificação da temporada
  season_year INTEGER NOT NULL DEFAULT 2025,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
  
  -- Estatísticas da temporada
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Chave única: um registro por time por temporada por tier
  UNIQUE(team_id, season_year, tier)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_machine_stats_season ON game_machine_team_stats(season_year, tier);
CREATE INDEX IF NOT EXISTS idx_machine_stats_team ON game_machine_team_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_machine_stats_points ON game_machine_team_stats(tier, season_year, points DESC);

-- Comentários para documentação
COMMENT ON TABLE game_machine_team_stats IS 'Estatísticas em tempo real dos times da máquina por temporada';
COMMENT ON COLUMN game_machine_team_stats.points IS 'Pontos calculados: vitórias*3 + empates*1';
COMMENT ON COLUMN game_machine_team_stats.tier IS '1=Série A, 2=Série B, 3=Série C, 4=Série D';

-- =====================================================
-- POPULAR REGISTROS INICIAIS ZERADOS PARA TODOS OS TIMES DA MÁQUINA
-- =====================================================

-- Inserir registros zerados para todos os times da máquina existentes
INSERT INTO game_machine_team_stats (team_id, season_year, tier, games_played, wins, draws, losses, goals_for, goals_against, points)
SELECT 
  id as team_id,
  2025 as season_year,
  tier,
  0 as games_played,
  0 as wins, 
  0 as draws,
  0 as losses,
  0 as goals_for,
  0 as goals_against,
  0 as points
FROM game_machine_teams
WHERE is_active = true
ON CONFLICT (team_id, season_year, tier) DO NOTHING;

-- Log de sucesso
SELECT 
  'Tabela game_machine_team_stats criada e populada com ' || COUNT(*) || ' registros' as resultado
FROM game_machine_team_stats;