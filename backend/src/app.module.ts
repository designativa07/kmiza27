import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';

// Import entities
import { 
  Team, 
  Competition, 
  CompetitionTeam, 
  Match, 
  Round, 
  Stadium, 
  Goal, 
  User, 
  ChatbotConversation, 
  Notification, 
  NotificationDelivery,
  SystemSetting,
  Channel,
  MatchBroadcast,
  Player,
  PlayerTeamHistory,
  Card
} from './entities';
import { BotConfig } from './entities/bot-config.entity';
import { WhatsAppMenuConfig } from './entities/whatsapp-menu-config.entity';

// Import modules
import { ChatbotModule } from './chatbot/chatbot.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { UsersModule } from './modules/users/users.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { StandingsModule } from './modules/standings/standings.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { BotConfigModule } from './modules/bot-config/bot-config.module';
import { WhatsAppMenuModule } from './modules/whatsapp-menu/whatsapp-menu.module';
import { AuthModule } from './modules/auth/auth.module';
import { StadiumsModule } from './modules/stadiums/stadiums.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PlayersModule } from './modules/players/players.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CdnTransformInterceptor } from './interceptors/cdn-transform.interceptor';
import { SearchModule } from './modules/search/search.module';
import { RoundsModule } from './modules/rounds/rounds.module';
import { UrlShortenerModule } from './modules/url-shortener/url-shortener.module';
import { TitlesModule } from './modules/titles/titles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    EventEmitterModule.forRoot(),
    ChatbotModule,
    TeamsModule,
    MatchesModule,
    ChannelsModule,
    StandingsModule,
    UsersModule,
    AuthModule,
    SystemSettingsModule,
    NotificationsModule,
    BotConfigModule,
    WhatsAppMenuModule,
    UploadModule,
    WhatsAppModule,
    StadiumsModule,
    PlayersModule,
    CompetitionsModule,
    SearchModule,
    RoundsModule,
    UrlShortenerModule,
    TitlesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CdnTransformInterceptor,
    },
  ],
})
export class AppModule {}
