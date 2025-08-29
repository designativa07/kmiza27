import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { AIResearchService, ResearchConfig } from './ai-research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai-research')
@UseGuards(JwtAuthGuard)
export class AIResearchController {
  constructor(private readonly aiResearchService: AIResearchService) {}

  /**
   * GET /ai-research/config
   * Retorna configuração atual
   */
  @Get('config')
  getConfig(): ResearchConfig {
    return this.aiResearchService.getConfig();
  }

  /**
   * PUT /ai-research/config
   * Atualiza configuração
   */
  @Put('config')
  updateConfig(@Body() config: Partial<ResearchConfig>): { success: boolean; message: string } {
    try {
      this.aiResearchService.updateConfig(config);
      return {
        success: true,
        message: 'Configuração atualizada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao atualizar configuração: ${error.message}`
      };
    }
  }

  /**
   * GET /ai-research/stats
   * Retorna estatísticas de uso
   */
  @Get('stats')
  getStats() {
    return this.aiResearchService.getStats();
  }

  /**
   * POST /ai-research/clear-cache
   * Limpa cache de respostas
   */
  @Post('clear-cache')
  clearCache(): { success: boolean; message: string } {
    try {
      this.aiResearchService.clearCache();
      return {
        success: true,
        message: 'Cache limpo com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao limpar cache: ${error.message}`
      };
    }
  }

  /**
   * POST /ai-research/test
   * Testa funcionalidade com uma pergunta
   */
  @Post('test')
  async testResearch(@Body() body: { message: string }) {
    try {
      const result = await this.aiResearchService.researchQuestion(body.message);
      return {
        success: true,
        result,
        message: 'Teste executado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro no teste: ${error.message}`,
        result: null
      };
    }
  }
}
