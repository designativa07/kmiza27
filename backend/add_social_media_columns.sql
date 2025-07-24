-- Adicionar campos de redes sociais aos jogadores
ALTER TABLE players ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255); 