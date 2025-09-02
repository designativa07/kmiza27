import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Sincroniza dados de produção para desenvolvimento
   */
  @Post('from-production')
  @HttpCode(HttpStatus.OK)
  async syncFromProduction() {
    return await this.syncService.syncFromProduction();
  }

  /**
   * Verifica conexão com produção
   */
  @Get('check-production')
  async checkProductionConnection() {
    return await this.syncService.checkProductionConnection();
  }

  /**
   * Obtém informações do ambiente
   */
  @Get('environment-info')
  async getEnvironmentInfo() {
    return await this.syncService.getEnvironmentInfo();
  }
}
