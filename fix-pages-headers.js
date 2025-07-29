const fs = require('fs');
const path = require('path');

// Páginas que precisam ser corrigidas
const pagesToFix = [
  'futepedia-frontend/src/app/admin-amadores/jogos/page.tsx',
  'futepedia-frontend/src/app/admin-amadores/estadios/page.tsx',
  'futepedia-frontend/src/app/admin-amadores/estatisticas/page.tsx'
];

function fixPageHeaders() {
  pagesToFix.forEach(pagePath => {
    try {
      if (fs.existsSync(pagePath)) {
        let content = fs.readFileSync(pagePath, 'utf8');
        
        // Remover import do HeaderWithLogo
        content = content.replace(/import\s+\{\s*HeaderWithLogo\s*\}\s+from\s+['"]@\/components\/HeaderWithLogo['"];?\s*\n/g, '');
        
        // Remover uso do HeaderWithLogo
        content = content.replace(/<HeaderWithLogo\s*\/>\s*\n/g, '');
        
        // Remover div wrapper com bg-gray-50 min-h-screen
        content = content.replace(/<div\s+className="bg-gray-50\s+min-h-screen">\s*\n\s*<HeaderWithLogo\s*\/>\s*\n\s*<main\s+className="max-w-6xl\s+mx-auto\s+px-4\s+sm:px-6\s+lg:px-8\s+py-8">/g, '<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">');
        
        // Remover fechamento do main e div wrapper
        content = content.replace(/<\/main>\s*\n\s*<\/div>/g, '</div>');
        
        // Corrigir loading state
        content = content.replace(
          /<div\s+className="bg-gray-50\s+min-h-screen">\s*\n\s*<HeaderWithLogo\s*\/>\s*\n\s*<main\s+className="max-w-6xl\s+mx-auto\s+px-4\s+sm:px-6\s+lg:px-8\s+py-8">\s*\n\s*<div\s+className="animate-pulse">/g,
          '<div className="min-h-screen bg-gray-50 flex items-center justify-center">\n        <div className="text-center">'
        );
        
        content = content.replace(
          /<\/div>\s*\n\s*<\/div>\s*\n\s*<\/main>\s*\n\s*<\/div>/g,
          '</div>\n        </div>\n      </div>'
        );
        
        fs.writeFileSync(pagePath, content);
        console.log(`✅ Corrigido: ${pagePath}`);
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${pagePath}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${pagePath}:`, error.message);
    }
  });
}

fixPageHeaders();
console.log('🎉 Correção de cabeçalhos concluída!'); 