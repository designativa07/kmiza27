import { Module } from '@nestjs/common';
import { MachineTeamsController } from './machine-teams.controller';
import { MachineTeamsService } from './machine-teams.service';

@Module({
  controllers: [MachineTeamsController],
  providers: [MachineTeamsService],
  exports: [MachineTeamsService], // Exportar para outros módulos usarem
})
export class MachineTeamsModule {}