-- Adicionar coluna retention_days à tabela simulation_results
ALTER TABLE simulation_results ADD COLUMN IF NOT EXISTS retention_days INTEGER;

