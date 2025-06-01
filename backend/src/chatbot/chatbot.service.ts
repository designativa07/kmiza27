import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { CompetitionTeam } from '../entities/competition-team.entity';
import { Stadium } from '../entities/stadium.entity';
import { Round } from '../entities/round.entity';
import { User } from '../entities/user.entity';
import { OpenAIService } from './openai.service';
import { EvolutionService } from './evolution.service';
import { FootballDataService } from './football-data.service';
import { UsersService } from '../modules/users/users.service';
import { StandingsService, StandingEntry } from '../modules/standings/standings.service';
import { BotConfigService } from '../modules/bot-config/bot-config.service';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamsRepository: Repository<CompetitionTeam>,
    private openAIService: OpenAIService,
    private evolutionService: EvolutionService,
    private footballDataService: FootballDataService,
    private usersService: UsersService,
    private standingsService: StandingsService,
    private botConfigService: BotConfigService,
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

        case 'matches_week':
          response = await this.getWeekMatches();
          break;

        case 'competition_info':
          response = await this.getCompetitionInfo(analysis.competition ?? '');
          break;

        case 'team_position':
          response = await this.getTeamPosition(analysis.team ?? '');
          break;

        case 'last_match':
          response = await this.getLastMatch(analysis.team ?? '');
          break;

        case 'broadcast_info':
          response = await this.getBroadcastInfo(analysis.team ?? '');
          break;

        case 'team_statistics':
          response = await this.footballDataService.getTeamStatistics(analysis.team ?? '');
          break;

        case 'top_scorers':
          response = await this.footballDataService.getTopScorers(analysis.competition);
          break;

        case 'channels_info':
          response = await this.footballDataService.getChannelInfo();
          break;

        case 'competition_stats':
          response = await this.footballDataService.getCompetitionStats(analysis.competition ?? '');
          break;

        default:
          response = await this.getWelcomeMessage();
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

      // Buscar próximo jogo com informações de transmissão
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

      // Informações de transmissão
      let broadcastInfo = '';
      if (nextMatch.broadcast_channels && Array.isArray(nextMatch.broadcast_channels)) {
        broadcastInfo = `\n📺 **Transmissão:** ${nextMatch.broadcast_channels.join(', ')}`;
      }

      return `⚽ **PRÓXIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${nextMatch.competition.name}
🆚 **Adversário:** ${opponent}
🏟️ **Estádio:** ${nextMatch.stadium?.name || 'A definir'}
📍 **Rodada:** ${nextMatch.round?.name || 'A definir'}
🏠 **Mando:** ${venue}${broadcastInfo}

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
    try {
      // Buscar a competição
      const competition = await this.competitionsRepository
        .createQueryBuilder('competition')
        .where('LOWER(competition.name) LIKE LOWER(:name)', { name: `%${competitionName}%` })
        .orWhere('LOWER(competition.slug) LIKE LOWER(:name)', { name: `%${competitionName}%` })
        .getOne();

      if (!competition) {
        return `❌ Competição "${competitionName}" não encontrada.

🔍 Tente com: Brasileirão, Libertadores, Copa do Brasil, etc.`;
      }

      // Usar o StandingsService para obter a classificação calculada dinamicamente
      const standings = await this.standingsService.getCompetitionStandings(competition.id);

      if (standings.length === 0) {
        return `📊 **TABELA - ${competition.name.toUpperCase()}** 📊

😔 Ainda não há dados de classificação disponíveis para esta competição.

⚽ Quer saber sobre jogos ou outras informações?`;
      }

      let response = `📊 **TABELA - ${competition.name.toUpperCase()}** 📊\n\n`;

      // Mostrar TODOS os times, mas apenas com posição e pontuação
      standings.forEach((standing) => {
        const position = standing.position;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
        
        response += `${emoji} ${standing.team.name} - ${standing.points} pts\n`;
      });

      response += `\n📊 Para tabela detalhada com estatísticas completas, acesse: kmiza27.com\n`;
      response += `⚽ Quer saber sobre o próximo jogo de algum time? É só perguntar!`;

      return response;

    } catch (error) {
      console.error('Erro ao buscar tabela da competição:', error);
      return '❌ Erro ao buscar tabela da competição.';
    }
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

  private async getWeekMatches(): Promise<string> {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where('match.match_date >= :start', { start: today })
        .andWhere('match.match_date <= :end', { end: nextWeek })
        .andWhere('match.status = :status', { status: 'scheduled' })
        .orderBy('match.match_date', 'ASC')
        .limit(15)
        .getMany();

      if (weekMatches.length === 0) {
        return `📅 **JOGOS DA SEMANA** 📅

😔 Não há jogos agendados para os próximos 7 dias.

⚽ Quer saber sobre algum time específico?`;
      }

      let response = `📅 **JOGOS DA SEMANA** 📅\n\n`;

      weekMatches.forEach(match => {
        const date = new Date(match.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        response += `📅 ${formattedDate} - ${time}\n`;
        response += `🏆 ${match.competition.name}\n`;
        response += `⚽ ${match.home_team.name} vs ${match.away_team.name}\n`;
        if (match.stadium) {
          response += `🏟️ ${match.stadium.name}\n`;
        }
        response += `\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar jogos da semana:', error);
      return '❌ Erro ao buscar jogos da semana.';
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

  private async getTeamPosition(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar posição do time nas competições ativas
      const positions = await this.competitionTeamsRepository
        .createQueryBuilder('ct')
        .leftJoinAndSelect('ct.competition', 'competition')
        .where('ct.team = :teamId', { teamId: team.id })
        .andWhere('competition.is_active = :active', { active: true })
        .getMany();

      if (positions.length === 0) {
        return `📊 **POSIÇÃO DO ${team.name.toUpperCase()}** 📊

😔 O time não está participando de competições ativas no momento.`;
      }

      let response = `📊 **POSIÇÃO DO ${team.name.toUpperCase()}** 📊\n\n`;

      positions.forEach(pos => {
        response += `🏆 **${pos.competition.name}**\n`;
        response += `📍 ${pos.position}º lugar - ${pos.points} pontos\n`;
        response += `⚽ J:${pos.played} V:${pos.won} E:${pos.drawn} D:${pos.lost}\n`;
        response += `🥅 GP:${pos.goals_for} GC:${pos.goals_against} SG:${pos.goal_difference}\n\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar posição do time:', error);
      return '❌ Erro ao buscar posição do time.';
    }
  }

  private async getLastMatch(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar último jogo
      const lastMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .orderBy('match.match_date', 'DESC')
        .getOne();

      if (!lastMatch) {
        return `😔 Não encontrei jogos finalizados para o **${team.name}**.`;
      }

      const date = new Date(lastMatch.match_date);
      const formattedDate = date.toLocaleDateString('pt-BR');

      const isHome = lastMatch.home_team.id === team.id;
      const opponent = isHome ? lastMatch.away_team.name : lastMatch.home_team.name;
      const teamScore = isHome ? lastMatch.home_score : lastMatch.away_score;
      const opponentScore = isHome ? lastMatch.away_score : lastMatch.home_score;
      
      const result = teamScore > opponentScore ? '✅ VITÓRIA' : 
                    teamScore < opponentScore ? '❌ DERROTA' : '🟡 EMPATE';

      return `⚽ **ÚLTIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
🏆 **Competição:** ${lastMatch.competition.name}
🆚 **Adversário:** ${opponent}
📊 **Placar:** ${lastMatch.home_team.name} ${lastMatch.home_score} x ${lastMatch.away_score} ${lastMatch.away_team.name}
🏟️ **Estádio:** ${lastMatch.stadium?.name || 'N/A'}
📍 **Rodada:** ${lastMatch.round?.name || 'N/A'}

${result}`;

    } catch (error) {
      console.error('Erro ao buscar último jogo:', error);
      return '❌ Erro ao buscar último jogo.';
    }
  }

  private async getBroadcastInfo(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar próximos jogos com informações de transmissão
      const upcomingMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'scheduled' })
        .andWhere('match.match_date >= :now', { now: new Date() })
        .orderBy('match.match_date', 'ASC')
        .limit(3)
        .getMany();

      if (upcomingMatches.length === 0) {
        return `📺 **TRANSMISSÕES DO ${team.name.toUpperCase()}** 📺

😔 Não há jogos futuros agendados.`;
      }

      let response = `📺 **TRANSMISSÕES DO ${team.name.toUpperCase()}** 📺\n\n`;

      upcomingMatches.forEach(match => {
        const date = new Date(match.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const isHome = match.home_team.id === team.id;
        const opponent = isHome ? match.away_team.name : match.home_team.name;

        response += `📅 ${formattedDate} - ${time}\n`;
        response += `🆚 ${team.name} vs ${opponent}\n`;
        response += `🏆 ${match.competition.name}\n`;
        
        if (match.broadcast_channels && Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0) {
          response += `📺 ${match.broadcast_channels.join(', ')}\n`;
        } else {
          response += `📺 Transmissão a confirmar\n`;
        }
        response += `\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar informações de transmissão:', error);
      return '❌ Erro ao buscar informações de transmissão.';
    }
  }

  private async getWelcomeMessage(): Promise<string> {
    try {
      // Tentar buscar a mensagem de boas-vindas do banco de dados
      const welcomeMessage = await this.botConfigService.getConfig('welcome_message');
      
      if (welcomeMessage) {
        return welcomeMessage;
      }
    } catch (error) {
      console.error('Erro ao buscar welcome_message do banco:', error);
    }
    
    // Fallback para mensagem padrão se não conseguir buscar do banco
    return `👋 **Olá! Sou o Kmiza27 Bot** ⚽

🤖 Posso te ajudar com informações sobre futebol:

⚽ **Próximos jogos** - "Próximo jogo do Flamengo"
🏁 **Último jogo** - "Último jogo do Palmeiras"
ℹ️ **Info do time** - "Informações do Corinthians"  
📊 **Tabelas** - "Tabela do Brasileirão"
📍 **Posição** - "Posição do São Paulo"
📈 **Estatísticas** - "Estatísticas do Santos"
🥇 **Artilheiros** - "Artilheiros do Brasileirão"
📅 **Jogos hoje** - "Jogos de hoje"
📺 **Transmissão** - "Onde passa o jogo do Botafogo"
📡 **Canais** - "Lista de canais"
🗓️ **Jogos da semana** - "Jogos da semana"
🏆 **Competições** - "Estatísticas da Libertadores"

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

  /**
   * Método para testar o chatbot em desenvolvimento
   * Simula o processamento de mensagens sem WhatsApp
   */
  async testMessage(message: string, phoneNumber: string = '5511999999999'): Promise<any> {
    try {
      console.log(`🧪 TESTE - Processando mensagem: "${message}"`);
      
      const startTime = Date.now();
      const response = await this.processMessage(phoneNumber, message, 'Teste Dev');
      const endTime = Date.now();
      
      return {
        success: true,
        input: {
          message,
          phoneNumber,
          timestamp: new Date().toISOString()
        },
        output: {
          response,
          processingTime: `${endTime - startTime}ms`
        },
        debug: {
          messageLength: message.length,
          responseLength: response.length,
          environment: 'development'
        }
      };
    } catch (error) {
      console.error('🧪 TESTE - Erro:', error);
      return {
        success: false,
        input: {
          message,
          phoneNumber,
          timestamp: new Date().toISOString()
        },
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Método para testar múltiplas mensagens em sequência
   */
  async testMultipleMessages(messages: string[], phoneNumber: string = '5511999999999'): Promise<any> {
    try {
      console.log(`🧪 TESTE MÚLTIPLO - Processando ${messages.length} mensagens`);
      
      const results: any[] = [];
      const startTime = Date.now();
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        console.log(`🧪 Testando mensagem ${i + 1}/${messages.length}: "${message}"`);
        
        const result = await this.testMessage(message, phoneNumber);
        results.push({
          index: i + 1,
          ...result
        });
        
        // Pequena pausa entre mensagens para simular uso real
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      
      return {
        success: true,
        summary: {
          totalMessages: messages.length,
          successfulMessages: results.filter((r: any) => r.success).length,
          failedMessages: results.filter((r: any) => !r.success).length,
          totalProcessingTime: `${endTime - startTime}ms`,
          averageProcessingTime: `${Math.round((endTime - startTime) / messages.length)}ms`
        },
        results
      };
    } catch (error) {
      console.error('🧪 TESTE MÚLTIPLO - Erro:', error);
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Método para testar cenários específicos do chatbot
   */
  async testScenarios(): Promise<any> {
    try {
      console.log('🧪 TESTE DE CENÁRIOS - Iniciando testes automáticos');
      
      const scenarios = [
        {
          name: 'Saudação',
          messages: ['oi', 'olá', 'bom dia']
        },
        {
          name: 'Próximo jogo',
          messages: ['próximo jogo do flamengo', 'quando joga o palmeiras', 'próximo jogo corinthians']
        },
        {
          name: 'Tabela',
          messages: ['tabela do brasileirão', 'classificação brasileirao', 'tabela brasileiro']
        },
        {
          name: 'Jogos hoje',
          messages: ['jogos hoje', 'jogos de hoje', 'que jogos tem hoje']
        },
        {
          name: 'Informações do time',
          messages: ['informações do santos', 'info do botafogo', 'dados do são paulo']
        },
        {
          name: 'Último jogo',
          messages: ['último jogo do flamengo', 'resultado palmeiras', 'como foi o jogo do corinthians']
        }
      ];
      
      const results: any[] = [];
      
      for (const scenario of scenarios) {
        console.log(`🧪 Testando cenário: ${scenario.name}`);
        
        const scenarioResult = await this.testMultipleMessages(scenario.messages);
        results.push({
          scenario: scenario.name,
          ...scenarioResult
        });
      }
      
      return {
        success: true,
        testSummary: {
          totalScenarios: scenarios.length,
          successfulScenarios: results.filter((r: any) => r.success).length,
          timestamp: new Date().toISOString()
        },
        scenarioResults: results
      };
    } catch (error) {
      console.error('🧪 TESTE DE CENÁRIOS - Erro:', error);
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Método para verificar a saúde do sistema
   */
  async healthCheck(): Promise<any> {
    try {
      console.log('🏥 HEALTH CHECK - Verificando saúde do sistema');
      
      const checks = {
        database: false,
        openai: false,
        evolution: false,
        repositories: false
      };
      
      // Verificar banco de dados
      try {
        const teamsCount = await this.teamsRepository.count();
        const matchesCount = await this.matchesRepository.count();
        const competitionsCount = await this.competitionsRepository.count();
        
        checks.database = true;
        checks.repositories = teamsCount > 0 && matchesCount > 0 && competitionsCount > 0;
      } catch (error) {
        console.error('❌ Erro no banco de dados:', error.message);
      }
      
      // Verificar OpenAI
      try {
        await this.openAIService.analyzeMessage('teste');
        checks.openai = true;
      } catch (error) {
        console.error('❌ Erro no OpenAI:', error.message);
      }
      
      // Verificar Evolution
      try {
        await this.evolutionService.getInstanceStatus();
        checks.evolution = true;
      } catch (error) {
        console.error('❌ Erro no Evolution:', error.message);
      }
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        healthy: allHealthy,
        checks,
        timestamp: new Date().toISOString(),
        status: allHealthy ? 'Todos os serviços funcionando' : 'Alguns serviços com problemas'
      };
    } catch (error) {
      console.error('🏥 HEALTH CHECK - Erro:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Método para debug da tabela de classificação
   */
  async debugCompetitionTable(): Promise<any> {
    try {
      console.log('🔍 DEBUG - Verificando dados da tabela de classificação');
      
      // 1. Verificar competições disponíveis
      const competitions = await this.competitionsRepository.find();
      console.log('🏆 Competições encontradas:', competitions.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
      
      // 2. Buscar especificamente o Brasileirão
      const brasileirao = await this.competitionsRepository
        .createQueryBuilder('competition')
        .where('LOWER(competition.name) LIKE LOWER(:name)', { name: '%brasileir%' })
        .orWhere('LOWER(competition.slug) LIKE LOWER(:name)', { name: '%brasileir%' })
        .getOne();
      
      console.log('⚽ Brasileirão encontrado:', brasileirao);
      
      if (!brasileirao) {
        return {
          error: 'Brasileirão não encontrado',
          competitions: competitions.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
        };
      }
      
      // 3. Verificar dados na tabela competition_teams (dados estáticos)
      const competitionTeams = await this.competitionTeamsRepository
        .createQueryBuilder('ct')
        .leftJoinAndSelect('ct.team', 'team')
        .leftJoinAndSelect('ct.competition', 'competition')
        .where('ct.competition = :competitionId', { competitionId: brasileirao.id })
        .getMany();
      
      console.log('📊 Times na competição (tabela estática):', competitionTeams.length);
      console.log('📋 Dados dos times (estáticos):', competitionTeams.map(ct => ({
        team: ct.team?.name,
        points: ct.points,
        played: ct.played,
        won: ct.won,
        drawn: ct.drawn,
        lost: ct.lost
      })));
      
      // 4. Verificar dados calculados dinamicamente
      let dynamicStandings: StandingEntry[] = [];
      let matchesCount = 0;
      try {
        dynamicStandings = await this.standingsService.getCompetitionStandings(brasileirao.id);
        
        // Contar jogos finalizados
        const finishedMatches = await this.matchesRepository
          .createQueryBuilder('match')
          .where('match.competition_id = :competitionId', { competitionId: brasileirao.id })
          .andWhere('match.status = :status', { status: 'finished' })
          .getCount();
        
        matchesCount = finishedMatches;
        
        console.log('🎯 Classificação calculada dinamicamente:', dynamicStandings.slice(0, 5).map(s => ({
          position: s.position,
          team: s.team.name,
          points: s.points,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goal_difference: s.goal_difference
        })));
      } catch (error) {
        console.error('❌ Erro ao calcular classificação dinâmica:', error);
      }
      
      // 5. Verificar se há dados zerados
      const teamsWithPoints = competitionTeams.filter(ct => ct.points > 0);
      const dynamicTeamsWithPoints = dynamicStandings.filter(s => s.points > 0);
      
      console.log('🎯 Times com pontos > 0 (estático):', teamsWithPoints.length);
      console.log('🎯 Times com pontos > 0 (dinâmico):', dynamicTeamsWithPoints.length);
      
      return {
        success: true,
        brasileirao: {
          id: brasileirao.id,
          name: brasileirao.name,
          slug: brasileirao.slug
        },
        staticData: {
          totalTeams: competitionTeams.length,
          teamsWithPoints: teamsWithPoints.length,
          sampleData: competitionTeams.slice(0, 5).map(ct => ({
            team: ct.team?.name,
            points: ct.points,
            played: ct.played,
            won: ct.won,
            drawn: ct.drawn,
            lost: ct.lost,
            goalDifference: ct.goal_difference
          }))
        },
        dynamicData: {
          totalTeams: dynamicStandings.length,
          teamsWithPoints: dynamicTeamsWithPoints.length,
          finishedMatches: matchesCount,
          sampleData: dynamicStandings.slice(0, 5).map(s => ({
            position: s.position,
            team: s.team.name,
            points: s.points,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalDifference: s.goal_difference
          }))
        },
        recommendation: dynamicStandings.length > 0 ? 
          'O chatbot agora usa dados calculados dinamicamente baseados nos jogos finalizados!' :
          'Não há jogos finalizados ainda. A tabela será populada conforme os jogos forem sendo finalizados.'
      };
      
    } catch (error) {
      console.error('🔍 DEBUG - Erro:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Verificar se as respostas automáticas estão habilitadas
   */
  async isAutoResponseEnabled(): Promise<boolean> {
    try {
      const config = await this.botConfigService.getConfig('auto_response_enabled');
      return config === 'true';
    } catch (error) {
      console.error('Erro ao verificar auto_response_enabled:', error);
      return true; // Default: habilitado
    }
  }
} 