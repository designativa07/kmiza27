#!/usr/bin/env node

/**
 * Script para verificar contagens reais no banco de produção
 * Conecta diretamente no banco para ver quantos dados existem
 */

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });
const { Client } = require('pg');

// Verificar se as credenciais estão configuradas
if (!process.env.PROD_DB_PASSWORD) {
  console.error('❌ PROD_DB_PASSWORD não está configurado no arquivo .env');
  console.log('\n💡 Para configurar, adicione ao arquivo backend/.env:');
  console.log('PROD_DB_PASSWORD=sua_senha_de_producao_aqui');
  process.exit(1);
}

// Configuração do banco de produção
const productionConfig = {
  host: process.env.PROD_DB_HOST || 'h4xd66.easypanel.host',
  port: parseInt(process.env.PROD_DB_PORT || '5433', 10),
  database: process.env.PROD_DB_DATABASE || 'kmiza27',
  user: process.env.PROD_DB_USERNAME || 'postgres',
  password: String(process.env.PROD_DB_PASSWORD), // Garantir que é string
  ssl: false,
};

console.log('🔧 Configuração de conexão:');
console.log(`   Host: ${productionConfig.host}`);
console.log(`   Port: ${productionConfig.port}`);
console.log(`   Database: ${productionConfig.database}`);
console.log(`   User: ${productionConfig.user}`);
console.log(`   Password: ${productionConfig.password ? '***configurado***' : '❌ não configurado'}`);

async function verifyProductionCounts() {
  const client = new Client(productionConfig);
  
  try {
    console.log('🔍 Verificando Contagens Reais no Banco de Produção');
    console.log('==================================================');
    
    // Conectar ao banco
    console.log('🔌 Conectando ao banco de produção...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Lista de tabelas para verificar
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
      'cards',
      'teams',
      'stadiums',
      'players',
      'rounds',
      'whatsapp_menu_configs',
      'system_settings',
      'competitions'
    ];
    
    console.log('\n📊 Verificando contagens de dados...');
    console.log('=====================================');
    
    const results = [];
    
    for (const tableName of tablesToCheck) {
      try {
        // Verificar se a tabela existe
        const tableExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `;
        
        const tableExists = await client.query(tableExistsQuery, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`❌ ${tableName}: Tabela não existe`);
          results.push({ table: tableName, count: 0, exists: false });
          continue;
        }
        
        // Contar registros
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
        const countResult = await client.query(countQuery);
        const count = parseInt(countResult.rows[0].count);
        
        console.log(`${count > 0 ? '✅' : '📭'} ${tableName}: ${count} registros`);
        results.push({ table: tableName, count, exists: true });
        
      } catch (error) {
        console.log(`❌ ${tableName}: Erro - ${error.message}`);
        results.push({ table: tableName, count: 0, exists: false, error: error.message });
      }
    }
    
    // Resumo
    console.log('\n📋 Resumo das Contagens:');
    console.log('========================');
    
    const existingTables = results.filter(r => r.exists);
    const tablesWithData = existingTables.filter(r => r.count > 0);
    const emptyTables = existingTables.filter(r => r.count === 0);
    const nonExistentTables = results.filter(r => !r.exists);
    
    console.log(`📊 Total de tabelas verificadas: ${results.length}`);
    console.log(`✅ Tabelas existentes: ${existingTables.length}`);
    console.log(`📈 Tabelas com dados: ${tablesWithData.length}`);
    console.log(`📭 Tabelas vazias: ${emptyTables.length}`);
    console.log(`❌ Tabelas não existentes: ${nonExistentTables.length}`);
    
    // Mostrar tabelas com mais dados
    const topTables = tablesWithData
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    if (topTables.length > 0) {
      console.log('\n🏆 Top 10 tabelas com mais dados:');
      topTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table}: ${table.count} registros`);
      });
    }
    
    // Mostrar tabelas vazias
    if (emptyTables.length > 0) {
      console.log('\n📭 Tabelas vazias:');
      emptyTables.forEach(table => {
        console.log(`   - ${table.table}`);
      });
    }
    
    // Mostrar tabelas não existentes
    if (nonExistentTables.length > 0) {
      console.log('\n❌ Tabelas não existentes:');
      nonExistentTables.forEach(table => {
        console.log(`   - ${table.table}`);
      });
    }
    
    // Análise
    console.log('\n🔍 Análise:');
    console.log('===========');
    
    if (tablesWithData.length < 5) {
      console.log('⚠️  POUCOS DADOS: Muitas tabelas estão vazias na produção');
      console.log('   Isso pode indicar que o banco de produção não tem dados suficientes');
    } else if (tablesWithData.length >= 10) {
      console.log('✅ BOM: Muitas tabelas têm dados na produção');
      console.log('   O problema pode estar na sincronização');
    } else {
      console.log('⚠️  MODERADO: Algumas tabelas têm dados, outras não');
      console.log('   Verifique se as tabelas vazias deveriam ter dados');
    }
    
    console.log('\n💡 Próximos passos:');
    console.log('1. Se muitas tabelas estão vazias, verifique se o banco de produção tem dados');
    console.log('2. Se as tabelas têm dados mas a sincronização falha, verifique os logs');
    console.log('3. Verifique se as credenciais de produção estão corretas');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com produção:', error.message);
    console.log('\n💡 Verifique:');
    console.log('- Se PROD_DB_PASSWORD está configurado no .env');
    console.log('- Se o servidor de produção está acessível');
    console.log('- Se as credenciais estão corretas');
  } finally {
    await client.end();
  }
}

// Executar verificação
verifyProductionCounts();
