const { getSupabaseClient } = require('../config/supabase-connection');

async function checkTable(tableName = 'game_matches') {
  try {
    console.log(`🔍 Verificando estrutura da tabela ${tableName}...`);
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar se a tabela existe tentando buscar dados
    const { data: records, error: tableError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Tabela ${tableName} não existe ou não está acessível`);
      console.log('Erro:', tableError.message);
      return;
    }
    
    console.log(`✅ Tabela ${tableName} existe e está acessível`);
    
    if (!records || records.length === 0) {
      console.log(`📝 Tabela ${tableName} está vazia - não há dados para analisar`);
      return;
    }
    
    // Pegar o primeiro registro para ver as colunas
    const sampleRecord = records[0];
    
    console.log(`\n📋 Colunas disponíveis na tabela ${tableName}:`);
    Object.keys(sampleRecord).forEach(column => {
      const value = sampleRecord[column];
      const type = typeof value;
      const isNull = value === null;
      console.log(`  - ${column}: ${type}${isNull ? ' (null)' : ''}`);
    });
    
    // Buscar mais registros para mostrar exemplos
    const { data: allRecords, error: allRecordsError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (allRecordsError) {
      console.error(`❌ Erro ao buscar registros de ${tableName}:`, allRecordsError);
      return;
    }
    
    console.log(`\n📊 Encontrados ${allRecords.length} registros de exemplo:`);
    allRecords.forEach((record, index) => {
      // Mostrar apenas os primeiros campos para não poluir o output
      const keys = Object.keys(record).slice(0, 3);
      const preview = keys.map(key => `${key}: ${record[key]}`).join(', ');
      console.log(`  ${index + 1}. ${preview}${keys.length < Object.keys(record).length ? '...' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Permitir especificar a tabela via argumento de linha de comando
const tableName = process.argv[2] || 'game_matches';
checkTable(tableName); 