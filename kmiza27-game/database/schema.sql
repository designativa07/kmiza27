-- =====================================================
-- SCHEMA COMPLETO PARA O JOGO DE FUTEBOL KMIZA27
-- Execute este SQL no Supabase Studio
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- 1. USUÁRIOS DO JOGO
CREATE TABLE game_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  game_stats JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TIMES DO JOGO (REAIS + CRIADOS PELOS USUÁRIOS)
CREATE TABLE game_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_name VARCHAR(50),
  owner_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  team_type VARCHAR(20) DEFAULT 'user_created', -- 'real', 'user_created'
  real_team_id INTEGER, -- ID do time no sistema principal
  
  -- Personalização visual
  colors JSONB DEFAULT '{}',
  logo_url TEXT,
  stadium_name VARCHAR(255),
  stadium_capacity INTEGER DEFAULT 10000,
  
  -- Dados do jogo
  budget DECIMAL(12,2) DEFAULT 1000000,
  reputation INTEGER DEFAULT 50,
  fan_base INTEGER DEFAULT 5000,
  
  -- Estatísticas
  game_stats JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CATEGORIAS DE BASE
CREATE TABLE youth_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- Sub-15, Sub-17, Sub-20
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACADEMIA DE BASE
CREATE TABLE youth_academies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  
  -- Instalações
  facilities JSONB DEFAULT '{
    "training_fields": 1,
    "gym_quality": 1,
    "medical_center": 1,
    "dormitory_capacity": 10,
    "coaching_staff": 2
  }',
  
  -- Financeiro
  investment DECIMAL(12,2) DEFAULT 0,
  monthly_cost DECIMAL(10,2) DEFAULT 50000,
  
  -- Eficiência
  efficiency_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. JOGADORES JOVENS
CREATE TABLE youth_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) DEFAULT 'Brasil',
  
  -- Relacionamentos
  team_id UUID REFERENCES game_teams(id) ON DELETE SET NULL,
  category_id UUID REFERENCES youth_categories(id),
  
  -- Atributos do jogador
  attributes JSONB NOT NULL,
  potential JSONB NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- available, scouted, contracted, promoted
  scouted_date DATE,
  contract_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PENEIRAS
CREATE TABLE youth_tryouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  category_id UUID REFERENCES youth_categories(id),
  
  tryout_type VARCHAR(50) NOT NULL, -- local, regional, national, international
  tryout_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  participants_count INTEGER DEFAULT 50,
  
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  results JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PARTIDAS DO JOGO
CREATE TABLE game_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_team_id UUID REFERENCES game_teams(id),
  away_team_id UUID REFERENCES game_teams(id),
  
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, finished
  
  -- Placar
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  
  -- Simulação
  simulation_data JSONB,
  highlights JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir categorias padrão
INSERT INTO youth_categories (name, min_age, max_age) VALUES
('Sub-15', 13, 15),
('Sub-17', 16, 17),
('Sub-20', 18, 20);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX idx_game_teams_owner ON game_teams(owner_id);
CREATE INDEX idx_game_teams_slug ON game_teams(slug);
CREATE INDEX idx_youth_players_team ON youth_players(team_id);
CREATE INDEX idx_youth_players_category ON youth_players(category_id);
CREATE INDEX idx_youth_players_status ON youth_players(status);
CREATE INDEX idx_youth_academies_team ON youth_academies(team_id);
CREATE INDEX idx_game_matches_teams ON game_matches(home_team_id, away_team_id);
CREATE INDEX idx_game_matches_date ON game_matches(match_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - OPCIONAL
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_tryouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_matches ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuários só veem seus próprios dados)
CREATE POLICY "Users can view own data" ON game_users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own teams" ON game_teams
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own academies" ON youth_academies
  FOR ALL USING (team_id IN (
    SELECT id FROM game_teams WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can view own youth players" ON youth_players
  FOR ALL USING (team_id IN (
    SELECT id FROM game_teams WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage own tryouts" ON youth_tryouts
  FOR ALL USING (team_id IN (
    SELECT id FROM game_teams WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can view own matches" ON game_matches
  FOR ALL USING (
    home_team_id IN (SELECT id FROM game_teams WHERE owner_id = auth.uid()) OR
    away_team_id IN (SELECT id FROM game_teams WHERE owner_id = auth.uid())
  );

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para calcular idade
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(team_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Gerar slug base
  base_slug := LOWER(team_name);
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(base_slug, '-');
  
  final_slug := base_slug;
  
  -- Verificar se já existe e adicionar número se necessário
  WHILE EXISTS(SELECT 1 FROM game_teams WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_game_users_updated_at BEFORE UPDATE ON game_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_teams_updated_at BEFORE UPDATE ON game_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_academies_updated_at BEFORE UPDATE ON youth_academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_players_updated_at BEFORE UPDATE ON youth_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_tryouts_updated_at BEFORE UPDATE ON youth_tryouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_matches_updated_at BEFORE UPDATE ON game_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para times com estatísticas básicas
CREATE VIEW team_overview AS
SELECT 
  gt.*,
  ya.level as academy_level,
  ya.efficiency_multiplier,
  COUNT(yp.id) as youth_players_count,
  COUNT(yt.id) as scheduled_tryouts_count
FROM game_teams gt
LEFT JOIN youth_academies ya ON gt.id = ya.team_id
LEFT JOIN youth_players yp ON gt.id = yp.team_id
LEFT JOIN youth_tryouts yt ON gt.id = yt.team_id AND yt.status = 'scheduled'
GROUP BY gt.id, ya.level, ya.efficiency_multiplier;

-- View para jogadores jovens com detalhes
CREATE VIEW youth_player_details AS
SELECT 
  yp.*,
  gt.name as team_name,
  yc.name as category_name,
  calculate_age(yp.date_of_birth) as age
FROM youth_players yp
LEFT JOIN game_teams gt ON yp.team_id = gt.id
LEFT JOIN youth_categories yc ON yp.category_id = yc.id;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
  RAISE NOTICE 'Schema do jogo de futebol criado com sucesso!';
  RAISE NOTICE 'Tabelas criadas: game_users, game_teams, youth_categories, youth_academies, youth_players, youth_tryouts, game_matches';
  RAISE NOTICE 'Índices criados para otimização de performance';
  RAISE NOTICE 'RLS habilitado para segurança';
  RAISE NOTICE 'Funções e triggers configurados';
  RAISE NOTICE 'Views úteis criadas';
END $$; 