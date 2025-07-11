import { Injectable, Logger } from '@nestjs/common';
import { evolutionConfig } from '../config/evolution.config';

export interface WhatsAppMessage {
  to: string;
  message: string;
  title?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  async sendMessage(data: WhatsAppMessage): Promise<WhatsAppResponse> {
    this.logger.log(`🚀 INICIANDO ENVIO DE MENSAGEM`);
    this.logger.log(`📱 Para: ${data.to}`);
    this.logger.log(`📝 Mensagem: ${data.message}`);
    this.logger.log(`🏷️ Título: ${data.title || 'Sem título'}`);
    this.logger.log(`⚙️ WhatsApp habilitado: ${evolutionConfig.enabled}`);

    if (!evolutionConfig.enabled) {
      this.logger.warn('⚠️ WhatsApp está desabilitado. Simulando envio...');
      return {
        success: true,
        messageId: `simulated_${Date.now()}`,
      };
    }

    try {
      const url = `${evolutionConfig.apiUrl}${evolutionConfig.endpoints.sendMessage}/${evolutionConfig.instanceName}`;
      
      // Formatar número de telefone (remover caracteres especiais)
      const phoneNumber = this.formatPhoneNumber(data.to);
      
      // Montar mensagem com título se fornecido
      const fullMessage = data.title 
        ? `*${data.title}*\n\n${data.message}`
        : data.message;

      const payload = {
        number: phoneNumber,
        text: fullMessage
      };

      this.logger.log(`🌐 URL da requisição: ${url}`);
      this.logger.log(`📞 Número formatado: ${phoneNumber}`);
      this.logger.log(`📄 Payload completo:`, JSON.stringify(payload, null, 2));
      this.logger.log(`🔑 API Key: ${evolutionConfig.apiKey ? '***SET***' : 'NOT_SET'}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
          'Authorization': `Bearer ${evolutionConfig.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`📡 Status da resposta: ${response.status}`);
      this.logger.log(`📋 Headers da resposta:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ ERRO NA EVOLUTION API:`);
        this.logger.error(`🔢 Status: ${response.status}`);
        this.logger.error(`📄 Resposta: ${errorText}`);
        this.logger.error(`🌐 URL: ${url}`);
        this.logger.error(`📤 Headers enviados:`, {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey ? '***HIDDEN***' : 'NOT_SET',
        });
        
        // Tentar parsear o erro como JSON para mais detalhes
        try {
          const errorJson = JSON.parse(errorText);
          this.logger.error(`🔍 Detalhes do erro:`, errorJson);
        } catch (e) {
          this.logger.error(`📝 Erro em texto puro: ${errorText}`);
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();
      this.logger.log(`✅ MENSAGEM ENVIADA COM SUCESSO!`);
      this.logger.log(`📞 Para: ${phoneNumber}`);
      this.logger.log(`📋 Resposta completa:`, JSON.stringify(result, null, 2));

      return {
        success: true,
        messageId: result.key?.id || result.messageId || result.id || `sent_${Date.now()}`,
      };

    } catch (error) {
      this.logger.error('Erro ao enviar mensagem via WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
      };
    }
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    this.logger.log(`Enviando ${messages.length} mensagens em lote`);
    
    const results: WhatsAppResponse[] = [];
    
    for (const message of messages) {
      const result = await this.sendMessage(message);
      results.push(result);
      
      // Delay entre mensagens para evitar rate limiting
      if (messages.length > 1) {
        await this.delay(1000); // 1 segundo entre mensagens
      }
    }
    
    return results;
  }

  async checkInstanceStatus(): Promise<boolean> {
    if (!evolutionConfig.enabled) {
      this.logger.warn('WhatsApp está desabilitado');
      return false;
    }

    try {
      const url = `${evolutionConfig.apiUrl}${evolutionConfig.endpoints.instanceInfo}`;
      
      this.logger.log(`Verificando status da instância: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Erro ao verificar instância: ${response.status} - ${errorText}`);
        return false;
      }

      const instances = await response.json();
      this.logger.log(`Instâncias encontradas:`, instances);
      
      const instance = instances.find((inst: any) => inst.name === evolutionConfig.instanceName);
      
      if (!instance) {
        this.logger.warn(`Instância ${evolutionConfig.instanceName} não encontrada`);
        this.logger.warn(`Instâncias disponíveis:`, instances.map((inst: any) => inst.name));
        return false;
      }

      const isConnected = instance.connectionStatus === 'open';
      this.logger.log(`Status da instância ${evolutionConfig.instanceName}: ${isConnected ? 'Conectada' : 'Desconectada'}`);
      this.logger.log(`Detalhes da instância:`, instance);
      
      return isConnected;

    } catch (error) {
      this.logger.error('Erro ao verificar status da instância:', error);
      return false;
    }
  }

  async testConnection(): Promise<any> {
    this.logger.log('🧪 TESTANDO CONEXÃO COM EVOLUTION API...');
    this.logger.log(`🌐 URL: ${evolutionConfig.apiUrl}`);
    this.logger.log(`📱 Instance: ${evolutionConfig.instanceName}`);
    this.logger.log(`🔑 API Key: ${evolutionConfig.apiKey ? '***SET***' : 'NOT_SET'}`);
    this.logger.log(`⚙️ Enabled: ${evolutionConfig.enabled}`);
    
    const status = await this.checkInstanceStatus();
    return {
      config: {
        apiUrl: evolutionConfig.apiUrl,
        instanceName: evolutionConfig.instanceName,
        enabled: evolutionConfig.enabled,
        apiKeySet: !!evolutionConfig.apiKey
      },
      connected: status
    };
  }

  async testDirectSend(phoneNumber: string, message: string): Promise<any> {
    this.logger.log('🧪 TESTE DIRETO DE ENVIO');
    
    try {
      // Testar primeiro a conexão
      const connectionTest = await this.testConnection();
      this.logger.log('🔗 Resultado do teste de conexão:', connectionTest);
      
      // Tentar enviar mensagem
      const result = await this.sendMessage({
        to: phoneNumber,
        message: message,
        title: '🧪 TESTE DIRETO'
      });
      
      return {
        connectionTest,
        sendResult: result
      };
    } catch (error) {
      this.logger.error('❌ Erro no teste direto:', error);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adiciona 55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    // Para Evolution API, retorna apenas o número sem @s.whatsapp.net
    return cleaned;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 