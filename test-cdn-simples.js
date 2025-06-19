#!/usr/bin/env node

/**
 * Teste simples do CDN
 */

const https = require('https');

async function testCdnSimple() {
  console.log('🧪 TESTE SIMPLES CDN');
  console.log('==================\n');
  
  // Testar URLs do CDN
  const testUrls = [
    'https://cdn.kmiza27.com/img/escudos/botafogo.svg',
    'https://cdn.kmiza27.com/img/escudos/abc-de-natal.svg'
  ];
  
  for (const url of testUrls) {
    console.log(`🔍 Testando: ${url}`);
    const result = await testUrl(url);
    
    if (result.success && result.isImage) {
      console.log('✅ FUNCIONANDO!');
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Size: ${result.contentLength} bytes`);
      
      // Atualizar para CDN oficial
      console.log('\n🔧 Atualizando para CDN oficial...');
      await updateCdnConfig('https://cdn.kmiza27.com');
      console.log('✅ CDN oficial configurado!');
      return;
    } else {
      console.log('❌ Não funcionando');
      if (result.success) {
        console.log(`   Status: ${result.status}`);
        console.log(`   Content-Type: ${result.contentType}`);
      } else {
        console.log(`   Erro: ${result.error}`);
      }
    }
    console.log('');
  }
  
  console.log('❌ CDN não está funcionando ainda');
  console.log('Manter configuração atual do MinIO');
}

async function testUrl(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname,
        method: 'HEAD',
        timeout: 8000,
        headers: {
          'User-Agent': 'CDN-Simple-Test/1.0'
        }
      };

      const req = https.request(options, (res) => {
        const contentType = res.headers['content-type'] || '';
        resolve({
          url,
          status: res.statusCode,
          contentType,
          contentLength: res.headers['content-length'] || 0,
          success: res.statusCode === 200,
          isImage: contentType.includes('image/') || contentType.includes('svg')
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        resolve({
          url,
          success: false,
          error: 'Timeout'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        url,
        success: false,
        error: error.message
      });
    }
  });
}

async function updateCdnConfig(baseUrl) {
  const fs = require('fs');
  
  const cdnContent = `/**
 * Configuração CDN - CDN Oficial funcionando!
 * Última atualização: ${new Date().toISOString()}
 * URL CDN: ${baseUrl}
 */

const CDN_BASE = '${baseUrl}';

/**
 * Gera URL completa para imagem no CDN
 */
export function getCdnImageUrl(imagePath: string): string {
  try {
    // Se já é uma URL completa, retorna como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Remove barra inicial se existir
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Converte caminhos antigos para novos
    let finalPath = cleanPath;
    
    // /uploads/escudos/ -> /img/escudos/
    if (finalPath.startsWith('uploads/escudos/')) {
      finalPath = finalPath.replace('uploads/escudos/', 'img/escudos/');
    }
    
    // /img/ já está correto
    if (!finalPath.startsWith('img/')) {
      finalPath = \`img/\${finalPath}\`;
    }
    
    return \`\${CDN_BASE}/\${finalPath}\`;
  } catch (error) {
    console.error('Erro ao gerar URL CDN:', error);
    return imagePath; // Fallback para URL original
  }
}

// Funções específicas para compatibilidade
export function getTeamLogoUrl(logoPath: string): string {
  if (!logoPath) return \`\${CDN_BASE}/img/escudos/default-team-logo.svg\`;
  return getCdnImageUrl(logoPath);
}

export function getCompetitionLogoUrl(logoPath: string): string {
  if (!logoPath) return \`\${CDN_BASE}/img/logo-competition/default-competition-logo.svg\`;
  return getCdnImageUrl(logoPath);
}

export function getPlayerImageUrl(imagePath: string): string {
  if (!imagePath) return \`\${CDN_BASE}/img/players/default-player-photo.svg\`;
  return getCdnImageUrl(imagePath);
}
`;

  try {
    fs.writeFileSync('futepedia-frontend/src/lib/cdn-simple.ts', cdnContent, 'utf8');
    console.log('✅ cdn-simple.ts atualizado!');
  } catch (error) {
    console.error('❌ Erro ao atualizar:', error.message);
  }
}

testCdnSimple().catch(console.error); 