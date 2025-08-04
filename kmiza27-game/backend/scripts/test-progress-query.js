const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testProgressQuery() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🧪 Testando query de progresso...');
  console.log(`👤 Usuário: ${userId}`);

  try {
    // 1. Buscar todas as temporadas do usuário
    console.log('\n📊 Buscando todas as temporadas do usuário...');
    const { data: allProgress, error: allError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as temporadas:', allError);
      return;
    }

    console.log(`✅ Encontradas ${allProgress?.length || 0} temporadas:`);
    if (allProgress) {
      allProgress.forEach((progress, index) => {
        console.log(`   ${index + 1}. Temporada ${progress.season_year}: ${progress.points} pts, ${progress.games_played} jogos, Status: ${progress.season_status}`);
      });
    }

    // 2. Buscar apenas temporadas ativas
    console.log('\n📊 Buscando apenas temporadas ativas...');
    const { data: activeProgress, error: activeError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('season_status', 'active')
      .order('season_year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) {
      console.error('❌ Erro ao buscar temporadas ativas:', activeError);
      return;
    }

    console.log(`✅ Encontradas ${activeProgress?.length || 0} temporadas ativas:`);
    if (activeProgress) {
      activeProgress.forEach((progress, index) => {
        console.log(`   ${index + 1}. Temporada ${progress.season_year}: ${progress.points} pts, ${progress.games_played} jogos`);
      });
    }

    // 3. Verificar se há temporadas com status diferente de 'active'
    console.log('\n📊 Verificando status das temporadas...');
    const statusCounts = {};
    if (allProgress) {
      allProgress.forEach(progress => {
        const status = progress.season_status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }
    console.log('   Contagem por status:', statusCounts);

    // 4. Verificar se há temporadas mais recentes que não estão 'active'
    if (allProgress && allProgress.length > 0) {
      const mostRecent = allProgress[0];
      console.log(`\n🎯 Temporada mais recente: ${mostRecent.season_year} (Status: ${mostRecent.season_status})`);
      
      if (mostRecent.season_status !== 'active') {
        console.log('⚠️ A temporada mais recente não está ativa!');
        console.log('   Isso pode explicar por que está retornando uma temporada antiga.');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testProgressQuery(); 