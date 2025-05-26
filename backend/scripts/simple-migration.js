const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

async function executeMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração simples...\n');
    
    // 1. Limpar dados existentes
    console.log('🗑️ Limpando dados existentes...');
    await client.query('TRUNCATE TABLE matches CASCADE');
    await client.query('TRUNCATE TABLE competition_teams CASCADE');
    await client.query('TRUNCATE TABLE competitions CASCADE');
    await client.query('TRUNCATE TABLE teams CASCADE');
    await client.query('TRUNCATE TABLE rounds CASCADE');
    await client.query('TRUNCATE TABLE stadiums CASCADE');
    
    // 2. Inserir competições
    console.log('🏆 Inserindo competições...');
    await client.query(`
      INSERT INTO competitions (name, slug, type, season, country, logo_url, is_active, created_at, updated_at) VALUES
      ('Brasileirão Série A', 'brasileirao-serie-a', 'pontos_corridos', '2025', 'Brasil', '', true, NOW(), NOW()),
      ('Copa do Brasil', 'copa-do-brasil', 'copa', '2025', 'Brasil', '', true, NOW(), NOW()),
      ('Copa Libertadores', 'copa-libertadores', 'grupos_e_mata_mata', '2025', 'América do Sul', 'https://upload.wikimedia.org/wikipedia/pt/9/95/Conmebol_Libertadores_logo.svg', true, NOW(), NOW()),
      ('Copa Sul-Americana', 'copa-sul-americana', 'grupos_e_mata_mata', '2025', 'América do Sul', '', true, NOW(), NOW()),
      ('Brasileirão Série B', 'brasileirao-serie-b', 'pontos_corridos', '2025', 'Brasil', '', true, NOW(), NOW())
    `);
    
    // 3. Inserir estádios (sem updated_at)
    console.log('🏟️ Inserindo estádios...');
    await client.query(`
      INSERT INTO stadiums (name, city, state, country, capacity, created_at) VALUES
      ('Maracanã', 'Rio de Janeiro', 'RJ', 'Brasil', 78838, NOW()),
      ('Allianz Parque', 'São Paulo', 'SP', 'Brasil', 43713, NOW()),
      ('Neo Química Arena', 'São Paulo', 'SP', 'Brasil', 49205, NOW()),
      ('MorumBIS', 'São Paulo', 'SP', 'Brasil', 67052, NOW()),
      ('Vila Belmiro', 'Santos', 'SP', 'Brasil', 16068, NOW()),
      ('Estádio Nilton Santos', 'Rio de Janeiro', 'RJ', 'Brasil', 46831, NOW()),
      ('Arena MRV', 'Belo Horizonte', 'MG', 'Brasil', 46000, NOW()),
      ('Beira-Rio', 'Porto Alegre', 'RS', 'Brasil', 50128, NOW()),
      ('Arena Fonte Nova', 'Salvador', 'BA', 'Brasil', 47907, NOW()),
      ('Castelão', 'Fortaleza', 'CE', 'Brasil', 63903, NOW())
    `);
    
    // 4. Inserir times brasileiros
    console.log('⚽ Inserindo times brasileiros...');
    await client.query(`
      INSERT INTO teams (name, slug, full_name, short_name, city, state, country, founded_year, logo_url, created_at, updated_at) VALUES
      ('Flamengo', 'flamengo', 'Clube de Regatas do Flamengo', 'FLA', 'Rio de Janeiro', 'RJ', 'Brasil', 1895, '/kmiza27/img/escudos/flamengo.svg', NOW(), NOW()),
      ('Palmeiras', 'palmeiras', 'Sociedade Esportiva Palmeiras', 'PAL', 'São Paulo', 'SP', 'Brasil', 1914, '/kmiza27/img/escudos/palmeiras.svg', NOW(), NOW()),
      ('Corinthians', 'corinthians', 'Sport Club Corinthians Paulista', 'COR', 'São Paulo', 'SP', 'Brasil', 1910, '/kmiza27/img/escudos/corinthians.svg', NOW(), NOW()),
      ('São Paulo', 'sao-paulo', 'São Paulo Futebol Clube', 'SAO', 'São Paulo', 'SP', 'Brasil', 1930, '/kmiza27/img/escudos/sao-paulo.svg', NOW(), NOW()),
      ('Santos', 'santos', 'Santos Futebol Clube', 'SAN', 'Santos', 'SP', 'Brasil', 1912, '/kmiza27/img/escudos/santos.svg', NOW(), NOW()),
      ('Botafogo', 'botafogo', 'Botafogo de Futebol e Regatas', 'BOT', 'Rio de Janeiro', 'RJ', 'Brasil', 1904, '/kmiza27/img/escudos/botafogo.svg', NOW(), NOW()),
      ('Fluminense', 'fluminense', 'Fluminense Football Club', 'FLU', 'Rio de Janeiro', 'RJ', 'Brasil', 1902, '/kmiza27/img/escudos/fluminense.svg', NOW(), NOW()),
      ('Vasco da Gama', 'vasco', 'Club de Regatas Vasco da Gama', 'VAS', 'Rio de Janeiro', 'RJ', 'Brasil', 1898, 'vasco-da-gama.svg', NOW(), NOW()),
      ('Atlético-MG', 'atletico-mg', 'Clube Atlético Mineiro', 'CAM', 'Belo Horizonte', 'MG', 'Brasil', 1908, '/kmiza27/img/escudos/atletico-mg.svg', NOW(), NOW()),
      ('Cruzeiro', 'cruzeiro', 'Cruzeiro Esporte Clube', 'CRU', 'Belo Horizonte', 'MG', 'Brasil', 1921, '/kmiza27/img/escudos/cruzeiro.svg', NOW(), NOW()),
      ('Internacional', 'internacional', 'Sport Club Internacional', 'INT', 'Porto Alegre', 'RS', 'Brasil', 1909, '/kmiza27/img/escudos/internacional.svg', NOW(), NOW()),
      ('Grêmio', 'gremio', 'Grêmio Foot-Ball Porto Alegrense', 'GRE', 'Porto Alegre', 'RS', 'Brasil', 1903, '/kmiza27/img/escudos/gremio.svg', NOW(), NOW()),
      ('Bahia', 'bahia', 'Esporte Clube Bahia', 'BAH', 'Salvador', 'BA', 'Brasil', 1931, '/kmiza27/img/escudos/bahia.svg', NOW(), NOW()),
      ('Fortaleza', 'fortaleza', 'Fortaleza Esporte Clube', 'FOR', 'Fortaleza', 'CE', 'Brasil', 1918, '/kmiza27/img/escudos/fortaleza.svg', NOW(), NOW())
    `);
    
    // 5. Inserir times internacionais
    console.log('🌎 Inserindo times internacionais...');
    await client.query(`
      INSERT INTO teams (name, slug, full_name, short_name, city, state, country, founded_year, logo_url, created_at, updated_at) VALUES
      ('Boca Juniors', 'boca-juniors', 'Club Atlético Boca Juniors', 'BOC', 'Buenos Aires', 'Buenos Aires', 'Argentina', 1905, 'boca-juniors-arg.svg', NOW(), NOW()),
      ('River Plate', 'river-plate', 'Club Atlético River Plate', 'RIV', 'Buenos Aires', 'Buenos Aires', 'Argentina', 1901, 'river-plate-arg.svg', NOW(), NOW()),
      ('Peñarol', 'penarol', 'Club Atlético Peñarol', 'PEN', 'Montevidéu', 'Montevidéu', 'Uruguai', 1891, 'penarol-uru.svg', NOW(), NOW()),
      ('Real Madrid', 'real-madrid', 'Real Madrid Club de Fútbol', 'RMA', 'Madrid', 'Madrid', 'Espanha', 1902, 'real-madrid-esp.svg', NOW(), NOW()),
      ('Barcelona', 'barcelona', 'Futbol Club Barcelona', 'BAR', 'Barcelona', 'Catalunha', 'Espanha', 1899, 'barcelona-esp.svg', NOW(), NOW())
    `);
    
    // 6. Inserir rounds (sem updated_at)
    console.log('📅 Inserindo rounds...');
    const brasileiraoResult = await client.query("SELECT id FROM competitions WHERE name = 'Brasileirão Série A'");
    const libertadoresResult = await client.query("SELECT id FROM competitions WHERE name = 'Copa Libertadores'");
    
    if (brasileiraoResult.rows.length > 0) {
      await client.query(`
        INSERT INTO rounds (competition_id, name, round_number, start_date, end_date, created_at) VALUES
        ($1, 'Rodada 10', 10, '2025-05-26', '2025-05-28', NOW())
      `, [brasileiraoResult.rows[0].id]);
    }
    
    if (libertadoresResult.rows.length > 0) {
      await client.query(`
        INSERT INTO rounds (competition_id, name, round_number, start_date, end_date, created_at) VALUES
        ($1, 'Oitavas de Final', 1, '2025-05-29', '2025-05-31', NOW())
      `, [libertadoresResult.rows[0].id]);
    }
    
    // 7. Inserir jogos
    console.log('🎮 Inserindo jogos...');
    
    // Buscar IDs necessários
    const flamengoResult = await client.query("SELECT id FROM teams WHERE name = 'Flamengo'");
    const palmeirasResult = await client.query("SELECT id FROM teams WHERE name = 'Palmeiras'");
    const corinthiansResult = await client.query("SELECT id FROM teams WHERE name = 'Corinthians'");
    const saoPauloResult = await client.query("SELECT id FROM teams WHERE name = 'São Paulo'");
    const maracanaResult = await client.query("SELECT id FROM stadiums WHERE name = 'Maracanã'");
    const corinthiansStadiumResult = await client.query("SELECT id FROM stadiums WHERE name = 'Neo Química Arena'");
    const roundResult = await client.query(`
      SELECT r.id FROM rounds r 
      JOIN competitions c ON r.competition_id = c.id 
      WHERE c.name = 'Brasileirão Série A' AND r.name = 'Rodada 10'
    `);
    
    if (flamengoResult.rows.length > 0 && palmeirasResult.rows.length > 0 && maracanaResult.rows.length > 0 && roundResult.rows.length > 0) {
      await client.query(`
        INSERT INTO matches (competition_id, round_id, home_team_id, away_team_id, stadium_id, match_date, status, created_at, updated_at) VALUES
        ($1, $2, $3, $4, $5, '2025-05-26 16:00:00', 'scheduled', NOW(), NOW())
      `, [brasileiraoResult.rows[0].id, roundResult.rows[0].id, flamengoResult.rows[0].id, palmeirasResult.rows[0].id, maracanaResult.rows[0].id]);
    }
    
    if (corinthiansResult.rows.length > 0 && saoPauloResult.rows.length > 0 && corinthiansStadiumResult.rows.length > 0 && roundResult.rows.length > 0) {
      await client.query(`
        INSERT INTO matches (competition_id, round_id, home_team_id, away_team_id, stadium_id, match_date, status, created_at, updated_at) VALUES
        ($1, $2, $3, $4, $5, '2025-05-26 18:30:00', 'scheduled', NOW(), NOW())
      `, [brasileiraoResult.rows[0].id, roundResult.rows[0].id, corinthiansResult.rows[0].id, saoPauloResult.rows[0].id, corinthiansStadiumResult.rows[0].id]);
    }
    
    // 8. Verificar dados inseridos
    console.log('\n📊 Verificando dados inseridos...');
    const competitionsCount = await client.query('SELECT COUNT(*) FROM competitions');
    const teamsCount = await client.query('SELECT COUNT(*) FROM teams');
    const stadiumsCount = await client.query('SELECT COUNT(*) FROM stadiums');
    const roundsCount = await client.query('SELECT COUNT(*) FROM rounds');
    const matchesCount = await client.query('SELECT COUNT(*) FROM matches');
    
    console.log(`✅ Competições: ${competitionsCount.rows[0].count}`);
    console.log(`✅ Times: ${teamsCount.rows[0].count}`);
    console.log(`✅ Estádios: ${stadiumsCount.rows[0].count}`);
    console.log(`✅ Rounds: ${roundsCount.rows[0].count}`);
    console.log(`✅ Jogos: ${matchesCount.rows[0].count}`);
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a migração
executeMigration(); 