import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GameTeamsController } from './modules/game-teams/game-teams.controller';
import { GameTeamsService } from './modules/game-teams/game-teams.service';
import { SupabaseService } from './database/supabase.service';
import { CompetitionsModule } from './modules/competitions/competitions.module';

// ===== MÓDULOS REFORMULADOS =====
import { MachineTeamsModule } from './modules/machine-teams/machine-teams.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { PromotionRelegationModule } from './modules/promotion-relegation/promotion-relegation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Módulos antigos (para compatibilidade)
    CompetitionsModule,
    
    // Módulos reformulados (novas funcionalidades)
    MachineTeamsModule,
    SeasonsModule,
    PromotionRelegationModule,
  ],
  controllers: [AppController, GameTeamsController],
  providers: [GameTeamsService, SupabaseService],
})
export class AppModule {} 