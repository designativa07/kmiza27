#!/usr/bin/env node

console.log('🔍 TESTANDO VARIÁVEIS DE AMBIENTE');
console.log('='.repeat(50));

// Carregar dotenv se disponível
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando apenas process.env');
}

const envVars = {
  'EVOLUTION_API_URL': process.env.EVOLUTION_API_URL,
  'EVOLUTION_API_KEY': process.env.EVOLUTION_API_KEY,
  'EVOLUTION_INSTANCE_NAME': process.env.EVOLUTION_INSTANCE_NAME,
  'NODE_ENV': process.env.NODE_ENV,
  'DATABASE_URL': process.env.DATABASE_URL,
  'PORT': process.env.PORT,
};

console.log('\n📋 VARIÁVEIS DE AMBIENTE:');
Object.entries(envVars).forEach(([key, value]) => {
  if (key.includes('KEY') || key.includes('URL') || key.includes('PASSWORD')) {
    // Mascarar valores sensíveis
    console.log(`${key}: ${value ? `${value.substring(0, 8)}...` : 'NÃO DEFINIDA'}`);
  } else {
    console.log(`${key}: ${value || 'NÃO DEFINIDA'}`);
  }
});

console.log('\n🔧 CONFIGURAÇÕES DA EVOLUTION API:');
const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com';
const evolutionKey = process.env.EVOLUTION_API_KEY || '';
const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27';

console.log(`📡 URL: ${evolutionUrl}`);
console.log(`🤖 Instância: ${evolutionInstance}`);
console.log(`🔑 API Key: ${evolutionKey ? `${evolutionKey.substring(0, 8)}...` : 'NÃO DEFINIDA'}`);
console.log(`🔍 API Key length: ${evolutionKey?.length || 0}`);

console.log('\n✅ VALIDAÇÃO:');
const isValid = evolutionUrl && evolutionKey && evolutionInstance;
console.log(`Configurações válidas: ${isValid ? '✅ SIM' : '❌ NÃO'}`);

if (!isValid) {
  console.log('\n❌ PROBLEMAS ENCONTRADOS:');
  if (!evolutionUrl) console.log('   - EVOLUTION_API_URL não definida');
  if (!evolutionKey) console.log('   - EVOLUTION_API_KEY não definida');
  if (!evolutionInstance) console.log('   - EVOLUTION_INSTANCE_NAME não definida');
  
  console.log('\n💡 SOLUÇÕES:');
  console.log('   1. Definir as variáveis no Easypanel');
  console.log('   2. Criar arquivo .env.production');
  console.log('   3. Verificar se o arquivo está sendo carregado');
}

console.log('\n🧪 TESTE DE CONEXÃO:');
if (isValid) {
  const testConnection = async () => {
    try {
      console.log('🚀 Testando conexão com Evolution API...');
      
      const response = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': evolutionKey,
        },
      });

      console.log(`📡 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Conexão bem-sucedida! Instâncias encontradas: ${data.length}`);
        
        const targetInstance = data.find(inst => inst.name === evolutionInstance);
        if (targetInstance) {
          console.log(`🎯 Instância ${evolutionInstance} encontrada!`);
          console.log(`📊 Status: ${targetInstance.connectionStatus}`);
        } else {
          console.log(`⚠️ Instância ${evolutionInstance} não encontrada`);
          console.log('📋 Instâncias disponíveis:', data.map(i => i.name));
        }
      } else {
        const error = await response.text();
        console.log(`❌ Erro na conexão: ${response.status}`);
        console.log(`📄 Resposta: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Erro de rede: ${error.message}`);
    }
  };
  
  testConnection();
} else {
  console.log('⏭️ Pulando teste de conexão (configurações inválidas)');
}

console.log('\n' + '='.repeat(50));
console.log('�� TESTE CONCLUÍDO'); 