const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixForeignKeys() {
  try {
    console.log('🔧 Iniciando correção das constraints de chave estrangeira...');

    // 1. Remover e recriar constraints para game_matches
    console.log('📋 Corrigindo game_matches...');
    
    // Remover constraints existentes
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE IF EXISTS game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;
        
        ALTER TABLE IF EXISTS game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;
      `
    });

    // Recriar com CASCADE
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
      `
    });

    // 2. Verificar e corrigir game_competition_teams
    console.log('📋 Verificando game_competition_teams...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_competition_teams' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE game_competition_teams 
                DROP CONSTRAINT IF EXISTS game_competition_teams_team_id_fkey;
                
                ALTER TABLE game_competition_teams 
                ADD CONSTRAINT game_competition_teams_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 3. Verificar e corrigir game_competition_matches
    console.log('📋 Verificando game_competition_matches...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_competition_matches' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND (tc.constraint_name LIKE '%home_team_id%' OR tc.constraint_name LIKE '%away_team_id%')
            ) THEN
                ALTER TABLE game_competition_matches 
                DROP CONSTRAINT IF EXISTS game_competition_matches_home_team_id_fkey;
                
                ALTER TABLE game_competition_matches 
                DROP CONSTRAINT IF EXISTS game_competition_matches_away_team_id_fkey;
                
                ALTER TABLE game_competition_matches 
                ADD CONSTRAINT game_competition_matches_home_team_id_fkey 
                FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
                
                ALTER TABLE game_competition_matches 
                ADD CONSTRAINT game_competition_matches_away_team_id_fkey 
                FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 4. Verificar e corrigir game_team_history
    console.log('📋 Verificando game_team_history...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_team_history' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE game_team_history 
                DROP CONSTRAINT IF EXISTS game_team_history_team_id_fkey;
                
                ALTER TABLE game_team_history 
                ADD CONSTRAINT game_team_history_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 5. Verificar e corrigir game_direct_matches
    console.log('📋 Verificando game_direct_matches...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_direct_matches' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND (tc.constraint_name LIKE '%home_team_id%' OR tc.constraint_name LIKE '%away_team_id%')
            ) THEN
                ALTER TABLE game_direct_matches 
                DROP CONSTRAINT IF EXISTS game_direct_matches_home_team_id_fkey;
                
                ALTER TABLE game_direct_matches 
                DROP CONSTRAINT IF EXISTS game_direct_matches_away_team_id_fkey;
                
                ALTER TABLE game_direct_matches 
                ADD CONSTRAINT game_direct_matches_home_team_id_fkey 
                FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
                
                ALTER TABLE game_direct_matches 
                ADD CONSTRAINT game_direct_matches_away_team_id_fkey 
                FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 6. Verificar e corrigir game_head_to_head
    console.log('📋 Verificando game_head_to_head...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_head_to_head' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND (tc.constraint_name LIKE '%team1_id%' OR tc.constraint_name LIKE '%team2_id%')
            ) THEN
                ALTER TABLE game_head_to_head 
                DROP CONSTRAINT IF EXISTS game_head_to_head_team1_id_fkey;
                
                ALTER TABLE game_head_to_head 
                DROP CONSTRAINT IF EXISTS game_head_to_head_team2_id_fkey;
                
                ALTER TABLE game_head_to_head 
                ADD CONSTRAINT game_head_to_head_team1_id_fkey 
                FOREIGN KEY (team1_id) REFERENCES game_teams(id) ON DELETE CASCADE;
                
                ALTER TABLE game_head_to_head 
                ADD CONSTRAINT game_head_to_head_team2_id_fkey 
                FOREIGN KEY (team2_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 7. Verificar e corrigir game_team_stats
    console.log('📋 Verificando game_team_stats...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'game_team_stats' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE game_team_stats 
                DROP CONSTRAINT IF EXISTS game_team_stats_team_id_fkey;
                
                ALTER TABLE game_team_stats 
                ADD CONSTRAINT game_team_stats_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 8. Verificar e corrigir youth_academies
    console.log('📋 Verificando youth_academies...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'youth_academies' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE youth_academies 
                DROP CONSTRAINT IF EXISTS youth_academies_team_id_fkey;
                
                ALTER TABLE youth_academies 
                ADD CONSTRAINT youth_academies_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 9. Verificar e corrigir youth_players
    console.log('📋 Verificando youth_players...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'youth_players' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE youth_players 
                DROP CONSTRAINT IF EXISTS youth_players_team_id_fkey;
                
                ALTER TABLE youth_players 
                ADD CONSTRAINT youth_players_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    // 10. Verificar e corrigir youth_tryouts
    console.log('📋 Verificando youth_tryouts...');
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'youth_tryouts' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND rc.delete_rule = 'CASCADE'
                AND tc.constraint_name LIKE '%team_id%'
            ) THEN
                ALTER TABLE youth_tryouts 
                DROP CONSTRAINT IF EXISTS youth_tryouts_team_id_fkey;
                
                ALTER TABLE youth_tryouts 
                ADD CONSTRAINT youth_tryouts_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            END IF;
        END $$;
      `
    });

    console.log('✅ Constraints de chave estrangeira corrigidas com sucesso!');
    
    // Verificar as constraints atualizadas
    console.log('📋 Verificando constraints atualizadas...');
    const { data: constraints, error } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        table_name,
        constraint_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY')
      .like('table_name', '%game%');

    if (error) {
      console.error('Erro ao verificar constraints:', error);
    } else {
      console.log('Constraints encontradas:', constraints);
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir constraints:', error);
    throw error;
  }
}

// Executar o script
fixForeignKeys()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  }); 