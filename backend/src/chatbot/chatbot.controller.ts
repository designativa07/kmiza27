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

      // Log detalhado da estrutura recebida
      console.log('🔍 Analisando estrutura do webhook:');
      console.log('- body.data:', !!body.data);
      console.log('- body.data.message:', !!body.data?.message);
      console.log('- body.data.key:', !!body.data?.key);
      console.log('- body.event:', body.event);
      console.log('- body.data.message keys:', body.data?.message ? Object.keys(body.data.message) : 'N/A');

      // Buscar recursivamente por campos conhecidos em TODA a estrutura
      const findInObject = (obj: any, path = ''): void => {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Procurar por telefone
          if (key === 'remoteJid' && typeof value === 'string' && value.includes('@s.whatsapp.net')) {
            phoneNumber = value.replace('@s.whatsapp.net', '');
            console.log(`📞 Telefone encontrado em: ${currentPath} = ${phoneNumber}`);
          }
          
          // Procurar por texto da mensagem (múltiplas possibilidades)
          if ((key === 'conversation' || key === 'text' || key === 'body') && typeof value === 'string' && value.trim()) {
            messageText = value.trim();
            console.log(`💬 Texto encontrado em: ${currentPath} = "${messageText}"`);
          }
          
          // Procurar por nome
          if (key === 'pushName' && typeof value === 'string') {
            pushName = value;
            console.log(`👤 Nome encontrado em: ${currentPath} = ${pushName}`);
          }
          
          // Buscar recursivamente
          if (typeof value === 'object') {
            findInObject(value, currentPath);
          }
        }
      };
      
      // Executar busca recursiva
      findInObject(body);

      console.log(`📊 Resultado da análise:`);
      console.log(`- Telefone: ${phoneNumber || 'NÃO ENCONTRADO'}`);
      console.log(`- Mensagem: ${messageText || 'NÃO ENCONTRADA'}`);
      console.log(`- Nome: ${pushName || 'NÃO ENCONTRADO'}`);

      // Se não encontrou dados, tentar extrair de forma mais agressiva
      if (!phoneNumber || !messageText) {
        console.log('🔍 Tentativa de extração agressiva...');
        
        // Procurar qualquer string que pareça com telefone
        const phoneRegex = /(\d{10,15})@s\.whatsapp\.net/;
        const textRegex = /"(conversation|text|body)"\s*:\s*"([^"]+)"/;
        
        const bodyStr = JSON.stringify(body);
        
        const phoneMatch = bodyStr.match(phoneRegex);
        if (phoneMatch) {
          phoneNumber = phoneMatch[1];
          console.log(`📞 Telefone extraído por regex: ${phoneNumber}`);
        }
        
        const textMatch = bodyStr.match(textRegex);
        if (textMatch) {
          messageText = textMatch[2];
          console.log(`💬 Texto extraído por regex: "${messageText}"`);
        }
      }

      // FORÇAR processamento se tiver pelo menos um telefone válido
      if (phoneNumber && phoneNumber.length >= 10) {
        // Se não tem mensagem, usar uma mensagem padrão
        if (!messageText) {
          messageText = 'oi';
          console.log('💬 Usando mensagem padrão: "oi"');
        }
        
        console.log(`📱 PROCESSANDO MENSAGEM de ${phoneNumber}: "${messageText}"`);
        console.log(`👤 Nome: ${pushName || 'Não informado'}`);
        
        try {
          const response = await this.chatbotService.processMessage(phoneNumber, messageText, pushName || undefined);
          
          console.log(`🤖 Resposta gerada: "${response.substring(0, 100)}..."`);
          
          // Enviar resposta
          const sent = await this.chatbotService.sendMessage(phoneNumber, response);
          console.log(`📤 Mensagem enviada: ${sent ? 'Sucesso' : 'Falha'}`);
          
          return { success: true, message: 'Mensagem processada com sucesso', processed: true };
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          return { success: true, message: 'Erro no processamento', error: error.message };
        }
      } else {
        console.log('⚠️ Não foi possível extrair telefone válido do webhook');
        console.log('📋 Estrutura completa do body:', JSON.stringify(body, null, 2));
        return { success: true, message: 'Webhook recebido mas sem dados válidos', processed: false };
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

  @Get('debug/teams')
  async debugTeams() {
    return await this.chatbotService.debugTeams();
  }

  @Get('debug/matches-today')
  async debugMatchesToday() {
    return await this.chatbotService.debugMatchesToday();
  }
} 