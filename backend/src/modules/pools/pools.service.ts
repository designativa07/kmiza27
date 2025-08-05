import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner, DataSource } from 'typeorm';

import { Pool, PoolType, PoolStatus } from '../../entities/pool.entity';
import { PoolMatch } from '../../entities/pool-match.entity';
import { PoolParticipant } from '../../entities/pool-participant.entity';
import { PoolPrediction } from '../../entities/pool-prediction.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { Round } from '../../entities/round.entity';
import { CreatePoolDto } from './dto/create-pool.dto';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(Pool)
    private poolRepository: Repository<Pool>,
    @InjectRepository(PoolMatch)
    private poolMatchRepository: Repository<PoolMatch>,
    @InjectRepository(PoolParticipant)
    private poolParticipantRepository: Repository<PoolParticipant>,
    @InjectRepository(PoolPrediction)
    private poolPredictionRepository: Repository<PoolPrediction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    private dataSource: DataSource,
  ) {}

  // CRUD básico para administração
  async create(createPoolDto: CreatePoolDto, creatorUserId: number): Promise<Pool> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validações
      if (!createPoolDto.name || createPoolDto.name.trim() === '') {
        throw new BadRequestException('Nome do bolão é obrigatório');
      }

      if (createPoolDto.type === PoolType.ROUND && !createPoolDto.round_id) {
        throw new BadRequestException('Round ID é obrigatório para bolões de rodada');
      }

      if (createPoolDto.type === PoolType.CUSTOM && (!createPoolDto.match_ids || createPoolDto.match_ids.length === 0)) {
        throw new BadRequestException('Pelo menos um jogo deve ser selecionado para bolões personalizados');
      }

      // Verificar se usuário existe e é admin
      const creator = await this.userRepository.findOne({ where: { id: creatorUserId } });
      
      if (!creator || !creator.is_admin) {
        throw new ForbiddenException('Apenas administradores podem criar bolões');
      }

      // Criar o bolão
      const pool = this.poolRepository.create({
        name: createPoolDto.name,
        description: createPoolDto.description,
        type: createPoolDto.type,
        round_id: createPoolDto.round_id,
        created_by_user_id: creatorUserId,
        start_date: createPoolDto.start_date,
        end_date: createPoolDto.end_date,
        scoring_rules: createPoolDto.scoring_rules || {
          exact_score: 10,
          correct_result: 5,
          goal_difference: 3,
        },
        settings: {
          public: createPoolDto.is_public || false,
          max_participants: undefined,
        },
        status: PoolStatus.DRAFT,
      });

      const savedPool = await queryRunner.manager.save(Pool, pool);

      // Adicionar jogos ao bolão
      if (createPoolDto.type === PoolType.ROUND) {
        // Buscar todos os jogos da rodada
        const roundMatches = await this.matchRepository.find({
          where: { round: { id: createPoolDto.round_id } },
          order: { match_date: 'ASC' },
          relations: ['round'],
        });

        if (roundMatches.length === 0) {
          throw new BadRequestException('Nenhum jogo encontrado para esta rodada');
        }

        const poolMatches = roundMatches.map((match, index) => ({
          pool_id: savedPool.id,
          match_id: match.id,
          order_index: index,
        }));

        await queryRunner.manager.save(PoolMatch, poolMatches);
      } else {
        // Bolão personalizado
        if (!createPoolDto.match_ids || createPoolDto.match_ids.length === 0) {
          throw new BadRequestException('Pelo menos um jogo deve ser selecionado para bolões personalizados');
        }

        const matches = await this.matchRepository.find({
          where: { id: In(createPoolDto.match_ids) },
        });

        if (matches.length !== createPoolDto.match_ids.length) {
          throw new BadRequestException('Alguns jogos selecionados não foram encontrados');
        }

        const poolMatches = createPoolDto.match_ids.map((matchId, index) => ({
          pool_id: savedPool.id,
          match_id: matchId,
          order_index: index,
        }));

        await queryRunner.manager.save(PoolMatch, poolMatches);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(savedPool.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: {
    status?: PoolStatus;
    type?: PoolType;
    userId?: number;
    includeParticipants?: boolean;
    publicOnly?: boolean;
  }): Promise<Pool[]> {
    const query = this.poolRepository.createQueryBuilder('pool')
      .leftJoinAndSelect('pool.creator', 'creator')
      .leftJoinAndSelect('pool.round', 'round')
      .leftJoinAndSelect('round.competition', 'round_competition')
      .leftJoinAndSelect('pool.pool_matches', 'pool_matches')
      .leftJoinAndSelect('pool_matches.match', 'match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.competition', 'competition');

    // Incluir participantes se solicitado
    if (filters?.includeParticipants) {
      query.leftJoinAndSelect('pool.participants', 'participants')
           .leftJoinAndSelect('participants.user', 'participant_user');
    }

    if (filters?.status) {
      query.andWhere('pool.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('pool.type = :type', { type: filters.type });
    }

    if (filters?.userId) {
      // Filtrar bolões que o usuário participa
      query.innerJoin('pool.participants', 'participant')
        .andWhere('participant.user_id = :userId', { userId: filters.userId });
    }

    // Filtrar apenas bolões públicos se solicitado
    if (filters?.publicOnly) {
      query.andWhere("pool.settings->>'public' = 'true'");
    }

    return query.orderBy('pool.created_at', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Pool> {
    // Primeiro buscar o bolão sem participantes
    const pool = await this.poolRepository.createQueryBuilder('pool')
      .leftJoinAndSelect('pool.creator', 'creator')
      .leftJoinAndSelect('pool.round', 'round')
      .leftJoinAndSelect('round.competition', 'round_competition')
      .leftJoinAndSelect('pool.pool_matches', 'pool_matches')
      .leftJoinAndSelect('pool_matches.match', 'match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.competition', 'competition')
      .where('pool.id = :id', { id })
      .getOne();

    if (!pool) {
      throw new NotFoundException('Bolão não encontrado');
    }

    // Depois buscar os participantes separadamente
    const participants = await this.poolParticipantRepository.find({
      where: { pool_id: id },
      relations: ['user'],
      order: { ranking_position: 'ASC' }
    });

    pool.participants = participants;

    return pool;
  }

  async update(id: number, updatePoolDto: Partial<Pool>, userId: number): Promise<Pool> {
    const pool = await this.findOne(id);

    // Verificar permissões
    if (pool.created_by_user_id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.is_admin) {
        throw new ForbiddenException('Apenas o criador ou administradores podem editar este bolão');
      }
    }

    // Não permitir alterações se já há participantes e o bolão não está em rascunho
    if (pool.status !== PoolStatus.DRAFT && pool.participants.length > 0) {
      throw new BadRequestException('Não é possível editar um bolão que já possui participantes');
    }

    await this.poolRepository.update(id, updatePoolDto);
    return this.findOne(id);
  }

  async delete(id: number, userId: number): Promise<void> {
    const pool = await this.findOne(id);

    // Verificar permissões
    if (pool.created_by_user_id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.is_admin) {
        throw new ForbiddenException('Apenas o criador ou administradores podem excluir este bolão');
      }
    }

    await this.poolRepository.delete(id);
  }

  // Gerenciamento de participantes
  async joinPool(poolId: number, userId: number): Promise<PoolParticipant> {
    const pool = await this.findOne(poolId);

    // Verificações
    if (pool.status !== PoolStatus.OPEN) {
      throw new BadRequestException('Este bolão não está aberto para participação');
    }

    if (pool.settings?.max_participants && pool.participants.length >= pool.settings.max_participants) {
      throw new BadRequestException('Bolão lotado');
    }

    // Verificar se já participa
    const existing = await this.poolParticipantRepository.findOne({
      where: { pool_id: poolId, user_id: userId },
    });

    if (existing) {
      throw new BadRequestException('Usuário já participa deste bolão');
    }

    const participant = this.poolParticipantRepository.create({
      pool_id: poolId,
      user_id: userId,
    });

    return this.poolParticipantRepository.save(participant);
  }

  async leavePool(poolId: number, userId: number): Promise<void> {
    const participant = await this.poolParticipantRepository.findOne({
      where: { pool_id: poolId, user_id: userId },
    });

    if (!participant) {
      throw new NotFoundException('Usuário não participa deste bolão');
    }

    // Verificar se já fez palpites
    const predictions = await this.poolPredictionRepository.count({
      where: { pool_id: poolId, user_id: userId },
    });

    if (predictions > 0) {
      throw new BadRequestException('Não é possível sair de um bolão após fazer palpites');
    }

    await this.poolParticipantRepository.delete(participant.id);
  }

  // Palpites
  async makePrediction(predictionDto: {
    pool_id: number;
    match_id: number;
    predicted_home_score: number;
    predicted_away_score: number;
  }, userId: number): Promise<PoolPrediction> {
    const pool = await this.findOne(predictionDto.pool_id);

    // Verificações
    if (pool.status !== PoolStatus.OPEN) {
      throw new BadRequestException('Bolão não está aberto para palpites');
    }

    if (pool.prediction_deadline && new Date() > pool.prediction_deadline) {
      throw new BadRequestException('Prazo para palpites expirado');
    }

    // Verificar se usuário participa do bolão
    const participant = await this.poolParticipantRepository.findOne({
      where: { pool_id: predictionDto.pool_id, user_id: userId },
    });

    if (!participant) {
      throw new BadRequestException('Usuário não participa deste bolão');
    }

    // Verificar se o jogo faz parte do bolão
    const poolMatch = await this.poolMatchRepository.findOne({
      where: { pool_id: predictionDto.pool_id, match_id: predictionDto.match_id },
    });

    if (!poolMatch) {
      throw new BadRequestException('Este jogo não faz parte do bolão');
    }

    // Verificar se o jogo ainda não começou
    const match = await this.matchRepository.findOne({
      where: { id: predictionDto.match_id },
    });

    if (!match) {
      throw new NotFoundException('Jogo não encontrado');
    }

    if (new Date() >= match.match_date) {
      throw new BadRequestException('Não é possível fazer palpites para jogos que já começaram');
    }

    // Criar ou atualizar palpite
    let prediction = await this.poolPredictionRepository.findOne({
      where: {
        pool_id: predictionDto.pool_id,
        user_id: userId,
        match_id: predictionDto.match_id,
      },
    });

    if (prediction) {
      // Atualizar palpite existente
      prediction.predicted_home_score = predictionDto.predicted_home_score;
      prediction.predicted_away_score = predictionDto.predicted_away_score;
      prediction.updated_at = new Date();
    } else {
      // Criar novo palpite
      prediction = this.poolPredictionRepository.create({
        pool_id: predictionDto.pool_id,
        user_id: userId,
        match_id: predictionDto.match_id,
        predicted_home_score: predictionDto.predicted_home_score,
        predicted_away_score: predictionDto.predicted_away_score,
      });
    }

    return this.poolPredictionRepository.save(prediction);
  }

  async getUserPredictions(poolId: number, userId: number): Promise<PoolPrediction[]> {
    return this.poolPredictionRepository.find({
      where: { pool_id: poolId, user_id: userId },
      relations: ['match', 'match.home_team', 'match.away_team'],
      order: { match: { match_date: 'ASC' } },
    });
  }

  async getPoolRanking(poolId: number): Promise<PoolParticipant[]> {
    return this.poolParticipantRepository.find({
      where: { pool_id: poolId },
      relations: ['user'],
      order: { total_points: 'DESC', exact_predictions: 'DESC', correct_results: 'DESC' },
    });
  }

  // Métodos para publicação e gerenciamento de status
  async publishPool(poolId: number, userId: number): Promise<Pool> {
    const pool = await this.findOne(poolId);

    if (pool.created_by_user_id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.is_admin) {
        throw new ForbiddenException('Apenas o criador ou administradores podem publicar este bolão');
      }
    }

    if (pool.status !== PoolStatus.DRAFT) {
      throw new BadRequestException('Apenas bolões em rascunho podem ser publicados');
    }

    if (pool.pool_matches.length === 0) {
      throw new BadRequestException('Bolão deve ter pelo menos um jogo para ser publicado');
    }

    await this.poolRepository.update(poolId, { status: PoolStatus.OPEN });
    return this.findOne(poolId);
  }

  async closePool(poolId: number, userId: number): Promise<Pool> {
    const pool = await this.findOne(poolId);

    if (pool.created_by_user_id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.is_admin) {
        throw new ForbiddenException('Apenas o criador ou administradores podem fechar este bolão');
      }
    }

    await this.poolRepository.update(poolId, { status: PoolStatus.CLOSED });
    return this.findOne(poolId);
  }
}