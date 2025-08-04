const { getSupabaseClient } = require('../config/supabase-connection');

async function diagnosticarJogosAMenos() {
  console.log('🔍 DIAGNÓSTICO: Verificando times com jogos a menos...\n');

  const supabase = getSupabaseClient('vps');

  try {
    // 1. Verificar progresso de todos os usuários
    console.log('📊 Verificando progresso dos usuários...');
    const { data: allProgress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('season_status', 'active')
      .order('games_played', { ascending: true });

    if (progressError) {
      console.error('❌ Erro ao buscar progresso:', progressError);
      return;
    }

    console.log(`📋 Encontrados ${allProgress.length} usuários com temporada ativa\n`);

    // Analisar usuários com poucos jogos
    const problemUsers = allProgress.filter(p => p.games_played < 30);
    
    if (problemUsers.length > 0) {
      console.log('⚠️ USUÁRIOS COM POSSÍVEIS PROBLEMAS:');
      for (const user of problemUsers) {
        console.log(`   👤 ${user.user_id.slice(0, 8)}... - ${user.games_played}/38 jogos - Série ${user.current_tier}`);
      }
      console.log('');
    }

    // 2. Verificar competições e number de times
    console.log('🏆 Verificando estrutura das competições...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active')
      .order('tier');

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    for (const comp of competitions) {
      console.log(`\n📋 ${comp.name} (Série ${comp.tier}):`);
      
      // Contar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          team_id,
          game_teams!inner(name, team_type)
        `)
        .eq('competition_id', comp.id);

      if (teamsError) {
        console.log(`   ❌ Erro ao buscar times: ${teamsError.message}`);
        continue;
      }

      const userTeams = enrolledTeams.filter(t => t.game_teams.team_type === 'user');
      const machineTeams = enrolledTeams.filter(t => t.game_teams.team_type === 'machine');
      
      console.log(`   👥 Times: ${enrolledTeams.length} total (${userTeams.length} usuários + ${machineTeams.length} máquina)`);
      
      // Verificar se tem 20 times como esperado
      if (enrolledTeams.length !== 20) {
        console.log(`   ⚠️ PROBLEMA: Deveria ter 20 times, mas tem ${enrolledTeams.length}`);
      }

      // Contar partidas da competição
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, status')
        .eq('competition_id', comp.id);

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
        continue;
      }

      const expectedMatches = enrolledTeams.length > 0 ? 
        (enrolledTeams.length * (enrolledTeams.length - 1)) : 0; // Turno e returno
      
      console.log(`   ⚽ Partidas: ${matches.length}/${expectedMatches} (esperado para turno e returno)`);
      
      if (matches.length < expectedMatches) {
        console.log(`   ❌ PROBLEMA: Faltam ${expectedMatches - matches.length} partidas!`);
      }

      // Verificar distribuição de partidas por time
      const teamMatchCounts = {};
      for (const match of matches) {
        // Buscar detalhes da partida para saber os times
        const { data: matchDetail, error: detailError } = await supabase
          .from('game_matches')
          .select('home_team_id, away_team_id')
          .eq('id', match.id)
          .single();

        if (!detailError && matchDetail) {
          teamMatchCounts[matchDetail.home_team_id] = (teamMatchCounts[matchDetail.home_team_id] || 0) + 1;
          teamMatchCounts[matchDetail.away_team_id] = (teamMatchCounts[matchDetail.away_team_id] || 0) + 1;
        }
      }

      // Verificar times com jogos a menos
      const expectedGamesPerTeam = (enrolledTeams.length - 1) * 2; // Contra todos os outros, turno e returno
      let teamsWithMissingGames = 0;
      
      for (const team of enrolledTeams) {
        const gameCount = teamMatchCounts[team.team_id] || 0;
        if (gameCount < expectedGamesPerTeam) {
          teamsWithMissingGames++;
          console.log(`   ⚠️ ${team.game_teams.name}: ${gameCount}/${expectedGamesPerTeam} jogos`);
        }
      }

      if (teamsWithMissingGames > 0) {
        console.log(`   ❌ ${teamsWithMissingGames} times com jogos a menos!`);
      }
    }

    // 3. Verificar partidas específicas de usuários problemáticos
    console.log('\n🔍 Analisando usuários com poucos jogos...');
    
    for (const user of problemUsers.slice(0, 3)) { // Analisar os 3 primeiros
      console.log(`\n👤 Usuário ${user.user_id.slice(0, 8)}...:`);
      
      // Buscar time do usuário
      const { data: userTeam, error: teamError } = await supabase
        .from('game_teams')
        .select('id, name')
        .eq('owner_id', user.user_id)
        .single();

      if (teamError) {
        console.log(`   ❌ Erro ao buscar time: ${teamError.message}`);
        continue;
      }

      console.log(`   🏆 Time: ${userTeam.name}`);
      
      // Buscar partidas do usuário
      const { data: userMatches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('season_year', user.season_year)
        .order('round_number');

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
        continue;
      }

      console.log(`   📊 Partidas encontradas: ${userMatches.length}`);
      
      const statusCounts = {};
      userMatches.forEach(match => {
        statusCounts[match.status] = (statusCounts[match.status] || 0) + 1;
      });

      console.log(`   📈 Status das partidas:`, statusCounts);
      
      // Verificar se há buracos nas rodadas
      const rounds = userMatches.map(m => m.round_number).sort((a, b) => a - b);
      const missingRounds = [];
      
      for (let i = 1; i <= 38; i++) {
        if (!rounds.includes(i)) {
          missingRounds.push(i);
        }
      }
      
      if (missingRounds.length > 0) {
        console.log(`   ⚠️ Rodadas faltando: ${missingRounds.slice(0, 10).join(', ')}${missingRounds.length > 10 ? '...' : ''}`);
      }
    }

    console.log('\n✅ Diagnóstico concluído!');
    
    // Sugestões de correção
    console.log('\n💡 SUGESTÕES DE CORREÇÃO:');
    console.log('1. Executar script de correção de calendário');
    console.log('2. Recriar partidas para competições problemáticas');
    console.log('3. Verificar integridade dos times da máquina');
    console.log('4. Corrigir algoritmo de round-robin');

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

function getTierName(tier) {
  const tierNames = {
    1: 'Série A',
    2: 'Série B', 
    3: 'Série C',
    4: 'Série D'
  };
  return tierNames[tier] || `Série ${tier}`;
}

// Executar se chamado diretamente
if (require.main === module) {
  diagnosticarJogosAMenos()
    .then(() => {
      console.log('\n🏁 Script finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { diagnosticarJogosAMenos };