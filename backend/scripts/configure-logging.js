#!/usr/bin/env node

/**
 * Script para configurar níveis de logging do sistema
 * Uso: node scripts/configure-logging.js [verbose|minimal|debug]
 */

const fs = require('fs');
const path = require('path');

const LOGGING_CONFIG_PATH = path.join(__dirname, '../src/config/logging.config.ts');

const LOGGING_PRESETS = {
  verbose: {
    enableVerboseLogs: true,
    enableDatabaseLogs: true,
    enableRouteLogs: true,
    enableWhatsAppLogs: true,
    enableConfigLogs: true,
  },
  minimal: {
    enableVerboseLogs: false,
    enableDatabaseLogs: false,
    enableRouteLogs: false,
    enableWhatsAppLogs: true,
    enableConfigLogs: false,
  },
  debug: {
    enableVerboseLogs: true,
    enableDatabaseLogs: true,
    enableRouteLogs: false,
    enableWhatsAppLogs: true,
    enableConfigLogs: true,
  },
  silent: {
    enableVerboseLogs: false,
    enableDatabaseLogs: false,
    enableRouteLogs: false,
    enableWhatsAppLogs: false,
    enableConfigLogs: false,
  }
};

function updateLoggingConfig(preset) {
  if (!LOGGING_PRESETS[preset]) {
    console.error(`❌ Preset inválido: ${preset}`);
    console.log('📋 Presets disponíveis:');
    Object.keys(LOGGING_PRESETS).forEach(key => {
      console.log(`   - ${key}`);
    });
    process.exit(1);
  }

  const config = LOGGING_PRESETS[preset];
  
  // Ler o arquivo atual
  let content = fs.readFileSync(LOGGING_CONFIG_PATH, 'utf8');
  
  // Atualizar as configurações
  Object.entries(config).forEach(([key, value]) => {
    const regex = new RegExp(`${key}:\\s*(true|false)`, 'g');
    content = content.replace(regex, `${key}: ${value}`);
  });
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(LOGGING_CONFIG_PATH, content);
  
  console.log(`✅ Configuração de logging atualizada para: ${preset}`);
  console.log('📊 Configurações aplicadas:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
}

// Executar o script
const preset = process.argv[2] || 'minimal';
updateLoggingConfig(preset); 