import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

export interface MarketNotification {
  id?: string;
  team_id: string;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'player_sold' | 'player_bought';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at?: string;
}

@Injectable()
export class MarketNotificationsService {
  private readonly logger = new Logger(MarketNotificationsService.name);

  /**
   * Criar notificação de oferta recebida
   */
  async createOfferReceivedNotification(
    teamId: string,
    playerId: string,
    playerName: string,
    buyingTeamName: string,
    offerPrice: number,
  ) {
    try {
      const notification: MarketNotification = {
        team_id: teamId,
        type: 'offer_received',
        title: 'Nova Oferta Recebida',
        message: `${buyingTeamName} fez uma oferta de R$ ${offerPrice.toLocaleString()} por ${playerName}`,
        data: {
          player_id: playerId,
          player_name: playerName,
          buying_team_name: buyingTeamName,
          offer_price: offerPrice,
        },
        read: false,
      };

      const { error } = await supabase
        .from('market_notifications')
        .insert(notification);

      if (error) {
        this.logger.error('Failed to create offer received notification:', error);
      } else {
        this.logger.log(`Notification created for team ${teamId}: offer received`);
      }
    } catch (error) {
      this.logger.error('Error creating offer received notification:', error);
    }
  }

  /**
   * Criar notificação de oferta aceita
   */
  async createOfferAcceptedNotification(
    teamId: string,
    playerId: string,
    playerName: string,
    sellingTeamName: string,
    offerPrice: number,
  ) {
    try {
      const notification: MarketNotification = {
        team_id: teamId,
        type: 'offer_accepted',
        title: 'Oferta Aceita!',
        message: `${sellingTeamName} aceitou sua oferta de R$ ${offerPrice.toLocaleString()} por ${playerName}`,
        data: {
          player_id: playerId,
          player_name: playerName,
          selling_team_name: sellingTeamName,
          offer_price: offerPrice,
        },
        read: false,
      };

      const { error } = await supabase
        .from('market_notifications')
        .insert(notification);

      if (error) {
        this.logger.error('Failed to create offer accepted notification:', error);
      } else {
        this.logger.log(`Notification created for team ${teamId}: offer accepted`);
      }
    } catch (error) {
      this.logger.error('Error creating offer accepted notification:', error);
    }
  }

  /**
   * Criar notificação de oferta rejeitada
   */
  async createOfferRejectedNotification(
    teamId: string,
    playerId: string,
    playerName: string,
    sellingTeamName: string,
    offerPrice: number,
  ) {
    try {
      const notification: MarketNotification = {
        team_id: teamId,
        type: 'offer_rejected',
        title: 'Oferta Rejeitada',
        message: `${sellingTeamName} rejeitou sua oferta de R$ ${offerPrice.toLocaleString()} por ${playerName}`,
        data: {
          player_id: playerId,
          player_name: playerName,
          selling_team_name: sellingTeamName,
          offer_price: offerPrice,
        },
        read: false,
      };

      const { error } = await supabase
        .from('market_notifications')
        .insert(notification);

      if (error) {
        this.logger.error('Failed to create offer rejected notification:', error);
      } else {
        this.logger.log(`Notification created for team ${teamId}: offer rejected`);
      }
    } catch (error) {
      this.logger.error('Error creating offer rejected notification:', error);
    }
  }

  /**
   * Criar notificação de jogador vendido
   */
  async createPlayerSoldNotification(
    teamId: string,
    playerId: string,
    playerName: string,
    buyingTeamName: string,
    salePrice: number,
  ) {
    try {
      const notification: MarketNotification = {
        team_id: teamId,
        type: 'player_sold',
        title: 'Jogador Vendido!',
        message: `${playerName} foi vendido para ${buyingTeamName} por R$ ${salePrice.toLocaleString()}`,
        data: {
          player_id: playerId,
          player_name: playerName,
          buying_team_name: buyingTeamName,
          sale_price: salePrice,
        },
        read: false,
      };

      const { error } = await supabase
        .from('market_notifications')
        .insert(notification);

      if (error) {
        this.logger.error('Failed to create player sold notification:', error);
      } else {
        this.logger.log(`Notification created for team ${teamId}: player sold`);
      }
    } catch (error) {
      this.logger.error('Error creating player sold notification:', error);
    }
  }

  /**
   * Criar notificação de jogador comprado
   */
  async createPlayerBoughtNotification(
    teamId: string,
    playerId: string,
    playerName: string,
    sellingTeamName: string,
    purchasePrice: number,
  ) {
    try {
      const notification: MarketNotification = {
        team_id: teamId,
        type: 'player_bought',
        title: 'Jogador Comprado!',
        message: `${playerName} foi comprado de ${sellingTeamName} por R$ ${purchasePrice.toLocaleString()}`,
        data: {
          player_id: playerId,
          player_name: playerName,
          selling_team_name: sellingTeamName,
          purchase_price: purchasePrice,
        },
        read: false,
      };

      const { error } = await supabase
        .from('market_notifications')
        .insert(notification);

      if (error) {
        this.logger.error('Failed to create player bought notification:', error);
      } else {
        this.logger.log(`Notification created for team ${teamId}: player bought`);
      }
    } catch (error) {
      this.logger.error('Error creating player bought notification:', error);
    }
  }

  /**
   * Buscar notificações de um time
   */
  async getTeamNotifications(teamId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('market_notifications')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error('Failed to fetch team notifications:', error);
        throw new Error('Could not fetch notifications.');
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error fetching team notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('market_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        this.logger.error('Failed to mark notification as read:', error);
        throw new Error('Could not mark notification as read.');
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações de um time como lidas
   */
  async markAllNotificationsAsRead(teamId: string) {
    try {
      const { error } = await supabase
        .from('market_notifications')
        .update({ read: true })
        .eq('team_id', teamId)
        .eq('read', false);

      if (error) {
        this.logger.error('Failed to mark all notifications as read:', error);
        throw new Error('Could not mark all notifications as read.');
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Deletar notificações antigas (mais de 30 dias)
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('market_notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        this.logger.error('Failed to cleanup old notifications:', error);
      } else {
        this.logger.log('Old notifications cleaned up successfully');
      }
    } catch (error) {
      this.logger.error('Error cleaning up old notifications:', error);
    }
  }
}
