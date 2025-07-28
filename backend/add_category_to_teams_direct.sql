-- Script direto para adicionar campo category na tabela teams
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'category'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE teams ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional';
        
        -- Adicionar comentário
        COMMENT ON COLUMN teams.category IS 'Categoria do time: professional ou amateur';
        
        -- Atualizar times existentes
        UPDATE teams SET category = 'professional' WHERE category IS NULL OR category = '';
        
        RAISE NOTICE 'Campo category adicionado na tabela teams com sucesso';
    ELSE
        RAISE NOTICE 'Campo category já existe na tabela teams';
    END IF;
END $$; 