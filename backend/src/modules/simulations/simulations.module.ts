import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { PowerIndexService } from './power-index.service';
import { MonteCarloService } from './monte-carlo.service';
import { SimulationResult } from '../../entities/simulation-result.entity';
import { Competition } from '../../entities/competition.entity';
import { Team } from '../../entities/team.entity';
import { Match } from '../../entities/match.entity';
import { CompetitionTeam } from '../../entities/competition-team.entity';
import { StandingsModule } from '../standings/standings.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SimulationResult,
      Competition,
      Team,
      Match,
      CompetitionTeam,
    ]),
    StandingsModule,
    forwardRef(() => MatchesModule),
  ],
  controllers: [SimulationsController],
  providers: [
    SimulationsService,
    PowerIndexService,
    MonteCarloService,
  ],
  exports: [
    SimulationsService,
    PowerIndexService,
    MonteCarloService,
  ],
})
export class SimulationsModule {}
