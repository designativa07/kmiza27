import { Logger } from '@nestjs/common';

const logger = new Logger('EvolutionConfig');

// Carregar variáveis de ambiente com fallbacks
const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com';
const apiKey = process.env.EVOLUTION_API_KEY || '';
const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27';

// Logs removidos completamente - apenas validar silenciosamente

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
  
  // Método para obter configurações sem logs
  getConfig() {
    return {
      apiUrl,
      apiKey,
      instanceName,
    };
  }
};

// Logs de inicialização removidos completamente 