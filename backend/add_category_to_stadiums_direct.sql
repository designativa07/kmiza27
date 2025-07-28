-- Script direto para adicionar campo category na tabela stadiums
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stadiums' AND column_name = 'category'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE stadiums ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional';

        -- Adicionar comentário
        COMMENT ON COLUMN stadiums.category IS 'Categoria do estádio: professional ou amateur';

        -- Atualizar estádios existentes para serem profissionais
        UPDATE stadiums SET category = 'professional' WHERE category IS NULL OR category = '';

        RAISE NOTICE 'Campo category adicionado na tabela stadiums com sucesso';
    ELSE
        RAISE NOTICE 'Campo category já existe na tabela stadiums';
    END IF;
END $$; 