-- =====================================================
-- VERIFICAR E CORRIGIR CONSTRAINT DE TRAINING_INTENSITY
-- Execute este SQL no Supabase Studio
-- =====================================================

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'youth_players'::regclass 
AND conname = 'chk_youth_players_training_intensity';

-- 2. Verificar valores únicos atuais na coluna training_intensity
SELECT DISTINCT training_intensity, COUNT(*) as count
FROM youth_players 
GROUP BY training_intensity;

-- 3. Verificar se há valores inválidos
SELECT id, name, training_intensity
FROM youth_players 
WHERE training_intensity NOT IN ('baixa', 'normal', 'alta');

-- 4. Remover a constraint antiga (se existir)
ALTER TABLE youth_players 
DROP CONSTRAINT IF EXISTS chk_youth_players_training_intensity;

-- 5. Adicionar nova constraint que permite os valores corretos
ALTER TABLE youth_players 
ADD CONSTRAINT chk_youth_players_training_intensity 
CHECK (training_intensity IN ('baixa', 'normal', 'alta'));

-- 6. Verificar se a constraint foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'youth_players'::regclass 
AND conname = 'chk_youth_players_training_intensity';

-- 7. Atualizar valores inválidos para 'normal' (padrão)
UPDATE youth_players 
SET training_intensity = 'normal' 
WHERE training_intensity NOT IN ('baixa', 'normal', 'alta') 
OR training_intensity IS NULL;

-- 8. Verificar se todos os valores estão corretos agora
SELECT DISTINCT training_intensity, COUNT(*) as count
FROM youth_players 
GROUP BY training_intensity;
