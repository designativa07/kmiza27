#!/usr/bin/env node
/**
 * 🔄 Script para atualizar commit nos arquivos do projeto
 * Atualiza automaticamente o commit ID em vários arquivos
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Obter commit atual
const getCurrentCommit = () => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8);
  } catch (error) {
    console.error('❌ Erro ao obter commit:', error.message);
    return '84b849d'; // Fallback
  }
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const currentCommit = getCurrentCommit();
const currentTimestamp = getCurrentTimestamp();

console.log(`🔍 Commit atual: ${currentCommit}`);
console.log(`⏰ Timestamp: ${currentTimestamp}`);

// Lista de arquivos para atualizar
const filesToUpdate = [
  {
    path: 'frontend/src/app/api/health/route.ts',
    find: /'[a-f0-9]{8}'; \/\/ Fallback para o commit/g,
    replace: `'${currentCommit}'; // Fallback para o commit`
  },
  {
    path: 'frontend/src/app/api/health/route.ts',
    find: /gitCommit = '[a-f0-9]{8}';/g,
    replace: `gitCommit = '${currentCommit}';`
  },
  {
    path: 'Dockerfile.frontend',
    find: /ARG GIT_COMMIT=[a-f0-9]{8}/g,
    replace: `ARG GIT_COMMIT=${currentCommit}`
  }
];

// Função para atualizar arquivo
const updateFile = (fileConfig) => {
  const { path, find, replace } = fileConfig;
  
  if (!fs.existsSync(path)) {
    console.log(`⚠️  Arquivo não encontrado: ${path}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(path, 'utf8');
    const originalContent = content;
    
    content = content.replace(find, replace);
    
    if (content !== originalContent) {
      fs.writeFileSync(path, content, 'utf8');
      console.log(`✅ Atualizado: ${path}`);
      return true;
    } else {
      console.log(`ℹ️  Sem mudanças: ${path}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${path}:`, error.message);
    return false;
  }
};

// Executar atualizações
console.log('\n🚀 Iniciando atualização dos arquivos...\n');

let updatedFiles = 0;
filesToUpdate.forEach(fileConfig => {
  if (updateFile(fileConfig)) {
    updatedFiles++;
  }
});

// Criar arquivo de cache bust para Easypanel
const cacheBustFile = 'CACHE_BUST.txt';
const cacheBustContent = `# Cache Bust - Força rebuild no Easypanel
COMMIT=${currentCommit}
TIMESTAMP=${currentTimestamp}
BUILD_NUMBER=${Date.now()}

# Este arquivo força o Easypanel a fazer rebuild
# Modificado automaticamente pelo script update-commit.js
`;

fs.writeFileSync(cacheBustFile, cacheBustContent, 'utf8');
console.log(`✅ Criado: ${cacheBustFile}`);
updatedFiles++;

console.log(`\n🎉 Atualização concluída!`);
console.log(`📝 ${updatedFiles} arquivos modificados`);
console.log(`📋 Commit: ${currentCommit}`);
console.log(`⏰ Timestamp: ${currentTimestamp}`);

console.log(`\n📋 Próximos passos:`);
console.log(`1. git add .`);
console.log(`2. git commit -m "update: Atualiza commit para ${currentCommit}"`);
console.log(`3. git push`);
console.log(`4. Rebuild no Easypanel`); 