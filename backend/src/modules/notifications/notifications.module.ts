import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../../entities/notification.entity';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationDelivery, User]),
    WhatsAppModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDeliveryService],
  exports: [NotificationsService, NotificationDeliveryService],
})
export class NotificationsModule {} 