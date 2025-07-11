console.log('🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE');
console.log('=====================================');

console.log('📋 Variáveis Evolution API:');
console.log(`EVOLUTION_API_URL: ${process.env.EVOLUTION_API_URL || 'NOT_SET'}`);
console.log(`EVOLUTION_API_KEY: ${process.env.EVOLUTION_API_KEY ? process.env.EVOLUTION_API_KEY.substring(0, 8) + '...' : 'NOT_SET'}`);
console.log(`EVOLUTION_INSTANCE_NAME: ${process.env.EVOLUTION_INSTANCE_NAME || 'NOT_SET'}`);

console.log('\n📋 Outras variáveis:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT_SET'}`);
console.log(`PORT: ${process.env.PORT || 'NOT_SET'}`);

console.log('\n🔧 Importando configuração...');
try {
  const { evolutionConfig } = require('./src/config/evolution.config');
  console.log('✅ Configuração carregada:');
  console.log(`apiUrl: ${evolutionConfig.apiUrl}`);
  console.log(`apiKey: ${evolutionConfig.apiKey ? evolutionConfig.apiKey.substring(0, 8) + '...' : 'NOT_SET'}`);
  console.log(`instanceName: ${evolutionConfig.instanceName}`);
  console.log(`enabled: ${evolutionConfig.enabled}`);
} catch (error) {
  console.log('❌ Erro ao carregar configuração:', error.message);
}

console.log('\n🧪 Testando com a configuração carregada...');
async function testConfig() {
  try {
    const { evolutionConfig } = require('./src/config/evolution.config');
    
    console.log('🔍 Testando fetchInstances...');
    const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': evolutionConfig.apiKey,
      },
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      const instance = data.find(i => i.name === evolutionConfig.instanceName);
      console.log(`✅ Instância encontrada: ${!!instance}`);
      if (instance) {
        console.log(`   - Status: ${instance.connectionStatus}`);
      }
    } else {
      const error = await response.text();
      console.log(`❌ Erro: ${error}`);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testConfig(); 