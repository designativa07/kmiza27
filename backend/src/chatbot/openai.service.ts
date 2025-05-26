import { Injectable } from '@nestjs/common';

export interface MessageAnalysis {
  intent: string;
  team?: string;
  competition?: string;
  confidence: number;
}

@Injectable()
export class OpenAIService {
  
  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
      // Análise simples por enquanto (pode ser expandida com OpenAI real)
      const lowerMessage = message.toLowerCase();
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
        return {
          intent: 'table',
          competition: 'brasileirao',
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
    const teams = [
      'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 
      'botafogo', 'fluminense', 'vasco', 'atlético-mg', 'cruzeiro', 
      'internacional', 'grêmio', 'bahia', 'fortaleza', 'ceará',
      'sport', 'vitória', 'juventude', 'bragantino', 'mirassol'
    ];
    
    for (const team of teams) {
      if (message.includes(team)) {
        return team;
      }
    }
    
    return undefined;
  }
  
  private extractCompetitionName(message: string): string | undefined {
    if (message.includes('libertadores')) return 'libertadores';
    if (message.includes('copa do brasil')) return 'copa-do-brasil';
    if (message.includes('brasileirão')) return 'brasileirao';
    if (message.includes('sul-americana')) return 'sul-americana';
    
    return undefined;
  }
} 