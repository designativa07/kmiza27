#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurações
const BACKEND_URL = 'https://kmizabot.h4xd66.easypanel.host';
const LOCAL_UPLOADS_PATH = './backend/uploads/escudos';

// Função para verificar se um arquivo existe no servidor
async function checkFileOnServer(filename) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}/uploads/escudos/${filename}`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${filename} - Disponível no servidor`);
        resolve(true);
      } else {
        console.log(`❌ ${filename} - Não encontrado (${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (error) => {
      console.log(`❌ ${filename} - Erro: ${error.message}`);
      resolve(false);
    });
  });
}

// Função para listar times e seus escudos
async function getTeamsWithLogos() {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}/teams`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const teams = JSON.parse(data);
          const teamsWithLogos = teams.filter(team => team.logo_url && team.logo_url.includes('/uploads/'));
          resolve(teamsWithLogos);
        } catch (error) {
          console.error('Erro ao parsear resposta dos times:', error);
          resolve([]);
        }
      });
    }).on('error', (error) => {
      console.error('Erro ao buscar times:', error);
      resolve([]);
    });
  });
}

// Função para verificar arquivos locais
function checkLocalFiles() {
  console.log('📁 Verificando arquivos locais...');
  
  if (!fs.existsSync(LOCAL_UPLOADS_PATH)) {
    console.log('⚠️  Pasta de uploads local não existe:', LOCAL_UPLOADS_PATH);
    return [];
  }
  
  const files = fs.readdirSync(LOCAL_UPLOADS_PATH)
    .filter(file => file !== '.gitkeep' && /\.(jpg|jpeg|png|gif|svg)$/i.test(file));
  
  console.log(`📊 Encontrados ${files.length} arquivos locais:`);
  files.forEach(file => {
    const stats = fs.statSync(path.join(LOCAL_UPLOADS_PATH, file));
    console.log(`   ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
  
  return files;
}

// Função principal
async function main() {
  console.log('🔍 Verificando persistência de uploads...\n');
  
  // 1. Verificar arquivos locais
  const localFiles = checkLocalFiles();
  console.log('');
  
  // 2. Verificar times com escudos
  console.log('🏆 Verificando times com escudos...');
  const teamsWithLogos = await getTeamsWithLogos();
  
  if (teamsWithLogos.length === 0) {
    console.log('⚠️  Nenhum time com escudo encontrado');
  } else {
    console.log(`📊 Encontrados ${teamsWithLogos.length} times com escudos:`);
    teamsWithLogos.forEach(team => {
      console.log(`   ${team.name} - ${team.logo_url}`);
    });
  }
  console.log('');
  
  // 3. Verificar disponibilidade dos arquivos no servidor
  console.log('🌐 Verificando disponibilidade no servidor...');
  const filesToCheck = teamsWithLogos.map(team => {
    const filename = team.logo_url.split('/').pop();
    return { team: team.name, filename };
  });
  
  if (filesToCheck.length === 0) {
    console.log('⚠️  Nenhum arquivo para verificar');
  } else {
    for (const { team, filename } of filesToCheck) {
      console.log(`🔍 ${team}:`);
      await checkFileOnServer(filename);
    }
  }
  
  console.log('\n📋 Resumo:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 Arquivos locais: ${localFiles.length}`);
  console.log(`🏆 Times com escudos: ${teamsWithLogos.length}`);
  
  if (teamsWithLogos.length > 0 && localFiles.length === 0) {
    console.log('\n⚠️  PROBLEMA DETECTADO:');
    console.log('Times têm escudos cadastrados mas não há arquivos locais.');
    console.log('Isso indica que os uploads não estão persistindo entre deploys.');
    console.log('\n🔧 Soluções:');
    console.log('1. Configure volume persistente no EasyPanel');
    console.log('2. Consulte o arquivo UPLOADS_PERSISTENCE_GUIDE.md');
    console.log('3. Execute: npm run uploads:fix');
  } else if (teamsWithLogos.length === 0) {
    console.log('\n✅ Nenhum problema detectado (ainda não há uploads)');
  } else {
    console.log('\n✅ Uploads parecem estar funcionando corretamente');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro durante verificação:', error);
    process.exit(1);
  });
}

module.exports = { checkFileOnServer, getTeamsWithLogos, checkLocalFiles }; 