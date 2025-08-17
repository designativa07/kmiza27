-- Adicionar campos para decisões da IA nas ofertas
-- Este script adiciona suporte para IA tomar decisões sobre ofertas

-- Adicionar colunas para decisões da IA
ALTER TABLE game_transfers 
ADD COLUMN IF NOT EXISTS ai_decision VARCHAR(20) CHECK (ai_decision IN ('accepted', 'rejected', 'counter_offer', 'pending')),
ADD COLUMN IF NOT EXISTS ai_decision_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS counter_offer_price INTEGER,
ADD COLUMN IF NOT EXISTS is_ai_team BOOLEAN DEFAULT false;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN game_transfers.ai_decision IS 'Decisão da IA sobre a oferta: accepted, rejected, counter_offer, pending';
COMMENT ON COLUMN game_transfers.ai_decision_at IS 'Data/hora da decisão da IA';
COMMENT ON COLUMN game_transfers.counter_offer_price IS 'Preço da contraproposta da IA';
COMMENT ON COLUMN game_transfers.is_ai_team IS 'Indica se o time vendedor é controlado pela IA';

-- Criar índice para melhorar performance das consultas por decisão da IA
CREATE INDEX IF NOT EXISTS idx_game_transfers_ai_decision ON game_transfers(ai_decision);
CREATE INDEX IF NOT EXISTS idx_game_transfers_is_ai_team ON game_transfers(is_ai_team);

-- Atualizar times existentes para marcar quais são da IA
UPDATE game_transfers 
SET is_ai_team = true 
WHERE selling_team_id IN (
  SELECT id FROM game_teams WHERE is_user_team = false
);

-- Marcar ofertas pendentes como 'pending' para decisão da IA
UPDATE game_transfers 
SET ai_decision = 'pending' 
WHERE ai_decision IS NULL AND offer_status = 'pending';
