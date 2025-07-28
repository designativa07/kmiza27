-- Adicionar campo category na tabela matches
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'category'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE matches ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional';
        
        -- Adicionar comentário
        COMMENT ON COLUMN matches.category IS 'Categoria da partida: professional ou amateur';
        
        -- Atualizar partidas existentes para serem profissionais
        UPDATE matches SET category = 'professional' WHERE category IS NULL OR category = '';
        
        RAISE NOTICE 'Campo category adicionado na tabela matches com sucesso';
    ELSE
        RAISE NOTICE 'Campo category já existe na tabela matches';
    END IF;
END $$; 