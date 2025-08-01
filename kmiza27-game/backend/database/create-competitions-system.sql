-- Script completo para criar o sistema de competições
-- Execute este script no Supabase SQL Editor

-- 0. Limpar competições duplicadas existentes
DELETE FROM game_competitions WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM game_competitions
  ) t WHERE t.rn > 1
);

-- 1. Tabela de Competições
CREATE TABLE IF NOT EXISTS game_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL, -- 1=A, 2=B, 3=C, 4=D
  season_year INTEGER NOT NULL DEFAULT 2024,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'finished')),
  type VARCHAR(20) DEFAULT 'pve' CHECK (type IN ('pve', 'pvp')),
  max_teams INTEGER NOT NULL,
  current_teams INTEGER DEFAULT 0,
  promotion_spots INTEGER DEFAULT 4,
  relegation_spots INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1. Adicionar coluna current_teams se não existir
ALTER TABLE game_competitions 
ADD COLUMN IF NOT EXISTS current_teams INTEGER DEFAULT 0;

-- 2. Tabela de Inscrições em Competições
CREATE TABLE IF NOT EXISTS game_competition_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  UNIQUE(competition_id, team_id)
);

-- 3. Tabela de Classificações
CREATE TABLE IF NOT EXISTS game_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  season_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, team_id, season_year)
);

-- 4. Tabela de Rodadas
CREATE TABLE IF NOT EXISTS game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, round_number)
);

-- 5. Tabela de Partidas de Competição
CREATE TABLE IF NOT EXISTS game_competition_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES game_teams(id),
  away_team_id UUID NOT NULL REFERENCES game_teams(id),
  home_team_name VARCHAR(255) NOT NULL,
  away_team_name VARCHAR(255) NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled')),
  highlights TEXT[] DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir Competições Padrão (apenas se não existirem)
INSERT INTO game_competitions (name, description, tier, type, max_teams, promotion_spots, relegation_spots, season_year) 
SELECT 'Série A', 'Primeira divisão do futebol brasileiro', 1, 'pve', 20, 0, 4, 2024
WHERE NOT EXISTS (SELECT 1 FROM game_competitions WHERE name = 'Série A' AND tier = 1);

INSERT INTO game_competitions (name, description, tier, type, max_teams, promotion_spots, relegation_spots, season_year) 
SELECT 'Série B', 'Segunda divisão do futebol brasileiro', 2, 'pve', 20, 4, 4, 2024
WHERE NOT EXISTS (SELECT 1 FROM game_competitions WHERE name = 'Série B' AND tier = 2);

INSERT INTO game_competitions (name, description, tier, type, max_teams, promotion_spots, relegation_spots, season_year) 
SELECT 'Série C', 'Terceira divisão do futebol brasileiro', 3, 'pve', 20, 4, 4, 2024
WHERE NOT EXISTS (SELECT 1 FROM game_competitions WHERE name = 'Série C' AND tier = 3);

INSERT INTO game_competitions (name, description, tier, type, max_teams, promotion_spots, relegation_spots, season_year) 
SELECT 'Série D', 'Quarta divisão do futebol brasileiro', 4, 'pve', 64, 4, 0, 2024
WHERE NOT EXISTS (SELECT 1 FROM game_competitions WHERE name = 'Série D' AND tier = 4);

-- 7. Criar Índices para Performance
CREATE INDEX IF NOT EXISTS idx_competition_teams_competition_id ON game_competition_teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_teams_team_id ON game_competition_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_competition_id ON game_standings(competition_id);
CREATE INDEX IF NOT EXISTS idx_standings_team_id ON game_standings(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_position ON game_standings(position);
CREATE INDEX IF NOT EXISTS idx_competition_matches_competition_id ON game_competition_matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_matches_round_id ON game_competition_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_competition_matches_status ON game_competition_matches(status);

-- 8. Funções para Atualizar Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Triggers para Atualizar Timestamps
CREATE TRIGGER update_game_competitions_updated_at 
    BEFORE UPDATE ON game_competitions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_standings_updated_at 
    BEFORE UPDATE ON game_standings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_rounds_updated_at 
    BEFORE UPDATE ON game_rounds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_competition_matches_updated_at 
    BEFORE UPDATE ON game_competition_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Verificar Resultado
SELECT 'Sistema de competições criado com sucesso!' as status;
SELECT name, tier, type, max_teams, COALESCE(current_teams, 0) as current_teams, season_year FROM game_competitions ORDER BY tier; 