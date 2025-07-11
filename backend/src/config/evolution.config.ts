import { Logger } from '@nestjs/common';

const logger = new Logger('EvolutionConfig');

// Carregar variáveis de ambiente com fallbacks
const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com';
const apiKey = process.env.EVOLUTION_API_KEY || '';
const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27';

// Log das configurações (mascarando a API Key por segurança)
logger.log('🔧 Configurações da Evolution API carregadas:');
logger.log(`📡 URL: ${apiUrl}`);
logger.log(`🤖 Instância: ${instanceName}`);
logger.log(`🔑 API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'}`);
logger.log(`🔍 API Key length: ${apiKey?.length || 0}`);

// Validar se as configurações obrigatórias estão presentes
if (!apiKey) {
  logger.error('❌ EVOLUTION_API_KEY não está definida!');
  logger.error('💡 Defina a variável de ambiente EVOLUTION_API_KEY no Easypanel');
}

if (!apiUrl) {
  logger.error('❌ EVOLUTION_API_URL não está definida!');
}

if (!instanceName) {
  logger.error('❌ EVOLUTION_INSTANCE_NAME não está definida!');
}

export const evolutionConfig = {
  apiUrl,
  apiKey,
  instanceName,
  enabled: true, // Sempre habilitado - usar apenas dados reais
  
  // Endpoints da Evolution API
  endpoints: {
    sendMessage: '/message/sendText',
    instanceInfo: '/instance/fetchInstances',
    createInstance: '/instance/create',
  },
  
  // Método para validar se as configurações estão corretas
  isValid(): boolean {
    return !!(apiUrl && apiKey && instanceName);
  },
  
  // Método para obter configurações com logs de debug
  getConfig() {
    logger.log('🔍 Obtendo configurações da Evolution API:');
    logger.log(`📡 URL: ${apiUrl}`);
    logger.log(`🤖 Instância: ${instanceName}`);
    logger.log(`🔑 API Key definida: ${!!apiKey}`);
    
    return {
      apiUrl,
      apiKey,
      instanceName,
    };
  }
};

// Log de inicialização
if (evolutionConfig.isValid()) {
  logger.log('✅ Configurações da Evolution API válidas');
} else {
  logger.error('❌ Configurações da Evolution API inválidas');
  logger.error('💡 Verifique as variáveis de ambiente no Easypanel:');
  logger.error('   - EVOLUTION_API_URL');
  logger.error('   - EVOLUTION_API_KEY');
  logger.error('   - EVOLUTION_INSTANCE_NAME');
} 