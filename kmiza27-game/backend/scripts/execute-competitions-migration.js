const fs = require('fs');
const path = require('path');
const { executeMigration } = require('../config/supabase-connection');

async function executeCompetitionsMigration() {
  try {
    console.log('🚀 Iniciando migração do sistema de competições...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '../database/create-competitions-system.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado, executando migração...');
    
    // Executar a migração usando o padrão do projeto
    await executeMigration(sqlContent, 'vps');
    
    console.log('🎉 Migração concluída!');
    
  } catch (error) {
    console.error('💥 Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeCompetitionsMigration();
}

module.exports = { executeCompetitionsMigration }; 