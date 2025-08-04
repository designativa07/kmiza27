const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testPromotionZone() {
  try {
    console.log('🏆 Testando zona de promoção...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar usuários na zona de promoção
    const { data: users, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        user_id,
        team_id,
        current_tier,
        season_year,
        points,
        games_played,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        position,
        season_status
      `)
      .eq('season_status', 'active')
      .lte('position', 4) // Zona de promoção (1-4)
      .order('current_tier', { ascending: true })
      .order('position', { ascending: true });
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários na zona de promoção`);
    
    for (const user of users) {
      console.log(`\n👤 Usuário: ${user.user_id}`);
      console.log(`   Série: ${user.current_tier} (${getTierName(user.current_tier)})`);
      console.log(`   Temporada: ${user.season_year}`);
      console.log(`   Posição: ${user.position}º lugar`);
      console.log(`   Pontos: ${user.points}`);
      console.log(`   Jogos: ${user.games_played}`);
      
      // Verificar se pode ser promovido
      if (user.current_tier === 1) {
        console.log(`   ❌ Série A - Não pode ser promovido (máxima série)`);
        continue;
      }
      
      // Verificar se temporada pode ser finalizada
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('status')
        .eq('user_id', user.user_id)
        .eq('season_year', user.season_year);
      
      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
        continue;
      }
      
      const totalMatches = matches?.length || 0;
      const finishedMatches = matches?.filter(m => m.status === 'finished').length || 0;
      
      console.log(`   📊 Partidas: ${finishedMatches}/${totalMatches} finalizadas`);
      
      if (finishedMatches === totalMatches && totalMatches > 0) {
        console.log(`   ✅ Temporada pode ser finalizada!`);
        console.log(`   🏆 Usuário será promovido para Série ${getTierName(user.current_tier - 1)}`);
        
        // Simular processo de promoção
        console.log(`   🔄 Simulando promoção...`);
        
        // Verificar se já existe progresso na série superior
        const { data: upperProgress, error: upperError } = await supabase
          .from('game_user_competition_progress')
          .select('id, current_tier, season_status')
          .eq('user_id', user.user_id)
          .eq('season_year', user.season_year + 1);
        
        if (upperError) {
          console.log(`   ❌ Erro ao verificar série superior: ${upperError.message}`);
        } else if (upperProgress && upperProgress.length > 0) {
          console.log(`   ⚠️ Usuário já tem progresso na série superior (${getTierName(upperProgress[0].current_tier)})`);
        } else {
          console.log(`   ✅ Usuário não tem progresso na série superior - promoção possível`);
        }
        
      } else {
        console.log(`   ⏳ Temporada ainda não pode ser finalizada`);
        console.log(`   📊 Faltam ${totalMatches - finishedMatches} partidas`);
      }
      
      // Mostrar estatísticas detalhadas
      console.log(`   📈 Estatísticas:`);
      console.log(`      Vitórias: ${user.wins}`);
      console.log(`      Empates: ${user.draws}`);
      console.log(`      Derrotas: ${user.losses}`);
      console.log(`      Gols marcados: ${user.goals_for}`);
      console.log(`      Gols sofridos: ${user.goals_against}`);
      console.log(`      Saldo: ${user.goals_for - user.goals_against}`);
    }
    
    console.log('\n✅ Teste da zona de promoção concluído');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

testPromotionZone(); 