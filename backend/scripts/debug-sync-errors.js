#!/usr/bin/env node

/**
 * Script para debugar erros específicos de sincronização
 * Testa cada tabela individualmente para identificar problemas
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function debugSyncErrors() {
  try {
    console.log('🔍 Iniciando debug de erros de sincronização...');
    
    // 1. Verificar conexão com produção
    console.log('\n1️⃣ Verificando conexão com produção...');
    const connectionResponse = await axios.get(`${API_BASE_URL}/sync/check-production`);
    
    if (!connectionResponse.data.success) {
      console.error('❌ Falha na conexão com produção:', connectionResponse.data.message);
      return;
    }
    
    console.log('✅ Conexão com produção OK');
    console.log(`📊 Tabelas disponíveis: ${connectionResponse.data.details.tablesCount}`);
    
    // 2. Testar sincronização de tabelas específicas problemáticas
    const problematicTables = [
      'teams',
      'users', 
      'matches',
      'competition_teams',
      'pool_matches',
      'pool_participants',
      'simulation_results'
    ];
    
    console.log('\n2️⃣ Testando tabelas problemáticas individualmente...');
    
    for (const tableName of problematicTables) {
      console.log(`\n🔍 Testando tabela: ${tableName}`);
      
      try {
        // Simular sincronização de uma tabela específica
        const testResponse = await axios.post(`${API_BASE_URL}/sync/test-table`, {
          tableName: tableName
        });
        
        console.log(`✅ ${tableName}: ${testResponse.data.rowsCopied} linhas copiadas`);
        
      } catch (error) {
        console.log(`❌ ${tableName}: Erro - ${error.response?.data?.message || error.message}`);
        
        // Se for erro de tabela não encontrada, pular
        if (error.response?.data?.message?.includes('não encontrada')) {
          console.log(`⏭️  ${tableName}: Tabela não existe na origem, pulando...`);
          continue;
        }
      }
    }
    
    // 3. Executar sincronização completa com logs detalhados
    console.log('\n3️⃣ Executando sincronização completa...');
    
    const syncResponse = await axios.post(`${API_BASE_URL}/sync/from-production`);
    
    console.log('\n📊 Resultado da Sincronização:');
    console.log(`   Status: ${syncResponse.data.success ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`   Mensagem: ${syncResponse.data.message}`);
    
    if (syncResponse.data.details) {
      const { tablesProcessed, totalRowsCopied, tableResults } = syncResponse.data.details;
      
      console.log(`\n📈 Estatísticas:`);
      console.log(`   Tabelas processadas: ${tablesProcessed}`);
      console.log(`   Total de linhas copiadas: ${totalRowsCopied}`);
      
      // Mostrar tabelas com sucesso
      const successTables = tableResults.filter(r => r.success);
      if (successTables.length > 0) {
        console.log(`\n✅ Tabelas sincronizadas com sucesso (${successTables.length}):`);
        successTables.forEach(table => {
          console.log(`   - ${table.tableName}: ${table.rowsCopied} linhas`);
        });
      }
      
      // Mostrar tabelas com erro
      const failedTables = tableResults.filter(r => !r.success);
      if (failedTables.length > 0) {
        console.log(`\n❌ Tabelas com erro (${failedTables.length}):`);
        failedTables.forEach(table => {
          console.log(`   - ${table.tableName}: ${table.error}`);
        });
      }
      
      // Mostrar tabelas vazias
      const emptyTables = tableResults.filter(r => r.success && r.rowsCopied === 0);
      if (emptyTables.length > 0) {
        console.log(`\n📭 Tabelas vazias na origem (${emptyTables.length}):`);
        emptyTables.forEach(table => {
          console.log(`   - ${table.tableName}`);
        });
      }
    }
    
    console.log('\n🎉 Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Executar debug
debugSyncErrors();

