import { Controller, Post, Get, Body, Headers, Req, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    try {
      console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2));
      
      // Verificar se é uma mensagem de texto
      if (body.data && body.data.message && body.data.message.messageType === 'textMessage') {
        const phoneNumber = body.data.key.remoteJid.replace('@s.whatsapp.net', '');
        const message = body.data.message.textMessage.text;
        const pushName = body.data.pushName;

        console.log(`📱 Processando mensagem de ${phoneNumber}: "${message}"`);
        
        const response = await this.chatbotService.processMessage(phoneNumber, message, pushName);
        
        // Enviar resposta
        await this.chatbotService.sendMessage(phoneNumber, response);
        
        return { success: true, message: 'Mensagem processada com sucesso' };
      }
      
      return { success: true, message: 'Webhook processado' };
    } catch (error) {
      console.error('Erro no webhook:', error);
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