const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🔍 VERIFICAÇÃO COMPLETA DE JOGADORES
 * 
 * Objetivos:
 * 1. Verificar todas as tabelas de jogadores
 * 2. Contar jogadores em cada tabela
 * 3. Identificar onde estão os dados
 */

async function checkAllPlayers() {
  try {
    console.log('🔍 VERIFICAÇÃO COMPLETA DE JOGADORES');
    console.log('=' .repeat(50));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR TODAS AS TABELAS
    console.log('\n📊 1. Verificando todas as tabelas...');
    
    // Lista de tabelas para verificar
    const tables = [
      'youth_players',
      'game_players', 
      'players',
      'game_transfers',
      'game_teams'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${table}: Erro - ${error.message}`);
        } else {
          // Contar total de registros
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (countError) {
            console.log(`   ⚠️ ${table}: Existe mas erro ao contar`);
          } else {
            console.log(`   ✅ ${table}: ${count} registros`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Tabela não existe`);
      }
    }

    // 2. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
    console.log('\n🏗️ 2. Verificando estrutura das tabelas...');
    
    // Verificar youth_players
    try {
      const { data: youthSample, error: youthError } = await supabase
        .from('youth_players')
        .select('*')
        .limit(1);

      if (youthError) {
        console.log('   ❌ youth_players: Erro ao acessar');
      } else if (youthSample && youthSample.length > 0) {
        const columns = Object.keys(youthSample[0]);
        console.log(`   ✅ youth_players: Colunas disponíveis: ${columns.join(', ')}`);
      } else {
        console.log('   ⚠️ youth_players: Tabela vazia');
      }
    } catch (err) {
      console.log('   ❌ youth_players: Tabela não existe');
    }

    // Verificar game_players
    try {
      const { data: gameSample, error: gameError } = await supabase
        .from('game_players')
        .select('*')
        .limit(1);

      if (gameError) {
        console.log('   ❌ game_players: Erro ao acessar');
      } else if (gameSample && gameSample.length > 0) {
        const columns = Object.keys(gameSample[0]);
        console.log(`   ✅ game_players: Colunas disponíveis: ${columns.join(', ')}`);
      } else {
        console.log('   ⚠️ game_players: Tabela vazia');
      }
    } catch (err) {
      console.log('   ❌ game_players: Tabela não existe');
    }

    // 3. VERIFICAR TIMES E SEUS JOGADORES
    console.log('\n👥 3. Verificando times e seus jogadores...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, is_user_team')
      .limit(5);

    if (teamsError) {
      console.error('❌ Erro ao buscar times:', teamsError);
    } else if (teams && teams.length > 0) {
      console.log(`📋 Verificando ${teams.length} times...`);
      
      for (const team of teams) {
        console.log(`\n   🏟️ ${team.name} (${team.is_user_team ? 'Usuário' : 'IA'}):`);
        
        // Contar jogadores da base
        try {
          const { count: youthCount, error: youthCountError } = await supabase
            .from('youth_players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          if (youthCountError) {
            console.log(`     ❌ youth_players: Erro - ${youthCountError.message}`);
          } else {
            console.log(`     👶 youth_players: ${youthCount || 0}`);
          }
        } catch (err) {
          console.log(`     ❌ youth_players: Tabela não existe`);
        }

        // Contar jogadores profissionais
        try {
          const { count: proCount, error: proCountError } = await supabase
            .from('game_players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          if (proCountError) {
            console.log(`     ❌ game_players: Erro - ${proCountError.message}`);
          } else {
            console.log(`     👨‍💼 game_players: ${proCount || 0}`);
          }
        } catch (err) {
          console.log(`     ❌ game_players: Tabela não existe`);
        }
      }
    }

    // 4. VERIFICAR SE HÁ JOGADORES EM OUTRAS TABELAS
    console.log('\n🔍 4. Verificando outras possíveis tabelas...');
    
    const otherTables = [
      'players',
      'team_players',
      'squad_players',
      'roster_players'
    ];

    for (const table of otherTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // Tabela não existe ou erro
        } else if (count > 0) {
          console.log(`   ✅ ${table}: ${count} jogadores encontrados!`);
        }
      } catch (err) {
        // Tabela não existe
      }
    }

    console.log('\n✅ VERIFICAÇÃO COMPLETA CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
checkAllPlayers().then(() => {
  console.log('\n🔌 Script concluído.');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
