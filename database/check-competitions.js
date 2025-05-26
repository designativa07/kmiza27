const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando competições existentes...\n');
    
    const competitions = await client.query(`
      SELECT 
        c.name,
        c.country,
        c.season,
        COUNT(m.id) as matches_count
      FROM competitions c
      LEFT JOIN matches m ON c.id = m.competition_id
      GROUP BY c.id, c.name, c.country, c.season
      ORDER BY c.name
    `);
    
    console.log('📋 Competições no banco:');
    console.log('=====================================');
    
    competitions.rows.forEach(comp => {
      console.log(`✅ ${comp.name}`);
      console.log(`   País: ${comp.country || 'N/A'}`);
      console.log(`   Temporada: ${comp.season || 'N/A'}`);
      console.log(`   Jogos: ${comp.matches_count}`);
      console.log('');
    });
    
    console.log(`📊 Total de competições: ${competitions.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCompetitions(); 