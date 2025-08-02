import { Module } from '@nestjs/common';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { MachineTeamsModule } from '../machine-teams/machine-teams.module';

@Module({
  imports: [MachineTeamsModule], // Importar para usar MachineTeamsService
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService], // Exportar para outros módulos usarem
})
export class SeasonsModule {}