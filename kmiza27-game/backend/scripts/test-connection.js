const { testConnection, listTables, getSupabaseClient } = require('../config/supabase-connection');

async function testAllConnections() {
  try {
    console.log('🧪 Testando todas as conexões...\n');
    
    // Testar VPS
    console.log('📡 Testando VPS (Produção)...');
    const vpsConnected = await testConnection('vps');
    
    if (vpsConnected) {
      console.log('✅ VPS conectado com sucesso!');
      
      // Listar tabelas disponíveis
      await listTables('vps');
    } else {
      console.log('❌ Falha na conexão com VPS');
    }
    
    console.log('\n📡 Testando Local (Desenvolvimento)...');
    const localConnected = await testConnection('local');
    
    if (localConnected) {
      console.log('✅ Local conectado com sucesso!');
      await listTables('local');
    } else {
      console.log('❌ Falha na conexão com Local (normal se não estiver rodando)');
    }
    
    console.log('\n🎉 Teste de conexões concluído!');
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testAllConnections().then(() => process.exit(0)).catch(() => process.exit(1)); 