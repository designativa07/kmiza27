import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Pool } from './pool.entity';
import { User } from './user.entity';

@Entity('pool_participants')
@Index(['pool_id', 'user_id'], { unique: true }) // Um usuário só pode participar uma vez de cada bolão
export class PoolParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pool, pool => pool.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  pool_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: number;

  // Pontuação total do participante neste bolão
  @Column({ type: 'int', default: 0 })
  total_points: number;

  // Posição no ranking (calculada automaticamente)
  @Column({ type: 'int', nullable: true })
  ranking_position: number;

  // Número de palpites feitos
  @Column({ type: 'int', default: 0 })
  predictions_count: number;

  // Número de acertos exatos
  @Column({ type: 'int', default: 0 })
  exact_predictions: number;

  // Número de resultados corretos
  @Column({ type: 'int', default: 0 })
  correct_results: number;

  @CreateDateColumn()
  joined_at: Date;
}