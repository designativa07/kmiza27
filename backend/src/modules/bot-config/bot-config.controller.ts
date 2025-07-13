import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BotConfigService } from './bot-config.service';
import { BotConfig } from '../../entities/bot-config.entity';

@Controller('bot-config')
export class BotConfigController {
  constructor(private readonly botConfigService: BotConfigService) {}

  @Get()
  async getAllConfigs(): Promise<BotConfig[]> {
    return await this.botConfigService.getAllConfigs();
  }

  @Get(':key')
  async getConfig(@Param('key') key: string): Promise<{ value: string | null }> {
    const value = await this.botConfigService.getConfig(key);
    return { value };
  }

  @Post()
  async createConfig(@Body() body: {
    key: string;
    value: string;
    description?: string;
    type?: 'string' | 'text' | 'number' | 'boolean' | 'json';
  }): Promise<BotConfig> {
    return await this.botConfigService.setConfig(body.key, body.value, body.description);
  }

  @Put(':id')
  async updateConfig(
    @Param('id') id: number,
    @Body() updates: Partial<BotConfig>
  ): Promise<BotConfig | null> {
    return await this.botConfigService.updateConfig(id, updates);
  }

  @Delete(':id')
  async deleteConfig(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.botConfigService.deleteConfig(id);
    return { success: true };
  }

  @Post('reset-defaults')
  async resetDefaults(): Promise<{ success: boolean }> {
    // Recriar configurações padrão
    const defaultConfigs = [
      {
        key: 'BOT_NOME',
        value: 'Kmiza27 Bot',
        description: 'Nome do bot exibido nos menus e mensagens'
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
        description: 'Mensagem de boas-vindas do bot'
      },
      {
        key: 'auto_response_enabled',
        value: 'true',
        description: 'Habilitar respostas automáticas do bot'
      }
    ];

    for (const config of defaultConfigs) {
      await this.botConfigService.setConfig(config.key, config.value, config.description);
    }

    return { success: true };
  }
} 