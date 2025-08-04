const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testStartNewSeason() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🧪 Testando funcionalidade de iniciar nova temporada...');
  console.log(`👤 Usuário: ${userId}`);

  try {
    // 1. Verificar progresso atual
    console.log('\n📊 Verificando progresso atual...');
    const { data: currentProgress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false })
      .limit(1);

    if (progressError) {
      console.error('❌ Erro ao buscar progresso:', progressError);
      return;
    }

    if (currentProgress && currentProgress.length > 0) {
      const progress = currentProgress[0];
      console.log('✅ Progresso atual encontrado:');
      console.log(`   Temporada: ${progress.season_year}`);
      console.log(`   Série: ${progress.current_tier}`);
      console.log(`   Pontos: ${progress.points}`);
      console.log(`   Jogos: ${progress.games_played}/38`);
      console.log(`   Status: ${progress.season_status}`);

      // 2. Verificar estatísticas dos times da máquina
      console.log('\n🤖 Verificando estatísticas dos times da máquina...');
      const { data: machineStats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);

      if (statsError) {
        console.error('❌ Erro ao buscar estatísticas:', statsError);
      } else {
        console.log(`✅ Encontradas ${machineStats?.length || 0} estatísticas de times da máquina`);
        if (machineStats && machineStats.length > 0) {
          console.log('   Exemplo de estatística:');
          console.log(`   Time: ${machineStats[0].team_name}`);
          console.log(`   Pontos: ${machineStats[0].points}`);
          console.log(`   Jogos: ${machineStats[0].games_played}`);
        }
      }

      // 3. Verificar partidas da temporada
      console.log('\n⚽ Verificando partidas da temporada...');
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);

      if (matchesError) {
        console.error('❌ Erro ao buscar partidas:', matchesError);
      } else {
        console.log(`✅ Encontradas ${matches?.length || 0} partidas na temporada`);
        if (matches && matches.length > 0) {
          const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'simulated');
          console.log(`   Partidas finalizadas: ${finishedMatches.length}`);
          console.log(`   Partidas agendadas: ${matches.length - finishedMatches.length}`);
        }
      }

      // 4. Simular chamada para iniciar nova temporada
      console.log('\n🔄 Simulando chamada para iniciar nova temporada...');
      
      const nextSeasonYear = progress.season_year + 1;
      console.log(`   Nova temporada será: ${nextSeasonYear}`);
      console.log(`   Série permanecerá: ${progress.current_tier}`);

      // 5. Verificar se já existe progresso para a nova temporada
      console.log('\n🔍 Verificando se já existe progresso para nova temporada...');
      const { data: nextProgress, error: nextProgressError } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', nextSeasonYear);

      if (nextProgressError) {
        console.error('❌ Erro ao verificar próxima temporada:', nextProgressError);
      } else {
        if (nextProgress && nextProgress.length > 0) {
          console.log('⚠️ Já existe progresso para a nova temporada!');
          console.log(`   Pontos: ${nextProgress[0].points}`);
          console.log(`   Jogos: ${nextProgress[0].games_played}`);
        } else {
          console.log('✅ Não existe progresso para a nova temporada (correto)');
        }
      }

      console.log('\n📋 Resumo do teste:');
      console.log(`   Usuário: ${userId}`);
      console.log(`   Temporada atual: ${progress.season_year}`);
      console.log(`   Série: ${progress.current_tier}`);
      console.log(`   Jogos jogados: ${progress.games_played}/38`);
      console.log(`   Status: ${progress.season_status}`);
      
      if (progress.games_played >= 38) {
        console.log('✅ Temporada está completa - botão deve aparecer');
      } else {
        console.log('❌ Temporada não está completa - botão não deve aparecer');
      }
    } else {
      console.log('❌ Nenhum progresso encontrado');
      return;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testStartNewSeason(); 