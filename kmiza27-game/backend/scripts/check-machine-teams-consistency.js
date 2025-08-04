const { getSupabaseClient } = require('../config/supabase-connection');

async function checkMachineTeamsConsistency() {
  try {
    console.log('🧪 VERIFICAÇÃO: Consistência dos jogos dos times da máquina\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Buscar todas as estatísticas de times da máquina (dados mais recentes)
    console.log('1️⃣ Buscando estatísticas de times da máquina...');
    const { data: machineStats } = await supabase
      .from('game_user_machine_team_stats')
      .select('user_id, season_year, tier, machine_team_name, points, games_played, wins, draws, losses')
      .order('season_year', { ascending: false })
      .order('user_id')
      .order('tier');
    
    if (!machineStats || machineStats.length === 0) {
      console.log('❌ Nenhuma estatística de times da máquina encontrada');
      return;
    }
    
    console.log(`✅ Encontradas ${machineStats.length} estatísticas de times da máquina`);
    
    // 2. Agrupar por usuário e temporada
    const groups = {};
    machineStats.forEach(stat => {
      const key = `${stat.user_id}-${stat.season_year}-${stat.tier}`;
      if (!groups[key]) {
        groups[key] = {
          user_id: stat.user_id,
          season_year: stat.season_year,
          tier: stat.tier,
          teams: []
        };
      }
      groups[key].teams.push(stat);
    });
    
    console.log(`✅ Encontrados ${Object.keys(groups).length} grupos (usuário-temporada-série)`);
    
    // 3. Analisar consistência de cada grupo
    console.log('\n2️⃣ Analisando consistência por grupo...\n');
    
    let totalGroups = 0;
    let consistentGroups = 0;
    let inconsistentGroups = 0;
    
    Object.values(groups).forEach(group => {
      totalGroups++;
      
      const games = group.teams.map(t => t.games_played);
      const minGames = Math.min(...games);
      const maxGames = Math.max(...games);
      const gamesRange = maxGames - minGames;
      
      const isConsistent = gamesRange <= 1; // Diferença máxima de 1 jogo é aceitável
      
      if (isConsistent) {
        consistentGroups++;
      } else {
        inconsistentGroups++;
      }
      
      const tierName = getTierName(group.tier);
      const userId = group.user_id.substring(0, 8);
      
      console.log(`${isConsistent ? '✅' : '❌'} User ${userId}... | Temporada ${group.season_year} | Série ${tierName}`);
      console.log(`   Times: ${group.teams.length} | Jogos: ${minGames}-${maxGames} (diff: ${gamesRange})`);
      
      if (!isConsistent) {
        // Mostrar detalhes do problema
        const gamesCounts = {};
        games.forEach(g => {
          gamesCounts[g] = (gamesCounts[g] || 0) + 1;
        });
        
        console.log('   📊 Distribuição:');
        Object.keys(gamesCounts)
          .sort((a, b) => parseInt(b) - parseInt(a))
          .forEach(gamesCount => {
            console.log(`      ${gamesCount} jogos: ${gamesCounts[gamesCount]} times`);
          });
      }
      
      console.log('');
    });
    
    // 4. Resumo geral
    console.log('🎯 RESUMO GERAL:');
    console.log(`   Total de grupos analisados: ${totalGroups}`);
    console.log(`   Grupos consistentes: ${consistentGroups} (${((consistentGroups/totalGroups)*100).toFixed(1)}%)`);
    console.log(`   Grupos inconsistentes: ${inconsistentGroups} (${((inconsistentGroups/totalGroups)*100).toFixed(1)}%)`);
    
    if (inconsistentGroups === 0) {
      console.log('\n✅ EXCELENTE! Todos os grupos estão consistentes');
      console.log('✅ A correção do algoritmo round-robin funcionou perfeitamente!');
    } else if (inconsistentGroups <= totalGroups * 0.1) {
      console.log('\n⚠️ BOA! Apenas poucos grupos inconsistentes (pode ser temporadas antigas)');
      console.log('✅ A correção parece estar funcionando para temporadas novas');
    } else {
      console.log('\n❌ PROBLEMA! Muitos grupos ainda inconsistentes');
      console.log('❌ A correção pode não estar sendo aplicada corretamente');
    }
    
    // 5. Verificar se há grupos com muitos jogos (indicativo de temporadas avançadas)
    const advancedGroups = Object.values(groups).filter(group => {
      const maxGames = Math.max(...group.teams.map(t => t.games_played));
      return maxGames >= 30; // Temporadas próximas do final
    });
    
    if (advancedGroups.length > 0) {
      console.log('\n🔍 GRUPOS COM TEMPORADAS AVANÇADAS (30+ jogos):');
      advancedGroups.forEach(group => {
        const games = group.teams.map(t => t.games_played);
        const minGames = Math.min(...games);
        const maxGames = Math.max(...games);
        const gamesRange = maxGames - minGames;
        const isConsistent = gamesRange <= 1;
        
        console.log(`${isConsistent ? '✅' : '❌'} User ${group.user_id.substring(0, 8)}... | Temporada ${group.season_year} | Série ${getTierName(group.tier)} | Jogos: ${minGames}-${maxGames}`);
      });
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
checkMachineTeamsConsistency();