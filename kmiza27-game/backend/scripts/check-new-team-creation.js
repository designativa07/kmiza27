const { getSupabaseClient } = require('../config/supabase-connection');

async function checkNewTeamCreation() {
  console.log('🔍 Verificando criação de novos times...\n');

  const supabase = getSupabaseClient('vps');

  try {
    // Verificar usuários recentes (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    console.log('👥 Verificando usuários criados recentemente...');
    const { data: users, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        user_id,
        current_tier,
        points,
        games_played,
        position,
        season_status,
        created_at
      `)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📭 Nenhum usuário criado nas últimas 24 horas');
      return;
    }

    console.log(`📋 Encontrados ${users.length} usuários criados recentemente:\n`);

    users.forEach((user, index) => {
      const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
      const isZeroed = user.points === 0 && user.games_played === 0;
      const status = isZeroed ? '✅ ZERADO' : '❌ COM ESTATÍSTICAS';
      
      console.log(`${index + 1}. Usuário ${user.user_id.slice(0, 8)}...`);
      console.log(`   📅 Criado: ${createdAt}`);
      console.log(`   🏆 Série: ${getTierName(user.current_tier)}`);
      console.log(`   📊 Status: ${status}`);
      console.log(`   📈 Stats: ${user.points} pts, ${user.games_played} jogos, ${user.position}º lugar`);
      console.log(`   🔄 Season: ${user.season_status}`);
      console.log('');
    });

    // Verificar partidas dos usuários recentes
    console.log('⚽ Verificando partidas dos usuários recentes...');
    
    for (const user of users.slice(0, 2)) { // Verificar apenas os 2 mais recentes
      console.log(`\n🔍 Partidas do usuário ${user.user_id.slice(0, 8)}...:`);
      
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select(`
          round_number,
          status,
          home_score,
          away_score,
          created_at
        `)
        .eq('user_id', user.user_id)
        .order('round_number', { ascending: true })
        .limit(5);

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
        continue;
      }

      if (!matches || matches.length === 0) {
        console.log(`   📭 Nenhuma partida encontrada`);
        continue;
      }

      console.log(`   📅 Total de partidas: ${matches.length}`);
      matches.forEach(match => {
        const status = match.status === 'scheduled' ? '⏳ Agendada' : 
                      match.status === 'finished' ? `✅ ${match.home_score}x${match.away_score}` : 
                      match.status;
        console.log(`   Rodada ${match.round_number}: ${status}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro durante verificação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

// Executar se chamado diretamente
if (require.main === module) {
  checkNewTeamCreation()
    .then(() => {
      console.log('✅ Verificação concluída');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Verificação falhou:', error);
      process.exit(1);
    });
}

module.exports = { checkNewTeamCreation };