import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../../entities/system-setting.entity';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async getAllSettings() {
    return this.systemSettingRepository.find();
  }

  async getSetting(key: string) {
    const setting = await this.systemSettingRepository.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async updateSetting(key: string, value: any, description?: string) {
    let setting = await this.systemSettingRepository.findOne({ where: { key } });
    
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      setting.updated_at = new Date();
    } else {
      setting = this.systemSettingRepository.create({
        key,
        value,
        description: description || `Configuração ${key}`,
      });
    }
    
    await this.systemSettingRepository.save(setting);
    return setting;
  }

  async getEvolutionApiSettings() {
    const settings = await this.systemSettingRepository.find({
      where: [
        { key: 'evolution_api_url' },
        { key: 'evolution_api_key' },
        { key: 'evolution_instance_name' },
        { key: 'evolution_enabled' },
      ],
    });

    const result = {
      apiUrl: settings.find(s => s.key === 'evolution_api_url')?.value || process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com',
      apiKey: settings.find(s => s.key === 'evolution_api_key')?.value || process.env.EVOLUTION_API_KEY || '',
      instanceName: settings.find(s => s.key === 'evolution_instance_name')?.value || process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27',
      enabled: settings.find(s => s.key === 'evolution_enabled')?.value !== false,
    };

    // Mascarar a API Key para segurança
    if (result.apiKey) {
      result.apiKey = result.apiKey.substring(0, 8) + '...';
    }

    return result;
  }

  async updateEvolutionApiSettings(settings: {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
    enabled: boolean;
  }) {
    const updates = [
      { key: 'evolution_api_url', value: settings.apiUrl, description: 'URL da Evolution API' },
      { key: 'evolution_api_key', value: settings.apiKey, description: 'API Key da Evolution API' },
      { key: 'evolution_instance_name', value: settings.instanceName, description: 'Nome da instância WhatsApp' },
      { key: 'evolution_enabled', value: settings.enabled, description: 'WhatsApp habilitado' },
    ];

    for (const update of updates) {
      await this.updateSetting(update.key, update.value, update.description);
    }

    this.logger.log('🔧 Configurações da Evolution API atualizadas');
    return { success: true, message: 'Configurações atualizadas com sucesso' };
  }

  async testEvolutionApiConnection() {
    try {
      const settings = await this.getEvolutionApiSettings();
      
      // Obter a API Key real (não mascarada)
      const apiKeySetting = await this.systemSettingRepository.findOne({ 
        where: { key: 'evolution_api_key' } 
      });
      const realApiKey = apiKeySetting?.value || process.env.EVOLUTION_API_KEY;

      if (!realApiKey) {
        return { success: false, message: 'API Key não configurada' };
      }

      this.logger.log('🧪 Testando conexão com Evolution API...');
      
      const response = await fetch(`${settings.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': realApiKey,
        },
      });

      if (response.ok) {
        const instances = await response.json();
        const targetInstance = instances.find((i: any) => i.name === settings.instanceName);
        
        if (targetInstance) {
          this.logger.log(`✅ Instância ${settings.instanceName} encontrada - Status: ${targetInstance.connectionStatus}`);
          return {
            success: true,
            message: 'Conexão bem-sucedida',
            instance: {
              name: targetInstance.name,
              status: targetInstance.connectionStatus,
              id: targetInstance.id,
            },
          };
        } else {
          this.logger.warn(`⚠️ Instância ${settings.instanceName} não encontrada`);
          return {
            success: false,
            message: `Instância ${settings.instanceName} não encontrada`,
            availableInstances: instances.map((i: any) => i.name),
          };
        }
      } else {
        const error = await response.text();
        this.logger.error(`❌ Erro na Evolution API: ${response.status} - ${error}`);
        return {
          success: false,
          message: `Erro na API: ${response.status}`,
          error,
        };
      }
    } catch (error) {
      this.logger.error('❌ Erro ao testar conexão:', error);
      return {
        success: false,
        message: 'Erro de conexão',
        error: error.message,
      };
    }
  }

  // Método para obter configurações reais (sem mascarar) - uso interno
  async getEvolutionApiSettingsReal() {
    const settings = await this.systemSettingRepository.find({
      where: [
        { key: 'evolution_api_url' },
        { key: 'evolution_api_key' },
        { key: 'evolution_instance_name' },
        { key: 'evolution_enabled' },
      ],
    });

    return {
      apiUrl: settings.find(s => s.key === 'evolution_api_url')?.value || process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com',
      apiKey: settings.find(s => s.key === 'evolution_api_key')?.value || process.env.EVOLUTION_API_KEY || '',
      instanceName: settings.find(s => s.key === 'evolution_instance_name')?.value || process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27',
      enabled: settings.find(s => s.key === 'evolution_enabled')?.value !== false,
    };
  }
} 