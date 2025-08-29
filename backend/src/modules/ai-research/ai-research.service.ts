import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchesService } from '../matches/matches.service';

export interface AIResearchResult {
  success: boolean;
  answer?: string;
  confidence: number;
  source: string;
  reasoning?: string;
}

export interface ResearchConfig {
  enabled: boolean;
  openAI: boolean;
  knowledgeBase: boolean;
  webSearch: boolean;
  maxTokens: number;
  temperature: number;
  confidenceThreshold: number;
}

@Injectable()
export class AIResearchService {
  private readonly logger = new Logger(AIResearchService.name);
  private readonly responseCache = new Map<string, AIResearchResult>();
  private config: ResearchConfig = {
    enabled: true,
    openAI: false, // Temporariamente desabilitado
    knowledgeBase: true, // Habilitado para responder perguntas sobre jogos
    webSearch: false,
    maxTokens: 1000,
    temperature: 0.7,
    confidenceThreshold: 0.6,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly matchesService: MatchesService,
  ) {}

  async researchQuestion(
    message: string,
    context?: {
      competitionId?: number;
      userId?: string;
      conversationHistory?: string[];
    }
  ): Promise<AIResearchResult> {
    if (!this.config.enabled) {
      return this.createFallbackResult();
    }

    const cacheKey = this.generateCacheKey(message, context);
    if (this.responseCache.has(cacheKey)) {
      this.logger.debug(`Cache hit for: ${message}`);
      return this.responseCache.get(cacheKey)!;
    }

    try {
      // Tentar base de conhecimento
      if (this.config.knowledgeBase) {
        const kbResult = await this.researchKnowledgeBase(message, context);
        if (kbResult.success) {
          this.cacheResult(cacheKey, kbResult);
          return kbResult;
        }
      }

      // Fallback padrão
      const fallbackResult = this.createFallbackResult();
      this.cacheResult(cacheKey, fallbackResult);
      return fallbackResult;

    } catch (error) {
      this.logger.error(`Error in AI research: ${error.message}`, error.stack);
      return this.createFallbackResult();
    }
  }

  private async researchKnowledgeBase(message: string, context?: { competitionId?: number; userId?: string; conversationHistory?: string[] }) {
    this.logger.debug(`🔍 Pesquisando na base de conhecimento: ${message}`);
    
    try {
      // Converter mensagem para minúsculas para facilitar a busca
      const lowerMessage = message.toLowerCase();
      
      // Buscar por padrões relacionados a jogos e transmissões
      if (this.isGameQuestion(lowerMessage)) {
        const gameResult = await this.searchGameInformation(lowerMessage);
        if (gameResult.success) {
          return gameResult;
        }
      }
      
      // Buscar por padrões relacionados a artilheiros
      if (this.isTopScorersQuestion(lowerMessage)) {
        const scorersResult = await this.searchTopScorers(lowerMessage);
        if (scorersResult.success) {
          return scorersResult;
        }
      }
      
      // Se não encontrou nada específico
      this.logger.debug(`❌ Nenhuma informação encontrada na base para: ${message}`);
      return {
        success: false,
        confidence: 0.0,
        source: 'knowledge_base',
        reasoning: 'Pergunta não reconhecida na base de conhecimento',
      };
      
    } catch (error) {
      this.logger.error(`❌ Erro na pesquisa da base de conhecimento: ${error.message}`, error.stack);
      return {
        success: false,
        confidence: 0.0,
        source: 'knowledge_base',
        reasoning: `Erro interno: ${error.message}`,
      };
    }
  }

  private isGameQuestion(message: string): boolean {
    const gameKeywords = [
      'onde vai passar', 'onde passa', 'transmissão', 'jogo', 'partida', 'confronto',
      'botafogo', 'bragantino', 'flamengo', 'fluminense', 'vasco', 'são paulo',
      'palmeiras', 'santos', 'corinthians', 'cruzeiro', 'atlético', 'grêmio',
      'internacional', 'bahia', 'vitória', 'fortaleza', 'ceará', 'sport'
    ];
    
    return gameKeywords.some(keyword => message.includes(keyword));
  }

  private isTopScorersQuestion(message: string): boolean {
    const scorerKeywords = [
      'artilheiro', 'artilheiros', 'gols', 'gol', 'marcou', 'marcaram',
      'cristiano ronaldo', 'ronaldo', 'messi', 'neymar', 'vini jr'
    ];
    
    return scorerKeywords.some(keyword => message.includes(keyword));
  }

  private async searchGameInformation(message: string): Promise<AIResearchResult> {
    try {
      // Buscar todos os jogos da semana para encontrar o que o usuário está perguntando
      const weekMatches = await this.matchesService.getWeekMatches();
      
      if (!weekMatches || weekMatches.length === 0) {
        return {
          success: false,
          confidence: 0.0,
          source: 'knowledge_base',
          reasoning: 'Nenhum jogo encontrado para esta semana',
        };
      }

      // Extrair nomes de times da mensagem
      const teams = this.extractTeamNames(message);
      
      if (teams.length === 0) {
        return {
          success: false,
          confidence: 0.0,
          source: 'knowledge_base',
          reasoning: 'Não foi possível identificar times na pergunta',
        };
      }

      // Buscar jogos que envolvem os times mencionados
      const relevantMatches = weekMatches.filter(match => {
        const homeTeam = match.home_team?.name?.toLowerCase() || '';
        const awayTeam = match.away_team?.name?.toLowerCase() || '';
        
        return teams.some(team => 
          homeTeam.includes(team) || awayTeam.includes(team)
        );
      });

      if (relevantMatches.length === 0) {
        return {
          success: false,
          confidence: 0.0,
          source: 'knowledge_base',
          reasoning: `Nenhum jogo encontrado para os times: ${teams.join(', ')}`,
        };
      }

      // Formatar resposta com informações dos jogos encontrados
      const matchInfo = relevantMatches.map(match => {
        const homeTeam = match.home_team?.name || 'Time Casa';
        const awayTeam = match.away_team?.name || 'Time Visitante';
        const date = new Date(match.match_date).toLocaleDateString('pt-BR');
        const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const stadium = match.stadium?.name || 'Local não informado';
        const channels = match.broadcast_channels || [];
        
        let broadcastInfo = 'Sem transmissão confirmada';
        if (channels.length > 0) {
          broadcastInfo = channels.join(', ');
        }
        
        return `⚽ **${homeTeam} vs ${awayTeam}**
📅 ${date} às ${time}
🏟️ ${stadium}
📺 ${broadcastInfo}`;
      }).join('\n\n');

      return {
        success: true,
        confidence: 0.9,
        source: 'knowledge_base',
        answer: `🔍 Encontrei informações sobre os jogos que você perguntou:\n\n${matchInfo}`,
        reasoning: `Jogos encontrados para os times: ${teams.join(', ')}`,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar informações de jogos: ${error.message}`);
      return {
        success: false,
        confidence: 0.0,
        source: 'knowledge_base',
        reasoning: `Erro ao buscar jogos: ${error.message}`,
      };
    }
  }

  private async searchTopScorers(message: string): Promise<AIResearchResult> {
    try {
      const topScorers = await this.matchesService.getTopScorers();
      
      if (!topScorers || topScorers.length === 0) {
        return {
          success: false,
          confidence: 0.0,
          source: 'knowledge_base',
          reasoning: 'Nenhum artilheiro encontrado',
        };
      }

      // Formatar lista de artilheiros
      const scorersList = topScorers.slice(0, 10).map((scorer, index) => {
        const position = index + 1;
        const playerName = scorer.player_name || 'Jogador';
        const team = scorer.team_name || 'Time';
        const goals = scorer.goals || 0;
        
        return `${position}º ${playerName} (${team}) - ${goals} gols`;
      }).join('\n');

      return {
        success: true,
        confidence: 0.9,
        source: 'knowledge_base',
        answer: `⚽ **ARTILHEIROS**\n\n${scorersList}`,
        reasoning: 'Lista de artilheiros obtida com sucesso',
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar artilheiros: ${error.message}`);
      return {
        success: false,
        confidence: 0.0,
        source: 'knowledge_base',
        reasoning: `Erro ao buscar artilheiros: ${error.message}`,
      };
    }
  }

  private extractTeamNames(message: string): string[] {
    const teamMappings = {
      'botafogo': 'botafogo',
      'bragantino': 'bragantino',
      'rb bragantino': 'bragantino',
      'flamengo': 'flamengo',
      'fluminense': 'fluminense',
      'vasco': 'vasco',
      'são paulo': 'são paulo',
      'palmeiras': 'palmeiras',
      'santos': 'santos',
      'corinthians': 'corinthians',
      'cruzeiro': 'cruzeiro',
      'atlético': 'atlético',
      'grêmio': 'grêmio',
      'internacional': 'internacional',
      'bahia': 'bahia',
      'vitória': 'vitória',
      'fortaleza': 'fortaleza',
      'ceará': 'ceará',
      'sport': 'sport'
    };

    const foundTeams: string[] = [];
    
    for (const [key, value] of Object.entries(teamMappings)) {
      if (message.includes(key)) {
        foundTeams.push(value);
      }
    }

    return foundTeams;
  }

  private generateCacheKey(message: string, context?: {
    competitionId?: number;
    userId?: string;
    conversationHistory?: string[];
  }): string {
    const parts = [message];
    if (context?.competitionId) {
      parts.push(`competition:${context.competitionId}`);
    }
    if (context?.userId) {
      parts.push(`user:${context.userId}`);
    }
    if (context?.conversationHistory) {
      parts.push(`history:${context.conversationHistory.join(',')}`);
    }
    return parts.join('|');
  }

  private cacheResult(key: string, result: AIResearchResult) {
    if (this.responseCache.size >= 100) {
      // Limitar cache a 100 entradas
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    this.responseCache.set(key, result);
    this.logger.debug(`Cached result for key: ${key}`);
  }

  private createFallbackResult(): AIResearchResult {
    this.logger.warn('Using fallback result for research.');
    return {
      success: false,
      confidence: 0.0,
      source: 'fallback',
      reasoning: 'Não foi possível obter uma resposta confiável.',
    };
  }

  updateConfig(newConfig: Partial<ResearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log(`AI Research config updated: ${JSON.stringify(newConfig)}`);
  }

  getConfig(): ResearchConfig {
    return { ...this.config };
  }

  clearCache(): void {
    this.responseCache.clear();
    this.logger.log('AI Research cache cleared');
  }

  getStats() {
    return {
      cacheSize: this.responseCache.size,
      config: this.config,
      timestamp: new Date().toISOString(),
    };
  }
}
