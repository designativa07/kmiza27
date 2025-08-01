-- Criar tabela de partidas
CREATE TABLE IF NOT EXISTS game_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  home_team_name VARCHAR(255) NOT NULL,
  away_team_name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  highlights TEXT[] DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_date ON game_matches(date);
CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_game_matches_updated_at 
    BEFORE UPDATE ON game_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 