import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match, Team, Competition, Round, MatchBroadcast, Channel, Stadium } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Team, Competition, Round, MatchBroadcast, Channel, Stadium])],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService]
})
export class MatchesModule {} 