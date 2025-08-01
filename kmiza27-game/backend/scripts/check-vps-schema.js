const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração para o Supabase na VPS
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVPSSchema() {
  try {
    console.log('🔍 Verificando schema do banco na VPS...');
    
    // Verificar se as tabelas existem
    const tables = ['game_users', 'game_teams', 'youth_players', 'youth_academies'];
    
    for (const table of tables) {
      console.log(`📋 Verificando tabela: ${table}`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ Erro ao acessar ${table}:`, error.message);
        } else {
          console.log(`  ✅ Tabela ${table} existe e está acessível`);
        }
      } catch (err) {
        console.log(`  ❌ Tabela ${table} não existe ou não está acessível`);
      }
    }

    // Verificar se há dados nas tabelas
    console.log('\n📊 Verificando dados existentes...');
    
    const { data: users, error: usersError } = await supabase
      .from('game_users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('  ❌ Erro ao verificar game_users:', usersError.message);
    } else {
      console.log('  ✅ game_users está acessível');
    }

    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('count')
      .limit(1);
    
    if (teamsError) {
      console.log('  ❌ Erro ao verificar game_teams:', teamsError.message);
    } else {
      console.log('  ✅ game_teams está acessível');
    }

    console.log('\n🎉 Verificação do schema concluída!');

  } catch (error) {
    console.error('💥 Erro na verificação:', error);
  }
}

checkVPSSchema().then(() => process.exit(0)).catch(() => process.exit(1)); 