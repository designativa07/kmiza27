import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { OpenAIService } from './openai.service';
import { EvolutionService } from './evolution.service';
import { FootballDataService } from './football-data.service';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { CompetitionTeam } from '../entities/competition-team.entity';
import { Stadium } from '../entities/stadium.entity';
import { Round } from '../entities/round.entity';
import { Goal } from '../entities/goal.entity';
import { Channel } from '../entities/channel.entity';
import { MatchBroadcast } from '../entities/match-broadcast.entity';
import { Player } from '../entities/player.entity';
import { PlayerTeamHistory } from '../entities/player-team-history.entity';
import { UsersModule } from '../modules/users/users.module';
import { StandingsService } from '../modules/standings/standings.service';
import { BotConfigModule } from '../modules/bot-config/bot-config.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { WhatsAppMenuModule } from '../modules/whatsapp-menu/whatsapp-menu.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      Match,
      Competition,
      CompetitionTeam,
      Stadium,
      Round,
      Goal,
      Channel,
      MatchBroadcast,
      Player,
      PlayerTeamHistory,
    ]),
    UsersModule,
    BotConfigModule,
    WhatsAppMenuModule,
    TeamsModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    OpenAIService,
    EvolutionService,
    FootballDataService,
    StandingsService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {} 