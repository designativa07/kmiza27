const { SyncService } = require('./dist/src/modules/sync/sync.service');

async function testSyncService() {
  console.log('🧪 Testando SyncService...');
  
  try {
    // Simular ambiente de desenvolvimento
    process.env.NODE_ENV = 'development';
    process.env.PROD_DB_PASSWORD = process.env.PROD_DB_PASSWORD || 'your_prod_password';
    
    const syncService = new SyncService();
    
    console.log('🔄 Iniciando sincronização...');
    const result = await syncService.syncFromProduction();
    
    console.log('✅ Resultado da sincronização:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

testSyncService();

