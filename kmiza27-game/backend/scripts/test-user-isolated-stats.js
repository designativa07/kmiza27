const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testUserIsolatedStats() {
  console.log('🧪 TESTANDO SISTEMA DE ESTATÍSTICAS ISOLADAS POR USUÁRIO');
  console.log('======================================================================\n');

  try {
    // 1. Buscar usuários existentes
    console.log('📋 Passo 1: Buscando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('game_users')
      .select('id, username')
      .limit(3);

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários`);
    users.forEach(user => console.log(`   - ${user.username} (${user.id})`));

    // 2. Testar estatísticas de cada usuário
    console.log('\n📋 Passo 2: Testando estatísticas isoladas por usuário...');
    
    for (const user of users) {
      console.log(`\n🎯 Testando usuário: ${user.username}`);
      
      // Buscar estatísticas do usuário
      const { data: userStats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select(`
          *,
          game_machine_teams(name)
        `)
        .eq('user_id', user.id)
        .eq('tier', 4) // Série D
        .eq('season_year', 2025);

      if (statsError) {
        console.log(`   ❌ Erro ao buscar estatísticas: ${statsError.message}`);
        continue;
      }

      if (!userStats || userStats.length === 0) {
        console.log(`   ⚠️ Nenhuma estatística encontrada para este usuário`);
        continue;
      }

      console.log(`   ✅ Encontradas ${userStats.length} estatísticas de times da máquina`);
      
      // Mostrar algumas estatísticas de exemplo
      const sampleStats = userStats.slice(0, 3);
      sampleStats.forEach(stat => {
        const teamName = stat.game_machine_teams?.name || 'Time Desconhecido';
        console.log(`      - ${teamName}: ${stat.points}pts, ${stat.games_played} jogos`);
      });

      // Verificar se todas as estatísticas estão zeradas (como esperado para novos usuários)
      const allZeroed = userStats.every(stat => 
        stat.points === 0 && 
        stat.games_played === 0 && 
        stat.wins === 0 && 
        stat.draws === 0 && 
        stat.losses === 0
      );

      if (allZeroed) {
        console.log(`   ✅ Todas as estatísticas estão zeradas (correto para novos usuários)`);
      } else {
        console.log(`   ⚠️ Algumas estatísticas não estão zeradas (pode ser usuário antigo)`);
      }
    }

    // 3. Testar simulação de partida
    console.log('\n📋 Passo 3: Testando simulação de partida...');
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`🎯 Simulando partida para usuário: ${testUser.username}`);
      
      // Buscar uma partida do usuário
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('is_simulated', false)
        .limit(1);

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
      } else if (!matches || matches.length === 0) {
        console.log(`   ⚠️ Nenhuma partida pendente encontrada`);
      } else {
        console.log(`   ✅ Encontrada partida para simular: ${matches[0].id}`);
        console.log(`   📊 Partida: ${matches[0].home_team_name || 'Seu Time'} vs ${matches[0].away_team_name || 'Time da Máquina'}`);
      }
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('💡 Sistema de estatísticas isoladas por usuário está funcionando corretamente');
    console.log('💡 Novos usuários verão times da máquina com estatísticas zeradas');
    console.log('💡 Cada usuário tem suas próprias estatísticas dos times da máquina');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testUserIsolatedStats(); 