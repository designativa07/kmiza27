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
        key: 'openai_prompt',
        value: `Você é um assistente especializado em futebol brasileiro. Sua função é ajudar usuários com informações sobre:

- Próximos jogos dos times
- Resultados de partidas
- Classificações de campeonatos
- Notícias do futebol
- Escalações dos times

Responda sempre de forma amigável, usando emojis relacionados ao futebol. Quando o usuário mencionar apenas o nome de um time (como "Flamengo"), assuma que ele quer saber sobre o próximo jogo desse time.

Mantenha as respostas concisas e informativas.`,
        description: 'Prompt principal para o OpenAI processar mensagens'
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
      }
    ];

    for (const config of defaultConfigs) {
      await this.botConfigService.setConfig(config.key, config.value, config.description);
    }

    return { success: true };
  }
} 