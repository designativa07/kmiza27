-- Adicionar campo display_order na tabela competitions
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Atualizar competições existentes com ordem baseada no ID
UPDATE competitions 
SET display_order = id 
WHERE display_order = 0;

-- Adicionar comentário
COMMENT ON COLUMN competitions.display_order IS 'Ordem de exibição das competições na interface';