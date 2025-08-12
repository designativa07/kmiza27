import { Module } from '@nestjs/common';
import { PlayerDevelopmentService } from './player-development.service';

@Module({
  providers: [PlayerDevelopmentService],
  exports: [PlayerDevelopmentService],
})
export class PlayerDevelopmentModule {}
