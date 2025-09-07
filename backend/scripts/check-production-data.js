#!/usr/bin/env node

/**
 * Script para verificar dados reais nas tabelas de produção
 * Diagnostica por que algumas tabelas estão retornando 0 linhas
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Credenciais do administrador
const ADMIN_CREDENTIALS = {
  username: 'antonioddd48@gmail.com',
  password: '@toni123'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Fazendo login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Login realizado com sucesso!');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data?.message || error.message);
    return false;
  }
}

async function makeAuthenticatedRequest(method, url, data = null) {
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

async function checkProductionData() {
  try {
    console.log('🔍 Verificando Dados Reais de Produção');
    console.log('=====================================');
    
    // 1. Fazer login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login');
      return;
    }
    
    // 2. Verificar conexão com produção
    console.log('\n1️⃣ Verificando conexão com produção...');
    const connectionResponse = await makeAuthenticatedRequest('GET', '/sync/check-production');
    
    if (!connectionResponse.data.success) {
      console.error('❌ Falha na conexão com produção:', connectionResponse.data.message);
      return;
    }
    
    console.log('✅ Conexão com produção OK');
    console.log(`📊 Tabelas disponíveis: ${connectionResponse.data.details.tablesCount}`);
    
    // 3. Lista de tabelas para verificar
    const tablesToCheck = [
      'users',
      'matches', 
      'goals',
      'competition_teams',
      'pool_matches',
      'pool_participants',
      'pool_predictions',
      'simulation_results',
      'chatbot_conversations',
      'notifications',
      'cards'
    ];
    
    console.log('\n2️⃣ Verificando dados específicos nas tabelas...');
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Verificando tabela: ${tableName}`);
      
      try {
        // Testar sincronização da tabela individual
        const testResponse = await makeAuthenticatedRequest('POST', '/sync/test-table', {
          tableName: tableName
        });
        
        if (testResponse.data.success) {
          console.log(`✅ ${tableName}: ${testResponse.data.details.rowsCopied} linhas copiadas`);
          
          if (testResponse.data.details.rowsCopied === 0) {
            console.log(`   ⚠️  Tabela ${tableName} está vazia na origem de produção`);
          }
        } else {
          console.log(`❌ ${tableName}: ${testResponse.data.details.error}`);
        }
        
      } catch (error) {
        console.log(`❌ ${tableName}: Erro na requisição - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 4. Verificar algumas tabelas que sabemos que têm dados
    console.log('\n3️⃣ Verificando tabelas que deveriam ter dados...');
    
    const expectedDataTables = [
      'teams',
      'stadiums', 
      'players',
      'rounds',
      'whatsapp_menu_configs'
    ];
    
    for (const tableName of expectedDataTables) {
      try {
        const testResponse = await makeAuthenticatedRequest('POST', '/sync/test-table', {
          tableName: tableName
        });
        
        if (testResponse.data.success) {
          const count = testResponse.data.details.rowsCopied;
          console.log(`✅ ${tableName}: ${count} linhas`);
          
          if (count === 0) {
            console.log(`   ⚠️  ATENÇÃO: ${tableName} deveria ter dados mas está vazia!`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${tableName}: Erro - ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n4️⃣ Resumo da Verificação:');
    console.log('==========================');
    console.log('Se muitas tabelas estão com 0 linhas, pode indicar:');
    console.log('1. 🔍 Tabelas realmente vazias na produção');
    console.log('2. 🔧 Problema na conexão com produção');
    console.log('3. 📊 Dados em schema diferente');
    console.log('4. 🚫 Permissões insuficientes');
    
    console.log('\n💡 Próximos passos:');
    console.log('- Verificar logs do backend para erros específicos');
    console.log('- Confirmar se as tabelas têm dados na produção');
    console.log('- Verificar se as credenciais de produção estão corretas');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.response?.data || error.message);
  }
}

// Executar verificação
checkProductionData();

