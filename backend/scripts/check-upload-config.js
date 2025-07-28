const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkUploadConfig() {
  try {
    console.log('Verificando configuração do upload...');
    
    // Verificar variáveis de ambiente
    console.log('\n=== VARIÁVEIS DE AMBIENTE ===');
    console.log('CDN_URL:', process.env.CDN_URL || 'não definido');
    console.log('MINIO_BUCKET_NAME:', process.env.MINIO_BUCKET_NAME || 'não definido');
    console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT || 'não definido');
    console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY ? 'definido' : 'não definido');
    console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY ? 'definido' : 'não definido');
    
    // Verificar se há arquivo .env
    const fs = require('fs');
    const path = require('path');
    
    const envFiles = [
      '.env',
      '.env.development',
      '.env.production'
    ];
    
    console.log('\n=== ARQUIVOS .ENV ===');
    for (const envFile of envFiles) {
      const envPath = path.join(__dirname, '..', envFile);
      if (fs.existsSync(envPath)) {
        console.log(`${envFile}: existe`);
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n').filter(line => line.includes('MINIO') || line.includes('CDN'));
        if (lines.length > 0) {
          console.log('  Configurações encontradas:');
          lines.forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
              const [key] = line.split('=');
              console.log(`    ${key}`);
            }
          });
        }
      } else {
        console.log(`${envFile}: não existe`);
      }
    }
    
    // Verificar se o backend está rodando
    console.log('\n=== TESTE DE CONEXÃO COM BACKEND ===');
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:3000/upload/config');
      if (response.ok) {
        const config = await response.json();
        console.log('Backend config:', config);
      } else {
        console.log('Backend não está respondendo ou não tem o endpoint /upload/config');
      }
    } catch (error) {
      console.log('Erro ao conectar com backend:', error.message);
    }
    
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
  } finally {
    await pool.end();
  }
}

checkUploadConfig(); 