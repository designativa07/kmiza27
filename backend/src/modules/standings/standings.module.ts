import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandingsService } from './standings.service';
import { StandingsController } from './standings.controller';
import { CompetitionTeam, Match, Competition } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionTeam, Match, Competition])],
  controllers: [StandingsController],
  providers: [StandingsService],
  exports: [StandingsService]
})
export class StandingsModule {} 