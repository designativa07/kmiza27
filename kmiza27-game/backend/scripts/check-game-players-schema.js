const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkGamePlayersSchema() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA GAME_PLAYERS');
  console.log('================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Verificando estrutura da tabela...');
    
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao buscar amostra:', sampleError.message);
      return;
    }

    if (samplePlayer && samplePlayer.length > 0) {
      console.log('✅ Tabela acessível');
      console.log('📊 Colunas disponíveis:');
      Object.keys(samplePlayer[0]).forEach(col => {
        console.log(`   • ${col}`);
      });
    } else {
      console.log('ℹ️  Tabela vazia, verificando estrutura via schema...');
      
      // Tentar inserir um jogador mínimo para ver as constraints
      const testPlayer = {
        id: require('crypto').randomUUID(),
        team_id: '00000000-0000-0000-0000-000000000000', // ID fake para teste
        name: 'Teste',
        position: 'GK',
        nationality: 'BRA',
        age: 25,
        goalkeeping: 75,
        defending: 50,
        passing: 50,
        dribbling: 50,
        shooting: 50,
        potential: 65,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('game_players')
        .insert(testPlayer);

      if (insertError) {
        console.log('❌ Erro na inserção de teste:', insertError.message);
        
        // Tentar identificar as colunas obrigatórias
        if (insertError.message.includes('column')) {
          const columnMatch = insertError.message.match(/column "([^"]+)"/);
          if (columnMatch) {
            console.log(`🔍 Coluna problemática: ${columnMatch[1]}`);
          }
        }
      }
    }

    // 2. Verificar constraints
    console.log('\n🔒 2. Verificando constraints...');
    
    try {
      const { error: constraintError } = await supabase.rpc('get_table_constraints', {
        table_name: 'game_players'
      });
      
      if (constraintError) {
        console.log('   ℹ️  Não foi possível verificar constraints via RPC');
      } else {
        console.log('   ✅ Constraints verificadas');
      }
    } catch (error) {
      console.log('   ℹ️  Verificação de constraints não disponível');
    }

    // 3. Verificar se há jogadores existentes
    console.log('\n📊 3. Verificando jogadores existentes...');
    
    const { count: playerCount, error: countError } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Erro ao contar jogadores:', countError.message);
    } else {
      console.log(`📊 Total de jogadores: ${playerCount || 0}`);
    }

    // 4. Verificar times com jogadores
    console.log('\n🏟️ 4. Verificando times com jogadores...');
    
    const { data: teamsWithPlayers, error: teamsError } = await supabase
      .from('game_players')
      .select('team_id, COUNT(*)', { count: 'exact', head: true })
      .group('team_id');

    if (teamsError) {
      console.log('❌ Erro ao verificar times:', teamsError.message);
    } else {
      console.log(`📊 Times com jogadores: ${teamsWithPlayers?.length || 0}`);
      teamsWithPlayers?.forEach(team => {
        console.log(`   • Time ${team.team_id}: ${team.count} jogadores`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkGamePlayersSchema();
