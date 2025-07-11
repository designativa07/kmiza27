import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { AutomationService } from './automation.service';
import { NotificationService } from './notification.service';
import { ChatbotService } from '../../chatbot/chatbot.service';
import { evolutionConfig } from '../../config/evolution.config';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly automationService: AutomationService,
    private readonly notificationService: NotificationService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Get('conversations')
  async getConversations(
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Query('team') team?: string,
    @Query('competition') competition?: string
  ) {
    return this.whatsAppService.getConversations(status, { period, team, competition });
  }

  @Post('conversations/refresh')
  async refreshConversations(
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Query('team') team?: string,
    @Query('competition') competition?: string
  ) {
    // Forçar busca nova sem cache
    return this.whatsAppService.getConversations(status, { period, team, competition });
  }

  @Get('conversations/:id/messages')
  async getConversationMessages(@Param('id') conversationId: string) {
    return this.whatsAppService.getConversationMessages(conversationId);
  }

  @Post('conversations/:id/send')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { message: string }
  ) {
    return this.whatsAppService.sendMessageToConversation(conversationId, body.message);
  }

  @Get('status')
  async getStatus() {
    return this.whatsAppService.getWhatsAppStatus();
  }

  @Get('test-connection')
  async testConnection() {
    return this.whatsAppService.testConnection();
  }

  @Post('send')
  async sendDirectMessage(@Body() body: { to: string; message: string; title?: string }) {
    return this.whatsAppService.sendMessage(body);
  }

  // Novos endpoints específicos para futebol
  @Get('conversations/football')
  async getFootballConversations() {
    return this.whatsAppService.getFootballRelatedConversations();
  }

  @Get('conversations/team/:teamSlug')
  async getConversationsByTeam(@Param('teamSlug') teamSlug: string) {
    return this.whatsAppService.getConversationsByFavoriteTeam(teamSlug);
  }

  @Get('stats')
  async getConversationStats() {
    return this.whatsAppService.getConversationStats();
  }

  @Post('notifications/match')
  async sendMatchNotification(@Body() matchData: {
    homeTeam: string;
    awayTeam: string;
    score?: string;
    status: string;
    competition: string;
  }) {
    return this.whatsAppService.sendMatchNotification(matchData);
  }

  @Post('bulk-send')
  async sendBulkMessages(@Body() body: { 
    messages: Array<{ to: string; message: string; title?: string }> 
  }) {
    return this.whatsAppService.sendBulkMessages(body.messages);
  }

  // Novos endpoints para analytics e filtros
  @Get('analytics/engagement')
  async getEngagementAnalytics(
    @Query('period') period: string = 'week',
    @Query('team') team?: string
  ) {
    return this.whatsAppService.getEngagementAnalytics(period, team);
  }

  @Get('analytics/teams')
  async getTeamAnalytics() {
    return this.whatsAppService.getTeamAnalytics();
  }

  @Get('analytics/competitions')
  async getCompetitionAnalytics() {
    return this.whatsAppService.getCompetitionAnalytics();
  }

  @Get('filters/options')
  async getFilterOptions() {
    return this.whatsAppService.getFilterOptions();
  }

  // Endpoints de Automação Avançada
  @Post('automation/process-message')
  async processMessage(@Body() body: {
    phone: string;
    message: string;
    userName?: string;
  }) {
    // Usar ChatbotService com OpenAI em vez do AutomationService básico
    const response = await this.chatbotService.processMessage(
      body.phone,
      body.message,
      body.userName
    );
    
    // Enviar resposta automaticamente
    if (response) {
      await this.whatsAppService.sendMessage({
        to: body.phone,
        message: response,
        title: '🤖 Kmiza27 Bot'
      });
    }
    
    return { success: true, response };
  }

  @Post('test/simulate-received-message')
  async simulateReceivedMessage(@Body() body: {
    phone: string;
    message: string;
    userName?: string;
  }) {
    console.log('🧪 Simulando mensagem recebida:', body);
    
    // Simular webhook da Evolution API
    const webhookPayload = {
      event: "messages.upsert",
      instance: "Kmiza27",
      data: {
        key: {
          remoteJid: `${body.phone}@s.whatsapp.net`,
          fromMe: false,
          id: `test_${Date.now()}`
        },
        pushName: body.userName || body.phone,
        message: {
          conversation: body.message
        },
        messageTimestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    // Processar via chatbot
    const response = await this.chatbotService.processMessage(
      body.phone,
      body.message,
      body.userName
    );
    
    console.log('🤖 Resposta gerada:', response);
    
    return { 
      success: true, 
      simulatedMessage: webhookPayload,
      botResponse: response 
    };
  }

  @Post('automation/test-intent')
  async testIntent(@Body() body: { message: string }) {
    const context = {
      phone: '+5521999999999',
      message: body.message,
      timestamp: new Date(),
      isFromUser: true
    };
    return this.automationService.processMessage(context);
  }

  // Endpoints de Notificações Inteligentes
  @Post('notifications/goal')
  async simulateGoal(@Body() body: {
    matchId: string;
    player: string;
    team: string;
    minute: number;
  }) {
    return this.notificationService.simulateGoal(
      body.matchId,
      body.player,
      body.team,
      body.minute
    );
  }

  @Post('notifications/match-start')
  async notifyMatchStart(@Body() body: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
  }) {
    return this.notificationService.notifyMatchStart(
      body.homeTeam,
      body.awayTeam,
      body.competition
    );
  }

  @Post('notifications/match-end')
  async notifyMatchEnd(@Body() body: {
    homeTeam: string;
    awayTeam: string;
    score: string;
    competition: string;
  }) {
    return this.notificationService.notifyMatchEnd(
      body.homeTeam,
      body.awayTeam,
      body.score,
      body.competition
    );
  }

  @Post('notifications/reminder')
  async sendMatchReminder(@Body() body: {
    homeTeam: string;
    awayTeam: string;
    timeUntil: string;
    competition: string;
  }) {
    return this.notificationService.sendMatchReminder(
      body.homeTeam,
      body.awayTeam,
      body.timeUntil,
      body.competition
    );
  }

  @Post('notifications/custom')
  async sendCustomNotification(@Body() body: {
    teamName: string;
    title: string;
    message: string;
  }) {
    return this.notificationService.sendCustomNotification(
      body.teamName,
      body.title,
      body.message
    );
  }

  @Post('cache/clear')
  async clearEvolutionCache() {
    try {
      console.log('🧹 Iniciando limpeza do cache da Evolution API...');
      
      const https = require('https');
      const apiUrl = new URL(evolutionConfig.apiUrl);
      const hostname = apiUrl.hostname;
      const port = apiUrl.port ? parseInt(apiUrl.port) : (apiUrl.protocol === 'https:' ? 443 : 80);
      const apikey = evolutionConfig.apiKey;
      const instance = evolutionConfig.instanceName;
      
      const results: Array<{ method: string; status: number; data?: any; error?: string }> = [];
      
      // Método 1: Tentar restart (PUT /instance/restart/{instance})
      console.log('1️⃣ Tentando restart da instância...');
      try {
        const restartResult = await new Promise<{ status: number; data: any; raw: string }>((resolve) => {
          const req = https.request({
            hostname,
            port,
            path: `/instance/restart/${instance}`,
            method: 'PUT',
            headers: {
              'apikey': apikey,
              'Content-Type': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
              } catch {
                resolve({ status: res.statusCode, data: null, raw: data });
              }
            });
          });
          req.on('error', () => resolve({ status: 500, data: null, raw: 'Connection Error' }));
          req.end();
        });
        
        results.push({ 
          method: 'restart', 
          status: restartResult.status, 
          data: restartResult.data,
          error: restartResult.status >= 400 ? restartResult.raw : undefined
        });
        
        if (restartResult.status >= 200 && restartResult.status < 300) {
          console.log('✅ Restart bem-sucedido!');
          return {
            success: true,
            message: 'Cache limpo com sucesso via restart da instância',
            details: results,
            method: 'restart'
          };
        }
      } catch (error) {
        results.push({ method: 'restart', status: 500, error: error.message });
      }
      
      // Método 2: Logout + Connect (se restart falhou)
      console.log('2️⃣ Tentando logout + connect...');
      try {
        // Logout
        const logoutResult = await new Promise<{ status: number; data: any }>((resolve) => {
          const req = https.request({
            hostname,
            port,
            path: `/instance/logout/${instance}`,
            method: 'DELETE',
            headers: {
              'apikey': apikey,
              'Content-Type': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, data: data });
              }
            });
          });
          req.on('error', () => resolve({ status: 500, data: 'Error' }));
          req.end();
        });
        
        results.push({ method: 'logout', status: logoutResult.status, data: logoutResult.data });
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Connect
        const connectResult = await new Promise<{ status: number; data: any }>((resolve) => {
          const req = https.request({
            hostname,
            port,
            path: `/instance/connect/${instance}`,
            method: 'GET',
            headers: {
              'apikey': apikey,
              'Content-Type': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, data: data });
              }
            });
          });
          req.on('error', () => resolve({ status: 500, data: 'Error' }));
          req.end();
        });
        
        results.push({ method: 'connect', status: connectResult.status, data: connectResult.data });
        
        if (logoutResult.status < 400 || connectResult.status < 400) {
          console.log('✅ Logout + Connect executado!');
          return {
            success: true,
            message: 'Cache limpo via logout + connect',
            details: results,
            method: 'logout-connect'
          };
        }
      } catch (error) {
        results.push({ method: 'logout-connect', status: 500, error: error.message });
      }
      
      // Se chegou aqui, nenhum método funcionou completamente
      console.log('⚠️ Métodos automáticos falharam, retornando instruções manuais');
      
      return {
        success: false,
        message: 'Métodos automáticos falharam. Use a limpeza manual.',
        details: results,
        instructions: [
          '1. Acesse a interface da Evolution API',
          '2. Clique no botão "RESTART" ou "DISCONNECT"',
          '3. Aguarde alguns segundos',
          '4. Se necessário, clique em "CONNECT"',
          '5. Atualize as conversas no dashboard'
        ]
      };
      
    } catch (error) {
      console.error('❌ Erro crítico ao limpar cache:', error);
      
      return {
        success: false,
        message: 'Erro crítico ao limpar cache',
        error: error.message
      };
    }
  }

  @Post('cache/clear-simple')
  async clearEvolutionCacheSimple() {
    try {
      console.log('🧹 Limpeza simples do cache - Método alternativo...');
      
      return {
        success: true,
        message: 'Para limpar o cache da Evolution API, use um dos métodos abaixo:',
        methods: [
          '1. Na interface da Evolution API, clique em "RESTART"',
          '2. Ou clique em "DISCONNECT" → aguarde → "CONNECT"',
          `3. Ou execute: curl -X PUT ${evolutionConfig.apiUrl}/instance/restart/${evolutionConfig.instanceName} -H "apikey: ${evolutionConfig.apiKey}"`
        ],
        instructions: 'Após limpar o cache, aguarde alguns segundos e atualize as conversas.'
      };
    } catch (error) {
      console.error('❌ Erro:', error);
      return {
        success: false,
        message: 'Erro interno',
        error: error.message
      };
    }
  }

  @Post('cache/force-clear')
  async forceClearEvolutionCache() {
    try {
      console.log('🧹 Forçando limpeza completa do cache...');
      
      const https = require('https');
      const apiUrl = new URL(evolutionConfig.apiUrl);
      const hostname = apiUrl.hostname;
      const port = apiUrl.port ? parseInt(apiUrl.port) : (apiUrl.protocol === 'https:' ? 443 : 80);
      const apikey = evolutionConfig.apiKey;
      const instance = evolutionConfig.instanceName;
      
      const results: Array<{ step: string; status: number; data?: any; error?: any }> = [];
      
      // 1. Logout da instância
      console.log('1️⃣ Fazendo logout da instância...');
      try {
        const logoutResult = await new Promise<{ status: number; data: any }>((resolve) => {
          const req = https.request({
            hostname,
            port,
            path: `/instance/logout/${instance}`,
            method: 'DELETE',
            headers: {
              'apikey': apikey,
              'Content-Type': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, data: data });
              }
            });
          });
          req.on('error', () => resolve({ status: 500, data: 'Error' }));
          req.end();
        });
        results.push({ step: 'logout', status: logoutResult.status, data: logoutResult.data });
      } catch (error) {
        results.push({ step: 'logout', status: 500, error: error.message });
      }
      
      // 2. Aguardar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Conectar novamente
      console.log('2️⃣ Reconectando instância...');
      try {
        const connectResult = await new Promise<{ status: number; data: any }>((resolve) => {
          const req = https.request({
            hostname,
            port,
            path: `/instance/connect/${instance}`,
            method: 'GET',
            headers: {
              'apikey': apikey,
              'Content-Type': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, data: data });
              }
            });
          });
          req.on('error', () => resolve({ status: 500, data: 'Error' }));
          req.end();
        });
        results.push({ step: 'connect', status: connectResult.status, data: connectResult.data });
      } catch (error) {
        results.push({ step: 'connect', status: 500, error: error.message });
      }
      
      // Verificar se pelo menos um passo teve sucesso
      const success = results.some(r => r.status >= 200 && r.status < 400);
      
      return {
        success,
        message: success ? 'Força de limpeza completada com sucesso' : 'Força de limpeza parcial - verifique os detalhes',
        details: results
      };
    } catch (error) {
      console.error('❌ Erro crítico na força de limpeza:', error);
      return {
        success: false,
        message: 'Erro crítico na força de limpeza',
        error: error.message
      };
    }
  }
} 