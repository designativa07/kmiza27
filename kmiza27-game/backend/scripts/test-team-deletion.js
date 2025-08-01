const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamDeletion() {
  try {
    console.log('🧪 Testando exclusão de times...');

    // 1. Buscar um time para testar
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id')
      .limit(1);

    if (teamsError) {
      console.error('Erro ao buscar times:', teamsError);
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('Nenhum time encontrado para teste');
      return;
    }

    const testTeam = teams[0];
    console.log(`📋 Time encontrado para teste: ${testTeam.name} (ID: ${testTeam.id})`);

    // 2. Verificar dependências antes da exclusão
    console.log('🔍 Verificando dependências...');
    
    // Verificar partidas
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('id, home_team_id, away_team_id')
      .or(`home_team_id.eq.${testTeam.id},away_team_id.eq.${testTeam.id}`);

    if (matchesError) {
      console.error('Erro ao verificar partidas:', matchesError);
    } else {
      console.log(`📊 Partidas encontradas: ${matches?.length || 0}`);
    }

    // Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competition_teams')
      .select('id, competition_id')
      .eq('team_id', testTeam.id);

    if (compError) {
      console.error('Erro ao verificar competições:', compError);
    } else {
      console.log(`🏆 Competições encontradas: ${competitions?.length || 0}`);
    }

    // Verificar academias
    const { data: academies, error: acadError } = await supabase
      .from('youth_academies')
      .select('id')
      .eq('team_id', testTeam.id);

    if (acadError) {
      console.error('Erro ao verificar academias:', acadError);
    } else {
      console.log(`🎓 Academias encontradas: ${academies?.length || 0}`);
    }

    // 3. Tentar excluir o time
    console.log('🗑️ Tentando excluir o time...');
    const { error: deleteError } = await supabase
      .from('game_teams')
      .delete()
      .eq('id', testTeam.id);

    if (deleteError) {
      console.error('❌ Erro ao excluir time:', deleteError);
      console.log('💡 O erro indica que ainda há constraints não corrigidas');
    } else {
      console.log('✅ Time excluído com sucesso!');
      
      // 4. Verificar se as dependências foram excluídas em cascata
      console.log('🔍 Verificando se dependências foram excluídas...');
      
      const { data: remainingMatches, error: remMatchesError } = await supabase
        .from('game_matches')
        .select('id')
        .or(`home_team_id.eq.${testTeam.id},away_team_id.eq.${testTeam.id}`);

      if (remMatchesError) {
        console.error('Erro ao verificar partidas restantes:', remMatchesError);
      } else {
        console.log(`📊 Partidas restantes: ${remainingMatches?.length || 0}`);
      }

      const { data: remainingComps, error: remCompError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('team_id', testTeam.id);

      if (remCompError) {
        console.error('Erro ao verificar competições restantes:', remCompError);
      } else {
        console.log(`🏆 Competições restantes: ${remainingComps?.length || 0}`);
      }

      const { data: remainingAcads, error: remAcadError } = await supabase
        .from('youth_academies')
        .select('id')
        .eq('team_id', testTeam.id);

      if (remAcadError) {
        console.error('Erro ao verificar academias restantes:', remAcadError);
      } else {
        console.log(`🎓 Academias restantes: ${remainingAcads?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar o teste
testTeamDeletion()
  .then(() => {
    console.log('🎉 Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução do teste:', error);
    process.exit(1);
  }); 