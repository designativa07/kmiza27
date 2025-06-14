-- Script para criar rodadas da Copa do Brasil e associar os jogos existentes

-- Primeiro, vamos criar as rodadas da Copa do Brasil
INSERT INTO rounds (competition_id, name, round_number, phase, is_current) VALUES
(7, 'Terceira Fase', 1, 'Terceira', false),
(7, 'Oitavas de Final', 2, 'Oitavas de final', true);

-- Agora vamos atualizar os jogos existentes para associá-los às rodadas corretas

-- Atualizar jogos da Terceira Fase
UPDATE matches 
SET round_id = (SELECT id FROM rounds WHERE competition_id = 7 AND name = 'Terceira Fase' LIMIT 1)
WHERE competition_id = 7 AND phase = 'Terceira';

-- Atualizar jogos das Oitavas de Final
UPDATE matches 
SET round_id = (SELECT id FROM rounds WHERE competition_id = 7 AND name = 'Oitavas de Final' LIMIT 1)
WHERE competition_id = 7 AND phase = 'Oitavas de final';

-- Verificar o resultado
SELECT 
    r.name as rodada,
    COUNT(m.id) as total_jogos
FROM rounds r
LEFT JOIN matches m ON r.id = m.round_id
WHERE r.competition_id = 7
GROUP BY r.id, r.name
ORDER BY r.round_number; 