import { Logger } from '@nestjs/common';
import { shouldLog } from './logging.config';

const logger = new Logger('ShlinkConfig');

// Carregar variáveis de ambiente com fallbacks
const apiUrl = process.env.SHLINK_API_URL || 'https://kmiza27-shlink.h4xd66.easypanel.host';
const apiKey = process.env.SHLINK_API_KEY || '';
const baseDomain = process.env.SHLINK_BASE_DOMAIN || 'link.kmiza27.com';

// Log das configurações apenas se configLogs estiver habilitado
if (shouldLog('enableConfigLogs')) {
  logger.log('🔧 Configurações do Shlink carregadas:');
  logger.log(`📡 URL: ${apiUrl}`);
  logger.log(`🌐 Domínio Base: ${baseDomain}`);
  logger.log(`🔑 API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'}`);
  logger.log(`🔍 API Key length: ${apiKey?.length || 0}`);
}

// Validar se as configurações obrigatórias estão presentes
if (!apiKey) {
  logger.error('❌ SHLINK_API_KEY não está definida!');
  logger.error('💡 Defina a variável de ambiente SHLINK_API_KEY no Easypanel');
  logger.error('💡 Use a API Key: 87b73696-cfb3-416f-9d4d-238b367a7d52');
}

if (!apiUrl) {
  logger.error('❌ SHLINK_API_URL não está definida!');
}

if (!baseDomain) {
  logger.error('❌ SHLINK_BASE_DOMAIN não está definida!');
}

export const shlinkConfig = {
  apiUrl,
  apiKey,
  baseDomain,
  enabled: true,
  
  // Endpoints da API Shlink
  endpoints: {
    shortUrls: '/rest/v3/short-urls',
    createShortUrl: '/rest/v3/short-urls',
    deleteShortUrl: '/rest/v3/short-urls',
    shortUrlStats: '/rest/v3/short-urls/{shortCode}/visits',
    domains: '/rest/v3/domains',
  },
  
  // Configurações padrão para URLs curtas
  defaults: {
    findIfExists: true,
    validateUrl: true,
    forwardQuery: true,
    tags: ['kmiza27-bot'],
  },
  
  // Slugs personalizados para diferentes tipos de conteúdo
  slugPatterns: {
    match: 'j',        // /j/abc123 para jogos
    team: 't',         // /t/abc123 para times
    competition: 'c',  // /c/abc123 para competições
    stadium: 's',      // /s/abc123 para estádios
    stream: 'tv',      // /tv/abc123 para transmissões
    today: 'hoje',     // /hoje para jogos de hoje
    week: 'semana',    // /semana para jogos da semana
  },
  
  // Método para validar se as configurações estão corretas
  isValid(): boolean {
    return !!(apiUrl && apiKey && baseDomain);
  },
  
  // Método para obter configurações com logs de debug
  getConfig() {
    if (shouldLog('enableConfigLogs')) {
      logger.log('🔍 Obtendo configurações do Shlink:');
      logger.log(`📡 URL: ${apiUrl}`);
      logger.log(`🌐 Domínio Base: ${baseDomain}`);
      logger.log(`🔑 API Key definida: ${!!apiKey}`);
    }
    
    return {
      apiUrl,
      apiKey,
      baseDomain,
    };
  },
  
  // Método para gerar URL completa do endpoint
  getEndpointUrl(endpoint: string): string {
    return `${apiUrl}${endpoint}`;
  },
  
  // Método para obter headers HTTP padrão
  getHeaders(): Record<string, string> {
    return {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    };
  }
};

// Log de inicialização
if (shlinkConfig.isValid()) {
  if (shouldLog('enableConfigLogs')) {
    logger.log('✅ Configurações do Shlink válidas');
  }
} else {
  logger.error('❌ Configurações do Shlink inválidas');
  logger.error('💡 Verifique as variáveis de ambiente no Easypanel:');
  logger.error('   - SHLINK_API_URL');
  logger.error('   - SHLINK_API_KEY');
  logger.error('   - SHLINK_BASE_DOMAIN');
} 