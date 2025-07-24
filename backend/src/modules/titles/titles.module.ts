import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { Title } from '../../entities/title.entity';
import { Team } from '../../entities/team.entity';
import { UploadCloudService } from '../upload/upload-cloud.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Title, Team]),
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kmiza27_secret_key_admin',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [TitlesController],
  providers: [TitlesService, UploadCloudService, JwtAuthGuard],
  exports: [TitlesService],
})
export class TitlesModule {} 