import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match, Round, MatchBroadcast, Channel, Competition, Team, Stadium, Player } from '../../entities';
import { SimulationsModule } from '../simulations/simulations.module';
import { StandingsModule } from '../standings/standings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Round, MatchBroadcast, Channel, Competition, Team, Stadium, Player]),
    forwardRef(() => SimulationsModule),
    StandingsModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {} 