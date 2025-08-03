import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotConfigService } from '../modules/bot-config/bot-config.service';
import { TeamsService } from '../modules/teams/teams.service';

export interface MessageAnalysis {
  intent: string;
  team?: string;
  competition?: string;
  player?: string;
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
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
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
          lowerMessage.includes('tv') || lowerMessage.includes('streaming')) {
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
        const team = this.extractTeamName(lowerMessage);
        const competition = this.extractCompetitionName(lowerMessage);
        
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
  
  private extractTeamName(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    // Buscar diretamente nos nomes de times carregados do banco (incluindo aliases)
    // Ordenar por comprimento (maiores primeiro) para evitar conflitos
    const sortedTeamNames = this.teamNames.sort((a, b) => b.length - a.length);
    
    for (const teamName of sortedTeamNames) {
      let matched = false;
      
      // Para nomes curtos (<=3 chars), ser mais restritivo com word boundaries
      if (teamName.length <= 3) {
        const regex = new RegExp(`\\b${teamName}\\b`, 'i');
        if (regex.test(message)) {
          matched = true;
        }
      } else {
        // Para nomes longos, usar busca normal
        if (lowerMessage.includes(teamName.toLowerCase())) {
          matched = true;
        }
      }
      
      if (matched) {
        // Retornar o nome/alias encontrado para manter compatibilidade
        // O findTeam no ChatbotService vai resolver para o time real
        return teamName;
      }
    }
    
    return undefined;
  }
  
  private extractCompetitionName(message: string): string | undefined {
    if (message.includes('libertadores')) return 'libertadores';
    if (message.includes('copa do brasil')) return 'copa-do-brasil';
    if (message.includes('brasileirão') || message.includes('brasileirao')) return 'brasileirao';
    if (message.includes('série a') || message.includes('serie a')) return 'brasileirao';
    if (message.includes('série b') || message.includes('serie b')) return 'brasileiro-serie-b';
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