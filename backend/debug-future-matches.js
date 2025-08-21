const axios = require('axios');

/**
 * DEBUG: VERIFICAR JOGOS FUTUROS DO BRASILEIRÃO
 * 
 * Este script verifica se há jogos futuros sendo corretamente
 * identificados e simulados no algoritmo Monte Carlo.
 */

const API_BASE_URL = 'http://localhost:3000';

async function debugFutureMatches() {
  console.log('🔍 DEBUG - VERIFICANDO JOGOS FUTUROS');
  console.log('=====================================\n');

  try {
    // 1. VERIFICAR JOGOS RESTANTES VIA API
    console.log('📅 1. BUSCANDO JOGOS RESTANTES VIA API...');
    
    try {
      const remainingResponse = await axios.get(`${API_BASE_URL}/matches/remaining/1`);
      const remainingMatches = remainingResponse.data.data || remainingResponse.data;
      
      console.log(`✅ Encontrados ${remainingMatches.length} jogos restantes`);
      
      if (remainingMatches.length > 0) {
        console.log('\n🎯 PRIMEIROS 5 JOGOS RESTANTES:');
        remainingMatches.slice(0, 5).forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.home_team?.name || match.home_team_id} vs ${match.away_team?.name || match.away_team_id}`);
          console.log(`      Data: ${new Date(match.match_date).toLocaleDateString('pt-BR')}`);
          console.log(`      Status: ${match.status}`);
        });
      } else {
        console.log('❌ PROBLEMA: Nenhum jogo futuro encontrado!');
        console.log('   Isso explica por que o Sport tem 100% de rebaixamento');
      }
    } catch (error) {
      console.log('⚠️ Endpoint de jogos restantes não encontrado, tentando alternativa...');
    }

    // 2. VERIFICAR TODOS OS JOGOS DA COMPETIÇÃO
    console.log('\n📊 2. VERIFICANDO TODOS OS JOGOS DA COMPETIÇÃO...');
    
    try {
      const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
      const allMatches = allMatchesResponse.data.data || allMatchesResponse.data;
      
      if (allMatches && allMatches.length > 0) {
        // Separar por status
        const finishedMatches = allMatches.filter(m => m.status === 'finished');
        const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
        const inProgressMatches = allMatches.filter(m => m.status === 'in_progress');
        
        console.log(`📈 Total de jogos: ${allMatches.length}`);
        console.log(`✅ Jogos finalizados: ${finishedMatches.length}`);
        console.log(`⏳ Jogos agendados: ${scheduledMatches.length}`);
        console.log(`🔄 Jogos em andamento: ${inProgressMatches.length}`);
        
        // Verificar se há jogos futuros suficientes
        const futureMatches = scheduledMatches.length + inProgressMatches.length;
        const expectedRemainingMatches = 20 * 20 / 2; // ~200 jogos restantes se temos 20 rodadas
        
        console.log(`\n🎯 ANÁLISE DE JOGOS FUTUROS:`);
        console.log(`   Jogos futuros encontrados: ${futureMatches}`);
        console.log(`   Jogos esperados (~20 rodadas): ~200`);
        
        if (futureMatches < 100) {
          console.log('❌ PROBLEMA IDENTIFICADO!');
          console.log('   Poucos jogos futuros cadastrados no sistema');
          console.log('   Isso faz com que times tenham poucas oportunidades de recuperação');
        } else {
          console.log('✅ Quantidade de jogos futuros parece adequada');
        }
        
        // Mostrar alguns jogos futuros
        if (scheduledMatches.length > 0) {
          console.log('\n📅 PRIMEIROS 5 JOGOS AGENDADOS:');
          scheduledMatches.slice(0, 5).forEach((match, index) => {
            console.log(`   ${index + 1}. ${match.home_team?.name || 'Time ' + match.home_team_id} vs ${match.away_team?.name || 'Time ' + match.away_team_id}`);
            console.log(`      Data: ${new Date(match.match_date).toLocaleDateString('pt-BR')}`);
            console.log(`      Rodada: ${match.round?.round_number || 'N/A'}`);
          });
        }
        
      } else {
        console.log('❌ Nenhum jogo encontrado na competição!');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar jogos da competição:', error.message);
    }

    // 3. VERIFICAR CLASSIFICAÇÃO ATUAL
    console.log('\n🏆 3. VERIFICANDO CLASSIFICAÇÃO ATUAL...');
    
    try {
      const standingsResponse = await axios.get(`${API_BASE_URL}/standings/1`);
      const standings = standingsResponse.data.data || standingsResponse.data;
      
      if (standings && standings.length > 0) {
        console.log(`📊 ${standings.length} times na classificação`);
        
        // Encontrar Sport
        const sport = standings.find(team => 
          team.team?.name?.toLowerCase().includes('sport')
        );
        
        if (sport) {
          console.log('\n🎯 SITUAÇÃO ATUAL DO SPORT:');
          console.log(`   Posição: ${sport.position || 'N/A'}°`);
          console.log(`   Pontos: ${sport.points}`);
          console.log(`   Jogos: ${sport.played}`);
          console.log(`   Vitórias: ${sport.won}`);
          console.log(`   Empates: ${sport.drawn}`);
          console.log(`   Derrotas: ${sport.lost}`);
          
          const jogosRestantes = 38 - sport.played;
          const pontosRestantes = jogosRestantes * 3;
          const pontosMaximos = sport.points + pontosRestantes;
          
          console.log(`\n📊 POTENCIAL DE RECUPERAÇÃO:`);
          console.log(`   Jogos restantes: ${jogosRestantes}`);
          console.log(`   Pontos em disputa: ${pontosRestantes}`);
          console.log(`   Pontos máximos possíveis: ${pontosMaximos}`);
          
          if (jogosRestantes >= 15) {
            console.log('✅ Muitos jogos restantes - recovepação é possível!');
          } else if (jogosRestantes >= 10) {
            console.log('⚠️ Jogos restantes razoáveis para recuperação');
          } else {
            console.log('❌ Poucos jogos restantes - situação crítica');
          }
        } else {
          console.log('❌ Sport não encontrado na classificação');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao buscar classificação:', error.message);
    }

    // 4. CONCLUSÃO E DIAGNÓSTICO
    console.log('\n🔬 4. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    console.log('\n💡 POSSÍVEIS CAUSAS DO PROBLEMA:');
    console.log('1. Poucos jogos futuros cadastrados no banco');
    console.log('2. Jogos com status incorreto (não "scheduled")');
    console.log('3. Filtros na busca de jogos muito restritivos');
    console.log('4. Algoritmo não conseguindo identificar jogos futuros');
    
    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    console.log('1. Verificar se todas as 38 rodadas estão cadastradas');
    console.log('2. Confirmar status dos jogos futuros como "scheduled"');
    console.log('3. Ajustar método findAllCompetitionMatches se necessário');
    console.log('4. Adicionar mais logs no algoritmo Monte Carlo');

  } catch (error) {
    console.error('❌ ERRO GERAL NO DEBUG:', error.message);
  }
}

// Executar o debug
debugFutureMatches();
