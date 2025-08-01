const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const SUPABASE_CONFIG = {
  // VPS (Produção)
  vps: {
    url: 'https://kmiza27-supabase.h4xd66.easypanel.host',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
  },
  // Local (Desenvolvimento)
  local: {
    url: 'http://localhost:54321',
    anonKey: 'your-anon-key',
    serviceKey: 'your-service-key'
  }
};

// Função para obter cliente Supabase
function getSupabaseClient(environment = 'vps') {
  const config = SUPABASE_CONFIG[environment];
  
  if (!config) {
    throw new Error(`Ambiente '${environment}' não configurado`);
  }

  return createClient(config.url, config.anonKey);
}

// Função para obter cliente com service role (para operações administrativas)
function getSupabaseServiceClient(environment = 'vps') {
  const config = SUPABASE_CONFIG[environment];
  
  if (!config) {
    throw new Error(`Ambiente '${environment}' não configurado`);
  }

  return createClient(config.url, config.serviceKey);
}

// Função para executar migrações SQL
async function executeMigration(sql, environment = 'vps') {
  try {
    const supabase = getSupabaseServiceClient(environment);
    
    console.log(`🔄 Executando migração no ambiente: ${environment}`);
    console.log(`📝 SQL: ${sql.substring(0, 100)}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro na migração:', error);
      throw error;
    }
    
    console.log('✅ Migração executada com sucesso!');
    return data;
  } catch (error) {
    console.error('💥 Erro ao executar migração:', error);
    throw error;
  }
}

// Função para verificar conectividade
async function testConnection(environment = 'vps') {
  try {
    const supabase = getSupabaseClient(environment);
    
    console.log(`🔍 Testando conexão com ${environment}...`);
    
    const { data, error } = await supabase
      .from('game_teams')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error(`❌ Erro na conexão:`, error);
      return false;
    }
    
    console.log(`✅ Conexão com ${environment} estabelecida com sucesso!`);
    return true;
  } catch (error) {
    console.error(`💥 Erro ao testar conexão:`, error);
    return false;
  }
}

// Função para listar tabelas disponíveis
async function listTables(environment = 'vps') {
  try {
    const supabase = getSupabaseClient(environment);
    
    console.log(`📋 Listando tabelas no ambiente: ${environment}`);
    
    const tables = ['game_users', 'game_teams', 'youth_players', 'youth_academies', 'youth_categories', 'game_matches'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Não encontrada`);
      }
    }
  } catch (error) {
    console.error('💥 Erro ao listar tabelas:', error);
  }
}

module.exports = {
  getSupabaseClient,
  getSupabaseServiceClient,
  executeMigration,
  testConnection,
  listTables,
  SUPABASE_CONFIG
}; 