import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { Round } from '../../entities/round.entity';
import { Competition } from '../../entities/competition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Round, Competition])],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {} 