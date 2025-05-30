import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CompetitionTeam } from './competition-team.entity';
import { Match } from './match.entity';
import { Round } from './round.entity';

export enum CompetitionType {
  PONTOS_CORRIDOS = 'pontos_corridos',
  MATA_MATA = 'mata_mata',
  GRUPOS_E_MATA_MATA = 'grupos_e_mata_mata',
  COPA = 'copa'
}

@Entity('competitions')
export class Competition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: CompetitionType,
    enumName: 'competition_type'
  })
  type: CompetitionType;

  @Column({ type: 'varchar', length: 20 })
  season: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  rules: any;

  @Column({ type: 'jsonb', nullable: true })
  tiebreaker_criteria: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => CompetitionTeam, competitionTeam => competitionTeam.competition)
  competitionTeams: CompetitionTeam[];

  @OneToMany(() => Match, match => match.competition)
  matches: Match[];

  @OneToMany(() => Round, round => round.competition)
  rounds: Round[];
} 