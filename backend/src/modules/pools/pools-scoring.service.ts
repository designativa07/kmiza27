import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Pool, PoolStatus } from '../../entities/pool.entity';
import { PoolPrediction } from '../../entities/pool-prediction.entity';
import { PoolParticipant } from '../../entities/pool-participant.entity';
import { Match, MatchStatus } from '../../entities/match.entity';

@Injectable()
export class PoolsScoringService {
  constructor(
    @InjectRepository(Pool)
    private poolRepository: Repository<Pool>,
    @InjectRepository(PoolPrediction)
    private poolPredictionRepository: Repository<PoolPrediction>,
    @InjectRepository(PoolParticipant)
    private poolParticipantRepository: Repository<PoolParticipant>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  /**
   * Calcula a pontuação de um palpite baseado no resultado real do jogo
   */
  calculatePredictionScore(
    prediction: {
      predicted_home_score: number;
      predicted_away_score: number;
    },
    result: {
      home_score: number;
      away_score: number;
    },
    scoringRules: {
      exact_score?: number;
      correct_result?: number;
      goal_difference?: number;
    }
  ): { points: number; type: string } {
    const {
      exact_score = 10,
      correct_result = 5,
      goal_difference = 3,
    } = scoringRules;

    // Verificar placar exato
    if (
      prediction.predicted_home_score === result.home_score &&
      prediction.predicted_away_score === result.away_score
    ) {
      return { points: exact_score, type: 'exact' };
    }

    // Calcular diferenças de gols
    const predictedDiff = prediction.predicted_home_score - prediction.predicted_away_score;
    const actualDiff = result.home_score - result.away_score;

    // Verificar se acertou a diferença de gols
    if (predictedDiff === actualDiff) {
      return { points: goal_difference, type: 'goal_difference' };
    }

    // Verificar se acertou apenas o resultado (vitória, empate, derrota)
    const predictedResult = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'draw';
    const actualResult = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw';

    if (predictedResult === actualResult) {
      return { points: correct_result, type: 'result' };
    }

    // Nenhum acerto
    return { points: 0, type: 'none' };
  }

  /**
   * Atualiza a pontuação de um palpite específico
   */
  async updatePredictionScore(predictionId: number): Promise<void> {
    const prediction = await this.poolPredictionRepository.findOne({
      where: { id: predictionId },
      relations: ['pool', 'match'],
    });

    if (!prediction) {
      return;
    }

    const match = prediction.match;
    if (match.status !== MatchStatus.FINISHED || match.home_score === null || match.away_score === null) {
      return;
    }

    const scoring = this.calculatePredictionScore(
      {
        predicted_home_score: prediction.predicted_home_score,
        predicted_away_score: prediction.predicted_away_score,
      },
      {
        home_score: match.home_score,
        away_score: match.away_score,
      },
      prediction.pool.scoring_rules
    );

    // Atualizar palpite
    await this.poolPredictionRepository.update(predictionId, {
      points_earned: scoring.points,
      prediction_type: scoring.type,
    });
  }

  /**
   * Atualiza todas as pontuações de um bolão específico
   */
  async updatePoolScoring(poolId: number): Promise<void> {
    const pool = await this.poolRepository.findOne({
      where: { id: poolId },
      relations: ['pool_matches', 'pool_matches.match'],
    });

    if (!pool) {
      return;
    }

    // Buscar todos os palpites do bolão para jogos finalizados
    const finishedMatches = pool.pool_matches
      .filter(pm => pm.match.status === MatchStatus.FINISHED)
      .map(pm => pm.match_id);

    if (finishedMatches.length === 0) {
      return;
    }

    const predictions = await this.poolPredictionRepository.find({
      where: { pool_id: poolId, match_id: finishedMatches as any },
      relations: ['match'],
    });

    // Atualizar pontuação de cada palpite
    for (const prediction of predictions) {
      if (prediction.match.home_score !== null && prediction.match.away_score !== null) {
        const scoring = this.calculatePredictionScore(
          {
            predicted_home_score: prediction.predicted_home_score,
            predicted_away_score: prediction.predicted_away_score,
          },
          {
            home_score: prediction.match.home_score,
            away_score: prediction.match.away_score,
          },
          pool.scoring_rules
        );

        await this.poolPredictionRepository.update(prediction.id, {
          points_earned: scoring.points,
          prediction_type: scoring.type,
        });
      }
    }

    // Atualizar totais dos participantes
    await this.updateParticipantsScoring(poolId);
  }

  /**
   * Atualiza a pontuação total e estatísticas dos participantes
   */
  async updateParticipantsScoring(poolId: number): Promise<void> {
    const participants = await this.poolParticipantRepository.find({
      where: { pool_id: poolId },
    });

    for (const participant of participants) {
      // Calcular estatísticas do participante
      const predictions = await this.poolPredictionRepository.find({
        where: { pool_id: poolId, user_id: participant.user_id },
      });

      const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      const predictionsCount = predictions.length;
      const exactPredictions = predictions.filter(p => p.prediction_type === 'exact').length;
      const correctResults = predictions.filter(p => 
        ['exact', 'result', 'goal_difference'].includes(p.prediction_type)
      ).length;

      await this.poolParticipantRepository.update(participant.id, {
        total_points: totalPoints,
        predictions_count: predictionsCount,
        exact_predictions: exactPredictions,
        correct_results: correctResults,
      });
    }

    // Atualizar posições no ranking
    await this.updateRankingPositions(poolId);
  }

  /**
   * Atualiza as posições no ranking do bolão
   */
  async updateRankingPositions(poolId: number): Promise<void> {
    const participants = await this.poolParticipantRepository.find({
      where: { pool_id: poolId },
      order: {
        total_points: 'DESC',
        exact_predictions: 'DESC',
        correct_results: 'DESC',
        joined_at: 'ASC', // Em caso de empate, quem entrou primeiro fica à frente
      },
    });

    for (let i = 0; i < participants.length; i++) {
      await this.poolParticipantRepository.update(participants[i].id, {
        ranking_position: i + 1,
      });
    }
  }

  /**
   * Atualiza bolões para status 'finished' quando apropriado
   */
  async checkAndFinishPools(): Promise<void> {
    const openPools = await this.poolRepository.find({
      where: { status: PoolStatus.OPEN },
      relations: ['pool_matches', 'pool_matches.match'],
    });

    for (const pool of openPools) {
      const allMatches = pool.pool_matches.map(pm => pm.match);
      const finishedMatches = allMatches.filter(m => m.status === MatchStatus.FINISHED);

      // Se todos os jogos do bolão foram finalizados
      if (allMatches.length > 0 && finishedMatches.length === allMatches.length) {
        await this.poolRepository.update(pool.id, { status: PoolStatus.FINISHED });
        
        // Atualizar pontuação final
        await this.updatePoolScoring(pool.id);
      }
    }
  }

  /**
   * Cron job para atualizar pontuações automaticamente
   * Executa a cada 30 minutos
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async automaticScoringUpdate(): Promise<void> {
    try {
      console.log('Iniciando atualização automática de pontuações dos bolões...');

      const activePools = await this.poolRepository.find({
        where: [
          { status: PoolStatus.OPEN },
          { status: PoolStatus.CLOSED },
        ],
      });

      for (const pool of activePools) {
        await this.updatePoolScoring(pool.id);
      }

      await this.checkAndFinishPools();

      console.log(`Atualização de pontuações concluída para ${activePools.length} bolões`);
    } catch (error) {
      console.error('Erro na atualização automática de pontuações:', error);
    }
  }

  /**
   * Força atualização manual de um bolão específico
   */
  async forceUpdatePool(poolId: number): Promise<void> {
    await this.updatePoolScoring(poolId);
    await this.checkAndFinishPools();
  }

  /**
   * Retorna estatísticas detalhadas de um bolão
   */
  async getPoolStatistics(poolId: number): Promise<any> {
    const pool = await this.poolRepository.findOne({
      where: { id: poolId },
      relations: ['participants', 'pool_matches'],
    });

    if (!pool) {
      throw new Error('Bolão não encontrado');
    }

    const predictions = await this.poolPredictionRepository.find({
      where: { pool_id: poolId },
    });

    const totalPredictions = predictions.length;
    const exactPredictions = predictions.filter(p => p.prediction_type === 'exact').length;
    const correctResults = predictions.filter(p => 
      ['exact', 'result', 'goal_difference'].includes(p.prediction_type)
    ).length;

    const averagePoints = totalPredictions > 0 
      ? predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0) / predictions.length 
      : 0;

    return {
      pool_id: poolId,
      participants_count: pool.participants.length,
      matches_count: pool.pool_matches.length,
      total_predictions: totalPredictions,
      exact_predictions: exactPredictions,
      correct_results: correctResults,
      average_points: Math.round(averagePoints * 100) / 100,
      exactness_rate: totalPredictions > 0 ? (exactPredictions / totalPredictions) * 100 : 0,
      accuracy_rate: totalPredictions > 0 ? (correctResults / totalPredictions) * 100 : 0,
    };
  }
}