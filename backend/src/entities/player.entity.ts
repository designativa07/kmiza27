import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlayerTeamHistory } from './player-team-history.entity';
import { Goal } from './goal.entity';
import { Card } from './card.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, nullable: true })
  position: string; // Ex: Atacante, Meio-campo, Defensor, Goleiro

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 100, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'active' })
  state: string; // Ex: 'active', 'retired', 'injured'

  @Column({ length: 255, nullable: true })
  image_url: string; // URL da foto do jogador

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relacionamento com histórico de times
  @OneToMany(() => PlayerTeamHistory, playerTeamHistory => playerTeamHistory.player)
  team_history: PlayerTeamHistory[];

  // Relacionamento com gols
  @OneToMany(() => Goal, goal => goal.player)
  goals: Goal[];

  // Relacionamento com cartões
  @OneToMany(() => Card, card => card.player)
  cards: Card[];
} 