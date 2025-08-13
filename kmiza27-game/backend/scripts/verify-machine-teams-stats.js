const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script para verificar se as estatísticas dos times da máquina foram atualizadas
 */
async function verifyMachineTeamsStats() {
  try {
    console.log('🔍 VERIFICANDO ESTATÍSTICAS DOS TIMES DA MÁQUINA');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR USUÁRIO PALHOCA
    console.log('\n👤 1. Verificando usuário PALHOCA...');
    const { data: palhocaTeam, error: palhocaError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('name', 'PALHOCA')
      .single();
    
    if (palhocaError) {
      console.log('❌ Erro ao buscar time PALHOCA:', palhocaError);
      return;
    }
    
    console.log(`✅ Time PALHOCA encontrado: ${palhocaTeam.name} (ID: ${palhocaTeam.owner_id})`);
    
    // 2. VERIFICAR ESTATÍSTICAS DOS TIMES DA MÁQUINA PARA PALHOCA
    console.log('\n📊 2. Verificando estatísticas dos times da máquina...');
    const { data: machineStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('tier', 4)
      .order('points', { ascending: false });
    
    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError);
      return;
    }
    
    console.log(`✅ Encontradas ${machineStats?.length || 0} estatísticas de times da máquina`);
    
    if (machineStats && machineStats.length > 0) {
      console.log('\n🏆 CLASSIFICAÇÃO DOS TIMES DA MÁQUINA (Série D - Temporada 2025):');
      console.log('=' .repeat(80));
      console.log('POS | TIME                    | PTS | J | V | E | D | GP | GC | SG');
      console.log('=' .repeat(80));
      
      machineStats.forEach((stat, index) => {
        const pos = index + 1;
        const teamName = stat.team_name || `Time ${stat.team_id.slice(0, 8)}`;
        const sg = stat.goals_for - stat.goals_against;
        const sgStr = sg >= 0 ? `+${sg}` : `${sg}`;
        
        console.log(`${pos.toString().padStart(3)} | ${teamName.padEnd(22)} | ${stat.points.toString().padStart(3)} | ${stat.games_played.toString().padStart(1)} | ${stat.wins.toString().padStart(1)} | ${stat.draws.toString().padStart(1)} | ${stat.losses.toString().padStart(1)} | ${stat.goals_for.toString().padStart(2)} | ${stat.goals_against.toString().padStart(2)} | ${sgStr.padStart(3)}`);
      });
      
      // Verificar se todos os times têm 26 jogos
      const teamsWith26Games = machineStats.filter(stat => stat.games_played === 26);
      const teamsWithLessGames = machineStats.filter(stat => stat.games_played < 26);
      
      console.log(`\n📈 RESUMO:`);
      console.log(`   ✅ Times com 26 jogos: ${teamsWith26Games.length}`);
      console.log(`   ⚠️ Times com menos de 26 jogos: ${teamsWithLessGames.length}`);
      
      if (teamsWithLessGames.length > 0) {
        console.log(`\n⚠️ TIMES COM JOGOS INCOMPLETOS:`);
        teamsWithLessGames.forEach(stat => {
          const teamName = stat.team_name || `Time ${stat.team_id.slice(0, 8)}`;
          console.log(`   • ${teamName}: ${stat.games_played}/26 jogos`);
        });
      }
      
    } else {
      console.log('❌ Nenhuma estatística encontrada para os times da máquina');
    }
    
    // 3. VERIFICAR SE EXISTEM PARTIDAS ENTRE TIMES DA MÁQUINA
    console.log('\n📋 3. Verificando partidas entre times da máquina...');
    const { data: machineMatches, error: machineMatchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .not('home_machine_team_id', 'is', null)
      .not('away_machine_team_id', 'is', null)
      .order('round_number', { ascending: true });
    
    if (machineMatchesError) {
      console.log('❌ Erro ao buscar partidas da máquina:', machineMatchesError);
    } else {
      console.log(`✅ Encontradas ${machineMatches?.length || 0} partidas entre times da máquina`);
      
      if (machineMatches && machineMatches.length > 0) {
        const roundsWithMatches = [...new Set(machineMatches.map(m => m.round_number))];
        console.log(`📊 Rodadas com partidas simuladas: ${roundsWithMatches.join(', ')}`);
        
        // Verificar se todas as rodadas 1-26 têm partidas
        const expectedRounds = Array.from({length: 26}, (_, i) => i + 1);
        const missingRounds = expectedRounds.filter(round => !roundsWithMatches.includes(round));
        
        if (missingRounds.length === 0) {
          console.log('✅ Todas as rodadas 1-26 têm partidas simuladas!');
        } else {
          console.log(`⚠️ Rodadas faltando partidas: ${missingRounds.join(', ')}`);
        }
      }
    }
    
    console.log('\n🔍 VERIFICAÇÃO COMPLETA!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  verifyMachineTeamsStats()
    .then(() => {
      console.log('\n✅ Script de verificação executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { verifyMachineTeamsStats };
