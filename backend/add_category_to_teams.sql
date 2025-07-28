-- Adicionar campo category na tabela teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'professional';

-- Adicionar comentário
COMMENT ON COLUMN teams.category IS 'Categoria do time: professional ou amateur';

-- Atualizar times existentes para serem profissionais
UPDATE teams SET category = 'professional' WHERE category IS NULL OR category = ''; 