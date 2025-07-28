import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Get,
  Param,
  Res,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadCloudService } from './upload-cloud.service';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(
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
    
    return {
      message: 'Escudo enviado com sucesso',
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

  @Post('cloud')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToCloud(@UploadedFile() file: any, @Body() body: any) {
    console.log('Upload request received:', {
      file: file ? { originalname: file.originalname, size: file.size, mimetype: file.mimetype } : null,
      body
    });
    
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const { folder = 'escudos', namingStrategy = 'timestamp', entityName = '' } = body;
    console.log('Upload parameters:', { folder, namingStrategy, entityName });
    
    // Definir nome do arquivo baseado na estratégia
    let fileName: string;
    const fileExtension = path.extname(file.originalname);
    
    switch (namingStrategy) {
      case 'name':
        fileName = entityName ? `${entityName}${fileExtension}` : `file-${Date.now()}${fileExtension}`;
        break;
      case 'id':
        fileName = entityName ? `${entityName}${fileExtension}` : `file-${Date.now()}${fileExtension}`;
        break;
      case 'original':
        fileName = file.originalname;
        break;
      default:
        fileName = `${folder}-${Date.now()}${fileExtension}`;
    }

    console.log('Generated filename:', fileName);

    try {
      const url = await this.uploadCloudService.uploadFile(file, folder, fileName);
      console.log('Upload successful, URL:', url);
      
      return {
        message: 'Arquivo enviado com sucesso para o CDN',
        url: url,
        cloudUrl: url, // Adicionar cloudUrl para compatibilidade
        folder: folder,
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }

  @Get('escudos/:filename')
  async getEscudo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'escudos', filename);
    return res.sendFile(filePath);
  }
} 