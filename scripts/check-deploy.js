#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');

// URLs dos health checks
const BACKEND_URL = 'https://kmizabot.h4xd66.easypanel.host/health';
const FRONTEND_URL = 'https://kmizafrontend.h4xd66.easypanel.host/api/health';

// Função para fazer requisição HTTP
function fetchHealth(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Função principal
async function checkDeploy() {
  console.log('🔍 Verificando status do deploy...\n');

  try {
    // Obter commit atual
    const currentCommit = execSync('git rev-parse HEAD').toString().trim();
    const shortCommit = currentCommit.substring(0, 8);
    
    console.log(`📝 Commit local: ${shortCommit}`);
    console.log(`🕐 Timestamp: ${new Date().toISOString()}\n`);

    // Verificar backend
    console.log('🔧 Verificando backend...');
    const backendHealth = await fetchHealth(BACKEND_URL);
    console.log(`   Status: ${backendHealth.status}`);
    console.log(`   Versão: ${backendHealth.version}`);
    console.log(`   Commit: ${backendHealth.commit}`);
    console.log(`   Ambiente: ${backendHealth.environment}\n`);

    // Verificar frontend
    console.log('🎨 Verificando frontend...');
    const frontendHealth = await fetchHealth(FRONTEND_URL);
    console.log(`   Status: ${frontendHealth.status}`);
    console.log(`   Versão: ${frontendHealth.version}`);
    console.log(`   Commit: ${frontendHealth.commit}`);
    console.log(`   Ambiente: ${frontendHealth.environment}\n`);

    // Verificar se commits batem
    const backendCommitMatch = backendHealth.commit === currentCommit || backendHealth.commit === shortCommit;
    const frontendCommitMatch = frontendHealth.commit === currentCommit || frontendHealth.commit === shortCommit;

    console.log('📊 Resultado da verificação:');
    console.log(`   Backend atualizado: ${backendCommitMatch ? '✅' : '❌'}`);
    console.log(`   Frontend atualizado: ${frontendCommitMatch ? '✅' : '❌'}`);

    if (backendCommitMatch && frontendCommitMatch) {
      console.log('\n🎉 Deploy bem-sucedido! Ambos os serviços estão atualizados.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Deploy pode não ter sido aplicado completamente.');
      console.log('💡 Sugestões:');
      console.log('   - Aguarde alguns minutos e tente novamente');
      console.log('   - Verifique os logs do Easypanel');
      console.log('   - Considere fazer um force rebuild');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar deploy:', error.message);
    console.log('\n💡 Possíveis causas:');
    console.log('   - Serviços ainda não estão online');
    console.log('   - Problemas de conectividade');
    console.log('   - Deploy ainda em andamento');
    process.exit(1);
  }
}

// Executar verificação
checkDeploy(); 