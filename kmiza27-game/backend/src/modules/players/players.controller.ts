import { Controller, Get, Post, Put, Delete, Query, Body, Param, Logger } from '@nestjs/common';
import { PlayersService, CreatePlayerData, Player } from './players.service';

@Controller('players')
export class PlayersController {
  private readonly logger = new Logger(PlayersController.name);

  constructor(private readonly playersService: PlayersService) {}

  /**
   * Criar jogador individual
   * POST /api/v2/players/create
   */
  @Post('create')
  async createPlayer(@Body() createPlayerData: CreatePlayerData) {
    try {
      this.logger.log(`🏃 Criando jogador: ${createPlayerData.name}`);
      
      const player = await this.playersService.createPlayer(createPlayerData);
      
      return {
        success: true,
        data: player,
        message: `Jogador ${player.name} criado com sucesso!`
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar jogador:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar jogadores via query param (compatibilidade do frontend)
   * GET /api/v2/players?teamId=...
   */
  @Get()
  async getPlayersByQuery(@Query('teamId') teamId?: string) {
    try {
      if (!teamId) {
        return { success: false, error: 'teamId é obrigatório', data: [] };
      }
      const players = await this.playersService.getTeamPlayers(teamId);
      return { success: true, data: players, count: players.length };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores (query):', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Criar plantel inicial para um time
   * POST /api/v2/players/create-squad
   */
  @Post('create-squad')
  async createInitialSquad(@Body() { teamId }: { teamId: string }) {
    try {
      this.logger.log(`🏟️ Criando plantel para time ${teamId}`);
      
      const players = await this.playersService.createInitialSquad(teamId);
      
      return {
        success: true,
        data: players,
        message: `Plantel criado com ${players.length} jogadores!`
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar plantel:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar jogadores de um time
   * GET /api/v2/players/team/:teamId
   */
  @Get('team/:teamId')
  async getTeamPlayers(@Param('teamId') teamId: string) {
    try {
      this.logger.log(`🔍 Buscando jogadores do time ${teamId}`);
      
      const players = await this.playersService.getTeamPlayers(teamId);
      
      return {
        success: true,
        data: players,
        count: players.length
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar jogador específico
   * GET /api/v2/players/:playerId
   */
  @Get(':playerId')
  async getPlayer(@Param('playerId') playerId: string) {
    try {
      this.logger.log(`🔍 Buscando jogador ${playerId}`);
      
      const player = await this.playersService.getPlayerById(playerId);
      
      if (!player) {
        return {
          success: false,
          error: 'Jogador não encontrado',
          data: null
        };
      }
      
      return {
        success: true,
        data: player
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogador:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Evoluir jogador após partida
   * POST /api/v2/players/:playerId/evolve-match
   */
  @Post(':playerId/evolve-match')
  async evolveFromMatch(
    @Param('playerId') playerId: string,
    @Body() { matchRating, minutesPlayed }: { matchRating: number, minutesPlayed: number }
  ) {
    try {
      this.logger.log(`🌱 Evoluindo jogador ${playerId} após partida (rating: ${matchRating})`);
      
      await this.playersService.evolvePlayerFromMatch(playerId, matchRating, minutesPlayed);
      
      return {
        success: true,
        message: 'Evolução por partida aplicada'
      };
    } catch (error) {
      this.logger.error('❌ Erro ao evoluir jogador:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Aplicar evolução semanal de treinamento
   * POST /api/v2/players/training-evolution/:teamId
   */
  @Post('training-evolution/:teamId')
  async applyTrainingEvolution(@Param('teamId') teamId: string) {
    try {
      this.logger.log(`🏋️ Aplicando evolução de treinamento para time ${teamId}`);
      
      await this.playersService.applyWeeklyTrainingEvolution(teamId);
      
      return {
        success: true,
        message: 'Evolução semanal de treinamento aplicada'
      };
    } catch (error) {
      this.logger.error('❌ Erro ao aplicar evolução de treinamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar estatísticas do plantel
   * GET /api/v2/players/squad-stats/:teamId
   */
  @Get('squad-stats/:teamId')
  async getSquadStats(@Param('teamId') teamId: string) {
    try {
      this.logger.log(`📊 Buscando estatísticas do plantel ${teamId}`);
      
      const players = await this.playersService.getTeamPlayers(teamId);
      
      if (players.length === 0) {
        return {
          success: false,
          error: 'Nenhum jogador encontrado',
          data: null
        };
      }

      // Calcular estatísticas do plantel
      const stats = {
        total_players: players.length,
        average_age: Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length),
        average_ability: Math.round(players.reduce((sum, p) => sum + p.current_ability, 0) / players.length),
        average_potential: Math.round(players.reduce((sum, p) => sum + p.potential, 0) / players.length),
        average_morale: Math.round(players.reduce((sum, p) => sum + p.morale, 0) / players.length),
        average_fitness: Math.round(players.reduce((sum, p) => sum + p.fitness, 0) / players.length),
        total_market_value: players.reduce((sum, p) => sum + p.market_value, 0),
        total_salary: players.reduce((sum, p) => sum + p.salary_monthly, 0),
        injured_players: players.filter(p => p.injury_type).length,
        
        // Distribuição por posição
        by_position: players.reduce((acc, player) => {
          acc[player.position] = (acc[player.position] || 0) + 1;
          return acc;
        }, {}),
        
        // Top 5 jogadores por habilidade
        top_players: players
          .sort((a, b) => b.current_ability - a.current_ability)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            name: p.name,
            position: p.position,
            ability: p.current_ability,
            age: p.age
          }))
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar estatísticas do plantel:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar histórico de evolução de um jogador
   * GET /api/v2/players/:playerId/evolution-history
   */
  @Get(':playerId/evolution-history')
  async getEvolutionHistory(@Param('playerId') playerId: string) {
    try {
      this.logger.log(`📈 Buscando histórico de evolução do jogador ${playerId}`);
      
      // Implementar busca no banco quando a tabela estiver criada
      // Por enquanto retorna mock
      const mockHistory = [
        {
          id: '1',
          evolution_type: 'training',
          evolution_source: 'weekly_training',
          attributes_changed: { passing: 0.5, vision: 0.3 },
          created_at: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        data: mockHistory
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar histórico de evolução:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Status da API de jogadores
   * GET /api/v2/players/status
   */
  @Get('status')
  async getApiStatus() {
    return {
      success: true,
      data: {
        module: 'players',
        version: '1.0.0',
        system: 'elifoot_inspired',
        features: [
          'Criação de jogadores com atributos realistas',
          'Sistema de evolução por jogos e treinamento',
          'Gestão completa de plantel',
          'Cálculo automático de habilidades',
          'Histórico de evolução',
          'Estatísticas detalhadas'
        ]
      },
      message: 'Sistema de jogadores estilo Elifoot funcionando!'
    };
  }
}