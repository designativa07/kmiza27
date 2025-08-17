import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import { SimulationsService, RunSimulationRequest } from './simulations.service';

export class RunSimulationDto {
  competitionId: number;
  simulationCount: number;
}

export class SimulationProgressDto {
  progress: number;
  estimated_remaining_time_ms: number;
  current_stage: string;
}

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  /**
   * Endpoint administrativo para executar nova simulação
   * POST /simulations/run
   */
  @Post('run')
  @HttpCode(HttpStatus.ACCEPTED)
  async runSimulation(
    @Body() body: RunSimulationDto,
    @Request() req: any,
  ) {
    const request: RunSimulationRequest = {
      competitionId: body.competitionId,
      simulationCount: body.simulationCount,
      executedBy: req.user?.name || req.user?.phone_number || 'admin',
    };

    const result = await this.simulationsService.runSimulation(request);

    return {
      success: true,
      message: 'Simulação executada com sucesso',
      data: result,
    };
  }

  /**
   * Buscar simulação mais recente de uma competição
   * GET /simulations/latest/:competitionId
   */
  @Get('latest/:competitionId')
  async getLatestSimulation(@Param('competitionId', ParseIntPipe) competitionId: number) {
    const simulation = await this.simulationsService.getLatestSimulation(competitionId);

    if (!simulation) {
      return {
        success: false,
        message: 'Nenhuma simulação encontrada para esta competição',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: simulation.id,
        execution_date: simulation.execution_date,
        simulation_count: simulation.simulation_count,
        execution_duration_ms: simulation.execution_duration_ms,
        team_predictions: simulation.simulation_results,
        power_index_data: simulation.power_index_data,
      },
    };
  }

  /**
   * Buscar previsões de um time específico
   * GET /simulations/team/:teamId/predictions
   */
  @Get('team/:teamId/predictions')
  async getTeamPredictions(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('competitionId', new DefaultValuePipe(1), ParseIntPipe) competitionId: number,
  ) {
    const predictions = await this.simulationsService.getTeamPredictions(competitionId, teamId);

    if (!predictions) {
      return {
        success: false,
        message: 'Nenhuma previsão encontrada para este time',
        data: null,
      };
    }

    return {
      success: true,
      data: predictions,
    };
  }

  /**
   * Buscar chances de título de um time
   * GET /simulations/team/:teamId/title-chances
   */
  @Get('team/:teamId/title-chances')
  async getTeamTitleChances(@Param('teamId', ParseIntPipe) teamId: number) {
    const titleChances = await this.simulationsService.getTeamTitleChances(teamId);

    return {
      success: true,
      data: titleChances,
    };
  }

  /**
   * Buscar risco de rebaixamento de um time
   * GET /simulations/team/:teamId/relegation-risk
   */
  @Get('team/:teamId/relegation-risk')
  async getTeamRelegationRisk(@Param('teamId', ParseIntPipe) teamId: number) {
    const relegationRisk = await this.simulationsService.getTeamRelegationRisk(teamId);

    return {
      success: true,
      data: relegationRisk,
    };
  }

  /**
   * Buscar histórico de simulações
   * GET /simulations/history
   */
  @Get('history')
  async getSimulationHistory(
    @Query('competitionId', new DefaultValuePipe(null)) competitionId?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const history = await this.simulationsService.getSimulationHistory(competitionId, limit);

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Buscar simulação específica por ID
   * GET /simulations/:id
   */
  @Get(':id')
  async getSimulationById(@Param('id', ParseIntPipe) id: number) {
    const simulation = await this.simulationsService.getSimulationById(id);

    if (!simulation) {
      return {
        success: false,
        message: 'Simulação não encontrada',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: simulation.id,
        execution_date: simulation.execution_date,
        simulation_count: simulation.simulation_count,
        executed_by: simulation.executed_by,
        execution_duration_ms: simulation.execution_duration_ms,
        algorithm_version: simulation.algorithm_version,
        competition: simulation.competition,
        team_predictions: simulation.simulation_results,
        power_index_data: simulation.power_index_data,
        metadata: simulation.metadata,
      },
    };
  }

  /**
   * Estatísticas gerais das simulações (endpoint administrativo)
   * GET /simulations/admin/stats
   */
  @Get('admin/stats')
  async getSimulationStats() {
    const stats = await this.simulationsService.getSimulationStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Limpeza de simulações antigas (endpoint administrativo)
   * POST /simulations/admin/cleanup
   */
  @Post('admin/cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupOldSimulations(
    @Query('keepDays', new DefaultValuePipe(30), ParseIntPipe) keepDays: number,
  ) {
    const removedCount = await this.simulationsService.cleanupOldSimulations(keepDays);

    return {
      success: true,
      message: `${removedCount} simulações antigas foram removidas`,
      data: {
        removed_count: removedCount,
        keep_days: keepDays,
      },
    };
  }

  /**
   * Endpoint para validar se uma competição suporta simulações
   * GET /simulations/competition/:id/validate
   */
  @Get('competition/:id/validate')
  async validateCompetition(@Param('id', ParseIntPipe) competitionId: number) {
    const allowedCompetitions = [1, 2]; // Série A e B
    const isAllowed = allowedCompetitions.includes(competitionId);

    return {
      success: true,
      data: {
        competition_id: competitionId,
        simulation_supported: isAllowed,
        message: isAllowed 
          ? 'Competição suporta simulações' 
          : 'Simulações disponíveis apenas para Brasileirão Série A e Série B',
      },
    };
  }
}
