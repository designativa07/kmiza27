import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Pool } from '../../entities/pool.entity';
import { PoolMatch } from '../../entities/pool-match.entity';
import { PoolParticipant } from '../../entities/pool-participant.entity';
import { PoolPrediction } from '../../entities/pool-prediction.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { Round } from '../../entities/round.entity';

import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { PoolsScoringService } from './pools-scoring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pool,
      PoolMatch,
      PoolParticipant,
      PoolPrediction,
      User,
      Match,
      Round,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kmiza27_secret_key_admin',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PoolsController],
  providers: [PoolsService, PoolsScoringService],
  exports: [PoolsService, PoolsScoringService],
})
export class PoolsModule {}