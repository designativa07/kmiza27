const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - usar as mesmas credenciais do projeto
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanOrphanPlayers() {
  try {
    console.log('🧹 Iniciando limpeza de jogadores órfãos...');

    // 1. Verificar jogadores órfãos em game_players
    const { data: orphanGamePlayers, error: gameError } = await supabase
      .from('game_players')
      .select('id, name, team_id')
      .is('team_id', null);

    if (gameError) {
      console.error('❌ Erro ao buscar game_players órfãos:', gameError);
      return;
    }

    console.log(`📊 Encontrados ${orphanGamePlayers?.length || 0} game_players órfãos`);

    // 2. Verificar jogadores órfãos em youth_players
    const { data: orphanYouthPlayers, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, team_id')
      .is('team_id', null);

    if (youthError) {
      console.error('❌ Erro ao buscar youth_players órfãos:', youthError);
      return;
    }

    console.log(`📊 Encontrados ${orphanYouthPlayers?.length || 0} youth_players órfãos`);

    // 3. Deletar game_players órfãos
    if (orphanGamePlayers && orphanGamePlayers.length > 0) {
      const { error: deleteGameError } = await supabase
        .from('game_players')
        .delete()
        .is('team_id', null);

      if (deleteGameError) {
        console.error('❌ Erro ao deletar game_players órfãos:', deleteGameError);
      } else {
        console.log(`✅ ${orphanGamePlayers.length} game_players órfãos deletados`);
      }
    }

    // 4. Deletar youth_players órfãos
    if (orphanYouthPlayers && orphanYouthPlayers.length > 0) {
      const { error: deleteYouthError } = await supabase
        .from('youth_players')
        .delete()
        .is('team_id', null);

      if (deleteYouthError) {
        console.error('❌ Erro ao deletar youth_players órfãos:', deleteYouthError);
      } else {
        console.log(`✅ ${orphanYouthPlayers.length} youth_players órfãos deletados`);
      }
    }

    // 5. Verificar jogadores com team_id inválido (que não existem em game_teams)
    const { data: invalidTeamPlayers, error: invalidError } = await supabase
      .from('game_players')
      .select('id, name, team_id')
      .not('team_id', 'is', null);

    if (invalidError) {
      console.error('❌ Erro ao buscar jogadores com team_id inválido:', invalidError);
      return;
    }

    if (invalidTeamPlayers && invalidTeamPlayers.length > 0) {
      console.log(`🔍 Verificando ${invalidTeamPlayers.length} jogadores com team_id...`);
      
      let deletedCount = 0;
      for (const player of invalidTeamPlayers) {
        // Verificar se o time existe
        const { data: team, error: teamError } = await supabase
          .from('game_teams')
          .select('id')
          .eq('id', player.team_id)
          .single();

        if (teamError || !team) {
          // Time não existe, deletar jogador
          const { error: deleteError } = await supabase
            .from('game_players')
            .delete()
            .eq('id', player.id);

          if (deleteError) {
            console.error(`❌ Erro ao deletar jogador ${player.name}:`, deleteError);
          } else {
            console.log(`🗑️ Jogador órfão deletado: ${player.name} (team_id: ${player.team_id})`);
            deletedCount++;
          }
        }
      }
      
      console.log(`✅ ${deletedCount} jogadores com team_id inválido deletados`);
    }

    console.log('🎉 Limpeza de jogadores órfãos concluída!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar o script
cleanOrphanPlayers()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
