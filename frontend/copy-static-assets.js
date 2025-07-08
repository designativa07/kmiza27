#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyStaticAssets() {
  console.log('📦 Copiando arquivos estáticos para modo standalone...');
  
  const standaloneDir = '.next/standalone';
  const staticSrc = '.next/static';
  const staticDest = path.join(standaloneDir, '.next/static');
  const publicSrc = 'public';
  const publicDest = path.join(standaloneDir, 'public');
  
  try {
    // Verificar se a pasta standalone existe
    if (!fs.existsSync(standaloneDir)) {
      console.error('❌ Pasta .next/standalone não encontrada. Execute npm run build primeiro.');
      process.exit(1);
    }
    
    // Copiar arquivos static
    if (fs.existsSync(staticSrc)) {
      console.log('📁 Copiando .next/static...');
      copyRecursiveSync(staticSrc, staticDest);
      console.log('✅ Arquivos static copiados com sucesso');
    } else {
      console.warn('⚠️ Pasta .next/static não encontrada');
    }
    
    // Copiar pasta public
    if (fs.existsSync(publicSrc)) {
      console.log('📁 Copiando public...');
      copyRecursiveSync(publicSrc, publicDest);
      console.log('✅ Pasta public copiada com sucesso');
    } else {
      console.warn('⚠️ Pasta public não encontrada');
    }
    
    console.log('🎉 Modo standalone configurado com sucesso!');
    console.log('');
    console.log('Para executar:');
    console.log('  cd .next/standalone');
    console.log('  node server.js');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao copiar arquivos:', error.message);
    process.exit(1);
  }
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
  copyStaticAssets();
}

module.exports = { copyStaticAssets }; 