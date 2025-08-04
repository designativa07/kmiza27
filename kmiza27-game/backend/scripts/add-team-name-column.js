const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function addTeamNameColumn() {
  try {
    console.log('🔧 Adicionando coluna team_name à tabela game_user_machine_team_stats...');
    const supabase = getSupabaseServiceClient('vps');

    // Add the team_name column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_user_machine_team_stats 
        ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);
      `
    });

    if (alterError) {
      console.log('❌ Erro ao adicionar coluna team_name:', alterError.message);
      console.log('\n📝 Execute manualmente no Supabase SQL Editor:');
      console.log('ALTER TABLE game_user_machine_team_stats ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);');
      return;
    }

    console.log('✅ Coluna team_name adicionada com sucesso');

    // Update the team_name values based on team_id
    console.log('\n🔄 Atualizando nomes dos times...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE game_user_machine_team_stats 
        SET team_name = (
          SELECT name 
          FROM game_machine_teams 
          WHERE game_machine_teams.id = game_user_machine_team_stats.team_id
        )
        WHERE team_name IS NULL OR team_name = '';
      `
    });

    if (updateError) {
      console.log('❌ Erro ao atualizar nomes dos times:', updateError.message);
      console.log('\n📝 Execute manualmente no Supabase SQL Editor:');
      console.log(`
        UPDATE game_user_machine_team_stats 
        SET team_name = (
          SELECT name 
          FROM game_machine_teams 
          WHERE game_machine_teams.id = game_user_machine_team_stats.team_id
        )
        WHERE team_name IS NULL OR team_name = '';
      `);
      return;
    }

    console.log('✅ Nomes dos times atualizados com sucesso');

    // Verify the fix
    console.log('\n🔍 Verificando correção...');
    const { data: stats, error: verifyError } = await supabase
      .from('game_user_machine_team_stats')
      .select('team_name, points, games_played')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('tier', 3)
      .eq('season_year', 2026)
      .order('team_name')
      .limit(10);

    if (verifyError) {
      console.log('❌ Erro ao verificar correção:', verifyError.message);
      return;
    }

    console.log('📊 Primeiras 10 estatísticas corrigidas:');
    stats.forEach(stat => {
      console.log(`   - ${stat.team_name}: ${stat.points} pts, ${stat.games_played} jogos`);
    });

    console.log('\n✅ Correção da coluna team_name concluída');
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

addTeamNameColumn(); 