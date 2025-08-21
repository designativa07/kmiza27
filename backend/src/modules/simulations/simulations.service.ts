import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SimulationResult, SimulationMetadata, TeamPrediction, PowerIndexEntry } from '../../entities/simulation-result.entity';
import { Competition } from '../../entities/competition.entity';
import { PowerIndexService, PowerIndexConfig } from './power-index.service';
import { MonteCarloService } from './monte-carlo.service';

export interface RunSimulationRequest {
  competitionId: number;
  simulationCount: number;
  executedBy: string;
  powerIndexConfig?: PowerIndexConfig;
}

export interface RunSimulationResponse {
  id: number;
  execution_date: Date;
  simulation_count: number;
  execution_duration_ms: number;
  team_predictions: TeamPrediction[];
  power_index_data: PowerIndexEntry[];
}

export interface SimulationHistoryEntry {
  id: number;
  execution_date: Date;
  simulation_count: number;
  executed_by: string;
  execution_duration_ms: number;
  algorithm_version: string;
  is_latest: boolean;
}

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    @InjectRepository(SimulationResult)
    private readonly simulationRepository: Repository<SimulationResult>,
    @InjectRepository(Competition)
    private readonly competitionRepository: Repository<Competition>,
    private readonly powerIndexService: PowerIndexService,
    private readonly monteCarloService: MonteCarloService,
  ) {}

  /**
   * Executa uma nova simulação Monte Carlo
   */
  async runSimulation(request: RunSimulationRequest): Promise<RunSimulationResponse> {
    const startTime = Date.now();
    
    this.logger.log(`Iniciando simulação para competição ${request.competitionId} com ${request.simulationCount} iterações`);

    // Validar entrada
    await this.validateSimulationRequest(request);

    // 1. Buscar dados da competição
    const competition = await this.competitionRepository.findOne({
      where: { id: request.competitionId },
    });

    if (!competition) {
      throw new NotFoundException(`Competição com ID ${request.competitionId} não encontrada`);
    }

    // 2. Calcular Power Index atual
    const powerIndexConfig = request.powerIndexConfig || this.powerIndexService.getDefaultConfig();
    const powerIndexData = await this.powerIndexService.calculatePowerIndexForCompetition(
      request.competitionId,
      powerIndexConfig,
    );

    this.logger.log(`Power Index calculado para ${powerIndexData.length} times`);

    // 3. Executar simulação Monte Carlo
    const monteCarloResult = await this.monteCarloService.runSimulation(
      request.competitionId,
      powerIndexData,
      request.simulationCount,
    );

    // 4. Preparar metadados
    const executionDuration = Date.now() - startTime;
    const metadata: SimulationMetadata = {
      execution_duration_ms: executionDuration,
      simulation_count: request.simulationCount,
      executed_by: request.executedBy,
      algorithm_version: powerIndexConfig.version,
      power_index_weights: powerIndexConfig.weights,
    };

    // 5. Salvar resultado no banco
    const simulationResult = this.simulationRepository.create({
      competitionId: request.competitionId,
      simulationCount: request.simulationCount,
      executedBy: request.executedBy,
      isLatest: true, // O trigger do banco vai desmarcar outras simulações
      powerIndexData: powerIndexData,
      simulationResults: monteCarloResult.predictions,
      metadata,
      executionDurationMs: executionDuration,
      algorithmVersion: powerIndexConfig.version,
    });

    const savedResult = await this.simulationRepository.save(simulationResult);

    this.logger.log(`Simulação ${savedResult.id} salva com sucesso. Duração: ${executionDuration}ms`);

    // 6. Limpeza automática de simulações antigas (manter apenas as últimas 5 por competição)
    await this.cleanupOldSimulationsByCompetition(request.competitionId);

    return {
      id: savedResult.id,
      execution_date: savedResult.executionDate,
      simulation_count: savedResult.simulationCount,
      execution_duration_ms: savedResult.executionDurationMs,
      team_predictions: savedResult.simulationResults,
      power_index_data: savedResult.powerIndexData,
    };
  }

  /**
   * Busca a simulação mais recente de uma competição
   */
  async getLatestSimulation(competitionId: number): Promise<SimulationResult | null> {
    return await this.simulationRepository.findOne({
      where: {
        competitionId: competitionId,
        isLatest: true,
      },
      relations: ['competition'],
    });
  }

  /**
   * Busca previsões de um time específico na simulação mais recente
   */
  async getTeamPredictions(competitionId: number, teamId: number): Promise<TeamPrediction | null> {
    const latestSimulation = await this.getLatestSimulation(competitionId);
    
    if (!latestSimulation) {
      return null;
    }

    return latestSimulation.getTeamPrediction(teamId);
  }

  /**
   * Busca chances de título de um time
   */
  async getTeamTitleChances(teamId: number): Promise<{ title_probability: number; competition: string } | null> {
    // Buscar em todas as competições (Série A e B)
    const competitions = [1, 2]; // IDs do Brasileirão Série A e B
    
    for (const competitionId of competitions) {
      const prediction = await this.getTeamPredictions(competitionId, teamId);
      if (prediction) {
        const competition = await this.competitionRepository.findOne({ where: { id: competitionId } });
        return {
          title_probability: prediction.title_probability,
          competition: competition?.name || 'Desconhecida',
        };
      }
    }

    return null;
  }

  /**
   * Busca risco de rebaixamento de um time
   */
  async getTeamRelegationRisk(teamId: number): Promise<{ relegation_probability: number; competition: string } | null> {
    // Buscar em todas as competições (Série A e B)
    const competitions = [1, 2]; // IDs do Brasileirão Série A e B
    
    for (const competitionId of competitions) {
      const prediction = await this.getTeamPredictions(competitionId, teamId);
      if (prediction) {
        const competition = await this.competitionRepository.findOne({ where: { id: competitionId } });
        return {
          relegation_probability: prediction.relegation_probability,
          competition: competition?.name || 'Desconhecida',
        };
      }
    }

    return null;
  }

  /**
   * Busca histórico de simulações
   */
  async getSimulationHistory(
    competitionId?: number,
    limit: number = 20,
  ): Promise<SimulationHistoryEntry[]> {
    const queryBuilder = this.simulationRepository
      .createQueryBuilder('simulation')
      .leftJoinAndSelect('simulation.competition', 'competition')
      .select([
        'simulation.id',
        'simulation.executionDate',
        'simulation.simulationCount',
        'simulation.executedBy',
        'simulation.executionDurationMs',
        'simulation.algorithmVersion',
        'simulation.isLatest',
        'competition.name',
      ])
      .orderBy('simulation.executionDate', 'DESC')
      .limit(limit);

    if (competitionId) {
      queryBuilder.where('competition.id = :competitionId', { competitionId });
    }

    const results = await queryBuilder.getMany();

    return results.map(result => ({
      id: result.id,
      execution_date: result.executionDate,
      simulation_count: result.simulationCount,
      executed_by: result.executedBy,
      execution_duration_ms: result.executionDurationMs,
      algorithm_version: result.algorithmVersion,
      is_latest: result.isLatest,
    }));
  }

  /**
   * Busca uma simulação específica por ID
   */
  async getSimulationById(simulationId: number): Promise<SimulationResult | null> {
    return await this.simulationRepository.findOne({
      where: { id: simulationId },
      relations: ['competition'],
    });
  }

  /**
   * Remove simulações antigas para economizar espaço
   */
  async cleanupOldSimulations(keepDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const result = await this.simulationRepository
      .createQueryBuilder()
      .delete()
      .where('executionDate < :cutoffDate', { cutoffDate })
      .andWhere('isLatest = false') // Nunca remover a simulação mais recente
      .execute();

    this.logger.log(`Removidas ${result.affected} simulações antigas (mais de ${keepDays} dias)`);
    return result.affected || 0;
  }

  /**
   * Remove simulações antigas de uma competição específica, mantendo apenas as últimas 5
   */
  async cleanupOldSimulationsByCompetition(competitionId: number): Promise<number> {
    // Buscar IDs das simulações mais recentes para manter
    const keepSimulations = await this.simulationRepository
      .createQueryBuilder('simulation')
      .select('simulation.id')
      .where('simulation.competitionId = :competitionId', { competitionId })
      .orderBy('simulation.executionDate', 'DESC')
      .limit(5)
      .getMany();

    const keepIds = keepSimulations.map(s => s.id);

    if (keepIds.length === 0) {
      return 0;
    }

    // Remover simulações antigas (exceto as que devem ser mantidas)
    const result = await this.simulationRepository
      .createQueryBuilder()
      .delete()
      .where('competitionId = :competitionId', { competitionId })
      .andWhere('id NOT IN (:...keepIds)', { keepIds })
      .execute();

    this.logger.log(`Removidas ${result.affected} simulações antigas da competição ${competitionId}. Mantidas: ${keepIds.length}`);
    return result.affected || 0;
  }

  /**
   * Estatísticas gerais das simulações
   */
  async getSimulationStats(): Promise<{
    total_simulations: number;
    latest_execution: Date | null;
    competitions_with_simulations: number;
    average_execution_time_ms: number;
  }> {
    const totalSimulations = await this.simulationRepository.count();
    
    const latestSimulation = await this.simulationRepository
      .createQueryBuilder('simulation')
      .orderBy('simulation.executionDate', 'DESC')
      .limit(1)
      .getOne();

    // Corrigido: sempre retornar 2 competições (Série A e Série B)
    // Não contar registros únicos, pois cada simulação tem competition_id
    const competitionsCount = 2; // Brasileirão Série A e Série B

    const avgExecutionTime = await this.simulationRepository
      .createQueryBuilder('simulation')
      .select('AVG(simulation.executionDurationMs)', 'avg')
      .getRawOne();

    return {
      total_simulations: totalSimulations,
      latest_execution: latestSimulation?.executionDate || null,
      competitions_with_simulations: competitionsCount,
      average_execution_time_ms: Math.round(avgExecutionTime?.avg || 0),
    };
  }

  /**
   * Valida os dados de entrada para uma simulação
   */
  private async validateSimulationRequest(request: RunSimulationRequest): Promise<void> {
    // Validar competição
    if (!request.competitionId || request.competitionId <= 0) {
      throw new BadRequestException('ID da competição deve ser um número positivo');
    }

    // Validar número de simulações
    if (!request.simulationCount || request.simulationCount < 1 || request.simulationCount > 10000) {
      throw new BadRequestException('Número de simulações deve estar entre 1 e 10.000');
    }

    // Validar usuário
    if (!request.executedBy || request.executedBy.trim().length === 0) {
      throw new BadRequestException('Campo executedBy é obrigatório');
    }

    // Verificar se a competição existe
    const competition = await this.competitionRepository.findOne({
      where: { id: request.competitionId },
    });

    if (!competition) {
      throw new NotFoundException(`Competição com ID ${request.competitionId} não encontrada`);
    }

    // Verificar se é Brasileirão Série A ou B
    const allowedCompetitions = [1, 2]; // IDs das competições permitidas
    if (!allowedCompetitions.includes(request.competitionId)) {
      throw new BadRequestException('Simulações só são permitidas para Brasileirão Série A e Série B');
    }
  }

  /**
   * Exclui uma simulação específica
   */
  async deleteSimulation(simulationId: number): Promise<void> {
    const simulation = await this.simulationRepository.findOne({
      where: { id: simulationId },
      relations: ['competition'],
    });

    if (!simulation) {
      throw new NotFoundException(`Simulação com ID ${simulationId} não encontrada`);
    }

    // Não permitir exclusão da simulação mais recente
    if (simulation.isLatest) {
      throw new BadRequestException('Não é possível excluir a simulação mais recente');
    }

    // Não permitir exclusão de simulações marcadas como importantes
    if (simulation.isImportant) {
      throw new BadRequestException('Não é possível excluir simulações marcadas como importantes');
    }

    await this.simulationRepository.remove(simulation);
    this.logger.log(`Simulação ${simulationId} excluída com sucesso`);
  }

  /**
   * Exclui múltiplas simulações
   */
  async deleteMultipleSimulations(simulationIds: number[]): Promise<number> {
    if (!simulationIds || simulationIds.length === 0) {
      throw new BadRequestException('Lista de IDs de simulação é obrigatória');
    }

    // Buscar simulações para validação
    const simulations = await this.simulationRepository.findBy({
      id: In(simulationIds)
    });

    if (simulations.length === 0) {
      throw new NotFoundException('Nenhuma simulação encontrada com os IDs fornecidos');
    }

    // Validar que nenhuma é a mais recente ou importante
    const invalidSimulations = simulations.filter(s => s.isLatest || s.isImportant);
    if (invalidSimulations.length > 0) {
      const invalidIds = invalidSimulations.map(s => s.id);
      throw new BadRequestException(
        `Não é possível excluir simulações ${invalidIds.join(', ')}: são recentes ou importantes`
      );
    }

    // Excluir simulações
    const result = await this.simulationRepository.remove(simulations);
    this.logger.log(`${result.length} simulações excluídas com sucesso`);

    return result.length;
  }
}
