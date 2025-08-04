import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pool } from './pool.entity';
import { Match } from './match.entity';

@Entity('pool_matches')
export class PoolMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pool, pool => pool.pool_matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  pool_id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  match_id: number;

  // Ordem dos jogos no bolão (para exibição)
  @Column({ type: 'int', default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;
}