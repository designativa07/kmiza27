-- Script completo para corrigir a tabela players
-- Adicionar todas as colunas que estão faltando

-- 1. Adicionar coluna category
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'professional';

-- 2. Adicionar coluna youtube_url
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);

-- 3. Adicionar coluna instagram_url
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);

-- 4. Atualizar jogadores existentes para ter categoria 'professional'
UPDATE players 
SET category = 'professional' 
WHERE category IS NULL;

-- 5. Adicionar comentários para documentação
COMMENT ON COLUMN players.category IS 'Categoria do jogador: professional ou amateur';
COMMENT ON COLUMN players.youtube_url IS 'URL do canal do YouTube do jogador';
COMMENT ON COLUMN players.instagram_url IS 'URL do perfil do Instagram do jogador';

-- 6. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('category', 'youtube_url', 'instagram_url')
ORDER BY column_name; 