#!/usr/bin/env node

/**
 * Script para verificar configurações do ambiente
 * Verifica se todas as variáveis necessárias estão configuradas
 */

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

console.log('🔧 Verificando Configurações do Ambiente');
console.log('========================================');

// Variáveis necessárias para sincronização
const requiredVars = [
  'PROD_DB_PASSWORD',
  'DATABASE_HOST',
  'DATABASE_PORT', 
  'DATABASE_NAME',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD'
];

console.log('\n📋 Variáveis de Ambiente:');
console.log('==========================');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isConfigured = value && value.trim() !== '';
  
  console.log(`${isConfigured ? '✅' : '❌'} ${varName}: ${isConfigured ? '***configurado***' : 'não configurado'}`);
  
  if (!isConfigured) {
    allConfigured = false;
  }
});

// Configurações específicas
console.log('\n🔧 Configurações Específicas:');
console.log('==============================');

console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
console.log(`API_BASE_URL: ${process.env.API_BASE_URL || 'http://localhost:3000'}`);

// Configurações de produção
console.log('\n🌐 Configurações de Produção:');
console.log('=============================');
console.log(`PROD_DB_HOST: ${process.env.PROD_DB_HOST || 'h4xd66.easypanel.host'}`);
console.log(`PROD_DB_PORT: ${process.env.PROD_DB_PORT || '5433'}`);
console.log(`PROD_DB_DATABASE: ${process.env.PROD_DB_DATABASE || 'kmiza27'}`);
console.log(`PROD_DB_USERNAME: ${process.env.PROD_DB_USERNAME || 'postgres'}`);
console.log(`PROD_DB_PASSWORD: ${process.env.PROD_DB_PASSWORD ? '***configurado***' : '❌ não configurado'}`);

// Configurações de desenvolvimento
console.log('\n💻 Configurações de Desenvolvimento:');
console.log('====================================');
console.log(`DATABASE_HOST: ${process.env.DATABASE_HOST || 'localhost'}`);
console.log(`DATABASE_PORT: ${process.env.DATABASE_PORT || '5432'}`);
console.log(`DATABASE_NAME: ${process.env.DATABASE_NAME || 'kmiza27_dev'}`);
console.log(`DATABASE_USERNAME: ${process.env.DATABASE_USERNAME || 'postgres'}`);
console.log(`DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '***configurado***' : '❌ não configurado'}`);

// Resumo
console.log('\n📊 Resumo:');
console.log('==========');

if (allConfigured) {
  console.log('✅ Todas as variáveis necessárias estão configuradas!');
  console.log('🚀 Você pode executar a sincronização normalmente.');
} else {
  console.log('❌ Algumas variáveis não estão configuradas.');
  console.log('\n💡 Para configurar, adicione ao arquivo backend/.env:');
  
  if (!process.env.PROD_DB_PASSWORD) {
    console.log('PROD_DB_PASSWORD=sua_senha_de_producao_aqui');
  }
  
  if (!process.env.DATABASE_PASSWORD) {
    console.log('DATABASE_PASSWORD=sua_senha_local_aqui');
  }
  
  console.log('\n📝 Exemplo de arquivo .env completo:');
  console.log('=====================================');
  console.log('# Configurações de Desenvolvimento');
  console.log('NODE_ENV=development');
  console.log('DATABASE_HOST=localhost');
  console.log('DATABASE_PORT=5432');
  console.log('DATABASE_NAME=kmiza27_dev');
  console.log('DATABASE_USERNAME=postgres');
  console.log('DATABASE_PASSWORD=sua_senha_local');
  console.log('');
  console.log('# Configurações de Produção (para sincronização)');
  console.log('PROD_DB_HOST=h4xd66.easypanel.host');
  console.log('PROD_DB_PORT=5433');
  console.log('PROD_DB_DATABASE=kmiza27');
  console.log('PROD_DB_USERNAME=postgres');
  console.log('PROD_DB_PASSWORD=sua_senha_de_producao');
}

console.log('\n🎯 Próximos passos:');
if (allConfigured) {
  console.log('1. Execute: node scripts/verify-production-counts.js');
  console.log('2. Execute: node scripts/test-sync-fixed.js');
} else {
  console.log('1. Configure as variáveis faltantes no arquivo .env');
  console.log('2. Execute este script novamente para verificar');
  console.log('3. Execute os scripts de sincronização');
}
