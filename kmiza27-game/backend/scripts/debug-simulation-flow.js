const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script para debugar o fluxo completo de simulação
 */
async function debugSimulationFlow() {
  try {
    console.log('🔍 DEBUG: INVESTIGANDO FLUXO DE SIMULAÇÃO');
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
    
    // 2. VERIFICAR PRÓXIMA PARTIDA AGENDADA
    console.log('\n📅 2. Verificando próxima partida agendada...');
    const { data: nextMatch, error: matchError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('status', 'scheduled')
      .order('round_number', { ascending: true })
      .limit(1)
      .single();
    
    if (matchError) {
      console.log('❌ Erro ao buscar próxima partida:', matchError);
      return;
    }
    
    if (!nextMatch) {
      console.log('ℹ️ Não há partidas agendadas para simular');
      return;
    }
    
    console.log(`✅ Próxima partida encontrada: Rodada ${nextMatch.round_number}`);
    console.log(`   ${nextMatch.home_team_id ? 'PALHOCA' : 'Time da Máquina'} vs ${nextMatch.away_team_id ? 'PALHOCA' : 'Time da Máquina'}`);
    console.log(`   ID da partida: ${nextMatch.id}`);
    console.log(`   Temporada: ${nextMatch.season_year}, Série: ${nextMatch.tier}`);
    
    // 3. VERIFICAR SE EXISTEM TIMES DA MÁQUINA NA SÉRIE
    console.log('\n🤖 3. Verificando times da máquina na série...');
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', nextMatch.tier)
      .eq('is_active', true)
      .order('display_order');
    
    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError);
    } else {
      console.log(`✅ Encontrados ${machineTeams?.length || 0} times da máquina na série ${nextMatch.tier}`);
      
      if (machineTeams && machineTeams.length > 0) {
        console.log('   📊 Primeiros 5 times:');
        machineTeams.slice(0, 5).forEach((team, index) => {
          console.log(`      ${index + 1}. ${team.name} (ID: ${team.id})`);
        });
      }
    }
    
    // 4. VERIFICAR SE EXISTEM ESTATÍSTICAS DOS TIMES DA MÁQUINA
    console.log('\n📊 4. Verificando estatísticas dos times da máquina...');
    const { data: machineStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('tier', nextMatch.tier)
      .limit(5);
    
    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError);
    } else {
      console.log(`✅ Encontradas ${machineStats?.length || 0} estatísticas de times da máquina`);
      
      if (machineStats && machineStats.length > 0) {
        console.log('   📊 Primeiras 3 estatísticas:');
        machineStats.slice(0, 3).forEach((stat, index) => {
          const teamName = stat.team_name || `Time ${stat.team_id.slice(0, 8)}`;
          console.log(`      ${index + 1}. ${teamName}: ${stat.points} pts, ${stat.games_played} jogos`);
        });
      }
    }
    
    // 5. VERIFICAR SE EXISTEM PARTIDAS ENTRE TIMES DA MÁQUINA
    console.log('\n📋 5. Verificando partidas entre times da máquina...');
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
        console.log(`   📊 Rodadas com partidas simuladas: ${roundsWithMatches.join(', ')}`);
      }
    }
    
    // 6. VERIFICAR SE A FUNÇÃO simulateEntireRound EXISTE NO BACKEND
    console.log('\n🔧 6. Verificando se a função simulateEntireRound existe...');
    console.log('   ℹ️ Esta verificação requer acesso ao código fonte do backend');
    console.log('   📁 Arquivo: backend/src/modules/seasons/seasons.service.ts');
    console.log('   🔍 Função: simulateEntireRound()');
    
    // 7. RECOMENDAÇÕES
    console.log('\n💡 7. RECOMENDAÇÕES PARA CORREÇÃO:');
    console.log('   🔧 1. Verificar se a função simulateEntireRound() está sendo chamada');
    console.log('   🔧 2. Verificar se há erros nos logs do backend');
    console.log('   🔧 3. Verificar se a tabela game_user_machine_team_stats está correta');
    console.log('   🔧 4. Verificar se os times da máquina têm tier correto');
    
    console.log('\n🔍 DEBUG COMPLETO!');
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  debugSimulationFlow()
    .then(() => {
      console.log('\n✅ Script de debug executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { debugSimulationFlow };
