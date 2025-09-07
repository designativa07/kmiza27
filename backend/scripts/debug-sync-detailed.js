const axios = require('axios');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'antonioddd48@gmail.com',
  password: '@toni123'
};

async function debugSyncDetailed() {
  try {
    console.log('🔍 Debug Detalhado da Sincronização');
    console.log('===================================');

    // 1. Login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');

    // 2. Testar sincronização de tabelas específicas
    const testTables = ['matches', 'teams', 'competition_teams', 'simulation_results'];
    
    for (const tableName of testTables) {
      console.log(`\n🔍 Testando sincronização da tabela: ${tableName}`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/sync/test-table`,
          { tableName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log(`✅ ${tableName}: ${response.data.rowsCopied} linhas copiadas`);
        
        if (response.data.error) {
          console.log(`❌ Erro: ${response.data.error}`);
        }
        
      } catch (error) {
        console.log(`❌ ${tableName}: Erro - ${error.response?.data?.message || error.message}`);
      }
    }

    // 3. Executar sincronização completa
    console.log('\n🔄 Executando sincronização completa...');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sync/from-production`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 300000 // 5 minutos
        }
      );
      
      console.log('\n📊 Resultado da Sincronização:');
      console.log('==============================');
      console.log(`Status: ${response.data.success ? '✅ Sucesso' : '❌ Erro'}`);
      console.log(`Mensagem: ${response.data.message}`);
      
      if (response.data.details) {
        console.log(`\n📈 Estatísticas:`);
        console.log(`   Tabelas processadas: ${response.data.details.tablesProcessed}`);
        console.log(`   Total de linhas copiadas: ${response.data.details.totalRowsCopied}`);
        
        console.log(`\n📋 Detalhes por tabela:`);
        response.data.details.tableResults.forEach(result => {
          const status = result.success ? '✅' : '❌';
          console.log(`   ${status} ${result.tableName}: ${result.rowsCopied} linhas`);
          if (result.error) {
            console.log(`      Erro: ${result.error}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Erro na sincronização completa: ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugSyncDetailed();

