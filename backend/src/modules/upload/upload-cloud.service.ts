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
    this.logger.log('--- Inicializando UploadCloudService ---');
    this.logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);

    // Primeiro tentar usar ConfigService, depois carregar manualmente se necessário
    this.cdnUrl = this.configService.get('CDN_URL') || process.env.CDN_URL || 'https://cdn.kmiza27.com';
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || process.env.MINIO_BUCKET_NAME || 'img';

    let endpoint = this.configService.get('MINIO_ENDPOINT') || process.env.MINIO_ENDPOINT;
    let accessKey = this.configService.get('MINIO_ACCESS_KEY') || process.env.MINIO_ACCESS_KEY;
    let secretKey = this.configService.get('MINIO_SECRET_KEY') || process.env.MINIO_SECRET_KEY;

    // Se as variáveis não estão disponíveis, tentar carregar manualmente
    if (!endpoint || !accessKey || !secretKey) {
      this.logger.log('Variáveis do MinIO não encontradas via ConfigService, tentando carregar manualmente...');
      this.loadEnvironmentVariables();
      
      // Tentar novamente após carregamento manual
      endpoint = process.env.MINIO_ENDPOINT;
      accessKey = process.env.MINIO_ACCESS_KEY;
      secretKey = process.env.MINIO_SECRET_KEY;
    }

    // Debug: verificar variáveis de ambiente
    this.logger.log(`MINIO_ENDPOINT: ${endpoint || 'NÃO ENCONTRADO'}`);
    this.logger.log(`MINIO_ACCESS_KEY: ${accessKey ? 'Configurado' : 'NÃO ENCONTRADO'}`);
    this.logger.log(`MINIO_SECRET_KEY: ${secretKey ? 'Configurado' : 'NÃO ENCONTRADO'}`);

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

      this.logger.log(`✅ S3 Client inicializado com sucesso!`);
      this.logger.log(`   Endpoint: ${useSSL ? 'https' : 'http'}://${endpoint}:${port}`);
      this.logger.log(`   SSL: ${useSSL}`);
      this.logger.log(`   Bucket: ${this.bucketName}`);
      this.logger.log(`   Access Key: ${accessKey.substring(0, 5)}***`);
      
      // Testar conexão com MinIO
      this.testMinIOConnection();
    } catch (error) {
      this.logger.error(`Erro ao inicializar S3 Client: ${error.message}`);
      this.s3Client = null;
    }
  }

  private async testMinIOConnection() {
    if (!this.s3Client) return;
    
    try {
      this.logger.log(`🧪 Testando conexão com MinIO...`);
      const command = new ListBucketsCommand({});
      const result = await this.s3Client.send(command);
      this.logger.log(`✅ Conexão com MinIO bem-sucedida!`);
      this.logger.log(`📦 Buckets disponíveis: ${result.Buckets?.map(b => b.Name).join(', ') || 'Nenhum'}`);
      
      const bucketExists = result.Buckets?.some(b => b.Name === this.bucketName);
      if (!bucketExists) {
        this.logger.warn(`⚠️  Bucket "${this.bucketName}" não encontrado!`);
      } else {
        this.logger.log(`✅ Bucket "${this.bucketName}" encontrado!`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro na conexão com MinIO: ${error.message}`);
      this.logger.error(`   Código: ${error.Code || 'N/A'}`);
    }
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
            // Sempre definir no process.env (sobrescrever se necessário)
            process.env[key] = value;
            this.logger.log(`Carregada variável: ${key} = ${value.substring(0, 20)}...`);
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
    
    this.logger.log(`📤 Iniciando upload para MinIO:`);
    this.logger.log(`   Bucket: ${this.bucketName}`);
    this.logger.log(`   Key: ${key}`);
    this.logger.log(`   Content-Type: ${file.mimetype}`);
    this.logger.log(`   File Size: ${file.buffer.length} bytes`);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Remover ACL por enquanto - pode não ser suportado pelo MinIO
      // ACL: 'public-read',
    });

    try {
      this.logger.log(`🚀 Enviando arquivo para MinIO...`);
      const result = await this.s3Client.send(command);
      this.logger.log(`✅ Upload realizado com sucesso! ETag: ${result.ETag}`);
      
      const publicUrl = `${this.cdnUrl}/${this.bucketName}/${key}`;
      this.logger.log(`🔗 URL pública: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer upload do arquivo para o S3:`);
      this.logger.error(`   Erro: ${error.message}`);
      this.logger.error(`   Código: ${error.Code || 'N/A'}`);
      this.logger.error(`   Stack: ${error.stack}`);
      throw new Error('Erro no upload do arquivo.');
    }
  }
} 