-- Adicionar campo category na tabela competitions
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'professional';

-- Adicionar comentário
COMMENT ON COLUMN competitions.category IS 'Categoria da competição: professional ou amateur';

-- Atualizar competições existentes para serem profissionais
UPDATE competitions SET category = 'professional' WHERE category IS NULL OR category = ''; 