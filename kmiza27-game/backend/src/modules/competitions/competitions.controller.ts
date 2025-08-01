import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  // ===== COMPETIÇÕES =====

  @Get()
  async getCompetitions() {
    try {
      const competitions = await this.competitionsService.getCompetitions();
      return {
        success: true,
        data: competitions,
        message: 'Competições carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar competições',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('for-new-users')
  async getCompetitionsForNewUsers() {
    try {
      const competitions = await this.competitionsService.getCompetitionsForNewUsers();
      return {
        success: true,
        data: competitions,
        message: 'Competições para novos usuários carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar competições para novos usuários',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== PARTIDAS DIRETAS =====

  @Post('direct-matches')
  async createDirectMatch(@Body() matchData: any) {
    try {
      const match = await this.competitionsService.createDirectMatch(matchData);
      return {
        success: true,
        data: match,
        message: 'Partida direta criada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar partida direta',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('direct-matches')
  async getDirectMatches(@Query('teamId') teamId?: string, @Query('userId') userId?: string) {
    try {
      const matches = await this.competitionsService.getDirectMatches(teamId, userId);
      return {
        success: true,
        data: matches,
        message: 'Partidas diretas carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar partidas diretas',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('direct-matches/:matchId/simulate')
  async simulateDirectMatch(@Param('matchId') matchId: string) {
    try {
      const result = await this.competitionsService.simulateDirectMatch(matchId);
      return {
        success: true,
        data: result,
        message: 'Partida direta simulada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao simular partida direta',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== CONVITES =====

  @Post('invites')
  async sendMatchInvite(@Body() inviteData: any) {
    try {
      const invite = await this.competitionsService.sendMatchInvite(inviteData);
      return {
        success: true,
        data: invite,
        message: 'Convite enviado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao enviar convite',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('invites/:userId')
  async getMatchInvites(@Param('userId') userId: string) {
    try {
      const invites = await this.competitionsService.getMatchInvites(userId);
      return {
        success: true,
        data: invites,
        message: 'Convites carregados com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar convites',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('invites/:inviteId/:response')
  async respondToInvite(
    @Param('inviteId') inviteId: string,
    @Param('response') response: 'accepted' | 'declined'
  ) {
    try {
      const result = await this.competitionsService.respondToInvite(inviteId, response);
      return {
        success: true,
        data: result,
        message: `Convite ${response === 'accepted' ? 'aceito' : 'recusado'} com sucesso!`
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao responder convite',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== COMPETIÇÃO ESPECÍFICA =====

  @Get(':id')
  async getCompetitionById(@Param('id') id: string) {
    try {
      const competition = await this.competitionsService.getCompetitionById(id);
      return {
        success: true,
        data: competition,
        message: 'Competição carregada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar competição',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== INSCRIÇÕES =====

  @Post(':id/register')
  async registerTeamInCompetition(
    @Param('id') competitionId: string,
    @Body() data: { teamId: string }
  ) {
    try {
      const result = await this.competitionsService.registerTeamInCompetition(
        data.teamId,
        competitionId
      );
      return {
        success: true,
        data: result,
        message: 'Time inscrito na competição com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao inscrever time na competição',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id/unregister')
  async unregisterTeamFromCompetition(
    @Param('id') competitionId: string,
    @Body() data: { teamId: string }
  ) {
    try {
      const result = await this.competitionsService.unregisterTeamFromCompetition(
        data.teamId,
        competitionId
      );
      return {
        success: true,
        data: result,
        message: 'Time removido da competição com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao remover time da competição',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== CLASSIFICAÇÕES =====

  @Get(':id/standings')
  async getCompetitionStandings(@Param('id') competitionId: string) {
    try {
      const standings = await this.competitionsService.getCompetitionStandings(competitionId);
      return {
        success: true,
        data: standings,
        message: 'Classificação carregada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar classificação',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/standings/update')
  async updateStandings(@Param('id') competitionId: string) {
    try {
      const standings = await this.competitionsService.updateStandings(competitionId);
      return {
        success: true,
        data: standings,
        message: 'Classificação atualizada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar classificação',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== RODADAS =====

  @Get(':id/rounds')
  async getRounds(@Param('id') competitionId: string) {
    try {
      const rounds = await this.competitionsService.getRounds(competitionId);
      return {
        success: true,
        data: rounds,
        message: 'Rodadas carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar rodadas',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/rounds')
  async createRound(
    @Param('id') competitionId: string,
    @Body() data: { roundNumber: number; name: string }
  ) {
    try {
      const round = await this.competitionsService.createRound(
        competitionId,
        data.roundNumber,
        data.name
      );
      return {
        success: true,
        data: round,
        message: 'Rodada criada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar rodada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== PARTIDAS DE COMPETIÇÃO =====

  @Get(':id/matches')
  async getCompetitionMatches(@Param('id') competitionId: string) {
    try {
      const matches = await this.competitionsService.getCompetitionMatches(competitionId);
      return {
        success: true,
        data: matches,
        message: 'Partidas carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar partidas',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/matches')
  async createCompetitionMatch(
    @Param('id') competitionId: string,
    @Body() matchData: any
  ) {
    try {
      const match = await this.competitionsService.createCompetitionMatch({
        ...matchData,
        competition_id: competitionId
      });
      return {
        success: true,
        data: match,
        message: 'Partida criada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar partida',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('matches/:matchId/simulate')
  async simulateCompetitionMatch(@Param('matchId') matchId: string) {
    try {
      const result = await this.competitionsService.simulateCompetitionMatch(matchId);
      return {
        success: true,
        data: result,
        message: 'Partida simulada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao simular partida',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== SISTEMA DE TEMPORADAS =====
  
  @Get('season/status')
  async getSeasonStatus() {
    try {
      const seasonStatus = await this.competitionsService.getSeasonStatus();
      return {
        success: true,
        data: seasonStatus,
        message: 'Status da temporada carregado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar status da temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/end')
  async endSeason() {
    try {
      const result = await this.competitionsService.endSeason();
      return {
        success: true,
        data: result,
        message: 'Temporada finalizada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao finalizar temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/start')
  async startNewSeason() {
    try {
      const result = await this.competitionsService.startNewSeason();
      return {
        success: true,
        data: result,
        message: 'Nova temporada iniciada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao iniciar nova temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 