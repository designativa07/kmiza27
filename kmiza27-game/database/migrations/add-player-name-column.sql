-- =====================================================
-- MIGRAÇÃO: Adicionar coluna player_name em game_transfers
-- =====================================================

-- Adicionar coluna player_name
ALTER TABLE game_transfers
ADD COLUMN IF NOT EXISTS player_name VARCHAR(255);

-- Adicionar comentário
COMMENT ON COLUMN game_transfers.player_name IS 'Nome do jogador para exibição no mercado';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_game_transfers_player_name ON game_transfers(player_name);

-- Atualizar listagens existentes com nomes dos jogadores
UPDATE game_transfers 
SET player_name = (
  SELECT name 
  FROM game_players 
  WHERE game_players.id = game_transfers.player_id
)
WHERE player_name IS NULL AND player_id IS NOT NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total_listings,
  COUNT(player_name) as with_names,
  COUNT(*) - COUNT(player_name) as without_names
FROM game_transfers 
WHERE transfer_status = 'listed';
