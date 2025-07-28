-- Script direto para adicionar campo category na tabela players
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'category'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE players ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional';

        -- Adicionar comentário
        COMMENT ON COLUMN players.category IS 'Categoria do jogador: professional ou amateur';

        -- Atualizar jogadores existentes para serem profissionais
        UPDATE players SET category = 'professional' WHERE category IS NULL OR category = '';

        RAISE NOTICE 'Campo category adicionado na tabela players com sucesso';
    ELSE
        RAISE NOTICE 'Campo category já existe na tabela players';
    END IF;
END $$; 