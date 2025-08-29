import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../chatbot/openai.service';

export interface QueryAdaptationResult {
  adapted: boolean;
  intent?: string;
  confidence: number;
  adaptedMessage?: string;
  reasoning?: string;
  extractedTeams?: string[]; // Times extraídos pela IA
  extractedCompetition?: string; // Nome da competição extraído
}

@Injectable()
export class QueryAdapterService {
  private readonly logger = new Logger(QueryAdapterService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  // Mapeia perguntas naturais para intents específicos
  private readonly queryMappings = {
    // Transmissões e Canais
    'onde vai passar': 'broadcast_info',
    'que canal vai passar': 'broadcast_info',
    'em que canal': 'broadcast_info',
    'vai passar na tv': 'broadcast_info',
    'transmissão do jogo': 'broadcast_info',
    'onde assistir': 'broadcast_info',
    
    // Horários e Próximos Jogos
    'que horas é o jogo': 'next_match',
    'quando é o jogo': 'next_match',
    'horário do jogo': 'next_match',
    'próximo jogo': 'next_match',
    'quando joga': 'next_match',
    'data do jogo': 'next_match',
    
    // Tabela e Classificação
    'tabela de classificação': 'table',
    'classificação do brasileirão': 'table',
    'posição na tabela': 'table',
    'ranking dos times': 'table',
    'pontuação dos times': 'table',
    
    // Posição de Time Específico
    'posição do': 'team_position',
    'em que lugar está': 'team_position',
    'qual a posição': 'team_position',
    'lugar na tabela': 'team_position',
    
    // Artilheiros
    'artilheiros': 'top_scorers',
    'gols marcados': 'top_scorers',
    'quem marcou mais gols': 'top_scorers',
    'maior artilheiro': 'top_scorers',
    'ranking de artilheiros': 'top_scorers',
    
    // Jogos de Hoje
    'jogos de hoje': 'matches_today',
    'partidas de hoje': 'matches_today',
    'o que tem hoje': 'matches_today',
    'jogos hoje': 'matches_today',
    
    // Jogos da Semana
    'jogos da semana': 'matches_week',
    'partidas da semana': 'matches_week',
    'o que tem essa semana': 'matches_week',
    
    // Informações de Time
    'informações do time': 'team_info',
    'dados do time': 'team_info',
    'sobre o time': 'team_info',
    'história do time': 'team_info',
    
    // Informações de Competição
    'sobre o brasileirão': 'competition_info',
    'informações da competição': 'competition_info',
    'regras do campeonato': 'competition_info',
    'brasileirao': 'competition_info',
    'brasileiro': 'competition_info',
    'copa do brasil': 'competition_info',
    'libertadores': 'competition_info',
    'sul-americana': 'competition_info',
    'mundial': 'competition_info',
    'serie a': 'competition_info',
    'serie b': 'competition_info',
    'serie c': 'competition_info',
    'serie d': 'competition_info',
    
    // Estatísticas de Time
    'estatísticas do': 'team_statistics',
    'números do time': 'team_statistics',
    'dados estatísticos': 'team_statistics',
    
    // Elenco do Time
    'elenco do': 'team_squad',
    'jogadores do': 'team_squad',
    'plantel do': 'team_squad',
    'quem joga no': 'team_squad',
    
    // Informações de Jogador
    'sobre o jogador': 'player_info',
    'dados do jogador': 'player_info',
    'estatísticas do jogador': 'player_info',
    'quem é': 'player_info',
    
    // Canais de TV
    'canais de tv': 'channels_info',
    'que canais tem': 'channels_info',
    'emissoras de tv': 'channels_info',
    
    // Estatísticas da Competição
    'estatísticas do brasileirão': 'competition_stats',
    'números do campeonato': 'competition_stats',
    'dados da competição': 'competition_stats'
  };

  // Adapta a pergunta para um intent específico
  async adaptQueryToIntent(message: string): Promise<QueryAdaptationResult> {
    try {
      this.logger.debug(`🔍 Analisando query para adaptação: "${message}"`);
      
      const lowerMessage = message.toLowerCase();
      
      // Buscar por padrões conhecidos
      for (const [pattern, intent] of Object.entries(this.queryMappings)) {
        if (lowerMessage.includes(pattern)) {
          const confidence = this.calculatePatternConfidence(pattern, lowerMessage);
          
          this.logger.debug(`✅ Padrão encontrado: "${pattern}" → intent: ${intent} (confiança: ${confidence})`);
          
          // Extrair competição se for competition_info
          let extractedCompetition: string | undefined;
          if (intent === 'competition_info') {
            extractedCompetition = this.extractCompetitionName(message, pattern);
            this.logger.debug(`🏆 Competição extraída: "${extractedCompetition}"`);
          }
          
          return {
            adapted: true,
            intent,
            confidence,
            adaptedMessage: this.generateAdaptedMessage(message, intent),
            reasoning: `Padrão "${pattern}" mapeado para intent "${intent}"`,
            extractedCompetition
          };
        }
      }

      // Se não encontrou padrão, tentar análise semântica
      const semanticResult = await this.semanticAnalysis(lowerMessage);
      if (semanticResult.adapted) {
        this.logger.debug(`🧠 Análise semântica: intent: ${semanticResult.intent} (confiança: ${semanticResult.confidence})`);
        return semanticResult;
      }

      // Nenhuma adaptação encontrada
      this.logger.debug(`❌ Nenhuma adaptação encontrada para: "${message}"`);
      return {
        adapted: false,
        confidence: 0.0,
        reasoning: 'Nenhum padrão ou análise semântica encontrou uma adaptação adequada'
      };

    } catch (error) {
      this.logger.error(`❌ Erro na adaptação de query: ${error.message}`, error.stack);
      return {
        adapted: false,
        confidence: 0.0,
        reasoning: `Erro interno: ${error.message}`
      };
    }
  }



  // Análise semântica mais avançada
  private async semanticAnalysis(message: string): Promise<QueryAdaptationResult> {
    const keywords = this.extractKeywords(message);
    
    // Transmissões e canais
    if (this.hasKeywords(message, ['transmissão', 'canal', 'tv', 'assistir', 'passar'])) {
      return {
        adapted: true,
        intent: 'broadcast_info',
        confidence: 0.7,
        reasoning: 'Palavras-chave relacionadas a transmissão detectadas'
      };
    }
    
    // Horários e datas
    if (this.hasKeywords(message, ['horário', 'hora', 'quando', 'data', 'dia', 'próximo'])) {
      return {
        adapted: true,
        intent: 'next_match',
        confidence: 0.7,
        reasoning: 'Palavras-chave relacionadas a horários detectadas'
      };
    }
    
    // Tabela e classificação
    if (this.hasKeywords(message, ['tabela', 'classificação', 'posição', 'ranking', 'pontuação'])) {
      return {
        adapted: true,
        intent: 'table',
        confidence: 0.7,
        reasoning: 'Palavras-chave relacionadas a tabela detectadas'
      };
    }
    
    // Artilheiros e gols
    if (this.hasKeywords(message, ['artilheiro', 'gols', 'marcou', 'gol', 'artilheiros'])) {
      return {
        adapted: true,
        intent: 'top_scorers',
        confidence: 0.7,
        reasoning: 'Palavras-chave relacionadas a artilheiros detectadas'
      };
    }
    
    // Jogos e partidas
    if (this.hasKeywords(message, ['jogo', 'partida', 'confronto', 'jogos', 'partidas'])) {
      if (this.hasKeywords(message, ['hoje', 'agora'])) {
        return {
          adapted: true,
          intent: 'matches_today',
          confidence: 0.7,
          reasoning: 'Palavras-chave relacionadas a jogos de hoje detectadas'
        };
      }
      if (this.hasKeywords(message, ['semana', 'semana'])) {
        return {
          adapted: true,
          intent: 'matches_week',
          confidence: 0.7,
          reasoning: 'Palavras-chave relacionadas a jogos da semana detectadas'
        };
      }
    }
    
    // Times
    if (this.hasKeywords(message, ['time', 'equipe', 'clube'])) {
      return {
        adapted: true,
        intent: 'team_info',
        confidence: 0.6,
        reasoning: 'Palavras-chave relacionadas a times detectadas'
      };
    }
    
    // Jogadores
    if (this.hasKeywords(message, ['jogador', 'atleta', 'futebolista'])) {
      return {
        adapted: true,
        intent: 'player_info',
        confidence: 0.6,
        reasoning: 'Palavras-chave relacionadas a jogadores detectadas'
      };
    }
    
    return {
      adapted: false,
      confidence: 0.0,
      reasoning: 'Análise semântica não encontrou padrões reconhecíveis'
    };
  }

  // Verifica se a mensagem contém palavras-chave específicas
  private hasKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  // Extrai palavras-chave da mensagem
  private extractKeywords(message: string): string[] {
    // Remove palavras comuns (stop words)
    const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'é', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'que', 'qual', 'quem', 'onde', 'quando', 'como', 'porque', 'por que'];
    
    const words = message
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return words;
  }

  // Calcula a confiança baseada no padrão encontrado
  private calculatePatternConfidence(pattern: string, message: string): number {
    let confidence = 0.8; // Base
    
    // Padrões mais específicos têm maior confiança
    if (pattern.length > 10) confidence += 0.1;
    if (pattern.length > 15) confidence += 0.1;
    
    // Padrões que aparecem no início da mensagem têm maior confiança
    if (message.startsWith(pattern)) confidence += 0.1;
    
    // Limitar a confiança máxima
    return Math.min(confidence, 0.95);
  }

  // Gera uma mensagem adaptada para o intent
  private generateAdaptedMessage(originalMessage: string, intent: string): string {
    const intentDescriptions = {
      'broadcast_info': 'informações sobre transmissão',
      'next_match': 'próximo jogo',
      'table': 'tabela de classificação',
      'team_position': 'posição do time',
      'top_scorers': 'artilheiros',
      'matches_today': 'jogos de hoje',
      'matches_week': 'jogos da semana',
      'team_info': 'informações do time',
      'competition_info': 'informações da competição',
      'team_statistics': 'estatísticas do time',
      'team_squad': 'elenco do time',
      'player_info': 'informações do jogador',
      'channels_info': 'canais de TV',
      'competition_stats': 'estatísticas da competição'
    };

    const description = intentDescriptions[intent] || 'informação solicitada';
    return `🔍 Adaptei sua pergunta para buscar ${description}.`;
  }

  /**
   * Extrai times de uma pergunta usando IA do OpenAI
   */
  async extractTeamsWithAI(message: string): Promise<string[]> {
    try {
      this.logger.debug(`🤖 Extraindo times com IA: "${message}"`);
      
      // Prompt específico para extração de times
      const prompt = `
Analise a seguinte pergunta sobre futebol e extraia APENAS os nomes dos times mencionados.

PERGUNTA: "${message}"

REGRAS:
- Retorne APENAS os nomes dos times, um por linha
- Não inclua palavras como "hoje", "amanhã", "canal", "onde", etc.
- Se não houver times, retorne "NENHUM"
- Use nomes completos dos times (ex: "Flamengo", "São Paulo", "Botafogo do Rio")

EXEMPLOS:
- "onde vai passar botafogo e bragantino?" → Botafogo do Rio\nBragantino
- "qual canal vai transmitir o palmeiras?" → Palmeiras
- "quando é o jogo do flamengo?" → Flamengo
- "onde assistir santos x corinthians?" → Santos\nCorinthians

TIMES ENCONTRADOS:`;

      try {
        // Tentar usar OpenAI para extração inteligente
        this.logger.debug(`🤖 Chamando OpenAI para extração de times...`);
        
        // Usar o método analyzeMessage do OpenAI com prompt customizado
        const aiResponse = await this.openAIService.analyzeMessage(message);
        
        // Se o OpenAI retornou times, usar eles
        if (aiResponse.team) {
          const teams = [aiResponse.team];
          if (aiResponse.homeTeam) teams.push(aiResponse.homeTeam);
          if (aiResponse.awayTeam) teams.push(aiResponse.awayTeam);
          
          this.logger.debug(`✅ OpenAI extraiu times: ${teams.join(', ')}`);
          return teams;
        }
        
        // Se OpenAI não extraiu times, tentar com prompt específico
        this.logger.debug(`⚠️ OpenAI não extraiu times, tentando prompt específico...`);
        
        // Aqui você faria uma chamada específica para o OpenAI com o prompt customizado
        // Por enquanto, vou usar o fallback inteligente
        const extractedTeams = this.extractTeamsIntelligently(message);
        
        this.logger.debug(`🔄 Fallback: Times extraídos por lógica: ${extractedTeams.join(', ')}`);
        return extractedTeams;

      } catch (openAIError) {
        this.logger.warn(`⚠️ OpenAI falhou, usando fallback: ${openAIError.message}`);
        
        // Fallback para lógica inteligente se OpenAI falhar
        const extractedTeams = this.extractTeamsIntelligently(message);
        this.logger.debug(`🔄 Fallback ativado: Times extraídos: ${extractedTeams.join(', ')}`);
        return extractedTeams;
      }

    } catch (error) {
      this.logger.error(`❌ Erro na extração de times com IA: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Extrai o nome da competição da mensagem
   */
  private extractCompetitionName(message: string, pattern: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Mapeamento de padrões para nomes de competições
    const competitionMappings: { [key: string]: string } = {
      'brasileirao': 'Brasileirão',
      'brasileiro': 'Brasileirão',
      'copa do brasil': 'Copa do Brasil',
      'libertadores': 'Libertadores',
      'sul-americana': 'Sul-Americana',
      'mundial': 'Mundial',
      'serie a': 'Série A',
      'serie b': 'Série B',
      'serie c': 'Série C',
      'serie d': 'Série D'
    };
    
    // Buscar por mapeamentos exatos
    for (const [key, value] of Object.entries(competitionMappings)) {
      if (lowerMessage.includes(key)) {
        return value;
      }
    }
    
    // Se não encontrou mapeamento exato, tentar extrair do contexto
    const words = message.split(/\s+/);
    const competitionKeywords = ['brasileirão', 'copa', 'libertadores', 'sul-americana', 'mundial', 'série'];
    
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[?.,!]/g, '').trim();
      if (competitionKeywords.includes(cleanWord)) {
        // Tentar encontrar o nome completo da competição
        const fullPattern = this.findFullCompetitionPattern(lowerMessage, cleanWord);
        if (fullPattern) {
          return fullPattern;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    }
    
    // Fallback: retornar o padrão encontrado capitalizado
    return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  }
  
  /**
   * Encontra o padrão completo da competição na mensagem
   */
  private findFullCompetitionPattern(message: string, keyword: string): string | null {
    const patterns = [
      'copa do brasil',
      'brasileirão série a',
      'brasileirão série b',
      'conmebol libertadores',
      'conmebol sul-americana'
    ];
    
    for (const pattern of patterns) {
      if (message.includes(pattern)) {
        return pattern.charAt(0).toUpperCase() + pattern.slice(1);
      }
    }
    
    return null;
  }

  /**
   * Extração inteligente de times (fallback quando IA não estiver disponível)
   */
  private extractTeamsIntelligently(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const teams: string[] = [];

    console.log(`🔍 DEBUG: Analisando mensagem: "${lowerMessage}"`);

    // SIMPLIFICANDO: Para "onde vai passar botafogo e bragantino?"
    // Vamos extrair diretamente as palavras que parecem nomes de times
    
    const words = lowerMessage.split(/\s+/);
    console.log(`🔍 DEBUG: Palavras da mensagem: [${words.join(', ')}]`);
    
    // Palavras que NÃO são nomes de times
    const notTeamWords = ['onde', 'vai', 'passar', 'o', 'e', 'qual', 'canal', 'que', 'em', 'hoje', 'amanhã', 'agora', 'assistir', 'ver', 'jogo', 'partida', 'transmissão'];
    
    // Filtrar palavras que podem ser nomes de times
    for (const word of words) {
      const cleanWord = word.replace(/[?.,!]/g, '').trim();
      
      // Verificar se a palavra pode ser um nome de time
      const isTeamName = cleanWord.length >= 3 && 
                        !notTeamWords.includes(cleanWord.toLowerCase()) &&
                        /[a-záàâãéèêíìîóòôõúùûç]/i.test(cleanWord);
      
      console.log(`🔍 DEBUG: Palavra "${word}" (limpa: "${cleanWord}") é nome de time? ${isTeamName}`);
      
      if (isTeamName && !teams.includes(cleanWord)) {
        teams.push(cleanWord);
        console.log(`🏈 DEBUG: Time adicionado: "${cleanWord}"`);
      }
    }

    console.log(`🏈 DEBUG: Times finais extraídos: [${teams.join(', ')}]`);
    return teams;
  }

  // Obtém estatísticas de uso
  getStats() {
    return {
      totalPatterns: Object.keys(this.queryMappings).length,
      patterns: Object.keys(this.queryMappings),
      timestamp: new Date().toISOString()
    };
  }
}
