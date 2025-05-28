#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Capturar o commit atual
const currentCommit = execSync('git rev-parse HEAD').toString().trim().substring(0, 8);

console.log(`🔄 Atualizando commit para: ${currentCommit}`);

// Atualizar o arquivo de health da API
const healthFile = path.join(__dirname, 'frontend/src/app/api/health/route.ts');
let healthContent = fs.readFileSync(healthFile, 'utf8');

// Substituir o fallback do commit
healthContent = healthContent.replace(
  /'e4bc6cf'; \/\/ Fallback para o último commit conhecido/,
  `'${currentCommit}'; // Fallback para o último commit conhecido`
);

// Substituir o segundo fallback também
healthContent = healthContent.replace(
  /gitCommit = 'e4bc6cf';/,
  `gitCommit = '${currentCommit}';`
);

fs.writeFileSync(healthFile, healthContent);

// Atualizar o Dockerfile
const dockerFile = path.join(__dirname, 'Dockerfile.frontend');
let dockerContent = fs.readFileSync(dockerFile, 'utf8');

// Substituir os valores padrão do commit no Dockerfile
dockerContent = dockerContent.replace(
  /ARG GIT_COMMIT=e4bc6cf/g,
  `ARG GIT_COMMIT=${currentCommit}`
);

fs.writeFileSync(dockerFile, dockerContent);

console.log(`✅ Arquivos atualizados com commit: ${currentCommit}`);
console.log('📁 Arquivos modificados:');
console.log('  - frontend/src/app/api/health/route.ts');
console.log('  - Dockerfile.frontend');
console.log('');
console.log('🚀 Próximos passos:');
console.log('  1. git add .');
console.log('  2. git commit -m "update: commit hash para produção"');
console.log('  3. git push origin main'); 