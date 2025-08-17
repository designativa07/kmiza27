import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class MarketAIService {
  private readonly logger = new Logger(MarketAIService.name);

  /**
   * Analisa e lista jogadores dos times da IA no mercado
   */
  async runMarketAI() {
    try {
      this.logger.log('Starting Market AI analysis...');

      // Buscar todos os times da IA (que não são do usuário)
      const { data: aiTeams, error: teamsError } = await supabase
        .from('game_teams')
        .select('id, name, is_user_team')
        .eq('is_user_team', false);

      if (teamsError || !aiTeams) {
        this.logger.error('Failed to fetch AI teams:', teamsError);
        return;
      }

      this.logger.log(`Found ${aiTeams.length} AI teams to analyze`);

      for (const team of aiTeams) {
        await this.analyzeTeamForMarket(team.id, team.name);
      }

      this.logger.log('Market AI analysis completed');
    } catch (error) {
      this.logger.error('Error in Market AI:', error);
    }
  }

  /**
   * Analisa um time específico para identificar jogadores para venda
   */
  private async analyzeTeamForMarket(teamId: string, teamName: string) {
    try {
      this.logger.log(`Analyzing team: ${teamName}`);

      // Por enquanto, vamos focar apenas nos jogadores da base
      // já que a tabela game_players não tem a estrutura completa ainda
      this.logger.log(`Skipping professional players for ${teamName} - table structure incomplete`);

      // Buscar jogadores da base do time
      const { data: youthPlayers, error: youthError } = await supabase
        .from('youth_players')
        .select('id, name, potential_overall, market_value, position')
        .eq('team_id', teamId);

      if (youthError) {
        this.logger.error(`Error fetching youth players for ${teamName}:`, youthError);
        return;
      }

              // Decidir quais jogadores listar
        const playersToSell = this.decideWhichPlayersToSellIntelligent([], youthPlayers || []);

      // Listar jogadores selecionados
      for (const player of playersToSell) {
        await this.listPlayerForAI(player, teamId);
      }

      this.logger.log(`${teamName}: Listed ${playersToSell.length} players for sale`);
    } catch (error) {
      this.logger.error(`Error analyzing team ${teamName}:`, error);
    }
  }

  /**
   * Lógica para decidir quais jogadores vender
   */
  private decideWhichPlayersToSell(proPlayers: any[], youthPlayers: any[]): any[] {
    const playersToSell: any[] = [];

    // Por enquanto, vamos focar apenas nos jogadores da base
    // Vender jogadores da base com potencial baixo
    const lowPotentialPlayers = youthPlayers
      .filter(p => p.potential_overall < 70)
      .sort((a, b) => a.potential_overall - b.potential_overall)
      .slice(0, 2); // Máximo 2 jogadores da base por vez

    playersToSell.push(...lowPotentialPlayers);

    return playersToSell;
  }

  /**
   * Lógica inteligente para decidir quais jogadores vender
   */
  private decideWhichPlayersToSellIntelligent(proPlayers: any[], youthPlayers: any[]): any[] {
    const playersToSell: any[] = [];

    // Estratégia para jogadores da base
    if (youthPlayers.length > 0) {
      // Vender jogadores com potencial muito baixo (menos de 65)
      const veryLowPotential = youthPlayers
        .filter(p => p.potential_overall < 65)
        .sort((a, b) => a.potential_overall - b.potential_overall);

      // Vender jogadores com potencial baixo (65-70) se houver muitos
      const lowPotential = youthPlayers
        .filter(p => p.potential_overall >= 65 && p.potential_overall < 70)
        .sort((a, b) => a.potential_overall - b.potential_overall);

      // Vender jogadores com potencial médio (70-75) se houver excesso
      const mediumPotential = youthPlayers
        .filter(p => p.potential_overall >= 70 && p.potential_overall < 75)
        .sort((a, b) => a.potential_overall - b.potential_overall);

      // Adicionar jogadores com potencial muito baixo (prioridade)
      playersToSell.push(...veryLowPotential.slice(0, 3));

      // Adicionar jogadores com potencial baixo se houver espaço
      if (playersToSell.length < 4) {
        playersToSell.push(...lowPotential.slice(0, 4 - playersToSell.length));
      }

      // Adicionar jogadores com potencial médio se ainda houver espaço
      if (playersToSell.length < 5) {
        playersToSell.push(...mediumPotential.slice(0, 5 - playersToSell.length));
      }
    }

    return playersToSell;
  }

  /**
   * Calcular preço inteligente baseado em múltiplos fatores
   */
  private calculateIntelligentPrice(player: any, basePrice: number): number {
    let priceMultiplier = 1.0;

    // Fator de potencial
    if (player.potential_overall >= 80) {
      priceMultiplier *= 1.5; // Jogadores com alto potencial valem mais
    } else if (player.potential_overall >= 75) {
      priceMultiplier *= 1.3;
    } else if (player.potential_overall >= 70) {
      priceMultiplier *= 1.1;
    } else if (player.potential_overall < 65) {
      priceMultiplier *= 0.7; // Jogadores com baixo potencial valem menos
    }

    // Fator de posição (posições mais valorizadas)
    const positionMultipliers: { [key: string]: number } = {
      'ST': 1.4,   // Atacante
      'CF': 1.3,   // Centro-avante
      'LW': 1.2,   // Ponta esquerda
      'RW': 1.2,   // Ponta direita
      'CAM': 1.3,  // Meia ofensivo
      'CM': 1.1,   // Meia central
      'CDM': 1.0,  // Meia defensivo
      'LB': 1.1,   // Lateral esquerdo
      'RB': 1.1,   // Lateral direito
      'CB': 1.0,   // Zagueiro
      'GK': 1.2,   // Goleiro
    };

    if (player.position && positionMultipliers[player.position]) {
      priceMultiplier *= positionMultipliers[player.position];
    }

    // Variação aleatória para simular mercado real (entre 85% e 115%)
    const randomVariation = 0.85 + Math.random() * 0.3;
    priceMultiplier *= randomVariation;

    // Preço base com multiplicadores aplicados
    const intelligentPrice = Math.round(basePrice * priceMultiplier);

    // Garantir preço mínimo de R$ 500
    return Math.max(intelligentPrice, 500);
  }

  /**
   * Lista um jogador da IA no mercado
   */
  private async listPlayerForAI(player: any, teamId: string) {
    try {
      // Por enquanto, todos os jogadores são da base
      const isYouth = true;
      const basePrice = player.market_value || 1000;

      // Usar preço inteligente em vez de variação simples
      const listingPrice = this.calculateIntelligentPrice(player, basePrice);

      // Inserir na lista de transferências
      const { error: transferError } = await supabase
        .from('game_transfers')
        .insert({
          player_id: player.id,
          is_youth_player: isYouth,
          selling_team_id: teamId,
          listing_price: listingPrice,
          transfer_status: 'listed'
        });

      if (transferError) {
        this.logger.error(`Failed to list AI player ${player.name}:`, transferError);
        return;
      }

      // Atualizar status do jogador na base
      const { error: updateError } = await supabase
        .from('youth_players')
        .update({ market_status: 'listed' })
        .eq('id', player.id);

      if (updateError) {
        this.logger.error(`Failed to update AI player status ${player.name}:`, updateError);
      }

      this.logger.log(`AI listed ${player.name} for R$ ${listingPrice.toLocaleString()}`);
    } catch (error) {
      this.logger.error(`Error listing AI player ${player.name}:`, error);
    }
  }

  /**
   * Remove jogadores da IA que não foram vendidos após um tempo
   */
  async cleanupExpiredListings() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Buscar listagens antigas da IA
      const { data: expiredListings, error } = await supabase
        .from('game_transfers')
        .select('id, player_id, is_youth_player, selling_team_id')
        .lt('listed_at', oneWeekAgo.toISOString())
        .eq('transfer_status', 'listed')
        .eq('buying_team_id', null); // Sem ofertas

      if (error || !expiredListings) {
        this.logger.error('Failed to fetch expired listings:', error);
        return;
      }

      for (const listing of expiredListings) {
        await this.removeExpiredListing(listing);
      }

      this.logger.log(`Cleaned up ${expiredListings.length} expired AI listings`);
    } catch (error) {
      this.logger.error('Error cleaning up expired listings:', error);
    }
  }

  /**
   * Remove uma listagem expirada
   */
  private async removeExpiredListing(listing: any) {
    try {
      // Remover da lista de transferências
      await supabase
        .from('game_transfers')
        .delete()
        .eq('id', listing.id);

      // Resetar status do jogador
      const playerTable = listing.is_youth_player ? 'youth_players' : 'game_players';
      await supabase
        .from(playerTable)
        .update({ market_status: 'none' })
        .eq('id', listing.player_id);

      this.logger.log(`Removed expired listing for player ${listing.player_id}`);
    } catch (error) {
      this.logger.error(`Error removing expired listing ${listing.id}:`, error);
    }
  }

  /**
   * IA decide sobre uma oferta recebida
   */
  async decideOnOffer(offerId: string): Promise<'accept' | 'reject' | 'counter_offer'> {
    try {
      this.logger.log(`IA decidindo sobre oferta: ${offerId}`);

      // Buscar detalhes da oferta
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        this.logger.error('Erro ao buscar oferta:', fetchError);
        return 'reject';
      }

      // Buscar dados do jogador separadamente
      let playerData = null;
      if (offer.is_youth_player) {
        const { data: youthPlayer } = await supabase
          .from('youth_players')
          .select('name, current_ability, potential_ability')
          .eq('id', offer.player_id)
          .single();
        playerData = youthPlayer;
      } else {
        const { data: proPlayer } = await supabase
          .from('game_players')
          .select('name, current_ability, potential_ability')
          .eq('id', offer.player_id)
          .single();
        playerData = proPlayer;
      }

      const listingPrice = offer.listing_price;
      const offerPrice = offer.offer_price;
      const priceRatio = offerPrice / listingPrice;

      if (offerPrice >= listingPrice) {
        this.logger.log('Oferta igual ou superior ao valor pedido - ACEITA automaticamente');
        return 'accept';
      }

      if (priceRatio >= 0.9) {
        this.logger.log('Oferta 90%+ do valor pedido - ACEITA');
        return 'accept';
      } else if (priceRatio >= 0.7) {
        this.logger.log('Oferta 70-90% do valor pedido - FAZ CONTRAOFERTA');
        return 'counter_offer';
      } else {
        this.logger.log('Oferta abaixo de 70% do valor pedido - REJEITA');
        return 'reject';
      }
    } catch (error) {
      this.logger.error('Erro na IA ao decidir sobre oferta:', error);
      return 'reject';
    }
  }

  /**
   * IA executa a decisão sobre uma oferta
   */
  async executeOfferDecision(offerId: string, decision: 'accept' | 'reject' | 'counter_offer'): Promise<void> {
    try {
      this.logger.log(`IA executando decisão: ${decision} para oferta: ${offerId}`);

      if (decision === 'accept') {
        // Aceitar a oferta
        await this.acceptOffer(offerId);
      } else if (decision === 'reject') {
        // Rejeitar a oferta
        await this.rejectOffer(offerId);
      } else if (decision === 'counter_offer') {
        // Fazer contraproposta
        await this.makeCounterOffer(offerId);
      }

    } catch (error) {
      this.logger.error('Erro ao executar decisão da IA:', error);
    }
  }

  /**
   * IA aceita uma oferta
   */
  private async acceptOffer(offerId: string): Promise<void> {
    try {
      // Buscar detalhes da oferta para processar a transferência
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        this.logger.error('Erro ao buscar oferta para transferência:', fetchError);
        return;
      }

      // Processar a transferência do jogador
      await this.processPlayerTransfer(offer);

      // Atualizar status da oferta
      const { error: updateError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'accepted',
          transfer_status: 'completed', // Mudar para 'completed' após transferência
          ai_decision: 'accepted',
          ai_decision_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (updateError) {
        this.logger.error('Erro ao atualizar status da oferta aceita:', updateError);
      } else {
        this.logger.log('Oferta aceita pela IA e transferência processada com sucesso');
      }
    } catch (error) {
      this.logger.error('Erro ao aceitar oferta:', error);
    }
  }

  /**
   * Processa a transferência do jogador para o time comprador
   */
  private async processPlayerTransfer(offer: any): Promise<void> {
    try {
      const { player_id, is_youth_player, buying_team_id, selling_team_id } = offer;

      if (is_youth_player) {
        // Transferir jogador da base
        await this.transferYouthPlayer(player_id, selling_team_id, buying_team_id);
      } else {
        // Transferir jogador profissional
        await this.transferProfessionalPlayer(player_id, selling_team_id, buying_team_id);
      }

      this.logger.log(`Jogador ${player_id} transferido com sucesso para time ${buying_team_id}`);
    } catch (error) {
      this.logger.error('Erro ao processar transferência:', error);
      throw error;
    }
  }

  /**
   * Transfere um jogador da base
   */
  private async transferYouthPlayer(playerId: string, fromTeamId: string, toTeamId: string): Promise<void> {
    try {
      // Atualizar o time do jogador
      const { error: updateError } = await supabase
        .from('youth_players')
        .update({ 
          team_id: toTeamId,
          market_status: 'none' // Resetar status de mercado
        })
        .eq('id', playerId);

      if (updateError) {
        this.logger.error('Erro ao transferir jogador da base:', updateError);
        throw updateError;
      }

      this.logger.log(`Jogador da base ${playerId} transferido de ${fromTeamId} para ${toTeamId}`);
    } catch (error) {
      this.logger.error('Erro na transferência de jogador da base:', error);
      throw error;
    }
  }

  /**
   * Transfere um jogador profissional
   */
  private async transferProfessionalPlayer(playerId: string, fromTeamId: string, toTeamId: string): Promise<void> {
    try {
      // Atualizar o time do jogador
      const { error: updateError } = await supabase
        .from('game_players')
        .update({ 
          team_id: toTeamId,
          market_status: 'none' // Resetar status de mercado
        })
        .eq('id', playerId);

      if (updateError) {
        this.logger.error('Erro ao transferir jogador profissional:', updateError);
        throw updateError;
      }

      this.logger.log(`Jogador profissional ${playerId} transferido de ${fromTeamId} para ${toTeamId}`);
    } catch (error) {
      this.logger.error('Erro na transferência de jogador profissional:', error);
      throw error;
    }
  }

  /**
   * IA rejeita uma oferta
   */
  private async rejectOffer(offerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'rejected',
          transfer_status: 'rejected', // Mudar para 'rejected' para mostrar status correto
          ai_decision: 'rejected',
          ai_decision_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (error) {
        this.logger.error('Erro ao rejeitar oferta:', error);
      } else {
        this.logger.log('Oferta rejeitada pela IA com sucesso');
      }
    } catch (error) {
      this.logger.error('Erro ao rejeitar oferta:', error);
    }
  }

  /**
   * IA faz uma contraproposta
   */
  private async makeCounterOffer(offerId: string): Promise<void> {
    try {
      // Buscar a oferta original
      const { data: offer, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !offer) {
        this.logger.error('Erro ao buscar oferta para contraproposta:', fetchError);
        return;
      }

      // Calcular contraproposta (valor médio entre oferta e listagem)
      const counterOfferPrice = Math.round((offer.offer_price + offer.listing_price) / 2);

      // Atualizar com a contraproposta
      const { error } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'counter_offer',
          transfer_status: 'counter_offer', // Mudar para 'counter_offer' para mostrar status correto
          ai_decision: 'counter_offer',
          ai_decision_at: new Date().toISOString(),
          counter_offer_price: counterOfferPrice
        })
        .eq('id', offerId);

      if (error) {
        this.logger.error('Erro ao fazer contraproposta:', error);
      } else {
        this.logger.log(`Contraproposta da IA: R$ ${counterOfferPrice}`);
      }
    } catch (error) {
      this.logger.error('Erro ao fazer contraproposta:', error);
    }
  }

  /**
   * Processar todas as ofertas pendentes da IA
   */
  async processPendingOffers(): Promise<{ processed: number; accepted: number; rejected: number; counterOffers: number }> {
    try {
      this.logger.log('Processando ofertas pendentes da IA...');

      // Buscar apenas ofertas que REALMENTE têm propostas pendentes
      // (não apenas listagens vazias da IA)
      const { data: pendingOffers, error: fetchError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('offer_status', 'pending')
        .eq('is_ai_team', true)
        .eq('ai_decision', 'pending')
        .not('buying_team_id', 'is', null) // Deve ter um time comprador
        .not('offer_price', 'is', null); // Deve ter um preço de oferta

      if (fetchError) {
        this.logger.error('Erro ao buscar ofertas pendentes:', fetchError);
        throw new Error('Could not fetch pending offers');
      }

      if (!pendingOffers || pendingOffers.length === 0) {
        this.logger.log('Nenhuma oferta pendente para processar');
        return { processed: 0, accepted: 0, rejected: 0, counterOffers: 0 };
      }

      this.logger.log(`Encontradas ${pendingOffers.length} ofertas pendentes para processar`);

      let accepted = 0;
      let rejected = 0;
      let counterOffers = 0;

      // Processar cada oferta
      for (const offer of pendingOffers) {
        try {
          this.logger.log(`Processando oferta ${offer.id}...`);
          
          // IA decide sobre a oferta
          const decision = await this.decideOnOffer(offer.id);
          
          // Executar a decisão
          await this.executeOfferDecision(offer.id, decision);
          
          // Contar resultados
          switch (decision) {
            case 'accept':
              accepted++;
              break;
            case 'reject':
              rejected++;
              break;
            case 'counter_offer':
              counterOffers++;
              break;
          }
          
          this.logger.log(`Oferta ${offer.id} processada: ${decision}`);
          
        } catch (offerError) {
          this.logger.error(`Erro ao processar oferta ${offer.id}:`, offerError);
          // Continuar com a próxima oferta
        }
      }

      const result = {
        processed: pendingOffers.length,
        accepted,
        rejected,
        counterOffers
      };

      this.logger.log('Processamento concluído:', result);
      return result;

    } catch (error) {
      this.logger.error('Erro ao processar ofertas pendentes:', error);
      throw error;
    }
  }
}
