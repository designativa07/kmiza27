import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotConfigService } from '../modules/bot-config/bot-config.service';
import { TeamsService } from '../modules/teams/teams.service';

export interface MessageAnalysis {
  intent: string;
  team?: string;
  competition?: string;
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

  private async loadTeamNames() {
    this.teamNames = [];
    const teams = await this.teamsService.findAll();
    for (const team of teams) {
      this.teamNames.push(this.removeAccents(team.name.toLowerCase()));
      if (team.short_name) {
        this.teamNames.push(this.removeAccents(team.short_name.toLowerCase()));
      }
      if (team.slug) {
        this.teamNames.push(this.removeAccents(team.slug.toLowerCase()));
      }
    }
    this.teamNames = [...new Set(this.teamNames)].sort((a, b) => b.length - a.length);
    console.log(`⚽ Carregados ${this.teamNames.length} nomes de times para reconhecimento.`);
    console.log("Lista de teamNames carregados:", this.teamNames);
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
      
      // Saudação padrão
      console.log(`❓ Nenhuma intenção específica detectada, retornando greeting`);
      return {
        intent: 'greeting',
        confidence: 0.50
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
    for (const team of this.teamNames) {
      if (message.includes(team)) {
        return team;
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
} 