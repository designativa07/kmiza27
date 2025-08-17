const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (use suas credenciais reais)
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addIsUserTeamColumn() {
  try {
    console.log('🚀 Iniciando migração para adicionar coluna is_user_team...');

    // 1. Adicionar a coluna is_user_team se ela não existir
    console.log('📝 Adicionando coluna is_user_team...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_teams 
        ADD COLUMN IF NOT EXISTS is_user_team BOOLEAN DEFAULT false;
      `
    });

    if (alterError) {
      console.log('⚠️  Coluna já existe ou erro ao adicionar:', alterError.message);
    } else {
      console.log('✅ Coluna is_user_team adicionada com sucesso!');
    }

    // 2. Atualizar times existentes: se owner_id não é null, é time do usuário
    console.log('🔄 Atualizando times existentes...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE game_teams 
        SET is_user_team = true 
        WHERE owner_id IS NOT NULL;
      `
    });

    if (updateError) {
      console.log('⚠️  Erro ao atualizar times existentes:', updateError.message);
    } else {
      console.log('✅ Times existentes atualizados com sucesso!');
    }

    // 3. Verificar a estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'game_teams' 
        AND column_name = 'is_user_team';
      `
    });

    if (columnsError) {
      console.log('⚠️  Erro ao verificar estrutura:', columnsError.message);
    } else {
      console.log('📊 Estrutura da coluna is_user_team:', columns);
    }

    // 4. Verificar dados dos times
    console.log('👥 Verificando dados dos times...');
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id, is_user_team')
      .limit(5);

    if (teamsError) {
      console.log('⚠️  Erro ao buscar times:', teamsError.message);
    } else {
      console.log('📋 Exemplo de times:', teams);
    }

    console.log('🎉 Migração concluída com sucesso!');
    console.log('💡 Agora a IA do mercado deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar a migração
addIsUserTeamColumn();
