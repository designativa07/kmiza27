import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AmateurController } from './amateur.controller';
import { AmateurService } from './amateur.service';
import { AmateurPermissionsGuard } from './amateur-permissions.guard';
import { Competition, Team, Match, CompetitionTeam, Goal, Player, Stadium, PlayerTeamHistory } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Competition, Team, Match, CompetitionTeam, Goal, Player, Stadium, PlayerTeamHistory]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kmiza27_secret_key_admin',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AmateurController],
  providers: [AmateurService, AmateurPermissionsGuard],
  exports: [AmateurService]
})
export class AmateurModule {} 