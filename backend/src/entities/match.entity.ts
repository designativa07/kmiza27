import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Competition } from './competition.entity';
import { Team } from './team.entity';
import { Round } from './round.entity';
import { Stadium } from './stadium.entity';
import { Goal } from './goal.entity';
import { MatchBroadcast } from './match-broadcast.entity';
import { Card } from './card.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

export enum MatchLeg {
  FIRST_LEG = 'first_leg',
  SECOND_LEG = 'second_leg',
  SINGLE_MATCH = 'single_match',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competition, competition => competition.matches)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @ManyToOne(() => Round, round => round.matches, { nullable: true })
  @JoinColumn({ name: 'round_id' })
  round: Round;

  @ManyToOne(() => Team, team => team.homeMatches)
  @JoinColumn({ name: 'home_team_id' })
  home_team: Team;

  @ManyToOne(() => Team, team => team.awayMatches)
  @JoinColumn({ name: 'away_team_id' })
  away_team: Team;

  @ManyToOne(() => Stadium, { nullable: true })
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

  @Column({ type: 'text', nullable: true })
  highlights_url: string;

  @Column({ type: 'jsonb', nullable: true })
  match_stats: any;

  @Column({ type: 'jsonb', nullable: true })
  home_team_player_stats: any;

  @Column({ type: 'jsonb', nullable: true })
  away_team_player_stats: any;

  @Column({
    type: 'enum',
    enum: MatchLeg,
    enumName: 'match_leg',
    default: MatchLeg.SINGLE_MATCH,
  })
  leg: MatchLeg;

  @Column({ type: 'uuid', nullable: true }) 
  tie_id: string;

  @Column({ type: 'int', nullable: true })
  home_aggregate_score: number;

  @Column({ type: 'int', nullable: true })
  away_aggregate_score: number;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'qualified_team_id' })
  qualified_team: Team;

  @Column({ type: 'int', nullable: true })
  qualified_team_id: number | null; // For foreign key relationship

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Goal, goal => goal.match)
  goals: Goal[];

  @OneToMany(() => MatchBroadcast, broadcast => broadcast.match)
  broadcasts: MatchBroadcast[];

  @OneToMany(() => Card, card => card.match)
  cards: Card[];

  // Propriedade virtual para armazenar os IDs dos canais
  channel_ids?: number[];
} 