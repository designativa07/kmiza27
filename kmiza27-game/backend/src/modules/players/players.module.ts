import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService], // Exportar para uso em outros módulos
})
export class PlayersModule {}