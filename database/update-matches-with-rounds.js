const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function updateMatchesWithRounds() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Atualizando jogos com associação às rodadas...');
    
    // Buscar ID da competição Brasileirão Série A
    const competition = await client.query(`
      SELECT id FROM competitions WHERE name = 'Brasileirão Série A'
    `);
    
    const competitionId = competition.rows[0].id;
    
    // Buscar todas as rodadas
    const rounds = await client.query(`
      SELECT id, name FROM rounds 
      WHERE competition_id = $1 AND name ~ '^Rodada [0-9]+$'
      ORDER BY CAST(SUBSTRING(name FROM '[0-9]+') AS INTEGER)
    `, [competitionId]);
    
    const roundMap = {};
    rounds.rows.forEach(round => {
      roundMap[round.name] = round.id;
    });
    
    console.log(`✅ Encontradas ${rounds.rows.length} rodadas`);
    
    // Buscar jogos sem round_id
    const matchesWithoutRound = await client.query(`
      SELECT id, match_date 
      FROM matches 
      WHERE round_id IS NULL AND competition_id = $1
      ORDER BY match_date
    `, [competitionId]);
    
    console.log(`📋 Encontrados ${matchesWithoutRound.rows.length} jogos sem rodada associada`);
    
    if (matchesWithoutRound.rows.length === 0) {
      console.log('✅ Todos os jogos já têm rodadas associadas!');
      return;
    }
    
    // Distribuir jogos pelas rodadas (10 jogos por rodada)
    let updatedCount = 0;
    let currentRound = 11; // Começar da rodada 11 (já temos rodada 10)
    let matchesInCurrentRound = 0;
    
    for (const match of matchesWithoutRound.rows) {
      if (matchesInCurrentRound >= 10) {
        currentRound++;
        matchesInCurrentRound = 0;
      }
      
      const roundName = `Rodada ${currentRound}`;
      const roundId = roundMap[roundName];
      
      if (roundId) {
        try {
          await client.query(`
            UPDATE matches 
            SET round_id = $1 
            WHERE id = $2
          `, [roundId, match.id]);
          
          updatedCount++;
          matchesInCurrentRound++;
          
          if (updatedCount % 50 === 0) {
            console.log(`✅ ${updatedCount} jogos atualizados...`);
          }
        } catch (error) {
          console.error(`❌ Erro ao atualizar jogo ${match.id}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Resumo da atualização:`);
    console.log(`✅ Jogos atualizados: ${updatedCount}`);
    
    // Verificar resultado final
    const finalCheck = await client.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(round_id) as matches_with_round,
        COUNT(*) - COUNT(round_id) as matches_without_round
      FROM matches
      WHERE competition_id = $1
    `, [competitionId]);
    
    console.log(`\n🎯 Estado final:`);
    console.log(`Total de jogos: ${finalCheck.rows[0].total_matches}`);
    console.log(`Jogos com rodada: ${finalCheck.rows[0].matches_with_round}`);
    console.log(`Jogos sem rodada: ${finalCheck.rows[0].matches_without_round}`);
    
    // Mostrar distribuição por rodada
    const roundDistribution = await client.query(`
      SELECT 
        r.name as round_name,
        COUNT(m.id) as matches_count
      FROM rounds r 
      LEFT JOIN matches m ON r.id = m.round_id 
      WHERE r.competition_id = $1 AND r.name ~ '^Rodada [0-9]+$'
      GROUP BY r.id, r.name 
      ORDER BY CAST(SUBSTRING(r.name FROM '[0-9]+') AS INTEGER)
    `, [competitionId]);
    
    console.log(`\n📋 Distribuição por rodada:`);
    roundDistribution.rows.forEach(round => {
      const count = parseInt(round.matches_count);
      if (count > 0) {
        console.log(`  ${round.round_name}: ${count} jogos`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateMatchesWithRounds(); 