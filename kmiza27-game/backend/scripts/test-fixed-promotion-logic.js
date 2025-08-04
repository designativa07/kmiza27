const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testFixedPromotionLogic() {
  try {
    console.log('🧪 Testando lógica de promoção corrigida...');
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar usuários com temporadas ativas
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
      const allMatchesFinished = finishedMatches === totalMatches && totalMatches > 0;
      
      console.log(`   📊 Partidas: ${finishedMatches}/${totalMatches} finalizadas`);
      console.log(`   ✅ Todas as partidas finalizadas: ${allMatchesFinished ? 'SIM' : 'NÃO'}`);
      
      if (allMatchesFinished) {
        // Verificar se está em posição de promoção ou rebaixamento
        const inPromotionZone = user.position >= 1 && user.position <= 4;
        const inRelegationZone = user.position >= 17 && user.position <= 20;
        const canBePromoted = user.current_tier > 1;
        const canBeRelegated = user.current_tier < 4;
        
        console.log(`   🏆 Zona de promoção: ${inPromotionZone ? 'SIM' : 'NÃO'}`);
        console.log(`   😔 Zona de rebaixamento: ${inRelegationZone ? 'SIM' : 'NÃO'}`);
        console.log(`   📈 Pode ser promovido: ${canBePromoted ? 'SIM' : 'NÃO'}`);
        console.log(`   📉 Pode ser rebaixado: ${canBeRelegated ? 'SIM' : 'NÃO'}`);
        
        // Verificar se temporada pode ser finalizada
        const canFinish = (inPromotionZone && canBePromoted) || (inRelegationZone && canBeRelegated);
        console.log(`   🏁 Temporada pode ser finalizada: ${canFinish ? 'SIM' : 'NÃO'}`);
        
        if (canFinish) {
          console.log(`   🎉 RESULTADO ESPERADO:`);
          if (inPromotionZone && canBePromoted) {
            console.log(`      → Promovido para Série ${getTierName(user.current_tier - 1)}`);
          } else if (inRelegationZone && canBeRelegated) {
            console.log(`      → Rebaixado para Série ${getTierName(user.current_tier + 1)}`);
          }
        } else {
          console.log(`   📍 RESULTADO ESPERADO: Permanece na Série ${getTierName(user.current_tier)}`);
        }
      } else {
        console.log(`   ⏳ Temporada ainda não pode ser finalizada`);
        console.log(`   📊 Faltam ${totalMatches - finishedMatches} partidas`);
      }
    }
    
    console.log('\n✅ Teste da lógica de promoção corrigida concluído');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

testFixedPromotionLogic(); 