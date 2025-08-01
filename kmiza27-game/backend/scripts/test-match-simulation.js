const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testMatchSimulation() {
  try {
    console.log('🧪 Testando simulação de partidas...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. Buscar times disponíveis
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .limit(5);

    if (teamsError) {
      console.error('❌ Erro ao buscar times:', teamsError);
      return;
    }

    console.log(`📋 Times encontrados: ${teams.length}`);
    teams.forEach(team => {
      console.log(`  - ${team.name} (${team.team_type})`);
    });

    if (teams.length < 2) {
      console.log('❌ Precisamos de pelo menos 2 times para testar');
      return;
    }

    // 2. Criar uma partida de teste
    const homeTeam = teams[0];
    const awayTeam = teams[1];

    console.log(`\n⚽ Criando partida: ${homeTeam.name} vs ${awayTeam.name}`);

    const { data: match, error: matchError } = await supabase
      .from('game_matches')
      .insert({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_team_name: homeTeam.name,
        away_team_name: awayTeam.name,
        match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        highlights: [],
        stats: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (matchError) {
      console.error('❌ Erro ao criar partida:', matchError);
      return;
    }

    console.log(`✅ Partida criada: ${match.id}`);

    // 3. Testar simulação via API
    console.log('\n🎮 Testando simulação via API...');
    
    const response = await fetch('http://localhost:3004/api/v1/game-teams/matches/' + match.id + '/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na simulação: ${response.status} - ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ Simulação realizada com sucesso!');
    console.log(`📊 Resultado: ${result.data.home_score}x${result.data.away_score}`);
    console.log(`🏆 Status: ${result.data.status}`);

    if (result.data.highlights) {
      console.log('🎯 Highlights:');
      result.data.highlights.forEach(highlight => {
        console.log(`  - ${highlight}`);
      });
    }

    if (result.data.stats) {
      console.log('📈 Estatísticas:');
      console.log(`  - Posse: ${result.data.stats.possession?.home || 0}% x ${result.data.stats.possession?.away || 0}%`);
      console.log(`  - Chutes: ${result.data.stats.shots?.home || 0} x ${result.data.stats.shots?.away || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testMatchSimulation(); 