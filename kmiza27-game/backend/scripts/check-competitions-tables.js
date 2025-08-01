const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompetitionsTables() {
  try {
    console.log('🔍 Verificando tabelas do sistema de competições...');

    const tables = [
      'game_competitions',
      'game_competition_teams', 
      'game_direct_matches',
      'game_match_invites',
      'game_team_stats',
      'game_head_to_head'
    ];

    for (const table of tables) {
      try {
        console.log(`📋 Verificando tabela ${table}...`);
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: Acessível (${data?.length || 0} registros)`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('💥 Erro ao verificar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkCompetitionsTables().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { checkCompetitionsTables }; 