import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StadiumsService } from './stadiums.service';
import { StadiumsController } from './stadiums.controller';
import { Stadium } from '../../entities/stadium.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stadium])],
  controllers: [StadiumsController],
  providers: [StadiumsService],
  exports: [StadiumsService], // Exporta o serviço para que outros módulos possam usá-lo
})
export class StadiumsModule {} 