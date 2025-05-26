import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';
import { NotificationDelivery } from './notification-delivery.entity';

export enum NotificationSendStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  type: string; // goal, match_start, match_end, news

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'boolean', default: false })
  is_sent: boolean;

  @Column({
    type: 'enum',
    enum: NotificationSendStatus,
    default: NotificationSendStatus.DRAFT
  })
  send_status: NotificationSendStatus;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paused_at: Date | null;

  @Column({ type: 'int', default: 0 })
  total_recipients: number;

  @Column({ type: 'int', default: 0 })
  sent_count: number;

  @Column({ type: 'int', default: 0 })
  delivered_count: number;

  @Column({ type: 'int', default: 0 })
  failed_count: number;

  @Column({ type: 'int', default: 1000, comment: 'Intervalo entre envios em milissegundos' })
  send_interval_ms: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @OneToMany(() => NotificationDelivery, delivery => delivery.notification)
  deliveries: NotificationDelivery[];

  @CreateDateColumn()
  created_at: Date;
} 