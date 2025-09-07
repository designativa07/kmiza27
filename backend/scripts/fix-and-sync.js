const { fixSyncForeignKeys } = require('./fix-sync-foreign-keys');
const { syncWithForeignKeyFix } = require('./sync-with-foreign-key-fix');
const { testSyncFix } = require('./test-sync-fix');

/**
 * Script principal que executa toda a correção e sincronização
 * 1. Limpa o banco de desenvolvimento
 * 2. Testa a configuração
 * 3. Executa sincronização melhorada
 */

async function fixAndSync() {
  console.log('🚀 Correção e Sincronização Completa');
  console.log('===================================');
  
  try {
    // Passo 1: Limpar banco de desenvolvimento
    console.log('\n📋 Passo 1: Limpando banco de desenvolvimento...');
    await fixSyncForeignKeys();
    
    // Passo 2: Testar configuração
    console.log('\n📋 Passo 2: Testando configuração...');
    await testSyncFix();
    
    // Passo 3: Executar sincronização melhorada
    console.log('\n📋 Passo 3: Executando sincronização melhorada...');
    await syncWithForeignKeyFix();
    
    console.log('\n🎉 Processo completo executado com sucesso!');
    console.log('✅ Banco limpo, testado e sincronizado');
    
  } catch (error) {
    console.error('\n💥 Erro durante execução:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixAndSync()
    .then(() => {
      console.log('✅ Script principal executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixAndSync };

