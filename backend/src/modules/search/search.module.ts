import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { Stadium } from '../../entities/stadium.entity';
import { Competition } from '../../entities/competition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Player, Stadium, Competition]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {} 