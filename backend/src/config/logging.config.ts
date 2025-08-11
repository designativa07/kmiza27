import { LoggerService } from '@nestjs/common';

export interface LoggingConfig {
  enableVerboseLogs: boolean;
  enableDatabaseLogs: boolean;
  enableRouteLogs: boolean;
  enableWhatsAppLogs: boolean;
  enableConfigLogs: boolean;
}

export const loggingConfig: LoggingConfig = {
  // Desabilitar TODOS os logs verbosos
  enableVerboseLogs: false,
  
  // Desabilitar logs do banco de dados
  enableDatabaseLogs: false,
  
  // Desabilitar logs de rotas do NestJS
  enableRouteLogs: false,
  
  // Desabilitar logs do WhatsApp também
  enableWhatsAppLogs: false,
  
  // Desabilitar logs de configuração
  enableConfigLogs: false,
};

// Função para verificar se deve logar baseado na configuração
export function shouldLog(category: keyof LoggingConfig): boolean {
  return loggingConfig[category];
}

// Logger customizado que respeita as configurações
export class ConfigurableLogger implements LoggerService {
  private logger = new (require('@nestjs/common').Logger)();

  log(message: string, context?: string) {
    // Desabilitar todos os logs normais
    return;
  }

  error(message: string, trace?: string, context?: string) {
    // Apenas erros críticos
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    // Desabilitar warnings também
    return;
  }

  debug(message: string, context?: string) {
    // Desabilitar debug
    return;
  }

  verbose(message: string, context?: string) {
    // Desabilitar verbose
    return;
  }
} 