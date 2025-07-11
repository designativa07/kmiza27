import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getAllSettings() {
    return this.systemSettingsService.getAllSettings();
  }

  @Get('evolution-api')
  async getEvolutionApiSettings() {
    return this.systemSettingsService.getEvolutionApiSettings();
  }

  @Post('evolution-api')
  async updateEvolutionApiSettings(@Body() settings: {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
    enabled: boolean;
  }) {
    return this.systemSettingsService.updateEvolutionApiSettings(settings);
  }

  @Post('evolution-api/test')
  async testEvolutionApiConnection() {
    return this.systemSettingsService.testEvolutionApiConnection();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.systemSettingsService.getSetting(key);
  }

  @Put(':key')
  async updateSetting(@Param('key') key: string, @Body() data: { value: any; description?: string }) {
    return this.systemSettingsService.updateSetting(key, data.value, data.description);
  }
} 