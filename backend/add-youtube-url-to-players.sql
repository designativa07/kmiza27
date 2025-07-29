-- Adicionar coluna youtube_url na tabela players
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);

-- Adicionar coluna instagram_url na tabela players (caso também não exista)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);

-- Adicionar comentários para documentação
COMMENT ON COLUMN players.youtube_url IS 'URL do canal do YouTube do jogador';
COMMENT ON COLUMN players.instagram_url IS 'URL do perfil do Instagram do jogador'; 