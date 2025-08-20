import { Module } from '@nestjs/common';
import { MatchSimulationService } from './match-simulation.service';
import { MatchVisualSimulationService } from './match-visual-simulation.service';
import { MatchSimulationController } from './match-simulation.controller';

@Module({
  imports: [],
  controllers: [MatchSimulationController],
  providers: [MatchSimulationService, MatchVisualSimulationService],
  exports: [MatchSimulationService, MatchVisualSimulationService],
})
export class MatchSimulationModule {}
