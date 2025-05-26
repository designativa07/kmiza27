import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { WhatsAppService } from './whatsapp.service';

export interface MatchEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  status: 'scheduled' | 'live' | 'finished';
  score?: string;
  minute?: number;
  events?: Array<{
    type: 'goal' | 'card' | 'substitution';
    player: string;
    team: string;
    minute: number;
  }>;
  startTime: Date;
  venue: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private activeMatches = new Map<string, MatchEvent>();
  private notificationsSent = new Set<string>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private whatsAppService: WhatsAppService,
  ) {}

  // Método para simular notificação de gol
  async simulateGoal(matchId: string, player: string, team: string, minute: number) {
    this.logger.log(`⚽ Simulando gol: ${player} (${team}) - ${minute}'`);
    
    const message = `⚽ **GOOOOL!**\n\n` +
      `🎯 ${player} (${team})\n` +
      `⏱️ ${minute}' minuto\n` +
      `🔥 Que golaço!\n\n` +
      `Acompanhe o jogo ao vivo! 📺`;

    // Buscar usuários interessados no time
    const users = await this.getUsersByTeam(team);
    
    for (const user of users) {
      await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message,
        title: '⚽ GOOOOL!'
      });
    }

    this.logger.log(`📢 Notificação de gol enviada para ${users.length} usuários`);
  }

  // Método para notificação de início de jogo
  async notifyMatchStart(homeTeam: string, awayTeam: string, competition: string) {
    this.logger.log(`🚀 Notificando início: ${homeTeam} vs ${awayTeam}`);
    
    const message = `🔴 **JOGO COMEÇOU!**\n\n` +
      `⚽ ${homeTeam} vs ${awayTeam}\n` +
      `🏆 ${competition}\n` +
      `🏟️ Maracanã\n\n` +
      `Acompanhe ao vivo! 📺`;

    const users = await this.getUsersInterestedInMatch(homeTeam, awayTeam);
    
    for (const user of users) {
      await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message,
        title: '🔴 JOGO COMEÇOU!'
      });
    }

    this.logger.log(`📢 Notificação de início enviada para ${users.length} usuários`);
  }

  // Método para notificação de final de jogo
  async notifyMatchEnd(homeTeam: string, awayTeam: string, score: string, competition: string) {
    this.logger.log(`🏁 Notificando final: ${homeTeam} ${score} ${awayTeam}`);
    
    const message = `🏁 **FINAL DO JOGO**\n\n` +
      `⚽ ${homeTeam} vs ${awayTeam}\n` +
      `📊 Placar Final: ${score}\n` +
      `🏆 ${competition}\n\n` +
      `Obrigado por acompanhar! 👏`;

    const users = await this.getUsersInterestedInMatch(homeTeam, awayTeam);
    
    for (const user of users) {
      await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message,
        title: '🏁 FINAL DO JOGO'
      });
    }

    this.logger.log(`📢 Notificação de final enviada para ${users.length} usuários`);
  }

  // Método para lembrete de jogo
  async sendMatchReminder(homeTeam: string, awayTeam: string, timeUntil: string, competition: string) {
    this.logger.log(`⏰ Enviando lembrete: ${homeTeam} vs ${awayTeam} em ${timeUntil}`);
    
    const message = `⏰ **Lembrete de Jogo**\n\n` +
      `🏆 ${competition}\n` +
      `⚽ ${homeTeam} vs ${awayTeam}\n` +
      `📅 Começa em ${timeUntil}\n` +
      `🏟️ Maracanã\n\n` +
      `Não perca! 🔥`;

    const users = await this.getUsersInterestedInMatch(homeTeam, awayTeam);
    
    for (const user of users) {
      await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message,
        title: '⏰ Lembrete de Jogo'
      });
    }

    this.logger.log(`📢 Lembrete enviado para ${users.length} usuários`);
  }

  private async getUsersByTeam(teamName: string): Promise<User[]> {
    try {
      const users = await this.userRepository.find({
        where: { favorite_team: { name: teamName } },
        relations: ['favorite_team']
      });

      return users.filter(user => user.phone_number);
    } catch (error) {
      this.logger.error('Erro ao buscar usuários por time:', error);
      return [];
    }
  }

  private async getUsersInterestedInMatch(homeTeam: string, awayTeam: string): Promise<User[]> {
    try {
      const users = await this.userRepository.find({
        where: [
          { favorite_team: { name: homeTeam } },
          { favorite_team: { name: awayTeam } }
        ],
        relations: ['favorite_team']
      });

      return users.filter(user => user.phone_number);
    } catch (error) {
      this.logger.error('Erro ao buscar usuários interessados no jogo:', error);
      return [];
    }
  }

  // Método para notificação personalizada
  async sendCustomNotification(teamName: string, title: string, message: string) {
    this.logger.log(`📢 Enviando notificação personalizada para ${teamName}: ${title}`);
    
    const users = await this.getUsersByTeam(teamName);
    
    for (const user of users) {
      await this.whatsAppService.sendMessage({
        to: user.phone_number,
        message,
        title
      });
    }

    this.logger.log(`📢 Notificação personalizada enviada para ${users.length} usuários`);
  }
} 