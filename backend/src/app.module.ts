import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
  SystemSettings,
  Channel,
  MatchBroadcast
} from './entities';
import { BotConfig } from './entities/bot-config.entity';

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
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'h4xd66.easypanel.host',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '8F1DC9A7F9CE32C4D32E88A1C5FF7',
      database: process.env.DB_DATABASE || 'kmiza27',
      entities: [
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
        SystemSettings,
        BotConfig,
        Channel,
        MatchBroadcast
      ],
      synchronize: false,
      logging: false,
      ssl: false,
      retryAttempts: 3,
      retryDelay: 3000,
      connectTimeoutMS: 20000,
      extra: {
        connectionTimeoutMillis: 20000,
      }
    }),
    ChatbotModule,
    TeamsModule,
    MatchesModule,
    UsersModule,
    CompetitionsModule,
    ChannelsModule,
    NotificationsModule,
    UploadModule,
    StandingsModule,
    WhatsAppModule,
    BotConfigModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
