const axios = require('axios');

/**
 * DEBUG ESPECÍFICO DO SPORT
 * 
 * Analisar por que o Sport ainda tem 100% de rebaixamento
 * mesmo com 191 jogos para simular (160 to_confirm + 20 scheduled + 11 postponed)
 */

const API_BASE_URL = 'http://localhost:3000';

async function debugSportSimulation() {
  console.log('🎯 DEBUG ESPECÍFICO DO SPORT');
  console.log('============================\n');

  try {
    // 1. BUSCAR SITUAÇÃO ATUAL DO SPORT
    console.log('📊 1. SITUAÇÃO ATUAL DO SPORT...');
    
    // Buscar todas as partidas do Sport
    const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
    const allMatches = allMatchesResponse.data.data || allMatchesResponse.data;
    
    // Filtrar jogos do Sport (assumindo que é time_id específico)
    // Vamos identificar o Sport pelos jogos da simulação anterior
    const simulationResponse = await axios.get(`${API_BASE_URL}/simulations/latest/1`);
    const predictions = simulationResponse.data.data?.team_predictions || [];
    const sportPrediction = predictions.find(p => p.team_name.toLowerCase().includes('sport'));
    
    if (!sportPrediction) {
      console.log('❌ Sport não encontrado na simulação');
      return;
    }
    
    const sportTeamId = sportPrediction.team_id;
    console.log(`✅ Sport identificado - ID: ${sportTeamId}`);
    
    // 2. ANALISAR JOGOS DO SPORT
    console.log('\n⚽ 2. ANÁLISE DOS JOGOS DO SPORT:');
    
    const sportMatches = allMatches.filter(match => 
      match.home_team_id === sportTeamId || match.away_team_id === sportTeamId
    );
    
    console.log(`   Total de jogos do Sport: ${sportMatches.length}`);
    
    // Separar por status
    const sportByStatus = {};
    sportMatches.forEach(match => {
      const status = match.status;
      sportByStatus[status] = (sportByStatus[status] || 0) + 1;
    });
    
    console.log('   Jogos por status:');
    Object.entries(sportByStatus).forEach(([status, count]) => {
      console.log(`     ${status}: ${count} jogos`);
    });
    
    // Jogos já disputados
    const sportFinished = sportMatches.filter(m => m.status === 'finished');
    const sportFuture = sportMatches.filter(m => m.status !== 'finished');
    
    console.log(`\n   📈 Jogos disputados: ${sportFinished.length}`);
    console.log(`   ⏳ Jogos restantes: ${sportFuture.length}`);
    
    // 3. CALCULAR ESTATÍSTICAS ATUAIS DO SPORT
    console.log('\n📊 3. ESTATÍSTICAS ATUAIS DO SPORT:');
    
    let pontos = 0;
    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golsPro = 0;
    let golsContra = 0;
    
    sportFinished.forEach(match => {
      const isSportHome = match.home_team_id === sportTeamId;
      const sportGoals = isSportHome ? match.home_score : match.away_score;
      const opponentGoals = isSportHome ? match.away_score : match.home_score;
      
      golsPro += sportGoals || 0;
      golsContra += opponentGoals || 0;
      
      if (sportGoals > opponentGoals) {
        vitorias++;
        pontos += 3;
      } else if (sportGoals === opponentGoals) {
        empates++;
        pontos += 1;
      } else {
        derrotas++;
      }
    });
    
    const saldoGols = golsPro - golsContra;
    const aproveitamento = ((pontos / (sportFinished.length * 3)) * 100).toFixed(1);
    
    console.log(`   Posição atual: ${sportPrediction.current_position}°`);
    console.log(`   Pontos: ${pontos}`);
    console.log(`   Jogos: ${sportFinished.length}`);
    console.log(`   Vitórias: ${vitorias}`);
    console.log(`   Empates: ${empates}`);
    console.log(`   Derrotas: ${derrotas}`);
    console.log(`   Gols pró: ${golsPro}`);
    console.log(`   Gols contra: ${golsContra}`);
    console.log(`   Saldo: ${saldoGols}`);
    console.log(`   Aproveitamento: ${aproveitamento}%`);
    
    // 4. ANALISAR POTENCIAL DE RECUPERAÇÃO
    console.log('\n🚀 4. POTENCIAL DE RECUPERAÇÃO:');
    
    const jogosRestantes = sportFuture.length;
    const pontosEmDisputa = jogosRestantes * 3;
    const pontosMaximos = pontos + pontosEmDisputa;
    
    console.log(`   Jogos restantes: ${jogosRestantes}`);
    console.log(`   Pontos em disputa: ${pontosEmDisputa}`);
    console.log(`   Pontos máximos possíveis: ${pontosMaximos}`);
    
    // Estimativa de pontos para escapar (baseado em histórico)
    const pontosParaEscapar = 42; // Média histórica para escapar
    const pontosNecessarios = Math.max(0, pontosParaEscapar - pontos);
    const vitoriasNecessarias = Math.ceil(pontosNecessarios / 3);
    const porcentagemVitoriasNecessaria = ((vitoriasNecessarias / jogosRestantes) * 100).toFixed(1);
    
    console.log(`\n   📊 PARA ESCAPAR DO REBAIXAMENTO:`);
    console.log(`   Pontos necessários: ${pontosNecessarios}`);
    console.log(`   Vitórias necessárias: ${vitoriasNecessarias} de ${jogosRestantes}`);
    console.log(`   % de vitórias necessário: ${porcentagemVitoriasNecessaria}%`);
    
    if (porcentagemVitoriasNecessaria <= 40) {
      console.log('   ✅ RECUPERAÇÃO REALISTA (≤40% vitórias)');
    } else if (porcentagemVitoriasNecessaria <= 60) {
      console.log('   ⚠️ RECUPERAÇÃO DIFÍCIL (40-60% vitórias)');
    } else {
      console.log('   ❌ RECUPERAÇÃO MUITO DIFÍCIL (>60% vitórias)');
    }
    
    // 5. ANALISAR PRÓXIMOS ADVERSÁRIOS
    console.log('\n👥 5. PRÓXIMOS ADVERSÁRIOS DO SPORT:');
    
    const nextMatches = sportFuture
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      .slice(0, 5);
    
    nextMatches.forEach((match, index) => {
      const isSportHome = match.home_team_id === sportTeamId;
      const opponent = isSportHome ? 
        `vs ${match.away_team?.name || 'Time ' + match.away_team_id} (casa)` :
        `@ ${match.home_team?.name || 'Time ' + match.home_team_id} (fora)`;
      
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      const round = match.round?.round_number || match.round_number;
      
      console.log(`   ${index + 1}. ${opponent} - Rodada ${round} (${date})`);
    });
    
    // 6. VERIFICAR ALGORITMO MONTE CARLO
    console.log('\n🧪 6. VERIFICAR LÓGICA DO MONTE CARLO:');
    
    console.log(`   Jogos simulados pelo algoritmo: ${sportFuture.length}`);
    console.log(`   Probabilidade atual de rebaixamento: ${sportPrediction.relegation_probability}%`);
    console.log(`   Posição média projetada: ${sportPrediction.average_final_position}`);
    console.log(`   Pontos médios projetados: ${sportPrediction.average_final_points}`);
    
    // Calcular se o algoritmo está sendo muito pessimista
    const pontosProjetados = sportPrediction.average_final_points;
    const pontosGanhos = pontosProjetados - pontos;
    const vitoriasProjetadas = Math.round(pontosGanhos / 3);
    const percentualVitoriasProjetado = ((vitoriasProjetadas / jogosRestantes) * 100).toFixed(1);
    
    console.log(`\n   📊 PROJEÇÃO DO ALGORITMO:`);
    console.log(`   Pontos a ganhar: ${pontosGanhos.toFixed(1)}`);
    console.log(`   Vitórias projetadas: ~${vitoriasProjetadas} de ${jogosRestantes}`);
    console.log(`   % vitórias projetado: ${percentualVitoriasProjetado}%`);
    
    if (percentualVitoriasProjetado < 20) {
      console.log('   ❌ ALGORITMO MUITO PESSIMISTA (<20% vitórias)');
      console.log('   Mesmo times fracos ganham mais de 20% dos jogos');
    } else if (percentualVitoriasProjetado < 30) {
      console.log('   ⚠️ ALGORITMO PESSIMISTA (20-30% vitórias)');
    } else {
      console.log('   ✅ PROJEÇÃO REALISTA (≥30% vitórias)');
    }
    
    // 7. DIAGNÓSTICO FINAL
    console.log('\n🔬 7. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    if (jogosRestantes < 10) {
      console.log('❌ POUCOS JOGOS RESTANTES - Situação realmente crítica');
    } else if (pontosMaximos < 42) {
      console.log('❌ IMPOSSÍVEL MATEMATICAMENTE - Nem ganhando todos os jogos');
    } else if (porcentagemVitoriasNecessaria > 80) {
      console.log('❌ QUASE IMPOSSÍVEL - Precisa ganhar >80% dos jogos');
    } else if (percentualVitoriasProjetado < 25) {
      console.log('❌ PROBLEMA NO ALGORITMO - Projeção muito pessimista');
      console.log('   O algoritmo Monte Carlo precisa ser ajustado para:');
      console.log('   - Dar mais chances de vitória ao Sport');
      console.log('   - Considerar que times desesperados lutam mais');
      console.log('   - Reduzir ainda mais os fatores de volatilidade');
    } else {
      console.log('✅ Situação coerente com a realidade');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar debug
debugSportSimulation();
