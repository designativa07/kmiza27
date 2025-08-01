const { getSupabaseServiceClient } = require('../config/supabase-connection');
const fs = require('fs');
const path = require('path');

console.log('🔧 EXECUTANDO SQL PARA ADICIONAR COLUNAS');
console.log('=' .repeat(40));

async function executeSQL() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'add-competition-columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n📋 1. Executando comandos SQL...');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`📋 Executando comando ${i + 1}/${commands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: command });
      
      if (error) {
        console.log(`❌ Erro no comando ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    console.log('\n✅ SQL executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
  }
}

// Executar SQL
if (require.main === module) {
  executeSQL();
}

module.exports = {
  executeSQL
}; 