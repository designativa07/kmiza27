import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotConfigService } from '../modules/bot-config/bot-config.service';
import { TeamsService } from '../modules/teams/teams.service';

export interface MessageAnalysis {
  intent: string;
  team?: string;
  competition?: string;
  player?: string;
  homeTeam?: string;
  awayTeam?: string;
  confidence: number;
}

export interface Suggestion {
  label: string;
  id?: string;
  intent?: string;
  confidence: number;
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private teamNames: string[] = [];

  constructor(
    private botConfigService: BotConfigService,
    private teamsService: TeamsService,
  ) {}

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

  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
      console.log(`🔍 analyzeMessage chamada com: "${message}"`);
      
      // Análise simples por enquanto (pode ser expandida com OpenAI real)
      const lowerMessage = this.removeAccents(message.toLowerCase());
      console.log(`🔍 Analisando mensagem: "${message}" -> "${lowerMessage}"`);
      
      // Detectar intenção de próximo jogo
      if ((lowerMessage.includes('próximo') && lowerMessage.includes('jogo')) || 
          (lowerMessage.includes('proximo') && lowerMessage.includes('jogo'))) {
        const team = this.extractTeamName(lowerMessage);
        console.log(`✅ Detectado próximo jogo para time: ${team}`);
        return {
          intent: 'next_match',
          team,
          confidence: 0.95
        };
      }

      // Detectar último jogo
      if ((lowerMessage.includes('último') && lowerMessage.includes('jogo')) || 
          (lowerMessage.includes('ultimo') && lowerMessage.includes('jogo')) ||
          (lowerMessage.includes('última') && lowerMessage.includes('partida')) ||
          (lowerMessage.includes('ultima') && lowerMessage.includes('partida'))) {
        const team = this.extractTeamName(lowerMessage);
        console.log(`✅ Detectado último jogo para time: ${team}`);
        return {
          intent: 'last_match',
          team,
          confidence: 0.95
        };
      }

      // Detectar jogo atual/em andamento/ao vivo
      if ((lowerMessage.includes('jogo') && (lowerMessage.includes('atual') || lowerMessage.includes('agora') || lowerMessage.includes('andamento'))) ||
          (lowerMessage.includes('ao vivo') || lowerMessage.includes('live')) ||
          (lowerMessage.includes('está jogando') || lowerMessage.includes('esta jogando')) ||
          (lowerMessage.includes('jogando agora') || lowerMessage.includes('jogo de agora'))) {
        const team = this.extractTeamName(lowerMessage);
        console.log(`✅ Detectado jogo atual/ao vivo para time: ${team}`);
        return {
          intent: 'current_match',
          team,
          confidence: 0.95
        };
      }

      // Detectar posição do time
      if (lowerMessage.includes('posição') || lowerMessage.includes('posicao') ||
          lowerMessage.includes('classificação') || lowerMessage.includes('classificacao') ||
          lowerMessage.includes('colocação') || lowerMessage.includes('colocacao')) {
        const team = this.extractTeamName(lowerMessage);
        console.log(`✅ Detectado posição para time: ${team}`);
        return {
          intent: 'team_position',
          team,
          confidence: 0.90
        };
      }

      // Detectar informações de transmissão
      if (lowerMessage.includes('onde passa') || lowerMessage.includes('transmissão') ||
          lowerMessage.includes('transmissao') || lowerMessage.includes('canal') ||
          lowerMessage.includes('canais') || lowerMessage.includes('tv') || 
          lowerMessage.includes('streaming') || lowerMessage.includes('assistir') || 
          lowerMessage.includes('onde assistir')) {
        
        console.log(`🔍 DEBUG: Detectada intenção de transmissão para mensagem: "${lowerMessage}"`);
        
        // Verificar se é uma pergunta sobre partida específica (ex: "Bahia x Fluminense")
        const specificMatch = this.extractSpecificMatch(lowerMessage);
        console.log(`🔍 DEBUG: Resultado extractSpecificMatch:`, specificMatch);
        
        if (specificMatch) {
          console.log(`✅ Detectado transmissão para partida específica: ${specificMatch.homeTeam} x ${specificMatch.awayTeam}`);
          return {
            intent: 'specific_match_broadcast',
            homeTeam: specificMatch.homeTeam,
            awayTeam: specificMatch.awayTeam,
            confidence: 0.95
          };
        }
        
        console.log(`🔍 DEBUG: Nenhuma partida específica detectada, buscando time individual`);
        const team = this.extractTeamName(lowerMessage);
        console.log(`✅ Detectado transmissão para time: ${team}`);
        return {
          intent: 'broadcast_info',
          team,
          confidence: 0.90
        };
      }

      // Detectar jogos da semana
      if ((lowerMessage.includes('jogos') && lowerMessage.includes('semana')) ||
          (lowerMessage.includes('partidas') && lowerMessage.includes('semana'))) {
        console.log(`✅ Detectado jogos da semana`);
        return {
          intent: 'matches_week',
          confidence: 0.85
        };
      }

      // Detectar estatísticas do time
      if (lowerMessage.includes('estatísticas') || lowerMessage.includes('estatisticas') ||
          lowerMessage.includes('stats') || lowerMessage.includes('números') ||
          lowerMessage.includes('numeros') || lowerMessage.includes('desempenho')) {
        console.log(`🔍 Detecção de estatísticas ativada para: "${lowerMessage}"`);
        
        const team = this.extractTeamName(lowerMessage);
        const competition = this.extractCompetitionName(lowerMessage);
        
        console.log(`🔍 Debug estatísticas - team: ${team}, competition: ${competition}`);
        
        if (team) {
          console.log(`✅ Detectado estatísticas para time: ${team}`);
          return {
            intent: 'team_statistics',
            team,
            confidence: 0.90
          };
        } else if (competition) {
          console.log(`✅ Detectado estatísticas para competição: ${competition}`);
          return {
            intent: 'competition_stats',
            competition,
            confidence: 0.90
          };
        }
        
        console.log(`❌ Nenhum time ou competição detectado para estatísticas`);
      }

      // Detectar artilheiros
      if (lowerMessage.includes('artilheiro') || lowerMessage.includes('goleador') ||
          lowerMessage.includes('artilharia') || lowerMessage.includes('gols') ||
          (lowerMessage.includes('quem') && lowerMessage.includes('mais') && lowerMessage.includes('gol'))) {
        const competition = this.extractCompetitionName(lowerMessage);
        console.log(`✅ Detectado artilheiros para competição: ${competition}`);
        return {
          intent: 'top_scorers',
          competition,
          confidence: 0.85
        };
      }

      // Detectar elenco do time
      if ((lowerMessage.includes('elenco') || lowerMessage.includes('jogadores')) && lowerMessage.includes('do')) {
        const team = this.extractTeamName(lowerMessage);
        if (team) {
          console.log(`✅ Detectado solicitação de elenco para o time: ${team}`);
          return {
            intent: 'team_squad',
            team,
            confidence: 0.90
          };
        }
      }

      // Detectar informações de jogador - PRIORIDADE ALTA quando contém "jogador"
      if (lowerMessage.includes('jogador')) {
        // Extrair nome do jogador removendo palavras de contexto
        const playerName = lowerMessage
          .replace(/jogador\s+/g, '')
          .replace(/informações\s+(do|da)\s+/g, '')
          .replace(/info\s+(do|da)\s+/g, '')
          .replace(/dados\s+(do|da)\s+/g, '')
          .trim();
        
        if (playerName.length > 2) {
          console.log(`✅ Detectado solicitação de informações do jogador: ${playerName}`);
          return {
            intent: 'player_info',
            player: playerName,
            confidence: 0.95
          };
        }
      }

      // Detectar informações genéricas (info/dados) - só se NÃO contém "jogador"
      if (!lowerMessage.includes('jogador') && (lowerMessage.includes('info') || lowerMessage.includes('dados') || lowerMessage.includes('informações')) && (lowerMessage.includes('do') || lowerMessage.includes('da')) && lowerMessage.length > 10) {
        // Para mensagens genéricas, verificar se é um time conhecido
        const teamName = this.extractTeamName(lowerMessage);
        if (teamName) {
          console.log(`✅ Detectado informações do time: ${teamName}`);
          return {
            intent: 'team_info',
            team: teamName,
            confidence: 0.90
          };
        }
        
        // Se não é time, tentar como jogador
        const player = this.extractPlayerName(lowerMessage);
        if (player) {
          console.log(`✅ Detectado solicitação de informações do jogador: ${player}`);
          return {
            intent: 'player_info',
            player,
            confidence: 0.85
          };
        }
      }

      // Detectar informações de canais
      if (lowerMessage.includes('canais') || lowerMessage.includes('lista') ||
          (lowerMessage.includes('quais') && lowerMessage.includes('canal')) ||
          lowerMessage.includes('onde assistir') || lowerMessage.includes('como assistir')) {
        console.log(`✅ Detectado informações de canais`);
        return {
          intent: 'channels_info',
          confidence: 0.80
        };
      }
      
      // Detectar apenas nome do time (como "Flamengo")
      const teamName = this.extractTeamName(lowerMessage);
      if (teamName && lowerMessage.trim().length <= 15) { // Mensagem curta com nome do time
        console.log(`✅ Detectado nome do time: ${teamName} - assumindo próximo jogo`);
        return {
          intent: 'next_match',
          team: teamName,
          confidence: 0.90
        };
      }
      
      // Detectar "quando joga"
      if (lowerMessage.includes('quando') && lowerMessage.includes('joga')) {
        const team = this.extractTeamName(lowerMessage);
        return {
          intent: 'next_match',
          team,
          confidence: 0.90
        };
      }
      
      // Detectar informações do time
      if (lowerMessage.includes('informações') || lowerMessage.includes('info')) {
        const team = this.extractTeamName(lowerMessage);
        return {
          intent: 'team_info',
          team,
          confidence: 0.85
        };
      }
      
      // Detectar tabela
      if (lowerMessage.includes('tabela') || lowerMessage.includes('classificação')) {
        const competition = this.extractCompetitionName(lowerMessage);
        return {
          intent: 'table',
          competition: competition || 'brasileirao',
          confidence: 0.85
        };
      }
      
      // Detectar jogos de hoje
      if (lowerMessage.includes('jogos') && lowerMessage.includes('hoje')) {
        return {
          intent: 'matches_today',
          confidence: 0.80
        };
      }
      
      // Detectar competições
      if (lowerMessage.includes('libertadores') || lowerMessage.includes('copa')) {
        return {
          intent: 'competition_info',
          competition: this.extractCompetitionName(lowerMessage),
          confidence: 0.75
        };
      }
      
      // Detectar saudações explícitas
      if (this.isGreeting(lowerMessage)) {
        console.log(`👋 Saudação detectada: "${message}"`);
        return {
          intent: 'greeting',
          confidence: 0.95
        };
      }

      // Mensagem não reconhecida
      console.log(`❓ Nenhuma intenção específica detectada para: "${message}"`);
      return {
        intent: 'unknown',
        confidence: 0.30
      };
      
    } catch (error) {
      console.error('Erro na análise da mensagem:', error);
      return {
        intent: 'greeting',
        confidence: 0.30
      };
    }
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
      'oi', 'olá', 'ola', 'oie', 'opa', 'opa!',
      'bom dia', 'boa tarde', 'boa noite',
      'e aí', 'e ai', 'eai', 'salve', 'fala', 'fala aí', 'fala ai',
      'hello', 'hi', 'hey', 'hola',
      'menu', 'inicio', 'começar', 'comecar', 'start',
      'oi bot', 'ola bot', 'oi kmiza', 'ola kmiza',
      'tchau', 'valeu', 'obrigado', 'obrigada', 'brigado'
    ];
    
    // Verificar correspondência exata ou com espaços
    return greetings.some(greeting => {
      return lowerMessage === greeting || 
             lowerMessage === greeting + '!' ||
             lowerMessage.startsWith(greeting + ' ') ||
             lowerMessage.endsWith(' ' + greeting) ||
             (lowerMessage.length <= 15 && lowerMessage.includes(greeting));
    });
  }
} 