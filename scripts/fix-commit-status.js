#!/usr/bin/env node

/**
 * 🔧 Script para corrigir o status do commit "Desconhecido"
 * Este script configura as variáveis de build corretamente para o EasyPanel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Função para obter o commit atual
function getCurrentCommit() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    log(`📝 Commit atual: ${commit.substring(0, 8)}`, 'cyan');
    return commit;
  } catch (error) {
    log('⚠️  Não foi possível obter o commit do Git', 'yellow');
    return 'unknown';
  }
}

// Função para obter timestamp atual
function getCurrentTimestamp() {
  const timestamp = new Date().toISOString();
  log(`⏰ Timestamp: ${timestamp}`, 'cyan');
  return timestamp;
}

// Função para atualizar arquivo .env
function updateEnvFile() {
  const commit = getCurrentCommit();
  const timestamp = getCurrentTimestamp();
  
  const envContent = `# Variáveis de Build - Gerado automaticamente
BUILD_TIMESTAMP=${timestamp}
GIT_COMMIT=${commit}
CACHEBUST=${Date.now()}

# Variáveis de Produção
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host
`;

  // Atualizar .env na raiz
  fs.writeFileSync('.env', envContent);
  log('✅ Arquivo .env atualizado na raiz', 'green');

  // Atualizar .env no frontend
  fs.writeFileSync('frontend/.env', envContent);
  log('✅ Arquivo .env atualizado no frontend', 'green');

  // Atualizar .env no backend
  fs.writeFileSync('backend/.env', envContent);
  log('✅ Arquivo .env atualizado no backend', 'green');
}

// Função para criar arquivo de build info
function createBuildInfo() {
  const commit = getCurrentCommit();
  const timestamp = getCurrentTimestamp();
  
  const buildInfo = {
    commit: commit,
    shortCommit: commit.substring(0, 8),
    timestamp: timestamp,
    buildDate: new Date().toLocaleString('pt-BR'),
    version: '1.0.0',
    environment: 'production'
  };

  // Criar arquivo na raiz
  fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
  log('✅ Arquivo build-info.json criado na raiz', 'green');

  // Criar arquivo no frontend
  fs.writeFileSync('frontend/build-info.json', JSON.stringify(buildInfo, null, 2));
  log('✅ Arquivo build-info.json criado no frontend', 'green');

  // Criar arquivo no backend
  fs.writeFileSync('backend/build-info.json', JSON.stringify(buildInfo, null, 2));
  log('✅ Arquivo build-info.json criado no backend', 'green');
}

// Função para atualizar Dockerfile do backend
function updateBackendDockerfile() {
  const dockerfilePath = 'Dockerfile.backend';
  let content = fs.readFileSync(dockerfilePath, 'utf8');
  
  // Adicionar comando para capturar commit durante build
  const gitCommitCapture = `
# Capturar commit atual durante build
RUN if [ -d "/tmp/repo/.git" ]; then \\
      cd /tmp/repo && \\
      GIT_COMMIT_BUILD=$(git rev-parse HEAD 2>/dev/null || echo "unknown") && \\
      echo "export GIT_COMMIT=\${GIT_COMMIT_BUILD}" > /app/git-commit.sh && \\
      echo "GIT_COMMIT_BUILD=\${GIT_COMMIT_BUILD}" >> /app/build-vars.env; \\
    else \\
      echo "export GIT_COMMIT=unknown" > /app/git-commit.sh && \\
      echo "GIT_COMMIT_BUILD=unknown" >> /app/build-vars.env; \\
    fi`;

  // Inserir após o clone do repositório
  if (!content.includes('git-commit.sh')) {
    content = content.replace(
      /RUN cd \/tmp\/repo && git log --oneline -1 > \/app\/latest-commit\.txt/,
      `RUN cd /tmp/repo && git log --oneline -1 > /app/latest-commit.txt${gitCommitCapture}`
    );
    
    fs.writeFileSync(dockerfilePath, content);
    log('✅ Dockerfile.backend atualizado', 'green');
  }
}

// Função para atualizar Dockerfile do frontend
function updateFrontendDockerfile() {
  const dockerfilePath = 'Dockerfile.frontend';
  let content = fs.readFileSync(dockerfilePath, 'utf8');
  
  // Adicionar comando para capturar commit durante build
  const gitCommitCapture = `
# Capturar commit atual durante build
RUN if [ -d "/tmp/repo/.git" ]; then \\
      cd /tmp/repo && \\
      GIT_COMMIT_BUILD=$(git rev-parse HEAD 2>/dev/null || echo "unknown") && \\
      echo "export GIT_COMMIT=\${GIT_COMMIT_BUILD}" > /app/git-commit.sh && \\
      echo "GIT_COMMIT_BUILD=\${GIT_COMMIT_BUILD}" >> /app/build-vars.env; \\
    else \\
      echo "export GIT_COMMIT=unknown" > /app/git-commit.sh && \\
      echo "GIT_COMMIT_BUILD=unknown" >> /app/build-vars.env; \\
    fi`;

  // Inserir após o clone do repositório
  if (!content.includes('git-commit.sh')) {
    content = content.replace(
      /RUN cd \/tmp\/repo && git log --oneline -1 > \/app\/latest-commit\.txt/,
      `RUN cd /tmp/repo && git log --oneline -1 > /app/latest-commit.txt${gitCommitCapture}`
    );
    
    fs.writeFileSync(dockerfilePath, content);
    log('✅ Dockerfile.frontend atualizado', 'green');
  }
}

// Função para criar script de deploy para EasyPanel
function createEasyPanelDeployScript() {
  const deployScript = `#!/bin/bash

# 🚀 Script de Deploy para EasyPanel - Kmiza27
# Este script configura as variáveis de build corretamente

set -e

echo "🚀 Iniciando deploy para EasyPanel..."

# Obter informações do commit
COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
SHORT_COMMIT=\${COMMIT:0:8}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CACHEBUST=$(date +%s)

echo "📝 Informações do build:"
echo "   Commit: \$SHORT_COMMIT"
echo "   Timestamp: \$TIMESTAMP"
echo "   Cache Bust: \$CACHEBUST"

# Exportar variáveis
export GIT_COMMIT=\$COMMIT
export BUILD_TIMESTAMP=\$TIMESTAMP
export CACHEBUST=\$CACHEBUST

# Criar arquivo de variáveis para EasyPanel
cat > .env.easypanel << EOF
GIT_COMMIT=\$COMMIT
BUILD_TIMESTAMP=\$TIMESTAMP
CACHEBUST=\$CACHEBUST
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host
EOF

echo "✅ Variáveis de build configuradas!"
echo "📁 Arquivo .env.easypanel criado"

# Instruções para EasyPanel
echo ""
echo "🔧 Para aplicar no EasyPanel:"
echo "1. Acesse o dashboard do EasyPanel"
echo "2. Vá em Build Arguments ou Environment Variables"
echo "3. Adicione as seguintes variáveis:"
echo "   GIT_COMMIT=\$COMMIT"
echo "   BUILD_TIMESTAMP=\$TIMESTAMP"
echo "   CACHEBUST=\$CACHEBUST"
echo "4. Faça Force Rebuild dos serviços"
echo ""
echo "🌐 URLs para verificar após deploy:"
echo "   Backend: https://kmizabot.h4xd66.easypanel.host/health"
echo "   Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health"
`;

  fs.writeFileSync('scripts/deploy-easypanel.sh', deployScript);
  fs.chmodSync('scripts/deploy-easypanel.sh', '755');
  log('✅ Script deploy-easypanel.sh criado', 'green');
}

// Função para atualizar package.json com novos scripts
function updatePackageJson() {
  const packagePath = 'package.json';
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Adicionar novos scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['fix-commit'] = 'node scripts/fix-commit-status.js';
    packageJson.scripts['deploy:easypanel'] = 'bash scripts/deploy-easypanel.sh';
    packageJson.scripts['build:vars'] = 'node scripts/set-build-vars.js';
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    log('✅ package.json atualizado com novos scripts', 'green');
  }
}

// Função principal
async function main() {
  log('🔧 Corrigindo status do commit "Desconhecido"...', 'bold');
  log('', 'reset');
  
  try {
    // 1. Atualizar arquivos .env
    log('1️⃣ Atualizando arquivos .env...', 'blue');
    updateEnvFile();
    log('', 'reset');
    
    // 2. Criar arquivos de build info
    log('2️⃣ Criando arquivos de build info...', 'blue');
    createBuildInfo();
    log('', 'reset');
    
    // 3. Atualizar Dockerfiles
    log('3️⃣ Atualizando Dockerfiles...', 'blue');
    updateBackendDockerfile();
    updateFrontendDockerfile();
    log('', 'reset');
    
    // 4. Criar script de deploy
    log('4️⃣ Criando script de deploy para EasyPanel...', 'blue');
    createEasyPanelDeployScript();
    log('', 'reset');
    
    // 5. Atualizar package.json
    log('5️⃣ Atualizando package.json...', 'blue');
    updatePackageJson();
    log('', 'reset');
    
    log('🎉 Correção concluída com sucesso!', 'green');
    log('', 'reset');
    
    log('📋 Próximos passos:', 'bold');
    log('1. Execute: npm run deploy:easypanel', 'cyan');
    log('2. No EasyPanel, configure as variáveis de build:', 'cyan');
    log('   - GIT_COMMIT', 'yellow');
    log('   - BUILD_TIMESTAMP', 'yellow');
    log('   - CACHEBUST', 'yellow');
    log('3. Faça Force Rebuild dos serviços', 'cyan');
    log('4. Verifique o status: npm run status', 'cyan');
    log('', 'reset');
    
    log('🔗 URLs para verificar:', 'bold');
    log('Backend: https://kmizabot.h4xd66.easypanel.host/health', 'cyan');
    log('Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health', 'cyan');
    
  } catch (error) {
    log(`❌ Erro durante a correção: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main }; 