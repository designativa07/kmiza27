import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private whatsappService: WhatsAppService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async findAll(type?: string, status?: string): Promise<any[]> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .leftJoinAndSelect('notification.match', 'match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.competition', 'competition')
      .orderBy('notification.created_at', 'DESC');

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const notifications = await queryBuilder.getMany();

    // Transformar para o formato esperado pelo frontend
    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title || this.generateTitle(notification),
      message: notification.message,
      type: this.mapTypeToFrontend(notification.type),
      target_audience: 'all', // Por enquanto, todas são para todos
      team_filter: notification.match ? 
        `${notification.match.home_team?.name},${notification.match.away_team?.name}` : '',
      scheduled_time: null, // Por enquanto não temos agendamento
      status: notification.is_sent ? 'sent' : 'draft',
      sent_count: notification.is_sent ? 1 : 0, // Simplificado
      created_at: notification.created_at
    }));
  }

  async getStats() {
    const total = await this.notificationRepository.count();
    const sent = await this.notificationRepository.count({ where: { is_sent: true } });
    
    // Contar usuários com telefone cadastrado (alcance real)
    const usersWithPhone = await this.userRepository.count({
      where: { phone_number: Not(IsNull()) }
    });
    
    // Calcular alcance real: usuários com telefone × notificações enviadas
    const reach = usersWithPhone * sent;
    
    // Agendadas: por enquanto sempre 0 (não implementado ainda)
    const scheduled = 0;

    return {
      total,
      sent,
      scheduled,
      reach
    };
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user', 'match', 'match.home_team', 'match.away_team', 'match.competition']
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async sendNotification(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    
    try {
      // Buscar usuários para enviar a notificação
      const users = await this.userRepository.find({
        where: { phone_number: Not(IsNull()) }
      });

      this.logger.log(`Enviando notificação "${notification.title}" para ${users.length} usuários`);

      // Preparar mensagens para envio em lote
      const messages = users.map(user => ({
        to: user.phone_number,
        message: notification.message,
        title: notification.title || this.generateTitle(notification)
      }));

      // Enviar mensagens via WhatsApp
      const results = await this.whatsappService.sendBulkMessages(messages);
      
      // Contar sucessos
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      this.logger.log(`Notificação enviada: ${successCount} sucessos, ${errorCount} erros`);

      // Marcar como enviada
      notification.is_sent = true;
      notification.sent_at = new Date();
      
      return await this.notificationRepository.save(notification);

    } catch (error) {
      this.logger.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  async scheduleNotification(id: number, scheduledTime: string): Promise<Notification> {
    const notification = await this.findOne(id);
    // Por enquanto, apenas marcar como agendada
    // Em uma implementação real, usaríamos um job scheduler
    return notification;
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async testWhatsAppConnection(): Promise<any> {
    try {
      // Verificar status da instância
      const instanceStatus = await this.whatsappService.checkInstanceStatus();
      
      // Buscar usuários com telefone
      const usersWithPhone = await this.userRepository.find({
        where: { phone_number: Not(IsNull()) }
      });



      return {
        instanceConnected: instanceStatus,
        usersWithPhone: usersWithPhone.length,
        users: usersWithPhone.map(u => ({ 
          id: u.id, 
          name: u.name, 
          phone: u.phone_number 
        }))
      };
    } catch (error) {
      this.logger.error('Erro ao testar conexão WhatsApp:', error);
      throw error;
    }
  }

  async testDirectWhatsAppSend(): Promise<any> {
    try {
      // Buscar um usuário com telefone para teste
      const user = await this.userRepository.findOne({
        where: { phone_number: Not(IsNull()) }
      });

      if (!user) {
        throw new Error('Nenhum usuário com telefone encontrado');
      }

      this.logger.log(`🧪 TESTE DIRETO: Enviando para ${user.name} (${user.phone_number})`);

      // Enviar mensagem de teste diretamente
      const result = await this.whatsappService.sendMessage({
        to: user.phone_number,
        message: 'TESTE DIRETO - Esta é uma mensagem de teste enviada diretamente pela Evolution API',
        title: '🧪 TESTE DIRETO'
      });

      this.logger.log(`🧪 RESULTADO: ${JSON.stringify(result)}`);

      return {
        user: { name: user.name, phone: user.phone_number },
        result
      };
    } catch (error) {
      this.logger.error('Erro no teste direto WhatsApp:', error);
      throw error;
    }
  }

  private generateTitle(notification: Notification): string {
    if (notification.match) {
      const homeTeam = notification.match.home_team?.name || 'Time A';
      const awayTeam = notification.match.away_team?.name || 'Time B';
      
      switch (notification.type) {
        case 'match_start':
          return `${homeTeam} x ${awayTeam} começou!`;
        case 'goal':
          return `Gol em ${homeTeam} x ${awayTeam}!`;
        case 'match_end':
          return `Final: ${homeTeam} x ${awayTeam}`;
        default:
          return `${homeTeam} x ${awayTeam}`;
      }
    }
    
    return notification.type || 'Notificação';
  }

  private mapTypeToFrontend(backendType: string): string {
    const typeMap: { [key: string]: string } = {
      'match_start': 'match_reminder',
      'match_end': 'result',
      'goal': 'result',
      'news': 'news'
    };
    
    return typeMap[backendType] || 'custom';
  }
} 