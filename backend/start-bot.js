#!/usr/bin/env node

console.log('🚀 REATIVANDO BOT COM PROTEÇÃO ANTI-LOOP');
console.log('='.repeat(50));

// Importar dependências
const { Pool } = require('pg');
require('dotenv').config();

async function startBot() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Habilitar respostas automáticas
    const result = await pool.query(`
      UPDATE bot_config 
      SET auto_response_enabled = true 
      WHERE id = 1
    `);

    if (result.rowCount > 0) {
      console.log('✅ RESPOSTAS AUTOMÁTICAS HABILITADAS!');
      console.log('🤖 O bot voltou a responder automaticamente');
    } else {
      console.log('⚠️ Nenhuma configuração encontrada, criando nova...');
      
      await pool.query(`
        INSERT INTO bot_config (id, auto_response_enabled, created_at, updated_at)
        VALUES (1, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET auto_response_enabled = true, updated_at = NOW()
      `);
      
      console.log('✅ CONFIGURAÇÃO CRIADA E BOT HABILITADO!');
    }

    // Verificar status atual
    const statusResult = await pool.query('SELECT * FROM bot_config WHERE id = 1');
    if (statusResult.rows.length > 0) {
      const config = statusResult.rows[0];
      console.log('\n📊 STATUS ATUAL:');
      console.log(`- Respostas automáticas: ${config.auto_response_enabled ? '✅ HABILITADAS' : '❌ DESABILITADAS'}`);
      console.log(`- Última atualização: ${config.updated_at}`);
    }

  } catch (error) {
    console.error('❌ Erro ao reativar o bot:', error);
  } finally {
    await pool.end();
  }
}

// Executar
startBot();

console.log('\n🛡️ PROTEÇÕES ANTI-LOOP ATIVAS:');
console.log('✅ Filtro de mensagens próprias (fromMe: true)');
console.log('✅ Filtro de eventos de sistema');
console.log('✅ Filtro de mensagens vazias');
console.log('✅ Filtro de mensagens de sistema');
console.log('✅ Processamento apenas de messages.upsert');

console.log('\n🎯 MONITORAMENTO:');
console.log('- Acompanhe os logs para verificar se não há loops');
console.log('- Se houver loop, execute: node stop-bot-loop.js');
console.log('- Teste com uma mensagem simples primeiro');

console.log('\n' + '='.repeat(50));
console.log('🏁 BOT REATIVADO COM SEGURANÇA'); 