const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function createMissingRounds() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Criando rodadas faltantes do Brasileirão...');
    
    // Buscar ID da competição Brasileirão Série A
    const competition = await client.query(`
      SELECT id FROM competitions WHERE name = 'Brasileirão Série A'
    `);
    
    if (competition.rows.length === 0) {
      console.error('❌ Competição Brasileirão Série A não encontrada!');
      return;
    }
    
    const competitionId = competition.rows[0].id;
    console.log(`✅ Competição encontrada: ID ${competitionId}`);
    
    // Verificar quais rodadas já existem
    const existingRounds = await client.query(`
      SELECT CAST(SUBSTRING(name FROM '[0-9]+') AS INTEGER) as round_num
      FROM rounds 
      WHERE name ~ '^Rodada [0-9]+$' AND competition_id = $1
      ORDER BY round_num
    `, [competitionId]);
    
    const existingRoundNumbers = existingRounds.rows.map(row => row.round_num);
    console.log(`📋 Rodadas existentes: ${existingRoundNumbers.join(', ')}`);
    
    // Criar rodadas faltantes (1-38)
    let createdCount = 0;
    
    for (let roundNum = 1; roundNum <= 38; roundNum++) {
      if (!existingRoundNumbers.includes(roundNum)) {
        try {
          await client.query(`
            INSERT INTO rounds (name, competition_id, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
          `, [`Rodada ${roundNum}`, competitionId]);
          
          console.log(`✅ Criada: Rodada ${roundNum}`);
          createdCount++;
        } catch (error) {
          console.error(`❌ Erro ao criar Rodada ${roundNum}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`✅ Rodadas criadas: ${createdCount}`);
    console.log(`📋 Rodadas já existentes: ${existingRoundNumbers.length}`);
    console.log(`🎯 Total de rodadas: ${createdCount + existingRoundNumbers.length}`);
    
    // Verificar resultado final
    const finalRounds = await client.query(`
      SELECT COUNT(*) as total 
      FROM rounds 
      WHERE competition_id = $1 AND name ~ '^Rodada [0-9]+$'
    `, [competitionId]);
    
    console.log(`\n🏆 Total final de rodadas no banco: ${finalRounds.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro durante a criação das rodadas:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingRounds(); 