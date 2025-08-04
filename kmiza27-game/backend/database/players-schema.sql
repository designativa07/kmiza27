-- =====================================================
-- SCHEMA DE JOGADORES ESTILO ELIFOOT CLÁSSICO
-- Sistema completo de jogadores com evolução, treinamento e mercado
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 🏃 TABELA PRINCIPAL DE JOGADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Dados Básicos
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 16 AND age <= 45),
  nationality VARCHAR(3) DEFAULT 'BRA', -- Código ISO país
  
  -- Posição Principal e Alternativas
  position VARCHAR(10) NOT NULL, -- GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, CF, ST
  alternative_positions TEXT[], -- Array de posições alternativas
  
  -- Relacionamento com Time
  team_id UUID REFERENCES game_teams(id) ON DELETE SET NULL,
  team_type VARCHAR(20) DEFAULT 'first_team', -- first_team, youth, loan, market
  
  -- =====================================================
  -- 📊 ATRIBUTOS TÉCNICOS (1-100)
  -- =====================================================
  
  -- Atributos Ofensivos
  passing INTEGER DEFAULT 50 CHECK (passing >= 1 AND passing <= 100),
  shooting INTEGER DEFAULT 50 CHECK (shooting >= 1 AND shooting <= 100),
  dribbling INTEGER DEFAULT 50 CHECK (dribbling >= 1 AND dribbling <= 100),
  crossing INTEGER DEFAULT 50 CHECK (crossing >= 1 AND crossing <= 100),
  finishing INTEGER DEFAULT 50 CHECK (finishing >= 1 AND finishing <= 100),
  
  -- Atributos Físicos
  speed INTEGER DEFAULT 50 CHECK (speed >= 1 AND speed <= 100),
  stamina INTEGER DEFAULT 50 CHECK (stamina >= 1 AND stamina <= 100),
  strength INTEGER DEFAULT 50 CHECK (strength >= 1 AND strength <= 100),
  jumping INTEGER DEFAULT 50 CHECK (jumping >= 1 AND jumping <= 100),
  
  -- Atributos Mentais
  concentration INTEGER DEFAULT 50 CHECK (concentration >= 1 AND concentration <= 100),
  creativity INTEGER DEFAULT 50 CHECK (creativity >= 1 AND creativity <= 100),
  vision INTEGER DEFAULT 50 CHECK (vision >= 1 AND vision <= 100),
  leadership INTEGER DEFAULT 50 CHECK (leadership >= 1 AND leadership <= 100),
  
  -- Atributos Defensivos
  defending INTEGER DEFAULT 50 CHECK (defending >= 1 AND defending <= 100),
  tackling INTEGER DEFAULT 50 CHECK (tackling >= 1 AND tackling <= 100),
  heading INTEGER DEFAULT 50 CHECK (heading >= 1 AND heading <= 100),
  
  -- Atributo Específico Goleiro
  goalkeeping INTEGER DEFAULT 1 CHECK (goalkeeping >= 1 AND goalkeeping <= 100),
  
  -- =====================================================
  -- 📈 SISTEMA DE EVOLUÇÃO
  -- =====================================================
  
  -- Habilidade e Potencial
  current_ability INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN position = 'GK' THEN 
        ROUND((goalkeeping * 0.4 + concentration * 0.2 + jumping * 0.15 + strength * 0.1 + 
               leadership * 0.1 + vision * 0.05)::NUMERIC, 0)
      ELSE 
        ROUND((passing * 0.15 + shooting * 0.12 + dribbling * 0.12 + speed * 0.1 + 
               stamina * 0.08 + strength * 0.08 + concentration * 0.1 + creativity * 0.08 +
               vision * 0.07 + defending * 0.05 + tackling * 0.05)::NUMERIC, 0)
    END
  ) STORED,
  
  potential INTEGER NOT NULL DEFAULT 75 CHECK (potential >= 40 AND potential <= 99),
  development_rate DECIMAL(3,2) DEFAULT 0.5 CHECK (development_rate >= 0.1 AND development_rate <= 1.0),
  
  -- =====================================================
  -- 🏃 STATUS E FORMA
  -- =====================================================
  
  -- Status Mental e Físico
  morale INTEGER DEFAULT 75 CHECK (morale >= 0 AND morale <= 100),
  fitness INTEGER DEFAULT 85 CHECK (fitness >= 0 AND fitness <= 100),
  form INTEGER DEFAULT 6 CHECK (form >= 1 AND form <= 10),
  
  -- Propensão a Lesões e Lesão Atual
  injury_proneness INTEGER DEFAULT 5 CHECK (injury_proneness >= 1 AND injury_proneness <= 10),
  injury_type VARCHAR(50) DEFAULT NULL, -- null = não lesionado
  injury_severity INTEGER DEFAULT 0 CHECK (injury_severity >= 0 AND injury_severity <= 100),
  injury_return_date DATE DEFAULT NULL,
  
  -- =====================================================
  -- 💰 DADOS CONTRATUAIS E FINANCEIROS
  -- =====================================================
  
  -- Contrato
  contract_end_date DATE,
  salary_monthly INTEGER DEFAULT 5000,
  signing_bonus INTEGER DEFAULT 0,
  release_clause INTEGER DEFAULT NULL,
  
  -- Valor de Mercado
  market_value INTEGER DEFAULT 50000,
  last_value_update DATE DEFAULT CURRENT_DATE,
  
  -- =====================================================
  -- 📊 ESTATÍSTICAS DE CARREIRA
  -- =====================================================
  
  -- Jogos e Performances
  games_played INTEGER DEFAULT 0,
  games_started INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  
  -- Estatísticas Ofensivas
  goals_scored INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots_taken INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  
  -- Estatísticas Defensivas
  tackles_made INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0, -- Para goleiros principalmente
  
  -- Disciplina
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  
  -- Performance Rating (média das últimas 10 partidas)
  average_rating DECIMAL(3,2) DEFAULT 6.00,
  last_ratings INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array das últimas ratings
  
  -- =====================================================
  -- 🎓 ORIGEM E HISTÓRICO
  -- =====================================================
  
  -- Como o jogador chegou ao clube
  origin VARCHAR(20) DEFAULT 'created', -- created, market, youth, loan, free_agent
  signed_date DATE DEFAULT CURRENT_DATE,
  previous_clubs TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array de clubes anteriores
  
  -- Academia/Base
  youth_academy_level INTEGER DEFAULT NULL, -- Se veio da base, qual nível
  promoted_from_youth DATE DEFAULT NULL,
  
  -- =====================================================
  -- 🏋️ TREINAMENTO
  -- =====================================================
  
  -- Treinamento Individual Atual
  individual_training VARCHAR(50) DEFAULT NULL, -- Tipo de treinamento individual
  training_start_date DATE DEFAULT NULL,
  training_end_date DATE DEFAULT NULL,
  training_progress INTEGER DEFAULT 0 CHECK (training_progress >= 0 AND training_progress <= 100),
  
  -- Evolução por Treinamento (pontos acumulados esta semana)
  training_points_week DECIMAL(5,2) DEFAULT 0,
  
  -- =====================================================
  -- 📅 METADADOS
  -- =====================================================
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes para performance
  CONSTRAINT valid_age_potential CHECK (age <= 35 OR potential >= current_ability - 5),
  CONSTRAINT valid_goalkeeper CHECK (
    (position = 'GK' AND goalkeeping >= 30) OR 
    (position != 'GK' AND goalkeeping <= 20)
  )
);

-- =====================================================
-- 📈 TABELA DE EVOLUÇÃO HISTÓRICA
-- =====================================================

CREATE TABLE IF NOT EXISTS game_player_evolution_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
  
  -- Tipo de evolução
  evolution_type VARCHAR(20) NOT NULL, -- game, training, age_decline, injury_recovery
  evolution_source VARCHAR(50), -- Detalhe da fonte (tipo de treino, rating da partida, etc)
  
  -- Atributos afetados
  attributes_changed JSONB NOT NULL, -- {"passing": +1, "shooting": -1}
  
  -- Contexto
  match_id UUID DEFAULT NULL, -- Se foi por jogo
  training_week DATE DEFAULT NULL, -- Se foi por treinamento
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 🏪 TABELA DE MERCADO DE TRANSFERÊNCIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS game_transfer_market (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Jogador à venda
  player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
  
  -- Preço e Condições
  asking_price INTEGER NOT NULL,
  minimum_price INTEGER NOT NULL,
  contract_years INTEGER DEFAULT 2,
  salary_demand INTEGER NOT NULL,
  
  -- Status da Venda
  status VARCHAR(20) DEFAULT 'available', -- available, negotiating, sold, withdrawn
  listed_date DATE DEFAULT CURRENT_DATE,
  expires_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  
  -- Interesse e Ofertas
  interested_clubs TEXT[] DEFAULT ARRAY[]::TEXT[],
  best_offer INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 🎓 TABELA DE ACADEMIA DE BASE
-- =====================================================

CREATE TABLE IF NOT EXISTS game_youth_academies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  
  -- Nível da Academia
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  
  -- Configurações
  monthly_cost INTEGER NOT NULL,
  production_rate DECIMAL(3,2) DEFAULT 0.5, -- Jogadores por mês
  max_potential INTEGER DEFAULT 70,
  focus_position VARCHAR(10) DEFAULT NULL, -- Foco em posição específica
  
  -- Estatísticas
  total_players_produced INTEGER DEFAULT 0,
  players_promoted INTEGER DEFAULT 0,
  players_sold INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  
  -- Próxima produção
  next_production_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id) -- Um time só pode ter uma academia
);

-- =====================================================
-- 🏋️ TABELA DE PLANOS DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS game_training_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  
  -- Plano Atual
  plan_type VARCHAR(30) DEFAULT 'balanced', -- balanced, physical, technical, tactical, recovery
  intensity INTEGER DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  
  -- Distribuição do Treino (deve somar 100)
  physical_focus INTEGER DEFAULT 25 CHECK (physical_focus >= 0 AND physical_focus <= 100),
  technical_focus INTEGER DEFAULT 35 CHECK (technical_focus >= 0 AND technical_focus <= 100),
  tactical_focus INTEGER DEFAULT 25 CHECK (tactical_focus >= 0 AND tactical_focus <= 100),
  rest_focus INTEGER DEFAULT 15 CHECK (rest_focus >= 0 AND rest_focus <= 100),
  
  -- Custos e Efeitos
  weekly_cost INTEGER DEFAULT 5000,
  injury_risk DECIMAL(4,3) DEFAULT 0.010,
  morale_effect INTEGER DEFAULT 0,
  fitness_effect INTEGER DEFAULT 0,
  
  -- Datas
  active_since DATE DEFAULT CURRENT_DATE,
  last_training_week DATE DEFAULT NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id), -- Um time só pode ter um plano ativo
  CONSTRAINT valid_focus_distribution CHECK (
    physical_focus + technical_focus + tactical_focus + rest_focus = 100
  )
);

-- =====================================================
-- 🎯 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON game_players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON game_players(position);
CREATE INDEX IF NOT EXISTS idx_players_age ON game_players(age);
CREATE INDEX IF NOT EXISTS idx_players_ability ON game_players(current_ability);
CREATE INDEX IF NOT EXISTS idx_players_potential ON game_players(potential);
CREATE INDEX IF NOT EXISTS idx_players_contract ON game_players(contract_end_date);

-- Índices para mercado
CREATE INDEX IF NOT EXISTS idx_transfer_market_status ON game_transfer_market(status);
CREATE INDEX IF NOT EXISTS idx_transfer_market_price ON game_transfer_market(asking_price);
CREATE INDEX IF NOT EXISTS idx_transfer_market_expires ON game_transfer_market(expires_date);

-- Índices para evolução
CREATE INDEX IF NOT EXISTS idx_evolution_player_id ON game_player_evolution_log(player_id);
CREATE INDEX IF NOT EXISTS idx_evolution_type ON game_player_evolution_log(evolution_type);
CREATE INDEX IF NOT EXISTS idx_evolution_date ON game_player_evolution_log(created_at);

-- =====================================================
-- 🎮 TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON game_players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_market_updated_at 
    BEFORE UPDATE ON game_transfer_market 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_academies_updated_at 
    BEFORE UPDATE ON game_youth_academies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at 
    BEFORE UPDATE ON game_training_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 📊 VIEWS ÚTEIS
-- =====================================================

-- View para jogadores com dados calculados
CREATE OR REPLACE VIEW game_players_detailed AS
SELECT 
  p.*,
  -- Valor de mercado atualizado baseado em habilidade, idade e forma
  CASE 
    WHEN p.age <= 23 THEN p.current_ability * 15000 * (p.potential / 100.0)
    WHEN p.age <= 27 THEN p.current_ability * 12000
    WHEN p.age <= 30 THEN p.current_ability * 8000
    WHEN p.age <= 33 THEN p.current_ability * 4000
    ELSE p.current_ability * 2000
  END AS calculated_market_value,
  
  -- Dias até fim do contrato
  CASE 
    WHEN p.contract_end_date IS NOT NULL 
    THEN (p.contract_end_date - CURRENT_DATE)
    ELSE NULL
  END AS contract_days_remaining,
  
  -- Status do jogador
  CASE 
    WHEN p.injury_type IS NOT NULL THEN 'injured'
    WHEN p.fitness < 70 THEN 'poor_fitness'
    WHEN p.morale < 50 THEN 'low_morale'
    WHEN p.form >= 8 THEN 'excellent_form'
    WHEN p.form <= 3 THEN 'poor_form'
    ELSE 'available'
  END AS player_status

FROM game_players p;

-- =====================================================
-- 🚀 COMENTÁRIOS FINAIS
-- =====================================================

-- Este schema implementa um sistema completo de jogadores
-- inspirado no Elifoot clássico, com:
-- 
-- ✅ 17 atributos detalhados
-- ✅ Sistema de evolução baseado em jogos e treinamento  
-- ✅ Mercado de transferências dinâmico
-- ✅ Academia de base produtiva
-- ✅ Gestão de contratos e salários
-- ✅ Sistema de lesões e forma
-- ✅ Histórico completo de evolução
-- ✅ Performance e otimização
--
-- O sistema está pronto para ser implementado no backend!