const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkRounds() {
  const client = await pool.connect();
  
  try {
    const rounds = await client.query(`
      SELECT DISTINCT r.name 
      FROM rounds r 
      JOIN matches m ON r.id = m.round_id 
      ORDER BY r.name
    `);
    
    console.log('Rodadas com jogos importados:');
    rounds.rows.forEach(row => console.log(`- ${row.name}`));
    
    const totalMatches = await client.query('SELECT COUNT(*) FROM matches');
    console.log(`\nTotal de jogos: ${totalMatches.rows[0].count}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRounds(); 