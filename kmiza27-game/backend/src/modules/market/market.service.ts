import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { MarketNotificationsService } from './market-notifications.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly notificationsService: MarketNotificationsService,
  ) {
    this.logger.log('MarketService initialized with notifications service');
  }

  async listPlayer(playerId: string, teamId: string, price: number, isYouth: boolean) {
    this.logger.log(`SERVICE: Listing player ${playerId} from team ${teamId} for ${price}`);

    const playerTable = isYouth ? 'youth_players' : 'game_players';

    // Passo 1: Verificar se o jogador pertence ao time
    const { data: player, error: playerError } = await supabase
      .from(playerTable)
      .select('id, team_id')
      .eq('id', playerId)
      .eq('team_id', teamId)
      .single();

    if (playerError || !player) {
      this.logger.error(`Player ${playerId} not found or does not belong to team ${teamId}`);
      throw new Error('Player not found or access denied.');
    }

    // Passo 2: Inserir o jogador na lista de transferências
    const { data: transfer, error: transferError } = await supabase
      .from('game_transfers')
      .insert({
        player_id: playerId,
        is_youth_player: isYouth,
        selling_team_id: teamId,
        listing_price: price,
        transfer_status: 'listed',
      })
      .select()
      .single();

    if (transferError) {
      this.logger.error(`Failed to list player ${playerId}:`, transferError);
      throw new Error('Could not list player on the market.');
    }

    // Passo 3: Atualizar o status do jogador para 'listed'
    const { error: updateError } = await supabase
      .from(playerTable)
      .update({ market_status: 'listed' })
      .eq('id', playerId);

    if (updateError) {
      // Opcional: Reverter a inserção na lista de transferências se a atualização falhar
      this.logger.error(`Failed to update player status for ${playerId}:`, updateError);
      await supabase.from('game_transfers').delete().eq('id', transfer.id);
      throw new Error('Failed to update player status.');
    }

    this.logger.log(`Player ${playerId} successfully listed for sale.`);
    return { success: true, transfer };
  }

  async unlistPlayer(playerId: string, isYouth: boolean) {
    this.logger.log(`SERVICE: Unlisting player ${playerId}`);
    // TODO: Implementar a lógica para remover o jogador da game_transfers
    // e reverter o status.
    return { success: true };
  }

  async getListedPlayers(teamId: string) {
    try {
      this.logger.log(`Fetching listed players, excluding team ${teamId}`);

      // Busca todas as transferências ativas que não pertencem ao time do usuário
      const { data: transfers, error } = await supabase
        .from('game_transfers')
        .select(`
          id,
          player_id,
          is_youth_player,
          selling_team_id,
          listing_price,
          listed_at,
          buying_team_id,
          offer_price,
          offer_status,
          offer_made_at,
          transfer_status,
          created_at,
          updated_at,
          selling_team:game_teams!game_transfers_selling_team_id_fkey(name)
        `)
        .neq('selling_team_id', teamId)
        .eq('transfer_status', 'listed');

      if (error) {
        this.logger.error('Failed to fetch transfers:', error);
        throw new Error('Could not fetch market players.');
      }

      if (!transfers || transfers.length === 0) {
        return [];
      }

      // Separar IDs de jogadores da base e profissionais
      const youthPlayerIds = transfers.filter(t => t.is_youth_player).map(t => t.player_id);
      const proPlayerIds = transfers.filter(t => !t.is_youth_player).map(t => t.player_id);

      // Buscar dados dos jogadores em suas respectivas tabelas
      const { data: youthPlayers, error: youthError } = await supabase
        .from('youth_players')
        .select('*')
        .in('id', youthPlayerIds);

      const { data: proPlayers, error: proError } = await supabase
        .from('game_players')
        .select('*')
        .in('id', proPlayerIds);

      if (youthError || proError) {
        this.logger.error('Failed to fetch player details:', { youthError, proError });
        throw new Error('Could not fetch player details.');
      }

      // Combinar dados de transferência com dados dos jogadores
      const allPlayers = [...(youthPlayers || []), ...(proPlayers || [])];
      const combinedData = transfers.map(transfer => {
        const playerDetails = allPlayers.find(p => p.id === transfer.player_id);
        return {
          ...transfer,
          player_details: playerDetails,
        };
      });

      return combinedData;
    } catch (error) {
      this.logger.error('Error in getListedPlayers:', error);
      throw new Error('Failed to fetch listed players.');
    }
  }

  /**
   * Fazer uma oferta por um jogador listado
   */
  async makeOffer(
    playerId: string,
    buyingTeamId: string,
    offerPrice: number,
    isYouth: boolean,
  ) {
    try {
      this.logger.log(
        `Team ${buyingTeamId} making offer ${offerPrice} for player ${playerId}`,
      );

      // Validar parâmetros de entrada
      if (!playerId || !buyingTeamId || !offerPrice || typeof isYouth !== 'boolean') {
        this.logger.error('Invalid parameters:', { playerId, buyingTeamId, offerPrice, isYouth });
        throw new Error('Invalid parameters provided.');
      }

      // Verificar se o jogador ainda está listado (pode haver múltiplas listagens)
      this.logger.log('Fetching player transfers...');
      const { data: transfers, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('player_id', playerId)
        .eq('is_youth_player', isYouth)
        .eq('transfer_status', 'listed');

      if (fetchError) {
        this.logger.error('Error fetching player transfers:', fetchError);
        throw new Error('Could not fetch player transfers.');
      }

      if (!transfers || transfers.length === 0) {
        this.logger.error('No transfers found for player');
        throw new Error('Player is not available for transfer.');
      }

      this.logger.log(`Found ${transfers.length} transfers for player`);

      // Usar a primeira listagem disponível (ou a mais recente)
      const transfer = transfers[0];
      
      // Verificar se não é o próprio time fazendo oferta
      if (transfer.selling_team_id === buyingTeamId) {
        throw new Error('Cannot make offer for your own player.');
      }

      // Verificar se já existe uma oferta deste time
      this.logger.log('Checking for existing offers...');
      const { data: existingOffer, error: checkError } = await supabase
        .from('game_transfers')
        .select('id')
        .eq('player_id', playerId)
        .eq('buying_team_id', buyingTeamId)
        .not('offer_price', 'is', null); // Verificar se já existe uma oferta com preço

      if (checkError) {
        this.logger.error('Error checking existing offers:', checkError);
        throw new Error('Could not check existing offers.');
      }

      if (existingOffer && existingOffer.length > 0) {
        throw new Error('You already have an offer for this player.');
      }

      // Buscar nome do time comprador
      this.logger.log('Fetching buying team information...');
      const { data: buyingTeam, error: teamError } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', buyingTeamId)
        .single();

      if (teamError || !buyingTeam) {
        this.logger.error('Could not fetch buying team information:', teamError);
        throw new Error('Could not fetch buying team information.');
      }

      this.logger.log(`Buying team: ${buyingTeam.name}`);

      // Buscar nome do jogador
      this.logger.log('Fetching player information...');
      const playerTable = isYouth ? 'youth_players' : 'game_players';
      const { data: player, error: playerError } = await supabase
        .from(playerTable)
        .select('name')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        this.logger.error('Could not fetch player information:', playerError);
        throw new Error('Could not fetch player information.');
      }

      this.logger.log(`Player: ${player.name}`);

      // Criar nova oferta
      this.logger.log('Creating new offer...');
      const { data: newOffer, error: insertError } = await supabase
        .from('game_transfers')
        .insert({
          player_id: playerId,
          is_youth_player: isYouth,
          selling_team_id: transfer.selling_team_id,
          buying_team_id: buyingTeamId,
          listing_price: transfer.listing_price, // Preço da listagem original
          offer_price: offerPrice, // Preço da oferta
          offer_status: 'pending', // Status da oferta
          transfer_status: 'listed', // Manter como 'listed' para ofertas
          offer_made_at: new Date().toISOString(),
          listed_at: transfer.listed_at, // Data da listagem original
        })
        .select()
        .single();

      if (insertError) {
        this.logger.error('Failed to create offer:', insertError);
        throw new Error('Could not create offer.');
      }

      this.logger.log(`Offer created successfully: ${newOffer.id}`);

      // Criar notificação para o time vendedor
      this.logger.log('Creating notification...');
      try {
        await this.notificationsService.createOfferReceivedNotification(
          transfer.selling_team_id,
          playerId,
          player.name,
          buyingTeam.name,
          offerPrice,
        );
        this.logger.log('Notification created successfully');
      } catch (notificationError) {
        this.logger.error('Failed to create notification:', notificationError);
        // Não falhar a oferta se a notificação falhar
      }

      this.logger.log(`Offer created: ${newOffer.id}`);
      return { success: true, offer: newOffer };
    } catch (error) {
      this.logger.error('Error in makeOffer:', error);
      throw error;
    }
  }

  /**
   * Aceitar uma oferta
   */
  async acceptOffer(offerId: string) {
    try {
      this.logger.log(`Accepting offer: ${offerId}`);

      // Buscar a oferta
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        throw new Error('Offer not found.');
      }

      // Atualizar status da oferta
      const { error: updateError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'accepted',
          transfer_status: 'listed', // Manter como 'listed' até a transferência
        })
        .eq('id', offerId);

      if (updateError) {
        this.logger.error('Failed to update offer status:', updateError);
        throw new Error('Could not update offer status.');
      }

      // Buscar nomes dos times e jogador para notificações
      const { data: sellingTeam } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', offer.selling_team_id)
        .single();

      const { data: buyingTeam } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', offer.buying_team_id)
        .single();

      const playerTable = offer.is_youth_player ? 'youth_players' : 'game_players';
      const { data: player } = await supabase
        .from(playerTable)
        .select('name')
        .eq('id', offer.player_id)
        .single();

      // Processar a transferência
      await this.processTransfer(offer);

      // Criar notificações
      await this.notificationsService.createOfferAcceptedNotification(
        offer.buying_team_id,
        offer.player_id,
        player.name,
        sellingTeam.name,
        offer.offer_price,
      );

      await this.notificationsService.createPlayerSoldNotification(
        offer.selling_team_id,
        offer.player_id,
        player.name,
        buyingTeam.name,
        offer.offer_price,
      );

      await this.notificationsService.createPlayerBoughtNotification(
        offer.buying_team_id,
        offer.player_id,
        player.name,
        sellingTeam.name,
        offer.offer_price,
      );

      this.logger.log(`Offer ${offerId} accepted successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error in acceptOffer:', error);
      throw error;
    }
  }

  /**
   * Rejeitar uma oferta
   */
  async rejectOffer(offerId: string) {
    try {
      this.logger.log(`Rejecting offer: ${offerId}`);

      // Buscar a oferta
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        throw new Error('Offer not found.');
      }

      // Atualizar status da oferta
      const { error: updateError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'rejected',
          transfer_status: 'listed', // Manter como 'listed'
        })
        .eq('id', offerId);

      if (updateError) {
        this.logger.error('Failed to update offer status:', updateError);
        throw new Error('Could not update offer status.');
      }

      // Buscar nomes dos times e jogador para notificações
      const { data: sellingTeam } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', offer.selling_team_id)
        .single();

      const { data: buyingTeam } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', offer.buying_team_id)
        .single();

      const playerTable = offer.is_youth_player ? 'youth_players' : 'game_players';
      const { data: player } = await supabase
        .from(playerTable)
        .select('name')
        .eq('id', offer.player_id)
        .single();

      // Criar notificação para o time comprador
      await this.notificationsService.createOfferRejectedNotification(
        offer.buying_team_id,
        offer.player_id,
        player.name,
        sellingTeam.name,
        offer.offer_price,
      );

      this.logger.log(`Offer ${offerId} rejected successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error in rejectOffer:', error);
      throw error;
    }
  }

  /**
   * Buscar ofertas pendentes de um time
   */
  async getPendingOffers(teamId: string) {
    try {
      this.logger.log(`Fetching pending offers for team: ${teamId}`);

      // Buscar ofertas recebidas (onde o time é o vendedor)
      const { data: receivedOffers, error: receivedError } = await supabase
        .from('game_transfers')
        .select(`
          id,
          player_id,
          is_youth_player,
          offer_price,
          offer_status,
          offer_made_at,
          buying_team:game_teams!game_transfers_buying_team_id_fkey(name)
        `)
        .eq('selling_team_id', teamId)
        .not('buying_team_id', 'is', null)
        .not('offer_price', 'is', null)
        .order('offer_made_at', { ascending: false });

      if (receivedError) {
        this.logger.error('Failed to fetch received offers:', receivedError);
        throw new Error('Could not fetch received offers.');
      }

      // Buscar ofertas feitas (onde o time é o comprador)
      const { data: madeOffers, error: madeError } = await supabase
        .from('game_transfers')
        .select(`
          id,
          player_id,
          is_youth_player,
          offer_price,
          offer_status,
          offer_made_at,
          selling_team:game_teams!game_transfers_selling_team_id_fkey(name)
        `)
        .eq('buying_team_id', teamId)
        .not('offer_price', 'is', null)
        .order('offer_made_at', { ascending: false });

      if (madeError) {
        this.logger.error('Failed to fetch made offers:', madeError);
        throw new Error('Could not fetch made offers.');
      }

      return {
        received: receivedOffers || [],
        made: madeOffers || [],
      };
    } catch (error) {
      this.logger.error('Error in getPendingOffers:', error);
      throw error;
    }
  }

  /**
   * Processar transferência após oferta aceita
   */
  private async processTransfer(offer: any) {
    try {
      const { player_id, is_youth_player, selling_team_id, buying_team_id } = offer;

      // Atualizar time do jogador
      const playerTable = is_youth_player ? 'youth_players' : 'game_players';
      const { error: updateError } = await supabase
        .from(playerTable)
        .update({
          team_id: buying_team_id,
          market_status: 'none',
        })
        .eq('id', player_id);

      if (updateError) {
        this.logger.error('Failed to update player team:', updateError);
        throw new Error('Could not process transfer.');
      }

      this.logger.log(`Player ${player_id} transferred from ${selling_team_id} to ${buying_team_id}`);
    } catch (error) {
      this.logger.error('Error processing transfer:', error);
      throw error;
    }
  }

  /**
   * Buscar notificações de um time
   */
  async getTeamNotifications(teamId: string, limit: number = 20) {
    try {
      return await this.notificationsService.getTeamNotifications(teamId, limit);
    } catch (error) {
      this.logger.error('Error in getTeamNotifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      return await this.notificationsService.markNotificationAsRead(notificationId);
    } catch (error) {
      this.logger.error('Error in markNotificationAsRead:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações de um time como lidas
   */
  async markAllNotificationsAsRead(teamId: string) {
    try {
      return await this.notificationsService.markAllNotificationsAsRead(teamId);
    } catch (error) {
      this.logger.error('Error in markAllNotificationsAsRead:', error);
      throw error;
    }
  }
}
