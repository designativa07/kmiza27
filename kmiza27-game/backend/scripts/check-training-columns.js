const { getSupabaseClient } = require('../config/supabase-connection');

async function checkTrainingColumns() {
  try {
    console.log('🔍 Verificando colunas de treinamento existentes...');
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar game_players
    console.log('\n📋 Verificando game_players...');
    try {
      const { data: gamePlayers, error: gameError } = await supabase
        .from('game_players')
        .select('id, name, position')
        .limit(1);
      
      if (gameError) {
        console.log(`   ❌ Erro: ${gameError.message}`);
      } else {
        console.log(`   ✅ Tabela game_players acessível`);
        
        // Tentar selecionar colunas de treinamento
        const { data: trainingData, error: trainingError } = await supabase
          .from('game_players')
          .select('is_in_academy, training_focus, training_intensity, training_type, updated_at')
          .limit(1);
        
        if (trainingError) {
          console.log(`   ⚠️ Colunas de treinamento não existem: ${trainingError.message}`);
        } else {
          console.log(`   ✅ Colunas de treinamento existem em game_players`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro ao acessar game_players: ${err.message}`);
    }
    
    // Verificar youth_players
    console.log('\n📋 Verificando youth_players...');
    try {
      const { data: youthPlayers, error: youthError } = await supabase
        .from('youth_players')
        .select('id, name, position')
        .limit(1);
      
      if (youthError) {
        console.log(`   ❌ Erro: ${youthError.message}`);
      } else {
        console.log(`   ✅ Tabela youth_players acessível`);
        
        // Tentar selecionar colunas de treinamento
        const { data: trainingData, error: trainingError } = await supabase
          .from('youth_players')
          .select('is_in_academy, training_focus, training_intensity, training_type, updated_at')
          .limit(1);
        
        if (trainingError) {
          console.log(`   ⚠️ Colunas de treinamento não existem: ${trainingError.message}`);
        } else {
          console.log(`   ✅ Colunas de treinamento existem em youth_players`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro ao acessar youth_players: ${err.message}`);
    }
    
    // Verificar game_academy_logs
    console.log('\n📋 Verificando game_academy_logs...');
    try {
      const { data: logs, error: logsError } = await supabase
        .from('game_academy_logs')
        .select('*')
        .limit(1);
      
      if (logsError) {
        console.log(`   ❌ Tabela não existe: ${logsError.message}`);
      } else {
        console.log(`   ✅ Tabela game_academy_logs existe`);
      }
    } catch (err) {
      console.log(`   ❌ Erro ao acessar game_academy_logs: ${err.message}`);
    }
    
    // Verificar time específico
    console.log('\n📋 Verificando time específico...');
    const teamId = '2abd2e67-8563-466e-995f-e9e619cf6e46';
    
    try {
      const { data: team, error: teamError } = await supabase
        .from('game_teams')
        .select('id, name, owner_id')
        .eq('id', teamId)
        .single();
      
      if (teamError) {
        console.log(`   ❌ Time não encontrado: ${teamError.message}`);
      } else {
        console.log(`   ✅ Time encontrado: ${team.name}`);
        
        // Verificar jogadores do time
        const { data: players, error: playersError } = await supabase
          .from('game_players')
          .select('id, name, position, age')
          .eq('team_id', teamId)
          .limit(5);
        
        if (playersError) {
          console.log(`   ❌ Erro ao buscar jogadores: ${playersError.message}`);
        } else {
          console.log(`   ✅ ${players?.length || 0} jogadores encontrados`);
          players?.forEach(player => {
            console.log(`      - ${player.name} (${player.position}, ${player.age} anos)`);
          });
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro ao verificar time: ${err.message}`);
    }
    
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkTrainingColumns().then(() => process.exit(0)).catch(() => process.exit(1));
