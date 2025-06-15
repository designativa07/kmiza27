import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandingsService } from './standings.service';
import { StandingsController } from './standings.controller';
import { CompetitionsService } from '../competitions/competitions.service';
import { CompetitionTeam, Match, Competition, Team, Goal } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionTeam, Match, Competition, Team, Goal])],
  controllers: [StandingsController],
  providers: [StandingsService, CompetitionsService],
  exports: [StandingsService]
})
export class StandingsModule {} 