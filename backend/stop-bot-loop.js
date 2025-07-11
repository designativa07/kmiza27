#!/usr/bin/env node

console.log('🛑 PARANDO LOOP INFINITO DO BOT');
console.log('='.repeat(50));

// Importar dependências
const { Pool } = require('pg');
require('dotenv').config();

async function stopBotLoop() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Desabilitar respostas automáticas
    const result = await pool.query(`
      UPDATE bot_config 
      SET auto_response_enabled = false 
      WHERE id = 1
    `);

    if (result.rowCount > 0) {
      console.log('✅ RESPOSTAS AUTOMÁTICAS DESABILITADAS!');
      console.log('🛑 O bot parou de responder automaticamente');
      console.log('💡 Para reativar, acesse o painel admin ou execute:');
      console.log('   UPDATE bot_config SET auto_response_enabled = true WHERE id = 1;');
    } else {
      console.log('⚠️ Nenhuma configuração encontrada, criando nova...');
      
      await pool.query(`
        INSERT INTO bot_config (id, auto_response_enabled, created_at, updated_at)
        VALUES (1, false, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET auto_response_enabled = false, updated_at = NOW()
      `);
      
      console.log('✅ CONFIGURAÇÃO CRIADA E BOT DESABILITADO!');
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
    console.error('❌ Erro ao parar o bot:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Não foi possível conectar ao banco. Tentativas alternativas:');
      console.log('1. Reiniciar o serviço no Easypanel');
      console.log('2. Verificar se DATABASE_URL está correto');
      console.log('3. Desabilitar webhook temporariamente na Evolution API');
    }
  } finally {
    await pool.end();
  }
}

// Executar
stopBotLoop();

console.log('\n🚨 AÇÕES IMEDIATAS PARA PARAR O LOOP:');
console.log('1. ✅ Este script desabilitou as respostas automáticas');
console.log('2. 🔄 Reinicie o serviço no Easypanel para aplicar as mudanças');
console.log('3. 🔍 Monitore os logs para confirmar que parou');
console.log('4. ⚙️ Implemente os filtros anti-loop quando estiver pronto');

console.log('\n💡 DICAS PARA EVITAR LOOPS FUTUROS:');
console.log('- Sempre filtrar mensagens do próprio bot (fromMe: true)');
console.log('- Processar apenas eventos messages.upsert');
console.log('- Ignorar mensagens de sistema/status');
console.log('- Implementar rate limiting por usuário');
console.log('- Validar origem das mensagens');

console.log('\n' + '='.repeat(50));
console.log('🏁 SCRIPT CONCLUÍDO'); 