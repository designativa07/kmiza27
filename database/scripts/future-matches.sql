-- Inserir jogos futuros para teste do chatbot
-- Data: próximos 30 dias

-- Buscar IDs dos times principais
DO $$
DECLARE
    flamengo_id INTEGER;
    palmeiras_id INTEGER;
    corinthians_id INTEGER;
    sao_paulo_id INTEGER;
    santos_id INTEGER;
    fluminense_id INTEGER;
    vasco_id INTEGER;
    botafogo_id INTEGER;
    brasileirao_id INTEGER;
    maracana_id INTEGER;
    allianz_id INTEGER;
    round_id INTEGER;
BEGIN
    -- Buscar IDs dos times
    SELECT id INTO flamengo_id FROM teams WHERE slug = 'flamengo';
    SELECT id INTO palmeiras_id FROM teams WHERE slug = 'palmeiras';
    SELECT id INTO corinthians_id FROM teams WHERE slug = 'corinthians';
    SELECT id INTO sao_paulo_id FROM teams WHERE slug = 'sao-paulo';
    SELECT id INTO santos_id FROM teams WHERE slug = 'santos';
    SELECT id INTO fluminense_id FROM teams WHERE slug = 'fluminense';
    SELECT id INTO vasco_id FROM teams WHERE slug = 'vasco';
    SELECT id INTO botafogo_id FROM teams WHERE slug = 'botafogo';
    
    -- Buscar ID da competição
    SELECT id INTO brasileirao_id FROM competitions WHERE slug = 'brasileirao-serie-a';
    
    -- Buscar IDs dos estádios
    SELECT id INTO maracana_id FROM stadiums WHERE name LIKE '%Maracanã%' LIMIT 1;
    SELECT id INTO allianz_id FROM stadiums WHERE name LIKE '%Allianz%' LIMIT 1;
    
    -- Buscar ou criar uma rodada
    SELECT id INTO round_id FROM rounds WHERE name = 'Rodada 35' AND competition_id = brasileirao_id LIMIT 1;
    IF round_id IS NULL THEN
        INSERT INTO rounds (competition_id, name, round_number, start_date, end_date)
        VALUES (brasileirao_id, 'Rodada 35', 35, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
        RETURNING id INTO round_id;
    END IF;
    
    -- Inserir jogos futuros
    
    -- Flamengo x Palmeiras (amanhã)
    INSERT INTO matches (
        home_team_id, away_team_id, competition_id, stadium_id, round_id,
        match_date, status, broadcast_channels
    ) VALUES (
        flamengo_id, palmeiras_id, brasileirao_id, maracana_id, round_id,
        CURRENT_DATE + INTERVAL '1 day' + TIME '16:00:00',
        'scheduled',
        '["Globo", "SporTV", "Premiere"]'::jsonb
    );
    
    -- Palmeiras x Corinthians (em 3 dias)
    INSERT INTO matches (
        home_team_id, away_team_id, competition_id, stadium_id, round_id,
        match_date, status, broadcast_channels
    ) VALUES (
        palmeiras_id, corinthians_id, brasileirao_id, allianz_id, round_id,
        CURRENT_DATE + INTERVAL '3 days' + TIME '18:30:00',
        'scheduled',
        '["SporTV", "Premiere"]'::jsonb
    );
    
    -- Flamengo x Fluminense (em 7 dias)
    INSERT INTO matches (
        home_team_id, away_team_id, competition_id, stadium_id, round_id,
        match_date, status, broadcast_channels
    ) VALUES (
        flamengo_id, fluminense_id, brasileirao_id, maracana_id, round_id,
        CURRENT_DATE + INTERVAL '7 days' + TIME '20:00:00',
        'scheduled',
        '["Globo", "SporTV"]'::jsonb
    );
    
    -- São Paulo x Santos (em 10 dias)
    INSERT INTO matches (
        home_team_id, away_team_id, competition_id, stadium_id, round_id,
        match_date, status, broadcast_channels
    ) VALUES (
        sao_paulo_id, santos_id, brasileirao_id, NULL, round_id,
        CURRENT_DATE + INTERVAL '10 days' + TIME '16:00:00',
        'scheduled',
        '["Premiere"]'::jsonb
    );
    
    -- Vasco x Botafogo (em 14 dias)
    INSERT INTO matches (
        home_team_id, away_team_id, competition_id, stadium_id, round_id,
        match_date, status, broadcast_channels
    ) VALUES (
        vasco_id, botafogo_id, brasileirao_id, NULL, round_id,
        CURRENT_DATE + INTERVAL '14 days' + TIME '19:00:00',
        'scheduled',
        '["SporTV"]'::jsonb
    );
    
    RAISE NOTICE 'Jogos futuros inseridos com sucesso!';
END $$; 