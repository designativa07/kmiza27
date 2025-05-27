#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para obter o commit atual do Git
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('⚠️  Não foi possível obter o commit do Git:', error.message);
    return 'unknown';
  }
}

// Função para obter timestamp atual
function getBuildTimestamp() {
  return new Date().toISOString();
}

// Função para obter versão do package.json
function getVersion() {
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.warn('⚠️  Não foi possível obter a versão:', error.message);
    return '1.0.0';
  }
}

// Definir variáveis de ambiente
const buildVars = {
  BUILD_TIMESTAMP: getBuildTimestamp(),
  GIT_COMMIT: getGitCommit(),
  npm_package_version: getVersion()
};

console.log('🔧 Definindo variáveis de build:');
Object.entries(buildVars).forEach(([key, value]) => {
  process.env[key] = value;
  console.log(`   ${key}=${value}`);
});

// Exportar para uso em outros scripts
module.exports = buildVars; 