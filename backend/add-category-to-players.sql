-- Adicionar coluna category na tabela players
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'professional';

-- Atualizar jogadores existentes para ter categoria 'professional'
UPDATE players 
SET category = 'professional' 
WHERE category IS NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN players.category IS 'Categoria do jogador: professional ou amateur'; 