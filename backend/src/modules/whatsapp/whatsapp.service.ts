import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotConversation } from '../../entities/chatbot-conversation.entity';
import { User } from '../../entities/user.entity';
import { evolutionConfig } from '../../config/evolution.config';

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

export interface EvolutionChat {
  id: string;
  name?: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: {
    message: string;
    timestamp: number;
    fromMe: boolean;
  };
  participant?: string;
}

export interface EvolutionMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
  status?: string;
}

export interface WhatsAppConversation {
  id: string;
  phone: string;
  userName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'waiting' | 'closed';
  messages: WhatsAppMessageFormatted[];
}

export interface WhatsAppMessageFormatted {
  id: string;
  phone: string;
  userName?: string;
  message: string;
  timestamp: string;
  messageTimestamp?: number; // Timestamp original em segundos para ordenação precisa
  type: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isBot: boolean;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectRepository(ChatbotConversation)
    private conversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
      
      // Formatar número de telefone brasileiro
      const phoneNumber = this.formatBrazilianPhoneNumber(data.to);
      
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

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Se não começar com código do país, adiciona o código do Brasil (55)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    // Adiciona @s.whatsapp.net se não estiver presente
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@s.whatsapp.net';
    }
    
    return cleaned;
  }

  private formatBrazilianPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Se começar com 0, remove
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Se não começar com código do país, adiciona o código do Brasil (55)
    if (!cleaned.startsWith('55')) {
      if (cleaned.length === 11) {
        cleaned = '55' + cleaned;
      } else if (cleaned.length === 10) {
        // Adiciona o 9 para celulares antigos
        cleaned = '55' + cleaned.substring(0, 2) + '9' + cleaned.substring(2);
      }
    }
    
    return cleaned;
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

  // Novos métodos para buscar conversas reais da Evolution API
  async getConversations(status?: string, filters?: {
    period?: string;
    team?: string;
    competition?: string;
  }): Promise<WhatsAppConversation[]> {
    this.logger.log('🔍 Buscando conversas REAIS da Evolution API...');

    try {
      // Usar o endpoint correto da Evolution API (POST com body vazio)
      const url = `${evolutionConfig.apiUrl}/chat/findChats/${evolutionConfig.instanceName}`;
      
      this.logger.log(`🌐 URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST', // Usar POST conforme documentação oficial
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey,
          'Authorization': `Bearer ${evolutionConfig.apiKey}`,
        },
        body: JSON.stringify({}) // Body vazio conforme documentação
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ ERRO na Evolution API: ${response.status} - ${errorText}`);
        this.logger.error(`🌐 URL tentada: ${url}`);
        this.logger.error(`🔑 API Key: ${evolutionConfig.apiKey ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
        throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
      }

      const chats: any[] = await response.json();
      this.logger.log(`📱 ${chats.length} conversas encontradas`);

      // Converter para o formato esperado pelo frontend
      const conversations: WhatsAppConversation[] = chats
        .filter(chat => {
          // Filtrar apenas conversas individuais (não grupos)
          if (!chat.remoteJid || chat.remoteJid.includes('@g.us')) {
            return false;
          }
          
          // Filtrar conversas que têm atividade MUITO recente (últimos 2 dias)
          if (chat.updatedAt) {
            const lastUpdate = new Date(chat.updatedAt);
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            return lastUpdate > twoDaysAgo;
          }
          
          // Se não tem updatedAt, excluir por segurança
          return false;
        })
        .map(chat => {
          const phone = chat.remoteJid.replace('@s.whatsapp.net', '');
          const lastMessageTime = chat.updatedAt 
            ? this.formatTimeAgo(new Date(chat.updatedAt))
            : 'Sem mensagens';

          return {
            id: chat.remoteJid,
            phone: phone,
            userName: chat.pushName || phone,
            lastMessage: 'Conversa ativa',
            lastMessageTime: lastMessageTime,
            unreadCount: 0,
            status: this.getConversationStatus(chat.updatedAt ? new Date(chat.updatedAt) : new Date()),
            messages: []
          };
        });

      // Aplicar filtros
      let filteredConversations = conversations;

      // Filtrar por status se especificado
      if (status && status !== 'all') {
        filteredConversations = filteredConversations.filter(conv => conv.status === status);
      }

      // Filtrar por período (apenas se não for 'all')
      if (filters?.period && filters.period !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0); // Todos os períodos
        }

        // Usar updatedAt do chat original em vez de lastMessageTime formatado
        filteredConversations = filteredConversations.filter(conv => {
          // Buscar o chat original para pegar a data real
          const originalChat = chats.find(chat => chat.remoteJid === conv.id);
          if (originalChat && originalChat.updatedAt) {
            const convDate = new Date(originalChat.updatedAt);
            return convDate >= startDate;
          }
          return true; // Se não tiver data, incluir na lista
        });
      }

      // Filtrar por time (buscar nas mensagens por palavras-chave)
      if (filters?.team) {
        const teamKeywords = this.getTeamKeywords(filters.team);
        filteredConversations = filteredConversations.filter(conv => {
          const message = conv.lastMessage.toLowerCase();
          return teamKeywords.some(keyword => message.includes(keyword));
        });
      }

      // Filtrar por competição
      if (filters?.competition) {
        const competitionKeywords = this.getCompetitionKeywords(filters.competition);
        filteredConversations = filteredConversations.filter(conv => {
          const message = conv.lastMessage.toLowerCase();
          return competitionKeywords.some(keyword => message.includes(keyword));
        });
      }

      // Retornar conversas filtradas por data (verificação individual desabilitada para performance)
      this.logger.log(`📱 ${filteredConversations.length} conversas filtradas por data retornadas`);
      return filteredConversations;

    } catch (error) {
      this.logger.error('❌ ERRO CRÍTICO ao buscar conversas da Evolution API:', error);
      this.logger.error('🚨 Verifique se a Evolution API está funcionando e acessível');
      // Retornar array vazio em vez de dados mock
      return [];
    }
  }

  async getConversationMessages(phoneNumber: string): Promise<WhatsAppMessageFormatted[] | null> {
    this.logger.log(`🔍 Buscando mensagens REAIS para ${phoneNumber}...`);

    try {
      const remoteJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
      const url = `${evolutionConfig.apiUrl}/chat/findMessages/${evolutionConfig.instanceName}`;
      
      // Tentar diferentes formatos de payload
      const payloads = [
        // Formato 1: Com where
        {
          where: {
            key: {
              remoteJid: remoteJid
            }
          },
          limit: 50
        },
        // Formato 2: Simples
        {
          remoteJid: remoteJid,
          limit: 50
        },
        // Formato 3: Apenas remoteJid
        {
          remoteJid: remoteJid
        }
      ];

      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];
        this.logger.log(`🌐 Tentativa ${i + 1} - URL: ${url}`);
        this.logger.log(`📄 Payload ${i + 1}:`, JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionConfig.apiKey,
            'Authorization': `Bearer ${evolutionConfig.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        this.logger.log(`📡 Status da resposta ${i + 1}: ${response.status}`);

        if (response.ok) {
          const responseData = await response.json();
          this.logger.log(`📨 Resposta da Evolution API (tentativa ${i + 1}):`, JSON.stringify(responseData, null, 2));
          
          // A resposta pode ter diferentes formatos, vamos verificar todos
          let messages: any[] = [];
          
          // BASEADO NOS LOGS REAIS: A Evolution API retorna diretamente um array de mensagens
          if (Array.isArray(responseData) && responseData.length > 0) {
            // Verificar se os itens do array têm estrutura de mensagem
            const firstItem = responseData[0];
            if (firstItem && (firstItem.key || firstItem.message || firstItem.messageType || firstItem.id)) {
              this.logger.log(`✅ Encontrado array direto de mensagens com ${responseData.length} itens`);
              messages = responseData;
            }
          }
          // Fallback: verificar outros formatos
          else if (responseData.response && responseData.response.data && Array.isArray(responseData.response.data)) {
            this.logger.log(`✅ Encontrado formato response.data com ${responseData.response.data.length} mensagens`);
            messages = responseData.response.data;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            this.logger.log(`✅ Encontrado formato data com ${responseData.data.length} mensagens`);
            messages = responseData.data;
          } else if (responseData.messages && Array.isArray(responseData.messages)) {
            this.logger.log(`✅ Encontrado formato messages com ${responseData.messages.length} mensagens`);
            messages = responseData.messages;
          } else if (responseData.response && Array.isArray(responseData.response)) {
            this.logger.log(`✅ Encontrado formato response array com ${responseData.response.length} mensagens`);
            messages = responseData.response;
          }
          
          // Log adicional para debug
          this.logger.log(`🔍 Estrutura da resposta:`, {
            isArray: Array.isArray(responseData),
            hasData: !!responseData.data,
            hasMessages: !!responseData.messages,
            hasResponse: !!responseData.response,
            hasResponseData: !!(responseData.response && responseData.response.data),
            responseKeys: Object.keys(responseData),
            responseDataKeys: responseData.response ? Object.keys(responseData.response) : [],
            responseDataLength: responseData.response && responseData.response.data ? responseData.response.data.length : 0
          });
          
          // Se ainda não encontrou mensagens, vamos tentar extrair de qualquer lugar
          if (messages.length === 0) {
            this.logger.log(`⚠️ Tentando extrair mensagens de qualquer estrutura...`);
            
            // Função recursiva para encontrar arrays de mensagens
            const findMessagesInObject = (obj: any, path = ''): any[] => {
              if (Array.isArray(obj) && obj.length > 0) {
                // Verificar se parece com mensagens (tem propriedades como 'message', 'key', etc.)
                const firstItem = obj[0];
                if (firstItem && (firstItem.message || firstItem.key || firstItem.messageType)) {
                  this.logger.log(`✅ Encontrado array de mensagens em: ${path}`);
                  return obj;
                }
              }
              
              if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                  const result = findMessagesInObject(value, `${path}.${key}`);
                  if (result.length > 0) {
                    return result;
                  }
                }
              }
              
              return [];
            };
            
            const foundMessages = findMessagesInObject(responseData, 'root');
            if (foundMessages.length > 0) {
              this.logger.log(`🎯 Encontradas ${foundMessages.length} mensagens via busca recursiva`);
              messages = foundMessages;
            }
          }
          
          this.logger.log(`📨 ${messages.length} mensagens encontradas na tentativa ${i + 1}`);
          
          // Log detalhado das primeiras mensagens para debug
          if (messages.length > 0) {
            this.logger.log(`🔍 Estrutura da primeira mensagem:`, JSON.stringify(messages[0], null, 2));
            this.logger.log(`🔍 Estrutura da última mensagem:`, JSON.stringify(messages[messages.length - 1], null, 2));
          }

          if (messages.length > 0) {
            // Converter para o formato esperado pelo frontend
            const formattedMessages: WhatsAppMessageFormatted[] = messages.map((msg, index) => {
              // Extrair texto da mensagem com base na estrutura real da Evolution API
              let messageText = 'Mensagem sem texto';
              
              // Estrutura baseada nos logs reais da Evolution API
              if (msg.message?.conversation) {
                messageText = msg.message.conversation;
              } else if (msg.message?.extendedTextMessage?.text) {
                messageText = msg.message.extendedTextMessage.text;
              } else if (msg.message?.imageMessage?.caption) {
                messageText = msg.message.imageMessage.caption;
              } else if (msg.body) {
                messageText = msg.body;
              } else if (typeof msg.message === 'string') {
                messageText = msg.message;
              }
              
              // Log da estrutura da mensagem para debug
              if (index === 0) {
                this.logger.log(`🔍 Estrutura da primeira mensagem processada:`, {
                  id: msg.id,
                  key: msg.key,
                  pushName: msg.pushName,
                  messageType: msg.messageType,
                  messageTimestamp: msg.messageTimestamp,
                  messageText: messageText,
                  hasMessage: !!msg.message,
                  messageKeys: msg.message ? Object.keys(msg.message) : []
                });
              }
              
              // Usar messageTimestamp se disponível, senão usar timestamp atual
              const timestamp = msg.messageTimestamp 
                ? new Date(msg.messageTimestamp * 1000)
                : new Date();

              // Determinar se é mensagem enviada ou recebida
              // Verificar múltiplas propriedades para garantir identificação correta
              const isFromMe = msg.key?.fromMe === true || msg.fromMe === true || false;
              
              // Log detalhado para debug
              if (index === 0) {
                this.logger.log(`🔍 Debug tipo de mensagem:`, {
                  'msg.key?.fromMe': msg.key?.fromMe,
                  'msg.fromMe': msg.fromMe,
                  'isFromMe': isFromMe,
                  'messageText': messageText.substring(0, 50) + '...'
                });
              }
              
              // Determinar se é bot (mensagem enviada pela nossa aplicação)
              // Bot = mensagem enviada (fromMe=true) OU mensagem que contém texto típico de bot
              const isBot = isFromMe || messageText.includes('Kmiza27 Bot') || messageText.includes('🤖');

              const formattedMessage: WhatsAppMessageFormatted = {
                id: msg.key?.id || msg.id || `msg_${Date.now()}_${Math.random()}`,
                phone: phoneNumber.replace('@s.whatsapp.net', ''),
                userName: msg.pushName || msg.participant || phoneNumber.replace('@s.whatsapp.net', ''),
                message: messageText,
                timestamp: this.formatTime(timestamp),
                messageTimestamp: msg.messageTimestamp, // Incluir timestamp original para ordenação precisa
                type: isFromMe ? 'outgoing' : 'incoming',
                status: msg.status || 'read',
                isBot: isBot
              };

              // Log da mensagem formatada para debug
              if (index === 0) {
                this.logger.log(`🔍 Primeira mensagem formatada:`, formattedMessage);
              }

              return formattedMessage;
            });

            // Ordenar por messageTimestamp original (mais antigas primeiro) - inclui segundos
            const sortedMessages = formattedMessages.sort((a, b) => {
              const timestampA = a.messageTimestamp || 0;
              const timestampB = b.messageTimestamp || 0;
              
              return timestampA - timestampB;
            });
            
            this.logger.log(`✅ Retornando ${sortedMessages.length} mensagens REAIS formatadas`);
            return sortedMessages;
          }
        } else {
          const errorText = await response.text();
          this.logger.error(`❌ ERRO na tentativa ${i + 1}: ${response.status} - ${errorText}`);
          
          // Se o erro for 404 ou similar, a conversa provavelmente não existe mais
          if (response.status === 404 || response.status === 400) {
            this.logger.log(`🗑️ Conversa ${phoneNumber} parece ter sido deletada (${response.status})`);
            return null; // Retornar null para indicar que a conversa não existe
          }
        }
      }

      // Se chegou aqui, nenhuma tentativa funcionou
      this.logger.warn(`⚠️ Nenhuma mensagem encontrada para ${phoneNumber} em todas as tentativas`);
      this.logger.log(`📝 Retornando array vazio - sem mensagens reais disponíveis`);
      
      // Retornar array vazio - sem mensagens de demonstração
      return [];

    } catch (error) {
      this.logger.error('❌ ERRO CRÍTICO ao buscar mensagens:', error);
      
      // Retornar array vazio em caso de erro - sem mensagens de demonstração
      return [];
    }
  }

  async sendMessageToConversation(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    return this.sendMessage({
      to: phoneNumber,
      message: message
    });
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    this.logger.log(`📤 Enviando ${messages.length} mensagens em lote...`);
    
    const results: WhatsAppResponse[] = [];
    
    // Enviar mensagens sequencialmente para evitar rate limiting
    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push(result);
        
        // Pequeno delay entre mensagens para evitar spam
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`Erro ao enviar mensagem para ${message.to}:`, error);
        results.push({
          success: false,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    this.logger.log(`📊 Resultado do envio em lote: ${successCount} sucessos, ${errorCount} erros`);
    
    return results;
  }

  async getWhatsAppStatus(): Promise<any> {
    const isConnected = await this.checkInstanceStatus();
    const conversations = await this.getConversations();
    
    return {
      connected: isConnected,
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      unreadMessages: conversations.reduce((total, conv) => total + conv.unreadCount, 0)
    };
  }

  // Métodos auxiliares removidos - usando apenas dados reais da Evolution API

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getConversationStatus(lastMessageTime: Date): 'active' | 'waiting' | 'closed' {
    const now = new Date();
    const diffInHours = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'active';
    if (diffInHours < 24) return 'waiting';
    return 'closed';
  }

  private getTeamKeywords(team: string): string[] {
    const teamKeywords: { [key: string]: string[] } = {
      'flamengo': ['flamengo', 'mengão', 'fla', 'rubro-negro'],
      'vasco': ['vasco', 'vascão', 'cruz-maltino'],
      'botafogo': ['botafogo', 'fogão', 'bota', 'estrela solitária'],
      'fluminense': ['fluminense', 'flu', 'tricolor', 'nense'],
      'palmeiras': ['palmeiras', 'verdão', 'porco', 'alviverde'],
      'corinthians': ['corinthians', 'timão', 'corintiano'],
      'sao-paulo': ['são paulo', 'spfc', 'tricolor paulista', 'soberano'],
      'santos': ['santos', 'peixe', 'alvinegro praiano'],
      'gremio': ['grêmio', 'tricolor gaúcho', 'imortal'],
      'internacional': ['internacional', 'inter', 'colorado']
    };

    return teamKeywords[team.toLowerCase()] || [team.toLowerCase()];
  }

  private getCompetitionKeywords(competition: string): string[] {
    const competitionKeywords: { [key: string]: string[] } = {
      'brasileirao': ['brasileirão', 'série a', 'campeonato brasileiro'],
      'copa-brasil': ['copa do brasil', 'copa brasil'],
      'libertadores': ['libertadores', 'conmebol libertadores', 'taça libertadores'],
      'sul-americana': ['sul-americana', 'conmebol sul-americana'],
      'carioca': ['carioca', 'campeonato carioca', 'estadual'],
      'paulista': ['paulista', 'campeonato paulista', 'paulistão'],
      'copa-mundo': ['copa do mundo', 'mundial', 'world cup'],
      'champions': ['champions league', 'liga dos campeões']
    };

    return competitionKeywords[competition.toLowerCase()] || [competition.toLowerCase()];
  }

  // Métodos específicos para contexto de futebol
  async getFootballRelatedConversations(): Promise<WhatsAppConversation[]> {
    const allConversations = await this.getConversations();
    
    // Palavras-chave relacionadas a futebol
    const footballKeywords = [
      'jogo', 'partida', 'gol', 'time', 'futebol', 'campeonato', 
      'flamengo', 'vasco', 'botafogo', 'fluminense', 'palmeiras', 
      'corinthians', 'são paulo', 'santos', 'brasileirão', 'libertadores',
      'copa', 'resultado', 'placar', 'escalação', 'técnico'
    ];
    
    return allConversations.filter(conversation => {
      const lastMessage = conversation.lastMessage.toLowerCase();
      return footballKeywords.some(keyword => lastMessage.includes(keyword));
    });
  }

  async getConversationsByFavoriteTeam(teamSlug: string): Promise<WhatsAppConversation[]> {
    try {
      // Buscar usuários que têm esse time como favorito
      const users = await this.userRepository.find({
        where: { favorite_team: { slug: teamSlug } },
        relations: ['favorite_team']
      });

      const userPhones = users.map(user => user.phone_number);
      const allConversations = await this.getConversations();

      // Filtrar conversas dos usuários que torcem para esse time
      return allConversations.filter(conversation => {
        const phone = conversation.phone.replace(/\D/g, ''); // Remove caracteres não numéricos
        return userPhones.some(userPhone => userPhone.includes(phone) || phone.includes(userPhone));
      });

    } catch (error) {
      this.logger.error('Erro ao buscar conversas por time favorito:', error);
      return [];
    }
  }

  async getConversationStats(): Promise<{
    total: number;
    active: number;
    waiting: number;
    closed: number;
    footballRelated: number;
    averageResponseTime: string;
    topTeams: { team: string; count: number }[];
  }> {
    try {
      const conversations = await this.getConversations();
      const footballConversations = await this.getFootballRelatedConversations();

      // Estatísticas básicas
      const stats = {
        total: conversations.length,
        active: conversations.filter(c => c.status === 'active').length,
        waiting: conversations.filter(c => c.status === 'waiting').length,
        closed: conversations.filter(c => c.status === 'closed').length,
        footballRelated: footballConversations.length,
        averageResponseTime: '2.5 min', // Placeholder - pode ser calculado baseado em dados reais
        topTeams: [] as { team: string; count: number }[]
      };

      // Análise de times mais mencionados
      const teamMentions = new Map<string, number>();
      const teamKeywords = {
        'flamengo': ['flamengo', 'mengão', 'fla'],
        'vasco': ['vasco', 'vascão'],
        'botafogo': ['botafogo', 'fogão', 'bota'],
        'fluminense': ['fluminense', 'flu', 'tricolor'],
        'palmeiras': ['palmeiras', 'verdão'],
        'corinthians': ['corinthians', 'timão'],
        'são paulo': ['são paulo', 'spfc', 'tricolor paulista'],
        'santos': ['santos', 'peixe']
      };

      footballConversations.forEach(conversation => {
        const message = conversation.lastMessage.toLowerCase();
        Object.entries(teamKeywords).forEach(([team, keywords]) => {
          if (keywords.some(keyword => message.includes(keyword))) {
            teamMentions.set(team, (teamMentions.get(team) || 0) + 1);
          }
        });
      });

      stats.topTeams = Array.from(teamMentions.entries())
        .map(([team, count]) => ({ team, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return stats;

    } catch (error) {
      this.logger.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        active: 0,
        waiting: 0,
        closed: 0,
        footballRelated: 0,
        averageResponseTime: 'N/A',
        topTeams: []
      };
    }
  }

  async sendMatchNotification(matchData: {
    homeTeam: string;
    awayTeam: string;
    score?: string;
    status: string;
    competition: string;
  }): Promise<WhatsAppResponse[]> {
    try {
      // Buscar usuários interessados nos times da partida
      const users = await this.userRepository.find({
        where: [
          { favorite_team: { name: matchData.homeTeam } },
          { favorite_team: { name: matchData.awayTeam } }
        ],
        relations: ['favorite_team']
      });

      if (users.length === 0) {
        this.logger.log('Nenhum usuário encontrado para notificação da partida');
        return [];
      }

      // Criar mensagem personalizada
      let message = '';
      if (matchData.status === 'live') {
        message = `🔴 AO VIVO: ${matchData.homeTeam} ${matchData.score || 'vs'} ${matchData.awayTeam}\n📺 ${matchData.competition}`;
      } else if (matchData.status === 'finished') {
        message = `⚽ FINAL: ${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam}\n🏆 ${matchData.competition}`;
      } else {
        message = `📅 PRÓXIMO JOGO: ${matchData.homeTeam} vs ${matchData.awayTeam}\n🏆 ${matchData.competition}`;
      }

      // Enviar notificações
      const messages: WhatsAppMessage[] = users.map(user => ({
        to: user.phone_number,
        message: message
      }));

      return await this.sendBulkMessages(messages);

    } catch (error) {
      this.logger.error('Erro ao enviar notificação de partida:', error);
      return [];
    }
  }

  // Métodos para analytics e dashboard
  async getEngagementAnalytics(period: string, team?: string): Promise<{
    totalMessages: number;
    activeUsers: number;
    responseRate: number;
    averageResponseTime: string;
    dailyStats: Array<{ date: string; messages: number; users: number }>;
  }> {
    try {
      const conversations = await this.getConversations();
      let filteredConversations = conversations;

      // Filtrar por time se especificado
      if (team) {
        const teamKeywords = this.getTeamKeywords(team);
        filteredConversations = conversations.filter(conv => {
          const message = conv.lastMessage.toLowerCase();
          return teamKeywords.some(keyword => message.includes(keyword));
        });
      }

      // Calcular estatísticas baseadas no período
      const now = new Date();
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 1;
      const dailyStats: Array<{ date: string; messages: number; users: number }> = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simular dados para demonstração
        dailyStats.push({
          date: dateStr,
          messages: Math.floor(Math.random() * 50) + 10,
          users: Math.floor(Math.random() * 20) + 5
        });
      }

      return {
        totalMessages: filteredConversations.length * 3, // Média de 3 mensagens por conversa
        activeUsers: filteredConversations.filter(c => c.status === 'active').length,
        responseRate: 85.5, // Placeholder
        averageResponseTime: '2.3 min',
        dailyStats
      };

    } catch (error) {
      this.logger.error('Erro ao calcular analytics de engajamento:', error);
      return {
        totalMessages: 0,
        activeUsers: 0,
        responseRate: 0,
        averageResponseTime: 'N/A',
        dailyStats: []
      };
    }
  }

  async getTeamAnalytics(): Promise<Array<{
    team: string;
    conversations: number;
    engagement: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    topKeywords: string[];
  }>> {
    try {
      const teams = ['flamengo', 'vasco', 'botafogo', 'fluminense', 'palmeiras', 'corinthians'];
      const analytics: Array<{
        team: string;
        conversations: number;
        engagement: number;
        sentiment: 'positive' | 'neutral' | 'negative';
        topKeywords: string[];
      }> = [];

      for (const team of teams) {
        const teamConversations = await this.getConversations(undefined, { team });
        
        analytics.push({
          team: team.charAt(0).toUpperCase() + team.slice(1),
          conversations: teamConversations.length,
          engagement: Math.floor(Math.random() * 40) + 60, // 60-100%
          sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
          topKeywords: this.getTeamKeywords(team).slice(0, 3)
        });
      }

      return analytics.sort((a, b) => b.conversations - a.conversations);

    } catch (error) {
      this.logger.error('Erro ao calcular analytics de times:', error);
      return [];
    }
  }

  async getCompetitionAnalytics(): Promise<Array<{
    competition: string;
    mentions: number;
    engagement: number;
    peakHours: string[];
  }>> {
    try {
      const competitions = ['brasileirao', 'copa-brasil', 'libertadores', 'carioca'];
      const analytics: Array<{
        competition: string;
        mentions: number;
        engagement: number;
        peakHours: string[];
      }> = [];

      for (const comp of competitions) {
        const compConversations = await this.getConversations(undefined, { competition: comp });
        
        analytics.push({
          competition: comp.charAt(0).toUpperCase() + comp.slice(1).replace('-', ' '),
          mentions: compConversations.length,
          engagement: Math.floor(Math.random() * 30) + 70, // 70-100%
          peakHours: ['18:00', '19:00', '20:00', '21:00'] // Horários de pico típicos
        });
      }

      return analytics.sort((a, b) => b.mentions - a.mentions);

    } catch (error) {
      this.logger.error('Erro ao calcular analytics de competições:', error);
      return [];
    }
  }

  async getFilterOptions(): Promise<{
    teams: Array<{ value: string; label: string }>;
    competitions: Array<{ value: string; label: string }>;
    periods: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
  }> {
    return {
      teams: [
        { value: 'flamengo', label: 'Flamengo' },
        { value: 'vasco', label: 'Vasco' },
        { value: 'botafogo', label: 'Botafogo' },
        { value: 'fluminense', label: 'Fluminense' },
        { value: 'palmeiras', label: 'Palmeiras' },
        { value: 'corinthians', label: 'Corinthians' },
        { value: 'sao-paulo', label: 'São Paulo' },
        { value: 'santos', label: 'Santos' },
        { value: 'gremio', label: 'Grêmio' },
        { value: 'internacional', label: 'Internacional' }
      ],
      competitions: [
        { value: 'brasileirao', label: 'Brasileirão' },
        { value: 'copa-brasil', label: 'Copa do Brasil' },
        { value: 'libertadores', label: 'Libertadores' },
        { value: 'sul-americana', label: 'Sul-Americana' },
        { value: 'carioca', label: 'Campeonato Carioca' },
        { value: 'paulista', label: 'Campeonato Paulista' }
      ],
      periods: [
        { value: 'today', label: 'Hoje' },
        { value: 'week', label: 'Última Semana' },
        { value: 'month', label: 'Último Mês' },
        { value: 'all', label: 'Todos os Períodos' }
      ],
      statuses: [
        { value: 'all', label: 'Todos os Status' },
        { value: 'active', label: 'Ativas' },
        { value: 'waiting', label: 'Aguardando' },
        { value: 'closed', label: 'Fechadas' }
      ]
    };
  }
}