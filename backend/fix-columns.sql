-- Adicionar colunas faltantes no banco de desenvolvimento

-- Adicionar coluna goal_difference à tabela teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS goal_difference INTEGER DEFAULT 0;

-- Adicionar coluna round_number à tabela simulation_results  
ALTER TABLE simulation_results ADD COLUMN IF NOT EXISTS round_number INTEGER;

-- Verificar se as colunas foram adicionadas
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('teams', 'simulation_results')
  AND column_name IN ('goal_difference', 'round_number')
ORDER BY table_name, column_name;

