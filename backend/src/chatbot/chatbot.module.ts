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
import { UsersModule } from '../modules/users/users.module';

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
    ]),
    UsersModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    OpenAIService,
    EvolutionService,
    FootballDataService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {} 