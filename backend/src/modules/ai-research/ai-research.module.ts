import { Module } from '@nestjs/common';
import { AIResearchService } from './ai-research.service';
import { AIResearchController } from './ai-research.controller';
import { QueryAdapterService } from './query-adapter.service';
import { AuthModule } from '../auth/auth.module';
import { MatchesModule } from '../matches/matches.module';
import { OpenAIModule } from '../../chatbot/openai.module';

@Module({
  imports: [AuthModule, MatchesModule, OpenAIModule],
  controllers: [AIResearchController],
  providers: [AIResearchService, QueryAdapterService],
  exports: [AIResearchService, QueryAdapterService],
})
export class AIResearchModule {}
