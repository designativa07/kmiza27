-- Adicionar coluna state na tabela players
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'active';

-- Atualizar jogadores existentes para ter o estado 'active'
UPDATE players 
SET state = 'active' 
WHERE state IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'state'; 