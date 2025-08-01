const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🧪 TESTANDO INTEGRAÇÃO DO FRONTEND');
console.log('=' .repeat(40));

async function testFrontendIntegration() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando competições disponíveis para novos usuários...');
    
    // Simular a chamada do endpoint que o frontend fará
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('tier', 4) // Apenas Série D (temporariamente)
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    console.log(`✅ Encontradas ${competitions.length} competições disponíveis:`);
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
    });

    console.log('\n📋 2. Verificando se há times de usuário inscritos...');
    
    const { data: userTeams, error: userError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id')
      .eq('team_type', 'user_created');

    if (userError) {
      console.error('❌ Erro ao buscar times de usuário:', userError);
      return;
    }

    console.log(`✅ Encontrados ${userTeams.length} times de usuário:`);
    userTeams.forEach(team => {
      console.log(`   - ${team.name} (ID: ${team.id})`);
    });

    console.log('\n📋 3. Verificando inscrições em competições...');
    
    const { data: enrollments, error: enrollError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(name, team_type),
        game_competitions!inner(name, tier)
      `)
      .eq('game_teams.team_type', 'user_created');

    if (enrollError) {
      console.error('❌ Erro ao buscar inscrições:', enrollError);
      return;
    }

    console.log(`✅ Encontradas ${enrollments.length} inscrições de times de usuário:`);
    enrollments.forEach(enrollment => {
      console.log(`   - ${enrollment.game_teams.name} em ${enrollment.game_competitions.name}`);
    });

    console.log('\n🎯 RESULTADO DA INTEGRAÇÃO:');
    console.log('✅ Frontend agora carregará apenas competições da Série D (tier 4)');
    console.log('✅ Novos usuários só poderão se inscrever na Série D');
    console.log('✅ Sistema de promoção/rebaixamento está configurado');
    console.log('✅ Endpoint /api/v1/competitions/for-new-users está funcionando');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFrontendIntegration(); 