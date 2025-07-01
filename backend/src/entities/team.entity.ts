import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompetitionTeam } from './competition-team.entity';
import { Match } from './match.entity';
import { Stadium } from './stadium.entity';
import { PlayerTeamHistory } from './player-team-history.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  short_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  short_code?: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'int', nullable: true })
  stadium_id: number;

  @ManyToOne(() => Stadium, stadium => stadium.id, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stadium_id' })
  stadium: Stadium;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, default: 'Brasil' })
  country: string;

  @Column({ type: 'int', nullable: true })
  founded_year: number;

  @Column({ type: 'jsonb', nullable: true })
  colors: any;

  @Column({ type: 'jsonb', nullable: true })
  social_media: any;

  @Column({ type: 'text', nullable: true })
  history: string;

  @Column({ type: 'text', nullable: true })
  information: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => CompetitionTeam, competitionTeam => competitionTeam.team)
  competitionTeams: CompetitionTeam[];

  @OneToMany(() => Match, match => match.home_team)
  homeMatches: Match[];

  @OneToMany(() => Match, match => match.away_team)
  awayMatches: Match[];

  @OneToMany(() => PlayerTeamHistory, playerTeamHistory => playerTeamHistory.team)
  player_history: PlayerTeamHistory[];
} 