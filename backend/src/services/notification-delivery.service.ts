import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationSendStatus } from '../entities/notification.entity';
import { NotificationDelivery, DeliveryStatus } from '../entities/notification-delivery.entity';
import { User } from '../entities/user.entity';
import { WhatsAppService } from '../modules/whatsapp/whatsapp.service';

export interface DeliveryProgress {
  notification_id: number;
  send_status: NotificationSendStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  pending_count: number;
  progress_percentage: number;
  started_at: Date | null;
  completed_at: Date | null;
  paused_at: Date | null;
  estimated_completion?: Date;
}

export interface DeliveryReport {
  notification: {
    id: number;
    title: string;
    message: string;
    send_status: NotificationSendStatus;
    started_at: Date | null;
    completed_at: Date | null;
  };
  summary: {
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    failed_count: number;
    pending_count: number;
    cancelled_count: number;
  };
  deliveries: Array<{
    id: number;
    user_id: number;
    phone_number: string;
    status: DeliveryStatus;
    sent_at: Date | null;
    delivered_at: Date | null;
    failed_at: Date | null;
    error_message: string | null;
    retry_count: number;
  }>;
}

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private sendingProcesses = new Map<number, boolean>(); // Para controlar processos ativos

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private whatsAppService: WhatsAppService,
  ) {}

  async startSending(notificationId: number): Promise<DeliveryProgress> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Verificar se já está sendo enviada
    if (this.sendingProcesses.has(notificationId)) {
      throw new Error('Notification is already being sent');
    }

    // Verificar se já existem registros de delivery
    const existingDeliveries = await this.deliveryRepository.find({
      where: { notification_id: notificationId }
    });

    // Criar registros de delivery se não existirem
    if (!existingDeliveries || existingDeliveries.length === 0) {
      await this.createDeliveryRecords(notificationId);
    }

    // Contar deliveries após criação
    const deliveryCount = await this.deliveryRepository.count({
      where: { notification_id: notificationId }
    });

    // Atualizar status da notification
    await this.notificationRepository.update(notificationId, {
      send_status: NotificationSendStatus.SENDING,
      started_at: new Date(),
      total_recipients: deliveryCount
    });

    // Iniciar processo de envio em background
    this.sendingProcesses.set(notificationId, true);
    this.processDeliveries(notificationId).catch(console.error);

    return this.getProgress(notificationId);
  }

  async pauseSending(notificationId: number): Promise<DeliveryProgress> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Parar o processo
    this.sendingProcesses.set(notificationId, false);

    // Atualizar status
    await this.notificationRepository.update(notificationId, {
      send_status: NotificationSendStatus.PAUSED,
      paused_at: new Date()
    });

    return this.getProgress(notificationId);
  }

  async resumeSending(notificationId: number): Promise<DeliveryProgress> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Atualizar status
    await this.notificationRepository.update(notificationId, {
      send_status: NotificationSendStatus.SENDING,
      paused_at: null
    });

    // Reiniciar processo
    this.sendingProcesses.set(notificationId, true);
    this.processDeliveries(notificationId).catch(console.error);

    return this.getProgress(notificationId);
  }

  async cancelSending(notificationId: number): Promise<DeliveryProgress> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Parar o processo
    this.sendingProcesses.set(notificationId, false);

    // Cancelar deliveries pendentes
    await this.deliveryRepository.update(
      { 
        notification_id: notificationId, 
        status: DeliveryStatus.PENDING 
      },
      { status: DeliveryStatus.CANCELLED }
    );

    // Atualizar status da notification
    await this.notificationRepository.update(notificationId, {
      send_status: NotificationSendStatus.CANCELLED,
      completed_at: new Date()
    });

    return this.getProgress(notificationId);
  }

  async getProgress(notificationId: number): Promise<DeliveryProgress> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Contar deliveries por status
    const statusCounts = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('delivery.notification_id = :notificationId', { notificationId })
      .groupBy('delivery.status')
      .getRawMany();

    const counts = {
      pending: 0,
      sending: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0
    };

    // Processar contagens se existirem
    if (statusCounts && statusCounts.length > 0) {
      statusCounts.forEach(item => {
        if (counts.hasOwnProperty(item.status)) {
          counts[item.status] = parseInt(item.count) || 0;
        }
      });
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const sent = counts.delivered + counts.failed;
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

    return {
      notification_id: notificationId,
      send_status: notification.send_status,
      total_recipients: total,
      sent_count: sent,
      delivered_count: counts.delivered,
      failed_count: counts.failed,
      pending_count: counts.pending,
      progress_percentage: progress,
      started_at: notification.started_at,
      completed_at: notification.completed_at,
      paused_at: notification.paused_at
    };
  }

  async getDeliveryReport(notificationId: number): Promise<DeliveryReport> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const deliveries = await this.deliveryRepository.find({
      where: { notification_id: notificationId },
      order: { created_at: 'ASC' }
    });

    // Calcular resumo - inicializar com valores padrão
    const summary = {
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
      pending_count: 0,
      cancelled_count: 0
    };

    // Se há deliveries, calcular o resumo
    if (deliveries && deliveries.length > 0) {
      deliveries.forEach(delivery => {
        summary.total_recipients++;
        switch (delivery.status) {
          case DeliveryStatus.DELIVERED:
            summary.delivered_count++;
            summary.sent_count++;
            break;
          case DeliveryStatus.FAILED:
            summary.failed_count++;
            summary.sent_count++;
            break;
          case DeliveryStatus.PENDING:
            summary.pending_count++;
            break;
          case DeliveryStatus.CANCELLED:
            summary.cancelled_count++;
            break;
        }
      });
    }

    return {
      notification: {
        id: notification.id,
        title: notification.title || '',
        message: notification.message || '',
        send_status: notification.send_status,
        started_at: notification.started_at,
        completed_at: notification.completed_at
      },
      summary,
      deliveries: deliveries ? deliveries.map(delivery => ({
        id: delivery.id,
        user_id: delivery.user_id,
        phone_number: delivery.phone_number,
        status: delivery.status,
        sent_at: delivery.sent_at,
        delivered_at: delivery.delivered_at,
        failed_at: delivery.failed_at,
        error_message: delivery.error_message,
        retry_count: delivery.retry_count
      })) : []
    };
  }

  private async createDeliveryRecords(notificationId: number): Promise<void> {
    // Buscar todos os usuários ativos
    const users = await this.userRepository.find({
      where: { is_active: true }
    });

    const deliveries = users.map(user => ({
      notification_id: notificationId,
      user_id: user.id,
      phone_number: user.phone_number,
      status: DeliveryStatus.PENDING
    }));

    await this.deliveryRepository.save(deliveries);
  }

  private async processDeliveries(notificationId: number): Promise<void> {
    while (this.sendingProcesses.get(notificationId)) {
      // Buscar próximo delivery pendente
      const delivery = await this.deliveryRepository.findOne({
        where: { 
          notification_id: notificationId, 
          status: DeliveryStatus.PENDING 
        },
        order: { created_at: 'ASC' }
      });

      if (!delivery) {
        // Não há mais deliveries pendentes, marcar como completo
        await this.markAsCompleted(notificationId);
        break;
      }

      try {
        // Marcar como enviando
        await this.deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.SENDING,
          sent_at: new Date()
        });

        // Buscar notification para obter a mensagem
        const notification = await this.notificationRepository.findOne({
          where: { id: notificationId }
        });

        if (notification) {
          // Enviar via WhatsApp
          this.logger.log(`📱 Enviando mensagem para ${delivery.phone_number}...`);
          
          const result = await this.whatsAppService.sendMessage({
            to: delivery.phone_number,
            message: notification.message,
            title: notification.title
          });

          this.logger.log(`📋 Resultado do WhatsApp para ${delivery.phone_number}:`, result);

          if (result.success) {
            // Marcar como entregue apenas se o WhatsApp confirmou sucesso
            await this.deliveryRepository.update(delivery.id, {
              status: DeliveryStatus.DELIVERED,
              delivered_at: new Date(),
              whatsapp_message_id: result.messageId || null
            });
            this.logger.log(`✅ Mensagem entregue para ${delivery.phone_number} - ID: ${result.messageId}`);
          } else {
            // Marcar como falhou se o WhatsApp retornou erro
            await this.deliveryRepository.update(delivery.id, {
              status: DeliveryStatus.FAILED,
              failed_at: new Date(),
              error_message: result.error || 'Erro desconhecido no WhatsApp',
              retry_count: delivery.retry_count + 1
            });
            this.logger.error(`❌ Falha ao enviar para ${delivery.phone_number}: ${result.error}`);
          }
        }

      } catch (error) {
        // Marcar como falhou
        await this.deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.FAILED,
          failed_at: new Date(),
          error_message: error.message,
          retry_count: delivery.retry_count + 1
        });
      }

      // Atualizar contadores na notification
      await this.updateNotificationCounts(notificationId);

      // Aguardar o intervalo configurado antes do próximo envio
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId }
      });
      const intervalMs = notification?.send_interval_ms || 1000;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Remover da lista de processos ativos
    this.sendingProcesses.delete(notificationId);
  }

  private async updateNotificationCounts(notificationId: number): Promise<void> {
    const counts = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('delivery.notification_id = :notificationId', { notificationId })
      .groupBy('delivery.status')
      .getRawMany();

    const statusCounts = {
      delivered: 0,
      failed: 0
    };

    counts.forEach(item => {
      if (item.status === 'delivered') statusCounts.delivered = parseInt(item.count);
      if (item.status === 'failed') statusCounts.failed = parseInt(item.count);
    });

    await this.notificationRepository.update(notificationId, {
      sent_count: statusCounts.delivered + statusCounts.failed,
      delivered_count: statusCounts.delivered,
      failed_count: statusCounts.failed
    });
  }

  private async markAsCompleted(notificationId: number): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      send_status: NotificationSendStatus.COMPLETED,
      completed_at: new Date()
    });
    
    this.sendingProcesses.delete(notificationId);
  }

  async testRealSend(notificationId: number): Promise<any> {
    this.logger.log(`🧪 TESTE REAL DE ENVIO - Notificação ${notificationId}`);
    
    try {
      // Buscar a notificação
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new Error('Notificação não encontrada');
      }

      // Buscar um usuário para teste
      const user = await this.userRepository.findOne({
        where: { is_active: true }
      });

      if (!user || !user.phone_number) {
        throw new Error('Nenhum usuário ativo com telefone encontrado');
      }

      this.logger.log(`📱 Testando envio para: ${user.name} (${user.phone_number})`);
      this.logger.log(`📝 Mensagem: ${notification.message}`);
      this.logger.log(`🏷️ Título: ${notification.title}`);

      // Testar envio direto
      const result = await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message: `🧪 TESTE REAL - ${notification.message}`,
        title: `🧪 TESTE - ${notification.title}`
      });

      this.logger.log(`📋 Resultado completo:`, result);

      return {
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message
        },
        testUser: {
          id: user.id,
          name: user.name,
          phone: user.phone_number
        },
        whatsappResult: result,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`❌ Erro no teste real:`, error);
      throw error;
    }
  }
} 