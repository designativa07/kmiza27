-- =====================================================
-- CORRIGIR CONSTRAINT DA COLUNA offer_status
-- Adicionar 'counter_offer' aos valores permitidos
-- =====================================================

-- Remover a constraint existente
ALTER TABLE game_transfers DROP CONSTRAINT IF EXISTS game_transfers_offer_status_check;

-- Adicionar nova constraint com 'counter_offer'
ALTER TABLE game_transfers 
ADD CONSTRAINT game_transfers_offer_status_check 
CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired', 'counter_offer'));

-- Também atualizar a constraint de transfer_status para incluir 'counter_offer'
ALTER TABLE game_transfers DROP CONSTRAINT IF EXISTS game_transfers_transfer_status_check;

ALTER TABLE game_transfers 
ADD CONSTRAINT game_transfers_transfer_status_check 
CHECK (transfer_status IN ('listed', 'negotiating', 'completed', 'cancelled', 'counter_offer'));

-- Comentário para documentar a mudança
COMMENT ON COLUMN game_transfers.offer_status IS 'Status da oferta: pending, accepted, rejected, expired, counter_offer';
COMMENT ON COLUMN game_transfers.transfer_status IS 'Status da transferência: listed, negotiating, completed, cancelled, counter_offer';
