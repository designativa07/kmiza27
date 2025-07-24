import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Team } from './team.entity';

@Entity('titles')
export class Title {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  competition_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  season: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string; // Ex: 'Nacional', 'Internacional', 'Estadual', 'Regional'

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string; // Ex: 'Campeonato', 'Copa', 'Supercopa', 'Torneio'

  @Column({ type: 'int', nullable: true })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @ManyToOne(() => Team, team => team.titles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column()
  team_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 