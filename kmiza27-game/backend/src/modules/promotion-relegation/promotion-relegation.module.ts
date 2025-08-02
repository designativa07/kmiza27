import { Module } from '@nestjs/common';
import { PromotionRelegationController } from './promotion-relegation.controller';
import { PromotionRelegationService } from './promotion-relegation.service';
import { SeasonsModule } from '../seasons/seasons.module';

@Module({
  imports: [SeasonsModule], // Importar para usar SeasonsService
  controllers: [PromotionRelegationController],
  providers: [PromotionRelegationService],
  exports: [PromotionRelegationService], // Exportar para outros módulos usarem
})
export class PromotionRelegationModule {}