import { Module } from '@nestjs/common';
import { GameTeamsReformedController } from './game-teams-reformed.controller';
import { GameTeamsReformedService } from './game-teams-reformed.service';
import { SeasonsModule } from '../seasons/seasons.module';

@Module({
  imports: [SeasonsModule], // Importar para usar SeasonsService
  controllers: [GameTeamsReformedController],
  providers: [GameTeamsReformedService],
  exports: [GameTeamsReformedService], // Exportar para outros módulos usarem
})
export class GameTeamsReformedModule {}