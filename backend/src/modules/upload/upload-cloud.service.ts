import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
  private readonly s3Client: S3Client;
  private readonly cdnUrl: string;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.logger.log('--- Inicializando UploadCloudService ---');
    this.logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);

    // Carregar variáveis de ambiente manualmente se necessário
    this.loadEnvironmentVariables();

    // Debug: verificar variáveis de ambiente diretamente
    this.logger.log(`MINIO_ENDPOINT (process.env): ${process.env.MINIO_ENDPOINT}`);
    this.logger.log(`MINIO_ACCESS_KEY (process.env): ${process.env.MINIO_ACCESS_KEY ? 'Encontrado' : 'NÃO ENCONTRADO'}`);

    // Usar process.env diretamente em vez do ConfigService
    this.cdnUrl = process.env.CDN_URL || 'https://cdn.kmiza27.com';
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'img';

    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;

    this.logger.log(`Valor de MINIO_ENDPOINT: ${endpoint}`);
    this.logger.log(`Valor de MINIO_ACCESS_KEY: ${accessKey ? 'Encontrado' : 'NÃO ENCONTRADO'}`);

    if (!endpoint) {
      this.logger.warn('MINIO_ENDPOINT não está configurado. O upload de arquivos estará desabilitado.');
      return;
    }
    
    const port = parseInt(process.env.MINIO_PORT || '443', 10);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const secretKey = process.env.MINIO_SECRET_KEY;

    if (!accessKey || !secretKey) {
      this.logger.error('MINIO_ACCESS_KEY ou MINIO_SECRET_KEY não encontrados');
      return;
    }

    this.s3Client = new S3Client({
      endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1', // Região padrão para MinIO
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Necessário para MinIO
    });

    this.logger.log(`Serviço de Upload inicializado. Endpoint: ${endpoint}, Bucket: ${this.bucketName}`);
  }

  private loadEnvironmentVariables(): void {
    const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
    const envPath = path.join(__dirname, '..', '..', '..', envFile);

    this.logger.log(`Tentando carregar variáveis de: ${envPath}`);

    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        envVars.forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (!process.env[key]) {
              process.env[key] = value;
              this.logger.log(`Carregada variável: ${key}`);
            }
          }
        });
        
        this.logger.log(`✅ Variáveis carregadas de: ${envFile}`);
      } catch (error) {
        this.logger.error(`Erro ao carregar ${envFile}: ${error.message}`);
      }
    } else {
      this.logger.warn(`⚠️  Arquivo ${envFile} não encontrado em ${envPath}`);
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
    if (!this.s3Client) {
      this.logger.error('S3 Client não inicializado. Verifique a configuração do MinIO.');
      throw new Error('Serviço de upload não configurado.');
    }

    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Torna o objeto publicamente acessível
    });

    try {
      await this.s3Client.send(command);
      const publicUrl = `${this.cdnUrl}/${key}`;
      this.logger.log(`Arquivo enviado com sucesso para ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload do arquivo para o S3: ${error.message}`, error.stack);
      throw new Error('Erro no upload do arquivo.');
    }
  }
} 