import { Module } from '@nestjs/common';
import { MatchSimulationService } from './match-simulation.service';

@Module({
  providers: [MatchSimulationService],
  exports: [MatchSimulationService],
})
export class MatchSimulationModule {}
