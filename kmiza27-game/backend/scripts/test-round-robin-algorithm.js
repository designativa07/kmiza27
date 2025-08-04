const { getSupabaseClient } = require('../config/supabase-connection');

// Simular o algoritmo localmente para testar
function generateMachineMatchesForRound(machineTeams, roundNumber) {
  const matches = [];
  const teamsCount = machineTeams.length; // 19 times
  
  if (teamsCount !== 19) {
    console.warn(`⚠️ Algoritmo otimizado para 19 times, mas encontrou ${teamsCount}`);
    return matches;
  }
  
  // Com 19 times: cada rodada 1 time descansa, 18 jogam (9 partidas)
  // Ao longo de 38 rodadas: cada time descansa 2x, joga 36x
  
  const isReturno = roundNumber > 19;
  const actualRound = isReturno ? roundNumber - 19 : roundNumber;
  
  // Determinar qual time descansa nesta rodada (rotação simples)
  const restingTeamIndex = (actualRound - 1) % teamsCount;
  
  // Times que jogam (todos exceto o que descansa)
  const playingTeams = machineTeams.filter((_, index) => index !== restingTeamIndex);
  
  // Gerar exatamente 9 partidas com os 18 times
  for (let i = 0; i < 9; i++) {
    let homeTeam = playingTeams[i];
    let awayTeam = playingTeams[17 - i]; // 18 - 1 - i
    
    // No returno, inverter mando de campo
    if (isReturno) {
      [homeTeam, awayTeam] = [awayTeam, homeTeam];
    }
    
    matches.push({
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      restingTeam: machineTeams[restingTeamIndex]
    });
  }
  
  return {
    matches,
    restingTeam: machineTeams[restingTeamIndex],
    restingTeamIndex
  };
}

async function testRoundRobinAlgorithm() {
  try {
    console.log('🧪 TESTE: Verificando algoritmo round-robin para 19 times da máquina\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Buscar times da máquina da Série C
    console.log('1️⃣ Buscando times da máquina da Série C...');
    const { data: machineTeams } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .eq('tier', 3)
      .order('name');
    
    if (!machineTeams || machineTeams.length !== 19) {
      console.log(`❌ Esperado 19 times, encontrado ${machineTeams?.length || 0}`);
      return;
    }
    
    console.log(`✅ Encontrados ${machineTeams.length} times da máquina`);
    console.log('Times:', machineTeams.map(t => t.name).join(', '));
    
    // 2. Simular todas as 38 rodadas
    console.log('\n2️⃣ Simulando todas as 38 rodadas...');
    
    const teamStats = {};
    const restingStats = {};
    
    // Inicializar estatísticas
    machineTeams.forEach(team => {
      teamStats[team.id] = {
        name: team.name,
        games: 0,
        homeGames: 0,
        awayGames: 0,
        restingRounds: []
      };
      restingStats[team.id] = 0;
    });
    
    // Simular cada rodada
    for (let round = 1; round <= 38; round++) {
      const result = generateMachineMatchesForRound(machineTeams, round);
      
      console.log(`Rodada ${round}: ${result.matches.length} partidas, descansa: ${result.restingTeam.name}`);
      
      // Atualizar estatísticas do time que descansa
      restingStats[result.restingTeam.id]++;
      teamStats[result.restingTeam.id].restingRounds.push(round);
      
      // Atualizar estatísticas dos times que jogam
      result.matches.forEach(match => {
        // Time da casa
        teamStats[match.homeTeam.id].games++;
        teamStats[match.homeTeam.id].homeGames++;
        
        // Time visitante
        teamStats[match.awayTeam.id].games++;
        teamStats[match.awayTeam.id].awayGames++;
      });
    }
    
    // 3. Verificar resultados
    console.log('\n3️⃣ Verificando resultados...');
    
    let allEqual = true;
    let expectedGames = 36; // 38 rodadas - 2 descansos = 36 jogos
    let expectedResting = 2; // 2 descansos (1 no turno + 1 no returno)
    
    console.log('\n📊 Estatísticas finais:');
    console.log('Time'.padEnd(20) + 'Jogos'.padEnd(8) + 'Casa'.padEnd(8) + 'Fora'.padEnd(8) + 'Descansos'.padEnd(12) + 'Status');
    console.log('-'.repeat(70));
    
    Object.values(teamStats).forEach(team => {
      const gamesOk = team.games === expectedGames;
      const restingOk = restingStats[machineTeams.find(t => t.name === team.name).id] === expectedResting;
      const balanceOk = Math.abs(team.homeGames - team.awayGames) <= 1; // Diferença máxima de 1
      
      const status = (gamesOk && restingOk && balanceOk) ? '✅' : '❌';
      if (!gamesOk || !restingOk || !balanceOk) allEqual = false;
      
      console.log(
        team.name.padEnd(20) + 
        team.games.toString().padEnd(8) + 
        team.homeGames.toString().padEnd(8) + 
        team.awayGames.toString().padEnd(8) + 
        restingStats[machineTeams.find(t => t.name === team.name).id].toString().padEnd(12) + 
        status
      );
    });
    
    // 4. Verificar descansos por período
    console.log('\n🔍 Verificação de descansos por período:');
    
    machineTeams.forEach(team => {
      const stats = teamStats[team.id];
      const turnoResting = stats.restingRounds.filter(r => r <= 19).length;
      const returnoResting = stats.restingRounds.filter(r => r > 19).length;
      
      const periodOk = turnoResting === 1 && returnoResting === 1;
      
      console.log(`${team.name}: Turno: ${turnoResting}, Returno: ${returnoResting} ${periodOk ? '✅' : '❌'}`);
      
      if (!periodOk) allEqual = false;
    });
    
    // 5. Resultado final
    console.log('\n🎯 RESULTADO DO TESTE:');
    if (allEqual) {
      console.log('✅ SUCESSO! Algoritmo round-robin funcionando corretamente');
      console.log(`✅ Todos os times têm exatamente ${expectedGames} jogos`);
      console.log(`✅ Todos os times descansam exatamente ${expectedResting} vezes`);
      console.log('✅ Distribuição casa/fora balanceada');
      console.log('✅ 1 descanso no turno + 1 descanso no returno');
    } else {
      console.log('❌ FALHA! Algoritmo tem inconsistências');
      console.log('❌ Número de jogos ou descansos não está balanceado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testRoundRobinAlgorithm();