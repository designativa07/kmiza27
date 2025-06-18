const fs = require('fs');
const path = require('path');

console.log('=== DEBUG NEXT.JS STANDALONE ===\n');

// Verificar estrutura do diretório
console.log('📁 Estrutura do diretório atual:');
try {
  const files = fs.readdirSync('.', { withFileTypes: true });
  files.forEach(file => {
    const type = file.isDirectory() ? '📁' : '📄';
    console.log(`${type} ${file.name}`);
  });
} catch (err) {
  console.log('❌ Erro ao ler diretório:', err.message);
}

console.log('\n📁 Estrutura do diretório .next:');
try {
  const nextFiles = fs.readdirSync('.next', { withFileTypes: true });
  nextFiles.forEach(file => {
    const type = file.isDirectory() ? '📁' : '📄';
    console.log(`${type} .next/${file.name}`);
    
    if (file.name === 'static' && file.isDirectory()) {
      console.log('  📁 Conteúdo de .next/static:');
      const staticFiles = fs.readdirSync('.next/static');
      staticFiles.forEach(f => console.log(`    📄 ${f}`));
    }
  });
} catch (err) {
  console.log('❌ Erro ao ler .next:', err.message);
}

console.log('\n🌐 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('HOSTNAME:', process.env.HOSTNAME);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

console.log('\n✅ Debug completo!'); 