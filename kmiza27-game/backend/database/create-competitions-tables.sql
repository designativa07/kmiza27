-- Sistema de Competições para kmiza27-game
-- Execute este SQL diretamente no Supabase Studio

-- 1. Tabela de Competições
CREATE TABLE IF NOT EXISTS game_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
  type VARCHAR(20) NOT NULL CHECK (type IN ('pvp', 'pve')),
  max_teams INTEGER DEFAULT 20,
  min_teams INTEGER DEFAULT 8,
  season_year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'finished')),
  promotion_spots INTEGER DEFAULT 4,
  relegation_spots INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Times em Competições
CREATE TABLE IF NOT EXISTS game_competition_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  position INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'promoted', 'relegated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, team_id)
);

-- 3. Tabela de Partidas Diretas
CREATE TABLE IF NOT EXISTS game_direct_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('single', 'home_away')),
  home_team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  away_home_score INTEGER DEFAULT 0,
  away_away_score INTEGER DEFAULT 0,
  aggregate_home_score INTEGER DEFAULT 0,
  aggregate_away_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES game_teams(id),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_match_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled')),
  highlights TEXT[],
  simulation_data JSONB,
  created_by UUID NOT NULL,
  accepted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Convites para Partidas
CREATE TABLE IF NOT EXISTS game_match_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES game_direct_matches(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Estatísticas dos Times
CREATE TABLE IF NOT EXISTS game_team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  goals_scored_in_row INTEGER DEFAULT 0,
  unbeaten_streak INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  last_match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id)
);

-- 6. Tabela de Confrontos Diretos
CREATE TABLE IF NOT EXISTS game_head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
  team1_wins INTEGER DEFAULT 0,
  team2_wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  last_match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team1_id, team2_id)
);

-- Inserir dados de exemplo para competições
INSERT INTO game_competitions (name, description, tier, type, max_teams, min_teams, season_year, status, promotion_spots, relegation_spots) VALUES
('Série A', 'Primeira divisão do futebol brasileiro', 1, 'pve', 20, 16, 2025, 'active', 0, 4),
('Série B', 'Segunda divisão do futebol brasileiro', 2, 'pve', 20, 16, 2025, 'active', 4, 4),
('Série C', 'Terceira divisão do futebol brasileiro', 3, 'pve', 20, 16, 2025, 'active', 4, 4),
('Série D', 'Quarta divisão do futebol brasileiro', 4, 'pve', 20, 16, 2025, 'active', 4, 0);

-- Comentário final
COMMENT ON TABLE game_competitions IS 'Tabela de competições do jogo';
COMMENT ON TABLE game_competition_teams IS 'Times inscritos em competições';
COMMENT ON TABLE game_direct_matches IS 'Partidas diretas entre usuários';
COMMENT ON TABLE game_match_invites IS 'Convites para partidas diretas';
COMMENT ON TABLE game_team_stats IS 'Estatísticas dos times';
COMMENT ON TABLE game_head_to_head IS 'Histórico de confrontos diretos'; 