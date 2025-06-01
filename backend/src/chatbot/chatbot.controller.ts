import { Controller, Post, Get, Body, Headers, Req, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    try {
      console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2));
      
      // Verificar se as respostas automáticas estão habilitadas
      const autoResponseEnabled = await this.chatbotService.isAutoResponseEnabled();
      if (!autoResponseEnabled) {
        console.log('⚠️ Respostas automáticas estão desabilitadas');
        return { success: true, message: 'Respostas automáticas desabilitadas' };
      }
      
      let phoneNumber: string | null = null;
      let messageText: string | null = null;
      let pushName: string | null = null;

      // Formato 1: Evolution API com messageType
      if (body.data && body.data.message && body.data.message.messageType === 'textMessage') {
        phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
        messageText = body.data.message.textMessage.text;
        pushName = body.data.pushName;
        console.log('✅ Formato 1 detectado: Evolution API com messageType');
      }
      // Formato 2: Evolution API com conversation
      else if (body.data && body.data.message && body.data.message.conversation) {
        phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
        messageText = body.data.message.conversation;
        pushName = body.data.pushName;
        console.log('✅ Formato 2 detectado: Evolution API com conversation');
      }
      // Formato 3: Evolution API com event
      else if (body.event === 'messages.upsert' && body.data && body.data.key && body.data.message) {
        phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
        if (body.data.message.conversation) {
          messageText = body.data.message.conversation;
        } else if (body.data.message.extendedTextMessage?.text) {
          messageText = body.data.message.extendedTextMessage.text;
        }
        pushName = body.data.pushName;
        console.log('✅ Formato 3 detectado: Evolution API com event');
      }
      // Formato 4: Formato direto
      else if (body.phoneNumber && body.message) {
        phoneNumber = body.phoneNumber;
        messageText = body.message;
        pushName = body.pushName;
        console.log('✅ Formato 4 detectado: Formato direto');
      }

      if (phoneNumber && messageText) {
        console.log(`📱 Processando mensagem de ${phoneNumber}: "${messageText}"`);
        console.log(`👤 Nome: ${pushName || 'Não informado'}`);
        
        const response = await this.chatbotService.processMessage(phoneNumber, messageText, pushName || undefined);
        
        console.log(`🤖 Resposta gerada: "${response.substring(0, 100)}..."`);
        
        // Enviar resposta
        const sent = await this.chatbotService.sendMessage(phoneNumber, response);
        console.log(`📤 Mensagem enviada: ${sent ? 'Sucesso' : 'Falha'}`);
        
        return { success: true, message: 'Mensagem processada com sucesso' };
      } else {
        console.log('⚠️ Formato de mensagem não reconhecido ou não é mensagem de texto');
        console.log('📋 Estrutura recebida:', {
          hasData: !!body.data,
          hasMessage: !!body.data?.message,
          messageKeys: body.data?.message ? Object.keys(body.data.message) : [],
          hasKey: !!body.data?.key,
          event: body.event
        });
        return { success: true, message: 'Webhook processado - formato não reconhecido' };
      }
      
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('status')
  async getStatus() {
    return await this.chatbotService.getStatus();
  }

  // ========== ENDPOINTS PARA DESENVOLVIMENTO E TESTES ==========

  @Post('test/message')
  async testSingleMessage(@Body() body: { message: string; phoneNumber?: string }) {
    return await this.chatbotService.testMessage(body.message, body.phoneNumber);
  }

  @Post('test/multiple')
  async testMultipleMessages(@Body() body: { messages: string[]; phoneNumber?: string }) {
    return await this.chatbotService.testMultipleMessages(body.messages, body.phoneNumber);
  }

  @Get('test/scenarios')
  async testScenarios() {
    return await this.chatbotService.testScenarios();
  }

  @Get('test/health')
  async healthCheck() {
    return await this.chatbotService.healthCheck();
  }

  @Get('test/quick')
  async quickTest(@Query('message') message: string) {
    if (!message) {
      return { error: 'Parâmetro message é obrigatório' };
    }
    return await this.chatbotService.testMessage(message);
  }

  @Get('debug/table')
  async debugTable() {
    return await this.chatbotService.debugCompetitionTable();
  }

  // ========== ENDPOINTS LEGADOS (COMPATIBILIDADE) ==========

  @Post('test-message')
  async legacyTestMessage(@Body() body: { phoneNumber: string; message: string }) {
    try {
      const { phoneNumber, message } = body;
      
      if (!phoneNumber || !message) {
        return { error: 'phoneNumber and message are required' };
      }

      const response = await this.chatbotService.processMessage(phoneNumber, message);
      
      return { success: true, response };
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { error: 'Internal server error' };
    }
  }

  @Post('simulate-whatsapp')
  async simulateWhatsApp(@Body() body: { phoneNumber: string; message: string }) {
    try {
      const { phoneNumber, message } = body;
      
      if (!phoneNumber || !message) {
        return { error: 'phoneNumber and message are required' };
      }

      console.log(`📱 Simulando mensagem do WhatsApp de ${phoneNumber}: "${message}"`);
      
      const response = await this.chatbotService.processMessage(phoneNumber, message);
      
      // Simular envio da resposta
      console.log(`🤖 Resposta que seria enviada: "${response}"`);
      
      return { 
        success: true, 
        simulation: true,
        received: { phoneNumber, message },
        response: response
      };
    } catch (error) {
      console.error('❌ Erro na simulação:', error);
      return { error: 'Internal server error' };
    }
  }
} 