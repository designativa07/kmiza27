import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { Stadium } from '../entities/stadium.entity';
import { Round } from '../entities/round.entity';
import { User } from '../entities/user.entity';
import { OpenAIService } from './openai.service';
import { EvolutionService } from './evolution.service';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    private openAIService: OpenAIService,
    private evolutionService: EvolutionService,
    private usersService: UsersService,
  ) {}

  async processMessage(phoneNumber: string, message: string, pushName?: string): Promise<string> {
    try {
      console.log(`📱 Mensagem recebida de ${phoneNumber}: "${message}"`);

      // Criar ou atualizar usuário no banco de dados
      const user = await this.usersService.findOrCreateUser(phoneNumber, pushName);
      
      // Atualizar última interação
      await this.usersService.updateLastInteraction(phoneNumber);

      // Analisar intenção usando OpenAI
      const analysis = await this.openAIService.analyzeMessage(message);
      console.log(`🧠 Intenção detectada: ${analysis.intent} (${(analysis.confidence * 100).toFixed(0)}%)`);

      let response: string;

      switch (analysis.intent) {
        case 'next_match':
          response = await this.findNextMatch(analysis.team ?? '');
          break;

        case 'team_info':
          response = await this.getTeamInfo(analysis.team ?? '');
          break;

        case 'table':
          response = await this.getCompetitionTable(analysis.competition ?? 'brasileirao');
          break;

        case 'matches_today':
          response = await this.getTodayMatches();
          break;

        case 'competition_info':
          response = await this.getCompetitionInfo(analysis.competition ?? '');
          break;

        default:
          response = this.getWelcomeMessage();
      }

      console.log(`🤖 Resposta gerada para ${phoneNumber}`);
      return response;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return '❌ Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.';
    }
  }

  private async findNextMatch(teamName: string): Promise<string> {
    try {
      if (!teamName) {
        return '❌ Por favor, especifique o nome do time. Ex: "Próximo jogo do Flamengo"';
      }

      // Buscar o time no banco
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado. 

🔍 Tente com: Flamengo, Palmeiras, Corinthians, São Paulo, Santos, Botafogo, etc.`;
      }

      // Buscar próximo jogo
      const nextMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'scheduled' })
        .andWhere('match.match_date >= :now', { now: new Date() })
        .orderBy('match.match_date', 'ASC')
        .getOne();

      if (!nextMatch) {
        return `😔 Não encontrei jogos futuros agendados para o **${team.name}**.

🔍 Verifique novamente em breve ou pergunte sobre outro time!`;
      }

      const date = new Date(nextMatch.match_date);
      const formattedDate = date.toLocaleDateString('pt-BR');
      const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const isHome = nextMatch.home_team.id === team.id;
      const opponent = isHome ? nextMatch.away_team.name : nextMatch.home_team.name;
      const venue = isHome ? 'em casa' : 'fora de casa';

      return `⚽ **PRÓXIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${nextMatch.competition.name}
🆚 **Adversário:** ${opponent}
🏟️ **Estádio:** ${nextMatch.stadium?.name || 'A definir'}
📍 **Rodada:** ${nextMatch.round?.name || 'A definir'}
🏠 **Mando:** ${venue}

Bora torcer! 🔥⚽`;

    } catch (error) {
      console.error('Erro ao buscar próximo jogo:', error);
      return '❌ Erro ao buscar informações do jogo. Tente novamente.';
    }
  }

  private async getTeamInfo(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      return `ℹ️ **INFORMAÇÕES DO ${team.name.toUpperCase()}** ℹ️

📛 **Nome completo:** ${team.full_name}
🏷️ **Sigla:** ${team.short_name}
🏙️ **Cidade:** ${team.city}
🗺️ **Estado:** ${team.state}
🌍 **País:** ${team.country}
📅 **Fundação:** ${team.founded_year}

⚽ Quer saber sobre o próximo jogo? É só perguntar!`;

    } catch (error) {
      console.error('Erro ao buscar informações do time:', error);
      return '❌ Erro ao buscar informações do time.';
    }
  }

  private async getCompetitionTable(competitionName: string): Promise<string> {
    // Por enquanto, retorna uma tabela simulada
    // TODO: Implementar tabela real quando houver dados de classificação
    return `📊 **TABELA DO BRASILEIRÃO SÉRIE A** 📊

🥇 1º - Flamengo - 45 pts
🥈 2º - Palmeiras - 42 pts  
🥉 3º - Botafogo - 38 pts
4º - São Paulo - 35 pts
5º - Corinthians - 33 pts
6º - Atlético-MG - 30 pts
7º - Internacional - 28 pts
8º - Grêmio - 25 pts

📱 Para ver a tabela completa, acesse: www.cbf.com.br

⚽ Quer saber sobre o próximo jogo de algum time? É só perguntar!`;
  }

  private async getTodayMatches(): Promise<string> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where('match.match_date >= :start', { start: startOfDay })
        .andWhere('match.match_date < :end', { end: endOfDay })
        .orderBy('match.match_date', 'ASC')
        .getMany();

      if (todayMatches.length === 0) {
        return `📅 **JOGOS DE HOJE** 📅

😔 Não há jogos agendados para hoje.

⚽ Quer saber sobre o próximo jogo de algum time específico?`;
      }

      let response = `📅 **JOGOS DE HOJE** 📅\n\n`;

      todayMatches.forEach(match => {
        const time = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        response += `⏰ ${time} - ${match.competition.name}\n`;
        response += `⚽ ${match.home_team.name} vs ${match.away_team.name}\n`;
        response += `🏟️ ${match.stadium?.name || 'A definir'}\n\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar jogos de hoje:', error);
      return '❌ Erro ao buscar jogos de hoje.';
    }
  }

  private async getCompetitionInfo(competitionName: string): Promise<string> {
    try {
      const competition = await this.competitionsRepository
        .createQueryBuilder('competition')
        .where('LOWER(competition.name) LIKE LOWER(:name)', { name: `%${competitionName}%` })
        .getOne();

      if (!competition) {
        return `❌ Competição "${competitionName}" não encontrada.`;
      }

      return `🏆 **${competition.name.toUpperCase()}** 🏆

📅 **Temporada:** ${competition.season}
🌍 **País/Região:** ${competition.country}
📋 **Tipo:** ${competition.type}
✅ **Status:** ${competition.is_active ? 'Ativa' : 'Inativa'}

⚽ Quer saber sobre jogos desta competição?`;

    } catch (error) {
      console.error('Erro ao buscar informações da competição:', error);
      return '❌ Erro ao buscar informações da competição.';
    }
  }

  private getWelcomeMessage(): string {
    return `👋 **Olá! Sou o Kmiza27 Bot** ⚽

🤖 Posso te ajudar com informações sobre futebol:

⚽ **Próximos jogos** - "Próximo jogo do Flamengo"
ℹ️ **Info do time** - "Informações do Palmeiras"  
📊 **Tabelas** - "Tabela do Brasileirão"
📅 **Jogos hoje** - "Jogos de hoje"
🏆 **Competições** - "Copa Libertadores"

💬 **O que você gostaria de saber?**`;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      return await this.evolutionService.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  async getStatus(): Promise<any> {
    try {
      const evolutionStatus = await this.evolutionService.getInstanceStatus();
      
      // Verificar conexão com banco
      const teamsCount = await this.teamsRepository.count();
      const matchesCount = await this.matchesRepository.count();
      
      return {
        status: 'operational',
        evolution: evolutionStatus,
        database: {
          connected: true,
          teams: teamsCount,
          matches: matchesCount
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
} 