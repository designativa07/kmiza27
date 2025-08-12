import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { SupabaseService } from './database/supabase.service';

// ===== MÓDULOS REFORMULADOS (SISTEMA ELIFOOT) =====
import { GameTeamsReformedModule } from './modules/game-teams/game-teams-reformed.module';
import { MachineTeamsModule } from './modules/machine-teams/machine-teams.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { PromotionRelegationModule } from './modules/promotion-relegation/promotion-relegation.module';
import { PlayersModule } from './modules/players/players.module';
import { YouthAcademyModule } from './modules/youth-academy/youth-academy.module';
import { FansModule } from './modules/fans/fans.module';
import { TacticsModule } from './modules/tactics/tactics.module';
import { SponsorshipsModule } from './modules/sponsorships/sponsorships.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { NewsModule } from './modules/news/news.module';
import { MatchSimulationModule } from './modules/match-simulation/match-simulation.module';
import { PlayerDevelopmentModule } from './modules/player-development/player-development.module';

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
    PlayersModule,
    // Novos módulos (stubs) para funcionalidades adicionais
    YouthAcademyModule,
    FansModule,
    TacticsModule,
    SponsorshipsModule,
    InvestmentsModule,
    NewsModule,
    // Módulos avançados de simulação e desenvolvimento
    MatchSimulationModule,
    PlayerDevelopmentModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {} 