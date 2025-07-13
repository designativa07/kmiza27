import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppMenuController } from './whatsapp-menu.controller';
import { WhatsAppMenuService } from './whatsapp-menu.service';
import { WhatsAppMenuConfig } from '../../entities/whatsapp-menu-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppMenuConfig])
  ],
  controllers: [WhatsAppMenuController],
  providers: [WhatsAppMenuService],
  exports: [WhatsAppMenuService]
})
export class WhatsAppMenuModule {} 