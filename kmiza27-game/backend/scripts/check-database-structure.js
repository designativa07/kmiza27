const { getSupabaseClient } = require('../config/supabase-connection');

async function checkDatabaseStructure() {
  try {
    console.log('🧪 VERIFICAÇÃO: Estrutura do banco de dados\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar tabela de times de usuários
    console.log('1️⃣ Verificando tabela game_teams...');
    try {
      const { data: teams, error: teamsError } = await supabase
        .from('game_teams')
        .select('*')
        .limit(5);
      
      if (teamsError) {
        console.log(`❌ Erro ao acessar game_teams: ${teamsError.message}`);
      } else {
        console.log(`✅ game_teams: ${teams?.length || 0} registros encontrados`);
        if (teams && teams.length > 0) {
          console.log('   Colunas:', Object.keys(teams[0]).join(', '));
        }
      }
    } catch (error) {
      console.log(`❌ Tabela game_teams não acessível: ${error.message}`);
    }
    
    // 2. Verificar tabela de progresso de usuários
    console.log('\n2️⃣ Verificando tabela game_user_competition_progress...');
    try {
      const { data: progress, error: progressError } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .limit(5);
      
      if (progressError) {
        console.log(`❌ Erro ao acessar game_user_competition_progress: ${progressError.message}`);
      } else {
        console.log(`✅ game_user_competition_progress: ${progress?.length || 0} registros encontrados`);
        if (progress && progress.length > 0) {
          console.log('   Colunas:', Object.keys(progress[0]).join(', '));
          
          // Mostrar dados dos usuários
          console.log('\n   📊 Usuários encontrados:');
          progress.forEach((p, index) => {
            console.log(`      ${index + 1}. User: ${p.user_id?.substring(0, 8)}... | Temporada: ${p.season_year} | Série: ${getTierName(p.current_tier)} | Jogos: ${p.games_played}/38`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Tabela game_user_competition_progress não acessível: ${error.message}`);
    }
    
    // 3. Verificar tabela de times da máquina
    console.log('\n3️⃣ Verificando tabela game_machine_teams...');
    try {
      const { data: machineTeams, error: machineError } = await supabase
        .from('game_machine_teams')
        .select('*')
        .limit(5);
      
      if (machineError) {
        console.log(`❌ Erro ao acessar game_machine_teams: ${machineError.message}`);
      } else {
        console.log(`✅ game_machine_teams: ${machineTeams?.length || 0} registros encontrados`);
        if (machineTeams && machineTeams.length > 0) {
          console.log('   Colunas:', Object.keys(machineTeams[0]).join(', '));
          
          // Contar por série
          const tierCounts = {};
          machineTeams.forEach(team => {
            tierCounts[team.tier] = (tierCounts[team.tier] || 0) + 1;
          });
          
          console.log('\n   📊 Times da máquina por série:');
          Object.keys(tierCounts).sort().forEach(tier => {
            console.log(`      Série ${getTierName(tier)}: ${tierCounts[tier]} times`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Tabela game_machine_teams não acessível: ${error.message}`);
    }
    
    // 4. Verificar tabela de partidas
    console.log('\n4️⃣ Verificando tabela game_season_matches...');
    try {
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .limit(5);
      
      if (matchesError) {
        console.log(`❌ Erro ao acessar game_season_matches: ${matchesError.message}`);
      } else {
        console.log(`✅ game_season_matches: ${matches?.length || 0} registros encontrados`);
        if (matches && matches.length > 0) {
          console.log('   Colunas:', Object.keys(matches[0]).join(', '));
          
          // Mostrar partidas mais recentes
          console.log('\n   📊 Partidas mais recentes:');
          matches.forEach((match, index) => {
            const userId = match.user_id?.substring(0, 8);
            console.log(`      ${index + 1}. User: ${userId}... | Temporada: ${match.season_year} | Rodada: ${match.round_number} | Status: ${match.status}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Tabela game_season_matches não acessível: ${error.message}`);
    }
    
    // 5. Verificar tabela de estatísticas dos times da máquina
    console.log('\n5️⃣ Verificando tabela game_user_machine_team_stats...');
    try {
      const { data: stats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('*')
        .limit(5);
      
      if (statsError) {
        console.log(`❌ Erro ao acessar game_user_machine_team_stats: ${statsError.message}`);
      } else {
        console.log(`✅ game_user_machine_team_stats: ${stats?.length || 0} registros encontrados`);
        if (stats && stats.length > 0) {
          console.log('   Colunas:', Object.keys(stats[0]).join(', '));
        }
      }
    } catch (error) {
      console.log(`❌ Tabela game_user_machine_team_stats não acessível: ${error.message}`);
    }
    
    // 6. Verificar outras tabelas possíveis
    console.log('\n6️⃣ Verificando outras tabelas...');
    
    const tablesToCheck = [
      'teams',
      'user_teams',
      'game_user_teams',
      'users',
      'profiles'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ ${tableName}: ${data.length > 0 ? 'com dados' : 'vazia'}`);
          if (data.length > 0) {
            console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (error) {
        // Tabela não existe, ignorar
      }
    }
    
    console.log('\n🎯 RESUMO:');
    console.log('Se você acabou de criar um time:');
    console.log('1. Verifique se o processo de criação foi concluído');
    console.log('2. Acesse o jogo pelo navegador para confirmar');
    console.log('3. Simule uma partida para gerar estatísticas');
    console.log('4. Execute novamente o teste de consistência');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

// Executar verificação
checkDatabaseStructure();