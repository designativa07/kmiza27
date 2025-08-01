-- Adicionar colunas para sistema de promoção/rebaixamento
ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;
ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_year INTEGER DEFAULT 2025;
ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT 'active';

-- Configurar Série D como aberta para novos usuários
UPDATE game_competitions 
SET is_open_for_new_users = true 
WHERE tier = 4;

-- Configurar outras séries como fechadas para novos usuários
UPDATE game_competitions 
SET is_open_for_new_users = false 
WHERE tier < 4;

-- Verificar configuração
SELECT 
    name,
    tier,
    is_open_for_new_users,
    promotion_spots,
    relegation_spots,
    current_teams,
    max_teams
FROM game_competitions 
ORDER BY tier; 