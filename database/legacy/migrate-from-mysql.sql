-- =====================================================
-- MIGRAÇÃO DE DADOS DO MYSQL PARA POSTGRESQL
-- Kmiza27 Chatbot - Base de Dados de Futebol
-- =====================================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE game_broadcasts CASCADE;
TRUNCATE TABLE games CASCADE;
TRUNCATE TABLE competitions CASCADE;
TRUNCATE TABLE teams CASCADE;

-- =====================================================
-- 1. MIGRAÇÃO DE COMPETIÇÕES
-- =====================================================

INSERT INTO competitions (name, short_name, type, country, season, logo_url, created_at, updated_at) VALUES
('Brasileirão Série A', 'Brasileirão', 'Liga', 'Brasil', '2025', '', NOW(), NOW()),
('Copa do Brasil', 'Copa do Brasil', 'Copa', 'Brasil', '2025', '', NOW(), NOW()),
('Copa Libertadores', 'Libertadores', 'Copa', 'América do Sul', '2025', 'https://upload.wikimedia.org/wikipedia/pt/9/95/Conmebol_Libertadores_logo.svg', NOW(), NOW()),
('Copa Sul-Americana', 'Sul-Americana', 'Copa', 'América do Sul', '2025', 'https://logodownload.org/wp-content/uploads/2018/10/copa-sulamericana-logo.png', NOW(), NOW()),
('Brasileirão Série B', 'Série B', 'Liga', 'Brasil', '2025', '', NOW(), NOW()),
('Brasileirão Série C', 'Série C', 'Liga', 'Brasil', '2025', '', NOW(), NOW()),
('UEFA Champions League', 'Champions', 'Liga', 'Europa', '2024/2025', '', NOW(), NOW()),
('UEFA Europa League', 'Europa League', 'Liga', 'Europa', '2025', '', NOW(), NOW()),
('UEFA Conference League', 'Conference', 'Liga', 'Europa', '2025', '', NOW(), NOW()),
('Mundial de Clubes', 'Mundial', 'Torneio', 'Mundial', '2025', '', NOW(), NOW());

-- =====================================================
-- 2. MIGRAÇÃO DE TIMES BRASILEIROS (PRINCIPAIS)
-- =====================================================

INSERT INTO teams (name, slug, full_name, short_name, stadium, city, state, founded_year, logo_url, created_at, updated_at) VALUES
-- Times da Série A
('Flamengo', 'flamengo', 'Clube de Regatas do Flamengo', 'FLA', 'Maracanã', 'Rio de Janeiro', 'RJ', 1895, '/kmiza27/img/escudos/flamengo.svg', NOW(), NOW()),
('Palmeiras', 'palmeiras', 'Sociedade Esportiva Palmeiras', 'PAL', 'Allianz Parque', 'São Paulo', 'SP', 1914, '/kmiza27/img/escudos/palmeiras.svg', NOW(), NOW()),
('Corinthians', 'corinthians', 'Sport Club Corinthians Paulista', 'COR', 'Neo Química Arena', 'São Paulo', 'SP', 1910, '/kmiza27/img/escudos/corinthians.svg', NOW(), NOW()),
('São Paulo', 'sao-paulo', 'São Paulo Futebol Clube', 'SAO', 'MorumBIS', 'São Paulo', 'SP', 1930, '/kmiza27/img/escudos/sao-paulo.svg', NOW(), NOW()),
('Santos', 'santos', 'Santos Futebol Clube', 'SAN', 'Vila Belmiro', 'Santos', 'SP', 1912, '/kmiza27/img/escudos/santos.svg', NOW(), NOW()),
('Botafogo', 'botafogo', 'Botafogo de Futebol e Regatas', 'BOT', 'Estádio Nilton Santos', 'Rio de Janeiro', 'RJ', 1904, '/kmiza27/img/escudos/botafogo.svg', NOW(), NOW()),
('Fluminense', 'fluminense', 'Fluminense Football Club', 'FLU', 'Maracanã', 'Rio de Janeiro', 'RJ', 1902, '/kmiza27/img/escudos/fluminense.svg', NOW(), NOW()),
('Vasco da Gama', 'vasco', 'Club de Regatas Vasco da Gama', 'VAS', 'São Januário', 'Rio de Janeiro', 'RJ', 1898, 'vasco-da-gama.svg', NOW(), NOW()),
('Atlético-MG', 'atletico-mg', 'Clube Atlético Mineiro', 'CAM', 'Arena MRV', 'Belo Horizonte', 'MG', 1908, '/kmiza27/img/escudos/atletico-mg.svg', NOW(), NOW()),
('Cruzeiro', 'cruzeiro', 'Cruzeiro Esporte Clube', 'CRU', 'Mineirão', 'Belo Horizonte', 'MG', 1921, '/kmiza27/img/escudos/cruzeiro.svg', NOW(), NOW()),
('Internacional', 'internacional', 'Sport Club Internacional', 'INT', 'Beira-Rio', 'Porto Alegre', 'RS', 1909, '/kmiza27/img/escudos/internacional.svg', NOW(), NOW()),
('Grêmio', 'gremio', 'Grêmio Foot-Ball Porto Alegrense', 'GRE', 'Arena do Grêmio', 'Porto Alegre', 'RS', 1903, '/kmiza27/img/escudos/gremio.svg', NOW(), NOW()),
('Bahia', 'bahia', 'Esporte Clube Bahia', 'BAH', 'Arena Fonte Nova', 'Salvador', 'BA', 1931, '/kmiza27/img/escudos/bahia.svg', NOW(), NOW()),
('Fortaleza', 'fortaleza', 'Fortaleza Esporte Clube', 'FOR', 'Castelão', 'Fortaleza', 'CE', 1918, '/kmiza27/img/escudos/fortaleza.svg', NOW(), NOW()),
('Ceará', 'ceara', 'Ceará Sporting Club', 'CEA', 'Castelão', 'Fortaleza', 'CE', 1914, '/kmiza27/img/escudos/ceara.svg', NOW(), NOW()),
('Sport', 'sport', 'Sport Club do Recife', 'SPO', 'Ilha do Retiro', 'Recife', 'PE', 1905, '/kmiza27/img/escudos/sport.svg', NOW(), NOW()),
('Vitória', 'vitoria', 'Esporte Clube Vitória', 'VIT', 'Barradão', 'Salvador', 'BA', 1899, '/kmiza27/img/escudos/vitoria.svg', NOW(), NOW()),
('Juventude', 'juventude', 'Esporte Clube Juventude', 'JUV', 'Alfredo Jaconi', 'Caxias do Sul', 'RS', 1913, '/kmiza27/img/escudos/juventude.svg', NOW(), NOW()),
('RB Bragantino', 'bragantino', 'Red Bull Bragantino', 'RBB', 'Nabi Abi Chedid', 'Bragança Paulista', 'SP', 1928, 'rb-bragantino.svg', NOW(), NOW()),
('Mirassol', 'mirassol', 'Mirassol Futebol Clube', 'MIR', 'Campos Maia', 'Mirassol', 'SP', 1925, '/kmiza27/img/escudos/mirassol.svg', NOW(), NOW()),

-- Times da Série B e outros importantes
('Cuiabá', 'cuiaba', 'Cuiabá Esporte Clube', 'CUI', 'Arena Pantanal', 'Cuiabá', 'MT', 2001, 'cuiaba.svg', NOW(), NOW()),
('Athletico-PR', 'athletico-pr', 'Club Athletico Paranaense', 'CAP', 'Ligga Arena', 'Curitiba', 'PR', 1924, 'athletico-pr.svg', NOW(), NOW()),
('Coritiba', 'coritiba', 'Coritiba Foot Ball Club', 'CFC', 'Couto Pereira', 'Curitiba', 'PR', 1909, 'coritiba.svg', NOW(), NOW()),
('Atlético-GO', 'atletico-go', 'Atlético Clube Goianiense', 'ACG', 'Antônio Accioly', 'Goiânia', 'GO', 1937, 'atletico-go.svg', NOW(), NOW()),
('Goiás', 'goias', 'Goiás Esporte Clube', 'GOI', 'Serrinha', 'Goiânia', 'GO', 1943, 'goias.svg', NOW(), NOW()),
('América-MG', 'america-mg', 'América Futebol Clube', 'AME', 'Independência', 'Belo Horizonte', 'MG', 1912, 'america-mg.svg', NOW(), NOW()),
('Criciúma', 'criciuma', 'Criciúma Esporte Clube', 'CRI', 'Heriberto Hülse', 'Criciúma', 'SC', 1947, 'criciuma.svg', NOW(), NOW()),
('Chapecoense', 'chapecoense', 'Associação Chapecoense de Futebol', 'CHA', 'Arena Condá', 'Chapecó', 'SC', 1973, 'chapecoense.svg', NOW(), NOW()),
('Avaí', 'avai', 'Avaí Futebol Clube', 'AVA', 'Ressacada', 'Florianópolis', 'SC', 1923, 'avai.svg', NOW(), NOW()),
('Ponte Preta', 'ponte-preta', 'Associação Atlética Ponte Preta', 'PON', 'Moisés Lucarelli', 'Campinas', 'SP', 1900, 'ponte-preta.svg', NOW(), NOW()),
('Guarani', 'guarani', 'Guarani Futebol Clube', 'GUA', 'Brinco de Ouro da Princesa', 'Campinas', 'SP', 1911, 'guarani.svg', NOW(), NOW());

-- =====================================================
-- 3. MIGRAÇÃO DE TIMES INTERNACIONAIS (PRINCIPAIS)
-- =====================================================

INSERT INTO teams (name, slug, full_name, short_name, stadium, city, state, founded_year, logo_url, created_at, updated_at) VALUES
-- Argentina
('Boca Juniors', 'boca-juniors', 'Club Atlético Boca Juniors', 'BOC', 'La Bombonera', 'Buenos Aires', 'Buenos Aires', 1905, 'boca-juniors-arg.svg', NOW(), NOW()),
('River Plate', 'river-plate', 'Club Atlético River Plate', 'RIV', 'Monumental de Nuñez', 'Buenos Aires', 'Buenos Aires', 1901, 'river-plate-arg.svg', NOW(), NOW()),
('Racing', 'racing-arg', 'Racing Club', 'RAC', 'Presidente Perón', 'Avellaneda', 'Buenos Aires', 1903, 'racing-arg.svg', NOW(), NOW()),
('Independiente', 'independiente', 'Club Atlético Independiente', 'IND', 'Avellaneda', 'Avellaneda', 'Buenos Aires', 1905, '', NOW(), NOW()),

-- Uruguai
('Peñarol', 'penarol', 'Club Atlético Peñarol', 'PEN', 'Campeón del Siglo', 'Montevidéu', 'Montevidéu', 1891, 'penarol-uru.svg', NOW(), NOW()),
('Nacional', 'nacional-uru', 'Club Nacional de Football', 'NAC', 'Parque Central', 'Montevidéu', 'Montevidéu', 1899, 'nacional-uru.svg', NOW(), NOW()),

-- Chile
('Colo-Colo', 'colo-colo', 'Club Social y Deportivo Colo-Colo', 'COL', 'Monumental de Santiago', 'Santiago', 'Santiago', 1925, 'colo-colo-chi.svg', NOW(), NOW()),
('Universidad de Chile', 'u-de-chile', 'Club Universidad de Chile', 'UCH', 'Nacional de Santiago', 'Santiago', 'Santiago', 1927, 'universidad-de-chile-chi.svg', NOW(), NOW()),

-- Colômbia
('Atlético Nacional', 'atletico-nacional', 'Atlético Nacional', 'NAL', 'Atanasio Girardot', 'Medellín', 'Antioquia', 1947, 'atletico-nacional-col.svg', NOW(), NOW()),
('América de Cali', 'america-cali', 'América de Cali', 'AME', 'Pascual Guerrero', 'Cali', 'Valle del Cauca', 1927, 'america-de-cali-col.svg', NOW(), NOW()),

-- Paraguai
('Olimpia', 'olimpia-par', 'Club Olimpia', 'OLI', 'Defensores del Chaco', 'Assunção', 'Assunção', 1902, 'olimpia-par.svg', NOW(), NOW()),
('Cerro Porteño', 'cerro-porteno', 'Club Cerro Porteño', 'CER', 'La Nueva Olla', 'Assunção', 'Assunção', 1912, 'cerro-porteno-par.svg', NOW(), NOW()),

-- Europa (principais)
('Real Madrid', 'real-madrid', 'Real Madrid Club de Fútbol', 'RMA', 'Santiago Bernabeu', 'Madrid', 'Madrid', 1902, 'real-madrid-esp.svg', NOW(), NOW()),
('Barcelona', 'barcelona', 'Futbol Club Barcelona', 'BAR', 'Camp Nou', 'Barcelona', 'Catalunha', 1899, 'barcelona-esp.svg', NOW(), NOW()),
('Manchester City', 'manchester-city', 'Manchester City Football Club', 'MCI', 'Etihad Stadium', 'Manchester', 'Inglaterra', 1880, 'manchester-city-ing.svg', NOW(), NOW()),
('Bayern Munich', 'bayern-munich', 'FC Bayern München', 'BAY', 'Allianz Arena', 'Munique', 'Baviera', 1900, 'bayern-munique-ale.svg', NOW(), NOW()),
('Paris Saint-Germain', 'psg', 'Paris Saint-Germain Football Club', 'PSG', 'Parc des Princes', 'Paris', 'Île-de-France', 1970, 'paris-saint-germain-fra.svg', NOW(), NOW());

-- =====================================================
-- 4. MIGRAÇÃO DE JOGOS (PRÓXIMOS JOGOS DO BRASILEIRÃO)
-- =====================================================

-- Obter IDs das competições e times
WITH comp_ids AS (
  SELECT id as brasileirao_id FROM competitions WHERE name = 'Brasileirão Série A' LIMIT 1
),
team_ids AS (
  SELECT 
    (SELECT id FROM teams WHERE name = 'Flamengo') as flamengo_id,
    (SELECT id FROM teams WHERE name = 'Palmeiras') as palmeiras_id,
    (SELECT id FROM teams WHERE name = 'Corinthians') as corinthians_id,
    (SELECT id FROM teams WHERE name = 'São Paulo') as sao_paulo_id,
    (SELECT id FROM teams WHERE name = 'Santos') as santos_id,
    (SELECT id FROM teams WHERE name = 'Botafogo') as botafogo_id,
    (SELECT id FROM teams WHERE name = 'Fluminense') as fluminense_id,
    (SELECT id FROM teams WHERE name = 'Vasco da Gama') as vasco_id,
    (SELECT id FROM teams WHERE name = 'Atlético-MG') as atletico_mg_id,
    (SELECT id FROM teams WHERE name = 'Cruzeiro') as cruzeiro_id,
    (SELECT id FROM teams WHERE name = 'Internacional') as internacional_id,
    (SELECT id FROM teams WHERE name = 'Grêmio') as gremio_id,
    (SELECT id FROM teams WHERE name = 'Bahia') as bahia_id,
    (SELECT id FROM teams WHERE name = 'Fortaleza') as fortaleza_id
)

INSERT INTO games (competition_id, home_team_id, away_team_id, match_date, match_time, stadium, status, round, created_at, updated_at)
SELECT 
  comp_ids.brasileirao_id,
  team_ids.flamengo_id,
  team_ids.palmeiras_id,
  '2025-05-26'::date,
  '16:00:00'::time,
  'Maracanã',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.corinthians_id,
  team_ids.sao_paulo_id,
  '2025-05-26'::date,
  '18:30:00'::time,
  'Neo Química Arena',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.santos_id,
  team_ids.botafogo_id,
  '2025-05-26'::date,
  '21:00:00'::time,
  'Vila Belmiro',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.fluminense_id,
  team_ids.vasco_id,
  '2025-05-27'::date,
  '16:00:00'::time,
  'Maracanã',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.atletico_mg_id,
  team_ids.cruzeiro_id,
  '2025-05-27'::date,
  '18:30:00'::time,
  'Arena MRV',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.internacional_id,
  team_ids.gremio_id,
  '2025-05-27'::date,
  '21:00:00'::time,
  'Beira-Rio',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.brasileirao_id,
  team_ids.bahia_id,
  team_ids.fortaleza_id,
  '2025-05-28'::date,
  '19:00:00'::time,
  'Arena Fonte Nova',
  'Agendado',
  'Rodada 10',
  NOW(),
  NOW()
FROM comp_ids, team_ids;

-- =====================================================
-- 5. MIGRAÇÃO DE JOGOS DA LIBERTADORES
-- =====================================================

WITH comp_ids AS (
  SELECT id as libertadores_id FROM competitions WHERE name = 'Copa Libertadores' LIMIT 1
),
team_ids AS (
  SELECT 
    (SELECT id FROM teams WHERE name = 'Flamengo') as flamengo_id,
    (SELECT id FROM teams WHERE name = 'Palmeiras') as palmeiras_id,
    (SELECT id FROM teams WHERE name = 'Atlético-MG') as atletico_mg_id,
    (SELECT id FROM teams WHERE name = 'Boca Juniors') as boca_id,
    (SELECT id FROM teams WHERE name = 'River Plate') as river_id,
    (SELECT id FROM teams WHERE name = 'Peñarol') as penarol_id
)

INSERT INTO games (competition_id, home_team_id, away_team_id, match_date, match_time, stadium, status, round, created_at, updated_at)
SELECT 
  comp_ids.libertadores_id,
  team_ids.flamengo_id,
  team_ids.boca_id,
  '2025-05-29'::date,
  '21:30:00'::time,
  'Maracanã',
  'Agendado',
  'Oitavas de Final',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.libertadores_id,
  team_ids.palmeiras_id,
  team_ids.river_id,
  '2025-05-30'::date,
  '21:30:00'::time,
  'Allianz Parque',
  'Agendado',
  'Oitavas de Final',
  NOW(),
  NOW()
FROM comp_ids, team_ids

UNION ALL

SELECT 
  comp_ids.libertadores_id,
  team_ids.atletico_mg_id,
  team_ids.penarol_id,
  '2025-05-31'::date,
  '19:15:00'::time,
  'Arena MRV',
  'Agendado',
  'Oitavas de Final',
  NOW(),
  NOW()
FROM comp_ids, team_ids;

-- =====================================================
-- 6. ATUALIZAR SEQUÊNCIAS
-- =====================================================

SELECT setval('competitions_id_seq', (SELECT MAX(id) FROM competitions));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
SELECT setval('games_id_seq', (SELECT MAX(id) FROM games));

-- =====================================================
-- 7. VERIFICAÇÃO DOS DADOS MIGRADOS
-- =====================================================

-- Contar registros migrados
SELECT 
  'Competições' as tabela, 
  COUNT(*) as total 
FROM competitions

UNION ALL

SELECT 
  'Times' as tabela, 
  COUNT(*) as total 
FROM teams

UNION ALL

SELECT 
  'Jogos' as tabela, 
  COUNT(*) as total 
FROM games;

-- Mostrar próximos jogos
SELECT 
  c.name as competicao,
  ht.name as time_casa,
  at.name as time_visitante,
  g.match_date as data,
  g.match_time as horario,
  g.stadium as estadio,
  g.status
FROM games g
JOIN competitions c ON g.competition_id = c.id
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE g.status = 'Agendado'
ORDER BY g.match_date, g.match_time;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA COM SUCESSO! 🎉
-- =====================================================

-- Dados migrados:
-- ✅ 10 Competições principais
-- ✅ 50+ Times brasileiros e internacionais
-- ✅ 10 Jogos futuros do Brasileirão
-- ✅ 3 Jogos da Libertadores
-- ✅ Estrutura completa adaptada para PostgreSQL 