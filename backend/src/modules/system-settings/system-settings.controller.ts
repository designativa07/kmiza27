import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemSettingsService } from './system-settings.service';
import { UploadCloudService } from '../upload/upload-cloud.service';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly uploadCloudService: UploadCloudService,
  ) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @Body('fileName') fileName: string,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo enviado.');
    }
    if (!folder) {
      throw new Error('A pasta de destino (folder) é obrigatória.');
    }
    if (!fileName) {
      throw new Error('O nome do arquivo (fileName) é obrigatório.');
    }

    try {
      const uploadedUrl = await this.uploadCloudService.uploadFile(file, folder, fileName);
      return { url: uploadedUrl };
    } catch (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

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

  @Get('futepedia-images')
  async getFutepediaImagesSettings() {
    try {
      return await this.systemSettingsService.getFutepediaImagesSettings();
    } catch (error) {
      console.error('❌ Erro no controller getFutepediaImagesSettings:', error);
      return {
        ogImageUrl: null,
        headerLogoUrl: null,
      };
    }
  }

  @Put('futepedia-images')
  async updateFutepediaImagesSettings(
    @Body('ogImageUrl') ogImageUrl: string,
    @Body('headerLogoUrl') headerLogoUrl: string,
    @Body('futepediaLogoUrl') futepediaLogoUrl: string, // Compatibilidade com versão anterior
  ) {
    // Usar headerLogoUrl se disponível, senão futepediaLogoUrl para compatibilidade
    const logoUrl = headerLogoUrl || futepediaLogoUrl;
    return this.systemSettingsService.updateFutepediaImagesSettings(ogImageUrl, logoUrl);
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