import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StadiumsService } from './stadiums.service';
import { StadiumsController } from './stadiums.controller';
import { Stadium } from '../../entities/stadium.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stadium]),
    UploadModule,
  ],
  controllers: [StadiumsController],
  providers: [StadiumsService],
  exports: [StadiumsService], // Exporta o serviço para que outros módulos possam usá-lo
})
export class StadiumsModule {} 