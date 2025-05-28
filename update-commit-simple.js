#!/usr/bin/env node
/**
 * 🔄 Script Simples para Atualizar Commit
 * Atualiza o commit ID no Dockerfile e health check
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Obter commit atual
const getCurrentCommit = () => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8);
  } catch (error) {
    console.error('❌ Erro ao obter commit:', error.message);
    return null;
  }
};

const currentCommit = getCurrentCommit();

if (!currentCommit) {
  console.log('❌ Não foi possível obter o commit atual');
  process.exit(1);
}

console.log(`🔍 Commit atual: ${currentCommit}`);

// Atualizar Dockerfile.frontend
const dockerfilePath = 'Dockerfile.frontend';
if (fs.existsSync(dockerfilePath)) {
  let dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  
  // Substituir ARG GIT_COMMIT=xxxxx
  dockerfileContent = dockerfileContent.replace(
    /ARG GIT_COMMIT=[a-f0-9]{8}/g,
    `ARG GIT_COMMIT=${currentCommit}`
  );
  
  fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
  console.log(`✅ Atualizado: ${dockerfilePath}`);
} else {
  console.log(`⚠️  Arquivo não encontrado: ${dockerfilePath}`);
}

// Atualizar health check
const healthPath = 'frontend/src/app/api/health/route.ts';
if (fs.existsSync(healthPath)) {
  let healthContent = fs.readFileSync(healthPath, 'utf8');
  
  // Substituir fallback commit
  healthContent = healthContent.replace(
    /'[a-f0-9]{8}'; \/\/ Fallback para o commit atual/g,
    `'${currentCommit}'; // Fallback para o commit atual`
  );
  
  healthContent = healthContent.replace(
    /gitCommit = '[a-f0-9]{8}';/g,
    `gitCommit = '${currentCommit}';`
  );
  
  healthContent = healthContent.replace(
    /fallbackCommit: '[a-f0-9]{8}'/g,
    `fallbackCommit: '${currentCommit}'`
  );
  
  fs.writeFileSync(healthPath, healthContent, 'utf8');
  console.log(`✅ Atualizado: ${healthPath}`);
} else {
  console.log(`⚠️  Arquivo não encontrado: ${healthPath}`);
}

console.log(`\n🎉 Atualização concluída!`);
console.log(`📋 Commit: ${currentCommit}`);
console.log(`\n📋 Próximos passos:`);
console.log(`1. git add .`);
console.log(`2. git commit -m "update: commit ${currentCommit}"`);
console.log(`3. git push`);
console.log(`4. Rebuild no Easypanel`); 