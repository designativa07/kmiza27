const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function findPalhocaUser() {
  try {
    console.log('🔍 Procurando usuário do time Palhoça...\n');
    
    // 1. Buscar o time Palhoça
    const { data: palhocaTeam, error: teamError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('name', 'Palhoça')
      .single();

    if (teamError) {
      console.log('❌ Erro ao buscar time Palhoça:', teamError.message);
      return;
    }

    console.log(`✅ Time encontrado: ${palhocaTeam.name} (ID: ${palhocaTeam.id})`);
    console.log(`   Owner ID: ${palhocaTeam.owner_id}`);

    // 2. Buscar o usuário dono do time
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .select('*')
      .eq('id', palhocaTeam.owner_id)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }

    console.log(`\n👤 Usuário encontrado:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);

    // 3. Verificar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_status', 'active')
      .single();

    if (progressError) {
      console.log('❌ Erro ao buscar progresso:', progressError.message);
      return;
    }

    console.log(`\n📊 Progresso encontrado:`);
    console.log(`   Série: ${progress.current_tier}`);
    console.log(`   Temporada: ${progress.season_year}`);
    console.log(`   Jogos: ${progress.games_played}`);
    console.log(`   Pontos: ${progress.points}`);

    // 4. Verificar partidas recentes
    const { data: recentMatches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select(`
        *,
        home_team:game_teams!home_team_id(id, name),
        away_team:game_teams!away_team_id(id, name),
        home_machine:game_machine_teams!home_machine_team_id(id, name),
        away_machine:game_machine_teams!away_machine_team_id(id, name)
      `)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .or(`home_team_id.eq.${palhocaTeam.id},away_team_id.eq.${palhocaTeam.id}`)
      .eq('status', 'finished')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (matchesError) {
      console.log('❌ Erro ao buscar partidas:', matchesError.message);
      return;
    }

    console.log(`\n⚽ Últimas partidas:`);
    if (recentMatches && recentMatches.length > 0) {
      recentMatches.forEach((match, index) => {
        const isUserHome = match.home_team_id === palhocaTeam.id;
        const userTeam = isUserHome ? match.home_team : match.away_team;
        const machineTeam = isUserHome ? match.away_machine : match.home_machine;
        
        console.log(`   ${index + 1}. ${userTeam?.name || 'Palhoça'} ${match.home_score} x ${match.away_score} ${machineTeam?.name || 'Time da Máquina'}`);
        console.log(`      Rodada: ${match.round_number}, Data: ${match.updated_at}`);
      });
    } else {
      console.log('   Nenhuma partida encontrada');
    }

    console.log(`\n🎯 Usuário para teste: ${user.username} (ID: ${user.id})`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

findPalhocaUser().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
