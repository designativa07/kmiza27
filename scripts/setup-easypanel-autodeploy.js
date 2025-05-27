#!/usr/bin/env node

/**
 * 🔧 Configurador de Auto-Deploy para EasyPanel
 * Este script configura o auto-deploy completo para eliminar a necessidade de Force Rebuild manual
 */

const https = require('https');
const { execSync } = require('child_process');

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

// Configurações do EasyPanel
const EASYPANEL_CONFIG = {
  // URLs dos serviços
  backend_url: 'https://kmizabot.h4xd66.easypanel.host',
  frontend_url: 'https://kmizafrontend.h4xd66.easypanel.host',
  
  // Configurações do GitHub
  github_repo: 'designativa07/kmiza27',
  github_branch: 'main',
  
  // Configurações de build
  backend_dockerfile: 'Dockerfile.backend',
  frontend_dockerfile: 'Dockerfile.frontend'
};

// Função para verificar status atual
async function checkCurrentStatus() {
  log('🔍 Verificando status atual dos serviços...', 'blue');
  
  const services = [
    { name: 'Backend', url: EASYPANEL_CONFIG.backend_url + '/health' },
    { name: 'Frontend', url: EASYPANEL_CONFIG.frontend_url + '/api/health' }
  ];
  
  for (const service of services) {
    try {
      const response = await makeHttpRequest(service.url);
      const data = JSON.parse(response);
      log(`✅ ${service.name}: Online - Commit: ${data.commit || 'N/A'}`, 'green');
    } catch (error) {
      log(`❌ ${service.name}: Offline ou com problemas`, 'red');
    }
  }
}

// Função para fazer requisições HTTP
function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Função para verificar configuração do GitHub
function checkGitHubConfig() {
  log('📋 Verificando configuração do GitHub...', 'blue');
  
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const lastCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    
    log(`📂 Repositório: ${remoteUrl}`, 'cyan');
    log(`🌿 Branch: ${currentBranch}`, 'cyan');
    log(`📝 Último commit: ${lastCommit.substring(0, 8)}`, 'cyan');
    
    return { remoteUrl, currentBranch, lastCommit };
  } catch (error) {
    log('❌ Erro ao verificar configuração do Git', 'red');
    return null;
  }
}

// Função para gerar instruções de configuração do EasyPanel
function generateEasyPanelInstructions() {
  log('📋 Gerando instruções para configuração do EasyPanel...', 'blue');
  
  const instructions = `
# 🔧 Configuração de Auto-Deploy no EasyPanel

## 🎯 Problema Atual
- Push para GitHub não aciona rebuild automático
- Necessário fazer Force Rebuild + Stop/Start manualmente
- Deploy não é verdadeiramente automático

## ✅ Solução: Configurar Auto-Deploy Corretamente

### 1. Configurar Webhook do GitHub

#### No GitHub (https://github.com/${EASYPANEL_CONFIG.github_repo}):
1. Vá em **Settings** > **Webhooks**
2. Clique em **Add webhook**
3. Configure:
   - **Payload URL**: \`https://api.easypanel.io/webhooks/github\`
   - **Content type**: \`application/json\`
   - **Secret**: (deixe vazio ou use o token do EasyPanel)
   - **Events**: Selecione "Just the push event"
   - **Active**: ✅ Marcado

### 2. Configurar Auto-Deploy no EasyPanel

#### Para o Backend (kmizabot):
1. Acesse o EasyPanel Dashboard
2. Vá para o app **kmizabot**
3. Aba **"Source"** ou **"Git"**
4. Configure:
   - **Repository**: \`https://github.com/${EASYPANEL_CONFIG.github_repo}\`
   - **Branch**: \`${EASYPANEL_CONFIG.github_branch}\`
   - **Auto Deploy**: ✅ **ATIVAR**
   - **Dockerfile**: \`${EASYPANEL_CONFIG.backend_dockerfile}\`
   - **Build Context**: \`.\` (raiz do projeto)

#### Para o Frontend (kmizafrontend):
1. Vá para o app **kmizafrontend**
2. Aba **"Source"** ou **"Git"**
3. Configure:
   - **Repository**: \`https://github.com/${EASYPANEL_CONFIG.github_repo}\`
   - **Branch**: \`${EASYPANEL_CONFIG.github_branch}\`
   - **Auto Deploy**: ✅ **ATIVAR**
   - **Dockerfile**: \`${EASYPANEL_CONFIG.frontend_dockerfile}\`
   - **Build Context**: \`.\` (raiz do projeto)

### 3. Configurar Build Settings

#### Para ambos os serviços:
1. Aba **"Build"** ou **"Settings"**
2. **Build Arguments** (opcional, mas recomendado):
   \`\`\`
   CACHEBUST=\${TIMESTAMP}
   \`\`\`
3. **Auto Restart**: ✅ **ATIVAR**
4. **Health Check**: ✅ **ATIVAR**

### 4. Testar Auto-Deploy

#### Após configurar:
1. Faça uma mudança pequena no código
2. Commit e push:
   \`\`\`bash
   git add .
   git commit -m "test: auto-deploy configuration"
   git push origin main
   \`\`\`
3. **Aguarde 2-3 minutos**
4. Verifique se o rebuild iniciou automaticamente no EasyPanel
5. Verifique se o commit foi atualizado nos health endpoints

## 🚨 Troubleshooting

### Se o auto-deploy não funcionar:

1. **Verificar Webhook do GitHub**:
   - Vá em Settings > Webhooks
   - Clique no webhook criado
   - Aba "Recent Deliveries"
   - Verifique se há entregas com status 200

2. **Verificar Logs do EasyPanel**:
   - Vá para o app no EasyPanel
   - Aba "Logs" ou "Build Logs"
   - Procure por erros de build

3. **Verificar Configuração do Repositório**:
   - Confirme que o repositório está público ou o EasyPanel tem acesso
   - Verifique se a branch está correta
   - Confirme que os Dockerfiles existem no caminho especificado

### Se ainda não funcionar:

1. **Método Alternativo - GitHub Actions**:
   Podemos configurar GitHub Actions para fazer deploy via API do EasyPanel

2. **Webhook Manual**:
   Configurar webhook personalizado que chama API do EasyPanel

## ✅ Resultado Esperado

Após configurar corretamente:
- ✅ Push para GitHub aciona rebuild automático
- ✅ Não precisa mais de Force Rebuild manual
- ✅ Não precisa mais de Stop/Start manual
- ✅ Deploy verdadeiramente automático
- ✅ Commit aparece corretamente no status

## 🎯 Teste Final

Execute este comando para testar:
\`\`\`bash
npm run deploy
\`\`\`

O script deve mostrar que o deploy foi aplicado automaticamente sem intervenção manual.
`;

  return instructions;
}

// Função para criar arquivo de configuração
function createConfigFile() {
  const configContent = {
    easypanel: {
      auto_deploy: true,
      github_webhook: true,
      services: {
        backend: {
          name: 'kmizabot',
          dockerfile: 'Dockerfile.backend',
          url: EASYPANEL_CONFIG.backend_url,
          health_endpoint: '/health'
        },
        frontend: {
          name: 'kmizafrontend',
          dockerfile: 'Dockerfile.frontend',
          url: EASYPANEL_CONFIG.frontend_url,
          health_endpoint: '/api/health'
        }
      }
    },
    github: {
      repository: EASYPANEL_CONFIG.github_repo,
      branch: EASYPANEL_CONFIG.github_branch
    },
    last_updated: new Date().toISOString()
  };

  require('fs').writeFileSync('easypanel-config.json', JSON.stringify(configContent, null, 2));
  log('✅ Arquivo de configuração criado: easypanel-config.json', 'green');
}

// Função principal
async function main() {
  log('🔧 Configurador de Auto-Deploy para EasyPanel', 'bold');
  log('', 'reset');
  
  // 1. Verificar status atual
  await checkCurrentStatus();
  log('', 'reset');
  
  // 2. Verificar configuração do GitHub
  const gitConfig = checkGitHubConfig();
  if (!gitConfig) {
    log('❌ Não foi possível verificar configuração do Git', 'red');
    return;
  }
  log('', 'reset');
  
  // 3. Gerar instruções
  log('📋 Gerando instruções de configuração...', 'blue');
  const instructions = generateEasyPanelInstructions();
  
  // 4. Salvar instruções em arquivo
  require('fs').writeFileSync('EASYPANEL_AUTODEPLOY_SETUP.md', instructions);
  log('✅ Instruções salvas em: EASYPANEL_AUTODEPLOY_SETUP.md', 'green');
  
  // 5. Criar arquivo de configuração
  createConfigFile();
  
  log('', 'reset');
  log('🎯 PRÓXIMOS PASSOS:', 'bold');
  log('', 'reset');
  log('1. Leia o arquivo EASYPANEL_AUTODEPLOY_SETUP.md', 'cyan');
  log('2. Configure o webhook do GitHub conforme instruções', 'cyan');
  log('3. Ative o auto-deploy no EasyPanel para ambos os serviços', 'cyan');
  log('4. Teste fazendo um push para o GitHub', 'cyan');
  log('5. Execute "npm run deploy" para verificar se funcionou', 'cyan');
  log('', 'reset');
  log('📖 Arquivo de instruções: EASYPANEL_AUTODEPLOY_SETUP.md', 'yellow');
  log('⚙️  Arquivo de configuração: easypanel-config.json', 'yellow');
  log('', 'reset');
  log('🚀 Após configurar, o deploy será 100% automático!', 'green');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main }; 