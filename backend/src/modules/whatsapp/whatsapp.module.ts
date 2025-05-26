import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { AutomationService } from './automation.service';
import { NotificationService } from './notification.service';
import { ChatbotConversation } from '../../entities/chatbot-conversation.entity';
import { User } from '../../entities/user.entity';
import { ChatbotModule } from '../../chatbot/chatbot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatbotConversation, User]),
    ChatbotModule
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, AutomationService, NotificationService],
  exports: [WhatsAppService, AutomationService, NotificationService]
})
export class WhatsAppModule {} 