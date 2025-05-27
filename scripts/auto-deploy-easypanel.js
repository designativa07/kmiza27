#!/usr/bin/env node

/**
 * 🚀 Deploy Automático para EasyPanel
 * Este script automatiza completamente o deploy sem configuração manual
 */

const https = require('https');
const { execSync } = require('child_process');

// Configurações do EasyPanel
const EASYPANEL_CONFIG = {
  // URLs dos webhooks de deploy (você precisa configurar uma vez só)
  backend_webhook: process.env.EASYPANEL_BACKEND_WEBHOOK || null,
  frontend_webhook: process.env.EASYPANEL_FRONTEND_WEBHOOK || null,
  
  // URLs dos serviços
  backend_url: 'https://kmizabot.h4xd66.easypanel.host',
  frontend_url: 'https://kmizafrontend.h4xd66.easypanel.host'
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para obter commit atual
function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Função para fazer push para GitHub (trigger automático)
function pushToGitHub() {
  try {
    log('📤 Fazendo push para GitHub...', 'blue');
    
    // Verificar se há mudanças
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (status.trim()) {
      log('📝 Adicionando mudanças...', 'cyan');
      execSync('git add .');
      
      const commit = getCurrentCommit();
      const shortCommit = commit.substring(0, 8);
      
      execSync(`git commit -m "feat: auto-deploy with commit detection - ${shortCommit}"`);
      log('✅ Commit criado', 'green');
    }
    
    execSync('git push origin main');
    log('✅ Push realizado com sucesso!', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Erro no push: ${error.message}`, 'red');
    return false;
  }
}

// Função para verificar status dos serviços
async function checkServiceStatus(url, name) {
  return new Promise((resolve) => {
    log(`🔍 Verificando ${name}...`, 'cyan');
    
    https.get(`${url}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          log(`✅ ${name}: Online - Commit: ${response.commit || 'N/A'}`, 'green');
          resolve({ online: true, commit: response.commit, data: response });
        } catch (error) {
          log(`⚠️  ${name}: Resposta inválida`, 'yellow');
          resolve({ online: false, error: 'Invalid response' });
        }
      });
    }).on('error', (error) => {
      log(`❌ ${name}: Offline - ${error.message}`, 'red');
      resolve({ online: false, error: error.message });
    });
  });
}

// Função para aguardar deploy
async function waitForDeploy(maxWaitMinutes = 10) {
  log(`⏳ Aguardando deploy completar (máximo ${maxWaitMinutes} minutos)...`, 'yellow');
  
  const startTime = Date.now();
  const maxWaitTime = maxWaitMinutes * 60 * 1000;
  const currentCommit = getCurrentCommit();
  
  while (Date.now() - startTime < maxWaitTime) {
    const [backendStatus, frontendStatus] = await Promise.all([
      checkServiceStatus(EASYPANEL_CONFIG.backend_url, 'Backend'),
      checkServiceStatus(EASYPANEL_CONFIG.frontend_url, 'Frontend')
    ]);
    
    // Verificar se ambos estão online e com commit correto
    const backendOk = backendStatus.online && backendStatus.commit === currentCommit;
    const frontendOk = frontendStatus.online && frontendStatus.commit === currentCommit;
    
    if (backendOk && frontendOk) {
      log('🎉 Deploy completado com sucesso!', 'green');
      return true;
    }
    
    log('⏳ Aguardando... (30s)', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  log('⚠️  Timeout: Deploy pode ainda estar em progresso', 'yellow');
  return false;
}

// Função principal
async function main() {
  log('🚀 Iniciando Deploy Automático para EasyPanel...', 'bold');
  log('', 'reset');
  
  const currentCommit = getCurrentCommit();
  const shortCommit = currentCommit.substring(0, 8);
  
  log(`📝 Commit atual: ${shortCommit}`, 'cyan');
  log(`🕐 Timestamp: ${new Date().toISOString()}`, 'cyan');
  log('', 'reset');
  
  // 1. Verificar status atual
  log('1️⃣ Verificando status atual...', 'blue');
  const [initialBackend, initialFrontend] = await Promise.all([
    checkServiceStatus(EASYPANEL_CONFIG.backend_url, 'Backend'),
    checkServiceStatus(EASYPANEL_CONFIG.frontend_url, 'Frontend')
  ]);
  
  // Verificar se já está atualizado
  const backendUpToDate = initialBackend.online && initialBackend.commit === currentCommit;
  const frontendUpToDate = initialFrontend.online && initialFrontend.commit === currentCommit;
  
  if (backendUpToDate && frontendUpToDate) {
    log('✅ Serviços já estão atualizados!', 'green');
    return;
  }
  
  log('', 'reset');
  
  // 2. Push para GitHub (trigger automático do EasyPanel)
  log('2️⃣ Fazendo push para GitHub...', 'blue');
  const pushSuccess = pushToGitHub();
  
  if (!pushSuccess) {
    log('❌ Falha no push. Abortando deploy.', 'red');
    return;
  }
  
  log('', 'reset');
  
  // 3. Aguardar deploy automático
  log('3️⃣ Aguardando deploy automático do EasyPanel...', 'blue');
  log('💡 O EasyPanel detectará o push e fará rebuild automaticamente', 'cyan');
  log('📋 Os Dockerfiles foram modificados para capturar commit automaticamente', 'cyan');
  
  const deploySuccess = await waitForDeploy(10);
  
  log('', 'reset');
  
  // 4. Verificar resultado final
  log('4️⃣ Verificando resultado final...', 'blue');
  const [finalBackend, finalFrontend] = await Promise.all([
    checkServiceStatus(EASYPANEL_CONFIG.backend_url, 'Backend'),
    checkServiceStatus(EASYPANEL_CONFIG.frontend_url, 'Frontend')
  ]);
  
  log('', 'reset');
  log('📊 RESULTADO FINAL:', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  const finalBackendOk = finalBackend.online && finalBackend.commit === currentCommit;
  const finalFrontendOk = finalFrontend.online && finalFrontend.commit === currentCommit;
  
  log(`Backend:  ${finalBackend.online ? '🟢 Online' : '🔴 Offline'} | Commit: ${finalBackend.commit || 'N/A'} | ${finalBackendOk ? '✅ Atualizado' : '⚠️  Pendente'}`, 'reset');
  log(`Frontend: ${finalFrontend.online ? '🟢 Online' : '🔴 Offline'} | Commit: ${finalFrontend.commit || 'N/A'} | ${finalFrontendOk ? '✅ Atualizado' : '⚠️  Pendente'}`, 'reset');
  
  if (finalBackendOk && finalFrontendOk) {
    log('', 'reset');
    log('🎉 DEPLOY COMPLETADO COM SUCESSO!', 'green');
    log('🌐 Verifique: https://kmizafrontend.h4xd66.easypanel.host/status', 'cyan');
  } else {
    log('', 'reset');
    log('⚠️  Deploy pode ainda estar em progresso', 'yellow');
    log('🔄 Execute novamente em alguns minutos se necessário', 'cyan');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro durante deploy: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main }; 