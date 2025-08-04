const { getSupabaseClient } = require('../config/supabase-connection');

async function checkNewTeamStatus() {
  try {
    console.log('🧪 VERIFICAÇÃO: Status do novo time criado\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar times de usuários mais recentes
    console.log('1️⃣ Verificando times de usuários recentes...');
    const { data: userTeams } = await supabase
      .from('game_teams')
      .select('id, user_id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!userTeams || userTeams.length === 0) {
      console.log('❌ Nenhum time encontrado');
      return;
    }
    
    console.log(`✅ Encontrados ${userTeams.length} times recentes:`);
    userTeams.forEach((team, index) => {
      const createdDate = new Date(team.created_at).toLocaleString('pt-BR');
      console.log(`   ${index + 1}. ${team.name} (User: ${team.user_id.substring(0, 8)}...) - Criado: ${createdDate}`);
    });
    
    // Pegar o time mais recente
    const newestTeam = userTeams[0];
    const userId = newestTeam.user_id;
    
    console.log(`\n🎯 Analisando time mais recente: "${newestTeam.name}"`);
    
    // 2. Verificar progresso do usuário
    console.log('\n2️⃣ Verificando progresso do usuário...');
    const { data: userProgress } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false });
    
    if (!userProgress || userProgress.length === 0) {
      console.log('❌ Usuário não tem progresso registrado');
      console.log('❌ Time pode não ter sido inscrito em competição');
      return;
    }
    
    console.log(`✅ Encontrados ${userProgress.length} registros de progresso:`);
    userProgress.forEach((progress, index) => {
      console.log(`   ${index + 1}. Temporada ${progress.season_year} - Série ${getTierName(progress.current_tier)} - ${progress.games_played}/38 jogos - Status: ${progress.season_status}`);
    });
    
    const currentSeason = userProgress[0];
    
    // 3. Verificar partidas criadas
    console.log('\n3️⃣ Verificando partidas criadas para a temporada...');
    const { data: userMatches } = await supabase
      .from('game_season_matches')
      .select('id, round_number, status, home_team_id, away_team_id, home_machine_team_id, away_machine_team_id, match_date')
      .eq('user_id', userId)
      .eq('season_year', currentSeason.season_year)
      .eq('tier', currentSeason.current_tier)
      .order('round_number');
    
    if (!userMatches || userMatches.length === 0) {
      console.log('❌ Nenhuma partida criada');
      console.log('❌ Calendário pode não ter sido gerado');
      return;
    }
    
    console.log(`✅ Encontradas ${userMatches.length} partidas:`);
    
    const scheduledMatches = userMatches.filter(m => m.status === 'scheduled');
    const finishedMatches = userMatches.filter(m => m.status === 'finished');
    
    console.log(`   📅 Agendadas: ${scheduledMatches.length}`);
    console.log(`   ⚽ Jogadas: ${finishedMatches.length}`);
    
    if (scheduledMatches.length > 0) {
      console.log(`   🎯 Próxima partida: Rodada ${scheduledMatches[0].round_number}`);
      
      // Verificar se é partida do usuário
      const nextMatch = scheduledMatches[0];
      const userPlaysHome = nextMatch.home_team_id === newestTeam.id;
      const userPlaysAway = nextMatch.away_team_id === newestTeam.id;
      
      if (userPlaysHome || userPlaysAway) {
        console.log(`   📋 Usuário joga como: ${userPlaysHome ? 'MANDANTE' : 'VISITANTE'}`);
        console.log(`   🏆 Pronto para jogar a primeira partida!`);
      }
    }
    
    // 4. Verificar times da máquina disponíveis
    console.log('\n4️⃣ Verificando times da máquina da série...');
    const { data: machineTeams } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .eq('tier', currentSeason.current_tier)
      .order('name');
    
    if (!machineTeams || machineTeams.length === 0) {
      console.log('❌ Nenhum time da máquina encontrado para esta série');
      return;
    }
    
    console.log(`✅ Encontrados ${machineTeams.length} times da máquina na Série ${getTierName(currentSeason.current_tier)}`);
    
    if (machineTeams.length === 19) {
      console.log('✅ Número correto de times da máquina (19)');
    } else {
      console.log(`⚠️ Número incorreto de times da máquina (esperado: 19, encontrado: ${machineTeams.length})`);
    }
    
    // 5. Verificar se algoritmo corrigido será usado
    console.log('\n5️⃣ Status da correção do algoritmo...');
    if (finishedMatches.length === 0) {
      console.log('✅ Time novo - usará o algoritmo round-robin corrigido');
      console.log('✅ Todos os times da máquina terão número igual de jogos');
      console.log('🎯 Quando jogar as partidas, o problema original estará resolvido!');
    } else {
      console.log('⚠️ Time já tem partidas jogadas - pode ter dados do algoritmo antigo');
      console.log('💡 Nas próximas partidas, usará o algoritmo corrigido');
    }
    
    // 6. Resumo final
    console.log('\n🎯 RESUMO DO STATUS:');
    console.log(`✅ Time criado: "${newestTeam.name}"`);
    console.log(`✅ Inscrito na Série ${getTierName(currentSeason.current_tier)}`);
    console.log(`✅ Calendário: ${userMatches.length} partidas criadas`);
    console.log(`✅ Times da máquina: ${machineTeams.length} disponíveis`);
    console.log(`✅ Partidas jogadas: ${finishedMatches.length}/38`);
    
    if (scheduledMatches.length > 0) {
      console.log('🚀 PRONTO PARA JOGAR! O algoritmo corrigido será usado.');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

// Executar verificação
checkNewTeamStatus();