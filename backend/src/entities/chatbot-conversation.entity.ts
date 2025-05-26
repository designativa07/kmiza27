import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('chatbot_conversations')
export class ChatbotConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.conversations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message_id: string;

  @Column({ type: 'text' })
  user_message: string;

  @Column({ type: 'text' })
  bot_response: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  intent: string;

  @Column({ type: 'jsonb', nullable: true })
  entities: any;

  @CreateDateColumn()
  created_at: Date;
} 