const { getSupabaseClient } = require('../config/supabase-connection');

async function testRealSeasonFix() {
  try {
    console.log('🧪 TESTE: Verificando correção em temporada real\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Primeiro, listar usuários que realmente jogaram partidas
    console.log('1️⃣ Verificando usuários que jogaram partidas...');
    const { data: usersWithMatches } = await supabase
      .from('game_season_matches')
      .select('user_id, season_year, tier, round_number, status')
      .eq('status', 'finished')
      .order('season_year', { ascending: false })
      .order('round_number', { ascending: false });
    
    if (!usersWithMatches || usersWithMatches.length === 0) {
      console.log('❌ Nenhum usuário com partidas jogadas encontrado');
      
      // Fallback: verificar usuários na tabela de progresso
      console.log('🔄 Verificando usuários na tabela de progresso...');
      const { data: allUsers } = await supabase
        .from('game_user_competition_progress')
        .select('user_id, season_year, current_tier, games_played, season_status')
        .order('season_year', { ascending: false });
      
      if (!allUsers || allUsers.length === 0) {
        console.log('❌ Nenhum usuário encontrado no sistema');
        return;
      }
    }
    
    if (!allUsers || allUsers.length === 0) {
      console.log('❌ Nenhum usuário encontrado no sistema');
      return;
    }
    
    // Agrupar por usuário
    const userGroups = {};
    allUsers.forEach(progress => {
      if (!userGroups[progress.user_id]) {
        userGroups[progress.user_id] = [];
      }
      userGroups[progress.user_id].push(progress);
    });
    
    console.log(`✅ Encontrados ${Object.keys(userGroups).length} usuários com temporadas:`);
    Object.keys(userGroups).forEach((userId, index) => {
      const userSeasons = userGroups[userId];
      const latestSeason = userSeasons[0];
      console.log(`   ${index + 1}. User ID: ${userId.substring(0, 8)}... - ${userSeasons.length} temporadas - Última: ${latestSeason.season_year} (${latestSeason.games_played}/38 jogos)`);
    });
    
    // Pegar o primeiro usuário disponível
    const testUserId = Object.keys(userGroups)[0];
    console.log(`\n🎯 Analisando usuário: ${testUserId}`);
    
    // 2. Verificar todas as temporadas do usuário selecionado
    console.log('\n2️⃣ Verificando temporadas do usuário selecionado...');
    const { data: allProgress } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', testUserId)
      .order('season_year', { ascending: false });
    
    if (!allProgress || allProgress.length === 0) {
      console.log('❌ Usuário não tem nenhuma temporada');
      return;
    }
    
    console.log(`✅ Encontradas ${allProgress.length} temporadas:`);
    allProgress.forEach((season, index) => {
      console.log(`   ${index + 1}. Temporada ${season.season_year} - Série ${getTierName(season.current_tier)} - ${season.games_played}/38 jogos - Status: ${season.season_status}`);
    });
    
    // Pegar a temporada mais recente
    const currentSeason = allProgress[0];
    
    console.log(`\n📊 Analisando temporada mais recente:`);
    console.log(`   Temporada: ${currentSeason.season_year}, Série: ${getTierName(currentSeason.current_tier)}`);
    console.log(`   Jogos do usuário: ${currentSeason.games_played}/38`);
    console.log(`   Status: ${currentSeason.season_status}`);
    
    // 2. Verificar estatísticas dos times da máquina
    console.log('\n2️⃣ Verificando estatísticas dos times da máquina...');
    const { data: machineStats } = await supabase
      .from('game_user_machine_team_stats')
      .select('machine_team_name, points, games_played, wins, draws, losses')
      .eq('user_id', testUserId)
      .eq('season_year', currentSeason.season_year)
      .eq('tier', currentSeason.current_tier)
      .order('points', { ascending: false });
    
    if (!machineStats || machineStats.length === 0) {
      console.log('❌ Nenhuma estatística de times da máquina encontrada');
      return;
    }
    
    console.log(`✅ Encontradas estatísticas de ${machineStats.length} times da máquina`);
    
    // 3. Analisar consistência dos jogos
    console.log('\n3️⃣ Analisando consistência do número de jogos...');
    
    const gamesCounts = {};
    let minGames = Infinity;
    let maxGames = 0;
    
    machineStats.forEach(team => {
      const games = team.games_played;
      gamesCounts[games] = (gamesCounts[games] || 0) + 1;
      minGames = Math.min(minGames, games);
      maxGames = Math.max(maxGames, games);
    });
    
    console.log('📊 Distribuição de jogos por time:');
    Object.keys(gamesCounts)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(games => {
        console.log(`   ${games} jogos: ${gamesCounts[games]} times`);
      });
    
    // 4. Verificar se há inconsistência
    const gamesRange = maxGames - minGames;
    console.log(`\n📈 Análise da consistência:`);
    console.log(`   Mínimo de jogos: ${minGames}`);
    console.log(`   Máximo de jogos: ${maxGames}`);
    console.log(`   Diferença: ${gamesRange}`);
    
    if (gamesRange <= 1) {
      console.log('✅ CONSISTÊNCIA BOA: Diferença máxima de 1 jogo entre times');
      console.log('✅ Isso é normal e esperado com o algoritmo round-robin');
    } else if (gamesRange <= 2) {
      console.log('⚠️ CONSISTÊNCIA ACEITÁVEL: Diferença de 2 jogos (pode ser normal)');
    } else {
      console.log('❌ INCONSISTÊNCIA DETECTADA: Diferença muito alta entre times');
      console.log('❌ Isso indica que o algoritmo antigo ainda pode estar em uso');
    }
    
    // 5. Mostrar detalhes dos times com menos jogos
    if (gamesRange > 1) {
      console.log('\n🔍 Times com menos jogos:');
      const lowGameTeams = machineStats.filter(team => team.games_played === minGames);
      lowGameTeams.forEach(team => {
        console.log(`   ${team.machine_team_name}: ${team.games_played} jogos, ${team.points} pontos`);
      });
      
      console.log('\n🔍 Times com mais jogos:');
      const highGameTeams = machineStats.filter(team => team.games_played === maxGames);
      highGameTeams.forEach(team => {
        console.log(`   ${team.machine_team_name}: ${team.games_played} jogos, ${team.points} pontos`);
      });
    }
    
    // 6. Calcular jogos esperados baseado na rodada do usuário
    const userRounds = currentSeason.games_played;
    let expectedMachineGames;
    
    if (userRounds <= 19) {
      // No turno: cada time descansa 1x nas primeiras 19 rodadas
      expectedMachineGames = userRounds - (userRounds > 0 ? 1 : 0); // -1 se já passou da rodada onde descansa
    } else {
      // No returno: cada time descansa 2x total
      expectedMachineGames = userRounds - 2;
    }
    
    console.log(`\n🎯 Análise baseada na rodada do usuário:`);
    console.log(`   Usuário jogou: ${userRounds} rodadas`);
    console.log(`   Jogos esperados para times da máquina: ~${expectedMachineGames} (±1)`);
    
    const withinExpected = machineStats.filter(team => 
      Math.abs(team.games_played - expectedMachineGames) <= 1
    ).length;
    
    console.log(`   Times dentro do esperado: ${withinExpected}/${machineStats.length}`);
    
    // 7. Conclusão
    console.log('\n🎯 CONCLUSÃO:');
    if (gamesRange <= 1 && withinExpected >= machineStats.length * 0.9) {
      console.log('✅ CORREÇÃO FUNCIONANDO: Algoritmo round-robin está balanceando os jogos');
      console.log('✅ O problema original foi resolvido!');
    } else if (gamesRange <= 2) {
      console.log('⚠️ CORREÇÃO PARCIAL: Melhoria detectada, mas pode precisar de ajustes');
    } else {
      console.log('❌ CORREÇÃO NÃO APLICADA: Problema ainda persiste');
      console.log('❌ Pode ser necessário simular algumas rodadas com o novo algoritmo');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

// Executar teste
testRealSeasonFix();