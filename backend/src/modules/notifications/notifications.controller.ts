import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deliveryService: NotificationDeliveryService
  ) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@Query('type') type?: string, @Query('status') status?: string) {
    return this.notificationsService.findAll(type, status);
  }

  @Get('stats')
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Post(':id/send')
  sendNotification(@Param('id') id: string) {
    return this.deliveryService.startSending(+id);
  }

  @Post(':id/pause')
  pauseNotification(@Param('id') id: string) {
    return this.deliveryService.pauseSending(+id);
  }

  @Post(':id/resume')
  resumeNotification(@Param('id') id: string) {
    return this.deliveryService.resumeSending(+id);
  }

  @Post(':id/cancel')
  cancelNotification(@Param('id') id: string) {
    return this.deliveryService.cancelSending(+id);
  }

  @Get(':id/progress')
  getProgress(@Param('id') id: string) {
    return this.deliveryService.getProgress(+id);
  }

  @Get(':id/report')
  getDeliveryReport(@Param('id') id: string) {
    return this.deliveryService.getDeliveryReport(+id);
  }

  @Post(':id/schedule')
  scheduleNotification(@Param('id') id: string, @Body() scheduleData: { scheduled_time: string }) {
    return this.notificationsService.scheduleNotification(+id, scheduleData.scheduled_time);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }

  @Post('test-whatsapp')
  async testWhatsApp() {
    try {
      // Testar status da instância
      const status = await this.notificationsService.testWhatsAppConnection();
      return { success: true, status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('debug-config')
  debugConfig() {
    return {
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? '***HIDDEN***' : 'NOT_SET',
      EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME,
      WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED,
    };
  }

  @Post('test-direct-send')
  async testDirectSend() {
    try {
      const result = await this.notificationsService.testDirectWhatsAppSend();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('test-evolution')
  async testEvolution() {
    try {
      const result = await this.notificationsService.testWhatsAppConnection();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('force-test-send/:id')
  async forceTestSend(@Param('id') id: string) {
    try {
      // Forçar um teste de envio real para debug
      const result = await this.deliveryService.testRealSend(+id);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 