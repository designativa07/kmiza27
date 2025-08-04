const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixUserProgress() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🔧 Corrigindo progresso do usuário...');
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

      // 2. Zerar o progresso atual
      console.log('\n🔄 Zerando progresso atual...');
      const { error: updateError } = await supabase
        .from('game_user_competition_progress')
        .update({
          points: 0,
          games_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          position: 0
        })
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('current_tier', progress.current_tier);

      if (updateError) {
        console.error('❌ Erro ao zerar progresso:', updateError);
        return;
      }

      console.log('✅ Progresso zerado com sucesso');

      // 3. Zerar estatísticas dos times da máquina
      console.log('\n🤖 Zerando estatísticas dos times da máquina...');
      const { error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .update({
          points: 0,
          games_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0
        })
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);

      if (statsError) {
        console.error('❌ Erro ao zerar estatísticas:', statsError);
      } else {
        console.log('✅ Estatísticas dos times da máquina zeradas');
      }

      // 4. Verificar se há partidas já jogadas que precisam ser resetadas
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
        const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'simulated');
        console.log(`✅ Encontradas ${matches?.length || 0} partidas na temporada`);
        console.log(`   Partidas finalizadas: ${finishedMatches.length}`);
        console.log(`   Partidas agendadas: ${matches.length - finishedMatches.length}`);

        if (finishedMatches.length > 0) {
          console.log('⚠️ Há partidas já jogadas que precisam ser resetadas');
          
          // Resetar partidas finalizadas para agendadas
          const { error: resetError } = await supabase
            .from('game_season_matches')
            .update({
              status: 'scheduled',
              home_score: 0,
              away_score: 0
            })
            .eq('user_id', userId)
            .eq('season_year', progress.season_year)
            .eq('tier', progress.current_tier)
            .in('status', ['finished', 'simulated']);

          if (resetError) {
            console.error('❌ Erro ao resetar partidas:', resetError);
          } else {
            console.log('✅ Partidas resetadas para agendadas');
          }
        }
      }

      // 5. Verificar resultado final
      console.log('\n🔍 Verificando resultado final...');
      const { data: finalProgress, error: finalError } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('current_tier', progress.current_tier);

      if (finalError) {
        console.error('❌ Erro ao verificar progresso final:', finalError);
      } else if (finalProgress && finalProgress.length > 0) {
        const final = finalProgress[0];
        console.log('✅ Progresso final:');
        console.log(`   Pontos: ${final.points}`);
        console.log(`   Jogos: ${final.games_played}/38`);
        console.log(`   Vitórias: ${final.wins}`);
        console.log(`   Empates: ${final.draws}`);
        console.log(`   Derrotas: ${final.losses}`);
        console.log(`   Gols Pró: ${final.goals_for}`);
        console.log(`   Gols Contra: ${final.goals_against}`);
      }

      console.log('\n🎉 Correção concluída com sucesso!');
      console.log('   - Progresso zerado');
      console.log('   - Estatísticas dos times da máquina zeradas');
      console.log('   - Partidas resetadas para agendadas');
      console.log('   - Usuário pode começar a nova temporada do zero');

    } else {
      console.log('❌ Nenhum progresso encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixUserProgress(); 