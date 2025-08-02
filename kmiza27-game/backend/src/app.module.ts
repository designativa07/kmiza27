import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { SupabaseService } from './database/supabase.service';

// ===== MÓDULOS REFORMULADOS (SISTEMA ELIFOOT) =====
import { GameTeamsReformedModule } from './modules/game-teams/game-teams-reformed.module';
import { MachineTeamsModule } from './modules/machine-teams/machine-teams.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { PromotionRelegationModule } from './modules/promotion-relegation/promotion-relegation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Sistema reformulado estilo Elifoot
    GameTeamsReformedModule,
    MachineTeamsModule,
    SeasonsModule,
    PromotionRelegationModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {} 