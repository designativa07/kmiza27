import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Competition } from './competition.entity';
import { Team } from './team.entity';
import { Round } from './round.entity';
import { Stadium } from './stadium.entity';
import { Goal } from './goal.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competition, competition => competition.matches)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @ManyToOne(() => Round, round => round.matches)
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @ManyToOne(() => Team, team => team.homeMatches)
  @JoinColumn({ name: 'home_team_id' })
  home_team: Team;

  @ManyToOne(() => Team, team => team.awayMatches)
  @JoinColumn({ name: 'away_team_id' })
  away_team: Team;

  @ManyToOne(() => Stadium)
  @JoinColumn({ name: 'stadium_id' })
  stadium: Stadium;

  @Column({ type: 'timestamp' })
  match_date: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phase: string;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    enumName: 'match_status',
    default: MatchStatus.SCHEDULED
  })
  status: MatchStatus;

  @Column({ type: 'int', nullable: true })
  home_score: number;

  @Column({ type: 'int', nullable: true })
  away_score: number;

  @Column({ type: 'int', nullable: true })
  home_score_penalties: number;

  @Column({ type: 'int', nullable: true })
  away_score_penalties: number;

  @Column({ type: 'int', nullable: true })
  attendance: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee: string;

  @Column({ type: 'jsonb', nullable: true })
  broadcast_channels: any;

  @Column({ type: 'jsonb', nullable: true })
  streaming_links: any;

  @Column({ type: 'text', nullable: true })
  highlights_url: string;

  @Column({ type: 'jsonb', nullable: true })
  match_stats: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Goal, goal => goal.match)
  goals: Goal[];
} 