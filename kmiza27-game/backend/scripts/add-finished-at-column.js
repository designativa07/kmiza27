const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurar Supabase
const supabaseUrl = 'https://eqgtjgchitqjlqsctcsf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3RqZ2NoaXRxamxxc2N0Y3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1OTQ0MjQsImV4cCI6MjA0OTE3MDQyNH0.VhvfXDM7z2EqyRhJOwFnSFqx3KO5fJY8rlPTyRN8Cgw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addFinishedAtColumn() {
  console.log('🔧 ADICIONANDO COLUNA finished_at');
  
  try {
    // Verificar se a coluna já existe
    console.log('🔍 Verificando se a coluna finished_at já existe...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'game_season_matches')
      .eq('column_name', 'finished_at');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('⚠️ Coluna finished_at já existe!');
      return;
    }
    
    // Adicionar a coluna via RPC (precisa de uma função no banco)
    console.log('➕ Adicionando coluna finished_at...');
    
    // Como não podemos executar DDL diretamente, vamos usar o SQL editor do Supabase
    console.log('📋 Execute este SQL no Supabase Studio:');
    console.log('');
    console.log('ALTER TABLE game_season_matches ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE;');
    console.log('');
    console.log('✅ Depois execute novamente este script para verificar.');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
  }
}

addFinishedAtColumn();