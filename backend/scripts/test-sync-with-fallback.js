#!/usr/bin/env node

/**
 * Script de teste para sincronização com fallback de credenciais
 * Tenta diferentes combinações de credenciais até encontrar uma que funcione
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Lista de credenciais para tentar
const CREDENTIALS_OPTIONS = [
  { username: 'antonioddd48@gmail.com', password: '@toni123' },
  { username: 'admin@kmiza27.com', password: 'admin123' },
  { username: 'admin_kmiza27', password: 'admin@kmiza27' },
  { username: 'admin', password: 'admin' },
  { username: 'admin@kmiza27.com', password: 'admin@kmiza27' },
  { username: 'admin_kmiza27', password: 'admin123' }
];

let authToken = null;

async function tryLogin() {
  console.log('🔐 Tentando fazer login...');
  
  for (let i = 0; i < CREDENTIALS_OPTIONS.length; i++) {
    const credentials = CREDENTIALS_OPTIONS[i];
    console.log(`\n📝 Tentativa ${i + 1}/${CREDENTIALS_OPTIONS.length}: ${credentials.username}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      if (response.data.access_token) {
        authToken = response.data.access_token;
        console.log(`✅ Login bem-sucedido com: ${credentials.username}`);
        console.log(`👤 Usuário: ${response.data.user.name || response.data.user.username}`);
        console.log(`🔑 Role: ${response.data.user.role || 'N/A'}`);
        return true;
      }
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log('\n❌ Todas as tentativas de login falharam!');
  console.log('💡 Verifique se:');
  console.log('   - O backend está rodando (npm run dev)');
  console.log('   - Existe um usuário administrador no banco');
  console.log('   - As credenciais estão corretas');
  
  return false;
}

async function makeAuthenticatedRequest(method, url, data = null) {
  if (!authToken) {
    throw new Error('Token de autenticação não disponível');
  }
  
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return await axios(config);
}

async function testSyncWithFallback() {
  try {
    console.log('🔧 Teste de Sincronização com Fallback de Credenciais');
    console.log('====================================================');
    
    // 0. Tentar fazer login
    console.log('\n0️⃣ Autenticando...');
    const loginSuccess = await tryLogin();
    
    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login com nenhuma credencial.');
      return;
    }
    
    // 1. Verificar ambiente
    console.log('\n1️⃣ Verificando ambiente...');
    const envResponse = await makeAuthenticatedRequest('GET', '/sync/environment-info');
    
    console.log('✅ Ambiente:', envResponse.data.currentEnvironment);
    console.log('✅ Desenvolvimento:', envResponse.data.isDevelopment ? 'Sim' : 'Não');
    console.log('✅ Credenciais de produção:', envResponse.data.hasProductionCredentials ? 'Sim' : 'Não');
    
    if (!envResponse.data.isDevelopment) {
      console.error('❌ Este script só funciona em ambiente de desenvolvimento');
      return;
    }
    
    if (!envResponse.data.hasProductionCredentials) {
      console.error('❌ Credenciais de produção não configuradas');
      console.log('💡 Configure PROD_DB_PASSWORD no arquivo .env do backend');
      return;
    }
    
    // 2. Verificar conexão com produção
    console.log('\n2️⃣ Verificando conexão com produção...');
    const connectionResponse = await makeAuthenticatedRequest('GET', '/sync/check-production');
    
    if (!connectionResponse.data.success) {
      console.error('❌ Falha na conexão com produção:', connectionResponse.data.message);
      return;
    }
    
    console.log('✅ Conexão com produção OK');
    console.log(`📊 Tabelas disponíveis: ${connectionResponse.data.details.tablesCount}`);
    
    // 3. Testar tabela específica primeiro
    console.log('\n3️⃣ Testando tabela system_settings...');
    
    try {
      const testResponse = await makeAuthenticatedRequest('POST', '/sync/test-table', {
        tableName: 'system_settings'
      });
      
      if (testResponse.data.success) {
        console.log(`✅ system_settings: ${testResponse.data.details.rowsCopied} linhas copiadas`);
      } else {
        console.log(`❌ system_settings: ${testResponse.data.details.error}`);
      }
      
    } catch (error) {
      console.log(`❌ system_settings: Erro na requisição - ${error.response?.data?.message || error.message}`);
    }
    
    // 4. Executar sincronização completa
    console.log('\n4️⃣ Executando sincronização completa...');
    console.log('⚠️  Esta operação irá substituir todos os dados do banco de desenvolvimento!');
    
    const syncResponse = await makeAuthenticatedRequest('POST', '/sync/from-production');
    
    console.log('\n📊 Resultado Final:');
    console.log('==================');
    console.log(`Status: ${syncResponse.data.success ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`Mensagem: ${syncResponse.data.message}`);
    
    if (syncResponse.data.details) {
      const { tablesProcessed, totalRowsCopied, tableResults } = syncResponse.data.details;
      
      console.log(`\n📈 Estatísticas:`);
      console.log(`   Tabelas processadas: ${tablesProcessed}`);
      console.log(`   Total de linhas copiadas: ${totalRowsCopied}`);
      
      // Resumo por status
      const successCount = tableResults.filter(r => r.success).length;
      const errorCount = tableResults.filter(r => !r.success).length;
      const emptyCount = tableResults.filter(r => r.success && r.rowsCopied === 0).length;
      
      console.log(`\n📋 Resumo:`);
      console.log(`   ✅ Sucesso: ${successCount} tabelas`);
      console.log(`   ❌ Erro: ${errorCount} tabelas`);
      console.log(`   📭 Vazias: ${emptyCount} tabelas`);
      
      // Mostrar tabelas com erro
      if (errorCount > 0) {
        console.log(`\n❌ Tabelas com erro:`);
        tableResults
          .filter(r => !r.success)
          .forEach(table => {
            console.log(`   - ${table.tableName}: ${table.error}`);
          });
      }
      
      // Mostrar tabelas com mais dados
      const topTables = tableResults
        .filter(r => r.success && r.rowsCopied > 0)
        .sort((a, b) => b.rowsCopied - a.rowsCopied)
        .slice(0, 5);
      
      if (topTables.length > 0) {
        console.log(`\n📊 Top 5 tabelas com mais dados:`);
        topTables.forEach(table => {
          console.log(`   - ${table.tableName}: ${table.rowsCopied} linhas`);
        });
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
    if (syncResponse.data.success && syncResponse.data.details.totalRowsCopied > 0) {
      console.log('✅ Sincronização funcionando corretamente!');
    } else {
      console.log('❌ Ainda há problemas na sincronização. Verifique os logs do backend.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Executar teste
testSyncWithFallback();
