import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { Competition, CompetitionTeam } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Competition, CompetitionTeam])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService]
})
export class CompetitionsModule {} 