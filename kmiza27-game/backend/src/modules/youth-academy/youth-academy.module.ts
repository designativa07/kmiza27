import { Module } from '@nestjs/common';
import { YouthAcademyController } from './youth-academy.controller';
import { YouthAcademyService } from './youth-academy.service';

@Module({
  controllers: [YouthAcademyController],
  providers: [YouthAcademyService],
})
export class YouthAcademyModule {}


