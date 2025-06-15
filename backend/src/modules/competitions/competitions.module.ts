import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { UploadService } from './upload.service';
import { Competition, CompetitionTeam, Goal } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Competition, CompetitionTeam, Goal])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService, UploadService],
  exports: [CompetitionsService, UploadService]
})
export class CompetitionsModule {} 