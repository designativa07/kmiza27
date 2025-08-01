const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testMatchesEndpoint() {
  console.log('🧪 TESTANDO ENDPOINT DE PARTIDAS');
  console.log('=' .repeat(40));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Verificar se há times disponíveis
    console.log('\n📊 1. VERIFICANDO TIMES DISPONÍVEIS...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(5);

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('❌ Nenhum time encontrado');
      return;
    }

    console.log(`✅ ${teams.length} times encontrados:`);
    teams.forEach(team => {
      console.log(`   • ${team.name} (${team.id})`);
    });

    // 2. Verificar partidas diretas
    console.log('\n⚽ 2. VERIFICANDO PARTIDAS DIRETAS...');
    
    const { data: directMatches, error: directError } = await supabase
      .from('game_direct_matches')
      .select('*')
      .limit(10);

    if (directError) {
      console.log('❌ Erro ao buscar partidas diretas:', directError.message);
    } else {
      console.log(`✅ ${directMatches?.length || 0} partidas diretas encontradas`);
      if (directMatches && directMatches.length > 0) {
        directMatches.forEach(match => {
          console.log(`   • ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
        });
      }
    }

    // 3. Verificar partidas de competição
    console.log('\n🏆 3. VERIFICANDO PARTIDAS DE COMPETIÇÃO...');
    
    const { data: compMatches, error: compError } = await supabase
      .from('game_matches')
      .select('*')
      .limit(10);

    if (compError) {
      console.log('❌ Erro ao buscar partidas de competição:', compError.message);
    } else {
      console.log(`✅ ${compMatches?.length || 0} partidas de competição encontradas`);
      if (compMatches && compMatches.length > 0) {
        compMatches.forEach(match => {
          console.log(`   • ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
        });
      }
    }

    // 4. Testar endpoint HTTP
    console.log('\n🌐 4. TESTANDO ENDPOINT HTTP...');
    
    const testTeam = teams[0];
    console.log(`   • Testando com time: ${testTeam.name} (${testTeam.id})`);
    
    try {
      const response = await fetch(`http://localhost:3004/api/v1/game-teams/${testTeam.id}/matches`);
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`   ✅ Endpoint funcionando!`);
      console.log(`   📊 ${data.data?.length || 0} partidas retornadas`);
      
      if (data.data && data.data.length > 0) {
        data.data.slice(0, 3).forEach(match => {
          console.log(`      • ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Erro ao testar endpoint: ${error.message}`);
    }

    // 5. Simular requisição do frontend
    console.log('\n📱 5. SIMULANDO REQUISIÇÃO DO FRONTEND...');
    
    const frontendRequest = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    try {
      const response = await fetch(`http://localhost:3004/api/v1/game-teams/${testTeam.id}/matches`, frontendRequest);
      
      if (!response.ok) {
        console.log(`   ❌ Frontend request failed: ${response.status}`);
        const errorText = await response.text();
        console.log(`   📝 Error details: ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`   ✅ Frontend request successful!`);
      console.log(`   📊 Response structure:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`   ❌ Frontend request error: ${error.message}`);
    }

    console.log('\n✅ TESTE CONCLUÍDO!');
    console.log('🎯 Endpoint de partidas está funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testMatchesEndpoint()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 