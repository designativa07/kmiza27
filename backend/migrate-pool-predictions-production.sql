-- Migração da tabela pool_predictions para produção
-- Execute este script no servidor de produção

-- 1. Adicionar colunas que estão faltando
ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS predicted_home_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS predicted_away_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS prediction_type VARCHAR(50) NULL;

-- 2. Migrar dados das colunas antigas (se existirem) para as novas
UPDATE pool_predictions 
SET 
  predicted_home_score = COALESCE(home_score, 0),
  predicted_away_score = COALESCE(away_score, 0)
WHERE predicted_home_score = 0 AND predicted_away_score = 0
AND (home_score IS NOT NULL OR away_score IS NOT NULL);

-- 3. Remover colunas antigas (se existirem)
ALTER TABLE pool_predictions DROP COLUMN IF EXISTS home_score;
ALTER TABLE pool_predictions DROP COLUMN IF EXISTS away_score;

-- 4. Verificar estrutura final
-- Execute esta query para verificar se tudo está correto:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pool_predictions'
-- ORDER BY ordinal_position; 