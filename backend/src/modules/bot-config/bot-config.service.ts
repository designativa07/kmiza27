import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotConfig } from '../../entities/bot-config.entity';

@Injectable()
export class BotConfigService {
  constructor(
    @InjectRepository(BotConfig)
    private botConfigRepository: Repository<BotConfig>,
  ) {
    // Inicializar configurações padrão de forma assíncrona e segura
    this.initializeDefaultConfigs().catch(error => {
      console.error('❌ Erro ao inicializar configurações padrão do bot:', error);
      console.log('⚠️ O sistema continuará funcionando, mas as configurações do bot podem não estar disponíveis');
    });
  }

  private async initializeDefaultConfigs() {
    try {
      // Verificar se a tabela existe antes de tentar acessá-la
      const queryRunner = this.botConfigRepository.manager.connection.createQueryRunner();
      const tableExists = await queryRunner.hasTable('bot_configs');
      await queryRunner.release();

      if (!tableExists) {
        console.log('⚠️ Tabela bot_configs não existe ainda. Pulando inicialização de configurações padrão.');
        return;
      }

      const defaultConfigs = [
        {
          key: 'openai_prompt',
          value: `Você é um assistente especializado em futebol brasileiro. Sua função é ajudar usuários com informações sobre:

- Próximos jogos dos times
- Resultados de partidas
- Classificações de campeonatos
- Notícias do futebol
- Escalações dos times

Responda sempre de forma amigável, usando emojis relacionados ao futebol. Quando o usuário mencionar apenas o nome de um time (como "Flamengo"), assuma que ele quer saber sobre o próximo jogo desse time.

Mantenha as respostas concisas e informativas.`,
          description: 'Prompt principal para o OpenAI processar mensagens',
          type: 'text' as const
        },
        {
          key: 'auto_response_enabled',
          value: 'true',
          description: 'Habilitar respostas automáticas do bot',
          type: 'boolean' as const
        },
        {
          key: 'confidence_threshold',
          value: '0.7',
          description: 'Limite mínimo de confiança para responder automaticamente',
          type: 'number' as const
        },
        {
          key: 'welcome_message',
          value: `👋 **Olá! Sou o Kmiza27 Bot** ⚽

🤖 Posso te ajudar com informações sobre futebol:

⚽ **Próximos jogos** - "Próximo jogo do Flamengo"
ℹ️ **Info do time** - "Informações do Palmeiras"  
📊 **Tabelas** - "Tabela do Brasileirão"
📅 **Jogos hoje** - "Jogos de hoje"
🏆 **Competições** - "Copa Libertadores"

💬 **O que você gostaria de saber?**`,
          description: 'Mensagem de boas-vindas do bot',
          type: 'text' as const
        }
      ];

      for (const config of defaultConfigs) {
        try {
          const existing = await this.botConfigRepository.findOne({
            where: { key: config.key }
          });

          if (!existing) {
            await this.botConfigRepository.save(config);
            console.log(`✅ Configuração padrão criada: ${config.key}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao criar configuração ${config.key}:`, error);
        }
      }

      console.log('✅ Inicialização de configurações padrão do bot concluída');
    } catch (error) {
      console.error('❌ Erro durante inicialização de configurações padrão:', error);
      throw error;
    }
  }

  async getConfig(key: string): Promise<string | null> {
    try {
      const config = await this.botConfigRepository.findOne({
        where: { key, active: true }
      });
      return config?.value || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar configuração ${key}:`, error);
      return null;
    }
  }

  async setConfig(key: string, value: string, description?: string): Promise<BotConfig> {
    let config = await this.botConfigRepository.findOne({ where: { key } });
    
    if (config) {
      config.value = value;
      if (description) config.description = description;
    } else {
      config = this.botConfigRepository.create({
        key,
        value,
        description,
        type: 'string'
      });
    }

    return await this.botConfigRepository.save(config);
  }

  async getAllConfigs(): Promise<BotConfig[]> {
    try {
      return await this.botConfigRepository.find({
        where: { active: true },
        order: { key: 'ASC' }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar todas as configurações:', error);
      return [];
    }
  }

  async updateConfig(id: number, updates: Partial<BotConfig>): Promise<BotConfig | null> {
    await this.botConfigRepository.update(id, updates);
    return await this.botConfigRepository.findOne({ where: { id } });
  }

  async deleteConfig(id: number): Promise<void> {
    await this.botConfigRepository.update(id, { active: false });
  }
} 