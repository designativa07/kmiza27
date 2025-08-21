const axios = require('axios');

/**
 * CORREÇÃO: IDs DOS TIMES NOS JOGOS
 * 
 * Investigar e corrigir os campos home_team_id e away_team_id
 * que estão aparecendo como undefined nos jogos.
 */

const API_BASE_URL = 'http://localhost:3000';

async function fixMatchTeamIds() {
  console.log('🔧 CORREÇÃO - IDs DOS TIMES NOS JOGOS');
  console.log('====================================\n');

  try {
    // 1. INVESTIGAR ESTRUTURA DOS JOGOS
    console.log('🔍 1. INVESTIGANDO ESTRUTURA DOS JOGOS...');
    
    const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
    const allMatches = allMatchesResponse.data.data || allMatchesResponse.data;
    
    if (!allMatches || allMatches.length === 0) {
      console.log('❌ Nenhum jogo encontrado');
      return;
    }
    
    // Examinar primeiro jogo em detalhes
    const firstMatch = allMatches[0];
    console.log('📋 ESTRUTURA DO PRIMEIRO JOGO:');
    console.log(JSON.stringify(firstMatch, null, 2));
    
    // 2. VERIFICAR SE IDs ESTÃO EM OUTRO LUGAR
    console.log('\n🔍 2. VERIFICANDO POSSÍVEIS CAMPOS DE ID...');
    
    const possibleFields = [
      'home_team_id', 'away_team_id',
      'homeTeamId', 'awayTeamId', 
      'home_team', 'away_team',
      'homeTeam', 'awayTeam'
    ];
    
    possibleFields.forEach(field => {
      const value = firstMatch[field];
      console.log(`   ${field}: ${JSON.stringify(value)}`);
    });
    
    // 3. VERIFICAR SE home_team E away_team TÊM IDs
    console.log('\n🏠 3. VERIFICANDO OBJETOS DE TIME...');
    
    if (firstMatch.home_team) {
      console.log('   home_team encontrado:');
      console.log(`     id: ${firstMatch.home_team.id}`);
      console.log(`     name: ${firstMatch.home_team.name}`);
    } else {
      console.log('   ❌ home_team não encontrado');
    }
    
    if (firstMatch.away_team) {
      console.log('   away_team encontrado:');
      console.log(`     id: ${firstMatch.away_team.id}`);
      console.log(`     name: ${firstMatch.away_team.name}`);
    } else {
      console.log('   ❌ away_team não encontrado');
    }
    
    // 4. CONTAR JOGOS COM IDs VÁLIDOS VS INVÁLIDOS
    console.log('\n📊 4. ANÁLISE DE IDs NOS JOGOS...');
    
    let validHomeIds = 0;
    let validAwayIds = 0;
    let validHomeTeamObjects = 0;
    let validAwayTeamObjects = 0;
    
    allMatches.forEach(match => {
      if (match.home_team_id && match.home_team_id !== undefined) validHomeIds++;
      if (match.away_team_id && match.away_team_id !== undefined) validAwayIds++;
      if (match.home_team && match.home_team.id) validHomeTeamObjects++;
      if (match.away_team && match.away_team.id) validAwayTeamObjects++;
    });
    
    console.log(`   Jogos com home_team_id válido: ${validHomeIds}/${allMatches.length}`);
    console.log(`   Jogos com away_team_id válido: ${validAwayIds}/${allMatches.length}`);
    console.log(`   Jogos com home_team.id válido: ${validHomeTeamObjects}/${allMatches.length}`);
    console.log(`   Jogos com away_team.id válido: ${validAwayTeamObjects}/${allMatches.length}`);
    
    // 5. VERIFICAR SE PRECISAMOS USAR OBJETOS home_team/away_team
    if (validHomeIds === 0 && validAwayIds === 0 && validHomeTeamObjects > 0) {
      console.log('\n✅ 5. SOLUÇÃO ENCONTRADA!');
      console.log('   Os IDs estão nos objetos home_team.id e away_team.id');
      console.log('   O algoritmo Monte Carlo precisa ser ajustado para usar estes campos');
      
      // Mostrar exemplo de mapeamento correto
      console.log('\n📋 MAPEAMENTO CORRETO PARA OS PRIMEIROS 5 JOGOS:');
      allMatches.slice(0, 5).forEach((match, index) => {
        const homeId = match.home_team?.id;
        const awayId = match.away_team?.id;
        const homeName = match.home_team?.name;
        const awayName = match.away_team?.name;
        
        console.log(`   ${index + 1}. ${homeName} (ID: ${homeId}) vs ${awayName} (ID: ${awayId})`);
      });
      
      return { needsAlgorithmFix: true, useObjectIds: true };
    }
    
    // 6. VERIFICAR SE HÁ PROBLEMA NA API
    console.log('\n🔍 6. VERIFICANDO ENDPOINT ALTERNATIVO...');
    
    try {
      // Tentar buscar um jogo específico
      if (allMatches.length > 0) {
        const matchId = firstMatch.id;
        const singleMatchResponse = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
        const singleMatch = singleMatchResponse.data.data || singleMatchResponse.data;
        
        console.log('📋 JOGO INDIVIDUAL:');
        console.log(`   home_team_id: ${singleMatch.home_team_id}`);
        console.log(`   away_team_id: ${singleMatch.away_team_id}`);
        console.log(`   home_team.id: ${singleMatch.home_team?.id}`);
        console.log(`   away_team.id: ${singleMatch.away_team?.id}`);
      }
    } catch (error) {
      console.log('   ⚠️ Endpoint individual não disponível');
    }
    
    // 7. DIAGNÓSTICO FINAL
    console.log('\n🔬 7. DIAGNÓSTICO E PLANO DE AÇÃO:');
    console.log('==================================');
    
    if (validHomeTeamObjects > 0 && validAwayTeamObjects > 0) {
      console.log('✅ DADOS DISPONÍVEIS - Precisamos ajustar o algoritmo');
      console.log('   Os IDs dos times estão em home_team.id e away_team.id');
      console.log('   Não em home_team_id e away_team_id');
      
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log('   1. Modificar método getRemainingMatches() no Monte Carlo');
      console.log('   2. Usar match.home_team.id em vez de match.home_team_id');
      console.log('   3. Usar match.away_team.id em vez de match.away_team_id');
      console.log('   4. Executar nova simulação após correção');
      
    } else {
      console.log('❌ DADOS FALTANDO - Problema na base de dados');
      console.log('   Nem home_team_id nem home_team.id estão disponíveis');
      console.log('   Verificar configuração do TypeORM e relacionamentos');
    }
    
    return { 
      needsAlgorithmFix: validHomeTeamObjects > 0,
      useObjectIds: validHomeTeamObjects > 0,
      validData: validHomeTeamObjects > 0 || validHomeIds > 0
    };
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    return { needsAlgorithmFix: false, useObjectIds: false, validData: false };
  }
}

// Executar correção
fixMatchTeamIds().then(result => {
  if (result && result.needsAlgorithmFix) {
    console.log('\n🚀 PRÓXIMO PASSO: Corrigir algoritmo Monte Carlo para usar home_team.id');
  }
});
