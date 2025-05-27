#!/usr/bin/env node

const https = require('https');
const http = require('http');

// URLs dos health checks
const BACKEND_URL = 'https://kmizabot.h4xd66.easypanel.host/health';
const FRONTEND_URL = 'https://kmizafrontend.h4xd66.easypanel.host/api/health';

// Função para fazer request HTTP/HTTPS
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Erro ao parsear JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Função principal
async function checkDeployStatus() {
  console.log('🔍 Verificando status do deploy...\n');
  
  try {
    // Verificar backend
    console.log('📡 Verificando Backend...');
    const backendHealth = await makeRequest(BACKEND_URL);
    console.log(`✅ Backend Status: ${backendHealth.status}`);
    console.log(`📦 Versão: ${backendHealth.version}`);
    console.log(`🔗 Commit: ${backendHealth.commit}`);
    console.log(`⏰ Timestamp: ${backendHealth.timestamp}`);
    console.log('');
    
    // Verificar frontend
    console.log('🎨 Verificando Frontend...');
    const frontendHealth = await makeRequest(FRONTEND_URL);
    console.log(`✅ Frontend Status: ${frontendHealth.status}`);
    console.log(`📦 Versão: ${frontendHealth.version}`);
    console.log(`🔗 Commit: ${frontendHealth.commit}`);
    console.log(`⏰ Timestamp: ${frontendHealth.timestamp}`);
    console.log('');
    
    // Verificar funcionalidades
    console.log('🎯 Funcionalidades Implementadas:');
    if (frontendHealth.features) {
      console.log(`🔐 Autenticação: ${frontendHealth.features.auth ? '✅' : '❌'}`);
      console.log(`🎛️ Painel Admin: ${frontendHealth.features.admin_panel ? '✅' : '❌'}`);
      console.log(`👥 Gerenciar Usuários: ${frontendHealth.features.user_management ? '✅' : '❌'}`);
      console.log(`🛡️ Criar Admins: ${frontendHealth.features.admin_creation ? '✅' : '❌'}`);
    }
    console.log('');
    
    // Verificar se commits são iguais
    if (backendHealth.commit === frontendHealth.commit) {
      console.log(`🎉 Deploy sincronizado! Commit: ${backendHealth.commit}`);
    } else {
      console.log(`⚠️ Deploy dessincronizado:`);
      console.log(`   Backend: ${backendHealth.commit}`);
      console.log(`   Frontend: ${frontendHealth.commit}`);
    }
    
    // URLs de acesso
    console.log('\n🔗 URLs de Acesso:');
    console.log(`📡 Backend: ${BACKEND_URL.replace('/health', '')}`);
    console.log(`🎨 Frontend: ${FRONTEND_URL.replace('/api/health', '')}`);
    console.log('\n🔐 Credenciais:');
    console.log('   Usuário: admin_kmiza27');
    console.log('   Senha: admin@kmiza27');
    
  } catch (error) {
    console.error('❌ Erro ao verificar deploy:', error.message);
    process.exit(1);
  }
}

// Executar verificação
checkDeployStatus(); 