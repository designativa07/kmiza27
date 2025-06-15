import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, accessSync, constants } from 'fs';
import { tmpdir } from 'os';

@Injectable()
export class UploadService {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly uploadDir: string;

  constructor() {
    // Configurar diretório de upload baseado no ambiente
    if (this.isProduction) {
      // Em produção, tentar usar /img primeiro, depois fallback para tmpdir
      const preferredDir = '/img';
      if (this.canUseDirectory(preferredDir)) {
        this.uploadDir = preferredDir;
        console.log('✅ Usando diretório /img para uploads');
      } else {
        this.uploadDir = join(tmpdir(), 'futepedia-uploads');
        console.log('⚠️ Diretório /img não disponível, usando tmpdir:', this.uploadDir);
      }
    } else {
      // Em desenvolvimento, usar diretório local
      this.uploadDir = join(process.cwd(), 'uploads');
    }

    // Criar diretório se não existir
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    try {
      if (!existsSync(this.uploadDir)) {
        mkdirSync(this.uploadDir, { recursive: true });
      }

      // Criar subdiretórios necessários
      const subDirs = ['logo-competition', 'team-logos', 'player-photos'];
      subDirs.forEach(subDir => {
        const fullPath = join(this.uploadDir, subDir);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
      });
    } catch (error) {
      console.error('Erro ao criar diretórios de upload:', error);
    }
  }

  getUploadPath(type: 'logo-competition' | 'team-logos' | 'player-photos'): string {
    return join(this.uploadDir, type);
  }

  getPublicUrl(filename: string, type: 'logo-competition' | 'team-logos' | 'player-photos'): string {
    if (this.isProduction) {
      // Se estiver usando /img, retornar URL real, senão placeholder
      if (this.uploadDir === '/img') {
        return `/${type}/${filename}`;
      } else {
        // Fallback para placeholder se não conseguir usar /img
        return this.getPlaceholderUrl(type);
      }
    } else {
      // Em desenvolvimento, retornar caminho local
      return `/${type}/${filename}`;
    }
  }

  private getPlaceholderUrl(type: string): string {
    const placeholders = {
      'logo-competition': 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=LOGO',
      'team-logos': 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=TIME',
      'player-photos': 'https://via.placeholder.com/120x120/F59E0B/FFFFFF?text=JOGADOR'
    };
    
    return placeholders[type] || 'https://via.placeholder.com/100x100/6B7280/FFFFFF?text=IMG';
  }

  isProductionEnvironment(): boolean {
    return this.isProduction;
  }

  private canUseDirectory(dirPath: string): boolean {
    try {
      // Verificar se o diretório existe
      if (!existsSync(dirPath)) {
        return false;
      }
      
      // Verificar se tem permissão de escrita
      accessSync(dirPath, constants.W_OK);
      return true;
    } catch (error) {
      console.log(`Diretório ${dirPath} não tem permissão de escrita:`, error.message);
      return false;
    }
  }
} 