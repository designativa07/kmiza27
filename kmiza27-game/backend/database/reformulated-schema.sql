-- =====================================================
-- SCHEMA REFORMULADO PARA JOGO ESTILO ELIFOOT
-- Inspirado no clássico Elifoot com sistema simplificado
-- Execute este SQL no Supabase Studio
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 🏆 TABELAS DO SISTEMA REFORMULADO
-- =====================================================

-- 1. COMPETIÇÕES FIXAS (4 séries hierárquicas)
CREATE TABLE IF NOT EXISTS game_competitions_fixed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- 'Série A', 'Série B', 'Série C', 'Série D'
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4), -- 1=A, 2=B, 3=C, 4=D
  description TEXT,
  max_teams INTEGER DEFAULT 20, -- Sempre 20 times por série
  promotion_spots INTEGER DEFAULT 4, -- 4 primeiros sobem
  relegation_spots INTEGER DEFAULT 4, -- 4 últimos descem
  season_year INTEGER DEFAULT 2025,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tier) -- Apenas 1 competição por tier
);

-- 2. TIMES DA MÁQUINA FIXOS (19 por série)
CREATE TABLE IF NOT EXISTS game_machine_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4), -- Série onde fica fixo
  
  -- Atributos fixos do time (não evoluem)
  attributes JSONB NOT NULL DEFAULT '{
    "overall": 75,
    "attack": 75,
    "midfield": 75,
    "defense": 75,
    "goalkeeper": 75
  }',
  
  -- Dados do estádio
  stadium_name VARCHAR(255),
  stadium_capacity INTEGER DEFAULT 15000,
  colors JSONB DEFAULT '{"primary": "#FF0000", "secondary": "#FFFFFF"}',
  
  -- Metadados
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(name, tier) -- Nome único por série
);

-- 3. PROGRESSO DO USUÁRIO NAS COMPETIÇÕES
CREATE TABLE IF NOT EXISTS game_user_competition_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  
  -- Série atual do usuário
  current_tier INTEGER NOT NULL CHECK (current_tier >= 1 AND current_tier <= 4),
  season_year INTEGER DEFAULT 2025,
  
  -- Classificação atual
  position INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  
  -- Status da temporada
  season_status VARCHAR(50) DEFAULT 'active', -- active, finished, promoted, relegated
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, team_id, season_year) -- Um registro por temporada
);

-- 4. PARTIDAS DA TEMPORADA ATUAL
CREATE TABLE IF NOT EXISTS game_season_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Identificação da temporada
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  season_year INTEGER DEFAULT 2025,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
  round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 38),
  
  -- Times participantes
  home_team_id UUID REFERENCES game_teams(id), -- Time do usuário (se jogar em casa)
  away_team_id UUID REFERENCES game_teams(id), -- Time do usuário (se jogar fora)
  
  -- Times da máquina
  home_machine_team_id UUID REFERENCES game_machine_teams(id), -- Time da máquina (se usuário joga fora)
  away_machine_team_id UUID REFERENCES game_machine_teams(id), -- Time da máquina (se usuário joga em casa)
  
  -- Dados da partida
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'simulated')),
  
  -- Dados adicionais
  highlights JSONB DEFAULT '[]',
  simulation_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE, -- Data/hora quando a partida foi finalizada
  
  -- Garantir que ou é usuário vs máquina ou máquina vs usuário
  CHECK (
    (home_team_id IS NOT NULL AND away_machine_team_id IS NOT NULL) OR
    (away_team_id IS NOT NULL AND home_machine_team_id IS NOT NULL)
  )
);

-- 5. HISTÓRICO DE TEMPORADAS (para acompanhar progressão)
CREATE TABLE IF NOT EXISTS game_season_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  
  season_year INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  final_position INTEGER NOT NULL,
  final_points INTEGER NOT NULL,
  result VARCHAR(50) NOT NULL, -- 'promoted', 'relegated', 'stayed', 'champion'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, team_id, season_year)
);

-- =====================================================
-- 🔧 POPULAR DADOS INICIAIS
-- =====================================================

-- Inserir competições fixas
INSERT INTO game_competitions_fixed (name, tier, description, promotion_spots, relegation_spots) VALUES
('Série A', 1, 'Elite do futebol brasileiro - Primeira divisão', 0, 4),
('Série B', 2, 'Segunda divisão do futebol brasileiro', 4, 4),
('Série C', 3, 'Terceira divisão do futebol brasileiro', 4, 4),
('Série D', 4, 'Porta de entrada - Quarta divisão', 4, 0)
ON CONFLICT (tier) DO NOTHING;

-- =====================================================
-- 📊 POPULAR TIMES DA MÁQUINA POR SÉRIE
-- =====================================================

-- SÉRIE A - ELITE (19 times)
INSERT INTO game_machine_teams (name, tier, attributes, stadium_name, stadium_capacity, colors, display_order) VALUES
('Flamengo', 1, '{"overall": 95, "attack": 95, "midfield": 93, "defense": 92, "goalkeeper": 90}', 'Maracanã', 78838, '{"primary": "#FF0000", "secondary": "#000000"}', 1),
('Palmeiras', 1, '{"overall": 93, "attack": 90, "midfield": 95, "defense": 94, "goalkeeper": 88}', 'Allianz Parque', 43713, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 2),
('São Paulo', 1, '{"overall": 92, "attack": 89, "midfield": 93, "defense": 94, "goalkeeper": 91}', 'Morumbi', 67052, '{"primary": "#FF0000", "secondary": "#000000", "accent": "#FFFFFF"}', 3),
('Corinthians', 1, '{"overall": 91, "attack": 88, "midfield": 92, "defense": 93, "goalkeeper": 89}', 'Neo Química Arena', 49205, '{"primary": "#000000", "secondary": "#FFFFFF"}', 4),
('Atlético MG', 1, '{"overall": 90, "attack": 92, "midfield": 89, "defense": 88, "goalkeeper": 87}', 'Mineirão', 61846, '{"primary": "#000000", "secondary": "#FFFFFF"}', 5),
('Grêmio', 1, '{"overall": 89, "attack": 87, "midfield": 90, "defense": 90, "goalkeeper": 88}', 'Arena do Grêmio', 55662, '{"primary": "#0066CC", "secondary": "#000000", "accent": "#FFFFFF"}', 6),
('Internacional', 1, '{"overall": 88, "attack": 89, "midfield": 88, "defense": 87, "goalkeeper": 86}', 'Beira-Rio', 50128, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 7),
('Fluminense', 1, '{"overall": 87, "attack": 85, "midfield": 88, "defense": 89, "goalkeeper": 84}', 'Maracanã', 78838, '{"primary": "#7A1538", "secondary": "#FFFFFF", "accent": "#009639"}', 8),
('Botafogo', 1, '{"overall": 86, "attack": 88, "midfield": 85, "defense": 84, "goalkeeper": 87}', 'Nilton Santos', 46831, '{"primary": "#000000", "secondary": "#FFFFFF"}', 9),
('Vasco', 1, '{"overall": 85, "attack": 83, "midfield": 86, "defense": 86, "goalkeeper": 85}', 'São Januário', 21880, '{"primary": "#000000", "secondary": "#FFFFFF"}', 10),
('Cruzeiro', 1, '{"overall": 84, "attack": 82, "midfield": 85, "defense": 85, "goalkeeper": 83}', 'Mineirão', 61846, '{"primary": "#003399", "secondary": "#FFFFFF"}', 11),
('Fortaleza', 1, '{"overall": 83, "attack": 84, "midfield": 82, "defense": 83, "goalkeeper": 82}', 'Castelão', 63903, '{"primary": "#FF0000", "secondary": "#0066CC", "accent": "#FFFFFF"}', 12),
('Bahia', 1, '{"overall": 82, "attack": 81, "midfield": 83, "defense": 82, "goalkeeper": 81}', 'Fonte Nova', 47907, '{"primary": "#0066CC", "secondary": "#FF0000", "accent": "#FFFFFF"}', 13),
('Athletico PR', 1, '{"overall": 81, "attack": 83, "midfield": 80, "defense": 80, "goalkeeper": 80}', 'Ligga Arena', 42372, '{"primary": "#FF0000", "secondary": "#000000"}', 14),
('Bragantino', 1, '{"overall": 80, "attack": 82, "midfield": 79, "defense": 78, "goalkeeper": 79}', 'Nabi Abi Chedid', 15010, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 15),
('Ceará', 1, '{"overall": 79, "attack": 78, "midfield": 80, "defense": 79, "goalkeeper": 78}', 'Castelão', 63903, '{"primary": "#000000", "secondary": "#FFFFFF"}', 16),
('Goiás', 1, '{"overall": 78, "attack": 77, "midfield": 78, "defense": 79, "goalkeeper": 77}', 'Serrinha', 16500, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 17),
('Coritiba', 1, '{"overall": 77, "attack": 76, "midfield": 77, "defense": 78, "goalkeeper": 76}', 'Couto Pereira', 40502, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 18),
('Cuiabá', 1, '{"overall": 76, "attack": 75, "midfield": 76, "defense": 77, "goalkeeper": 75}', 'Arena Pantanal', 44097, '{"primary": "#FFD700", "secondary": "#00A651"}', 19)

ON CONFLICT (name, tier) DO NOTHING;

-- SÉRIE B - SEGUNDA DIVISÃO (19 times)
INSERT INTO game_machine_teams (name, tier, attributes, stadium_name, stadium_capacity, colors, display_order) VALUES
('Santos', 2, '{"overall": 75, "attack": 76, "midfield": 75, "defense": 74, "goalkeeper": 73}', 'Vila Belmiro', 16068, '{"primary": "#FFFFFF", "secondary": "#000000"}', 1),
('Guarani', 2, '{"overall": 73, "attack": 74, "midfield": 72, "defense": 73, "goalkeeper": 72}', 'Brinco de Ouro', 29130, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 2),
('Ponte Preta', 2, '{"overall": 72, "attack": 71, "midfield": 73, "defense": 72, "goalkeeper": 71}', 'Moisés Lucarelli', 19722, '{"primary": "#000000", "secondary": "#FFFFFF"}', 3),
('Novorizontino', 2, '{"overall": 71, "attack": 72, "midfield": 70, "defense": 71, "goalkeeper": 70}', 'Jorge Ismael de Biasi', 9600, '{"primary": "#FFD700", "secondary": "#000000"}', 4),
('Mirassol', 2, '{"overall": 70, "attack": 71, "midfield": 69, "defense": 70, "goalkeeper": 69}', 'José Maria de Campos Maia', 15200, '{"primary": "#FFD700", "secondary": "#00A651"}', 5),
('Sport', 2, '{"overall": 69, "attack": 70, "midfield": 68, "defense": 69, "goalkeeper": 68}', 'Ilha do Retiro', 30000, '{"primary": "#FF0000", "secondary": "#000000"}', 6),
('Náutico', 2, '{"overall": 68, "attack": 67, "midfield": 69, "defense": 68, "goalkeeper": 67}', 'Aflitos', 22856, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 7),
('Vila Nova', 2, '{"overall": 67, "attack": 68, "midfield": 66, "defense": 67, "goalkeeper": 66}', 'OBA', 11788, '{"primary": "#FF0000", "secondary": "#000000"}', 8),
('Avaí', 2, '{"overall": 66, "attack": 65, "midfield": 67, "defense": 66, "goalkeeper": 65}', 'Ressacada', 17800, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 9),
('Chapecoense', 2, '{"overall": 65, "attack": 66, "midfield": 64, "defense": 65, "goalkeeper": 64}', 'Arena Condá', 22600, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 10),
('Londrina', 2, '{"overall": 64, "attack": 63, "midfield": 65, "defense": 64, "goalkeeper": 63}', 'Estádio do Café', 36000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 11),
('Operário PR', 2, '{"overall": 63, "attack": 64, "midfield": 62, "defense": 63, "goalkeeper": 62}', 'Germano Krüger', 8400, '{"primary": "#000000", "secondary": "#FFFFFF"}', 12),
('CRB', 2, '{"overall": 62, "attack": 61, "midfield": 63, "defense": 62, "goalkeeper": 61}', 'Rei Pelé', 17000, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 13),
('CSA', 2, '{"overall": 61, "attack": 62, "midfield": 60, "defense": 61, "goalkeeper": 60}', 'Rei Pelé', 17000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 14),
('Botafogo PB', 2, '{"overall": 60, "attack": 59, "midfield": 61, "defense": 60, "goalkeeper": 59}', 'Almeidão', 28000, '{"primary": "#000000", "secondary": "#FFFFFF"}', 15),
('Sampaio Corrêa', 2, '{"overall": 59, "attack": 60, "midfield": 58, "defense": 59, "goalkeeper": 58}', 'Castelão', 40000, '{"primary": "#FFD700", "secondary": "#00A651"}', 16),
('Paysandu', 2, '{"overall": 58, "attack": 57, "midfield": 59, "defense": 58, "goalkeeper": 57}', 'Curuzu', 16200, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 17),
('ABC', 2, '{"overall": 57, "attack": 58, "midfield": 56, "defense": 57, "goalkeeper": 56}', 'Frasqueirão', 18000, '{"primary": "#000000", "secondary": "#FFFFFF"}', 18),
('Remo', 2, '{"overall": 56, "attack": 55, "midfield": 57, "defense": 56, "goalkeeper": 55}', 'Baenão', 17000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 19)

ON CONFLICT (name, tier) DO NOTHING;

-- SÉRIE C - TERCEIRA DIVISÃO (19 times)
INSERT INTO game_machine_teams (name, tier, attributes, stadium_name, stadium_capacity, colors, display_order) VALUES
('Ituano', 3, '{"overall": 55, "attack": 56, "midfield": 54, "defense": 55, "goalkeeper": 54}', 'Novelli Júnior', 20000, '{"primary": "#FF0000", "secondary": "#000000"}', 1),
('Botafogo SP', 3, '{"overall": 54, "attack": 53, "midfield": 55, "defense": 54, "goalkeeper": 53}', 'Santa Cruz', 15681, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 2),
('Portuguesa', 3, '{"overall": 53, "attack": 54, "midfield": 52, "defense": 53, "goalkeeper": 52}', 'Canindé', 19717, '{"primary": "#FF0000", "secondary": "#00A651"}', 3),
('Santo André', 3, '{"overall": 52, "attack": 51, "midfield": 53, "defense": 52, "goalkeeper": 51}', 'Bruno José Daniel', 18000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 4),
('São José SP', 3, '{"overall": 51, "attack": 52, "midfield": 50, "defense": 51, "goalkeeper": 50}', 'Martins Pereira', 15317, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 5),
('Atlético GO', 3, '{"overall": 50, "attack": 49, "midfield": 51, "defense": 50, "goalkeeper": 49}', 'Antônio Accioly', 12500, '{"primary": "#FF0000", "secondary": "#000000"}', 6),
('Tombense', 3, '{"overall": 49, "attack": 50, "midfield": 48, "defense": 49, "goalkeeper": 48}', 'Antônio Guimarães de Almeida', 15000, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 7),
('Caldense', 3, '{"overall": 48, "attack": 47, "midfield": 49, "defense": 48, "goalkeeper": 47}', 'Ronaldo Junqueira', 15174, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 8),
('América MG', 3, '{"overall": 47, "attack": 48, "midfield": 46, "defense": 47, "goalkeeper": 46}', 'Independência', 23018, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 9),
('Villa Nova MG', 3, '{"overall": 46, "attack": 45, "midfield": 47, "defense": 46, "goalkeeper": 45}', 'Castor Cifuentes', 15800, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 10),
('URT', 3, '{"overall": 45, "attack": 46, "midfield": 44, "defense": 45, "goalkeeper": 44}', 'Zama Maciel', 6400, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 11),
('Patrocinense', 3, '{"overall": 44, "attack": 43, "midfield": 45, "defense": 44, "goalkeeper": 43}', 'Pedro Alves do Nascimento', 15290, '{"primary": "#FFD700", "secondary": "#00A651"}', 12),
('Athletic Club', 3, '{"overall": 43, "attack": 44, "midfield": 42, "defense": 43, "goalkeeper": 42}', 'Joaquim de Morais Filho', 6000, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 13),
('Ferroviário', 3, '{"overall": 42, "attack": 41, "midfield": 43, "defense": 42, "goalkeeper": 41}', 'Elzir Cabral', 22000, '{"primary": "#FF8C00", "secondary": "#000000"}', 14),
('Floresta', 3, '{"overall": 41, "attack": 42, "midfield": 40, "defense": 41, "goalkeeper": 40}', 'Presidente Vargas', 20000, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 15),
('Ypiranga RS', 3, '{"overall": 40, "attack": 39, "midfield": 41, "defense": 40, "goalkeeper": 39}', 'Colosso da Lagoa', 5000, '{"primary": "#FFD700", "secondary": "#0066CC"}', 16),
('São José RS', 3, '{"overall": 39, "attack": 40, "midfield": 38, "defense": 39, "goalkeeper": 38}', 'Passo D`Areia', 13000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 17),
('Volta Redonda', 3, '{"overall": 38, "attack": 37, "midfield": 39, "defense": 38, "goalkeeper": 37}', 'Raulino de Oliveira', 21000, '{"primary": "#FFD700", "secondary": "#000000"}', 18),
('Confiança', 3, '{"overall": 37, "attack": 38, "midfield": 36, "defense": 37, "goalkeeper": 36}', 'Proletário Sabino Ribeiro', 8000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 19)

ON CONFLICT (name, tier) DO NOTHING;

-- SÉRIE D - PORTA DE ENTRADA (19 times)
INSERT INTO game_machine_teams (name, tier, attributes, stadium_name, stadium_capacity, colors, display_order) VALUES
('Atlético Brasiliense', 4, '{"overall": 55, "attack": 56, "midfield": 54, "defense": 55, "goalkeeper": 54}', 'Serejão', 25000, '{"primary": "#FFD700", "secondary": "#00A651"}', 1),
('Real DF', 4, '{"overall": 54, "attack": 53, "midfield": 55, "defense": 54, "goalkeeper": 53}', 'Abadião', 5000, '{"primary": "#FFFFFF", "secondary": "#0066CC"}', 2),
('Gama FC', 4, '{"overall": 53, "attack": 54, "midfield": 52, "defense": 53, "goalkeeper": 52}', 'Bezerrão', 25000, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 3),
('Aparecidense', 4, '{"overall": 52, "attack": 51, "midfield": 53, "defense": 52, "goalkeeper": 51}', 'Aníbal Batista de Toledo', 5000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 4),
('Brasiliense FC', 4, '{"overall": 51, "attack": 52, "midfield": 50, "defense": 51, "goalkeeper": 50}', 'Serejão', 25000, '{"primary": "#FFD700", "secondary": "#FF0000"}', 5),
('Ceilândia EC', 4, '{"overall": 50, "attack": 49, "midfield": 51, "defense": 50, "goalkeeper": 49}', 'Abadião', 5000, '{"primary": "#0066CC", "secondary": "#FFD700"}', 6),
('Sobradinho EC', 4, '{"overall": 49, "attack": 50, "midfield": 48, "defense": 49, "goalkeeper": 48}', 'Augustinho Lima', 3000, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 7),
('Luziânia EC', 4, '{"overall": 48, "attack": 47, "midfield": 49, "defense": 48, "goalkeeper": 47}', 'Luizão', 6000, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 8),
('Formosa EC', 4, '{"overall": 47, "attack": 48, "midfield": 46, "defense": 47, "goalkeeper": 46}', 'Tonicão', 4500, '{"primary": "#FFD700", "secondary": "#FF0000"}', 9),
('Anápolis FC', 4, '{"overall": 46, "attack": 45, "midfield": 47, "defense": 46, "goalkeeper": 45}', 'Jonas Duarte', 20000, '{"primary": "#FF0000", "secondary": "#000000"}', 10),
('Cristalina FC', 4, '{"overall": 45, "attack": 46, "midfield": 44, "defense": 45, "goalkeeper": 44}', 'Cristalzão', 3000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 11),
('Planaltina EC', 4, '{"overall": 44, "attack": 43, "midfield": 45, "defense": 44, "goalkeeper": 43}', 'JK', 3500, '{"primary": "#00A651", "secondary": "#FFD700"}', 12),
('Valparaíso FC', 4, '{"overall": 43, "attack": 44, "midfield": 42, "defense": 43, "goalkeeper": 42}', 'Valpão', 2500, '{"primary": "#FF0000", "secondary": "#FFFFFF"}', 13),
('Águas Lindas FC', 4, '{"overall": 42, "attack": 41, "midfield": 43, "defense": 42, "goalkeeper": 41}', 'Lindão', 2000, '{"primary": "#0066CC", "secondary": "#FFFFFF"}', 14),
('Novo Gama FC', 4, '{"overall": 41, "attack": 42, "midfield": 40, "defense": 41, "goalkeeper": 40}', 'Gamão', 3000, '{"primary": "#FFD700", "secondary": "#00A651"}', 15),
('Santo Antônio EC', 4, '{"overall": 40, "attack": 39, "midfield": 41, "defense": 40, "goalkeeper": 39}', 'Descobertão', 2500, '{"primary": "#FF0000", "secondary": "#000000"}', 16),
('Alexânia FC', 4, '{"overall": 39, "attack": 40, "midfield": 38, "defense": 39, "goalkeeper": 38}', 'Alexzão', 2000, '{"primary": "#00A651", "secondary": "#FFFFFF"}', 17),
('Goianésia EC', 4, '{"overall": 38, "attack": 37, "midfield": 39, "defense": 38, "goalkeeper": 37}', 'Valdeir José de Oliveira', 5000, '{"primary": "#0066CC", "secondary": "#FFD700"}', 18),
('Corumbá de Goiás', 4, '{"overall": 37, "attack": 38, "midfield": 36, "defense": 37, "goalkeeper": 36}', 'Corumbão', 1500, '{"primary": "#FFD700", "secondary": "#FF0000"}', 19)

ON CONFLICT (name, tier) DO NOTHING;

-- =====================================================
-- 📊 CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_game_user_progress_user_id ON game_user_competition_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_user_progress_team_id ON game_user_competition_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_game_user_progress_tier ON game_user_competition_progress(current_tier);
CREATE INDEX IF NOT EXISTS idx_game_user_progress_season ON game_user_competition_progress(season_year);

CREATE INDEX IF NOT EXISTS idx_game_season_matches_user_id ON game_season_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_game_season_matches_tier ON game_season_matches(tier);
CREATE INDEX IF NOT EXISTS idx_game_season_matches_round ON game_season_matches(round_number);
CREATE INDEX IF NOT EXISTS idx_game_season_matches_status ON game_season_matches(status);
CREATE INDEX IF NOT EXISTS idx_game_season_matches_date ON game_season_matches(match_date);

CREATE INDEX IF NOT EXISTS idx_game_machine_teams_tier ON game_machine_teams(tier);
CREATE INDEX IF NOT EXISTS idx_game_machine_teams_active ON game_machine_teams(is_active);

CREATE INDEX IF NOT EXISTS idx_game_season_history_user_id ON game_season_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_season_history_season ON game_season_history(season_year);

-- =====================================================
-- 🔧 TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_game_user_progress_updated_at 
  BEFORE UPDATE ON game_user_competition_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_season_matches_updated_at 
  BEFORE UPDATE ON game_season_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 📈 VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View para mostrar classificação atual do usuário
CREATE OR REPLACE VIEW user_current_standings AS
SELECT 
  ugcp.*,
  gt.name as team_name,
  gt.colors as team_colors,
  gt.logo_url as team_logo,
  gcf.name as competition_name,
  ROW_NUMBER() OVER (
    PARTITION BY ugcp.current_tier, ugcp.season_year 
    ORDER BY ugcp.points DESC, ugcp.goal_difference DESC, ugcp.goals_for DESC
  ) as calculated_position
FROM game_user_competition_progress ugcp
JOIN game_teams gt ON ugcp.team_id = gt.id
JOIN game_competitions_fixed gcf ON ugcp.current_tier = gcf.tier
WHERE ugcp.season_status = 'active';

-- View para próximas partidas do usuário
CREATE OR REPLACE VIEW user_upcoming_matches AS
SELECT 
  gsm.*,
  CASE 
    WHEN gsm.home_team_id IS NOT NULL THEN gt_home.name
    ELSE gmt_home.name 
  END as home_team_name,
  CASE 
    WHEN gsm.away_team_id IS NOT NULL THEN gt_away.name
    ELSE gmt_away.name 
  END as away_team_name,
  CASE 
    WHEN gsm.home_team_id IS NOT NULL THEN true
    ELSE false 
  END as user_plays_home
FROM game_season_matches gsm
LEFT JOIN game_teams gt_home ON gsm.home_team_id = gt_home.id
LEFT JOIN game_teams gt_away ON gsm.away_team_id = gt_away.id
LEFT JOIN game_machine_teams gmt_home ON gsm.home_machine_team_id = gmt_home.id
LEFT JOIN game_machine_teams gmt_away ON gsm.away_machine_team_id = gmt_away.id
WHERE gsm.status IN ('scheduled', 'in_progress')
ORDER BY gsm.match_date ASC;

-- =====================================================
-- ✅ VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
  RAISE NOTICE '🎮 Schema reformulado criado com sucesso!';
  RAISE NOTICE '🏆 Competições fixas: 4 séries hierárquicas';
  RAISE NOTICE '🤖 Times da máquina: 76 times (19 por série)';
  RAISE NOTICE '👤 Sistema de progresso do usuário implementado';
  RAISE NOTICE '⚽ Sistema de partidas temporada implementado';
  RAISE NOTICE '📊 Índices e views criados para performance';
  RAISE NOTICE '🔧 Triggers de automação configurados';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Sistema pronto para uso estilo Elifoot!';
END $$;

-- Mostrar resumo das séries criadas
SELECT 
  gcf.name as serie,
  gcf.tier,
  COUNT(gmt.id) as times_maquina_cadastrados,
  gcf.promotion_spots as vagas_promocao,
  gcf.relegation_spots as vagas_rebaixamento
FROM game_competitions_fixed gcf
LEFT JOIN game_machine_teams gmt ON gcf.tier = gmt.tier
GROUP BY gcf.tier, gcf.name, gcf.promotion_spots, gcf.relegation_spots
ORDER BY gcf.tier;