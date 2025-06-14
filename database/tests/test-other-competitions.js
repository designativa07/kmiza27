const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function testOtherCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testando consultas das outras competições...\n');
    
    // Teste 1: Jogos da Copa Libertadores
    console.log('🏆 COPA LIBERTADORES:');
    console.log('===================');
    const libertadores = await client.query(`
      SELECT 
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.status,
        m.home_score,
        m.away_score,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Copa Libertadores'
      ORDER BY m.match_date
    `);
    
    libertadores.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const score = match.status === 'finished' ? `${match.home_score} x ${match.away_score}` : 'vs';
      console.log(`📅 ${date} ${time} - ${match.home_team} ${score} ${match.away_team} (${match.stadium})`);
    });
    
    // Teste 2: Jogos da Copa Sul-Americana
    console.log('\n🥈 COPA SUL-AMERICANA:');
    console.log('====================');
    const sulamericana = await client.query(`
      SELECT 
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.status,
        m.home_score,
        m.away_score,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Copa Sul-Americana'
      ORDER BY m.match_date
    `);
    
    sulamericana.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const score = match.status === 'finished' ? `${match.home_score} x ${match.away_score}` : 'vs';
      console.log(`📅 ${date} ${time} - ${match.home_team} ${score} ${match.away_team} (${match.stadium})`);
    });
    
    // Teste 3: Jogos da Copa do Brasil
    console.log('\n🏆 COPA DO BRASIL:');
    console.log('================');
    const copaBrasil = await client.query(`
      SELECT 
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.status,
        m.home_score,
        m.away_score,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Copa do Brasil'
      ORDER BY m.match_date
    `);
    
    copaBrasil.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const score = match.status === 'finished' ? `${match.home_score} x ${match.away_score}` : 'vs';
      console.log(`📅 ${date} ${time} - ${match.home_team} ${score} ${match.away_team} (${match.stadium})`);
    });
    
    // Teste 4: Jogos do Brasileirão Série B
    console.log('\n⚽ BRASILEIRÃO SÉRIE B:');
    console.log('=====================');
    const serieB = await client.query(`
      SELECT 
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.status,
        m.home_score,
        m.away_score,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Brasileirão Série B'
      ORDER BY m.match_date
    `);
    
    serieB.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const score = match.status === 'finished' ? `${match.home_score} x ${match.away_score}` : 'vs';
      console.log(`📅 ${date} ${time} - ${match.home_team} ${score} ${match.away_team} (${match.stadium})`);
    });
    
    // Teste 5: Próximos jogos de todas as competições
    console.log('\n📅 PRÓXIMOS JOGOS (TODAS AS COMPETIÇÕES):');
    console.log('=======================================');
    const proximosJogos = await client.query(`
      SELECT 
        c.name as competition,
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE m.status = 'scheduled' AND m.match_date > NOW()
      ORDER BY m.match_date
      LIMIT 10
    `);
    
    proximosJogos.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      console.log(`📅 ${date} ${time} - ${match.home_team} vs ${match.away_team} (${match.competition}) - ${match.stadium}`);
    });
    
    // Teste 6: Estatísticas gerais
    console.log('\n📊 ESTATÍSTICAS GERAIS:');
    console.log('=====================');
    const stats = await client.query(`
      SELECT 
        c.name as competition,
        COUNT(m.id) as total_matches,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finished_matches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduled_matches
      FROM competitions c
      LEFT JOIN matches m ON c.id = m.competition_id
      GROUP BY c.id, c.name
      HAVING COUNT(m.id) > 0
      ORDER BY total_matches DESC
    `);
    
    stats.rows.forEach(stat => {
      console.log(`🏆 ${stat.competition}:`);
      console.log(`   Total: ${stat.total_matches} jogos`);
      console.log(`   Finalizados: ${stat.finished_matches} jogos`);
      console.log(`   Agendados: ${stat.scheduled_matches} jogos`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar os testes
testOtherCompetitions().catch(console.error); 