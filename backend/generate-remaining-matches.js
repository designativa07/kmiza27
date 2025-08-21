const axios = require('axios');

/**
 * GERADOR DE JOGOS RESTANTES DO BRASILEIRÃO
 * 
 * Este script gera automaticamente os jogos das rodadas restantes
 * do Brasileirão baseado no padrão de confrontos já existentes.
 */

const API_BASE_URL = 'http://localhost:3000';

async function generateRemainingMatches() {
  console.log('🏗️ GERANDO JOGOS RESTANTES DO BRASILEIRÃO');
  console.log('=========================================\n');

  try {
    // 1. BUSCAR JOGOS EXISTENTES
    console.log('📊 1. ANALISANDO JOGOS EXISTENTES...');
    
    const allMatchesResponse = await axios.get(`${API_BASE_URL}/matches/competition/1`);
    const existingMatches = allMatchesResponse.data.data || allMatchesResponse.data;
    
    console.log(`✅ ${existingMatches.length} jogos existentes encontrados`);
    
    // Analisar rodadas existentes
    const roundsData = new Map();
    existingMatches.forEach(match => {
      const roundNumber = match.round?.round_number || 0;
      if (!roundsData.has(roundNumber)) {
        roundsData.set(roundNumber, []);
      }
      roundsData.get(roundNumber).push(match);
    });
    
    const existingRounds = Array.from(roundsData.keys()).sort((a, b) => a - b);
    const lastRound = Math.max(...existingRounds);
    
    console.log(`📈 Rodadas existentes: ${existingRounds.length} (1 a ${lastRound})`);
    
    // 2. EXTRAIR TIMES PARTICIPANTES
    const teamsSet = new Set();
    existingMatches.forEach(match => {
      if (match.home_team_id) teamsSet.add(match.home_team_id);
      if (match.away_team_id) teamsSet.add(match.away_team_id);
    });
    
    const teams = Array.from(teamsSet);
    console.log(`⚽ ${teams.length} times identificados`);
    
    // 3. GERAR CONFRONTOS PARA RODADAS RESTANTES
    console.log('\n🎯 2. GERANDO CONFRONTOS RESTANTES...');
    
    const targetRounds = 38; // Total de rodadas do Brasileirão
    const roundsToGenerate = targetRounds - lastRound;
    
    console.log(`🔢 Gerando ${roundsToGenerate} rodadas (${lastRound + 1} a ${targetRounds})`);
    
    if (roundsToGenerate <= 0) {
      console.log('✅ Todas as rodadas já estão cadastradas!');
      return;
    }
    
    // Algoritmo simples de round-robin para gerar confrontos
    const newMatches = [];
    let matchDate = new Date('2025-08-30'); // Data base para próximos jogos
    
    for (let round = lastRound + 1; round <= targetRounds; round++) {
      console.log(`   Gerando rodada ${round}...`);
      
      // Gerar confrontos para esta rodada (simplificado)
      const roundMatches = generateRoundMatches(teams, round);
      
      roundMatches.forEach(match => {
        newMatches.push({
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          competition_id: 1, // Brasileirão Série A
          round_number: round,
          match_date: new Date(matchDate),
          status: 'scheduled'
        });
      });
      
      // Avançar data para próxima rodada (7 dias)
      matchDate.setDate(matchDate.getDate() + 7);
    }
    
    console.log(`✅ ${newMatches.length} novos jogos gerados`);
    
    // 4. SALVAR JOGOS NO BANCO (simulação)
    console.log('\n💾 3. SALVANDO JOGOS NO BANCO...');
    console.log('⚠️ MODO SIMULAÇÃO - NÃO SALVANDO REALMENTE');
    console.log('   Para salvar de verdade, implemente a API de criação em lote');
    
    // Mostrar primeiros jogos gerados
    console.log('\n📅 PRIMEIROS 10 JOGOS GERADOS:');
    newMatches.slice(0, 10).forEach((match, index) => {
      console.log(`   ${index + 1}. Time ${match.home_team_id} vs Time ${match.away_team_id}`);
      console.log(`      Rodada: ${match.round_number} | Data: ${match.match_date.toLocaleDateString('pt-BR')}`);
    });
    
    // 5. ESTATÍSTICAS FINAIS
    console.log('\n📊 4. ESTATÍSTICAS DOS JOGOS GERADOS:');
    const gamesByRound = new Map();
    newMatches.forEach(match => {
      const round = match.round_number;
      gamesByRound.set(round, (gamesByRound.get(round) || 0) + 1);
    });
    
    console.log('   Jogos por rodada:');
    for (const [round, count] of gamesByRound) {
      console.log(`     Rodada ${round}: ${count} jogos`);
    }
    
    // 6. INSTRUÇÕES PARA APLICAR
    console.log('\n🔧 5. COMO APLICAR AS MUDANÇAS:');
    console.log('===============================');
    console.log('1. IMPLEMENTAR API de criação em lote de jogos');
    console.log('2. OU executar SQL INSERT diretamente no banco');
    console.log('3. OU usar ferramenta administrativa para cadastrar');
    console.log('4. Depois executar nova simulação Monte Carlo');
    
    console.log('\n📝 SQL EXEMPLO (primeiros 5 jogos):');
    console.log('INSERT INTO matches (home_team_id, away_team_id, competition_id, match_date, status) VALUES');
    newMatches.slice(0, 5).forEach((match, index) => {
      const comma = index < 4 ? ',' : ';';
      console.log(`  (${match.home_team_id}, ${match.away_team_id}, 1, '${match.match_date.toISOString()}', 'scheduled')${comma}`);
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Função auxiliar para gerar confrontos de uma rodada
function generateRoundMatches(teams, roundNumber) {
  const matches = [];
  const teamsCount = teams.length;
  
  // Algoritmo simples: emparelhar times sequencialmente com rotação
  for (let i = 0; i < teamsCount / 2; i++) {
    const homeIndex = i;
    const awayIndex = (i + roundNumber - 1) % teamsCount;
    
    if (homeIndex !== awayIndex) {
      matches.push({
        home_team_id: teams[homeIndex],
        away_team_id: teams[awayIndex]
      });
    }
  }
  
  return matches;
}

// Executar geração
generateRemainingMatches();
