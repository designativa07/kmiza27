import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Exemplo de implementação para Cloudinary
// Descomente e configure se quiser usar armazenamento em nuvem

/*
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadCloudService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadEscudo(file: Express.Multer.File): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'kmiza27/escudos',
        public_id: `escudo-${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
      });

      return result.secure_url;
    } catch (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }

  async deleteEscudo(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }
}
*/

// Configuração para MinIO (S3-compatible) do EasyPanel
@Injectable()
export class UploadCloudService {
  private readonly cdnUrl: string;
  private readonly minioUrl: string;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // URLs baseadas na sua configuração do EasyPanel
    this.cdnUrl = 'https://cdn.kmiza27.com';
    this.minioUrl = 'https://console-kmiza27-minio.h4xd66.easypanel.host';
    this.bucketName = 'img';
  }

  async uploadEscudo(file: Express.Multer.File): Promise<string> {
    // Para usar com MinIO, você precisará das credenciais S3
    // Por enquanto, retornando a URL do CDN
    const filename = `escudo-${Date.now()}-${file.originalname}`;
    return `${this.cdnUrl}/${this.bucketName}/escudos/${filename}`;
  }

  async uploadLogo(file: Express.Multer.File): Promise<string> {
    const filename = `logo-${Date.now()}-${file.originalname}`;
    return `${this.cdnUrl}/${this.bucketName}/logo-competition/${filename}`;
  }

  async deleteEscudo(filename: string): Promise<boolean> {
    // Implementar lógica de deleção via API S3
    return true;
  }

  // URLs para acessar as imagens via CDN
  getEscudoUrl(filename: string): string {
    return `${this.cdnUrl}/${this.bucketName}/escudos/${filename}`;
  }

  getLogoUrl(filename: string): string {
    return `${this.cdnUrl}/${this.bucketName}/logo-competition/${filename}`;
  }

  // URLs para acesso direto ao MinIO (uso interno)
  getMinioEscudoUrl(filename: string): string {
    return `${this.minioUrl}/${this.bucketName}/escudos/${filename}`;
  }

  getMinioLogoUrl(filename: string): string {
    return `${this.minioUrl}/${this.bucketName}/logo-competition/${filename}`;
  }

  // Métodos utilitários
  getCdnUrl(): string {
    return this.cdnUrl;
  }

  getMinioUrl(): string {
    return this.minioUrl;
  }

  getBucketName(): string {
    return this.bucketName;
  }
} 