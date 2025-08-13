const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script para testar se a simulação automática dos times da máquina está funcionando
 */
async function testAutoSimulation() {
  try {
    console.log('🧪 TESTANDO SIMULAÇÃO AUTOMÁTICA DOS TIMES DA MÁQUINA');
    console.log('=' .repeat(70));
    
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
    
    console.log(`✅ Time PALHOCA encontrado: ${palhocaTeam.name}`);
    
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
    
    // 3. SIMULAR A PARTIDA
    console.log('\n🎮 3. Simulando partida...');
    
    // Simular resultado simples
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    
    const { error: updateError } = await supabase
      .from('game_season_matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished',
        highlights: [`${homeScore}x${awayScore} - Partida simulada para teste`],
        simulation_data: {
          test: true,
          home_score: homeScore,
          away_score: awayScore
        }
      })
      .eq('id', nextMatch.id);
    
    if (updateError) {
      console.log('❌ Erro ao simular partida:', updateError);
      return;
    }
    
    console.log(`✅ Partida simulada: ${homeScore}x${awayScore}`);
    
    // 4. VERIFICAR SE A SIMULAÇÃO AUTOMÁTICA FUNCIONOU
    console.log('\n🔍 4. Verificando se a simulação automática funcionou...');
    
    // Aguardar um pouco para o backend processar
    console.log('   ⏳ Aguardando processamento do backend...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se foram criadas partidas entre times da máquina para esta rodada
    const { data: machineMatches, error: machineError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('round_number', nextMatch.round_number)
      .not('home_machine_team_id', 'is', null)
      .not('away_machine_team_id', 'is', null);
    
    if (machineError) {
      console.log('❌ Erro ao verificar partidas da máquina:', machineError);
    } else {
      console.log(`✅ Encontradas ${machineMatches?.length || 0} partidas entre times da máquina para a rodada ${nextMatch.round_number}`);
      
      if (machineMatches && machineMatches.length > 0) {
        console.log('   📊 Partidas simuladas:');
        machineMatches.forEach((match, index) => {
          const homeTeam = match.home_machine_team_id ? `Time ${match.home_machine_team_id.slice(0, 8)}` : 'PALHOCA';
          const awayTeam = match.away_machine_team_id ? `Time ${match.away_machine_team_id.slice(0, 8)}` : 'PALHOCA';
          console.log(`      ${index + 1}. ${homeTeam} ${match.home_score}x${match.away_score} ${awayTeam}`);
        });
      } else {
        console.log('   ⚠️ Nenhuma partida entre times da máquina foi simulada automaticamente');
        console.log('   🔧 Isso indica que a simulação automática não está funcionando no backend');
      }
    }
    
    // 5. VERIFICAR ESTATÍSTICAS ATUALIZADAS
    console.log('\n📊 5. Verificando estatísticas atualizadas...');
    const { data: updatedStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('tier', 4)
      .order('points', { ascending: false })
      .limit(5);
    
    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas atualizadas:', statsError);
    } else {
      console.log(`✅ Top 5 times da máquina:`);
      updatedStats.forEach((stat, index) => {
        const teamName = stat.team_name || `Time ${stat.team_id.slice(0, 8)}`;
        console.log(`   ${index + 1}. ${teamName}: ${stat.points} pts, ${stat.games_played} jogos`);
      });
    }
    
    console.log('\n🧪 TESTE COMPLETO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  testAutoSimulation()
    .then(() => {
      console.log('\n✅ Script de teste executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { testAutoSimulation };
