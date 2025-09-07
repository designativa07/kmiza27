import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Pool } from './pool.entity';
import { User } from './user.entity';
import { Match } from './match.entity';

@Entity('pool_predictions')
@Index(['pool_id', 'user_id', 'match_id'], { unique: true }) // Um palpite por usuário por jogo por bolão
export class PoolPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pool, pool => pool.predictions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  pool_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  match_id: number;

  // Palpite do usuário
  @Column({ type: 'int', name: 'home_score_prediction' })
  predicted_home_score: number;

  @Column({ type: 'int', name: 'away_score_prediction' })
  predicted_away_score: number;

  // Pontuação obtida neste palpite
  @Column({ type: 'int', nullable: true, name: 'score' })
  points_earned: number;

  // Tipo de acerto (para estatísticas)
  @Column({ type: 'varchar', length: 50, nullable: true })
  prediction_type: string; // 'exact', 'result', 'goal_difference', 'none'

  // Data/hora do palpite
  @CreateDateColumn({ name: 'predicted_at' })
  predicted_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}