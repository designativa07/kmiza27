import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { BotConfigModule } from '../modules/bot-config/bot-config.module';
import { TeamsModule } from '../modules/teams/teams.module';

@Module({
  imports: [BotConfigModule, TeamsModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
