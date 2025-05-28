import { Controller, Post, Get, Body, Headers, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  async webhook(@Body() body: any, @Headers() headers: any, @Req() req: any) {
    try {
      // ✅ CORREÇÃO UTF-8: Log detalhado para debug de caracteres especiais
      console.log('📥 Webhook Headers:', {
        'content-type': headers['content-type'],
        'content-length': headers['content-length'],
        'charset': headers['content-type']?.includes('charset') ? 'presente' : 'ausente'
      });
      
      // ✅ Validar se body foi parseado corretamente
      if (!body || typeof body !== 'object') {
        console.log('❌ Body inválido ou não parseado:', body);
        return { error: 'Invalid JSON body', received: body };
      }
      
      console.log('📥 Webhook recebido:', JSON.stringify(body, null, 2));
      
      // Processar diferentes tipos de eventos
      if (body.event === "connection.update") {
        console.log('🔗 Status da conexão:', body.data);
        return { success: true, event: 'connection.update', processed: true };
      }
      
      if (body.event === "contacts.set") {
        console.log('📱 Contatos sincronizados:', body.data?.length || 0);
        return { success: true, event: 'contacts.set', processed: true };
      }
      
      if (body.event === "presence.update") {
        console.log('👤 Status de presença:', body.data);
        return { success: true, event: 'presence.update', processed: true };
      }
      
      if (body.event === "chats.set") {
        console.log('💬 Conversas sincronizadas:', body.data?.length || 0);
        return { success: true, event: 'chats.set', processed: true };
      }
      
      if (body.event === "chats.update") {
        console.log('🔄 Conversa atualizada:', body.data);
        return { success: true, event: 'chats.update', processed: true };
      }
      
      if (body.event === "chats.delete") {
        console.log('🗑️ Conversa deletada:', body.data);
        // TODO: Implementar lógica para remover conversa do cache/banco
        return { success: true, event: 'chats.delete', processed: true };
      }
      
      let phoneNumber: string = '';
      let messageText: string = '';
      let isFromMe: boolean = false;
      
      // Formato 1: Evolution API real (messages.upsert, messages.set, messages.update)
      if ((body.event === "messages.upsert" || body.event === "messages.set" || body.event === "messages.update") && body.data && body.data.key && body.data.message) {
        if (body.data.message.conversation) {
          phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
          messageText = body.data.message.conversation;
          isFromMe = body.data.key.fromMe === true;
          const pushName = body.data.pushName || null;
          
          console.log(`📱 Formato Evolution API Real - Mensagem de ${phoneNumber} (${pushName}): "${messageText}" (fromMe: ${isFromMe})`);
          
          // ⚠️ IMPORTANTE: Não responder às próprias mensagens para evitar loops
          if (isFromMe) {
            console.log('🤖 Ignorando mensagem própria (fromMe: true) para evitar loop');
            return { success: true, ignored: true, reason: 'own_message' };
          }
          
          // Processar mensagem com pushName
          const response = await this.chatbotService.processMessage(phoneNumber, messageText, pushName);
          
          // Enviar resposta via WhatsApp
          console.log(`📤 Enviando resposta: "${response}"`);
          await this.chatbotService.sendMessage(phoneNumber, response);
          
          return { success: true, response, phoneNumber, messageText, pushName };
        }
      }
      
      // Formato 1b: Evolution API com data.messages (formato antigo)
      else if (body.data && body.data.messages && body.data.messages.length > 0) {
        const message = body.data.messages[0];
        if (message && message.message && message.message.conversation) {
          phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
          messageText = message.message.conversation;
          isFromMe = message.key.fromMe === true;
          
          console.log(`📱 Formato Evolution API - Mensagem de ${phoneNumber}: "${messageText}" (fromMe: ${isFromMe})`);
          
          // ⚠️ IMPORTANTE: Não responder às próprias mensagens para evitar loops
          if (isFromMe) {
            console.log('🤖 Ignorando mensagem própria (fromMe: true) para evitar loop');
            return { success: true, ignored: true, reason: 'own_message' };
          }
        }
      }
      
      // Formato 2: Evolution API direto
      else if (body.key && body.message) {
        if (body.message.conversation) {
          phoneNumber = body.key.remoteJid.replace('@s.whatsapp.net', '');
          messageText = body.message.conversation;
          isFromMe = body.key.fromMe === true;
          
          console.log(`📱 Formato Evolution API direto - Mensagem de ${phoneNumber}: "${messageText}" (fromMe: ${isFromMe})`);
          
          // ⚠️ IMPORTANTE: Não responder às próprias mensagens para evitar loops
          if (isFromMe) {
            console.log('🤖 Ignorando mensagem própria (fromMe: true) para evitar loop');
            return { success: true, ignored: true, reason: 'own_message' };
          }
        }
      }
      
      // Formato 3: Simples para testes
      else if (body.phoneNumber && body.message) {
        phoneNumber = body.phoneNumber;
        messageText = body.message;
        isFromMe = body.fromMe === true;
        
        console.log(`📱 Formato simples - Mensagem de ${phoneNumber}: "${messageText}" (fromMe: ${isFromMe})`);
        
        // ⚠️ IMPORTANTE: Não responder às próprias mensagens para evitar loops
        if (isFromMe) {
          console.log('🤖 Ignorando mensagem própria (fromMe: true) para evitar loop');
          return { success: true, ignored: true, reason: 'own_message' };
        }
      }
      
      // Formato 4: Outros formatos possíveis da Evolution API
      else if (body.messages && body.messages.length > 0) {
        const message = body.messages[0];
        if (message && message.message && message.message.conversation) {
          phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
          messageText = message.message.conversation;
          isFromMe = message.key.fromMe === true;
          
          console.log(`📱 Formato alternativo - Mensagem de ${phoneNumber}: "${messageText}" (fromMe: ${isFromMe})`);
          
          // ⚠️ IMPORTANTE: Não responder às próprias mensagens para evitar loops
          if (isFromMe) {
            console.log('🤖 Ignorando mensagem própria (fromMe: true) para evitar loop');
            return { success: true, ignored: true, reason: 'own_message' };
          }
        }
      }
      
      // Se não conseguiu extrair dados, retornar erro detalhado
      if (!phoneNumber || !messageText) {
        console.log('❌ Não foi possível extrair phoneNumber e message do payload');
        console.log('📋 Estrutura recebida:', Object.keys(body));
        return { 
          error: 'phoneNumber and message are required',
          received_structure: Object.keys(body),
          body_sample: body
        };
      }

      console.log(`🔄 Processando mensagem de ${phoneNumber}: "${messageText}"`);
      const response = await this.chatbotService.processMessage(phoneNumber, messageText);
      
      // Enviar resposta via WhatsApp
      console.log(`📤 Enviando resposta: "${response}"`);
      await this.chatbotService.sendMessage(phoneNumber, response);
      
      return { success: true, response, phoneNumber, messageText };
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      return { error: 'Internal server error', details: error.message };
    }
  }

  @Get('status')
  async getStatus() {
    return await this.chatbotService.getStatus();
  }

  @Post('test-message')
  async testMessage(@Body() body: { phoneNumber: string; message: string }) {
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