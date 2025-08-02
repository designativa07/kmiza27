const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAiImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

console.log('🔧 Conectando ao Supabase com chave de serviço...');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verificarTimes() {
  console.log('🔍 Verificando times nas tabelas...\n');

  try {
    // Verificar tabela game_teams
    const { data: gameTeams, error: gameTeamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id, created_at')
      .order('name');

    if (gameTeamsError) {
      console.error('❌ Erro ao buscar times da tabela game_teams:', gameTeamsError);
    } else {
      console.log(`📋 Times na tabela 'game_teams': ${gameTeams.length}`);
      gameTeams.forEach(team => {
        console.log(`   - ${team.name} (${team.team_type}) - Owner: ${team.owner_id || 'N/A'} - Criado: ${team.created_at}`);
      });
    }

    console.log('');

    // Verificar tabela users para ver se há usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log(`👤 Usuários encontrados: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}) - Criado: ${user.created_at}`);
      });
    }

    console.log('');

    // Verificar tabela game_competition_teams
    const { data: competitionTeams, error: compTeamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type),
        game_competitions!inner(id, name, tier)
      `);

    if (compTeamsError) {
      console.error('❌ Erro ao buscar inscrições em competições:', compTeamsError);
    } else {
      console.log(`📋 Inscrições em competições: ${competitionTeams.length}`);
      competitionTeams.forEach(inscription => {
        console.log(`   - ${inscription.game_teams.name} → ${inscription.game_competitions.name} (Tier ${inscription.game_competitions.tier})`);
      });
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarTimes(); 