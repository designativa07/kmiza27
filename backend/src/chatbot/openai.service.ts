import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotConfigService } from '../modules/bot-config/bot-config.service';
import { TeamsService } from '../modules/teams/teams.service';
import OpenAI from 'openai';

export interface MessageAnalysis {
  intent: string;
  team?: string;
  competition?: string;
  player?: string;
  homeTeam?: string;
  awayTeam?: string;
  confidence: number;
  reasoning?: string;
  usedAI?: boolean;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  entities?: {
    team?: string;
    competition?: string;
    player?: string;
    homeTeam?: string;
    awayTeam?: string;
  };
  reasoning: string;
}

export interface Suggestion {
  label: string;
  id?: string;
  intent?: string;
  confidence: number;
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private teamNames: string[] = [];
  private openai: OpenAI | null = null;
  
  // 🎯 Cache para padrões comuns (evita chamadas desnecessárias à API)
  private readonly quickPatternCache = new Map<string, MessageAnalysis>();
  
  // 📊 Métricas de performance
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    aiCalls: 0,
    aiSuccessRate: 0,
    avgLatency: 0
  };

  constructor(
    private botConfigService: BotConfigService,
    private teamsService: TeamsService,
    private configService: ConfigService,
  ) {
    // Inicializar OpenAI se a chave estiver disponível
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ OpenAI inicializado com sucesso para classificação de intenções');
    } else {
      this.logger.warn('⚠️ OPENAI_API_KEY não encontrada - usando apenas pattern matching');
    }
  }

  async onModuleInit() {
    await this.loadTeamNames();
  }

  // Método público para recarregar nomes de times
  async reloadTeamNames(): Promise<void> {
    await this.loadTeamNames();
  }

  private async loadTeamNames() {
    this.teamNames = [];
    const teamsResult = await this.teamsService.findAll(1, 1000); // Buscar até 1000 times
    for (const team of teamsResult.data) {
      this.teamNames.push(this.removeAccents(team.name.toLowerCase()));
      if (team.short_name) {
        this.teamNames.push(this.removeAccents(team.short_name.toLowerCase()));
      }
      if (team.slug) {
        this.teamNames.push(this.removeAccents(team.slug.toLowerCase()));
      }
      // Adicionar aliases dinâmicos
      if (team.aliases && Array.isArray(team.aliases)) {
        for (const alias of team.aliases) {
          this.teamNames.push(this.removeAccents(alias.toLowerCase()));
        }
      }
    }
    this.teamNames = [...new Set(this.teamNames)].sort((a, b) => b.length - a.length);

  }

  private removeAccents(str: string): string {
    const result = str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return result;
  }

  /**
   * 🎯 NOVO MÉTODO: Classificação de intenção usando IA
   * 
   * Fluxo inteligente:
   * 1. Cache de padrões ultra-comuns (instantâneo, gratuito)
   * 2. Classificação com IA (GPT-4o-mini, ~$0.0001/msg)
   * 3. Fallback para pattern matching legado
   */
  async classifyIntentWithAI(message: string): Promise<IntentClassification | null> {
    try {
      if (!this.openai) {
        this.logger.debug('IA não disponível, usando pattern matching legado');
        return null;
      }

      const startTime = Date.now();
      this.metrics.aiCalls++;

      // Definir os intents disponíveis no sistema
      const availableIntents = [
        'next_match',           // Próximo jogo de um time
        'last_match',           // Último jogo realizado
        'current_match',        // Jogo ao vivo/acontecendo agora
        'team_position',        // Posição do time na tabela
        'broadcast_info',       // Onde assistir (canais/transmissão)
        'specific_match_broadcast', // Transmissão de partida específica
        'matches_week',         // Jogos da semana
        'matches_today',        // Jogos de hoje
        'team_statistics',      // Estatísticas de um time
        'competition_stats',    // Estatísticas de uma competição
        'top_scorers',          // Artilheiros
        'team_squad',           // Elenco do time
        'player_info',          // Informações de jogador
        'team_info',            // Informações do time
        'channels_info',        // Lista de canais
        'table',                // Tabela/classificação
        'competition_info',     // Info sobre competição
        'favorite_team_summary',// Resumo do time favorito
        'greeting',             // Saudação
        'general_question',     // Pergunta geral sobre futebol
        'unknown'               // Não reconhecido
      ];

      const systemPrompt = `Você é um classificador de intenções especializado em futebol brasileiro.

**SUA TAREFA:** Analisar a mensagem do usuário e classificar em um dos intents disponíveis.

**INTENTS DISPONÍVEIS:**
${availableIntents.map((intent, i) => `${i + 1}. ${intent}`).join('\n')}

**REGRAS IMPORTANTES:**
1. Retorne APENAS um JSON válido, sem texto adicional
2. Seja flexível com gírias e apelidos de times (Mengão = Flamengo, Tricolor = vários times, etc)
3. Entenda variações de linguagem informal ("qnd" = quando, "joga hj" = joga hoje)
4. Se detectar nome de time, jogador ou competição, extraia-os
5. Para partidas específicas (Time A x Time B), use 'specific_match_broadcast' se envolver transmissão
6. Confiança alta (>0.8) para perguntas claras, baixa (<0.6) para ambíguas

**EXEMPLOS:**
Usuário: "o mengão joga quando?"
Resposta: {"intent": "next_match", "confidence": 0.92, "entities": {"team": "Flamengo"}, "reasoning": "Pergunta sobre próximo jogo do Flamengo (mengão = apelido)"}

Usuário: "onde passa bahia x fluminense"
Resposta: {"intent": "specific_match_broadcast", "confidence": 0.95, "entities": {"homeTeam": "Bahia", "awayTeam": "Fluminense"}, "reasoning": "Pergunta sobre transmissão de partida específica"}

Usuário: "artilheiros do brasileirão"
Resposta: {"intent": "top_scorers", "confidence": 0.90, "entities": {"competition": "brasileirão"}, "reasoning": "Solicitação de artilheiros da competição"}

**FORMATO DE RESPOSTA:**
{
  "intent": "nome_do_intent",
  "confidence": 0.85,
  "entities": {
    "team": "Nome do Time",
    "competition": "nome da competição",
    "player": "nome do jogador",
    "homeTeam": "Time A",
    "awayTeam": "Time B"
  },
  "reasoning": "Breve explicação da classificação"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Baixa temperatura para respostas mais consistentes
        max_tokens: 300
      });

      const latency = Date.now() - startTime;
      this.updateMetrics(latency);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn('IA retornou resposta vazia');
        return null;
      }

      // Parse e validação
      const classification = JSON.parse(content) as IntentClassification;
      
      // Validar se o intent retornado é válido
      if (!availableIntents.includes(classification.intent)) {
        this.logger.warn(`IA retornou intent inválido: ${classification.intent}`);
        classification.intent = 'unknown';
        classification.confidence = 0.3;
      }

      this.logger.log(`🧠 IA Classificou: "${message}" → ${classification.intent} (${(classification.confidence * 100).toFixed(0)}%) [${latency}ms]`);
      
      return classification;

    } catch (error) {
      this.logger.error(`❌ Erro na classificação IA: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 📊 Atualizar métricas de performance
   */
  private updateMetrics(latency: number): void {
    this.metrics.totalRequests++;
    
    // Calcular média móvel de latência
    const alpha = 0.2; // Fator de suavização
    this.metrics.avgLatency = this.metrics.avgLatency === 0 
      ? latency 
      : (alpha * latency) + ((1 - alpha) * this.metrics.avgLatency);
  }

  /**
   * 📈 Obter métricas de performance
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      avgLatencyMs: Math.round(this.metrics.avgLatency)
    };
  }

  /**
   * ⚡ Padrões ultra-rápidos para mensagens 100% previsíveis
   * (evita chamada à IA para casos triviais)
   */
  private checkQuickPatterns(lowerMessage: string): MessageAnalysis | null {
    // Saudações exatas
    const greetings = ['oi', 'ola', 'olá', 'oie', 'hey', 'opa', 'menu', 'inicio'];
    if (greetings.includes(lowerMessage.trim())) {
      return { intent: 'greeting', confidence: 0.95, usedAI: false };
    }

    // Comandos diretos
    if (lowerMessage === 'meu time' || lowerMessage === 'time favorito' || lowerMessage === 'favorito') {
      return { intent: 'favorite_team_summary', confidence: 0.95, usedAI: false };
    }

    if (lowerMessage === 'tabela' || lowerMessage === 'classificacao' || lowerMessage === 'classificação') {
      return { intent: 'table', confidence: 0.90, competition: 'brasileirao', usedAI: false };
    }

    if (lowerMessage === 'artilheiros') {
      return { intent: 'top_scorers', confidence: 0.90, usedAI: false };
    }

    if (lowerMessage === 'jogos de hoje' || lowerMessage === 'jogos hoje') {
      return { intent: 'matches_today', confidence: 0.90, usedAI: false };
    }

    return null;
  }

  /**
   * 🔄 MÉTODO PRINCIPAL REFORMULADO: Usa IA quando necessário
   */
  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
      this.metrics.totalRequests++;
      this.logger.log(`🔍 analyzeMessage: "${message}"`);
      
      const lowerMessage = this.removeAccents(message.toLowerCase());
      
      // ⚡ FASE 1: Cache de padrões ultra-comuns (instantâneo, gratuito)
      const cacheKey = lowerMessage.trim();
      if (this.quickPatternCache.has(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.quickPatternCache.get(cacheKey)!;
        this.logger.log(`⚡ Cache hit: "${message}" → ${cached.intent}`);
        return cached;
      }

      // 🎯 FASE 2: Padrões ultra-simples (100% previsíveis)
      const quickPattern = this.checkQuickPatterns(lowerMessage);
      if (quickPattern) {
        this.quickPatternCache.set(cacheKey, quickPattern);
        this.logger.log(`✅ Pattern match: "${message}" → ${quickPattern.intent}`);
        return quickPattern;
      }

      // 🧠 FASE 3: Classificação com IA (quando OpenAI está disponível)
      if (this.openai) {
        const aiClassification = await this.classifyIntentWithAI(message);
        
        if (aiClassification && aiClassification.confidence >= 0.6) {
          // Extrair entidades adicionais usando os métodos legados (mais precisos para times brasileiros)
          const entities = aiClassification.entities || {};
          
          // Tentar extrair time da mensagem (nosso extrator é melhor que a IA para apelidos locais)
          if (!entities.team && (
            aiClassification.intent === 'next_match' ||
            aiClassification.intent === 'last_match' ||
            aiClassification.intent === 'current_match' ||
            aiClassification.intent === 'team_position' ||
            aiClassification.intent === 'broadcast_info' ||
            aiClassification.intent === 'team_statistics' ||
            aiClassification.intent === 'team_squad' ||
            aiClassification.intent === 'team_info'
          )) {
            entities.team = this.extractTeamName(lowerMessage);
          }

          // Extrair partida específica se for sobre transmissão
          if (aiClassification.intent === 'specific_match_broadcast' || aiClassification.intent === 'broadcast_info') {
            const specificMatch = this.extractSpecificMatch(lowerMessage);
            if (specificMatch) {
              entities.homeTeam = specificMatch.homeTeam;
              entities.awayTeam = specificMatch.awayTeam;
            }
          }

          // Extrair competição
          if (!entities.competition && (
            aiClassification.intent === 'top_scorers' ||
            aiClassification.intent === 'table' ||
            aiClassification.intent === 'competition_stats' ||
            aiClassification.intent === 'competition_info'
          )) {
            entities.competition = this.extractCompetitionName(lowerMessage);
          }

          const result: MessageAnalysis = {
            intent: aiClassification.intent,
            confidence: aiClassification.confidence,
            reasoning: aiClassification.reasoning,
            usedAI: true,
            ...entities
          };

          this.logger.log(`✅ IA result: ${aiClassification.intent} (conf: ${(aiClassification.confidence * 100).toFixed(0)}%)`);
          return result;
        } else if (aiClassification) {
          this.logger.warn(`⚠️ IA com baixa confiança (${(aiClassification.confidence * 100).toFixed(0)}%) - usando fallback`);
        }
      }

      // 🔄 FASE 4: Fallback legado (se IA não disponível ou baixa confiança)
      this.logger.log(`🔄 Usando pattern matching legado como fallback`);
      const fallbackResult = this.legacyPatternMatching(lowerMessage, message);
      return fallbackResult;
      
    } catch (error) {
      this.logger.error(`❌ Erro no analyzeMessage: ${error.message}`, error.stack);
      return {
        intent: 'unknown',
        confidence: 0.30,
        usedAI: false
      };
    }
  }

  /**
   * 🔄 FALLBACK: Pattern matching legado (mantido para compatibilidade)
   */
  private legacyPatternMatching(lowerMessage: string, originalMessage: string): MessageAnalysis {
    // Saudações
    if (this.isGreeting(lowerMessage)) {
      return { intent: 'greeting', confidence: 0.90, usedAI: false };
    }

    // Próximo jogo
    if (lowerMessage.includes('proximo') || lowerMessage.includes('próximo')) {
      if (lowerMessage.includes('jogo') || lowerMessage.includes('partida')) {
        return {
          intent: 'next_match',
          team: this.extractTeamName(lowerMessage),
          confidence: 0.85,
          usedAI: false
        };
      }
    }

    // Último jogo
    if (lowerMessage.includes('ultimo') || lowerMessage.includes('última')) {
      if (lowerMessage.includes('jogo') || lowerMessage.includes('partida')) {
        return {
          intent: 'last_match',
          team: this.extractTeamName(lowerMessage),
          confidence: 0.85,
          usedAI: false
        };
      }
    }

    // Transmissão
    if (lowerMessage.includes('onde') || lowerMessage.includes('transmissao') || 
        lowerMessage.includes('canal') || lowerMessage.includes('assistir')) {
      const specificMatch = this.extractSpecificMatch(lowerMessage);
      if (specificMatch) {
        return {
          intent: 'specific_match_broadcast',
          homeTeam: specificMatch.homeTeam,
          awayTeam: specificMatch.awayTeam,
          confidence: 0.85,
          usedAI: false
        };
      }
      return {
        intent: 'broadcast_info',
        team: this.extractTeamName(lowerMessage),
        confidence: 0.80,
        usedAI: false
      };
    }

    // Posição/Classificação
    if (lowerMessage.includes('posicao') || lowerMessage.includes('classificacao') ||
        lowerMessage.includes('colocacao')) {
      const team = this.extractTeamName(lowerMessage);
      if (team) {
        return { intent: 'team_position', team, confidence: 0.80, usedAI: false };
      }
      return { 
        intent: 'table', 
        competition: this.extractCompetitionName(lowerMessage) || 'brasileirao',
        confidence: 0.75,
        usedAI: false
      };
    }

    // Tabela
    if (lowerMessage.includes('tabela')) {
      return {
        intent: 'table',
        competition: this.extractCompetitionName(lowerMessage) || 'brasileirao',
        confidence: 0.80,
        usedAI: false
      };
    }

    // Artilheiros
    if (lowerMessage.includes('artilheiro') || lowerMessage.includes('goleador')) {
      return {
        intent: 'top_scorers',
        competition: this.extractCompetitionName(lowerMessage),
        confidence: 0.80,
        usedAI: false
      };
    }

    // Jogos de hoje
    if (lowerMessage.includes('hoje') && lowerMessage.includes('jogo')) {
      return { intent: 'matches_today', confidence: 0.80, usedAI: false };
    }

    // Jogos da semana
    if (lowerMessage.includes('semana') && lowerMessage.includes('jogo')) {
      return { intent: 'matches_week', confidence: 0.75, usedAI: false };
    }

    // Quando joga
    if (lowerMessage.includes('quando') && lowerMessage.includes('joga')) {
      return {
        intent: 'next_match',
        team: this.extractTeamName(lowerMessage),
        confidence: 0.75,
        usedAI: false
      };
    }

    // Apenas nome do time (mensagem curta)
    const teamName = this.extractTeamName(lowerMessage);
    if (teamName && lowerMessage.trim().length <= 15) {
      return {
        intent: 'next_match',
        team: teamName,
        confidence: 0.70,
        usedAI: false
      };
    }

    // Não reconhecido
    this.logger.warn(`❓ Nenhum pattern reconhecido: "${originalMessage}"`);
    return {
      intent: 'unknown',
      confidence: 0.30,
      usedAI: false
    };
  }

  // Calcula similaridade simples baseada em interseção/união de tokens
  private similarity(a: string, b: string): number {
    const sa = new Set(a.split(/\s+/).filter(Boolean));
    const sb = new Set(b.split(/\s+/).filter(Boolean));
    const intersection = [...sa].filter(x => sb.has(x)).length;
    const union = new Set([...sa, ...sb]).size;
    return union ? intersection / union : 0;
  }

  // Gera até 5 sugestões combinando sinônimos de intenções com itens do menu atual
  async suggestAlternatives(
    message: string,
    menuItems: Array<{ id: string; title: string; description?: string }>
  ): Promise<Suggestion[]> {
    const normalized = this.removeAccents(message.toLowerCase());

    const intentSynonyms: Record<string, string[]> = {
      next_match: ['próximo jogo', 'quando joga', 'agenda', 'calendário', 'horário do jogo'],
      matches_today: ['jogos de hoje', 'hoje joga', 'partidas hoje'],
      matches_week: ['jogos da semana', 'esta semana', 'rodada da semana'],
      last_match: ['último jogo', 'como foi o jogo', 'placar passado', 'resultado recente'],
      team_info: ['informações do time', 'info do time', 'dados do time'],
      team_position: ['posição', 'classificação', 'tabela do time'],
      broadcast_info: ['onde passa', 'transmissão', 'canal', 'tv', 'streaming'],
      top_scorers: ['artilheiros', 'gols', 'goleadores'],
      team_squad: ['elenco', 'jogadores do time'],
      table: ['tabela', 'classificação da competição'],
      channels_info: ['canais disponíveis', 'onde assistir', 'como assistir']
    };

    const intentSuggestions: Suggestion[] = Object.entries(intentSynonyms)
      .map(([intent, keys]) => {
        const best = Math.max(
          ...keys.map(k => this.similarity(normalized, this.removeAccents(k)))
        );
        return { label: keys[0], intent, confidence: best } as Suggestion;
      })
      .filter(s => s.confidence >= 0.35);

    const menuSuggestions: Suggestion[] = (menuItems || [])
      .map(mi => {
        const basis = `${mi.title} ${mi.description || ''}`.toLowerCase();
        const score = this.similarity(normalized, this.removeAccents(basis));
        return { label: mi.title, id: mi.id, confidence: score } as Suggestion;
      })
      .filter(s => s.confidence >= 0.35);

    return [...intentSuggestions, ...menuSuggestions]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }
  
  private extractTeamName(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    // Buscar diretamente nos nomes de times carregados do banco (incluindo aliases)
    // Ordenar por comprimento (maiores primeiro) para evitar conflitos
    const sortedTeamNames = this.teamNames.sort((a, b) => b.length - a.length);
    
    // Primeiro, tentar encontrar matches exatos ou muito específicos
    for (const teamName of sortedTeamNames) {
      if (teamName.length > 3) { // Ignorar aliases muito curtos inicialmente
        let matched = false;
        
        // Para nomes longos, usar busca normal
        if (lowerMessage.includes(teamName.toLowerCase())) {
          matched = true;
        }
        
        if (matched) {
          return teamName;
        }
      }
    }
    
    // Se não encontrou matches específicos, tentar com aliases curtos
    // mas sendo mais restritivo para evitar conflitos
    for (const teamName of sortedTeamNames) {
      if (teamName.length <= 3) {
        // Para aliases curtos, usar word boundaries e verificar se não há conflitos
        const regex = new RegExp(`\\b${teamName}\\b`, 'i');
        if (regex.test(message)) {
          // Verificar se este alias curto não causa conflitos
          const conflictingTeams = this.teamNames.filter(otherTeam => 
            otherTeam !== teamName && 
            (otherTeam.toLowerCase().includes(teamName.toLowerCase()) || 
             teamName.toLowerCase().includes(otherTeam.toLowerCase()))
          );
          
          // Se não há conflitos ou se este é o único match, usar
          if (conflictingTeams.length === 0) {
            return teamName;
          }
          
          // Se há conflitos, verificar se a mensagem contém mais contexto
          // para resolver o conflito
          const hasMoreContext = conflictingTeams.some(conflict => 
            lowerMessage.includes(conflict.toLowerCase())
          );
          
          if (hasMoreContext) {
            // Se há mais contexto, continuar procurando por matches mais específicos
            continue;
          }
        }
      }
    }
    
    return undefined;
  }

  private extractSpecificMatch(message: string): { homeTeam: string; awayTeam: string } | undefined {
    const lowerMessage = this.removeAccents(message.toLowerCase());
    
    // Padrões para detectar partidas específicas - mais precisos
    const patterns = [
      // Padrão: "Time1 x Time2" ou "Time1 vs Time2" ou "Time1 versus Time2"
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s*(?:x|vs|versus)\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i,
      // Padrão: "Time1 contra Time2"
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s+contra\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i,
      // Padrão: "Time1 e Time2" (mais restritivo)
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s+e\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        let homeTeam = match[1].trim();
        let awayTeam = match[2].trim();
        
        // Limpar palavras de contexto comuns
        const contextWords = ['onde', 'assistir', 'transmissao', 'transmissão', 'canais', 'passa', 'como', 'ver', 'ver', 'o', 'a', 'de', 'da', 'do', 'em', 'para'];
        
        // Remover palavras de contexto do início e fim
        homeTeam = homeTeam.replace(new RegExp(`^(${contextWords.join('|')})\\s+`, 'i'), '').trim();
        awayTeam = awayTeam.replace(new RegExp(`\\s+(${contextWords.join('|')})$`, 'i'), '').trim();
        
        // Se ainda há palavras de contexto, tentar extrair apenas o nome do time
        if (homeTeam.split(' ').length > 3) {
          // Tentar encontrar o nome do time no final da string
          const words = homeTeam.split(' ');
          for (let i = words.length - 1; i >= 0; i--) {
            const candidate = words.slice(i).join(' ');
            if (this.isValidTeamName(candidate)) {
              homeTeam = candidate;
              break;
            }
          }
        }
        
        if (awayTeam.split(' ').length > 3) {
          // Tentar encontrar o nome do time no início da string
          const words = awayTeam.split(' ');
          for (let i = 0; i < words.length; i++) {
            const candidate = words.slice(0, i + 1).join(' ');
            if (this.isValidTeamName(candidate)) {
              awayTeam = candidate;
              break;
            }
          }
        }
        
        console.log(`🔍 DEBUG extractSpecificMatch: "${homeTeam}" vs "${awayTeam}"`);
        
        // Verificar se ambos os times existem na lista de times conhecidos
        const homeTeamExists = this.isValidTeamName(homeTeam);
        const awayTeamExists = this.isValidTeamName(awayTeam);
        
        if (homeTeamExists && awayTeamExists) {
          // Retornar os nomes exatos dos times encontrados
          const foundHomeTeam = this.findTeamByName(homeTeam);
          const foundAwayTeam = this.findTeamByName(awayTeam);
          
          return {
            homeTeam: foundHomeTeam!,
            awayTeam: foundAwayTeam!
          };
        }
      }
    }
    
    return undefined;
  }
  
  // Método auxiliar para verificar se um nome é válido
  private isValidTeamName(teamName: string): boolean {
    if (!teamName || teamName.trim().length < 2) return false;
    
    const normalizedTeamName = this.removeAccents(teamName.toLowerCase());
    
    return this.teamNames.some(team => {
      const normalizedTeam = this.removeAccents(team.toLowerCase());
      return normalizedTeam.includes(normalizedTeamName) || 
             normalizedTeamName.includes(normalizedTeam);
    });
  }
  
  // Método auxiliar para encontrar o nome exato do time
  private findTeamByName(teamName: string): string | undefined {
    if (!teamName || teamName.trim().length < 2) return undefined;
    
    const normalizedTeamName = this.removeAccents(teamName.toLowerCase());
    
    return this.teamNames.find(team => {
      const normalizedTeam = this.removeAccents(team.toLowerCase());
      return normalizedTeam.includes(normalizedTeamName) || 
             normalizedTeamName.includes(normalizedTeam);
    });
  }
  
  private extractCompetitionName(message: string): string | undefined {
    console.log(`🔍 extractCompetitionName: "${message}"`);
    
    if (message.includes('libertadores')) return 'libertadores';
    if (message.includes('copa do brasil')) return 'copa do brasil';
    if (message.includes('brasileirão') || message.includes('brasileirao')) return 'brasileirão';
    if (message.includes('série a') || message.includes('serie a')) return 'brasileirão';
    if (message.includes('série b') || message.includes('serie b')) return 'brasileiro série b';
    if (message.includes('série c') || message.includes('serie c')) return 'brasileiro série c';
    if (message.includes('série d') || message.includes('serie d')) return 'brasileiro série d';
    if (message.includes('sul-americana')) return 'sul-americana';
    if (message.includes('champions')) return 'champions-league';
    
    return undefined;
  }

  private extractPlayerName(message: string): string | undefined {
    // Remover termos comuns que indicam intenção de jogador, mas não fazem parte do nome
    const cleanedMessage = message.replace(/(informações do|info do|dados do|qual o jogador|quem é o jogador|elenco do|jogador )/g, '').trim();
    
    // Tentar extrair o nome do jogador com base em palavras capitalizadas ou nomes compostos
    const playerKeywords = [
      // Exemplo de nomes que podem ser comuns em um contexto de futebol
      'messi', 'cristiano ronaldo', 'neymar', 'haaland', 'mbappé', 'vinicius junior', 'rodrygo', 'casemiro',
      'paquetá', 'richarlison', 'firmino', 'gabriel jesus', 'alisson', 'ederson', 'thiago silva',
      'marquinhos', 'militao', 'daniel alves', 'fagner', 'lucas moura', 'philippe coutinho',
      'kroos', 'modric', 'de bruyne', 'salah', 'mané', 'lewandowski', 'benzema', 'suárez', 'cavani',
      'ramos', 'van dijk', 'ruben dias', 'kimmich', 'goretzka', 'foden', 'mount', 'kane', 'sterling',
      'grealish', 'sancho', 'upamecano', 'hernandez', 'koulibaly', 'brozovic', 'jorginho', 'verratti',
      'pedri', 'gavi', 'araújo', 'valverde', 'vlahovic', 'osimhen', 'rafael leao', 'di maria',
      'dybala', 'lautaro martinez', 'alvarez', 'enzo fernandez', 'mac allister', 'griezmann',
      'felix', 'joao felix', 'ancelotti', 'guardiola', 'klopp', 'mourinho', 'tite', 'dorival',
      'abel ferreira', 'fernando diniz', 'renato gaúcho', 'coudet', 'sampaoli', 'odair hellmann',
      'bruno lage', 'roger machado', 'mano menezes', 'luxemburgo', 'felipão', 'carille', 'jair ventura',
      'lisca', 'enderson moreira', 'cuca', 'marcelo fernandes', 'paulo sousa', 'jorge jesus',
      'gabigol', 'pedro', 'arrascaeta', 'everton ribeiro', 'bruno henrique', 'filipe luis',
      'david luiz', 'santos', 'rodinei', 'leo pereira', 'fabricio bruno', 'joao gomes',
      'gerson', 'pulgar', 'thiago maia', 'vidal', 'cebolinha', 'marinho', 'kiffer',
      'weverton', 'gustavo gomez', 'murilo', 'piquerez', 'zé rafael', 'raphael veiga',
      'dudu', 'ron', 'artur', 'endo', 'deyverson', 'borja', 'luiz adriano',
      'cassio', 'fagner', 'gil', 'balbuena', 'fábio santos', 'renato augusto',
      'roger guedes', 'yuri alberto', 'willian', 'giuliano', 'maycon', 'du queiroz',
      'fausto vera', 'mosquito', 'romero', 'paulistinha', 'sócrates', 'rivellino',
      'carlos tevez', 'jô', 'liédson', 'ricardinho', 'marcelinho carioca',
      'rafael', 'arboleda', 'bobs', 'diego costa', 'calleri', 'luciano',
      'ganso', 'fernando', 'alexandre pato', 'rodrigo nestor', 'luan', 'galoppo',
      'wellington rato', 'pablo maia', 'caio paulista', 'rafinha', 'alanderson',
      // Adicione mais nomes ou padrões conforme necessário
    ];

    // Tentativa de encontrar um nome de jogador exato ou composto
    for (const keyword of playerKeywords) {
      if (cleanedMessage.includes(this.removeAccents(keyword.toLowerCase()))) {
        return keyword; // Retorna o nome original com capitalização
      }
    }

    // Fallback: se nenhuma palavra-chave for encontrada, tente extrair a última sequência de palavras
    // Isso pode ser útil para nomes não listados explicitamente
    const words = cleanedMessage.split(' ').filter(Boolean);
    if (words.length > 0) {
      // Retorna a última palavra como um palpite de nome de jogador
      // Ou uma combinação das duas últimas palavras se a última for curta
      if (words.length >= 2 && words[words.length - 1].length <= 3) {
        return words.slice(-2).join(' ');
      }
      return words[words.length - 1];
    }
    
    return undefined;
  }

  /**
   * Verificar se a mensagem é uma saudação
   */
  private isGreeting(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    const greetings = [
      'oi', 'olá', 'ola', 'oie', 'opa',
      'bom dia', 'boa tarde', 'boa noite',
      'e aí', 'e ai', 'eai', 'salve',
      'hello', 'hi', 'hey', 'hola',
      'menu', 'inicio', 'começar', 'comecar', 'start',
      'oi bot', 'ola bot', 'oi kmiza', 'ola kmiza',
      'tchau', 'valeu', 'obrigado', 'obrigada', 'brigado'
    ];
    
    // Verificar se é uma pergunta (contém palavras interrogativas)
    const questionWords = ['quem', 'qual', 'quando', 'onde', 'como', 'por que', 'porque', 'o que', 'quantos', 'quantas'];
    if (questionWords.some(word => lowerMessage.includes(word))) {
      return false; // Não é saudação, é uma pergunta
    }
    
    // Verificar correspondência exata de saudações (palavras completas)
    return greetings.some(greeting => {
      // Correspondência exata
      if (lowerMessage === greeting || lowerMessage === greeting + '!' || lowerMessage === greeting + '?') {
        return true;
      }
      
      // Saudação no início da frase seguida de espaço ou pontuação
      if (lowerMessage.startsWith(greeting + ' ') || lowerMessage.startsWith(greeting + ',')) {
        return true;
      }
      
      // Mensagens muito curtas (até 10 caracteres) e que são EXATAMENTE uma saudação
      if (lowerMessage.length <= 10 && lowerMessage === greeting) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Gera uma resposta inteligente para perguntas não reconhecidas
   * Usa análise de contexto e conhecimento de futebol para fornecer respostas úteis
   */
  async generateResponse(
    question: string,
    context?: {
      competitionId?: number;
      userId?: string;
      conversationHistory?: string[];
    }
  ): Promise<{
    success: boolean;
    answer?: string;
    confidence: number;
    source: string;
    reasoning?: string;
  }> {
    try {
      console.log(`🤖 OpenAI generateResponse chamado para: "${question}"`);
      
      // Análise básica da pergunta
      const lowerQuestion = this.removeAccents(question.toLowerCase());
      
      // Verificar se é uma pergunta sobre futebol
      const footballKeywords = [
        'futebol', 'futebol', 'bola', 'gol', 'time', 'jogador', 'treinador',
        'campeonato', 'liga', 'copa', 'estadio', 'arbitro', 'cartao',
        'escanteio', 'falta', 'penalti', 'penalty', 'corner', 'escanteio',
        'libertadores', 'brasileirao', 'champions', 'mundial', 'copa america'
      ];
      
      const isFootballQuestion = footballKeywords.some(keyword => 
        lowerQuestion.includes(keyword)
      );
      
      if (!isFootballQuestion) {
        console.log(`❌ Pergunta não relacionada ao futebol: ${question}`);
        return {
          success: false,
          confidence: 0.1,
          source: 'análise_local',
          reasoning: 'Pergunta não relacionada ao futebol'
        };
      }
      
      // Tentar responder com base no conhecimento local
      const localAnswer = this.generateLocalAnswer(lowerQuestion, context);
      if (localAnswer.success) {
        console.log(`✅ Resposta local encontrada: ${localAnswer.answer}`);
        return localAnswer;
      }
      
      // Se não conseguir responder localmente, retornar que precisa de pesquisa externa
      console.log(`🔍 Pergunta precisa de pesquisa externa: ${question}`);
      return {
        success: false,
        confidence: 0.3,
        source: 'análise_local',
        reasoning: 'Pergunta complexa que requer pesquisa externa'
      };
      
    } catch (error) {
      console.error(`❌ Erro no generateResponse: ${error.message}`, error.stack);
      return {
        success: false,
        confidence: 0.0,
        source: 'erro',
        reasoning: `Erro interno: ${error.message}`
      };
    }
  }

  /**
   * Gera resposta baseada no conhecimento local do sistema
   */
  private generateLocalAnswer(
    question: string,
    context?: any
  ): {
    success: boolean;
    answer?: string;
    confidence: number;
    source: string;
    reasoning?: string;
  } {
    // Respostas para perguntas comuns sobre futebol
    const commonAnswers = {
      'regras do futebol': {
        answer: 'O futebol é jogado com 11 jogadores por time, o objetivo é marcar gols. Jogos têm 90 minutos divididos em dois tempos de 45 minutos. Faltas podem resultar em cartões amarelos ou vermelhos.',
        confidence: 0.9
      },
      'como funciona o campeonato brasileiro': {
        answer: 'O Campeonato Brasileiro é disputado por 20 times em formato de pontos corridos. Cada time joga contra todos os outros em jogos de ida e volta. Os 4 primeiros se classificam para a Libertadores, os 4 últimos são rebaixados.',
        confidence: 0.85
      },
      'o que é a libertadores': {
        answer: 'A Copa Libertadores da América é o principal torneio de clubes da América do Sul. É equivalente à Champions League europeia. Times brasileiros, argentinos, uruguaios e de outros países sul-americanos participam.',
        confidence: 0.9
      },
      'como funciona o sistema de rebaixamento': {
        answer: 'No sistema brasileiro, os 4 últimos colocados do campeonato são rebaixados para a série B. Isso garante que apenas os melhores times permaneçam na elite do futebol nacional.',
        confidence: 0.8
      }
    };
    
    // Procurar por respostas que correspondam à pergunta
    for (const [key, response] of Object.entries(commonAnswers)) {
      if (question.includes(key) || this.calculateSimilarity(question, key) > 0.6) {
        return {
          success: true,
          answer: response.answer,
          confidence: response.confidence,
          source: 'conhecimento_local',
          reasoning: `Resposta encontrada para: ${key}`
        };
      }
    }
    
    return {
      success: false,
      confidence: 0.2,
      source: 'conhecimento_local',
      reasoning: 'Nenhuma resposta local encontrada'
    };
  }

  /**
   * Calcula similaridade entre duas strings usando algoritmo simples
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ').filter(word => word.length > 2);
    const words2 = str2.split(' ').filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }
} 