#!/usr/bin/env node

/**
 * Script para testar a sincronização de produção
 * Executa uma sincronização de teste e mostra os resultados
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testSync() {
  try {
    console.log('🧪 Iniciando teste de sincronização...');
    console.log(`📡 Conectando com API: ${API_BASE_URL}`);
    
    // 1. Verificar informações do ambiente
    console.log('\n1️⃣ Verificando informações do ambiente...');
    const envResponse = await axios.get(`${API_BASE_URL}/sync/environment-info`);
    console.log('✅ Informações do ambiente:', envResponse.data);
    
    // 2. Verificar conexão com produção
    console.log('\n2️⃣ Verificando conexão com produção...');
    const connectionResponse = await axios.get(`${API_BASE_URL}/sync/check-production`);
    console.log('✅ Status da conexão:', connectionResponse.data);
    
    if (!connectionResponse.data.success) {
      console.error('❌ Falha na conexão com produção:', connectionResponse.data.message);
      return;
    }
    
    // 3. Executar sincronização
    console.log('\n3️⃣ Executando sincronização...');
    console.log('⚠️  ATENÇÃO: Esta operação irá substituir todos os dados do banco de desenvolvimento!');
    
    const syncResponse = await axios.post(`${API_BASE_URL}/sync/from-production`);
    console.log('✅ Resultado da sincronização:', syncResponse.data);
    
    // 4. Mostrar estatísticas detalhadas
    if (syncResponse.data.details) {
      const { tablesProcessed, totalRowsCopied, tableResults } = syncResponse.data.details;
      
      console.log('\n📊 Estatísticas da Sincronização:');
      console.log(`   Tabelas processadas: ${tablesProcessed}`);
      console.log(`   Total de linhas copiadas: ${totalRowsCopied}`);
      
      console.log('\n📋 Detalhes por tabela:');
      tableResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const error = result.error ? ` (${result.error})` : '';
        console.log(`   ${status} ${result.tableName}: ${result.rowsCopied} linhas${error}`);
      });
      
      // Mostrar tabelas com erro
      const failedTables = tableResults.filter(r => !r.success);
      if (failedTables.length > 0) {
        console.log('\n❌ Tabelas com erro:');
        failedTables.forEach(table => {
          console.log(`   - ${table.tableName}: ${table.error}`);
        });
      }
    }
    
    console.log('\n🎉 Teste de sincronização concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Executar teste
testSync();

