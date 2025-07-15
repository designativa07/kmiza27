import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match, MatchStatus } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { CompetitionTeam } from '../entities/competition-team.entity';
import { Stadium } from '../entities/stadium.entity';
import { Round } from '../entities/round.entity';
import { User } from '../entities/user.entity';
import { MatchBroadcast } from '../entities/match-broadcast.entity';
import { Channel } from '../entities/channel.entity';
import { Player } from '../entities/player.entity';
import { PlayerTeamHistory } from '../entities/player-team-history.entity';
import { OpenAIService } from './openai.service';
import { EvolutionService } from './evolution.service';
import { FootballDataService } from './football-data.service';
import { UsersService } from '../modules/users/users.service';
import { StandingsService, StandingEntry } from '../modules/standings/standings.service';
import { BotConfigService } from '../modules/bot-config/bot-config.service';
import { WhatsAppMenuService } from '../modules/whatsapp-menu/whatsapp-menu.service';
import { UrlShortenerService } from '../modules/url-shortener/url-shortener.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamsRepository: Repository<CompetitionTeam>,
    @InjectRepository(MatchBroadcast)
    private matchBroadcastRepository: Repository<MatchBroadcast>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(PlayerTeamHistory)
    private playerTeamHistoryRepository: Repository<PlayerTeamHistory>,
    private openAIService: OpenAIService,
    private evolutionService: EvolutionService,
    private footballDataService: FootballDataService,
    private usersService: UsersService,
    private standingsService: StandingsService,
    private botConfigService: BotConfigService,
    private whatsAppMenuService: WhatsAppMenuService,
    private urlShortenerService: UrlShortenerService,
  ) {}

  /**
   * Cria uma URL curta para um jogo específico
   */
  private async createMatchShortUrl(match: Match): Promise<string> {
    try {
      const shortUrl = await this.urlShortenerService.createMatchShortUrl(
        match.id,
        match.home_team.name,
        match.away_team.name
      );
      return shortUrl.shortUrl;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar URL curta para jogo ${match.id}:`, error);
      // Fallback para URL normal
      const baseUrl = process.env.FRONTEND_URL || 'https://kmiza27.com';
      return `${baseUrl}/jogos/${match.id}`;
    }
  }

  /**
   * Cria uma URL curta para transmissão ao vivo
   */
  private async createStreamShortUrl(streamUrl: string, matchTitle: string): Promise<string> {
    try {
      const shortUrl = await this.urlShortenerService.createStreamShortUrl(streamUrl, matchTitle);
      return shortUrl.shortUrl;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar URL curta para stream:`, error);
      // Fallback para URL original
      return streamUrl;
    }
  }

  /**
   * Adiciona links curtos nas respostas sobre jogos
   */
  private async addMatchShortLinks(response: string, match: Match): Promise<string> {
    const matchUrl = await this.createMatchShortUrl(match);
    return `${response}\n\n🔗 Mais detalhes: ${matchUrl}`;
  }

  async processMessage(phoneNumber: string, message: string, pushName?: string, origin?: string): Promise<string> {
    try {
      console.log(`📱 Mensagem recebida de ${phoneNumber}: "${message}"`);

      // Detectar origem baseado no phoneNumber ou parâmetro explícito
      const userOrigin = origin || (phoneNumber.startsWith('site-') ? 'site' : 'whatsapp');
      
      // Criar ou atualizar usuário no banco de dados
      const user = await this.usersService.findOrCreateUser(phoneNumber, pushName, userOrigin);
      
      // Verificar se é primeira interação (usuário criado há menos de 1 minuto)
      const isFirstInteraction = this.isFirstInteraction(user);
      
      // Atualizar última interação
      await this.usersService.updateLastInteraction(phoneNumber);

      // Verificar se é um ID de botão de lista (IDs começam com prefixos específicos)
      if (this.isButtonListId(message)) {
        return await this.processButtonListId(phoneNumber, message);
      }

      // Verificar estado da conversa para comandos que requerem entrada adicional
      const conversationState = await this.getUserConversationState(phoneNumber);
      if (conversationState) {
        return await this.processConversationState(phoneNumber, message, conversationState);
      }

      // Analisar intenção usando OpenAI
      const analysis = await this.openAIService.analyzeMessage(message);
      console.log(`🧠 Intenção detectada: ${analysis.intent} (${(analysis.confidence * 100).toFixed(0)}%)`);

      let response: string;
      let shouldSendMenu = false;

      // Verificar se é saudação ou primeira interação
      const isGreeting = analysis.intent === 'greeting' || this.isExplicitGreeting(message);
      const shouldSendWelcome = isFirstInteraction || isGreeting;

      if (shouldSendWelcome) {
        console.log(`👋 ${isFirstInteraction ? 'Primeira interação' : 'Saudação'} detectada para ${phoneNumber}`);
        
        if (userOrigin === 'site') {
          // Para o site, verificar se já enviou boas-vindas
          const alreadySent = await this.hasWelcomeBeenSent(phoneNumber);
          if (!alreadySent) {
            await this.markWelcomeSent(phoneNumber);
            return await this.getWelcomeMessage();
          } else {
            // Se já enviou boas-vindas, enviar mensagem mais simples
            return '❓ Como posso te ajudar? Digite sua pergunta sobre futebol!';
          }
        } else {
          // Para WhatsApp: enviar mensagem de boas-vindas + menu
          const welcomeMessage = await this.getWelcomeMessage();
          await this.sendWelcomeMenu(phoneNumber);
          return welcomeMessage;
        }
      }

      // Processar intenções específicas
      switch (analysis.intent) {
        case 'next_match':
          response = await this.findNextMatch(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'current_match':
          response = await this.getCurrentMatch(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'team_info':
          response = await this.getTeamInfo(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'table':
          response = await this.getCompetitionTable(analysis.competition ?? 'brasileirao');
          shouldSendMenu = true;
          break;

        case 'matches_today':
          response = await this.getTodayMatches();
          shouldSendMenu = true;
          break;

        case 'matches_week':
          response = await this.getWeekMatches();
          shouldSendMenu = true;
          break;

        case 'competition_info':
          response = await this.getCompetitionInfo(analysis.competition ?? '');
          shouldSendMenu = true;
          break;

        case 'team_position':
          response = await this.getTeamPosition(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'last_match':
          response = await this.getLastMatch(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'broadcast_info':
          response = await this.getBroadcastInfo(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'team_statistics':
          response = await this.footballDataService.getTeamStatistics(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'top_scorers':
          response = await this.getTopScorers(analysis.competition);
          shouldSendMenu = true;
          break;

        case 'channels_info':
          response = await this.footballDataService.getChannelInfo();
          shouldSendMenu = true;
          break;

        case 'competition_stats':
          response = await this.footballDataService.getCompetitionStats(analysis.competition ?? '');
          shouldSendMenu = true;
          break;

        case 'team_squad':
          response = await this.getTeamSquad(analysis.team ?? '');
          shouldSendMenu = true;
          break;

        case 'player_info':
          response = await this.getPlayerInfo(analysis.player ?? '');
          shouldSendMenu = true;
          break;

        default:
          // Mensagem não reconhecida - enviar ajuda básica
          response = '❓ Não entendi sua pergunta. Aqui estão algumas opções que posso te ajudar:';
          shouldSendMenu = true;
      }

      console.log(`🤖 Resposta gerada para ${phoneNumber}`);
      
      // Para usuários do WhatsApp, enviar menu após respostas específicas
      if (userOrigin === 'whatsapp' && shouldSendMenu && response && response.trim() !== '') {
        console.log(`📋 Agendando envio do menu para usuário WhatsApp: ${phoneNumber}`);
        this.scheduleMenuSend(phoneNumber);
      }
      
      return response;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return '❌ Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.';
    }
  }

  private async findNextMatch(teamName: string): Promise<string> {
    this.logger.log(`🔍 Procurando próximo jogo para o time: ${teamName}`);
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        this.logger.warn(`Time "${teamName}" não encontrado no banco de dados.`);
        return `❌ Time "${teamName}" não encontrado.\n\n🔍 Tente com: Flamengo, Palmeiras, Corinthians, São Paulo, etc.`;
      }

      this.logger.log(`Time encontrado: ${team.name} (ID: ${team.id})`);

      // Primeiro, verificar se há jogo ao vivo
      const liveMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'live' })
        .getOne();

      if (liveMatch) {
        // Se há jogo ao vivo, usar o método getCurrentMatch
        return this.getCurrentMatch(teamName);
      }

      // Verificar se há jogo hoje que pode estar ao vivo (mesmo que marcado como scheduled)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'scheduled' })
        .andWhere('match.match_date >= :start', { start: startOfDay })
        .andWhere('match.match_date < :end', { end: endOfDay })
        .getOne();

      if (todayMatch) {
        // Verificar se o jogo pode estar acontecendo agora
        const matchTime = new Date(todayMatch.match_date);
        const now = new Date();
        const timeDiff = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60); // diferença em horas

        // Se o jogo foi há menos de 3 horas e mais de -1 hora, pode estar ao vivo
        if (timeDiff >= -1 && timeDiff <= 3) {
          const date = new Date(todayMatch.match_date);
          const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const formattedTime = date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
          });

          // Buscar canais de transmissão
          const broadcasts = await this.matchBroadcastRepository
            .createQueryBuilder('broadcast')
            .leftJoinAndSelect('broadcast.channel', 'channel')
            .where('broadcast.match_id = :matchId', { matchId: todayMatch.id })
            .andWhere('channel.active = :active', { active: true })
            .getMany();

          let transmissionText = 'A definir';
          let streamingLinks = '';

                     // Processar canais da tabela match_broadcasts
           if (broadcasts && broadcasts.length > 0) {
             const channelsList = broadcasts.map(broadcast => {
               const channel = broadcast.channel;
               if (channel.channel_link) {
                 return `${channel.name} (${channel.channel_link})`;
               }
               return channel.name;
             }).join(', ');
             transmissionText = channelsList;
           } else if (todayMatch.broadcast_channels) {
             // Processar broadcast_channels (pode ser array ou string)
             if (Array.isArray(todayMatch.broadcast_channels) && todayMatch.broadcast_channels.length > 0) {
               transmissionText = todayMatch.broadcast_channels.join(', ');
             } else if (typeof todayMatch.broadcast_channels === 'string' && todayMatch.broadcast_channels.trim()) {
               transmissionText = todayMatch.broadcast_channels.trim();
             }
           }



          let response = `🔴 POSSIVELMENTE AO VIVO - ${team.name.toUpperCase()}
⚽ *${todayMatch.home_team.name} x ${todayMatch.away_team.name}*
📅 Data: ${formattedDate}
⏰ Início: ${formattedTime}

🏆 Competição: ${todayMatch.competition.name}
📅 ${todayMatch.round?.name || 'A definir'}
🏟️ Estádio: ${todayMatch.stadium?.name || 'A definir'}

📺 Transmissão: ${transmissionText}`;

          if (streamingLinks) {
            response += `\n🔗 ${streamingLinks}`;
          }

          response += `\n\n🔴 JOGO POSSIVELMENTE EM ANDAMENTO!
⚽ Acompanhe o placar ao vivo!`;

          return response;
        }
      }

      // Se não há jogo ao vivo nem hoje, buscar próximo jogo agendado
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
        return `😔 Não encontrei jogos futuros agendados para o ${team.name}.

🔍 Verifique novamente em breve ou pergunte sobre outro time!`;
      }

      // Usar formatação simples de data (dados já estão no horário correto)
      const date = new Date(nextMatch.match_date);
      const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const formattedTime = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      // Buscar canais de transmissão da nova tabela match_broadcasts
      const broadcasts = await this.matchBroadcastRepository
        .createQueryBuilder('broadcast')
        .leftJoinAndSelect('broadcast.channel', 'channel')
        .where('broadcast.match_id = :matchId', { matchId: nextMatch.id })
        .andWhere('channel.active = :active', { active: true })
        .getMany();

      // Determinar transmissão
      let transmissionText = 'A definir';
      let streamingLinks = '';
      let allChannels: string[] = [];

      // Processar canais da tabela match_broadcasts
      if (broadcasts && broadcasts.length > 0) {
        const channelsList = broadcasts.map(broadcast => {
          const channel = broadcast.channel;
          if (channel.channel_link) {
            return `${channel.name} (${channel.channel_link})`;
          }
          return channel.name;
        });
        allChannels = [...channelsList];
      }

      // Processar broadcast_channels adicionais (pode ser array, string ou JSON)
      if (nextMatch.broadcast_channels) {
        let processedChannels = nextMatch.broadcast_channels;
        
        // Se for string, tentar fazer parse JSON primeiro (para compatibilidade com dados antigos)
        if (typeof nextMatch.broadcast_channels === 'string') {
          try {
            // Tentar fazer parse JSON se a string começar com " ou [
            if (nextMatch.broadcast_channels.startsWith('"') || nextMatch.broadcast_channels.startsWith('[')) {
              processedChannels = JSON.parse(nextMatch.broadcast_channels);
            }
          } catch (e) {
            // Se falhar o parse, usar a string original
            processedChannels = nextMatch.broadcast_channels;
          }
        }
        
        // Processar os canais baseado no tipo final
        if (Array.isArray(processedChannels) && processedChannels.length > 0) {
          allChannels = [...allChannels, ...processedChannels];
        } else if (typeof processedChannels === 'string' && processedChannels.trim()) {
          allChannels = [...allChannels, processedChannels.trim()];
        }
      }

      // Definir texto de transmissão
      if (allChannels.length > 0) {
        transmissionText = allChannels.join(', ');
      }



      let response = `PRÓXIMO JOGO DO ${team.name.toUpperCase()}
⚽ *${nextMatch.home_team.name} x ${nextMatch.away_team.name}*
📅 Data: ${formattedDate}
⏰ Hora: ${formattedTime}

🏆 Competição: ${nextMatch.competition.name}
📅 ${nextMatch.round?.name || 'A definir'}
🏟️ Estádio: ${nextMatch.stadium?.name || 'A definir'}

📺 Transmissão: ${transmissionText}`;

      if (streamingLinks) {
        response += `\n🔗 ${streamingLinks}`;
      }

      response += `\n\nBora torcer! 🔥⚽`;

      // Adicionar URL curta do jogo
      return await this.addMatchShortLinks(response, nextMatch);

    } catch (error) {
      console.error('Erro ao buscar próximo jogo:', error);
      return '❌ Erro ao buscar informações do jogo. Tente novamente.';
    }
  }

  private async getTeamInfo(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      const fullNameDisplay = team.full_name || team.name || 'A definir';

      return `ℹ️ INFORMAÇÕES DO ${team.name.toUpperCase()} ℹ️

📛 Nome completo: ${fullNameDisplay}
🏷️ Sigla: ${team.short_name || 'A definir'}
🏙️ Cidade: ${team.city || 'A definir'}
🗺️ Estado: ${team.state || 'A definir'}
🌍 País: ${team.country || 'A definir'}
📅 Fundação: ${team.founded_year || 'A definir'}

🌐 *Página do time:* https://futepedia.kmiza27.com/time/${team.id}

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
        return `📊 TABELA - ${competition.name.toUpperCase()} 📊

😔 Ainda não há dados de classificação disponíveis para esta competição.

⚽ Quer saber sobre jogos ou outras informações?`;
      }

      let response = `📊 TABELA - ${competition.name.toUpperCase()} 📊\n\n`;

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
      console.log('🔍 Buscando jogos de hoje...');

      // Usar query SQL direta com timezone do Brasil para maior precisão
      // Converter a data atual para o timezone de São Paulo e buscar jogos desse dia
      const todayMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where(`DATE(match.match_date AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')`)
        .orderBy('match.match_date', 'ASC')
        .getMany();

      console.log(`⚽ Encontrados ${todayMatches.length} jogos para hoje`);

      if (todayMatches.length === 0) {
        // Buscar próximos jogos para mostrar como alternativa
        const nextMatches = await this.matchesRepository
          .createQueryBuilder('match')
          .leftJoinAndSelect('match.competition', 'competition')
          .leftJoinAndSelect('match.home_team', 'homeTeam')
          .leftJoinAndSelect('match.away_team', 'awayTeam')
          .where(`match.match_date > NOW() AT TIME ZONE 'America/Sao_Paulo'`)
          .andWhere('match.status = :status', { status: 'scheduled' })
          .orderBy('match.match_date', 'ASC')
          .limit(3)
          .getMany();

        let response = `📅 JOGOS DE HOJE 📅\n\n😔 Não há jogos agendados para hoje.`;
        
        if (nextMatches.length > 0) {
          response += `\n\n📅 PRÓXIMOS JOGOS:\n\n`;
          nextMatches.forEach(match => {
            const matchDate = new Date(match.match_date);
            const date = matchDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const time = matchDate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            });
            response += `📅 ${date} - ${time}\n`;
            response += `🏆 ${match.competition.name}\n`;
            response += `⚽ ${match.home_team.name} vs ${match.away_team.name}\n\n`;
          });
        }
        
        response += `\n⚽ Quer saber sobre o próximo jogo de algum time específico?`;
        return response;
      }

      let response = `📅 JOGOS DE HOJE 📅\n\n`;

      todayMatches.forEach(match => {
        const matchDate = new Date(match.match_date);
        const time = matchDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        
        // Determinar emoji e status baseado no status do jogo
        let statusEmoji = '⏰';
        let statusText = '';
        
        if (match.status === 'live') {
          statusEmoji = '🔴';
          statusText = ` - AO VIVO ${match.home_score ?? 0}x${match.away_score ?? 0}`;
        } else if (match.status === 'finished') {
          statusEmoji = '✅';
          statusText = ` - FINALIZADO ${match.home_score ?? 0}x${match.away_score ?? 0}`;
        } else if (match.status === 'postponed') {
          statusEmoji = '⏸️';
          statusText = ' - ADIADO';
        } else if (match.status === 'cancelled') {
          statusEmoji = '❌';
          statusText = ' - CANCELADO';
        }
        
        response += `${statusEmoji} ${time} - ${match.competition.name}${statusText}\n`;
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
      const now = new Date();
      const startOfTodaySaoPaulo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      // End of next week in Sao Paulo local time (7 days from start of today)
      const endOfNextWeekSaoPaulo = new Date(startOfTodaySaoPaulo.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 full days
      endOfNextWeekSaoPaulo.setHours(23, 59, 59, 999); // Set to end of the day

      const startQueryDate = startOfTodaySaoPaulo;
      const endQueryDate = endOfNextWeekSaoPaulo;

      const weekMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where('match.match_date >= :start', { start: startQueryDate })
        .andWhere('match.match_date <= :end', { end: endQueryDate })
        .andWhere('match.status = :status', { status: 'scheduled' })
        .orderBy('match.match_date', 'ASC')
        .limit(15)
        .getMany();

      if (weekMatches.length === 0) {
        return `📅 JOGOS DA SEMANA 📅

😔 Não há jogos agendados para os próximos 7 dias.

⚽ Quer saber sobre algum time específico?`;
      }

      let response = `📅 JOGOS DA SEMANA 📅\n\n`;

      weekMatches.forEach(match => {
        const date = new Date(match.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        const time = date.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        
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

  private async getTomorrowMatches(): Promise<string> {
    try {
      console.log('🔍 Buscando jogos de amanhã...');

      // Usar query SQL direta com timezone do Brasil para maior precisão
      // Converter a data atual para o timezone de São Paulo e buscar jogos de amanhã
      const tomorrowMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where(`DATE(match.match_date AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 day')`)
        .orderBy('match.match_date', 'ASC')
        .getMany();

      console.log(`⚽ Encontrados ${tomorrowMatches.length} jogos para amanhã`);

      if (tomorrowMatches.length === 0) {
        // Buscar próximos jogos para mostrar como alternativa
        const nextMatches = await this.matchesRepository
          .createQueryBuilder('match')
          .leftJoinAndSelect('match.competition', 'competition')
          .leftJoinAndSelect('match.home_team', 'homeTeam')
          .leftJoinAndSelect('match.away_team', 'awayTeam')
          .where(`match.match_date > (NOW() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 day'`)
          .andWhere('match.status = :status', { status: 'scheduled' })
          .orderBy('match.match_date', 'ASC')
          .limit(3)
          .getMany();

        let response = `📆 JOGOS DE AMANHÃ 📆\n\n😔 Não há jogos agendados para amanhã.`;
        
        if (nextMatches.length > 0) {
          response += `\n\n📅 PRÓXIMOS JOGOS:\n\n`;
          nextMatches.forEach(match => {
            const matchDate = new Date(match.match_date);
            const date = matchDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const time = matchDate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            });
            response += `📅 ${date} - ${time}\n`;
            response += `🏆 ${match.competition.name}\n`;
            response += `⚽ ${match.home_team.name} vs ${match.away_team.name}\n\n`;
          });
        }
        
        response += `\n⚽ Quer saber sobre o próximo jogo de algum time específico?\n\nPara mais informações acesse Kmiza27.com`;
        return response;
      }

      let response = `📆 JOGOS DE AMANHÃ 📆\n\n`;

      tomorrowMatches.forEach(match => {
        const matchDate = new Date(match.match_date);
        const time = matchDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        
        response += `⏰ ${time} - ${match.competition.name}\n`;
        response += `⚽ ${match.home_team.name} vs ${match.away_team.name}\n`;
        response += `🏟️ ${match.stadium?.name || 'A definir'}\n\n`;
      });

      response += `\nPara mais informações acesse Kmiza27.com`;
      return response;

    } catch (error) {
      console.error('Erro ao buscar jogos de amanhã:', error);
      return '❌ Erro ao buscar jogos de amanhã.\n\nPara mais informações acesse Kmiza27.com';
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

      return `🏆 ${competition.name.toUpperCase()} 🏆

📅 Temporada: ${competition.season}
🌍 País/Região: ${competition.country}
📋 Tipo: ${competition.type}
✅ Status: ${competition.is_active ? 'Ativa' : 'Inativa'}

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
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar competições em que o time participa
      const competitionTeams = await this.competitionTeamsRepository
        .createQueryBuilder('ct')
        .leftJoinAndSelect('ct.competition', 'competition')
        .where('ct.team = :teamId', { teamId: team.id })
        .andWhere('competition.is_active = :active', { active: true })
        .getMany();

      if (competitionTeams.length === 0) {
        return `📊 POSIÇÃO DO ${team.name.toUpperCase()} 📊

😔 O time não está participando de competições ativas no momento.`;
      }

      let response = `📊 POSIÇÃO DO ${team.name.toUpperCase()} 📊\n\n`;
      let foundAnyData = false;

      for (const ct of competitionTeams) {
        try {
          // Usar StandingsService para calcular classificação dinâmica
          const standings = await this.standingsService.getCompetitionStandings(ct.competition.id);
          
          // Encontrar a posição do time
          const teamStanding = standings.find(standing => standing.team.id === team.id);
          
          if (teamStanding) {
            foundAnyData = true;
            response += `🏆 ${ct.competition.name}\n`;
            response += `📍 ${teamStanding.position}º lugar - ${teamStanding.points} pontos\n`;
            response += `⚽ J:${teamStanding.played} V:${teamStanding.won} E:${teamStanding.drawn} D:${teamStanding.lost}\n`;
            response += `🥅 GP:${teamStanding.goals_for} GC:${teamStanding.goals_against} SG:${teamStanding.goal_difference}\n\n`;
          } else {
            // Se não encontrou na classificação dinâmica, mostrar dados básicos
            response += `🏆 ${ct.competition.name}\n`;
            response += `📍 Posição a calcular - 0 pontos\n`;
            response += `⚽ Aguardando dados de partidas\n\n`;
          }
        } catch (error) {
          console.error(`Erro ao calcular classificação para ${ct.competition.name}:`, error);
          // Fallback para dados estáticos se houver erro
          response += `🏆 ${ct.competition.name}\n`;
          response += `📍 ${ct.position || 'TBD'}º lugar - ${ct.points} pontos\n`;
          response += `⚽ J:${ct.played} V:${ct.won} E:${ct.drawn} D:${ct.lost}\n`;
          response += `🥅 GP:${ct.goals_for} GC:${ct.goals_against} SG:${ct.goal_difference}\n\n`;
        }
      }

      if (!foundAnyData) {
        response += `😔 Dados de classificação ainda não disponíveis.\n`;
        response += `📈 As posições serão calculadas automaticamente conforme os jogos acontecem.`;
      }

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
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar últimos 3 jogos
      const lastMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .orderBy('match.match_date', 'DESC')
        .limit(3)
        .getMany();

      if (lastMatches.length === 0) {
        return `😔 Não encontrei jogos finalizados para o ${team.name}.`;
      }

      let response = `⚽ ÚLTIMOS JOGOS DO ${team.name.toUpperCase()} ⚽\n\n`;

      lastMatches.forEach((match, index) => {
        const date = new Date(match.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const formattedTime = date.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });

        const isHome = match.home_team.id === team.id;
        const teamScore = isHome ? (match.home_score ?? 0) : (match.away_score ?? 0);
        const opponentScore = isHome ? (match.away_score ?? 0) : (match.home_score ?? 0);
        const opponentName = isHome ? match.away_team.name : match.home_team.name;
        
        const result = teamScore > opponentScore ? '✅ VITÓRIA' : 
                      teamScore < opponentScore ? '❌ DERROTA' : '🟡 EMPATE';

        response += `${index + 1}. ${match.home_team.name} ${match.home_score ?? 0} x ${match.away_score ?? 0} ${match.away_team.name}
📅 ${formattedDate} - ${formattedTime}
🏆 ${match.competition.name}
📍 ${match.round?.name || 'A definir'}
🏟️ ${match.stadium?.name || 'A definir'}
${result}

`;
      });

      return response.trim();

    } catch (error) {
      console.error('Erro ao buscar últimos jogos:', error);
      return '❌ Erro ao buscar últimos jogos.';
    }
  }

  private async getBroadcastInfo(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
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
        return `📺 TRANSMISSÕES DO ${team.name.toUpperCase()} 📺

😔 Não há jogos futuros agendados.`;
      }

      let response = `📺 TRANSMISSÕES DO ${team.name.toUpperCase()} 📺\n\n`;

      for (const match of upcomingMatches) {
        const date = new Date(match.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const time = date.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        
        const isHome = match.home_team.id === team.id;
        const opponent = isHome ? match.away_team.name : match.home_team.name;

        response += `📅 ${formattedDate} - ${time}\n`;
        response += `🆚 ${team.name} vs ${opponent}\n`;
        response += `🏆 ${match.competition.name}\n`;
        
        // Buscar canais de transmissão da nova tabela match_broadcasts
        const broadcasts = await this.matchBroadcastRepository
          .createQueryBuilder('broadcast')
          .leftJoinAndSelect('broadcast.channel', 'channel')
          .where('broadcast.match_id = :matchId', { matchId: match.id })
          .andWhere('channel.active = :active', { active: true })
          .getMany();

        if (broadcasts && broadcasts.length > 0) {
          const channelsList = broadcasts.map(broadcast => {
            const channel = broadcast.channel;
            return channel.channel_link 
              ? `${channel.name} (${channel.channel_link})`
              : channel.name;
          }).join(', ');
          response += `📺 ${channelsList}\n`;
        } else if (match.broadcast_channels) {
          // Processar broadcast_channels (pode ser array ou string)
          if (Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0) {
            response += `📺 ${match.broadcast_channels.join(', ')}\n`;
          } else if (typeof match.broadcast_channels === 'string' && match.broadcast_channels.trim()) {
            response += `📺 ${match.broadcast_channels.trim()}\n`;
          } else {
            response += `📺 Transmissão a confirmar\n`;
          }
        } else {
          response += `📺 Transmissão a confirmar\n`;
        }



        response += `\n`;
      }

      return response;

    } catch (error) {
      console.error('Erro ao buscar informações de transmissão:', error);
      return '❌ Erro ao buscar informações de transmissão.';
    }
  }

  private async getBotName(): Promise<string> {
    try {
      const botNameConfig = await this.botConfigService.getConfig('BOT_NOME');
      if (botNameConfig) {
        return botNameConfig;
      }
    } catch (error) {
      this.logger.error('Erro ao buscar nome do bot no banco de dados. Usando fallback.', error);
    }
    return 'Tudo sobre futebol';
  }

  private async getWelcomeMessage(): Promise<string> {
    try {
      const welcomeMessage = await this.botConfigService.getConfig('welcome_message');
      return welcomeMessage || 'Posso te ajudar com informações sobre futebol. Digite "oi" para ver as opções ou faça uma pergunta diretamente!';
    } catch (error) {
      console.error('Erro ao buscar mensagem de boas-vindas:', error);
      return 'Posso te ajudar com informações sobre futebol. Digite "oi" para ver as opções ou faça uma pergunta diretamente!';
    }
  }

  private async getTextWelcomeMenu(): Promise<string> {
    const welcomeMessage = await this.getWelcomeMessage();
    const botName = await this.getBotName();

    return `🤖 *${botName}*

${welcomeMessage}

⚡ *Ações Rápidas:*
• Digite "jogos hoje" - Jogos de hoje
• Digite "jogos amanhã" - Jogos de amanhã  
• Digite "jogos semana" - Jogos da semana
• Digite "tabela" - Classificação das competições

⚽ *Informações de Partidas:*
• Digite "próximo jogo [time]" - Próximo jogo de um time
• Digite "último jogo [time]" - Últimos jogos de um time
• Digite "transmissão [time]" - Onde passa o jogo

👥 *Times e Jogadores:*
• Digite "info [time]" - Informações do time
• Digite "elenco [time]" - Elenco do time
• Digite "jogador [nome]" - Informações do jogador
• Digite "posição [time]" - Posição na tabela

🏆 *Competições:*
• Digite "artilheiros" - Maiores goleadores
• Digite "canais" - Canais de transmissão

💡 *Exemplos:*
• "próximo jogo Flamengo"
• "tabela brasileirão"
• "jogador Neymar"
• "jogos hoje"

Digite sua pergunta ou comando! ⚽`;
  }

  private async sendWelcomeMenu(phoneNumber: string): Promise<boolean> {
    const welcomeMessage = await this.getWelcomeMessage();
    const botName = await this.getBotName();

    // Buscar configurações do menu do banco de dados
    const menuSections = await this.whatsAppMenuService.getMenuSections();

    const payload = {
      buttonText: 'VER OPÇÕES',
      description: welcomeMessage,
      title: botName, // Título da lista
      footer: 'Selecione uma das opções abaixo',
      sections: menuSections
    };

    return await this.evolutionService.sendListMessage(
      phoneNumber,
      payload.title,
      payload.description,
      payload.buttonText,
      payload.sections
    );
  }

  private async sendCompetitionsMenu(phoneNumber: string): Promise<boolean> {
    try {
      // Buscar competições ativas do banco de dados
      const competitions = await this.competitionsRepository
        .createQueryBuilder('competition')
        .where('competition.is_active = :active', { active: true })
        .orderBy('competition.name', 'ASC')
        .getMany();

      if (competitions.length === 0) {
        await this.evolutionService.sendMessage(
          phoneNumber,
          '❌ Nenhuma competição ativa encontrada no momento.\n\nPara mais informações acesse Kmiza27.com'
        );
        return true;
      }

      // Dividir competições em seções para melhor organização
      const nationalCompetitions = competitions.filter(c => 
        c.name.toLowerCase().includes('brasileiro') || 
        c.name.toLowerCase().includes('brasileirão') ||
        c.name.toLowerCase().includes('copa do brasil') ||
        c.name.toLowerCase().includes('série') ||
        c.name.toLowerCase().includes('serie')
      );

      const internationalCompetitions = competitions.filter(c => 
        c.name.toLowerCase().includes('libertadores') || 
        c.name.toLowerCase().includes('sul-americana') ||
        c.name.toLowerCase().includes('copa américa') ||
        c.name.toLowerCase().includes('mundial')
      );

      const otherCompetitions = competitions.filter(c => 
        !nationalCompetitions.includes(c) && !internationalCompetitions.includes(c)
      );

      const sections: {
        title: string;
        rows: { id: string; title: string; description: string }[];
      }[] = [];

      if (nationalCompetitions.length > 0) {
        sections.push({
          title: '🇧🇷 Competições Nacionais',
          rows: nationalCompetitions.slice(0, 5).map(comp => ({
            id: `COMP_${comp.id}`,
            title: comp.name,
            description: `Ver classificação - ${comp.season}`
          }))
        });
      }

      if (internationalCompetitions.length > 0) {
        sections.push({
          title: '🌎 Competições Internacionais',
          rows: internationalCompetitions.slice(0, 5).map(comp => ({
            id: `COMP_${comp.id}`,
            title: comp.name,
            description: `Ver classificação - ${comp.season}`
          }))
        });
      }

      if (otherCompetitions.length > 0) {
        sections.push({
          title: '🏆 Outras Competições',
          rows: otherCompetitions.slice(0, 5).map(comp => ({
            id: `COMP_${comp.id}`,
            title: comp.name,
            description: `Ver classificação - ${comp.season}`
          }))
        });
      }

      return await this.evolutionService.sendListMessage(
        phoneNumber,
        '📊 Tabelas de Classificação',
        'Selecione a competição para ver a classificação:',
        'Ver Competições',
        sections
      );
    } catch (error) {
      console.error('Erro ao enviar menu de competições:', error);
      return false;
    }
  }

  private async setUserConversationState(phoneNumber: string, state: string): Promise<void> {
    try {
      const user = await this.usersService.findOrCreateUser(phoneNumber);
      const preferences = user.preferences || {};
      preferences.conversationState = state;
      await this.usersService.updateUser(user.id, { preferences });
    } catch (error) {
      console.error('Erro ao definir estado da conversa:', error);
    }
  }

  private async getUserConversationState(phoneNumber: string): Promise<string | null> {
    try {
      const user = await this.usersService.findOrCreateUser(phoneNumber);
      return user.preferences?.conversationState || null;
    } catch (error) {
      console.error('Erro ao obter estado da conversa:', error);
      return null;
    }
  }

  private async clearUserConversationState(phoneNumber: string): Promise<void> {
    try {
      const user = await this.usersService.findOrCreateUser(phoneNumber);
      const preferences = user.preferences || {};
      delete preferences.conversationState;
      await this.usersService.updateUser(user.id, { preferences });
    } catch (error) {
      console.error('Erro ao limpar estado da conversa:', error);
    }
  }

  private isButtonListId(message: string): boolean {
    // Verificar se a mensagem é um ID de botão de lista
    const buttonPrefixes = ['MENU_', 'CMD_', 'COMP_'];
    return buttonPrefixes.some(prefix => message.startsWith(prefix));
  }

  private async processButtonListId(phoneNumber: string, buttonId: string): Promise<string> {
    try {
      console.log(`🔘 Processando botão de lista: ${buttonId}`);

      // Limpar estado anterior da conversa
      await this.clearUserConversationState(phoneNumber);

      switch (buttonId) {
        // Menu de Tabelas de Classificação
        case 'MENU_TABELAS_CLASSIFICACAO':
          await this.sendCompetitionsMenu(phoneNumber);
          return 'Selecione a competição desejada:';

        // Comandos diretos (sem necessidade de entrada adicional)
        case 'CMD_JOGOS_HOJE':
          const todayResponse = await this.getTodayMatches();
          this.scheduleMenuSend(phoneNumber);
          return todayResponse;

        case 'CMD_JOGOS_AMANHA':
          const tomorrowResponse = await this.getTomorrowMatches();
          this.scheduleMenuSend(phoneNumber);
          return tomorrowResponse;

        case 'CMD_JOGOS_SEMANA':
          const weekResponse = await this.getWeekMatches();
          this.scheduleMenuSend(phoneNumber);
          return weekResponse;

        case 'CMD_CANAIS':
          const channelsResponse = await this.footballDataService.getChannelInfo();
          this.scheduleMenuSend(phoneNumber);
          return channelsResponse;

        // Comandos que requerem entrada adicional
        case 'CMD_PROXIMOS_JOGOS':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_next_match');
          return '⚽ Para qual time você gostaria de saber os próximos jogos?\n\nPor favor, digite o nome do time (ex: Flamengo, Palmeiras, Corinthians):';

        case 'CMD_ULTIMO_JOGO':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_last_match');
          return '🏁 Para qual time você gostaria de saber os últimos jogos?\n\nPor favor, digite o nome do time:';

        case 'CMD_TRANSMISSAO':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_broadcast');
          return '📺 Para qual time você gostaria de saber onde passa o jogo?\n\nPor favor, digite o nome do time:';

        case 'CMD_INFO_TIME':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_info');
          return 'ℹ️ Para qual time você gostaria de ver as informações?\n\nPor favor, digite o nome do time:';

        case 'CMD_ELENCO_TIME':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_squad');
          return '👥 Para qual time você gostaria de ver o elenco?\n\nPor favor, digite o nome do time:';

        case 'CMD_INFO_JOGADOR':
          await this.setUserConversationState(phoneNumber, 'waiting_player_for_info');
          return '👤 Para qual jogador você gostaria de ver as informações?\n\nPor favor, digite o nome do jogador:';

        case 'CMD_POSICAO_TIME':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_position');
          return '📍 Para qual time você gostaria de ver a posição na tabela?\n\nPor favor, digite o nome do time:';

        case 'CMD_ESTATISTICAS_TIME':
          await this.setUserConversationState(phoneNumber, 'waiting_team_for_statistics');
          return '📈 Para qual time você gostaria de ver as estatísticas?\n\nPor favor, digite o nome do time:';

        case 'CMD_ESTADIOS':
          await this.setUserConversationState(phoneNumber, 'waiting_stadium_for_info');
          return '🏟️ Para qual estádio você gostaria de ver as informações?\n\nPor favor, digite o nome do estádio:';

        case 'CMD_ARTILHEIROS':
          await this.setUserConversationState(phoneNumber, 'waiting_competition_for_scorers');
          return '🥇 Para qual competição você gostaria de ver os artilheiros?\n\nPor favor, digite o nome da competição (ex: Brasileirão, Libertadores):';

        case 'CMD_INFO_COMPETICOES':
          await this.setUserConversationState(phoneNumber, 'waiting_competition_for_info');
          return '🏆 Para qual competição você gostaria de ver as informações?\n\nPor favor, digite o nome da competição:';

        default:
          // Verificar se é um ID de competição (COMP_X)
          if (buttonId.startsWith('COMP_')) {
            const competitionId = parseInt(buttonId.replace('COMP_', ''));
            return await this.getCompetitionTableById(competitionId);
          }

          return '❌ Opção não reconhecida. Tente novamente ou digite "menu" para ver as opções.';
      }
    } catch (error) {
      console.error('Erro ao processar botão de lista:', error);
      return '❌ Erro ao processar sua seleção. Tente novamente.';
    }
  }

  private async processConversationState(phoneNumber: string, message: string, state: string): Promise<string> {
    try {
      console.log(`💬 Processando estado da conversa: ${state} com mensagem: ${message}`);

      // Limpar estado da conversa após processar
      await this.clearUserConversationState(phoneNumber);

      let response: string;

      switch (state) {
        case 'waiting_team_for_next_match':
          response = await this.findNextMatch(message);
          break;

        case 'waiting_team_for_current_match':
          response = await this.getCurrentMatch(message);
          break;

        case 'waiting_team_for_last_match':
          response = await this.getLastMatch(message);
          break;

        case 'waiting_team_for_broadcast':
          response = await this.getBroadcastInfo(message);
          break;

        case 'waiting_team_for_info':
          response = await this.getTeamInfo(message);
          break;

        case 'waiting_team_for_squad':
          response = await this.getTeamSquad(message);
          break;

        case 'waiting_player_for_info':
          response = await this.getPlayerInfo(message);
          break;

        case 'waiting_team_for_position':
          response = await this.getTeamPosition(message);
          break;

        case 'waiting_team_for_statistics':
          response = await this.footballDataService.getTeamStatistics(message);
          break;

        case 'waiting_stadium_for_info':
          response = await this.getStadiumInfo(message);
          break;

        case 'waiting_competition_for_scorers':
          response = await this.getTopScorers(message);
          break;

        case 'waiting_competition_for_info':
          response = await this.getCompetitionInfo(message);
          break;

        default:
          response = '❌ Estado da conversa não reconhecido. Tente novamente.';
      }

      // Para estados de conversa no WhatsApp, também enviar o menu após a resposta
      console.log(`📋 Agendando envio do menu para estado de conversa: ${phoneNumber}`);
      this.scheduleMenuSend(phoneNumber);

      return response;
    } catch (error) {
      console.error('Erro ao processar estado da conversa:', error);
      return '❌ Erro ao processar sua resposta. Tente novamente.';
    }
  }

  private async getCompetitionTableById(competitionId: number): Promise<string> {
    try {
      const competition = await this.competitionsRepository.findOne({
        where: { id: competitionId }
      });

      if (!competition) {
        return '❌ Competição não encontrada.\n\nPara mais informações acesse Kmiza27.com';
      }

      // Usar o método existente getCompetitionTable com o nome da competição
      return await this.getCompetitionTable(competition.name);
    } catch (error) {
      console.error('Erro ao buscar tabela da competição por ID:', error);
      return '❌ Erro ao buscar tabela da competição.\n\nPara mais informações acesse Kmiza27.com';
    }
  }

  private async getStadiumInfo(stadiumName: string): Promise<string> {
    try {
      // Precisamos injetar o repository do Stadium - por ora, vou usar uma implementação básica
      // TODO: Adicionar @InjectRepository(Stadium) no constructor e usar o repository correto
      
      return `🏟️ INFORMAÇÕES DE ESTÁDIOS\n\n📍 Busca por: "${stadiumName}"\n\n⚽ Funcionalidade de estádios em desenvolvimento.\n\nPara mais informações sobre estádios e jogos, acesse Kmiza27.com`;
    } catch (error) {
      console.error('Erro ao buscar informações do estádio:', error);
      return '❌ Erro ao buscar informações do estádio.\n\nPara mais informações acesse Kmiza27.com';
    }
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
   * Agendar envio do menu principal com delay
   */
  private scheduleMenuSend(phoneNumber: string): void {
    console.log(`📋 Agendando envio do menu para: ${phoneNumber}`);
    setTimeout(async () => {
      try {
        await this.sendWelcomeMenu(phoneNumber);
        console.log(`✅ Menu enviado com sucesso para ${phoneNumber}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar menu para ${phoneNumber}:`, error);
      }
    }, 1500); // Aguardar 1.5 segundos antes de enviar o menu
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
   * Debug da análise de mensagem
   */
  async debugMessageAnalysis(message: string) {
    try {
      console.log(`🐛 DEBUG: Analisando mensagem "${message}"`);
      
      const analysis = await this.openAIService.analyzeMessage(message);
      
      return {
        message,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message,
        error: error.message,
        timestamp: new Date().toISOString()
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

  private async getCurrentMatch(teamName: string): Promise<string> {
    try {
      if (!teamName) {
        return '❌ Por favor, especifique o nome do time. Ex: "Jogo atual do Avaí"';
      }

      // Buscar o time no banco
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado. 

🔍 Tente com: Flamengo, Palmeiras, Corinthians, São Paulo, Santos, Botafogo, etc.`;
      }

      // Buscar jogo em andamento
      const currentMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .leftJoinAndSelect('match.round', 'round')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'live' })
        .getOne();

      if (!currentMatch) {
        return `😔 O ${team.name} não está jogando no momento.

⚽ Quer saber sobre o próximo jogo? É só perguntar!`;
      }

      const date = new Date(currentMatch.match_date);
      const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const formattedTime = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      const homeScore = currentMatch.home_score ?? 0;
      const awayScore = currentMatch.away_score ?? 0;

      // Buscar canais de transmissão
      const broadcasts = await this.matchBroadcastRepository
        .createQueryBuilder('broadcast')
        .leftJoinAndSelect('broadcast.channel', 'channel')
        .where('broadcast.match_id = :matchId', { matchId: currentMatch.id })
        .andWhere('channel.active = :active', { active: true })
        .getMany();

      let transmissionText = 'A definir';
      let streamingLinks = '';
      let allChannels: string[] = [];

      // Processar canais da tabela match_broadcasts
      if (broadcasts && broadcasts.length > 0) {
        const channelsList = broadcasts.map(broadcast => {
          const channel = broadcast.channel;
          if (channel.channel_link) {
            return `${channel.name} (${channel.channel_link})`;
          }
          return channel.name;
        });
        allChannels = [...channelsList];
      }

      // Processar broadcast_channels adicionais (pode ser array, string ou JSON)
      if (currentMatch.broadcast_channels) {
        let processedChannels = currentMatch.broadcast_channels;
        
        // Se for string, tentar fazer parse JSON primeiro (para compatibilidade com dados antigos)
        if (typeof currentMatch.broadcast_channels === 'string') {
          try {
            // Tentar fazer parse JSON se a string começar com " ou [
            if (currentMatch.broadcast_channels.startsWith('"') || currentMatch.broadcast_channels.startsWith('[')) {
              processedChannels = JSON.parse(currentMatch.broadcast_channels);
            }
          } catch (e) {
            // Se falhar o parse, usar a string original
            processedChannels = currentMatch.broadcast_channels;
          }
        }
        
        // Processar os canais baseado no tipo final
        if (Array.isArray(processedChannels) && processedChannels.length > 0) {
          allChannels = [...allChannels, ...processedChannels];
        } else if (typeof processedChannels === 'string' && processedChannels.trim()) {
          allChannels = [...allChannels, processedChannels.trim()];
        }
      }

      // Definir texto de transmissão
      if (allChannels.length > 0) {
        transmissionText = allChannels.join(', ');
      }



      let response = `🔴 JOGO AO VIVO - ${team.name.toUpperCase()}
⚽ *${currentMatch.home_team.name} ${homeScore} x ${awayScore} ${currentMatch.away_team.name}*
📅 Data: ${formattedDate}
⏰ Início: ${formattedTime}

🏆 Competição: ${currentMatch.competition.name}
📅 ${currentMatch.round?.name || 'A definir'}
🏟️ Estádio: ${currentMatch.stadium?.name || 'A definir'}

📺 Transmissão: ${transmissionText}`;

      if (streamingLinks) {
        response += `\n🔗 ${streamingLinks}`;
      }

      response += `\n\n🔴 JOGO EM ANDAMENTO!
⚽ Acompanhe o placar ao vivo!`;

      // Adicionar URL curta do jogo
      return await this.addMatchShortLinks(response, currentMatch);

    } catch (error) {
      console.error('Erro ao buscar jogo atual:', error);
      return '❌ Erro ao buscar informações do jogo atual. Tente novamente.';
    }
  }

  /**
   * Método para debug - listar todos os times
   */
  async debugTeams(): Promise<any> {
    try {
      console.log('🔍 DEBUG - Listando todos os times cadastrados');
      
      const teams = await this.teamsRepository
        .createQueryBuilder('team')
        .orderBy('team.name', 'ASC')
        .getMany();
      
      console.log(`📊 Total de times encontrados: ${teams.length}`);
      
      // Procurar especificamente por Avaí
      const avaiTeams = teams.filter(team => 
        team.name.toLowerCase().includes('ava') || 
        team.short_name?.toLowerCase().includes('ava')
      );
      
      console.log(`🔍 Times com "ava" no nome:`, avaiTeams.map(t => ({
        id: t.id,
        name: t.name,
        short_name: t.short_name,
        full_name: t.full_name
      })));
      
      return {
        success: true,
        totalTeams: teams.length,
        avaiTeams: avaiTeams.map(t => ({
          id: t.id,
          name: t.name,
          short_name: t.short_name,
          full_name: t.full_name,
          city: t.city,
          state: t.state
        })),
        allTeams: teams.map(t => ({
          id: t.id,
          name: t.name,
          short_name: t.short_name
        }))
      };
      
    } catch (error) {
      console.error('🔍 DEBUG TEAMS - Erro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Método para debug - jogos de hoje
   */
  async debugMatchesToday(): Promise<any> {
    try {
      console.log('🔍 DEBUG - Verificando jogos de hoje');
      console.log(`🕐 Horário atual do servidor: ${new Date().toISOString()}`);
      console.log(`🌍 Timezone do servidor: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      
      // Usar a mesma lógica do método getTodayMatches
      const todayMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .leftJoinAndSelect('match.stadium', 'stadium')
        .where(`DATE(match.match_date AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')`)
        .orderBy('match.match_date', 'ASC')
        .getMany();
      
      console.log(`⚽ Jogos encontrados para hoje: ${todayMatches.length}`);
      
      // Buscar jogos do Avaí especificamente (qualquer data)
      const avaiMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .where('LOWER(homeTeam.name) LIKE LOWER(:name)', { name: '%ava%' })
        .orWhere('LOWER(awayTeam.name) LIKE LOWER(:name)', { name: '%ava%' })
        .orderBy('match.match_date', 'DESC')
        .limit(10)
        .getMany();
      
      console.log(`🔍 Jogos do Avaí encontrados: ${avaiMatches.length}`);
      
      return {
        success: true,
        serverTime: {
          current: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          saoPauloTime: new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"})
        },
        todayMatches: todayMatches.map(match => ({
          id: match.id,
          date: match.match_date,
          homeTeam: match.home_team.name,
          awayTeam: match.away_team.name,
          competition: match.competition.name,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score
        })),
        avaiMatches: avaiMatches.map(match => ({
          id: match.id,
          date: match.match_date,
          homeTeam: match.home_team.name,
          awayTeam: match.away_team.name,
          competition: match.competition.name,
          status: match.status,
          homeScore: match.home_score,
          awayScore: match.away_score
        }))
      };
      
    } catch (error) {
      console.error('🔍 DEBUG MATCHES TODAY - Erro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async getTeamSquad(teamName: string): Promise<string> {
    this.logger.log(`🔍 Procurando elenco para o time: ${teamName}`);
    const team = await this.teamsRepository
      .createQueryBuilder('team')
      .where('UNACCENT(LOWER(team.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
      .orWhere('UNACCENT(LOWER(team.short_name)) LIKE UNACCENT(LOWER(:name))', { name: `%${teamName}%` })
      .getOne();

    if (!team) {
      this.logger.warn(`Time "${teamName}" não encontrado para listar o elenco.`);
      return `❌ Time "${teamName}" não encontrado. Tente novamente com um nome de time válido.`;
    }

    const players = await this.playerTeamHistoryRepository
      .createQueryBuilder('pth')
      .leftJoinAndSelect('pth.player', 'player')
      .leftJoinAndSelect('pth.team', 'team')
      .where('pth.team_id = :teamId', { teamId: team.id })
      .andWhere('pth.end_date IS NULL') // Jogadores atualmente no time
      .orderBy('player.name', 'ASC')
      .getMany();

    if (!players || players.length === 0) {
      return `Nenhum jogador encontrado para o time *${team.name}* no momento.`;
    }

    let squadList = `⚽ Elenco do *${team.name}* ${(team as any).short_code ? `(${(team as any).short_code})` : ''}:\n\n`;
    players.forEach(p => {
      const position = p.player.position ? ` (${p.player.position})` : '';
      const number = p.jersey_number ? ` #${p.jersey_number}` : '';
      squadList += `• ${p.player.name}${number}${position}\n`;
    });

    return squadList;
  }

  private async getPlayerInfo(playerName: string): Promise<string> {
    this.logger.log(`🔍 Procurando informações do jogador: ${playerName}`);

    const player = await this.playerRepository
      .createQueryBuilder('player')
      .where('UNACCENT(LOWER(player.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${playerName}%` })
      .getOne();

    if (!player) {
      this.logger.warn(`Jogador "${playerName}" não encontrado.`);
      return `❌ Jogador "${playerName}" não encontrado. Tente novamente com o nome completo ou um nome mais comum.`;
    }

    const playerTeamHistory = await this.playerTeamHistoryRepository
      .createQueryBuilder('pth')
      .leftJoinAndSelect('pth.team', 'team')
      .where('pth.player_id = :playerId', { playerId: player.id })
      .andWhere('pth.end_date IS NULL') // História atual
      .getOne();

    let teamInfo = 'N/A';
    let playerNumber = 'A definir';
    if (playerTeamHistory && playerTeamHistory.team) {
      teamInfo = playerTeamHistory.team.name;
      playerNumber = playerTeamHistory.jersey_number ? `#${playerTeamHistory.jersey_number}` : 'A definir';
    }

    const position = player.state === 'active' ? player.position : 'Aposentado/Inativo';
    const dateOfBirth = player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('pt-BR') : 'A definir';

    return `👤 *${player.name}* ${playerNumber}
Time Atual: ${teamInfo}
Posição: ${position}
Nacionalidade: ${player.nationality || 'A definir'}
Data de Nascimento: ${dateOfBirth}
Status: ${player.state === 'active' ? 'Ativo' : 'Inativo/Aposentado'}`;
  }

  private async getTopScorers(competitionName?: string): Promise<string> {
    try {
      console.log(`⚽ Procurando artilheiros para: ${competitionName || 'todas as competições'}`);

      // Buscar todas as partidas finalizadas com estatísticas de jogadores
      const matches = await this.matchesRepository.find({
        where: { status: MatchStatus.FINISHED },
        relations: ['home_team', 'away_team', 'competition'],
        select: {
          id: true,
          home_team_player_stats: true,
          away_team_player_stats: true,
          home_team: { id: true, name: true, short_name: true },
          away_team: { id: true, name: true, short_name: true },
          competition: { id: true, name: true, season: true }
        }
      });

      console.log(`📊 Encontradas ${matches.length} partidas finalizadas`);
      
      // Debug: mostrar competições disponíveis
      const availableCompetitions = [...new Set(matches.map(m => m.competition?.name).filter(Boolean))];
      console.log(`🏆 Competições disponíveis: ${availableCompetitions.join(', ')}`);

      // Filtrar por competição se especificada
      let filteredMatches = matches;
      if (competitionName) {
        const normalizedCompName = competitionName.toLowerCase();
        
        // Primeiro, tentar correspondência exata mais específica
        const exactMatches = matches.filter(match => {
          if (!match.competition) return false;
          const compName = match.competition.name.toLowerCase();
          
          // Prioridade para correspondências mais específicas
          // Verificar se a competição solicitada é Série B (vem como 'brasileiro-serie-b' do openai.service)
          if (normalizedCompName.includes('série b') || normalizedCompName.includes('serie b') || normalizedCompName === 'brasileiro-serie-b') {
            return compName.includes('série b') || compName.includes('serie b') || 
                   compName.includes('brasileiro série b') || compName.includes('brasileiro serie b');
          }
          
          // Verificar se a competição solicitada é Série A (incluindo 'brasileirao' genérico)
          if (normalizedCompName.includes('série a') || normalizedCompName.includes('serie a') || normalizedCompName === 'brasileirao') {
            return (compName.includes('série a') || compName.includes('serie a') || 
                   compName.includes('brasileiro série a') || compName.includes('brasileiro serie a') ||
                   (compName.includes('brasileir') && !compName.includes('série b') && !compName.includes('serie b'))) && 
                   !(compName.includes('série b') || compName.includes('serie b'));
          }
          
          return false;
        });
        
        // Se encontrou correspondência específica, usar ela
        if (exactMatches.length > 0) {
          filteredMatches = exactMatches;
          const foundComps = [...new Set(exactMatches.map(m => m.competition?.name).filter(Boolean))];
          console.log(`🎯 Correspondência específica: ${exactMatches.length} partidas para "${competitionName}"`);
          console.log(`📋 Competições encontradas: ${foundComps.join(', ')}`);
        } else {
          // Caso contrário, usar filtro genérico
          filteredMatches = matches.filter(match => {
            if (!match.competition) return false;
            const compName = match.competition.name.toLowerCase();
            
            // Busca direta por nome
            if (compName.includes(normalizedCompName)) {
              return true;
            }
            
            // Mapeamentos específicos para melhor correspondência
            const searchMappings = [
              // Série B específica
              { search: ['brasileiro-serie-b'], comp: ['série b', 'serie b', 'brasileiro série b', 'brasileiro serie b'] },
              // Brasileirão (genérico) - incluindo "brasileiro"
              { search: ['brasileir', 'brasileiro'], comp: ['brasileir', 'brasileiro'] },
              // Libertadores
              { search: ['libertador'], comp: ['libertador'] },
              // Copa do Brasil
              { search: ['copa do brasil', 'copa brasil'], comp: ['copa do brasil', 'copa brasil'] },
              // Sul-Americana
              { search: ['sul-americana', 'sulamericana'], comp: ['sul-americana', 'sulamericana'] }
            ];
            
            for (const mapping of searchMappings) {
              const searchMatches = mapping.search.some(term => normalizedCompName.includes(term));
              const compMatches = mapping.comp.some(term => compName.includes(term));
              if (searchMatches && compMatches) {
                return true;
              }
            }
            
            return false;
          });
          const foundCompsGeneric = [...new Set(filteredMatches.map(m => m.competition?.name).filter(Boolean))];
          console.log(`🔍 Filtradas ${filteredMatches.length} partidas para "${competitionName}"`);
          console.log(`📋 Competições encontradas (genérico): ${foundCompsGeneric.join(', ')}`);
        }
      }

      // Mapa para armazenar estatísticas dos jogadores
      const playerStatsMap = new Map<string, any>();

      for (const match of filteredMatches) {
        // Processar estatísticas do time da casa
        if (match.home_team_player_stats && Array.isArray(match.home_team_player_stats)) {
          await this.processPlayerStats(
            match.home_team_player_stats,
            match.home_team,
            match.competition,
            playerStatsMap
          );
        }

        // Processar estatísticas do time visitante
        if (match.away_team_player_stats && Array.isArray(match.away_team_player_stats)) {
          await this.processPlayerStats(
            match.away_team_player_stats,
            match.away_team,
            match.competition,
            playerStatsMap
          );
        }
      }

      // Converter mapa para array e ordenar por gols
      const topScorers = Array.from(playerStatsMap.values())
        .filter(stat => stat.goals > 0)
        .sort((a, b) => {
          if (b.goals !== a.goals) {
            return b.goals - a.goals;
          }
          return b.goals_per_match - a.goals_per_match;
        })
        .slice(0, 10);

      console.log(`🏆 Encontrados ${topScorers.length} artilheiros`);

      if (topScorers.length === 0) {
        return `⚽ ARTILHEIROS ⚽${competitionName ? ` - ${competitionName.toUpperCase()}` : ''}

😔 Ainda não há dados de artilharia disponíveis.`;
      }

      let response = `⚽ ARTILHEIROS ⚽`;
      if (competitionName) {
        response += ` - ${competitionName.toUpperCase()}`;
      }
      response += `\n\n`;

      topScorers.forEach((scorer, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
        response += `${emoji} ${scorer.player.name} (${scorer.team.short_name || scorer.team.name}) - ${scorer.goals} gols\n`;
      });

      return response;

    } catch (error) {
      console.error('❌ Erro ao buscar artilheiros:', error);
      return '❌ Erro ao buscar artilheiros.';
    }
  }

  private async processPlayerStats(
    playerStats: any[],
    team: any,
    competition: any,
    playerStatsMap: Map<string, any>
  ): Promise<void> {
    for (const stat of playerStats) {
      if (stat.goals && stat.goals > 0) {
        const key = `${stat.player_id}`;
        
        // Buscar dados do jogador se ainda não temos
        let playerData: Player | null = null;
        try {
          playerData = await this.playerRepository.findOne({
            where: { id: stat.player_id },
            select: ['id', 'name', 'position', 'image_url']
          });
        } catch (error) {
          console.error(`Erro ao buscar jogador ${stat.player_id}:`, error);
          continue;
        }

        if (playerData) {
          if (playerStatsMap.has(key)) {
            // Atualizar estatísticas existentes
            const existing = playerStatsMap.get(key);
            existing.goals += stat.goals;
            existing.matches_played += 1;
            existing.goals_per_match = existing.goals / existing.matches_played;
          } else {
            // Criar nova entrada
            playerStatsMap.set(key, {
              player: playerData,
              team: team,
              goals: stat.goals,
              matches_played: 1,
              goals_per_match: stat.goals,
              competition: competition
            });
          }
        }
      }
    }
  }

  /**
   * Verificar se é a primeira interação do usuário (criado há menos de 2 minutos)
   */
  private isFirstInteraction(user: any): boolean {
    if (!user || !user.created_at) return false;
    
    const now = new Date();
    const userCreated = new Date(user.created_at);
    const diffMinutes = (now.getTime() - userCreated.getTime()) / (1000 * 60);
    
    return diffMinutes <= 2; // Considera primeira interação se criado há menos de 2 minutos
  }

  /**
   * Verificar se a mensagem é uma saudação explícita
   */
  private isExplicitGreeting(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    const greetings = [
      'oi', 'olá', 'ola', 'oie', 'opa',
      'bom dia', 'boa tarde', 'boa noite',
      'e aí', 'e ai', 'eai', 'salve', 'fala',
      'hello', 'hi', 'hey', 'hola',
      'tchau', 'valeu', 'obrigado', 'obrigada',
      'menu', 'inicio', 'começar', 'comecar', 'start'
    ];
    
    return greetings.some(greeting => 
      lowerMessage === greeting || 
      lowerMessage.startsWith(greeting + ' ') ||
      lowerMessage.endsWith(' ' + greeting)
    );
  }

  /**
   * Marcar que já enviou mensagem de boas-vindas para usuário do site
   */
  private async markWelcomeSent(phoneNumber: string): Promise<void> {
    try {
      const user = await this.usersService.findOrCreateUser(phoneNumber);
      const preferences = user.preferences || {};
      preferences.welcomeSent = true;
      preferences.welcomeSentAt = new Date().toISOString();
      await this.usersService.updateUser(user.id, { preferences });
    } catch (error) {
      console.error('Erro ao marcar mensagem de boas-vindas enviada:', error);
    }
  }

  /**
   * Verificar se já enviou mensagem de boas-vindas para usuário do site
   */
  private async hasWelcomeBeenSent(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.usersService.findOrCreateUser(phoneNumber);
      return user.preferences?.welcomeSent === true;
    } catch (error) {
      console.error('Erro ao verificar se mensagem de boas-vindas foi enviada:', error);
      return false;
    }
  }
} 