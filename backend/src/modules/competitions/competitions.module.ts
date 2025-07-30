import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { UploadService } from './upload.service';
import { Competition, CompetitionTeam, Goal, Player } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Competition, CompetitionTeam, Goal, Player])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService, UploadService],
  exports: [CompetitionsService, UploadService]
})
export class CompetitionsModule {} 