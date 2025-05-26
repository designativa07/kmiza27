import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { OpenAIService } from './openai.service';
import { EvolutionService } from './evolution.service';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { Stadium } from '../entities/stadium.entity';
import { Round } from '../entities/round.entity';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      Match,
      Competition,
      Stadium,
      Round,
    ]),
    UsersModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    OpenAIService,
    EvolutionService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {} 