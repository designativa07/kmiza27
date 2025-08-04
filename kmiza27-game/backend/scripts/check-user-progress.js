const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function checkUserProgress() {
  try {
    const { data: progress, error } = await supabase
      .from('game_user_competition_progress')
      .select('user_id, current_tier, season_year, points, games_played, season_status')
      .order('current_tier', { ascending: true });

    if (error) {
      console.log('Erro:', error.message);
      return;
    }

    console.log('Progresso dos usuários:');
    progress.forEach(p => {
      const tierName = getTierName(p.current_tier);
      console.log(`- Usuário: ${p.user_id.substring(0,8)}..., Série: ${tierName} (${p.current_tier}), Temporada: ${p.season_year}, Pontos: ${p.points}, Jogos: ${p.games_played}, Status: ${p.season_status}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  }
}

function getTierName(tier) {
  const names = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return names[tier] || tier.toString();
}

checkUserProgress(); 