-- Script para corrigir o campo is_latest das simulações
-- Problema: Todas as simulações estão marcadas como is_latest = true
-- Solução: Marcar apenas a mais recente como true e as demais como false

-- 1. Primeiro, vamos ver o estado atual
SELECT 
  id,
  execution_date,
  is_latest,
  competition_id
FROM simulation_results 
WHERE competition_id = 1
ORDER BY execution_date DESC;

-- 2. Corrigir o campo is_latest para competição 1 (Brasileirão Série A)
-- Marcar apenas a simulação mais recente como is_latest = true
UPDATE simulation_results 
SET is_latest = false 
WHERE competition_id = 1;

-- Marcar a simulação mais recente como is_latest = true
UPDATE simulation_results 
SET is_latest = true 
WHERE id = (
  SELECT id 
  FROM simulation_results 
  WHERE competition_id = 1 
  ORDER BY execution_date DESC 
  LIMIT 1
);

-- 3. Verificar o resultado da correção
SELECT 
  id,
  execution_date,
  is_latest,
  competition_id
FROM simulation_results 
WHERE competition_id = 1
ORDER BY execution_date DESC;

-- 4. Criar trigger para evitar que o problema aconteça novamente
-- Primeiro, remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_simulation_latest ON simulation_results;

-- Remover função existente se houver
DROP FUNCTION IF EXISTS update_simulation_latest_flag();

-- Criar função para atualizar o flag is_latest
CREATE OR REPLACE FUNCTION update_simulation_latest_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Se uma nova simulação está sendo inserida ou atualizada
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Marcar todas as simulações da mesma competição como não mais recente
    UPDATE simulation_results 
    SET is_latest = false 
    WHERE competition_id = NEW.competition_id;
    
    -- Marcar a nova simulação como mais recente
    NEW.is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes de INSERT ou UPDATE
CREATE TRIGGER trigger_update_simulation_latest
  BEFORE INSERT OR UPDATE ON simulation_results
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_latest_flag();

-- 5. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'simulation_results';

-- 6. Testar o trigger com uma atualização
-- (opcional - apenas para verificar se está funcionando)
-- UPDATE simulation_results SET execution_date = execution_date WHERE id = 1;



