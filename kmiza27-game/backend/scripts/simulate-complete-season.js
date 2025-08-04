const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function simulateCompleteSeason() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🎮 Simulando temporada completa...');
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

      // 2. Simular uma temporada completa (38 jogos)
      console.log('\n🔄 Simulando 38 jogos para completar a temporada...');
      
      // Atualizar progresso para simular temporada completa
      const { error: updateError } = await supabase
        .from('game_user_competition_progress')
        .update({
          games_played: 38,
          points: 55, // Pontos típicos de uma temporada
          wins: 15,
          draws: 10,
          losses: 13,
          goals_for: 45,
          goals_against: 42,
          position: 7 // Posição típica (fora da zona de promoção)
        })
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('current_tier', progress.current_tier);

      if (updateError) {
        console.error('❌ Erro ao atualizar progresso:', updateError);
        return;
      }

      console.log('✅ Progresso atualizado para temporada completa');

      // 3. Simular partidas finalizadas
      console.log('\n⚽ Simulando partidas finalizadas...');
      
      // Buscar partidas da temporada
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier)
        .order('round_number', { ascending: true })
        .limit(38); // Apenas as primeiras 38 partidas

      if (matchesError) {
        console.error('❌ Erro ao buscar partidas:', matchesError);
        return;
      }

      if (matches && matches.length > 0) {
        console.log(`✅ Encontradas ${matches.length} partidas para simular`);
        
        // Simular resultados para as primeiras 38 partidas
        for (let i = 0; i < Math.min(38, matches.length); i++) {
          const match = matches[i];
          
          // Simular resultado aleatório
          const homeScore = Math.floor(Math.random() * 4);
          const awayScore = Math.floor(Math.random() * 4);
          
          const { error: matchError } = await supabase
            .from('game_season_matches')
            .update({
              status: 'finished',
              home_score: homeScore,
              away_score: awayScore
            })
            .eq('id', match.id);

          if (matchError) {
            console.error(`❌ Erro ao atualizar partida ${match.id}:`, matchError);
          }
        }

        console.log('✅ Partidas simuladas com sucesso');
      }

      // 4. Verificar resultado final
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
        console.log(`   Posição: ${final.position}º`);
        
        if (final.games_played >= 38) {
          console.log('✅ Temporada está completa - botão deve aparecer!');
          console.log('🎉 Agora você pode testar o botão "Iniciar Nova Temporada"');
        } else {
          console.log('❌ Temporada ainda não está completa');
        }
      }

    } else {
      console.log('❌ Nenhum progresso encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

simulateCompleteSeason(); 