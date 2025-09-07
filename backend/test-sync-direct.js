const { SyncService } = require('./src/modules/sync/sync.service');

/**
 * Script para testar sincronização diretamente
 */

async function testSyncDirect() {
  console.log('🔄 Testando sincronização diretamente...');

  try {
    // Criar instância do SyncService
    const syncService = new SyncService();
    
    // Executar sincronização
    console.log('🚀 Iniciando sincronização...');
    const result = await syncService.syncFromProduction();
    
    console.log('✅ Sincronização concluída!');
    console.log('📊 Resultado:', result);
    
  } catch (error) {
    console.error('💥 Erro na sincronização:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSyncDirect()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testSyncDirect };

