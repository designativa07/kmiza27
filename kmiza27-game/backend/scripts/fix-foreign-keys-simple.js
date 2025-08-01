const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixForeignKeysSimple() {
  try {
    console.log('🔧 Iniciando correção das constraints de chave estrangeira...');

    // 1. Corrigir apenas game_matches (tabela básica que sempre existe)
    console.log('📋 Corrigindo game_matches...');
    
    // Remover constraints existentes
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;
        
        ALTER TABLE IF EXISTS game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;
      `
    });

    if (dropError) {
      console.log('⚠️ Erro ao remover constraints (pode ser normal se não existirem):', dropError.message);
    }

    // Recriar com CASCADE
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
      `
    });

    if (addError) {
      console.error('❌ Erro ao adicionar constraints:', addError.message);
    } else {
      console.log('✅ Constraints de game_matches corrigidas com sucesso!');
    }

    // 2. Verificar se youth_academies existe e corrigir
    console.log('📋 Verificando youth_academies...');
    const { data: academiesCheck, error: academiesError } = await supabase
      .from('youth_academies')
      .select('id')
      .limit(1);

    if (academiesError && academiesError.code === '42P01') {
      console.log('⚠️ Tabela youth_academies não existe, pulando...');
    } else {
      console.log('📋 Corrigindo youth_academies...');
      const { error: acadError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE youth_academies 
          DROP CONSTRAINT IF EXISTS youth_academies_team_id_fkey;
          
          ALTER TABLE youth_academies 
          ADD CONSTRAINT youth_academies_team_id_fkey 
          FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        `
      });

      if (acadError) {
        console.error('❌ Erro ao corrigir youth_academies:', acadError.message);
      } else {
        console.log('✅ Constraints de youth_academies corrigidas!');
      }
    }

    // 3. Verificar se youth_players existe e corrigir
    console.log('📋 Verificando youth_players...');
    const { data: playersCheck, error: playersError } = await supabase
      .from('youth_players')
      .select('id')
      .limit(1);

    if (playersError && playersError.code === '42P01') {
      console.log('⚠️ Tabela youth_players não existe, pulando...');
    } else {
      console.log('📋 Corrigindo youth_players...');
      const { error: playersFixError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE youth_players 
          DROP CONSTRAINT IF EXISTS youth_players_team_id_fkey;
          
          ALTER TABLE youth_players 
          ADD CONSTRAINT youth_players_team_id_fkey 
          FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        `
      });

      if (playersFixError) {
        console.error('❌ Erro ao corrigir youth_players:', playersFixError.message);
      } else {
        console.log('✅ Constraints de youth_players corrigidas!');
      }
    }

    // 4. Verificar se youth_tryouts existe e corrigir
    console.log('📋 Verificando youth_tryouts...');
    const { data: tryoutsCheck, error: tryoutsError } = await supabase
      .from('youth_tryouts')
      .select('id')
      .limit(1);

    if (tryoutsError && tryoutsError.code === '42P01') {
      console.log('⚠️ Tabela youth_tryouts não existe, pulando...');
    } else {
      console.log('📋 Corrigindo youth_tryouts...');
      const { error: tryoutsFixError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE youth_tryouts 
          DROP CONSTRAINT IF EXISTS youth_tryouts_team_id_fkey;
          
          ALTER TABLE youth_tryouts 
          ADD CONSTRAINT youth_tryouts_team_id_fkey 
          FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        `
      });

      if (tryoutsFixError) {
        console.error('❌ Erro ao corrigir youth_tryouts:', tryoutsFixError.message);
      } else {
        console.log('✅ Constraints de youth_tryouts corrigidas!');
      }
    }

    console.log('✅ Correção das constraints concluída!');
    
    // Testar se a exclusão de times agora funciona
    console.log('🧪 Testando exclusão de times...');
    await testTeamDeletion();

  } catch (error) {
    console.error('❌ Erro ao corrigir constraints:', error);
    throw error;
  }
}

async function testTeamDeletion() {
  try {
    // Buscar um time para testar
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
    console.log(`📋 Testando exclusão do time: ${testTeam.name} (ID: ${testTeam.id})`);

    // Verificar dependências antes da exclusão
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('id, home_team_id, away_team_id')
      .or(`home_team_id.eq.${testTeam.id},away_team_id.eq.${testTeam.id}`);

    if (matchesError) {
      console.error('Erro ao verificar partidas:', matchesError);
    } else {
      console.log(`📊 Partidas encontradas: ${matches?.length || 0}`);
    }

    // Tentar excluir o time
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
      console.log('🎉 A correção das constraints funcionou!');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar o script
fixForeignKeysSimple()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  }); 