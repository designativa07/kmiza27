const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script de debug para investigar a estrutura das tabelas
 * e entender por que a simulação automática não está funcionando
 */
async function debugMachineTeamsStructure() {
  try {
    console.log('🔍 DEBUG: INVESTIGANDO ESTRUTURA DAS TABELAS');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR ESTRUTURA DA TABELA game_user_competition_progress
    console.log('\n📋 1. Verificando estrutura de game_user_competition_progress...');
    const { data: progressSample, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .limit(5);
    
    if (progressError) {
      console.log('❌ Erro ao buscar progresso:', progressError);
    } else {
      console.log(`✅ Encontrados ${progressSample?.length || 0} registros de progresso`);
      if (progressSample && progressSample.length > 0) {
        console.log('📊 Exemplo de registro:', JSON.stringify(progressSample[0], null, 2));
      }
    }
    
    // 2. VERIFICAR ESTRUTURA DA TABELA game_season_matches
    console.log('\n📋 2. Verificando estrutura de game_season_matches...');
    const { data: matchesSample, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .limit(5);
    
    if (matchesError) {
      console.log('❌ Erro ao buscar partidas:', matchesError);
    } else {
      console.log(`✅ Encontrados ${matchesSample?.length || 0} registros de partidas`);
      if (matchesSample && matchesSample.length > 0) {
        console.log('📊 Exemplo de registro:', JSON.stringify(matchesSample[0], null, 2));
      }
    }
    
    // 3. VERIFICAR TIMES DA MÁQUINA
    console.log('\n📋 3. Verificando times da máquina...');
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', 4) // Série D
      .limit(5);
    
    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError);
    } else {
      console.log(`✅ Encontrados ${machineTeams?.length || 0} times da máquina na Série D`);
      if (machineTeams && machineTeams.length > 0) {
        console.log('📊 Exemplo de time:', JSON.stringify(machineTeams[0], null, 2));
      }
    }
    
    // 4. VERIFICAR ESTATÍSTICAS DOS TIMES DA MÁQUINA
    console.log('\n📋 4. Verificando estatísticas dos times da máquina...');
    const { data: machineStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .limit(5);
    
    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError);
    } else {
      console.log(`✅ Encontrados ${machineStats?.length || 0} registros de estatísticas`);
      if (machineStats && machineStats.length > 0) {
        console.log('📊 Exemplo de estatística:', JSON.stringify(machineStats[0], null, 2));
      }
    }
    
    // 5. VERIFICAR USUÁRIO ESPECÍFICO (PALHOCA)
    console.log('\n📋 5. Verificando usuário PALHOCA especificamente...');
    const { data: palhocaTeam, error: palhocaError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('name', 'PALHOCA')
      .single();
    
    if (palhocaError) {
      console.log('❌ Erro ao buscar time PALHOCA:', palhocaError);
    } else if (palhocaTeam) {
      console.log('✅ Time PALHOCA encontrado:', JSON.stringify(palhocaTeam, null, 2));
      
      // Verificar progresso deste usuário
      const { data: palhocaProgress, error: palhocaProgressError } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .eq('user_id', palhocaTeam.owner_id)
        .limit(5);
      
      if (palhocaProgressError) {
        console.log('❌ Erro ao buscar progresso do PALHOCA:', palhocaProgressError);
      } else {
        console.log(`📊 Progresso do PALHOCA: ${palhocaProgress?.length || 0} registros`);
        if (palhocaProgress && palhocaProgress.length > 0) {
          console.log('📊 Dados de progresso:', JSON.stringify(palhocaProgress, null, 2));
        }
      }
      
      // Verificar partidas deste usuário
      const { data: palhocaMatches, error: palhocaMatchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', palhocaTeam.owner_id)
        .limit(10);
      
      if (palhocaMatchesError) {
        console.log('❌ Erro ao buscar partidas do PALHOCA:', palhocaMatchesError);
      } else {
        console.log(`📊 Partidas do PALHOCA: ${palhocaMatches?.length || 0} registros`);
        if (palhocaMatches && palhocaMatches.length > 0) {
          console.log('📊 Exemplo de partida:', JSON.stringify(palhocaMatches[0], null, 2));
        }
      }
    }
    
    // 6. VERIFICAR SE EXISTEM PARTIDAS ENTRE TIMES DA MÁQUINA
    console.log('\n📋 6. Verificando partidas entre times da máquina...');
    const { data: machineMatches, error: machineMatchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .not('home_machine_team_id', 'is', null)
      .not('away_machine_team_id', 'is', null)
      .limit(5);
    
    if (machineMatchesError) {
      console.log('❌ Erro ao buscar partidas da máquina:', machineMatchesError);
    } else {
      console.log(`✅ Encontradas ${machineMatches?.length || 0} partidas entre times da máquina`);
      if (machineMatches && machineMatches.length > 0) {
        console.log('📊 Exemplo de partida da máquina:', JSON.stringify(machineMatches[0], null, 2));
      }
    }
    
    console.log('\n🔍 DEBUG COMPLETO! Verifique os dados acima para identificar o problema.');
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  debugMachineTeamsStructure()
    .then(() => {
      console.log('\n✅ Script de debug executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { debugMachineTeamsStructure };
