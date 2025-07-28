const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27',
  user: 'postgres',
  password: 'postgres'
});

async function associateMatchToRound() {
  try {
    console.log('🔍 Associando jogo à rodada...');
    
    const matchId = 1505;
    const roundId = 115;
    
    // 1. Verificar se o jogo existe
    console.log('\n1. Verificando jogo...');
    const matchQuery = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
    
    if (matchQuery.rows.length === 0) {
      console.log('❌ Jogo não encontrado!');
      return;
    }
    
    console.log('✅ Jogo encontrado:', matchQuery.rows[0].home_team_id, 'vs', matchQuery.rows[0].away_team_id);
    
    // 2. Verificar se a rodada existe
    console.log('\n2. Verificando rodada...');
    const roundQuery = await pool.query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    
    if (roundQuery.rows.length === 0) {
      console.log('❌ Rodada não encontrada!');
      return;
    }
    
    console.log('✅ Rodada encontrada:', roundQuery.rows[0].name);
    
    // 3. Associar jogo à rodada
    console.log('\n3. Associando jogo à rodada...');
    const updateQuery = await pool.query(
      'UPDATE matches SET round_id = $1 WHERE id = $2',
      [roundId, matchId]
    );
    
    console.log('✅ Jogo associado à rodada com sucesso!');
    console.log('📊 Linhas afetadas:', updateQuery.rowCount);
    
    // 4. Verificar se a associação foi feita
    console.log('\n4. Verificando associação...');
    const verifyQuery = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
    
    if (verifyQuery.rows.length > 0) {
      console.log('✅ Jogo verificado:', verifyQuery.rows[0].round_id);
    }
    
    // 5. Testar API de rodadas novamente
    console.log('\n5. Testando API de rodadas...');
    const axios = require('axios');
    const API_URL = 'http://localhost:3000';
    
    try {
      const roundsResponse = await axios.get(`${API_URL}/standings/competition/23/rounds`);
      console.log('✅ Rodadas encontradas via API:', roundsResponse.data.length);
      
      if (roundsResponse.data.length > 0) {
        console.log('📋 Rodadas:', roundsResponse.data.map(r => r.name));
      }
    } catch (error) {
      console.log('❌ Erro na API de rodadas:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

associateMatchToRound(); 