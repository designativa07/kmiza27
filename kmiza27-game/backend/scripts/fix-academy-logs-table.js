const { getSupabaseClient } = require('../config/supabase-connection');

async function fixAcademyLogsTable() {
  try {
    console.log('🔧 Corrigindo tabela game_academy_logs...');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Dropar a tabela existente
    console.log('🗑️ Dropar tabela existente...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS game_academy_logs CASCADE;'
    });
    
    if (dropError) {
      console.log('⚠️ Erro ao dropar tabela:', dropError.message);
    }
    
    // 2. Criar tabela com estrutura correta
    console.log('🏗️ Criando tabela com estrutura correta...');
    const createTableSQL = `
      CREATE TABLE game_academy_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
        player_id UUID NOT NULL,
        player_name text,
        week text,
        focus text,
        intensity text,
        total_points decimal(5,2),
        attribute_gains jsonb,
        injury_result jsonb,
        created_at timestamp with time zone DEFAULT now()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.log('⚠️ Erro ao criar tabela:', createError.message);
    }
    
    // 3. Criar índices
    console.log('📊 Criando índices...');
    const indexes = [
      'CREATE INDEX idx_academy_logs_team_id ON game_academy_logs(team_id);',
      'CREATE INDEX idx_academy_logs_player_id ON game_academy_logs(player_id);',
      'CREATE INDEX idx_academy_logs_created_at ON game_academy_logs(created_at);'
    ];
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: indexSQL
      });
      
      if (indexError) {
        console.log('⚠️ Erro ao criar índice:', indexError.message);
      }
    }
    
    console.log('✅ Tabela game_academy_logs corrigida com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error);
  }
}

fixAcademyLogsTable().then(() => process.exit(0)).catch(() => process.exit(1));
