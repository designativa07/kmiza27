const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkPromotionIssues() {
  try {
    console.log('🔍 Investigando problemas de promoção...');
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar todos os usuários com temporadas ativas
    const { data: users, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select(`user_id, team_id, current_tier, season_year, points, games_played, wins, draws, losses, goals_for, goals_against, position, season_status`)
      .eq('season_status', 'active')
      .order('current_tier', { ascending: true })
      .order('position', { ascending: true });
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários com temporadas ativas`);
    
    for (const user of users) {
      console.log(`\n👤 Usuário: ${user.user_id}`);
      console.log(`   Série: ${user.current_tier} (${getTierName(user.current_tier)})`);
      console.log(`   Temporada: ${user.season_year}`);
      console.log(`   Posição: ${user.position}º lugar`);
      console.log(`   Pontos: ${user.points}`);
      console.log(`   Jogos: ${user.games_played}/38`);
      
      // Verificar se está na zona de promoção
      const inPromotionZone = user.position >= 1 && user.position <= 4;
      const canBePromoted = user.current_tier > 1;
      
      console.log(`   🏆 Zona de promoção: ${inPromotionZone ? 'SIM' : 'NÃO'}`);
      console.log(`   📈 Pode ser promovido: ${canBePromoted ? 'SIM' : 'NÃO'}`);
      
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
      
      // Verificar se temporada está completa
      const seasonComplete = finishedMatches === totalMatches && totalMatches > 0;
      console.log(`   ✅ Temporada completa: ${seasonComplete ? 'SIM' : 'NÃO'}`);
      
      // Verificar se seria promovido incorretamente
      if (seasonComplete && inPromotionZone && canBePromoted) {
        console.log(`   🎉 SERIA PROMOVIDO (posição ${user.position})`);
      } else if (seasonComplete && !inPromotionZone && canBePromoted) {
        console.log(`   ⚠️ PROBLEMA: Temporada completa mas NÃO está na zona de promoção (posição ${user.position})`);
      } else if (seasonComplete && inPromotionZone && !canBePromoted) {
        console.log(`   ⚠️ PROBLEMA: Temporada completa na zona de promoção mas não pode ser promovido (Série A)`);
      }
      
      // Verificar se já foi promovido incorretamente
      const { data: nextSeason, error: nextError } = await supabase
        .from('game_user_competition_progress')
        .select('current_tier, season_year, season_status')
        .eq('user_id', user.user_id)
        .eq('season_year', user.season_year + 1);
      
      if (nextError) {
        console.log(`   ❌ Erro ao verificar próxima temporada: ${nextError.message}`);
      } else if (nextSeason && nextSeason.length > 0) {
        const nextTier = nextSeason[0].current_tier;
        console.log(`   🔄 Próxima temporada: Série ${getTierName(nextTier)} (${nextSeason[0].season_year})`);
        
        if (nextTier < user.current_tier) {
          console.log(`   ✅ Já foi promovido para Série ${getTierName(nextTier)}`);
        } else if (nextTier > user.current_tier) {
          console.log(`   😔 Já foi rebaixado para Série ${getTierName(nextTier)}`);
        } else {
          console.log(`   📍 Permanece na Série ${getTierName(nextTier)}`);
        }
      } else {
        console.log(`   ⏳ Ainda não tem próxima temporada`);
      }
    }
    
    console.log('\n✅ Investigação de problemas de promoção concluída');
  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

checkPromotionIssues(); 