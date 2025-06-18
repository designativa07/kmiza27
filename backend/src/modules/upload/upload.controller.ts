import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Get,
  Param,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { UploadCloudService } from './upload-cloud.service';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly uploadCloudService: UploadCloudService
  ) {}

  @Get('config')
  getUploadConfig() {
    return {
      cdnUrl: this.uploadCloudService.getCdnUrl(),
      minioUrl: this.uploadCloudService.getMinioUrl(),
      bucketName: this.uploadCloudService.getBucketName(),
      escudosUrl: `${this.uploadCloudService.getCdnUrl()}/${this.uploadCloudService.getBucketName()}/escudos/`,
      logosUrl: `${this.uploadCloudService.getCdnUrl()}/${this.uploadCloudService.getBucketName()}/logo-competition/`,
      instructions: {
        escudos: 'Para escudos de times, faça upload para a pasta "escudos" no bucket img via MinIO',
        logos: 'Para logos de competições, faça upload para a pasta "logo-competition" no bucket img via MinIO',
        access: 'As imagens são servidas automaticamente via CDN cdn.kmiza27.com',
        example: {
          escudo: `${this.uploadCloudService.getCdnUrl()}/${this.uploadCloudService.getBucketName()}/escudos/botafogo.svg`,
          logo: `${this.uploadCloudService.getCdnUrl()}/${this.uploadCloudService.getBucketName()}/logo-competition/copa-brasil.png`
        }
      }
    };
  }

  @Post('escudo')
  @UseInterceptors(FileInterceptor('escudo'))
  async uploadEscudo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Gerar URL do MinIO para retornar ao frontend
    const cloudUrl = await this.uploadCloudService.uploadEscudo(file);
    const localPath = `/uploads/escudos/${file.filename}`;
    
    return {
      message: 'Escudo enviado com sucesso',
      localPath: localPath,
      cloudUrl: cloudUrl,
      minioUrl: this.uploadCloudService.getEscudoUrl(file.filename),
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      instructions: 'Faça upload manual desta imagem para o MinIO em: escudos/' + file.filename
    };
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const cloudUrl = await this.uploadCloudService.uploadLogo(file);
    
    return {
      message: 'Logo enviado com sucesso',
      cloudUrl: cloudUrl,
      minioUrl: this.uploadCloudService.getLogoUrl(file.filename),
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      instructions: 'Faça upload manual desta imagem para o MinIO em: logo-competition/' + file.filename
    };
  }

  @Get('escudos/:filename')
  async getEscudo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'escudos', filename);
    return res.sendFile(filePath);
  }
} 