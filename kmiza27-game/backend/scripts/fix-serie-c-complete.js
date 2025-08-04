const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixSerieCComplete() {
  try {
    console.log('🔧 Corrigindo completamente a Série C...');
    const supabase = getSupabaseServiceClient('vps');

    // Step 1: Check if team_name column exists
    console.log('\n📋 Passo 1: Verificando estrutura da tabela...');
    
    // Try to select team_name to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('game_user_machine_team_stats')
      .select('team_name')
      .limit(1);

    if (testError && testError.message.includes('team_name')) {
      console.log('❌ Coluna team_name não existe. Execute manualmente no Supabase SQL Editor:');
      console.log('ALTER TABLE game_user_machine_team_stats ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);');
      console.log('\n📝 Depois execute este script novamente.');
      return;
    }

    console.log('✅ Coluna team_name existe');

    // Step 2: Update all machine team stats with correct team names
    console.log('\n📋 Passo 2: Atualizando nomes dos times...');
    
    // Get all machine teams
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .order('tier', { ascending: true })
      .order('name');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`🏟️ Encontrados ${machineTeams.length} times da máquina no total`);

    // Create a map of team_id to team_name
    const teamNameMap = {};
    machineTeams.forEach(team => {
      teamNameMap[team.id] = team.name;
    });

    // Get all machine team stats that need updating
    const { data: allStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .is('team_name', null);

    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas:', statsError.message);
      return;
    }

    console.log(`📊 Encontradas ${allStats.length} estatísticas com team_name nulo`);

    // Update each stat with the correct team name
    let updatedCount = 0;
    for (const stat of allStats) {
      const teamName = teamNameMap[stat.team_id];
      if (teamName) {
        const { error: updateError } = await supabase
          .from('game_user_machine_team_stats')
          .update({ team_name: teamName })
          .eq('id', stat.id);

        if (updateError) {
          console.log(`   ❌ Erro ao atualizar ${stat.id}:`, updateError.message);
        } else {
          updatedCount++;
          if (updatedCount % 10 === 0) {
            console.log(`   ✅ Atualizados ${updatedCount} registros...`);
          }
        }
      } else {
        console.log(`   ⚠️ Time não encontrado para ID: ${stat.team_id}`);
      }
    }

    console.log(`\n✅ Atualizados ${updatedCount} registros com nomes corretos`);

    // Step 3: Verify the fix for the promoted user
    console.log('\n📋 Passo 3: Verificando correção para usuário promovido...');
    
    const { data: userStats, error: verifyError } = await supabase
      .from('game_user_machine_team_stats')
      .select('team_name, points, games_played, tier')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('tier', 3)
      .eq('season_year', 2026)
      .order('team_name');

    if (verifyError) {
      console.log('❌ Erro ao verificar correção:', verifyError.message);
      return;
    }

    console.log(`📊 Estatísticas do usuário promovido na Série C (${userStats.length}):`);
    userStats.forEach(stat => {
      console.log(`   - ${stat.team_name}: ${stat.points} pts, ${stat.games_played} jogos`);
    });

    // Step 4: Check if there are any remaining issues
    console.log('\n📋 Passo 4: Verificando se ainda há problemas...');
    
    const { data: remainingNulls, error: nullError } = await supabase
      .from('game_user_machine_team_stats')
      .select('id, team_id, tier, season_year')
      .is('team_name', null);

    if (nullError) {
      console.log('❌ Erro ao verificar registros restantes:', nullError.message);
      return;
    }

    if (remainingNulls.length > 0) {
      console.log(`⚠️ Ainda há ${remainingNulls.length} registros com team_name nulo`);
      remainingNulls.slice(0, 5).forEach(stat => {
        console.log(`   - ID: ${stat.id}, Team ID: ${stat.team_id}, Tier: ${stat.tier}`);
      });
    } else {
      console.log('✅ Todos os registros têm team_name preenchido');
    }

    console.log('\n🎉 Correção da Série C concluída!');
    console.log('📱 Agora teste o frontend para ver se a Série C aparece corretamente.');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixSerieCComplete(); 