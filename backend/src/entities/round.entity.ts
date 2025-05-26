import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Competition } from './competition.entity';
import { Match } from './match.entity';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competition, competition => competition.rounds)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  round_number: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phase: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Match, match => match.round)
  matches: Match[];
} 