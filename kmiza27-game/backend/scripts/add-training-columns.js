const { getSupabaseClient } = require('../config/supabase-connection');

async function addTrainingColumns() {
  try {
    console.log('🔧 Adicionando colunas de treinamento às tabelas...');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Adicionar colunas à tabela game_players
    console.log('\n📋 Adicionando colunas à tabela game_players...');
    
    const gamePlayersColumns = [
      'is_in_academy',
      'training_focus', 
      'training_intensity',
      'training_type',
      'updated_at'
    ];
    
    for (const column of gamePlayersColumns) {
      try {
        let defaultValue = '';
        if (column === 'is_in_academy') defaultValue = 'DEFAULT false';
        else if (column === 'training_focus') defaultValue = "DEFAULT 'PAS'";
        else if (column === 'training_intensity') defaultValue = "DEFAULT 'normal'";
        else if (column === 'training_type') defaultValue = "DEFAULT 'mixed'";
        else if (column === 'updated_at') defaultValue = 'DEFAULT now()';
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE game_players ADD COLUMN IF NOT EXISTS ${column} ${column === 'is_in_academy' ? 'boolean' : column === 'updated_at' ? 'timestamp with time zone' : 'text'} ${defaultValue}`
        });
        
        if (error) {
          console.log(`   ⚠️ ${column}: ${error.message}`);
        } else {
          console.log(`   ✅ ${column}: adicionada`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${column}: ${err.message}`);
      }
    }
    
    // 2. Adicionar colunas à tabela youth_players
    console.log('\n📋 Adicionando colunas à tabela youth_players...');
    
    for (const column of gamePlayersColumns) {
      try {
        let defaultValue = '';
        if (column === 'is_in_academy') defaultValue = 'DEFAULT false';
        else if (column === 'training_focus') defaultValue = "DEFAULT 'PAS'";
        else if (column === 'training_intensity') defaultValue = "DEFAULT 'normal'";
        else if (column === 'training_type') defaultValue = "DEFAULT 'mixed'";
        else if (column === 'updated_at') defaultValue = 'DEFAULT now()';
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE youth_players ADD COLUMN IF NOT EXISTS ${column} ${column === 'is_in_academy' ? 'boolean' : column === 'updated_at' ? 'timestamp with time zone' : 'text'} ${defaultValue}`
        });
        
        if (error) {
          console.log(`   ⚠️ ${column}: ${error.message}`);
        } else {
          console.log(`   ✅ ${column}: adicionada`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${column}: ${err.message}`);
      }
    }
    
    // 3. Criar tabela de logs se não existir
    console.log('\n📋 Criando tabela de logs de academia...');
    
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS game_academy_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
        player_id UUID NOT NULL,
        player_name text,
        week text,
        focus text,
        intensity text,
        total_points decimal(5,2),
        attribute_gains jsonb DEFAULT '{}',
        injury_result jsonb DEFAULT '{}',
        created_at timestamp with time zone DEFAULT now()
      )
    `;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createLogsTable });
      if (error) {
        console.log(`   ⚠️ Tabela de logs: ${error.message}`);
      } else {
        console.log(`   ✅ Tabela de logs: criada`);
      }
    } catch (err) {
      console.log(`   ⚠️ Tabela de logs: ${err.message}`);
    }
    
    // 4. Criar índices
    console.log('\n📋 Criando índices...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_academy_logs_team_id ON game_academy_logs(team_id)',
      'CREATE INDEX IF NOT EXISTS idx_academy_logs_player_id ON game_academy_logs(player_id)',
      'CREATE INDEX IF NOT EXISTS idx_academy_logs_created_at ON game_academy_logs(created_at)'
    ];
    
    for (const index of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: index });
        if (error) {
          console.log(`   ⚠️ Índice: ${error.message}`);
        } else {
          console.log(`   ✅ Índice: criado`);
        }
      } catch (err) {
        console.log(`   ⚠️ Índice: ${err.message}`);
      }
    }
    
    // 5. Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando colunas criadas...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable, column_default')
      .in('table_name', ['game_players', 'youth_players'])
      .in('column_name', gamePlayersColumns)
      .order('table_name', { ascending: true })
      .order('column_name', { ascending: true });
    
    if (columnsError) {
      console.log(`   ⚠️ Erro ao verificar colunas: ${columnsError.message}`);
    } else {
      console.log(`   ✅ ${columns?.length || 0} colunas encontradas`);
      columns?.forEach(col => {
        console.log(`      ${col.table_name}.${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
  }
}

addTrainingColumns().then(() => process.exit(0)).catch(() => process.exit(1));
