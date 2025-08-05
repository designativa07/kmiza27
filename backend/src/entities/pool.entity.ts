import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Round } from './round.entity';
import { PoolMatch } from './pool-match.entity';
import { PoolParticipant } from './pool-participant.entity';
import { PoolPrediction } from './pool-prediction.entity';

export enum PoolType {
  ROUND = 'round',           // Bolão de rodada completa
  CUSTOM = 'custom'          // Bolão personalizado com jogos selecionados
}

export enum PoolStatus {
  DRAFT = 'draft',           // Rascunho (ainda não publicado)
  OPEN = 'open',             // Aberto para participação
  CLOSED = 'closed',         // Fechado para novos palpites
  FINISHED = 'finished'      // Finalizado com resultados
}

@Entity('pools')
export class Pool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PoolType,
    default: PoolType.CUSTOM
  })
  type: PoolType;

  @Column({
    type: 'enum',
    enum: PoolStatus,
    default: PoolStatus.DRAFT
  })
  status: PoolStatus;

  // Para bolões de rodada - referência à rodada
  @ManyToOne(() => Round, { nullable: true })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @Column({ name: 'round_id', nullable: true })
  round_id: number;

  // Usuário que criou o bolão
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  creator: User;

  @Column({ name: 'created_by_user_id' })
  created_by_user_id: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  // Data limite para palpites (antes do primeiro jogo)
  @Column({ type: 'timestamp', nullable: true })
  prediction_deadline: Date;

  // Regras de pontuação em JSON
  @Column({ type: 'jsonb', default: () => "'{}'" })
  scoring_rules: {
    exact_score?: number;      // Pontos por placar exato (ex: 10)
    correct_result?: number;   // Pontos por resultado correto (ex: 5)
    goal_difference?: number;  // Pontos por diferença de gols (ex: 3)
    bonus_rules?: any;         // Regras especiais de bônus
  };

  // Configurações do bolão
  @Column({ type: 'jsonb', default: () => "'{}'" })
  settings: {
    max_participants?: number;
    entry_fee?: number;
    prize_distribution?: any;
    public?: boolean;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamentos
  @OneToMany(() => PoolMatch, poolMatch => poolMatch.pool)
  pool_matches: PoolMatch[];

  @OneToMany(() => PoolParticipant, participant => participant.pool)
  participants: PoolParticipant[];

  @OneToMany(() => PoolPrediction, prediction => prediction.pool)
  predictions: PoolPrediction[];
}