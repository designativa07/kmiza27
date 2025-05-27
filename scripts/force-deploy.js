#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');

// Configurações do EasyPanel (substitua pelos seus valores reais)
const EASYPANEL_CONFIG = {
  // Estas URLs seriam fornecidas pelo EasyPanel para webhook de deploy
  backend: {
    name: 'kmizabot',
    url: 'https://kmizabot.h4xd66.easypanel.host',
    healthEndpoint: '/health'
  },
  frontend: {
    name: 'kmizafrontend', 
    url: 'https://kmizafrontend.h4xd66.easypanel.host',
    healthEndpoint: '/api/health'
  }
};

// Função para verificar se um serviço está online
async function checkService(service) {
  return new Promise((resolve) => {
    const url = service.url + service.healthEndpoint;
    console.log(`🔍 Verificando ${service.name}: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${service.name} está online - Commit: ${response.commit || 'N/A'}`);
          resolve({ online: true, commit: response.commit, version: response.version });
        } catch (error) {
          console.log(`⚠️  ${service.name} respondeu mas com dados inválidos`);
          resolve({ online: false, error: 'Invalid response' });
        }
      });
    }).on('error', (error) => {
      console.log(`❌ ${service.name} está offline: ${error.message}`);
      resolve({ online: false, error: error.message });
    });
  });
}

// Função para obter o commit atual local
function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('⚠️  Não foi possível obter o commit local:', error.message);
    return 'unknown';
  }
}

// Função principal
async function main() {
  console.log('🚀 Verificando status do deploy...\n');
  
  const currentCommit = getCurrentCommit();
  console.log(`📝 Commit local atual: ${currentCommit}\n`);
  
  // Verificar ambos os serviços
  const [backendStatus, frontendStatus] = await Promise.all([
    checkService(EASYPANEL_CONFIG.backend),
    checkService(EASYPANEL_CONFIG.frontend)
  ]);
  
  console.log('\n📊 Resumo do Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Verificar se os commits estão sincronizados
  const backendSynced = backendStatus.online && backendStatus.commit === currentCommit;
  const frontendSynced = frontendStatus.online && frontendStatus.commit === currentCommit;
  
  console.log(`Backend:  ${backendStatus.online ? '🟢 Online' : '🔴 Offline'} | Commit: ${backendStatus.commit || 'N/A'} | ${backendSynced ? '✅ Sincronizado' : '⚠️  Desatualizado'}`);
  console.log(`Frontend: ${frontendStatus.online ? '🟢 Online' : '🔴 Offline'} | Commit: ${frontendStatus.commit || 'N/A'} | ${frontendSynced ? '✅ Sincronizado' : '⚠️  Desatualizado'}`);
  
  // Determinar se precisa de ação
  const needsAction = !backendSynced || !frontendSynced;
  
  if (needsAction) {
    console.log('\n⚠️  AÇÃO NECESSÁRIA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Os serviços não estão sincronizados com o commit atual.');
    console.log('');
    console.log('🔧 Passos para resolver no EasyPanel:');
    console.log('1. Acesse o painel do EasyPanel');
    console.log('2. Para cada serviço desatualizado:');
    console.log('   - Clique em "Force Rebuild" (Forçar Reconstrução)');
    console.log('   - Aguarde o build completar');
    console.log('   - Clique em "Stop" e depois "Start"');
    console.log('3. Execute este script novamente para verificar');
    console.log('');
    console.log('🤖 Comandos úteis:');
    console.log('   npm run status        - Verificar status novamente');
    console.log('   npm run status:watch  - Monitorar continuamente');
    
    process.exit(1);
  } else {
    console.log('\n✅ TUDO SINCRONIZADO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Todos os serviços estão online e atualizados.');
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro durante verificação:', error);
    process.exit(1);
  });
}

module.exports = { checkService, getCurrentCommit, EASYPANEL_CONFIG }; 