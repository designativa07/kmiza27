import { Injectable, Logger } from '@nestjs/common';
import { evolutionConfig } from '../config/evolution.config';

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  
  private readonly evolutionUrl = evolutionConfig.apiUrl;
  private readonly apiKey = evolutionConfig.apiKey;
  private readonly instanceName = evolutionConfig.instanceName;

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Verificar e reconectar a instância se necessário
      await this.ensureInstanceConnected();
      
      this.logger.log(`🚀 ENVIANDO MENSAGEM VIA EVOLUTION API`);
      this.logger.log(`📱 Para: ${phoneNumber}`);
      this.logger.log(`📝 Mensagem: ${message.substring(0, 100)}...`);
      this.logger.log(`🌐 URL: ${this.evolutionUrl}`);
      this.logger.log(`🤖 Instância: ${this.instanceName}`);
      this.logger.log(`🔑 API Key: ${this.apiKey ? '***SET***' : 'NOT_SET'}`);
      this.logger.log(`🔍 API Key length: ${this.apiKey?.length || 0}`);
      this.logger.log(`🔍 API Key starts with: ${this.apiKey?.substring(0, 8) || 'N/A'}...`);

      const url = `${this.evolutionUrl}/message/sendText/${this.instanceName}`;
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const payload = {
        number: formattedNumber,
        text: message,
      };

      this.logger.log(`🌐 URL completa: ${url}`);
      this.logger.log(`📞 Número formatado: ${formattedNumber}`);
      this.logger.log(`📄 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`📡 Status da resposta: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        this.logger.log(`✅ MENSAGEM ENVIADA COM SUCESSO!`);
        this.logger.log(`📞 Para: ${formattedNumber}`);
        this.logger.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
        return true;
      } else {
        const errorText = await response.text();
        this.logger.error(`❌ ERRO AO ENVIAR MENSAGEM:`);
        this.logger.error(`🔢 Status: ${response.status}`);
        this.logger.error(`📄 Resposta: ${errorText}`);
        this.logger.error(`🌐 URL: ${url}`);
        this.logger.error(`🔍 Headers enviados:`, {
          'Content-Type': 'application/json',
          'apikey': this.apiKey?.substring(0, 8) + '...' || 'NOT_SET',
        });
        
        try {
          const errorJson = JSON.parse(errorText);
          this.logger.error(`🔍 Detalhes do erro:`, errorJson);
        } catch (e) {
          this.logger.error(`📝 Erro em texto puro: ${errorText}`);
        }
        
        return false;
      }
    } catch (error) {
      this.logger.error('❌ Erro na Evolution API:', error);
      return false;
    }
  }

  async sendListMessage(
    phoneNumber: string,
    title: string,
    description: string,
    buttonText: string,
    sections: {
      title: string;
      rows: { id: string; title: string; description: string }[];
    }[],
    footerText?: string,
  ): Promise<boolean> {
    try {
      // Verificar e reconectar a instância se necessário
      await this.ensureInstanceConnected();
      
      this.logger.log(`🚀 ENVIANDO MENSAGEM DE LISTA VIA EVOLUTION API`);
      this.logger.log(`📱 Para: ${phoneNumber}`);
      this.logger.log(`📝 Título: ${title}`);
      this.logger.log(`📝 Descrição: ${description.substring(0, 100)}...`);
      this.logger.log(`🌐 URL: ${this.evolutionUrl}`);
      this.logger.log(`🤖 Instância: ${this.instanceName}`);
      this.logger.log(`🔑 API Key: ${this.apiKey ? '***SET***' : 'NOT_SET'}`);

      const url = `${this.evolutionUrl}/message/sendList/${this.instanceName}`;
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      // Corrigir estrutura das seções para incluir rowId obrigatório
      const formattedSections = sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          rowId: row.id, // Evolution API requer rowId
          title: row.title,
          description: row.description
        }))
      }));

      const payload = {
        number: formattedNumber,
        title: title,
        description: description,
        buttonText: buttonText,
        footerText: footerText || 'Kmiza27 Bot ⚽', // Evolution API requer footerText
        sections: formattedSections,
      };

      this.logger.log(`🌐 URL completa: ${url}`);
      this.logger.log(`📞 Número formatado: ${formattedNumber}`);
      this.logger.log(`📄 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`📡 Status da resposta: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        this.logger.log(`✅ MENSAGEM DE LISTA ENVIADA COM SUCESSO!`);
        this.logger.log(`📞 Para: ${formattedNumber}`);
        this.logger.log(`📋 Resposta:`, JSON.stringify(result, null, 2));
        return true;
      } else {
        const errorText = await response.text();
        this.logger.error(`❌ ERRO AO ENVIAR MENSAGEM DE LISTA:`);
        this.logger.error(`🔢 Status: ${response.status}`);
        this.logger.error(`📄 Resposta: ${errorText}`);
        this.logger.error(`🌐 URL: ${url}`);

        try {
          const errorJson = JSON.parse(errorText);
          this.logger.error(`🔍 Detalhes do erro:`, errorJson);
        } catch (e) {
          this.logger.error(`📝 Erro em texto puro: ${errorText}`);
        }

        return false;
      }
    } catch (error) {
      this.logger.error('❌ Erro na Evolution API ao enviar mensagem de lista:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('55')) {
      cleaned = cleaned.substring(2);
    }
    
    if (cleaned.length === 10) {
      cleaned = cleaned.substring(0, 2) + '9' + cleaned.substring(2);
    }
    
    return `55${cleaned}`;
  }

  async getInstanceStatus(): Promise<any> {
    try {
      this.logger.log(`🔍 Verificando status da instância ${this.instanceName}...`);
      
      const response = await fetch(`${this.evolutionUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.logger.log(`📋 Instâncias encontradas:`, data.length);
        
        const instance = data.find((inst: any) => inst.name === this.instanceName);
        
        if (instance) {
          this.logger.log(`✅ Instância encontrada:`, {
            name: instance.name,
            state: instance.connectionStatus
          });
          
          return {
            instance: {
              instanceName: this.instanceName,
              state: instance.connectionStatus,
              available: true
            }
          };
        } else {
          this.logger.warn(`⚠️ Instância ${this.instanceName} não encontrada`);
          return {
            instance: {
              instanceName: this.instanceName,
              state: 'not_found',
              available: false
            }
          };
        }
      } else {
        const errorText = await response.text();
        this.logger.error(`❌ Erro ao verificar instâncias: ${response.status} - ${errorText}`);
        
        return {
          instance: {
            instanceName: this.instanceName,
            state: 'api_error',
            error: `${response.status}: ${errorText}`
          }
        };
      }
    } catch (error) {
      this.logger.error('❌ Erro ao verificar status da instância:', error);
      return {
        instance: {
          instanceName: this.instanceName,
          state: 'connection_error',
          error: error.message
        }
      };
    }
  }

  async ensureInstanceConnected(): Promise<boolean> {
    try {
      this.logger.log(`🔍 Verificando conexão da instância ${this.instanceName}...`);
      
      const status = await this.getInstanceStatus();
      
      if (status.instance.state === 'open') {
        this.logger.log(`✅ Instância ${this.instanceName} já está conectada`);
        return true;
      }
      
      this.logger.warn(`⚠️ Instância ${this.instanceName} não está conectada (${status.instance.state}). Tentando reconectar...`);
      
      // Tentar reconectar
      const response = await fetch(`${this.evolutionUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      if (response.ok) {
        const result = await response.json();
        this.logger.log(`✅ Instância ${this.instanceName} reconectada com sucesso:`, result);
        return true;
      } else {
        const errorText = await response.text();
        this.logger.error(`❌ Erro ao reconectar instância: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      this.logger.error('❌ Erro ao verificar/reconectar instância:', error);
      return false;
    }
  }
} 