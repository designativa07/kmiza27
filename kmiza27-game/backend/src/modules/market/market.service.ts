import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { MarketNotificationsService } from './market-notifications.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly notificationsService?: MarketNotificationsService,
  ) {
    this.logger.log('MarketService initialized', notificationsService ? 'with notifications service' : 'without notifications service');
  }

  async listPlayer(playerId: string, teamId: string, price: number, isYouth: boolean) {
    try {
      this.logger.log(`SERVICE: Listing player ${playerId} from team ${teamId} for ${price}`);

      const playerTable = isYouth ? 'youth_players' : 'game_players';

      // Passo 1: Verificar se o jogador existe
      const { data: player, error: playerError } = await supabase
        .from(playerTable)
        .select('id, team_id, name')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        this.logger.error(`Player ${playerId} not found in ${playerTable}:`, playerError);
        throw new Error('Player not found.');
      }

      // Passo 1.1: Se o jogador não tem team_id, associá-lo ao time
      if (!player.team_id) {
        this.logger.log(`Player ${playerId} has no team_id, associating to team ${teamId}`);
        
        const { error: updateTeamError } = await supabase
          .from(playerTable)
          .update({ team_id: teamId })
          .eq('id', playerId);

        if (updateTeamError) {
          this.logger.error(`Failed to associate player ${playerId} to team ${teamId}:`, updateTeamError);
          throw new Error('Could not associate player to team.');
        }
      } else if (player.team_id !== teamId) {
        this.logger.error(`Player ${playerId} belongs to team ${player.team_id}, not ${teamId}`);
        throw new Error('Player does not belong to this team.');
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

      // Passo 3: Atualizar o status do jogador para 'listed' (se a coluna existir)
      try {
        const { error: updateError } = await supabase
          .from(playerTable)
          .update({ market_status: 'listed' })
          .eq('id', playerId);

        if (updateError) {
          // Se erro é sobre coluna não existir, apenas avisar e continuar
          if (updateError.code === 'PGRST204' || updateError.message.includes('market_status')) {
            this.logger.warn(`Column market_status not found in ${playerTable}, skipping status update`);
          } else {
            // Outro erro, reverter a inserção
            this.logger.error(`Failed to update player status for ${playerId}:`, updateError);
            await supabase.from('game_transfers').delete().eq('id', transfer.id);
            throw new Error('Failed to update player status.');
          }
        }
      } catch (statusUpdateError) {
        this.logger.warn(`Could not update market_status: ${statusUpdateError.message}`);
        // Não falhar o processo inteiro por causa disso
      }

      this.logger.log(`Player ${playerId} successfully listed for sale.`);
      return { success: true, transfer };
    } catch (error) {
      this.logger.error('Error in MarketService.listPlayer:', error);
      throw new Error(`Failed to list player: ${error.message}`);
    }
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
        .select('id, name, position, attributes, potential')
        .in('id', youthPlayerIds);

      const { data: proPlayers, error: proError } = await supabase
        .from('game_players')
        .select('id, name, position, current_ability, potential')
        .in('id', proPlayerIds);

      if (youthError || proError) {
        this.logger.error('Failed to fetch player details:', { youthError, proError });
        throw new Error('Could not fetch player details.');
      }

      // Combinar dados de transferência com dados dos jogadores
      const allPlayers = [...(youthPlayers || []), ...(proPlayers || [])];
      this.logger.log('Jogadores encontrados:', { youthPlayers, proPlayers });
      
      const combinedData = transfers.map(transfer => {
        const playerDetails = allPlayers.find(p => p.id === transfer.player_id);
        this.logger.log(`Transfer ${transfer.id}: player_id=${transfer.player_id}, playerDetails=`, playerDetails);
        return {
          ...transfer,
          player_details: playerDetails,
        };
      });

      this.logger.log('Dados combinados retornados:', combinedData);
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
        .select('id, offer_status, transfer_status')
        .eq('player_id', playerId)
        .eq('buying_team_id', buyingTeamId)
        .not('offer_price', 'is', null); // Verificar se já existe uma oferta com preço

      if (checkError) {
        this.logger.error('Error checking existing offers:', checkError);
        throw new Error('Could not check existing offers.');
      }

      if (existingOffer && existingOffer.length > 0) {
        const existingStatuses = existingOffer.map(o => `${o.offer_status}/${o.transfer_status}`);
        this.logger.warn(`Existing offers found with statuses: ${existingStatuses.join(', ')}`);
        
        // Verificar se há ofertas pendentes ou aceitas
        const activeFOffer = existingOffer.find(o => 
          o.offer_status === 'pending' || 
          o.offer_status === 'accepted' ||
          o.transfer_status === 'completed'
        );
        
        if (activeFOffer) {
          if (activeFOffer.offer_status === 'accepted' || activeFOffer.transfer_status === 'completed') {
            throw new Error('This player has already been transferred.');
          } else {
            throw new Error('You already have a pending offer for this player.');
          }
        }
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
   * Fazer uma contraproposta
   */
  async makeCounterOffer(offerId: string, counterOfferPrice: number) {
    try {
      this.logger.log(`Making counter offer: ${offerId} with price ${counterOfferPrice}`);
      
      // Buscar a oferta
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        this.logger.error(`Offer not found: ${offerId}`, fetchError);
        throw new Error('Offer not found.');
      }

      // Validações
      if (offer.offer_status !== 'pending') {
        throw new Error('Only pending offers can receive counter offers.');
      }

      if (counterOfferPrice <= 0) {
        throw new Error('Counter offer price must be positive.');
      }

      // Atualizar a oferta com a contraproposta
      const { error: updateError } = await supabase
        .from('game_transfers')
        .update({
          counter_offer_price: counterOfferPrice,
          transfer_status: 'negotiating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (updateError) {
        this.logger.error(`Failed to make counter offer ${offerId}:`, updateError);
        throw new Error('Could not make counter offer.');
      }

      this.logger.log(`Counter offer ${offerId} made successfully with price ${counterOfferPrice}`);
      
      // Buscar informações para notificação
      const playerTable = offer.is_youth_player ? 'youth_players' : 'game_players';
      const { data: player } = await supabase
        .from(playerTable)
        .select('name')
        .eq('id', offer.player_id)
        .single();

      const { data: sellingTeam } = await supabase
        .from('game_teams')
        .select('name')
        .eq('id', offer.selling_team_id)
        .single();

      // TODO: Criar notificação de contraproposta (método específico precisa ser implementado)
      // Notificação será implementada em versão futura
      this.logger.log(`Counter offer notification would be sent to team ${offer.buying_team_id}`);

      return { success: true, counterOfferPrice };
    } catch (error) {
      this.logger.error('Error in makeCounterOffer:', error);
      throw error;
    }
  }

  /**
   * Aceitar uma contraproposta
   */
  async acceptCounterOffer(offerId: string) {
    try {
      this.logger.log(`Accepting counter offer: ${offerId}`);

      // Buscar a oferta com contraproposta
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        throw new Error('Offer not found.');
      }

      if (!offer.counter_offer_price) {
        throw new Error('No counter offer found for this offer.');
      }

      this.logger.log(`Processing counter offer acceptance: Player ${offer.player_id}, Price: ${offer.counter_offer_price}`);

      // Atualizar status da oferta para aceita
      const { error: updateError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'accepted',
          transfer_status: 'completed',
          offer_price: offer.counter_offer_price, // Usar o preço da contraproposta
          updated_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (updateError) {
        this.logger.error(`Failed to accept counter offer ${offerId}:`, updateError);
        throw new Error('Could not accept counter offer.');
      }

      // Processar a transferência do jogador
      await this.processTransfer(offer);

      this.logger.log(`Counter offer ${offerId} accepted successfully`);

      // Criar notificação para o time vendedor
      try {
        const playerTable = offer.is_youth_player ? 'youth_players' : 'game_players';
        const { data: player } = await supabase
          .from(playerTable)
          .select('name')
          .eq('id', offer.player_id)
          .single();

        const { data: buyingTeam } = await supabase
          .from('game_teams')
          .select('name')
          .eq('id', offer.buying_team_id)
          .single();

        await this.notificationsService?.createOfferAcceptedNotification(
          offer.selling_team_id,
          offer.player_id,
          player?.name || 'Jogador',
          buyingTeam?.name || 'Time',
          offer.counter_offer_price,
        );
      } catch (notificationError) {
        this.logger.error('Failed to create acceptance notification:', notificationError);
      }

      return { success: true, transferPrice: offer.counter_offer_price };
    } catch (error) {
      this.logger.error('Error in acceptCounterOffer:', error);
      throw error;
    }
  }

  /**
   * Buscar ofertas pendentes de um time
   */
  async getPendingOffers(teamId: string) {
    try {
      this.logger.log(`🔍 Fetching pending offers for team: ${teamId}`);

      // Buscar ofertas recebidas (onde o time é o vendedor)
      this.logger.log(`📥 Searching for received offers (selling_team_id = ${teamId})`);
      const { data: receivedOffers, error: receivedError } = await supabase
        .from('game_transfers')
        .select(`
          id,
          player_id,
          is_youth_player,
          listing_price,
          offer_price,
          offer_status,
          offer_made_at,
          counter_offer_price,
          buying_team:game_teams!game_transfers_buying_team_id_fkey(name)
        `)
        .eq('selling_team_id', teamId)
        .not('buying_team_id', 'is', null)
        .not('offer_price', 'is', null)
        .order('offer_made_at', { ascending: false });

      if (receivedError) {
        this.logger.error('❌ Failed to fetch received offers:', receivedError);
        throw new Error('Could not fetch received offers.');
      }

      this.logger.log(`📥 Received offers found: ${receivedOffers?.length || 0}`);

      // Buscar ofertas feitas (onde o time é o comprador)
      this.logger.log(`📤 Searching for made offers (buying_team_id = ${teamId})`);
      const { data: madeOffers, error: madeError } = await supabase
        .from('game_transfers')
        .select(`
          id,
          player_id,
          is_youth_player,
          listing_price,
          offer_price,
          offer_status,
          offer_made_at,
          counter_offer_price,
          selling_team:game_teams!game_transfers_selling_team_id_fkey(name)
        `)
        .eq('buying_team_id', teamId)
        .not('offer_price', 'is', null)
        .order('offer_made_at', { ascending: false });

      if (madeError) {
        this.logger.error('❌ Failed to fetch made offers:', madeError);
        throw new Error('Could not fetch made offers.');
      }

      this.logger.log(`📤 Made offers found: ${madeOffers?.length || 0}`);

      // Debug: mostrar todas as ofertas na tabela
      const { data: allOffers, error: allOffersError } = await supabase
        .from('game_transfers')
        .select('*')
        .limit(10);

      if (allOffersError) {
        this.logger.warn('⚠️ Could not fetch all offers for debug:', allOffersError);
      } else {
        this.logger.log(`🔍 Total offers in game_transfers table: ${allOffers?.length || 0}`);
        if (allOffers && allOffers.length > 0) {
          this.logger.log('🔍 Sample offers:', allOffers.slice(0, 3).map(o => ({
            id: o.id,
            selling_team_id: o.selling_team_id,
            buying_team_id: o.buying_team_id,
            offer_status: o.offer_status,
            offer_price: o.offer_price
          })));
        }
      }

      // Buscar nomes dos jogadores para ofertas recebidas
      const receivedWithNames = await this.addPlayerNames(receivedOffers || []);
      
      // Buscar nomes dos jogadores para ofertas feitas
      const madeWithNames = await this.addPlayerNames(madeOffers || []);

      this.logger.log(`✅ Final result - Received: ${receivedWithNames.length}, Made: ${madeWithNames.length}`);

      const result = {
        success: true,
        received: receivedWithNames,
        made: madeWithNames,
        debug: {
          teamId,
          totalReceived: receivedWithNames.length,
          totalMade: madeWithNames.length,
          timestamp: new Date().toISOString()
        }
      };

      this.logger.log('📤 Returning result:', result);
      return result;
    } catch (error) {
      this.logger.error('❌ Error in getPendingOffers:', error);
      throw error;
    }
  }

  /**
   * Adicionar nomes dos jogadores às ofertas
   */
  private async addPlayerNames(offers: any[]): Promise<any[]> {
    if (!offers || offers.length === 0) {
      return offers;
    }

    const offersWithNames = [];

    for (const offer of offers) {
      try {
        // Determinar a tabela baseada no tipo de jogador
        const playerTable = offer.is_youth_player ? 'youth_players' : 'game_players';
        
        // Buscar nome do jogador
        const { data: player, error: playerError } = await supabase
          .from(playerTable)
          .select('name')
          .eq('id', offer.player_id)
          .single();

        // Adicionar nome do jogador à oferta
        offersWithNames.push({
          ...offer,
          player_name: player?.name || 'Nome não encontrado'
        });

        if (playerError) {
          this.logger.warn(`Could not find player name for ${offer.player_id} in ${playerTable}:`, playerError);
        }
      } catch (error) {
        this.logger.error(`Error fetching player name for ${offer.player_id}:`, error);
        // Adicionar oferta mesmo sem nome
        offersWithNames.push({
          ...offer,
          player_name: 'Erro ao carregar nome'
        });
      }
    }

    return offersWithNames;
  }

  /**
   * Processar transferência após oferta aceita
   */
  private async processTransfer(offer: any) {
    try {
      const { player_id, is_youth_player, selling_team_id, buying_team_id } = offer;

      // Atualizar time do jogador
      const playerTable = is_youth_player ? 'youth_players' : 'game_players';
      
      // Dados básicos para atualizar
      const updateData: any = {
        team_id: buying_team_id,
      };
      
      // Só adicionar market_status se não for jogador juvenil (pois youth_players não tem essa coluna)
      if (!is_youth_player) {
        updateData.market_status = 'none';
      }
      
      const { error: updateError } = await supabase
        .from(playerTable)
        .update(updateData)
        .eq('id', player_id);

      if (updateError) {
        this.logger.error('Failed to update player team:', updateError);
        throw new Error('Could not process transfer.');
      }

      this.logger.log(`Player ${player_id} transferred from ${selling_team_id} to ${buying_team_id}`);

      // Limpar outras listagens órfãs deste jogador
      await this.cleanupOrphanListings(player_id, is_youth_player);

    } catch (error) {
      this.logger.error('Error processing transfer:', error);
      throw error;
    }
  }

  /**
   * Limpar listagens órfãs de um jogador após transferência
   */
  private async cleanupOrphanListings(playerId: string, isYouthPlayer: boolean) {
    try {
      this.logger.log(`Cleaning up orphan listings for player ${playerId}`);

      // Buscar todas as listagens órfãs (sem oferta ou rejeitadas)
      const { data: orphanListings, error: orphanError } = await supabase
        .from('game_transfers')
        .select('id, selling_team_id, transfer_status')
        .eq('player_id', playerId)
        .eq('is_youth_player', isYouthPlayer)
        .or('offer_price.is.null,offer_status.eq.rejected');

      if (orphanError) {
        this.logger.error('Error finding orphan listings:', orphanError);
        return;
      }

      if (orphanListings && orphanListings.length > 0) {
        this.logger.log(`Found ${orphanListings.length} orphan listings to clean up`);

        // Buscar o time atual do jogador
        const playerTable = isYouthPlayer ? 'youth_players' : 'game_players';
        const { data: player, error: playerError } = await supabase
          .from(playerTable)
          .select('team_id')
          .eq('id', playerId)
          .single();

        if (playerError || !player) {
          this.logger.error('Could not fetch player current team:', playerError);
          return;
        }

        // Filtrar listagens que não são mais válidas (jogador mudou de time)
        const invalidListings = orphanListings.filter(listing => 
          listing.selling_team_id !== player.team_id
        );

        if (invalidListings.length > 0) {
          this.logger.log(`Removing ${invalidListings.length} invalid listings`);

          // Remover listagens inválidas
          const listingIds = invalidListings.map(l => l.id);
          const { error: deleteError } = await supabase
            .from('game_transfers')
            .delete()
            .in('id', listingIds);

          if (deleteError) {
            this.logger.error('Error deleting orphan listings:', deleteError);
          } else {
            this.logger.log(`Successfully removed ${invalidListings.length} orphan listings`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in cleanupOrphanListings:', error);
      // Não propagar o erro pois é uma operação de limpeza
    }
  }

  /**
   * Buscar notificações de um time
   */
  async getTeamNotifications(teamId: string, limit: number = 20) {
    try {
      if (!this.notificationsService) {
        this.logger.warn('NotificationsService not available, returning empty array');
        return [];
      }
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
      if (!this.notificationsService) {
        this.logger.warn('NotificationsService not available');
        return { success: true, message: 'Notifications service not available' };
      }
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
      if (!this.notificationsService) {
        this.logger.warn('NotificationsService not available');
        return { success: true, message: 'Notifications service not available' };
      }
      return await this.notificationsService.markAllNotificationsAsRead(teamId);
    } catch (error) {
      this.logger.error('Error in markAllNotificationsAsRead:', error);
      throw error;
    }
  }
}
