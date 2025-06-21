-- Inserir algumas rodadas e partidas de exemplo para testar o chatbot

-- Inserir rodada do Brasileirão
INSERT INTO rounds (competition_id, name, round_number, is_current) VALUES
(1, 'Rodada 35', 35, true);

-- Inserir algumas partidas futuras
INSERT INTO matches (competition_id, round_id, home_team_id, away_team_id, match_date, status, broadcast_channels) VALUES
(1, 1, 1, 2, '2024-12-15 16:00:00', 'scheduled', 
 '["Globo", "SporTV", "Premiere"]', 
 '[{"name": "Globoplay", "url": "https://globoplay.globo.com"}, {"name": "Premiere Play", "url": "https://premiere.globo.com"}]'),
(1, 1, 3, 4, '2024-12-15 18:30:00', 'scheduled', 
 '["Globo", "SporTV"]', 
 '[{"name": "Globoplay", "url": "https://globoplay.globo.com"}]'),
(1, 1, 5, 6, '2024-12-16 16:00:00', 'scheduled', 
 '["SporTV", "Premiere"]', 
 '[{"name": "Premiere Play", "url": "https://premiere.globo.com"}]'),
(1, 1, 7, 8, '2024-12-16 20:00:00', 'scheduled', 
 '["Globo", "SporTV", "Premiere"]', 
 '[{"name": "Globoplay", "url": "https://globoplay.globo.com"}, {"name": "Premiere Play", "url": "https://premiere.globo.com"}]');

-- Inserir alguns estádios
INSERT INTO stadiums (name, city, state, capacity) VALUES
('Maracanã', 'Rio de Janeiro', 'RJ', 78838),
('Allianz Parque', 'São Paulo', 'SP', 43713),
('Neo Química Arena', 'São Paulo', 'SP', 49205),
('Morumbi', 'São Paulo', 'SP', 67052);

-- Atualizar partidas com estádios
UPDATE matches SET stadium_id = 1 WHERE home_team_id = 1; -- Flamengo no Maracanã
UPDATE matches SET stadium_id = 2 WHERE home_team_id = 2; -- Palmeiras no Allianz Parque
UPDATE matches SET stadium_id = 3 WHERE home_team_id = 4; -- Corinthians na Neo Química Arena
UPDATE matches SET stadium_id = 4 WHERE home_team_id = 8; -- São Paulo no Morumbi 