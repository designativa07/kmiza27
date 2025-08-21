const axios = require('axios');

/**
 * DEBUG DETALHADO DA BASE DE DADOS DE JOGOS
 * 
 * Verificação completa dos jogos cadastrados no banco
 * para entender por que apenas 20 jogos futuros são encontrados.
 */

const API_BASE_URL = 'http://localhost:3000';

async function debugDatabaseMatches() {
  console.log('🔍 DEBUG COMPLETO - BASE DE DADOS DE JOGOS');
  console.log('==========================================\n');

  try {
    // 1. BUSCAR TODOS OS JOGOS DA COMPETIÇÃO 1
    console.log('📊 1. ANALISANDO TODOS OS JOGOS DA COMPETIÇÃO 1...');
    
    const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
    const allMatches = allMatchesResponse.data.data || allMatchesResponse.data;
    
    if (!allMatches || allMatches.length === 0) {
      console.log('❌ ERRO: Nenhum jogo encontrado na competição 1');
      return;
    }
    
    console.log(`✅ Total de jogos encontrados: ${allMatches.length}`);
    
    // 2. ANÁLISE POR STATUS
    console.log('\n📈 2. ANÁLISE POR STATUS:');
    const statusCounts = {};
    allMatches.forEach(match => {
      const status = match.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} jogos`);
    });
    
    // 3. ANÁLISE POR RODADA
    console.log('\n🎯 3. ANÁLISE POR RODADA:');
    const roundCounts = {};
    allMatches.forEach(match => {
      const round = match.round?.round_number || match.round_number || 'sem rodada';
      roundCounts[round] = (roundCounts[round] || 0) + 1;
    });
    
    const rounds = Object.keys(roundCounts)
      .filter(r => r !== 'sem rodada' && !isNaN(r))
      .map(r => parseInt(r))
      .sort((a, b) => a - b);
    
    console.log(`   Rodadas cadastradas: ${rounds.length}`);
    console.log(`   Primeira rodada: ${Math.min(...rounds)}`);
    console.log(`   Última rodada: ${Math.max(...rounds)}`);
    
    // Mostrar contagem por rodada
    console.log('\n   Jogos por rodada:');
    rounds.forEach(round => {
      const count = roundCounts[round];
      const status = count === 10 ? '✅' : count < 10 ? '⚠️' : '❓';
      console.log(`     Rodada ${round}: ${count} jogos ${status}`);
    });
    
    if (roundCounts['sem rodada']) {
      console.log(`   ⚠️ Jogos sem rodada definida: ${roundCounts['sem rodada']}`);
    }
    
    // 4. ANÁLISE DE JOGOS FUTUROS POR RODADA
    console.log('\n⏳ 4. JOGOS FUTUROS POR RODADA:');
    const futureRounds = {};
    allMatches
      .filter(match => match.status === 'scheduled')
      .forEach(match => {
        const round = match.round?.round_number || match.round_number || 'sem rodada';
        futureRounds[round] = (futureRounds[round] || 0) + 1;
      });
    
    const futureRoundNumbers = Object.keys(futureRounds)
      .filter(r => r !== 'sem rodada' && !isNaN(r))
      .map(r => parseInt(r))
      .sort((a, b) => a - b);
    
    if (futureRoundNumbers.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma rodada futura encontrada!');
      console.log('   Todos os jogos podem estar marcados como finalizados');
    } else {
      console.log(`   Rodadas futuras: ${futureRoundNumbers.length}`);
      futureRoundNumbers.forEach(round => {
        console.log(`     Rodada ${round}: ${futureRounds[round]} jogos agendados`);
      });
    }
    
    // 5. VERIFICAR DATAS DOS JOGOS
    console.log('\n📅 5. ANÁLISE DE DATAS:');
    const today = new Date();
    const dateRanges = {
      past: 0,
      today: 0,
      future: 0
    };
    
    allMatches.forEach(match => {
      const matchDate = new Date(match.match_date);
      const daysDiff = Math.floor((matchDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) dateRanges.past++;
      else if (daysDiff === 0) dateRanges.today++;
      else dateRanges.future++;
    });
    
    console.log(`   Jogos passados: ${dateRanges.past}`);
    console.log(`   Jogos hoje: ${dateRanges.today}`);
    console.log(`   Jogos futuros: ${dateRanges.future}`);
    
    // 6. ÚLTIMOS JOGOS FINALIZADOS
    console.log('\n✅ 6. ÚLTIMOS JOGOS FINALIZADOS:');
    const finishedMatches = allMatches
      .filter(match => match.status === 'finished')
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
      .slice(0, 5);
    
    finishedMatches.forEach((match, index) => {
      const homeTeam = match.home_team?.name || `Time ${match.home_team_id}`;
      const awayTeam = match.away_team?.name || `Time ${match.away_team_id}`;
      const round = match.round?.round_number || match.round_number;
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      console.log(`   ${index + 1}. ${homeTeam} vs ${awayTeam} (Rodada ${round}, ${date})`);
    });
    
    // 7. PRÓXIMOS JOGOS AGENDADOS
    console.log('\n⏳ 7. PRÓXIMOS JOGOS AGENDADOS:');
    const scheduledMatches = allMatches
      .filter(match => match.status === 'scheduled')
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      .slice(0, 10);
    
    if (scheduledMatches.length === 0) {
      console.log('❌ NENHUM JOGO AGENDADO ENCONTRADO!');
      console.log('   Possíveis causas:');
      console.log('   - Todos marcados como "finished"');
      console.log('   - Status diferente de "scheduled"');
      console.log('   - Filtro incorreto na busca');
    } else {
      scheduledMatches.forEach((match, index) => {
        const homeTeam = match.home_team?.name || `Time ${match.home_team_id}`;
        const awayTeam = match.away_team?.name || `Time ${match.away_team_id}`;
        const round = match.round?.round_number || match.round_number;
        const date = new Date(match.match_date).toLocaleDateString('pt-BR');
        console.log(`   ${index + 1}. ${homeTeam} vs ${awayTeam} (Rodada ${round}, ${date})`);
      });
    }
    
    // 8. DIAGNÓSTICO FINAL
    console.log('\n🔬 8. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    const totalRounds = Math.max(...rounds);
    const finishedGames = statusCounts['finished'] || 0;
    const scheduledGames = statusCounts['scheduled'] || 0;
    
    console.log(`✅ Total de rodadas cadastradas: ${totalRounds}/38`);
    console.log(`✅ Total de jogos: ${allMatches.length}/380`);
    console.log(`📊 Jogos finalizados: ${finishedGames}`);
    console.log(`⏳ Jogos agendados: ${scheduledGames}`);
    
    if (totalRounds < 38) {
      console.log('❌ PROBLEMA: Rodadas faltantes no banco');
    } else if (scheduledGames < 50) {
      console.log('❌ PROBLEMA: Poucos jogos com status "scheduled"');
      console.log('   Verificar se jogos futuros estão marcados corretamente');
    } else {
      console.log('✅ Dados parecem completos - investigar filtros do algoritmo');
    }
    
    // 9. TESTE DO MÉTODO USADO PELO MONTE CARLO
    console.log('\n🧪 9. TESTANDO MÉTODO USADO PELO MONTE CARLO:');
    
    // Simular o que o Monte Carlo faz
    console.log('   Simulando getRemainingMatches() e findAllCompetitionMatches()...');
    
    const allMatchesForSimulation = allMatches.map(match => ({
      id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score
    }));
    
    const finishedForSimulation = allMatchesForSimulation.filter(m => 
      m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined
    );
    
    const notFinishedForSimulation = allMatchesForSimulation.filter(m => 
      !(m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined)
    );
    
    console.log(`   Jogos para estatísticas iniciais: ${finishedForSimulation.length}`);
    console.log(`   Jogos para simular: ${notFinishedForSimulation.length}`);
    
    if (notFinishedForSimulation.length < 100) {
      console.log('❌ AQUI ESTÁ O PROBLEMA!');
      console.log('   O algoritmo Monte Carlo só encontra jogos para simular se:');
      console.log('   - status !== "finished" OU');
      console.log('   - home_score === undefined OU away_score === undefined');
      console.log('   \n   Verificar se jogos futuros têm:');
      console.log('   - status = "scheduled" (não "finished")');
      console.log('   - home_score = null/undefined');
      console.log('   - away_score = null/undefined');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO DEBUG:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
    }
  }
}

// Executar o debug
debugDatabaseMatches();
