import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchesService } from '../matches/matches.service';
import OpenAI from 'openai';
import axios from 'axios';

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
  private openai: OpenAI | null = null;
  private config: ResearchConfig = {
    enabled: true,
    openAI: true, // ✅ HABILITADO para usar OpenAI real
    knowledgeBase: true, // Habilitado para responder perguntas sobre jogos
    webSearch: true, // ✅ HABILITADO para pesquisa web
    maxTokens: 1500,
    temperature: 0.7,
    confidenceThreshold: 0.6,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly matchesService: MatchesService,
  ) {
    // Inicializar OpenAI se a chave estiver disponível
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ OpenAI inicializado com sucesso');
    } else {
      this.logger.warn('⚠️ OPENAI_API_KEY não encontrada - respostas de IA desabilitadas');
      this.config.openAI = false;
      this.config.webSearch = false;
    }
  }

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
      this.logger.debug(`🔄 Cache hit para: ${message}`);
      return this.responseCache.get(cacheKey)!;
    }

    try {
      // 1️⃣ PRIMEIRO: Tentar base de conhecimento local
      if (this.config.knowledgeBase) {
        this.logger.log(`🔍 Tentando base de conhecimento local para: "${message}"`);
        const kbResult = await this.researchKnowledgeBase(message, context);
        if (kbResult.success) {
          this.logger.log(`✅ Resposta encontrada na base de conhecimento`);
          this.cacheResult(cacheKey, kbResult);
          return kbResult;
        }
        this.logger.debug(`❌ Base de conhecimento não tem resposta`);
      }

      // 2️⃣ SEGUNDO: Tentar OpenAI diretamente
      if (this.config.openAI && this.openai) {
        this.logger.log(`🤖 Tentando OpenAI para: "${message}"`);
        const aiResult = await this.researchWithOpenAI(message, context);
        if (aiResult.success) {
          this.logger.log(`✅ Resposta gerada pela OpenAI`);
          this.cacheResult(cacheKey, aiResult);
          return aiResult;
        }
        this.logger.debug(`❌ OpenAI não conseguiu responder com confiança`);
      }

      // 3️⃣ TERCEIRO: Tentar pesquisa web + OpenAI
      if (this.config.webSearch && this.openai) {
        this.logger.log(`🌐 Tentando pesquisa web para: "${message}"`);
        const webResult = await this.researchWithWebSearch(message, context);
        if (webResult.success) {
          this.logger.log(`✅ Resposta encontrada via pesquisa web`);
          this.cacheResult(cacheKey, webResult);
          return webResult;
        }
        this.logger.debug(`❌ Pesquisa web não retornou resultados úteis`);
      }

      // 4️⃣ FALLBACK: Nenhum método funcionou
      this.logger.warn(`⚠️ Nenhum método conseguiu responder: "${message}"`);
      const fallbackResult = this.createFallbackResult();
      this.cacheResult(cacheKey, fallbackResult);
      return fallbackResult;

    } catch (error) {
      this.logger.error(`❌ Erro na pesquisa de IA: ${error.message}`, error.stack);
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
      
      // ⚠️ TEMPORARIAMENTE DESABILITADO: Artilheiros e Jogadores
      // Não temos dados completos de jogadores ainda, deixar IA responder
      // Reabilitar quando cadastrarmos os dados reais
      /*
      if (this.isTopScorersQuestion(lowerMessage)) {
        const scorersResult = await this.searchTopScorers(lowerMessage);
        if (scorersResult.success) {
          return scorersResult;
        }
      }
      */
      
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

  /**
   * Usa OpenAI diretamente para responder perguntas gerais sobre futebol
   */
  private async researchWithOpenAI(
    message: string,
    context?: { competitionId?: number; userId?: string; conversationHistory?: string[] }
  ): Promise<AIResearchResult> {
    if (!this.openai) {
      return {
        success: false,
        confidence: 0.0,
        source: 'openai',
        reasoning: 'OpenAI não inicializado'
      };
    }

    try {
      const systemPrompt = `Você é um assistente especializado em futebol brasileiro e internacional.
Responda perguntas sobre futebol de forma clara, concisa e informativa.
Se você não tiver certeza sobre algo, seja honesto e diga que não sabe.
Mantenha as respostas focadas e objetivas, com no máximo 300 palavras.
Use emojis relevantes para deixar as respostas mais amigáveis.

Contexto adicional:
- Você é parte de um chatbot de futebol chamado Futepédia
- Os usuários podem perguntar sobre times, jogadores, campeonatos, estatísticas, etc.
- Priorize informações sobre futebol brasileiro quando relevante`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const answer = completion.choices[0]?.message?.content;
      
      if (!answer || answer.toLowerCase().includes('não sei') || answer.toLowerCase().includes('não tenho informação')) {
        return {
          success: false,
          confidence: 0.3,
          source: 'openai',
          reasoning: 'OpenAI não tem informação suficiente'
        };
      }

      return {
        success: true,
        answer: answer.trim(),
        confidence: 0.85,
        source: 'openai',
        reasoning: 'Resposta gerada pela OpenAI baseada no conhecimento geral'
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao consultar OpenAI: ${error.message}`);
      return {
        success: false,
        confidence: 0.0,
        source: 'openai',
        reasoning: `Erro na API: ${error.message}`
      };
    }
  }

  /**
   * Pesquisa na web usando DuckDuckGo e sintetiza resposta com OpenAI
   */
  private async researchWithWebSearch(
    message: string,
    context?: { competitionId?: number; userId?: string; conversationHistory?: string[] }
  ): Promise<AIResearchResult> {
    if (!this.openai) {
      return {
        success: false,
        confidence: 0.0,
        source: 'web_search',
        reasoning: 'OpenAI não inicializado'
      };
    }

    try {
      // Pesquisar na web usando DuckDuckGo Instant Answer API (gratuita e sem chave)
      const searchQuery = encodeURIComponent(`${message} futebol`);
      const searchUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`;
      
      this.logger.debug(`🔍 Pesquisando na web: ${searchUrl}`);
      
      const searchResponse = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Futepedia-Bot/1.0'
        }
      });

      const searchData = searchResponse.data;
      let webContext = '';

      // Extrair informações relevantes
      if (searchData.Abstract) {
        webContext += `Resumo: ${searchData.Abstract}\n`;
      }
      if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
        const topics = searchData.RelatedTopics
          .slice(0, 3)
          .filter((t: any) => t.Text)
          .map((t: any) => t.Text)
          .join('\n');
        if (topics) {
          webContext += `\nInformações relacionadas:\n${topics}\n`;
        }
      }

      // Se não encontrou nada útil, tentar uma busca mais genérica
      if (!webContext.trim()) {
        this.logger.debug(`❌ DuckDuckGo não retornou resultados úteis`);
        
        // Tentar Google Custom Search ou outra fonte
        // Por enquanto, retornar falha
        return {
          success: false,
          confidence: 0.0,
          source: 'web_search',
          reasoning: 'Nenhum resultado relevante encontrado na web'
        };
      }

      // Usar OpenAI para sintetizar a informação encontrada
      const systemPrompt = `Você é um assistente especializado em futebol.
Baseado nas informações da web fornecidas, responda a pergunta do usuário de forma clara e concisa.
Se as informações não forem suficientes, diga isso honestamente.
Use no máximo 300 palavras e inclua emojis relevantes.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Pergunta: ${message}\n\nInformações da web:\n${webContext}\n\nResponda baseado nessas informações:` }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.5, // Temperatura menor para ser mais factual
      });

      const answer = completion.choices[0]?.message?.content;
      
      if (!answer) {
        return {
          success: false,
          confidence: 0.0,
          source: 'web_search',
          reasoning: 'Não foi possível sintetizar resposta'
        };
      }

      return {
        success: true,
        answer: answer.trim(),
        confidence: 0.75,
        source: 'web_search',
        reasoning: 'Resposta baseada em pesquisa web + síntese OpenAI'
      };

    } catch (error) {
      this.logger.error(`❌ Erro na pesquisa web: ${error.message}`);
      return {
        success: false,
        confidence: 0.0,
        source: 'web_search',
        reasoning: `Erro na pesquisa: ${error.message}`
      };
    }
  }

  private isGameQuestion(message: string): boolean {
    // Verificar se é pergunta sobre jogador específico (quem foi/é)
    const playerQuestionPatterns = ['quem foi', 'quem é', 'quem era'];
    if (playerQuestionPatterns.some(pattern => message.includes(pattern))) {
      return false; // Não é pergunta sobre jogo, deixar IA responder
    }
    
    const gameKeywords = [
      'onde vai passar', 'onde passa', 'transmissão', 'jogo', 'partida', 'confronto',
      'botafogo', 'bragantino', 'flamengo', 'fluminense', 'vasco', 'são paulo',
      'palmeiras', 'santos', 'corinthians', 'cruzeiro', 'atlético', 'grêmio',
      'internacional', 'bahia', 'vitória', 'fortaleza', 'ceará', 'sport'
    ];
    
    return gameKeywords.some(keyword => message.includes(keyword));
  }

  // ⚠️ TEMPORARIAMENTE NÃO UTILIZADO - Reabilitar quando cadastrarmos jogadores
  private isTopScorersQuestion(message: string): boolean {
    const scorerKeywords = [
      'artilheiro', 'artilheiros', 'gols', 'gol', 'marcou', 'marcaram',
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
