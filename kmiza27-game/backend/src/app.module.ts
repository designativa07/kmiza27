import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GameTeamsController } from './modules/game-teams/game-teams.controller';
import { GameTeamsService } from './modules/game-teams/game-teams.service';
import { SupabaseService } from './database/supabase.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, GameTeamsController],
  providers: [GameTeamsService, SupabaseService],
})
export class AppModule {} 