const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkRoundAssociation() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(round_id) as matches_with_round,
        COUNT(*) - COUNT(round_id) as matches_without_round
      FROM matches
    `);
    
    console.log('📊 Associação de jogos com rodadas:');
    console.log(`Total de jogos: ${result.rows[0].total_matches}`);
    console.log(`Jogos com rodada: ${result.rows[0].matches_with_round}`);
    console.log(`Jogos sem rodada: ${result.rows[0].matches_without_round}`);
    
    // Verificar quantas rodadas existem
    const rounds = await client.query('SELECT COUNT(*) as total FROM rounds');
    console.log(`\nTotal de rodadas: ${rounds.rows[0].total}`);
    
    // Verificar se as rodadas 11-38 existem
    const missingRounds = await client.query(`
      SELECT generate_series(11, 38) as round_num
      EXCEPT
      SELECT CAST(SUBSTRING(name FROM '[0-9]+') AS INTEGER) as round_num
      FROM rounds 
      WHERE name ~ '^Rodada [0-9]+$'
      ORDER BY round_num
    `);
    
    if (missingRounds.rows.length > 0) {
      console.log('\n⚠️ Rodadas não encontradas no banco:');
      missingRounds.rows.forEach(row => {
        console.log(`  - Rodada ${row.round_num}`);
      });
    } else {
      console.log('\n✅ Todas as rodadas 1-38 existem no banco');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRoundAssociation(); 