const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testGetUserCurrentProgress() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🧪 Testando getUserCurrentProgress...');
  console.log(`👤 Usuário: ${userId}`);

  try {
    // Simular exatamente a query da função getUserCurrentProgress
    console.log('\n📊 Executando query da função getUserCurrentProgress...');
    
    let query = supabase
      .from('game_user_competition_progress')
      .select(`
        *,
        team:game_teams(id, name, colors, logo_url)
      `)
      .eq('user_id', userId)
      .eq('season_status', 'active')
      .order('season_year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro na query:', error);
      return;
    }

    console.log(`✅ Resultado da query:`);
    if (data && data.length > 0) {
      data.forEach((progress, index) => {
        console.log(`   ${index + 1}. Temporada ${progress.season_year}: ${progress.points} pts, ${progress.games_played} jogos`);
        console.log(`      ID: ${progress.id}`);
        console.log(`      Status: ${progress.season_status}`);
        console.log(`      Created: ${progress.created_at}`);
        console.log(`      Updated: ${progress.updated_at}`);
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }

    // Testar sem o filtro de season_status para ver todas as temporadas
    console.log('\n📊 Testando sem filtro de season_status...');
    const { data: allData, error: allError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        *,
        team:game_teams(id, name, colors, logo_url)
      `)
      .eq('user_id', userId)
      .order('season_year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (allError) {
      console.error('❌ Erro na query sem filtro:', allError);
      return;
    }

    console.log(`✅ Todas as temporadas (limit 5):`);
    if (allData && allData.length > 0) {
      allData.forEach((progress, index) => {
        console.log(`   ${index + 1}. Temporada ${progress.season_year}: ${progress.points} pts, ${progress.games_played} jogos, Status: ${progress.season_status}`);
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testGetUserCurrentProgress(); 