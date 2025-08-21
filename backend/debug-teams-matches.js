const axios = require('axios');

/**
 * DEBUG: VERIFICAR TODOS OS TIMES E SEUS JOGOS
 * 
 * Investigar se há inconsistência nos IDs dos times
 * ou se alguns times não têm jogos cadastrados.
 */

const API_BASE_URL = 'http://localhost:3000';

async function debugTeamsMatches() {
  console.log('🔍 DEBUG - TIMES E SEUS JOGOS');
  console.log('==============================\n');

  try {
    // 1. BUSCAR TODOS OS JOGOS
    console.log('📊 1. BUSCANDO TODOS OS JOGOS...');
    
    const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
    const allMatches = allMatchesResponse.data.data || allMatchesResponse.data;
    console.log(`✅ ${allMatches.length} jogos encontrados`);
    
    // 2. BUSCAR SIMULAÇÃO ATUAL
    console.log('\n🎯 2. BUSCANDO SIMULAÇÃO ATUAL...');
    
    const simulationResponse = await axios.get(`${API_BASE_URL}/simulations/latest/1`);
    const predictions = simulationResponse.data.data?.team_predictions || [];
    console.log(`✅ ${predictions.length} times na simulação`);
    
    // 3. ANALISAR TIMES DA SIMULAÇÃO VS JOGOS
    console.log('\n📈 3. ANÁLISE DE TIMES E JOGOS:');
    
    // Extrair todos os team_ids únicos dos jogos
    const teamsInMatches = new Set();
    allMatches.forEach(match => {
      teamsInMatches.add(match.home_team_id);
      teamsInMatches.add(match.away_team_id);
    });
    
    console.log(`   Times com jogos cadastrados: ${teamsInMatches.size}`);
    console.log(`   Times na simulação: ${predictions.length}`);
    
    // Verificar cada time da simulação
    console.log('\n📊 VERIFICAÇÃO TIME POR TIME:');
    
    const teamsWithoutMatches = [];
    const teamsWithMatches = [];
    
    predictions.forEach(prediction => {
      const teamId = prediction.team_id;
      const teamName = prediction.team_name;
      
      // Contar jogos deste time
      const teamMatches = allMatches.filter(match => 
        match.home_team_id === teamId || match.away_team_id === teamId
      );
      
      const matchCount = teamMatches.length;
      
      if (matchCount === 0) {
        teamsWithoutMatches.push({ id: teamId, name: teamName });
        console.log(`   ❌ ${teamName} (ID: ${teamId}): 0 jogos`);
      } else {
        teamsWithMatches.push({ id: teamId, name: teamName, matches: matchCount });
        
        // Verificar status dos jogos
        const finished = teamMatches.filter(m => m.status === 'finished').length;
        const future = teamMatches.length - finished;
        
        console.log(`   ✅ ${teamName} (ID: ${teamId}): ${matchCount} jogos (${finished} finalizados, ${future} futuros)`);
      }
    });
    
    // 4. LISTAR TIMES SEM JOGOS
    if (teamsWithoutMatches.length > 0) {
      console.log('\n❌ 4. TIMES SEM JOGOS CADASTRADOS:');
      teamsWithoutMatches.forEach(team => {
        console.log(`   - ${team.name} (ID: ${team.id})`);
      });
      
      console.log('\n🔍 POSSÍVEIS CAUSAS:');
      console.log('   1. IDs dos times na simulação não coincidem com IDs nos jogos');
      console.log('   2. Times foram adicionados na simulação mas não têm jogos');
      console.log('   3. Erro no mapeamento de IDs entre tabelas');
      console.log('   4. Times de competições diferentes misturados');
    }
    
    // 5. VERIFICAR IDS ÚNICOS NOS JOGOS
    console.log('\n📋 5. IDS DE TIMES ÚNICOS NOS JOGOS:');
    const sortedTeamIds = Array.from(teamsInMatches).sort((a, b) => a - b);
    console.log(`   IDs encontrados nos jogos: ${sortedTeamIds.join(', ')}`);
    
    // 6. VERIFICAR IDS ÚNICOS NA SIMULAÇÃO  
    console.log('\n🎯 6. IDS DE TIMES NA SIMULAÇÃO:');
    const simulationTeamIds = predictions.map(p => p.team_id).sort((a, b) => a - b);
    console.log(`   IDs na simulação: ${simulationTeamIds.join(', ')}`);
    
    // 7. COMPARAR SETS DE IDs
    console.log('\n🔄 7. COMPARAÇÃO DE IDs:');
    
    const onlyInMatches = sortedTeamIds.filter(id => !simulationTeamIds.includes(id));
    const onlyInSimulation = simulationTeamIds.filter(id => !sortedTeamIds.includes(id));
    const inBoth = sortedTeamIds.filter(id => simulationTeamIds.includes(id));
    
    console.log(`   Apenas nos jogos: ${onlyInMatches.join(', ') || 'Nenhum'}`);
    console.log(`   Apenas na simulação: ${onlyInSimulation.join(', ') || 'Nenhum'}`);
    console.log(`   Em ambos: ${inBoth.join(', ') || 'Nenhum'}`);
    
    // 8. MOSTRAR EXEMPLOS DE JOGOS
    console.log('\n📅 8. EXEMPLOS DE JOGOS (primeiros 10):');
    allMatches.slice(0, 10).forEach((match, index) => {
      const homeTeam = match.home_team?.name || `ID ${match.home_team_id}`;
      const awayTeam = match.away_team?.name || `ID ${match.away_team_id}`;
      const round = match.round?.round_number || match.round_number;
      
      console.log(`   ${index + 1}. ${homeTeam} vs ${awayTeam} (Rodada ${round})`);
      console.log(`      IDs: ${match.home_team_id} vs ${match.away_team_id} | Status: ${match.status}`);
    });
    
    // 9. DIAGNÓSTICO FINAL
    console.log('\n🔬 9. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    if (teamsWithoutMatches.length > 0) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log(`   ${teamsWithoutMatches.length} times na simulação não têm jogos cadastrados`);
      console.log('   Isso explica as probabilidades de 100% de rebaixamento');
      
      console.log('\n🔧 SOLUÇÕES:');
      console.log('   1. Verificar mapeamento de IDs entre tabelas teams e matches');
      console.log('   2. Verificar se simulação está usando competição correta');
      console.log('   3. Verificar se Power Index está calculado corretamente');
      console.log('   4. Atualizar IDs na simulação ou nos jogos para coincidir');
    } else if (onlyInSimulation.length > 0) {
      console.log('⚠️ INCONSISTÊNCIA ENCONTRADA:');
      console.log('   Alguns times na simulação não estão nos jogos');
    } else {
      console.log('✅ Todos os times da simulação têm jogos cadastrados');
      console.log('   O problema deve estar na lógica do algoritmo Monte Carlo');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar debug
debugTeamsMatches();
