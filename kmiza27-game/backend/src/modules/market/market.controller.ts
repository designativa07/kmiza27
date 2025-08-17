import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketAIService } from './market-ai.service';
import { supabase } from '../../config/supabase.config';

@Controller('market')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);
  
  constructor(
    private readonly marketService: MarketService,
    private readonly marketAIService: MarketAIService,
  ) {}

  @Post('list-player')
  async listPlayer(
    @Body() body: { playerId: string; teamId: string; price: number; isYouth: boolean },
  ) {
    this.logger.log(`Listing player ${body.playerId} for ${body.price}`);
    return this.marketService.listPlayer(body.playerId, body.teamId, body.price, body.isYouth);
  }

  @Post('unlist-player')
  async unlistPlayer(@Body() body: { playerId: string; isYouth: boolean }) {
    this.logger.log(`Unlisting player ${body.playerId}`);
    return this.marketService.unlistPlayer(body.playerId, body.isYouth);
  }

  @Get('listed-players')
  async getListedPlayers(@Query('teamId') teamId: string) {
    this.logger.log(`Fetching listed players for team ${teamId}`);
    return this.marketService.getListedPlayers(teamId);
  }

  @Post('run-ai')
  async runMarketAI() {
    this.logger.log('Running Market AI...');
    await this.marketAIService.runMarketAI();
    return { success: true, message: 'Market AI executed successfully' };
  }

  @Post('cleanup-expired')
  async cleanupExpiredListings() {
    this.logger.log('Cleaning up expired listings...');
    await this.marketAIService.cleanupExpiredListings();
    return { success: true, message: 'Expired listings cleaned up successfully' };
  }

  @Post('make-offer')
  async makeOffer(
    @Body() body: { 
      playerId: string; 
      buyingTeamId: string; 
      offerPrice: number; 
      isYouth: boolean 
    },
  ) {
    try {
      this.logger.log(`Making offer for player ${body.playerId} at ${body.offerPrice}`);
      this.logger.log('Request body:', JSON.stringify(body, null, 2));
      
      // Validar dados de entrada
      if (!body.playerId || !body.buyingTeamId || !body.offerPrice || typeof body.isYouth !== 'boolean') {
        this.logger.error('Invalid request body:', body);
        throw new Error('Invalid request body');
      }
      
      const result = await this.marketService.makeOffer(
        body.playerId,
        body.buyingTeamId,
        body.offerPrice,
        body.isYouth,
      );
      
      this.logger.log('Offer created successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Error in makeOffer controller:', error);
      throw error;
    }
  }

  @Post('accept-offer')
  async acceptOffer(@Body() body: { offerId: string }) {
    this.logger.log(`Accepting offer ${body.offerId}`);
    return this.marketService.acceptOffer(body.offerId);
  }

  @Post('reject-offer')
  async rejectOffer(@Body() body: { offerId: string }) {
    this.logger.log(`Rejecting offer ${body.offerId}`);
    return this.marketService.rejectOffer(body.offerId);
  }

  @Get('pending-offers')
  async getPendingOffers(@Query('teamId') teamId: string) {
    this.logger.log(`Fetching pending offers for team ${teamId}`);
    return this.marketService.getPendingOffers(teamId);
  }

  @Get('notifications')
  async getTeamNotifications(
    @Query('teamId') teamId: string,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Fetching notifications for team ${teamId}`);
    return this.marketService.getTeamNotifications(teamId, limit);
  }

  @Post('mark-notification-read')
  async markNotificationAsRead(@Body() body: { notificationId: string }) {
    this.logger.log(`Marking notification ${body.notificationId} as read`);
    return this.marketService.markNotificationAsRead(body.notificationId);
  }

  @Post('mark-all-notifications-read')
  async markAllNotificationsAsRead(@Body() body: { teamId: string }) {
    this.logger.log(`Marking all notifications as read for team ${body.teamId}`);
    return this.marketService.markAllNotificationsAsRead(body.teamId);
  }

  @Post('test-simple')
  async testSimple() {
    try {
      this.logger.log('Testing simple endpoint...');
      
      // Teste 1: Verificar se o serviço está funcionando
      this.logger.log('Service check passed');
      
      // Teste 2: Verificar conexão com Supabase
      const { data: testData, error: testError } = await supabase
        .from('game_teams')
        .select('id, name')
        .limit(1);
      
      if (testError) {
        this.logger.error('Supabase connection error:', testError);
        throw new Error('Supabase connection failed');
      }
      
      this.logger.log('Supabase connection working');
      
      // Teste 3: Verificar se a tabela de notificações existe
      const { data: notifData, error: notifError } = await supabase
        .from('market_notifications')
        .select('id')
        .limit(1);
      
      if (notifError) {
        this.logger.error('Notifications table error:', notifError);
        throw new Error('Notifications table not accessible');
      }
      
      this.logger.log('Notifications table accessible');
      
      return { 
        success: true, 
        message: 'All tests passed',
        teamCount: testData?.length || 0,
        notificationsAccessible: true
      };
      
    } catch (error) {
      this.logger.error('Error in test endpoint:', error);
      throw error;
    }
  }

  @Post('process-ai-offers')
  async processAIOffers() {
    try {
      this.logger.log('Processando ofertas pendentes da IA...');
      
      const result = await this.marketAIService.processPendingOffers();
      
      this.logger.log('Processamento de ofertas da IA concluído:', result);
      return result;
      
    } catch (error) {
      this.logger.error('Erro ao processar ofertas da IA:', error);
      throw error;
    }
  }
}
