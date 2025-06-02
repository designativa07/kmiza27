const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function debugSerieB() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugando problema da Série B...\n');
    
    // 1. Verificar competições
    const competitions = await client.query(`
      SELECT id, name, slug, type, season 
      FROM competitions 
      WHERE name ILIKE '%série%' OR name ILIKE '%brasileir%'
      ORDER BY name
    `);
    
    console.log('📋 Competições encontradas:');
    competitions.rows.forEach(comp => {
      console.log(`ID: ${comp.id}, Nome: "${comp.name}", Slug: "${comp.slug}", Tipo: ${comp.type}, Temporada: ${comp.season}`);
    });
    
    // 2. Verificar se existe Rodada 13
    const rounds = await client.query(`
      SELECT r.id, r.name, r.competition_id, c.name as competition_name
      FROM rounds r
      JOIN competitions c ON r.competition_id = c.id
      WHERE r.name ILIKE '%13%' OR r.name = '13'
      ORDER BY c.name, r.name
    `);
    
    console.log('\n🔢 Rodadas 13 encontradas:');
    if (rounds.rows.length === 0) {
      console.log('❌ Nenhuma Rodada 13 encontrada!');
    } else {
      rounds.rows.forEach(round => {
        console.log(`ID: ${round.id}, Nome: "${round.name}", Competição: ${round.competition_name}`);
      });
    }
    
    // 3. Verificar todas as rodadas do Brasileirão
    const brasileiraoRounds = await client.query(`
      SELECT r.id, r.name, r.competition_id, c.name as competition_name
      FROM rounds r
      JOIN competitions c ON r.competition_id = c.id
      WHERE c.name ILIKE '%brasileir%'
      ORDER BY c.name, CAST(REGEXP_REPLACE(r.name, '[^0-9]', '', 'g') AS INTEGER)
    `);
    
    console.log('\n⚽ Rodadas do Brasileirão:');
    let currentComp = '';
    brasileiraoRounds.rows.forEach(round => {
      if (round.competition_name !== currentComp) {
        console.log(`\n📋 ${round.competition_name}:`);
        currentComp = round.competition_name;
      }
      console.log(`   ID: ${round.id}, Nome: "${round.name}"`);
    });
    
    // 4. Verificar partidas da Série B
    const serieBMatches = await client.query(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        r.name as round_name,
        m.match_date,
        m.status,
        m.group_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE c.name ILIKE '%série b%'
      ORDER BY m.match_date
      LIMIT 10
    `);
    
    console.log('\n🏆 Primeiras 10 partidas da Série B:');
    serieBMatches.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      console.log(`${date} - ${match.home_team} vs ${match.away_team} (Rodada: ${match.round_name || 'N/A'}, Grupo: ${match.group_name || 'N/A'})`);
    });
    
    // 5. Verificar classificação da Série B
    const serieBStandings = await client.query(`
      SELECT 
        t.name as team_name,
        ct.points,
        ct.played,
        ct.won,
        ct.drawn,
        ct.lost,
        ct.goal_difference,
        ct.group_name
      FROM competition_teams ct
      JOIN teams t ON ct.team_id = t.id
      JOIN competitions c ON ct.competition_id = c.id
      WHERE c.name ILIKE '%série b%'
      ORDER BY ct.points DESC, ct.goal_difference DESC
      LIMIT 10
    `);
    
    console.log('\n📊 Top 10 da Série B (dados estáticos):');
    serieBStandings.rows.forEach((team, index) => {
      console.log(`${index + 1}º ${team.team_name} - ${team.points} pts (J:${team.played} V:${team.won} E:${team.drawn} D:${team.lost} SG:${team.goal_difference}) Grupo: ${team.group_name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugSerieB().catch(console.error); 