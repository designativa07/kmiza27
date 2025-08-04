import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

// Criando instância Supabase diretamente (temporário até corrigir DI)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface PlayerAttributes {
  // Atributos Técnicos
  passing: number;
  shooting: number;
  dribbling: number;
  crossing: number;
  finishing: number;
  
  // Atributos Físicos
  speed: number;
  stamina: number;
  strength: number;
  jumping: number;
  
  // Atributos Mentais
  concentration: number;
  creativity: number;
  vision: number;
  leadership: number;
  
  // Atributos Defensivos
  defending: number;
  tackling: number;
  heading: number;
  
  // Específico Goleiro
  goalkeeping: number;
}

export interface CreatePlayerData {
  name: string;
  age: number;
  nationality?: string;
  position: string;
  alternative_positions?: string[];
  team_id?: string;
  attributes?: Partial<PlayerAttributes>;
  potential?: number;
  origin?: 'created' | 'market' | 'youth' | 'loan' | 'free_agent';
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: string;
  alternative_positions: string[];
  team_id?: string;
  team_type: string;
  
  // Atributos completos
  passing: number;
  shooting: number;
  dribbling: number;
  crossing: number;
  finishing: number;
  speed: number;
  stamina: number;
  strength: number;
  jumping: number;
  concentration: number;
  creativity: number;
  vision: number;
  leadership: number;
  defending: number;
  tackling: number;
  heading: number;
  goalkeeping: number;
  
  // Evolução
  current_ability: number;
  potential: number;
  development_rate: number;
  
  // Status
  morale: number;
  fitness: number;
  form: number;
  injury_type?: string;
  injury_severity: number;
  
  // Contrato
  contract_end_date?: string;
  salary_monthly: number;
  market_value: number;
  
  // Estatísticas
  games_played: number;
  goals_scored: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  average_rating: number;
  
  // Origem
  origin: string;
  signed_date: string;
  
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  // ===== CRIAÇÃO DE JOGADORES =====

  /**
   * Criar jogador com atributos baseados na posição
   */
  async createPlayer(playerData: CreatePlayerData): Promise<Player> {
    try {
      this.logger.log(`🏃 Criando jogador: ${playerData.name} (${playerData.position})`);

      // Gerar atributos baseados na posição se não fornecidos
      const attributes = playerData.attributes ? 
        { ...this.generateAttributesByPosition(playerData.position, playerData.age), ...playerData.attributes } :
        this.generateAttributesByPosition(playerData.position, playerData.age);
      
      // Calcular potencial se não fornecido
      const potential = playerData.potential || this.calculateInitialPotential(playerData.age, attributes);

      const newPlayer = {
        name: playerData.name,
        age: playerData.age,
        nationality: playerData.nationality || 'BRA',
        position: playerData.position,
        alternative_positions: playerData.alternative_positions || [],
        team_id: playerData.team_id || null,
        team_type: playerData.team_id ? 'first_team' : 'market',
        
        // Atributos
        ...attributes,
        
        // Evolução
        potential,
        development_rate: this.calculateDevelopmentRate(playerData.age),
        
        // Status inicial
        morale: this.randomBetween(70, 85),
        fitness: this.randomBetween(80, 95),
        form: this.randomBetween(5, 7),
        injury_type: null,
        injury_severity: 0,
        
        // Contrato inicial
        contract_end_date: playerData.team_id ? 
          new Date(Date.now() + (2 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : null,
        salary_monthly: this.calculateInitialSalary(attributes, playerData.age),
        market_value: this.calculateMarketValue(attributes, playerData.age, potential),
        
        // Estatísticas iniciais
        games_played: this.randomBetween(0, playerData.age > 20 ? 50 : 10),
        goals_scored: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        average_rating: 6.0,
        
        // Origem
        origin: playerData.origin || 'created',
        signed_date: new Date().toISOString().split('T')[0],
      };

      const { data: player, error } = await supabase
        .from('game_players')
        .insert(newPlayer)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar jogador: ${error.message}`);
      }

      this.logger.log(`✅ Jogador criado: ${player.name} (Habilidade: ${player.current_ability})`);
      return player;

    } catch (error) {
      this.logger.error('❌ Erro ao criar jogador:', error);
      throw error;
    }
  }

  /**
   * Criar plantel inicial para um time (23 jogadores)
   */
  async createInitialSquad(teamId: string): Promise<Player[]> {
    try {
      this.logger.log(`🏟️ Criando plantel inicial para time ${teamId}`);

      const squadTemplate = [
        // Goleiros (2)
        { position: 'GK', count: 2 },
        // Defensores (8)
        { position: 'CB', count: 4 },
        { position: 'LB', count: 2 },
        { position: 'RB', count: 2 },
        // Meio-campo (8)
        { position: 'CDM', count: 2 },
        { position: 'CM', count: 4 },
        { position: 'CAM', count: 2 },
        // Atacantes (5)
        { position: 'LW', count: 1 },
        { position: 'RW', count: 1 },
        { position: 'CF', count: 1 },
        { position: 'ST', count: 2 }
      ];

      const players: Player[] = [];
      
      for (const template of squadTemplate) {
        for (let i = 0; i < template.count; i++) {
          const playerData: CreatePlayerData = {
            name: this.generatePlayerName(),
            age: this.randomBetween(18, 32),
            position: template.position,
            team_id: teamId,
            nationality: this.getRandomNationality(),
            origin: 'created'
          };

          const player = await this.createPlayer(playerData);
          players.push(player);
        }
      }

      this.logger.log(`✅ Plantel criado: ${players.length} jogadores`);
      return players;

    } catch (error) {
      this.logger.error('❌ Erro ao criar plantel inicial:', error);
      throw error;
    }
  }

  // ===== BUSCA DE JOGADORES =====

  /**
   * Buscar jogadores de um time
   */
  async getTeamPlayers(teamId: string): Promise<Player[]> {
    try {
      const { data: players, error } = await supabase
        .from('game_players_detailed') // View com dados calculados
        .select('*')
        .eq('team_id', teamId)
        .eq('team_type', 'first_team')
        .order('position')
        .order('current_ability', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar jogadores: ${error.message}`);
      }

      return players || [];

    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores do time:', error);
      throw error;
    }
  }

  /**
   * Buscar jogador por ID
   */
  async getPlayerById(playerId: string): Promise<Player | null> {
    try {
      const { data: player, error } = await supabase
        .from('game_players_detailed')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar jogador: ${error.message}`);
      }

      return player;

    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogador:', error);
      throw error;
    }
  }

  // ===== SISTEMA DE EVOLUÇÃO =====

  /**
   * Evoluir jogador após partida
   */
  async evolvePlayerFromMatch(playerId: string, matchRating: number, minutesPlayed: number): Promise<void> {
    try {
      const player = await this.getPlayerById(playerId);
      if (!player) return;

      // Só evolui se jogou pelo menos 30 minutos
      if (minutesPlayed < 30) return;

      // Calcular pontos de evolução baseado em performance
      const evolutionPoints = this.calculateMatchEvolution(player, matchRating, minutesPlayed);
      
      if (evolutionPoints > 0) {
        await this.applyEvolution(player, evolutionPoints, 'game', `rating_${matchRating}`);
        this.logger.log(`🌱 ${player.name} evoluiu ${evolutionPoints.toFixed(2)} pontos (jogo)`);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao evoluir jogador por partida:', error);
    }
  }

  /**
   * Aplicar evolução semanal por treinamento
   */
  async applyWeeklyTrainingEvolution(teamId: string): Promise<void> {
    try {
      this.logger.log(`🏋️ Aplicando evolução semanal de treinamento para time ${teamId}`);

      const players = await this.getTeamPlayers(teamId);
      
      for (const player of players) {
        const evolutionPoints = this.calculateTrainingEvolution(player);
        
        if (evolutionPoints > 0) {
          await this.applyEvolution(player, evolutionPoints, 'training', 'weekly_training');
          this.logger.log(`🌱 ${player.name} evoluiu ${evolutionPoints.toFixed(2)} pontos (treino)`);
        }
      }

    } catch (error) {
      this.logger.error('❌ Erro ao aplicar evolução de treinamento:', error);
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Gerar atributos baseados na posição
   */
  private generateAttributesByPosition(position: string, age: number): PlayerAttributes {
    const baseLevel = this.randomBetween(35, 65); // Nível base do jogador
    const variation = 15; // Variação para atributos

    const attributes: PlayerAttributes = {
      passing: baseLevel,
      shooting: baseLevel,
      dribbling: baseLevel,
      crossing: baseLevel,
      finishing: baseLevel,
      speed: baseLevel,
      stamina: baseLevel,
      strength: baseLevel,
      jumping: baseLevel,
      concentration: baseLevel,
      creativity: baseLevel,
      vision: baseLevel,
      leadership: Math.max(1, baseLevel - 20 + (age - 20)), // Liderança cresce com idade
      defending: baseLevel,
      tackling: baseLevel,
      heading: baseLevel,
      goalkeeping: position === 'GK' ? baseLevel + 20 : this.randomBetween(1, 15)
    };

    // Ajustes por posição
    switch (position) {
      case 'GK':
        attributes.goalkeeping = this.randomBetween(50, 80);
        attributes.concentration = baseLevel + this.randomBetween(5, 15);
        attributes.jumping = baseLevel + this.randomBetween(0, 10);
        attributes.passing = Math.max(1, baseLevel - this.randomBetween(10, 20));
        attributes.shooting = Math.max(1, baseLevel - this.randomBetween(20, 30));
        break;

      case 'CB':
        attributes.defending = baseLevel + this.randomBetween(10, 20);
        attributes.tackling = baseLevel + this.randomBetween(5, 15);
        attributes.heading = baseLevel + this.randomBetween(10, 20);
        attributes.strength = baseLevel + this.randomBetween(5, 15);
        attributes.dribbling = Math.max(1, baseLevel - this.randomBetween(5, 15));
        break;

      case 'LB':
      case 'RB':
        attributes.speed = baseLevel + this.randomBetween(5, 15);
        attributes.stamina = baseLevel + this.randomBetween(5, 15);
        attributes.crossing = baseLevel + this.randomBetween(5, 15);
        attributes.defending = baseLevel + this.randomBetween(5, 15);
        break;

      case 'CDM':
        attributes.tackling = baseLevel + this.randomBetween(10, 20);
        attributes.defending = baseLevel + this.randomBetween(5, 15);
        attributes.passing = baseLevel + this.randomBetween(5, 15);
        attributes.concentration = baseLevel + this.randomBetween(5, 15);
        break;

      case 'CM':
        attributes.passing = baseLevel + this.randomBetween(10, 20);
        attributes.vision = baseLevel + this.randomBetween(5, 15);
        attributes.stamina = baseLevel + this.randomBetween(5, 15);
        break;

      case 'CAM':
        attributes.creativity = baseLevel + this.randomBetween(10, 20);
        attributes.passing = baseLevel + this.randomBetween(5, 15);
        attributes.vision = baseLevel + this.randomBetween(10, 20);
        attributes.shooting = baseLevel + this.randomBetween(5, 15);
        break;

      case 'LW':
      case 'RW':
        attributes.speed = baseLevel + this.randomBetween(10, 20);
        attributes.dribbling = baseLevel + this.randomBetween(10, 20);
        attributes.crossing = baseLevel + this.randomBetween(5, 15);
        break;

      case 'CF':
      case 'ST':
        attributes.shooting = baseLevel + this.randomBetween(10, 20);
        attributes.finishing = baseLevel + this.randomBetween(10, 20);
        attributes.speed = baseLevel + this.randomBetween(5, 15);
        attributes.strength = baseLevel + this.randomBetween(0, 10);
        break;
    }

    // Garantir que todos os atributos estão entre 1 e 100
    Object.keys(attributes).forEach(key => {
      attributes[key] = Math.max(1, Math.min(100, attributes[key]));
    });

    return attributes;
  }

  /**
   * Calcular potencial inicial baseado na idade e atributos
   */
  private calculateInitialPotential(age: number, attributes: PlayerAttributes): number {
    const currentAverage = Object.values(attributes).reduce((sum, val) => sum + val, 0) / Object.keys(attributes).length;
    
    // Jogadores jovens têm mais potencial de crescimento
    let potentialBonus = 0;
    if (age <= 18) potentialBonus = 25;
    else if (age <= 21) potentialBonus = 20;
    else if (age <= 24) potentialBonus = 15;
    else if (age <= 27) potentialBonus = 10;
    else potentialBonus = 5;

    const potential = Math.min(99, currentAverage + this.randomBetween(5, potentialBonus));
    return Math.round(potential);
  }

  /**
   * Calcular taxa de desenvolvimento baseada na idade
   */
  private calculateDevelopmentRate(age: number): number {
    if (age <= 18) return this.randomBetween(0.8, 1.0);
    if (age <= 21) return this.randomBetween(0.7, 0.9);
    if (age <= 24) return this.randomBetween(0.5, 0.8);
    if (age <= 27) return this.randomBetween(0.3, 0.6);
    if (age <= 30) return this.randomBetween(0.1, 0.4);
    return this.randomBetween(0.05, 0.2);
  }

  /**
   * Calcular evolução por partida
   */
  private calculateMatchEvolution(player: Player, rating: number, minutesPlayed: number): number {
    const ageFactor = this.getAgeFactor(player.age);
    const potentialFactor = Math.max(0.1, (player.potential - player.current_ability) / 50);
    const ratingFactor = (rating - 6) / 4; // Rating de 6 = neutro
    const timeFactor = Math.min(1, minutesPlayed / 90);
    
    return Math.max(0, player.development_rate * ageFactor * potentialFactor * ratingFactor * timeFactor * 0.1);
  }

  /**
   * Calcular evolução por treinamento semanal
   */
  private calculateTrainingEvolution(player: Player): number {
    const ageFactor = this.getAgeFactor(player.age);
    const potentialFactor = Math.max(0.1, (player.potential - player.current_ability) / 50);
    const moraleFactor = player.morale / 100;
    
    return Math.max(0, player.development_rate * ageFactor * potentialFactor * moraleFactor * 0.05);
  }

  /**
   * Aplicar evolução ao jogador
   */
  private async applyEvolution(
    player: Player, 
    evolutionPoints: number, 
    type: 'game' | 'training' | 'age_decline', 
    source: string
  ): Promise<void> {
    try {
      // Distribuir pontos nos atributos mais relevantes para a posição
      const attributesToImprove = this.getPositionPriorityAttributes(player.position);
      const improvements: Record<string, number> = {};

      let remainingPoints = evolutionPoints;
      
      for (const attr of attributesToImprove) {
        if (remainingPoints <= 0) break;
        
        const currentValue = player[attr];
        if (currentValue < player.potential) {
          const improvement = Math.min(remainingPoints, this.randomBetween(0.1, 0.5));
          const newValue = Math.min(player.potential, currentValue + improvement);
          
          improvements[attr] = newValue - currentValue;
          remainingPoints -= improvement;
        }
      }

      // Atualizar no banco se houve melhorias
      if (Object.keys(improvements).length > 0) {
        const updateData = {};
        Object.keys(improvements).forEach(attr => {
          updateData[attr] = player[attr] + improvements[attr];
        });

        const { error } = await supabase
          .from('game_players')
          .update(updateData)
          .eq('id', player.id);

        if (error) {
          throw new Error(`Erro ao atualizar jogador: ${error.message}`);
        }

        // Registrar evolução no log
        await this.logEvolution(player.id, improvements, type, source);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao aplicar evolução:', error);
    }
  }

  /**
   * Registrar evolução no histórico
   */
  private async logEvolution(
    playerId: string,
    attributesChanged: Record<string, number>,
    type: string,
    source: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_player_evolution_log')
        .insert({
          player_id: playerId,
          evolution_type: type,
          evolution_source: source,
          attributes_changed: attributesChanged
        });

      if (error) {
        this.logger.error('❌ Erro ao registrar evolução:', error);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao salvar log de evolução:', error);
    }
  }

  // ===== UTILITY METHODS =====

  private getAgeFactor(age: number): number {
    if (age <= 18) return 1.5;
    if (age <= 23) return 1.2;
    if (age <= 27) return 0.8;
    if (age <= 30) return 0.3;
    if (age <= 33) return 0.1;
    return 0;
  }

  private getPositionPriorityAttributes(position: string): string[] {
    const priorities = {
      'GK': ['goalkeeping', 'concentration', 'jumping', 'strength'],
      'CB': ['defending', 'tackling', 'heading', 'strength', 'concentration'],
      'LB': ['speed', 'stamina', 'crossing', 'defending', 'tackling'],
      'RB': ['speed', 'stamina', 'crossing', 'defending', 'tackling'],
      'CDM': ['tackling', 'defending', 'passing', 'concentration', 'strength'],
      'CM': ['passing', 'vision', 'stamina', 'creativity', 'concentration'],
      'CAM': ['creativity', 'passing', 'vision', 'shooting', 'dribbling'],
      'LW': ['speed', 'dribbling', 'crossing', 'creativity', 'stamina'],
      'RW': ['speed', 'dribbling', 'crossing', 'creativity', 'stamina'],
      'CF': ['shooting', 'finishing', 'creativity', 'dribbling', 'speed'],
      'ST': ['shooting', 'finishing', 'speed', 'strength', 'heading']
    };

    return priorities[position] || ['passing', 'shooting', 'speed', 'concentration'];
  }

  private calculateInitialSalary(attributes: PlayerAttributes, age: number): number {
    const averageAbility = Object.values(attributes).reduce((sum, val) => sum + val, 0) / Object.keys(attributes).length;
    const baseSalary = averageAbility * 200;
    const ageFactor = age <= 25 ? 0.8 : age <= 30 ? 1.0 : 0.7;
    
    return Math.round(baseSalary * ageFactor);
  }

  private calculateMarketValue(attributes: PlayerAttributes, age: number, potential: number): number {
    const averageAbility = Object.values(attributes).reduce((sum, val) => sum + val, 0) / Object.keys(attributes).length;
    
    let baseValue = averageAbility * 10000;
    
    // Fator idade
    if (age <= 23) baseValue *= (potential / averageAbility) * 1.2;
    else if (age <= 27) baseValue *= 1.0;
    else if (age <= 30) baseValue *= 0.7;
    else baseValue *= 0.4;

    return Math.round(baseValue);
  }

  private generatePlayerName(): string {
    const firstNames = [
      'Gabriel', 'João', 'Pedro', 'Lucas', 'Mateus', 'Rafael', 'Bruno', 'Felipe', 'Diego', 'André',
      'Carlos', 'Ricardo', 'Fernando', 'Roberto', 'Antonio', 'José', 'Paulo', 'Marco', 'Sergio', 'Luis'
    ];
    
    const lastNames = [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
      'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private getRandomNationality(): string {
    const nationalities = ['BRA', 'ARG', 'URU', 'PAR', 'COL', 'CHI', 'PER', 'BOL', 'ECU', 'VEN'];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}