import { Module } from '@nestjs/common';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { MachineTeamsModule } from '../machine-teams/machine-teams.module';
import { MatchSimulationModule } from '../match-simulation/match-simulation.module';
import { PlayerDevelopmentModule } from '../player-development/player-development.module';

@Module({
  imports: [
    MachineTeamsModule, // Importar para usar MachineTeamsService
    MatchSimulationModule, // Para simulação avançada
    PlayerDevelopmentModule, // Para desenvolvimento dos jogadores
  ],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService], // Exportar para outros módulos usarem
})
export class SeasonsModule {}