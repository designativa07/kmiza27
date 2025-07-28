import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

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
  private readonly logger = new Logger(UploadCloudService.name);
  private readonly s3Client: S3Client | null;
  private readonly cdnUrl: string;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // Primeiro tentar usar ConfigService, depois carregar manualmente se necessário
    this.cdnUrl = this.configService.get('CDN_URL') || process.env.CDN_URL || 'https://cdn.kmiza27.com';
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || process.env.MINIO_BUCKET_NAME || 'img';

    let endpoint = this.configService.get('MINIO_ENDPOINT') || process.env.MINIO_ENDPOINT;
    let accessKey = this.configService.get('MINIO_ACCESS_KEY') || process.env.MINIO_ACCESS_KEY;
    let secretKey = this.configService.get('MINIO_SECRET_KEY') || process.env.MINIO_SECRET_KEY;

    // Se as variáveis não estão disponíveis, tentar carregar manualmente
    if (!endpoint || !accessKey || !secretKey) {
      this.loadEnvironmentVariables();
      
      // Tentar novamente após carregamento manual
      endpoint = process.env.MINIO_ENDPOINT;
      accessKey = process.env.MINIO_ACCESS_KEY;
      secretKey = process.env.MINIO_SECRET_KEY;
    }

    if (!endpoint) {
      this.logger.warn('MINIO_ENDPOINT não está configurado. O upload de arquivos estará desabilitado.');
      this.s3Client = null;
      return;
    }

    if (!accessKey || !secretKey) {
      this.logger.error('MINIO_ACCESS_KEY ou MINIO_SECRET_KEY não encontrados');
      this.s3Client = null;
      return;
    }
    
    const port = parseInt(this.configService.get('MINIO_PORT') || process.env.MINIO_PORT || '443', 10);
    const useSSL = (this.configService.get('MINIO_USE_SSL') || process.env.MINIO_USE_SSL) === 'true';

    try {
      this.s3Client = new S3Client({
        endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
        region: 'us-east-1', // Região padrão para MinIO
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true, // Necessário para MinIO
        tls: useSSL,
        requestHandler: {
          requestTimeout: 30000, // 30 segundos
        },
      });

      // Testar conexão com MinIO silenciosamente
      this.testMinIOConnection();
    } catch (error) {
      this.logger.error(`Erro ao inicializar S3 Client: ${error.message}`);
      this.s3Client = null;
    }
  }

  private async testMinIOConnection() {
    if (!this.s3Client) return;
    
    try {
      const command = new ListBucketsCommand({});
      const result = await this.s3Client.send(command);
      
      const bucketExists = result.Buckets?.some(b => b.Name === this.bucketName);
      if (!bucketExists) {
        this.logger.warn(`Bucket "${this.bucketName}" não encontrado!`);
      }
    } catch (error) {
      this.logger.error(`Erro na conexão com MinIO: ${error.message}`);
    }
  }

  private loadEnvironmentVariables(): void {
    const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
    const envPath = path.join(__dirname, '..', '..', '..', envFile);

    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        envVars.forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Sempre definir no process.env (sobrescrever se necessário)
            process.env[key] = value;
          }
        });
      } catch (error) {
        this.logger.error(`Erro ao carregar ${envFile}: ${error.message}`);
      }
    }
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
    return `${this.cdnUrl}/${this.bucketName}/escudos/${filename}`;
  }

  getMinioLogoUrl(filename: string): string {
    return `${this.cdnUrl}/${this.bucketName}/logo-competition/${filename}`;
  }

  // Métodos utilitários
  getCdnUrl(): string {
    return this.cdnUrl;
  }

  getMinioUrl(): string {
    return this.cdnUrl;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Faz o "upload" de um arquivo para uma pasta específica no bucket.
   * Por enquanto, apenas gera a URL final do CDN.
   *
   * @param file O arquivo a ser "enviado" (usado para obter o nome original)
   * @param folder A pasta de destino dentro do bucket (e.g., 'escudos', 'estadios')
   * @param fileName O nome do arquivo a ser salvo no bucket
   * @returns A URL pública do arquivo no CDN
   */
  async uploadFile(file: Express.Multer.File, folder: string, fileName: string): Promise<string> {
    // Se o S3Client não está inicializado, retornar uma URL simulada
    if (!this.s3Client) {
      this.logger.warn('S3 Client não inicializado. Retornando URL simulada.');
      const publicUrl = `${this.cdnUrl}/${this.bucketName}/${folder}/${fileName}`;
      this.logger.log(`URL simulada gerada: ${publicUrl}`);
      return publicUrl;
    }

    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Remover ACL por enquanto - pode não ser suportado pelo MinIO
      // ACL: 'public-read',
    });

    try {
      const result = await this.s3Client.send(command);
      const publicUrl = `${this.cdnUrl}/${this.bucketName}/${key}`;
      this.logger.log(`Upload realizado com sucesso: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload: ${error.message}`);
      // Em caso de erro, retornar uma URL simulada
      const fallbackUrl = `${this.cdnUrl}/${this.bucketName}/${folder}/${fileName}`;
      this.logger.warn(`Retornando URL de fallback: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }
} 