-- =====================================================
-- Migração: SISTEMA DE MERCADO E PROMOÇÃO DE JOGADORES
-- Adiciona as funcionalidades de mercado de transferências
-- e a distinção entre jogadores da base e profissionais.
-- SCRIPT IDEMPOTENTE: Seguro para ser executado múltiplas vezes.
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA PARA JOGADORES PROFISSIONAIS
-- Separando jogadores da base dos profissionais.
-- =====================================================
CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) DEFAULT 'Brasil',
  
  -- Relacionamentos
  team_id UUID REFERENCES game_teams(id) ON DELETE SET NULL,
  
  -- Atributos do jogador (similar a youth_players, mas pode evoluir de forma diferente)
  attributes JSONB NOT NULL,
  
  -- Dados de Jogo
  overall INTEGER GENERATED ALWAYS AS (
    ((attributes->>'pace')::int +
    (attributes->>'shooting')::int +
    (attributes->>'passing')::int +
    (attributes->>'dribbling')::int +
    (attributes->>'defending')::int +
    (attributes->>'physical')::int) / 6
  ) STORED,
  market_value DECIMAL(12, 2) DEFAULT 1000.00,
  salary DECIMAL(10, 2) DEFAULT 500.00,
  contract_expires_at DATE,
  
  -- Status de Mercado
  market_status VARCHAR(50) DEFAULT 'none' CHECK (market_status IN ('none', 'listed', 'sold')), -- none, listed, sold
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ALTERAR TABELA DE JOGADORES DA BASE
-- Adicionando campos para futuro valor e status de promoção.
-- =====================================================
ALTER TABLE youth_players
ADD COLUMN IF NOT EXISTS market_value DECIMAL(12, 2) DEFAULT 500.00;
-- Nota: A coluna gerada não pode ser adicionada com IF NOT EXISTS de forma simples se a expressão mudar.
-- Para este caso, vamos assumir que se a coluna existe, está correta. 
-- Em um cenário mais complexo, seria necessário um bloco DO para verificar e alterar.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='youth_players' AND column_name='potential_overall') THEN
        ALTER TABLE youth_players ADD COLUMN potential_overall INTEGER GENERATED ALWAYS AS (
            ((potential->>'pace')::int +
            (potential->>'shooting')::int +
            (potential->>'passing')::int +
            (potential->>'dribbling')::int +
            (potential->>'defending')::int +
            (potential->>'physical')::int) / 6
          ) STORED;
    END IF;
END $$;

-- =====================================================
-- 2.5. ADICIONAR COLUNA is_user_team À TABELA game_teams
-- Para distinguir entre times do usuário e times da IA
-- =====================================================
ALTER TABLE game_teams
ADD COLUMN IF NOT EXISTS is_user_team BOOLEAN DEFAULT false;

-- Atualizar times existentes: se owner_id não é null, é time do usuário
UPDATE game_teams 
SET is_user_team = true 
WHERE owner_id IS NOT NULL;

-- =====================================================
-- 3. CRIAR TABELA DO MERCADO DE TRANSFERÊNCIAS
-- Onde todas as listagens e propostas irão acontecer.
-- =====================================================
CREATE TABLE IF NOT EXISTS game_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Jogador (pode ser da base ou profissional)
  player_id UUID NOT NULL,
  is_youth_player BOOLEAN DEFAULT false,
  
  -- Detalhes da Listagem
  selling_team_id UUID REFERENCES game_teams(id),
  listing_price DECIMAL(12, 2) NOT NULL,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Proposta (se houver)
  buying_team_id UUID REFERENCES game_teams(id),
  offer_price DECIMAL(12, 2),
  offer_status VARCHAR(50) DEFAULT 'pending' CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')), -- pending, accepted, rejected, expired
  offer_made_at TIMESTAMP WITH TIME ZONE,
  
  -- Status da Transferência
  transfer_status VARCHAR(50) DEFAULT 'listed' CHECK (transfer_status IN ('listed', 'negotiating', 'completed', 'cancelled')), -- listed, negotiating, completed, cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES E TRIGGERS PARA AS NOVAS TABELAS
-- =====================================================

-- Índices
CREATE INDEX IF NOT EXISTS idx_game_players_team ON game_players(team_id);
CREATE INDEX IF NOT EXISTS idx_game_transfers_selling_team ON game_transfers(selling_team_id);
CREATE INDEX IF NOT EXISTS idx_game_transfers_buying_team ON game_transfers(buying_team_id);
CREATE INDEX IF NOT EXISTS idx_game_transfers_player ON game_transfers(player_id);

-- Triggers de atualização (Drop-if-exists-then-create pattern)
DROP TRIGGER IF EXISTS update_game_players_updated_at ON game_players;
CREATE TRIGGER update_game_players_updated_at BEFORE UPDATE ON game_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
DROP TRIGGER IF EXISTS update_game_transfers_updated_at ON game_transfers;
CREATE TRIGGER update_game_transfers_updated_at BEFORE UPDATE ON game_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (é idempotente, não causa erro se já estiver habilitado)
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_transfers ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Drop-if-exists-then-create pattern)
DROP POLICY IF EXISTS "Users can manage own professional players" ON game_players;
CREATE POLICY "Users can manage own professional players" ON game_players
  FOR ALL USING (team_id IN (
    SELECT id FROM game_teams WHERE owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage own transfers" ON game_transfers;
CREATE POLICY "Users can manage own transfers" ON game_transfers
  FOR ALL USING (
    selling_team_id IN (SELECT id FROM game_teams WHERE owner_id = auth.uid()) OR
    buying_team_id IN (SELECT id FROM game_teams WHERE owner_id = auth.uid())
  );


-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migração do SISTEMA DE MERCADO E PROMOÇÃO verificada/aplicada com sucesso!';
  RAISE NOTICE 'Tabelas criadas/alteradas: game_players, youth_players, game_transfers';
END $$;
