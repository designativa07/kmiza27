import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../../entities/player.entity';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';
import { Goal } from '../../entities/goal.entity';
import { Card } from '../../entities/card.entity';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { Team } from '../../entities/team.entity';
import { Match } from '../../entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      PlayerTeamHistory,
      Goal,
      Card,
      Team, // Necessário para validação de times
      Match, // Necessário para validação de partidas
    ]),
  ],
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService, TypeOrmModule], // Exportar para uso em outros módulos se necessário
})
export class PlayersModule {} 