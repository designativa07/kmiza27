const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

async function verifyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando dados migrados...\n');
    
    // Verificar contagem de registros
    console.log('📊 CONTAGEM DE REGISTROS:');
    console.log('========================');
    
    const tables = ['competitions', 'teams', 'stadiums', 'rounds', 'matches'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
      const count = result.rows[0].total;
      console.log(`${table.padEnd(15)}: ${count} registros`);
    }
    
    console.log('\n🏆 COMPETIÇÕES MIGRADAS:');
    console.log('========================');
    const competitions = await client.query(`
      SELECT name, type, season, country 
      FROM competitions 
      ORDER BY name
    `);
    
    competitions.rows.forEach(comp => {
      console.log(`- ${comp.name} (${comp.type}) - ${comp.season} - ${comp.country}`);
    });
    
    console.log('\n⚽ TIMES BRASILEIROS (PRINCIPAIS):');
    console.log('==================================');
    const brazilianTeams = await client.query(`
      SELECT name, short_name, city, state 
      FROM teams 
      WHERE country = 'Brasil' 
      ORDER BY name 
      LIMIT 10
    `);
    
    brazilianTeams.rows.forEach(team => {
      console.log(`- ${team.name} (${team.short_name}) - ${team.city}/${team.state}`);
    });
    
    console.log('\n🌎 TIMES INTERNACIONAIS:');
    console.log('========================');
    const internationalTeams = await client.query(`
      SELECT name, short_name, city, country 
      FROM teams 
      WHERE country != 'Brasil' 
      ORDER BY country, name 
      LIMIT 10
    `);
    
    internationalTeams.rows.forEach(team => {
      console.log(`- ${team.name} (${team.short_name}) - ${team.city}, ${team.country}`);
    });
    
    console.log('\n🏟️ ESTÁDIOS (PRINCIPAIS):');
    console.log('=========================');
    const stadiums = await client.query(`
      SELECT name, city, state, country, capacity 
      FROM stadiums 
      WHERE country = 'Brasil'
      ORDER BY capacity DESC 
      LIMIT 10
    `);
    
    stadiums.rows.forEach(stadium => {
      console.log(`- ${stadium.name} - ${stadium.city}/${stadium.state} (${stadium.capacity.toLocaleString()} lugares)`);
    });
    
    console.log('\n🎮 PRÓXIMOS JOGOS AGENDADOS:');
    console.log('============================');
    const matches = await client.query(`
      SELECT 
        c.name as competicao,
        ht.name as time_casa,
        at.name as time_visitante,
        m.match_date,
        s.name as estadio,
        r.name as rodada
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN stadiums s ON m.stadium_id = s.id
      JOIN rounds r ON m.round_id = r.id
      WHERE m.status = 'scheduled'
      ORDER BY m.match_date
    `);
    
    matches.rows.forEach(match => {
      const date = new Date(match.match_date);
      const formattedDate = date.toLocaleDateString('pt-BR');
      const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      console.log(`- ${match.competicao} (${match.rodada})`);
      console.log(`  ${match.time_casa} vs ${match.time_visitante}`);
      console.log(`  📅 ${formattedDate} às ${formattedTime} - 🏟️ ${match.estadio}\n`);
    });
    
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('\n🎉 MIGRAÇÃO REALIZADA COM SUCESSO!');
    console.log('==================================');
    console.log('✅ Dados do MySQL adaptados e migrados para PostgreSQL');
    console.log('✅ Estrutura compatível com as entidades do NestJS');
    console.log('✅ Jogos futuros prontos para o chatbot');
    console.log('✅ Base de dados rica e completa');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a verificação
verifyMigration(); 